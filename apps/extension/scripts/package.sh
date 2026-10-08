#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/../../.."
mkdir -p dist
cd apps/extension/src
zip -r -FS ../../../dist/maclingo.zip .
zip -j ../../../dist/maclingo.zip ../../../LICENSE
