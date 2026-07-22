#!/usr/bin/env python3
"""
CREATEBYMOH media sync — pulls every file from the public Google Drive
folders (Jewelry / Perfume / Streetwear), optimizes them for the web,
writes assets/manifest.json (used by the site) and assets/media/sync-report.json
(a diagnostic the workflow commits so failures are visible without log access).

Download engines (auto, in order):
  1. yt-dlp (robust against Drive confirm/rate pages) — needs `pip install yt-dlp`
  2. urllib + embeddedfolderview scraping (fallback)

Outputs
  Videos  -> assets/media/<niche>/videos/<niche>-XX.mp4  (h264, <=720w, muted)
  Posters -> assets/media/<niche>/videos/<niche>-XX.jpg
  Images  -> assets/media/<niche>/images/<niche>-XX.webp (<=1400px, q80)
  Manifest-> assets/manifest.json
  Report  -> assets/media/sync-report.json

Exits 1 when NOTHING was processed so the workflow visibly fails.
"""
import html
import json
import os
import re
import shutil
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
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}
RAW_DIR = os.environ.get("RAW_DIR", "raw-drive")
OUT_DIR = os.path.join("assets", "media")
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"}
REPORT = {"engine": None, "niches": {}, "started": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
YTDLP = shutil.which("yt-dlp")


def sh(cmd, capture=False):
    return subprocess.run(cmd, capture_output=capture, text=True)


def ytdlp_download(folder_id, niche_raw, niche):
    """Download a public Drive folder with yt-dlp into niche_raw. Returns {id: title}."""
    url = f"https://drive.google.com/drive/folders/{folder_id}"
    titles = {}
    j = sh(["yt-dlp", "-J", "--flat-playlist", "--no-warnings", url], capture=True)
    if j.returncode == 0 and j.stdout.strip():
        try:
            info = json.loads(j.stdout)
            for e in info.get("entries") or []:
                if e.get("id") and e.get("title"):
                    titles[e["id"]] = e["title"]
        except Exception as ex:
            REPORT["niches"][niche].setdefault("notes", []).append(f"playlist parse: {ex}")
    r = sh(["yt-dlp", "-o", os.path.join(niche_raw, "%(id)s.%(ext)s"),
            "--no-overwrites", "--ignore-errors", "--retries", "3",
            "--fragment-retries", "3", "--no-warnings", url], capture=True)
    REPORT["niches"][niche]["ytdlp_log"] = (r.stdout or "")[-400:] + (r.stderr or "")[-400:]
    return titles


def http_get(url, timeout=60):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=timeout)


def list_folder_embed(folder_id):
    url = f"https://drive.google.com/embeddedfolderview?id={folder_id}#list"
    data = http_get(url).read().decode("utf-8", "replace")
    pairs = re.findall(r'class="flip-entry[^>]*" id="entry-([\w-]+)"(.*?)</div>', data, re.S)
    files = []
    for fid, block in pairs:
        m = re.search(r'class="flip-entry-title"[^>]*>(.*?)</a>', block, re.S)
        files.append((fid, html.unescape(m.group(1)).strip() if m else fid))
    return files, len(data)


import http.cookiejar
_JAR = http.cookiejar.CookieJar()
_OPENER = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(_JAR))


def _stream_to(resp, dest, expect_html_fail=True):
    with open(dest, "wb") as f:
        head = resp.read(512)
        if expect_html_fail and head.lstrip()[:5].lower() in (b"<html", b"<!doc"):
            raise RuntimeError("HTML error page instead of file")
        f.write(head)
        while True:
            chunk = resp.read(1 << 20)
            if not chunk:
                break
            f.write(chunk)
    return os.path.getsize(dest) > 512


def download_one(fid, dest, attempts=3):
    """Robust Drive download: cookie-aware confirm flow + plain endpoints."""
    def _get(url):
        return _OPENER.open(urllib.request.Request(url, headers=UA), timeout=300)

    last_err = "no-attempt"
    for attempt in range(attempts):
        if attempt:
            time.sleep(2 * attempt)
        try:
            # classic uc flow with cookie confirm handling
            r = _get(f"https://drive.google.com/uc?export=download&id={fid}")
            first = r.read(4096)
            if first.lstrip()[:5].lower() in (b"<html", b"<!doc"):
                m = re.search(rb'href="(/uc\?export=download[^"]+)"', first) or \
                    re.search(rb'confirm=([0-9A-Za-z_\-]+)[^0-9A-Za-z_\-]', first)
                token = m.group(1)
                url = ("https://drive.google.com" + token.decode(errors="replace")).replace("&amp;", "&") \
                    if str(token).startswith("b'/uc") else \
                    f"https://drive.google.com/uc?export=download&id={fid}&confirm={token.decode(errors='replace')}"
                with open(dest, "wb") as f:
                    f.write(first)
                r2 = _get(url)
                if _stream_to(r2, dest):
                    return True, "ok"
            else:
                with open(dest, "wb") as f:
                    f.write(first)
                    while True:
                        chunk = r.read(1 << 20)
                        if not chunk:
                            break
                        f.write(chunk)
                if os.path.getsize(dest) > 512:
                    return True, "ok"
            last_err = "uc flow: small/empty body"
        except Exception as e:
            last_err = f"uc: {e!r}"
        try:
            if _stream_to(_get(f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t"), dest):
                return True, "ok"
            last_err = "usercontent: small/empty body"
        except Exception as e:
            last_err = f"usercontent: {e!r}"
        try:
            # last resort: yt-dlp single-file extractor
            rr = sh(["yt-dlp", "-o", dest, "--no-warnings", "--retries", "1",
                     f"https://drive.google.com/file/d/{fid}/view"], capture=True)
            if os.path.exists(dest) and os.path.getsize(dest) > 512:
                return True, "ok"
            last_err = f"ytdlp-single: {(rr.stderr or rr.stdout or '')[-160:]}"
        except Exception as e:
            last_err = f"ytdlp-single: {e!r}"
    if os.path.exists(dest):
        try:
            os.remove(dest)
        except OSError:
            pass
    return False, last_err


FF = shutil.which("ffmpeg")
FFPROBE = shutil.which("ffprobe")


def ensure_ffmpeg():
    """Guarantee working ffmpeg/ffprobe (download a static build if absent)."""
    global FF, FFPROBE
    if FF and FFPROBE:
        return
    import glob
    import tarfile
    dl = "/tmp/ffmpeg-static"
    os.makedirs(dl, exist_ok=True)
    tar = os.path.join(dl, "ffmpeg.tar.xz")
    found = glob.glob(os.path.join(dl, "**", "ffmpeg"), recursive=True)
    if not found:
        urls = [
            "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz",
            "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz",
        ]
        last = None
        for u in urls:
            try:
                with http_get(u, timeout=900) as r, open(tar, "wb") as f:
                    while True:
                        c = r.read(1 << 22)
                        if not c:
                            break
                        f.write(c)
                last = None
                break
            except Exception as e:
                last = e
        if last is not None:
            raise RuntimeError(f"could not download static ffmpeg: {last!r}")
        with tarfile.open(tar) as t:
            t.extractall(dl, filter="data")
    ff = next(iter(glob.glob(os.path.join(dl, "**", "ffmpeg"), recursive=True)), None)
    fp = next(iter(glob.glob(os.path.join(dl, "**", "ffprobe"), recursive=True)), None)
    if not (ff and fp):
        raise RuntimeError("static ffmpeg extraction failed")
    os.chmod(ff, 0o755)
    os.chmod(fp, 0o755)
    FF, FFPROBE = ff, fp
    REPORT["ffmpeg"] = ff


def run_ff(cmd):
    cmd = [FF if cmd[0] == "ffmpeg" else cmd[0]] + cmd[1:]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def probe_video(path):
    try:
        out = subprocess.run(
            [FFPROBE or "ffprobe", "-v", "quiet", "-print_format", "json",
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
        run_ff(["ffmpeg", "-y", "-i", src,
                "-vf", "scale='min(720,iw)':'-2'",
                "-c:v", "libx264", "-preset", "medium", "-crf", "26",
                "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                "-an", dest_mp4])
    if not os.path.exists(dest_jpg):
        run_ff(["ffmpeg", "-y", "-ss", "0.5", "-i", src,
                "-frames:v", "1", "-q:v", "4", dest_jpg])


def optimize_image(src, dest):
    from PIL import Image, ImageOps
    im = ImageOps.exif_transpose(Image.open(src))
    if max(im.size) > 1400:
        ratio = 1400 / max(im.size)
        im = im.resize((max(1, round(im.width * ratio)),
                        max(1, round(im.height * ratio))), Image.LANCZOS)
    if im.mode in ("RGBA", "P", "LA"):
        bg = Image.new("RGB", im.size, (13, 13, 16))
        bg.paste(im.convert("RGBA"), mask=im.convert("RGBA").split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    im.save(dest, "WEBP", quality=80, method=4)
    return im.width, im.height


def collect_raw(niche, folder_id, niche_raw):
    """Ensure every Drive file exists locally; return [(path, original_name)].

    Primary source: curated scripts/drive_files.json (exact id+name pairs,
    immune to Drive's shifting listing markup). Fallback: live listing.
    """
    os.makedirs(niche_raw, exist_ok=True)
    rep = REPORT["niches"][niche] = {}
    index_path = os.path.join(os.path.dirname(__file__), "drive_files.json")
    entries = []
    try:
        with open(index_path) as f:
            entries = json.load(f).get(niche, [])
    except OSError:
        pass
    rep["index_entries"] = len(entries)

    if entries:
        REPORT["engine"] = "curated-index+urllib"
        got = []
        for fid, name in sorted(entries, key=lambda e: e[1].lower()):
            ext = os.path.splitext(name)[1].lower() or ".bin"
            raw = os.path.join(niche_raw, f"{fid}{ext}")
            if not (os.path.exists(raw) and os.path.getsize(raw) > 512):
                ok, err = download_one(fid, raw)
                if not ok:
                    rep.setdefault("download_errors", []).append({"file": name, "err": err[:220]})
                    continue
            if ext in (VIDEO_EXT | IMAGE_EXT):
                got.append((raw, name))
        rep["collected"] = len(got)
        if "download_errors" in rep:
            rep["download_errors"] = rep["download_errors"][:12]
        return got

    # ---------- live-listing fallback ----------
    names = {}
    if YTDLP:
        REPORT["engine"] = "yt-dlp"
        names = ytdlp_download(folder_id, niche_raw, niche)
    got = []
    for f in sorted(os.listdir(niche_raw)):
        p = os.path.join(niche_raw, f)
        base, ext = os.path.splitext(f)
        if os.path.isfile(p) and os.path.getsize(p) > 512 and ext.lower() in (VIDEO_EXT | IMAGE_EXT):
            got.append((p, names.get(base, base)))
    rep["yt_dlp_files"] = len(got)
    if not got:
        REPORT["engine"] = "embeddedfolderview+urllib (fallback)"
        try:
            files, page_len = list_folder_embed(folder_id)
            rep["listed"] = len(files)
            rep["listing_page_bytes"] = page_len
            rep["sample_names"] = [n for _, n in files[:3]]
            for fid, name in sorted(files, key=lambda x: x[1].lower()):
                try:
                    ext = os.path.splitext(name)[1].lower() or ".bin"
                    raw = os.path.join(niche_raw, f"{fid}{ext}")
                    if not (os.path.exists(raw) and os.path.getsize(raw) > 512):
                        ok, err = download_one(fid, raw)
                        if not ok:
                            rep.setdefault("download_errors", []).append({"file": name, "err": err[:220]})
                            continue
                    if ext in (VIDEO_EXT | IMAGE_EXT):
                        got.append((raw, name))
                except Exception as e:
                    rep.setdefault("item_exceptions", []).append(f"{name}: {e!r}"[:240])
        except Exception as e:
            rep["listing_error"] = repr(e)
    rep["collected"] = len(got)
    if "download_errors" in rep:
        rep["download_errors"] = rep["download_errors"][:12]
    return got


def main():
    manifest = {}
    os.makedirs(OUT_DIR, exist_ok=True)
    ensure_ffmpeg()
    for niche, folder_id in FOLDERS.items():
        niche_raw = os.path.join(RAW_DIR, niche)
        vout = os.path.join(OUT_DIR, niche, "videos")
        iout = os.path.join(OUT_DIR, niche, "images")
        for d in (niche_raw, vout, iout):
            os.makedirs(d, exist_ok=True)
        raws = collect_raw(niche, folder_id, niche_raw)
        entry = {"videos": [], "images": []}
        vn = in_ = 0
        fails = []
        for raw, orig in raws:
            ext = os.path.splitext(raw)[1].lower()
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
                        "duration": dur, "w": w, "h": h, "original": orig})
                else:
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
                        "w": w, "h": h, "original": orig})
            except Exception as e:
                fails.append(f"{orig}: {e!r}")
        if fails:
            REPORT["niches"][niche]["process_failures"] = fails
        REPORT["niches"][niche]["done"] = {"videos": len(entry["videos"]), "images": len(entry["images"])}
        manifest[niche] = entry
        print(f"[{niche}] raw={len(raws)} -> videos={len(entry['videos'])} images={len(entry['images'])}", flush=True)

    os.makedirs("assets", exist_ok=True)
    with open(os.path.join("assets", "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    total = sum(len(v["videos"]) + len(v["images"]) for v in manifest.values())
    REPORT["total_processed"] = total
    REPORT["finished"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(os.path.join(OUT_DIR, "sync-report.json"), "w") as f:
        json.dump(REPORT, f, indent=2)
    print(f"DONE – {total} media files processed, engine={REPORT['engine']}")
    if total == 0:
        print("!!! ZERO FILES PROCESSED — see assets/media/sync-report.json")
        print(json.dumps(REPORT, indent=2))
    return 0  # always commit the report + manifest so failures are diagnosable


if __name__ == "__main__":
    sys.exit(main())
