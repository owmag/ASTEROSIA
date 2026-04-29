#!/usr/bin/env bash
# Zip SOURCE for Netlify drag-and-drop with build (`npm install && npm run build`).
# Files land at ARCHIVE ROOT (package.json visible to Netlify) — avoids zipping the
# project folder itself, which would nest everything under store2/ and break builds.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/store2-netlify-build.zip"
cd "$ROOT"
rm -f "$OUT"
zip -rq "$OUT" . \
  -x '*.git/*' \
  -x 'node_modules/*' \
  -x 'dist/*' \
  -x '.vite/*' \
  -x '*.zip' \
  -x '*.DS_Store'
echo "Created: $OUT"
echo "Upload this zip when Netlify should run npm install && npm run build."
