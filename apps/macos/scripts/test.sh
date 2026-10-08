#!/bin/bash
set -euo pipefail
APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$APP_ROOT/.build/ModuleCache"
CLANG_MODULE_CACHE_PATH="$APP_ROOT/.build/ModuleCache" \
  swift test --package-path "$APP_ROOT" --scratch-path "$APP_ROOT/.build/tests" \
  --cache-path "$APP_ROOT/.build/cache" --config-path "$APP_ROOT/.build/config" \
  --security-path "$APP_ROOT/.build/security" --disable-sandbox
