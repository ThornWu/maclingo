<p align="center"><img src="apps/extension/src/icons/icon128.png" width="88" height="88" alt="MacLingo icon"></p>
<h1 align="center">MacLingo · 麦译</h1>
<p align="center">Quiet, on-device translation for Mac: a Chrome extension and native menu bar app.</p>
<p align="center"><a href="README.md">简体中文</a> · <a href="https://github.com/thornfe/maclingo/releases/latest">Download</a> · <a href="LICENSE">MIT License</a></p>

Select text, right-click **用麦译翻译**, and read the translation in a small card on the current page. On Mac, Control + Shift + M translates selected text in the main page (use the context menu inside iframes). Customize it at chrome://extensions/shortcuts. The shortcut is active only in Chrome. Click outside or press Esc to dismiss it.

MacLingo combines Mac and language; the Chinese name **麦译** (Mài Yì) pairs a phonetic nod to Mac with translation. The current extension interface is in Simplified Chinese.

## Chrome extension features

- Stays on the page, close to the selected text.
- Uses the context menu or keyboard shortcut by default; optional automatic selection translation, no clipboard monitoring.
- Uses Chrome's on-device Translator API, without an API key.
- Supports language selection, copying, original-text disclosure, and dark mode.
- Requests only `contextMenus`, `activeTab`, `scripting`, and `storage`; optional website access is requested only when automatic selection translation is enabled.

## Install the Chrome extension

Requires desktop **Chrome 138+** with a working Translator API.

1. Download and unzip `maclingo.zip` from [Releases](https://github.com/thornfe/maclingo/releases/latest), or download the source.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked**. For the release ZIP, select the extracted directory containing `manifest.json`. For source installs, select `apps/extension/src`.
4. Open an ordinary HTTPS page, select text, and choose **用麦译翻译** from the context menu.

The extension is not yet listed in the Chrome Web Store. Keep the installation directory in place. After updating files, reload the extension and refresh the webpage.

## Native Mac app

The SwiftUI / AppKit client targets Apple Silicon and macOS 15+. It runs in the menu bar; **Control + Option + M** translates selected text in other apps, independently of the extension shortcut. Reading another app's selection requires Accessibility permission. If an app does not expose its selection, copy the text yourself and choose the menu bar's clipboard translation action. Failed selection capture never silently translates an old clipboard value.

Translation uses Apple Translation; first use may ask to download language packs. Language and selection support depend on the system and source app. Images and scanned PDFs are not supported. See the [native client guide](apps/macos/README.md) for setup, building, and acceptance checks. The preview uses a persistent self-signed certificate named `thorn.maclingo` and is not Apple-notarized.

1. Download `MacLingo-0.1.1-macos-arm64.zip` from the [native preview release](https://github.com/thornfe/maclingo/releases/tag/macos-v0.1.1-preview.1), unzip, and move `MacLingo.app` to Applications.
2. If macOS blocks the first launch, open **System Settings → Privacy & Security → Open Anyway** and follow the system prompts. No additional certificate needs to be installed or trusted.
3. Use the app settings to open system settings and grant Accessibility access, then select text and press **Control + Option + M**.

Quit the old development app before upgrading. The new bundle ID is `thorn.maclingo`; this transition requires new permission grants and resets app preferences. Apple manages the language packs.

## Extension usage

First use may require downloading language packs. Click the in-card start button if prompted. Translation runs on the device after the browser has prepared the models. Short selections may require manually choosing the source language. The last manually selected source language is saved locally. If that language pair is unavailable, the current card falls back to automatic detection without overwriting the saved preference.

Click **朗读原文** to hear the original text using a local voice for its source language. Click again to stop. Closing the card or changing languages also stops speech. The read-aloud button appears only when a matching local voice is available; it does not use a remote voice.

## Chrome extension compatibility

macOS and Chrome are the primary target and verification environment. Other desktop systems and Chromium browsers may work if they expose the same API, but are unverified. Safari is not supported.

Browser-internal pages, extension stores, and built-in PDF viewers block card injection. Secure-context and Permissions Policy restrictions may prevent translation on some sites. Unsupported languages, downloads, and timeouts produce an error instead of silently falling back to a cloud service. Selections are limited to 10,000 characters. Selections inside iframes are shown in the top-level page, with a top-right fallback position.

## Repository structure

This monorepo separates the browser extension and a fully native macOS client:

```text
apps/extension/   # Chrome extension: src, tests, scripts
apps/macos/       # Native macOS client, Xcode project, tests, and build scripts
shared/assets/    # Shared brand assets
```

The macOS client uses Swift / SwiftUI / AppKit, without a WebView or shared JavaScript UI or runtime. The two apps share brand assets; platform features and translation engines are implemented separately.

## Development

Run these commands from the repository root; they delegate to the extension workspace. The extension has no runtime npm dependencies or build step. With Node.js 22+:

```sh
npm run check
npm test
npm run package
```

The native app requires Xcode. From the repository root:

```sh
npm run build:macos
npm run test:macos
```

Alternatively, run `bash apps/macos/scripts/build.sh` and `bash apps/macos/scripts/test.sh` directly; native builds do not require Node.js.

The package is written to `dist/maclingo.zip`. PNG icons are committed. To regenerate them from `shared/assets/icon.svg`, install the optional development tool `sharp` and run `node apps/extension/scripts/icons.cjs`.

### Browser check

Use an isolated Chrome test session with only `https://example.com/` and optional blank/new-tab pages open. Install Playwright, or expose it through `NODE_PATH`, then run:

```sh
node apps/extension/tests/browser-check.cjs '<cdp-url>'
```

The script tests the card in an isolated content-script world with mocked extension messaging and translation responses, then separately probes real on-device translation. It does not simulate clicking the actual extension context menu. Screenshots are saved to `dist`; `card-preview*` use mock translations, while `real-engine.png` shows the actual engine state.

Background tests cover selection-only menus, on-demand injection, document routing, restricted pages, and stale requests. Real on-device translation, card interactions, light/dark rendering, and unpacked installation on macOS have also been verified.

## Contributing and license

Issues and pull requests are welcome. Include browser / macOS versions, page type, and reproduction steps. Do not include private selected text. Code and original icon artwork are licensed under [MIT](LICENSE). See [Privacy](PRIVACY.md).

MacLingo is an independent project, unaffiliated with Apple or Google.

Automatic selection translation is off by default. Enable it in the toolbar popup to translate selections in page text. Editable fields and the translation card are excluded. Turning it off stops selection listeners immediately. Use the context menu inside iframes.
