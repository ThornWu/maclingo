#!/bin/bash
set -euo pipefail
APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIGURATION="${CONFIGURATION:-Debug}"
[[ "$CONFIGURATION" == Debug || "$CONFIGURATION" == Release ]] || { echo "Invalid CONFIGURATION" >&2; exit 1; }
xcodebuild -project "$APP_ROOT/MacLingo.xcodeproj" -scheme MacLingo \
  -configuration "$CONFIGURATION" -derivedDataPath "$APP_ROOT/.build/xcode" \
  ARCHS=arm64 ONLY_ACTIVE_ARCH=YES CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual \
  DEVELOPMENT_TEAM= build
printf '\nBuilt app: %s\n' "$APP_ROOT/.build/xcode/Build/Products/$CONFIGURATION/MacLingo.app"
