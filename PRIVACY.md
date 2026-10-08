# 隐私说明 / Privacy

## Chrome 扩展

麦译没有账号、统计分析、广告、开发者服务器或翻译历史数据库。默认只有在你主动选择右键翻译或按翻译快捷键时，扩展才读取该次选中文字，并在当前页面创建卡片。文字通过 Chrome 的语言识别和本机翻译 API 处理，扩展没有将文本发送到第三方翻译服务的网络请求。

首次使用语言包时，Chrome 可能连接其模型下载服务。浏览器自身的下载、遥测与隐私设置由 Chrome 管理，不由此扩展控制。点击 GitHub 链接会打开 GitHub。点击「复制译文」会将译文写入系统剪贴板。扩展不监听剪贴板、不保存文本到本地存储。仅在本机保存手动选择的原文语言偏好和划词开关。划词自动翻译默认关闭；开启并授权网页访问后，扩展监听正文选词并翻译，关闭后停止监听。朗读仅使用浏览器标记为本机服务的声音，不使用远程声音。

卡片属于当前网页的 DOM。Shadow DOM 用于样式隔离，并不是网页内容与扩展之间的安全隔离；请勿把它理解为网站无法观察的私密窗口。

## 原生 macOS 客户端

原生客户端在你按下翻译快捷键时，通过系统辅助功能接口读取当前应用的选中文字及可用的选区位置。此功能需要你在系统设置中授予麦译辅助功能权限。不会持续监听选区；取词失败不会自动读取剪贴板。只有主动选择「翻译剪贴板」时才读取剪贴板文字，点击「复制译文」时写入译文。

文字通过 Apple Translation 框架在本机翻译，朗读使用系统可用的本机声音。语言包下载与授权由 macOS 管理；下载语言包可能连接 Apple 服务。麦译不接入云端翻译服务，不记录翻译历史，也不保存原文或译文到偏好设置。偏好设置仅保存语言和快捷键等配置。译文在独立原生窗口内显示。

---

## Chrome extension

MacLingo has no accounts, analytics, ads, developer-operated servers, or translation history database. By default, it reads the selected text only when you invoke the context-menu action or translation keyboard shortcut, then renders a card in the current page. Text is processed through Chrome's language detection and on-device translation APIs. The extension makes no network requests to third-party translation services with that text.

Chrome may contact its model-download services to obtain language packs. Browser downloads, telemetry, and privacy settings are controlled by Chrome. Clicking the GitHub link opens GitHub. Clicking Copy writes the translation to the system clipboard; the extension does not monitor the clipboard or persist text in local storage. Only the source-language preference and automatic-selection setting are saved locally. Automatic selection translation is off by default. When enabled with website access, the extension listens for selections in page text and translates them; disabling it stops those listeners. Read-aloud uses only voices that the browser identifies as local services, never remote voices.

The card is part of the webpage DOM. Shadow DOM isolates styling; it is not a security boundary or a private window inaccessible to the website.

## Native macOS app

When you invoke the translation shortcut, the native app uses the system Accessibility API to read the current app's selected text and its bounds when available. You must grant MacLingo Accessibility permission in System Settings. The app does not continuously monitor selections. Failed selection capture never automatically reads the clipboard. Clipboard text is read only when you explicitly choose clipboard translation; copying a result writes the translation to the clipboard.

Text is translated on-device through Apple Translation, and read-aloud uses available system voices. macOS manages language-pack downloads and authorization; downloading language packs may contact Apple services. MacLingo does not integrate cloud translation services, keep translation history, or persist source text or translations in preferences. Preferences store only settings such as languages and the shortcut. Translations appear in a separate native window.
