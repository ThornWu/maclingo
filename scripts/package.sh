#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist
cd extension
zip -r -FS ../dist/maclingo.zip .
zip -j ../dist/maclingo.zip ../LICENSE
