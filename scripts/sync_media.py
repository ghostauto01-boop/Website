#!/usr/bin/env python3
"""
CREATEBYMOH media sync — pulls every file from the public Google Drive
folders (Jewelry / Perfume / Streetwear), optimizes them for the web,
and writes assets/manifest.json consumed by the static site.

Videos  -> assets/media/<niche>/videos/<niche>-XX.mp4  (h264, <=720w, no audio)
Posters -> assets/media/<niche>/videos/<niche>-XX.jpg
Images  -> assets/media/<niche>/images/<niche>-XX.webp (<=1400px, q80)
Manifest-> assets/manifest.json

Idempotent: already-processed outputs are skipped, so re-runs are cheap.
Run via .github/workflows/sync-media.yml (GitHub-hosted runner can reach Drive).
"""
import html
import json
import os
import re
import subprocess
import sys
import time
import urllib.request
import urllib.error

FOLDERS = {
    "jewelry":    "1dch6Dhp5HvD9tb3N0uQZyb-6ZTKmN3Ud",
    "perfume":    "11NXv2iHZjgOa8t8iMDpHN-CzFiuKppzy",
    "streetwear": "1gQPmjRRBabsHW_06xBI1noqeLogW-P7N",
}
VIDEO_EXT = {".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".bmp", ".gif"}
RAW_DIR = "raw-drive"
OUT_DIR = os.path.join("assets", "media")
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"}


def http_get(url, timeout=60):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=timeout)


def list_folder(folder_id):
    """Scrape embeddedfolderview for (file_id, name) pairs."""
    url = f"https://drive.google.com/embeddedfolderview?id={folder_id}#list"
    data = http_get(url).read().decode("utf-8", "replace")
    pairs = re.findall(
        r'class="flip-entry[^>]*" id="entry-([\w-]+)"(.*?)</div>',
        data, re.S)
    files = []
    for fid, block in pairs:
        m = re.search(r'class="flip-entry-title"[^>]*>(.*?)</a>', block, re.S)
        name = html.unescape(m.group(1)).strip() if m else fid
        files.append((fid, name))
    if not files:  # fallback regex, name-agnostic
        ids = re.findall(r'/file/d/([\w-]{25,})/view', data)
        files = [(i, i) for i in dict.fromkeys(ids)]
    return files


def download(fid, dest, attempts=3):
    """Download a public Drive file by ID, verifying we didn't get an HTML page."""
    urls = [
        f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t",
        f"https://drive.google.com/uc?export=download&confirm=t&id={fid}",
    ]
    for attempt in range(attempts):
        url = urls[attempt % len(urls)]
        try:
            with http_get(url, timeout=300) as r, open(dest, "wb") as f:
                head = r.read(512)
                if head.lstrip()[:5].lower() in (b"<html", b"<!doc"):
                    raise RuntimeError("received HTML error page")
                f.write(head)
                while True:
                    chunk = r.read(1 << 20)
                    if not chunk:
                        break
                    f.write(chunk)
            if os.path.getsize(dest) > 512:
                return True
        except (urllib.error.URLError, RuntimeError, TimeoutError) as e:
            print(f"  ! attempt {attempt + 1} failed for {fid}: {e}", flush=True)
            time.sleep(2 * (attempt + 1))
    return False


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL,
                   stderr=subprocess.DEVNULL)


def probe_video(path):
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json",
             "-show_entries", "format=duration",
             "-show_entries", "stream=width,height", path],
            capture_output=True, text=True, check=True).stdout
        info = json.loads(out)
        dur = round(float(info.get("format", {}).get("duration", 0)))
        st = next((s for s in info.get("streams", []) if s.get("width")), {})
        return dur, st.get("width", 0), st.get("height", 0)
    except Exception:
        return 0, 0, 0


def transcode(src, dest_mp4, dest_jpg):
    if not os.path.exists(dest_mp4):
        run(["ffmpeg", "-y", "-i", src,
             "-vf", "scale='min(720,iw)':'-2'",
             "-c:v", "libx264", "-preset", "medium", "-crf", "26",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart",
             "-an", dest_mp4])
    if not os.path.exists(dest_jpg):
        run(["ffmpeg", "-y", "-ss", "0.5", "-i", src,
             "-frames:v", "1", "-q:v", "4", dest_jpg])


def optimize_image(src, dest):
    from PIL import Image
    im = Image.open(src)
    try:
        from PIL import ImageOps
        im = ImageOps.exif_transpose(im)
    except Exception:
        pass
    if max(im.size) > 1400:
        ratio = 1400 / max(im.size)
        im = im.resize((max(1, round(im.width * ratio)),
                        max(1, round(im.height * ratio))),
                       Image.LANCZOS)
    if im.mode in ("RGBA", "P", "LA"):
        bg = Image.new("RGB", im.size, (13, 13, 16))
        bg.paste(im.convert("RGBA"), mask=im.convert("RGBA").split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    im.save(dest, "WEBP", quality=80, method=4)
    return im.width, im.height


def main():
    os.makedirs(RAW_DIR, exist_ok=True)
    manifest, failures = {}, []
    for niche, folder_id in FOLDERS.items():
        niche_raw = os.path.join(RAW_DIR, niche)
        vout = os.path.join(OUT_DIR, niche, "videos")
        iout = os.path.join(OUT_DIR, niche, "images")
        for d in (niche_raw, vout, iout):
            os.makedirs(d, exist_ok=True)
        files = sorted(list_folder(folder_id), key=lambda f: f[1].lower())
        print(f"[{niche}] {len(files)} files listed", flush=True)
        entry = {"videos": [], "images": []}
        vn = in_ = 0
        for fid, name in files:
            ext = os.path.splitext(name)[1].lower()
            raw = os.path.join(niche_raw, f"{fid}{ext or '.bin'}")
            if not (os.path.exists(raw) and os.path.getsize(raw) > 512):
                if not download(fid, raw):
                    failures.append((niche, name))
                    continue
            try:
                if ext in VIDEO_EXT:
                    vn += 1
                    base = f"{niche}-{vn:02d}"
                    mp4 = os.path.join(vout, base + ".mp4")
                    jpg = os.path.join(vout, base + ".jpg")
                    transcode(raw, mp4, jpg)
                    dur, w, h = probe_video(mp4)
                    entry["videos"].append({
                        "src": f"assets/media/{niche}/videos/{base}.mp4",
                        "poster": f"assets/media/{niche}/videos/{base}.jpg",
                        "duration": dur, "w": w, "h": h, "original": name})
                elif ext in IMAGE_EXT:
                    in_ += 1
                    base = f"{niche}-{in_:02d}"
                    webp = os.path.join(iout, base + ".webp")
                    if os.path.exists(webp):
                        from PIL import Image
                        with Image.open(webp) as pim:
                            w, h = pim.size
                    else:
                        w, h = optimize_image(raw, webp)
                    entry["images"].append({
                        "src": f"assets/media/{niche}/images/{base}.webp",
                        "w": w, "h": h, "original": name})
                else:
                    print(f"  - skipped (unsupported ext): {name}")
            except Exception as e:  # keep going even if one file is bad
                print(f"  ! processing failed for {name}: {e}", flush=True)
                failures.append((niche, name))
        manifest[niche] = entry
        print(f"[{niche}] videos={len(entry['videos'])} images={len(entry['images'])}",
              flush=True)
    os.makedirs("assets", exist_ok=True)
    with open(os.path.join("assets", "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    if failures:
        print("FAILED FILES:", json.dumps(failures, indent=2))
    total = sum(len(v["videos"]) + len(v["images"]) for v in manifest.values())
    print(f"DONE – {total} media files processed, {len(failures)} failures")
    subprocess.run(["du", "-sh", OUT_DIR])


if __name__ == "__main__":
    sys.exit(main())
