#!/usr/bin/env python3
"""CREATEBYMOH asset minifier — writes .min.css / .min.js next to the sources.

Run after editing assets/css/style.css or assets/js/*.js:
    python scripts/minify.py
(Also runs automatically during the Netlify build — see scripts/build_site.sh.)
"""
import os
import sys

ROOT = os.path.join(os.path.dirname(__file__), "..", "assets")
PAIRS = [
    (os.path.join(ROOT, "css", "style.css"), os.path.join(ROOT, "css", "style.min.css"), "css"),
    (os.path.join(ROOT, "js", "data.js"), os.path.join(ROOT, "js", "data.min.js"), "js"),
    (os.path.join(ROOT, "js", "main.js"), os.path.join(ROOT, "js", "main.min.js"), "js"),
]


def main():
    import rcssmin
    import rjsmin

    ok = True
    for src, dst, kind in PAIRS:
        if not os.path.exists(src):
            print(f"[minify] MISSING {src}")
            ok = False
            continue
        text = open(src, encoding="utf-8").read()
        mini = rcssmin.cssmin(text) if kind == "css" else rjsmin.jsmin(text)
        with open(dst, "w", encoding="utf-8") as f:
            f.write(mini)
        pct = 100 - round(100 * len(mini) / max(1, len(text)))
        print(f"[minify] {os.path.relpath(dst)}  {len(text)//1024}KB → {len(mini)//1024}KB  (-{pct}%)")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
