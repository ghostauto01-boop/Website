#!/usr/bin/env bash
# Netlify build: if the portfolio media is not yet committed to git,
# download + optimize everything from the public Google Drive folders.
# (Raw originals go to /tmp — only the optimized web assets are deployed.)
set -uo pipefail
cd "$(dirname "$0")/.."

if [ -f assets/manifest.json ] && [ -d assets/media ]; then
  echo "[build] assets/media already in repo — nothing to sync."
  exit 0
fi

echo "[build] assets/media missing — syncing from Google Drive..."
export RAW_DIR=/tmp/raw-drive

PY=$(command -v python3 || command -v python)
"$PY" -m pip install --quiet --disable-pip-version-warning -r scripts/requirements.txt \
  || "$PY" -m pip install --quiet --user -r scripts/requirements.txt

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "[build] ffmpeg not found — fetching static build..."
  mkdir -p /tmp/ffx
  curl -fsSL "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz" -o /tmp/ffx/ffmpeg.tar.xz
  tar -xJf /tmp/ffx/ffmpeg.tar.xz -C /tmp/ffx
  FF_DIR=$(dirname "$(find /tmp/ffx -name ffmpeg -type f | head -1)")
  export PATH="$FF_DIR:$PATH"
fi
ffmpeg -version | head -1

"$PY" scripts/sync_media.py
STATUS=$?
echo "[build] media sync finished (status $STATUS)"
ls -la assets/media/*/ 2>/dev/null | head -20 || true
exit 0
