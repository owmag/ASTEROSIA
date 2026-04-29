#!/usr/bin/env bash
# Fresh build + zip `dist/` for Netlify manual deploy (drag-and-drop).
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
rm -f store2-netlify-dist.zip
(cd dist && zip -r ../store2-netlify-dist.zip .)
echo "Created $(pwd)/store2-netlify-dist.zip"
