#!/bin/bash
set -euo pipefail
APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$APP_ROOT/../.." && pwd)"
# Keep the private key and encrypted backup outside this repository.
SIGNING_ROOT="${MACLINGO_SIGNING_ROOT:-$HOME/Library/Application Support/MacLingoSigning}"
SIGNING_KEYCHAIN="${MACLINGO_SIGNING_KEYCHAIN:-$SIGNING_ROOT/thorn.maclingo.keychain-db}"
SIGNING_IDENTITY="${MACLINGO_SIGNING_IDENTITY:-thorn.maclingo}"
[[ -f "$SIGNING_KEYCHAIN" ]] || { echo "Missing signing keychain: $SIGNING_KEYCHAIN" >&2; exit 1; }
CONFIGURATION=Release bash "$APP_ROOT/scripts/build.sh"
APP="$APP_ROOT/.build/xcode/Build/Products/Release/MacLingo.app"
cp "$REPO_ROOT/LICENSE" "$APP/Contents/Resources/LICENSE"
codesign --force --sign "$SIGNING_IDENTITY" --keychain "$SIGNING_KEYCHAIN" --timestamp=none "$APP"
codesign --verify --deep --strict --verbose=2 "$APP"
VERSION=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$APP/Contents/Info.plist")
OUTPUT="$REPO_ROOT/dist/MacLingo-$VERSION-macos-arm64.zip"
mkdir -p "$REPO_ROOT/dist"
[[ ! -e "$OUTPUT" ]] || rm "$OUTPUT"
ditto -c -k --sequesterRsrc --keepParent "$APP" "$OUTPUT"
(cd "$REPO_ROOT/dist" && shasum -a 256 "$(basename "$OUTPUT")" > "$(basename "$OUTPUT").sha256")
printf '\nPackaged: %s\n' "$OUTPUT"
