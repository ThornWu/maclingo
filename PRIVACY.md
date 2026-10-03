# 隐私说明 / Privacy

麦译没有账号、统计分析、广告、开发者服务器或翻译历史数据库。只有在你主动选择右键翻译时，扩展才读取该次选中文字，并在当前页面创建卡片。文字通过 Chrome 的语言识别和本机翻译 API 处理，扩展没有将文本发送到第三方翻译服务的网络请求。

首次使用语言包时，Chrome 可能连接其模型下载服务。浏览器自身的下载、遥测与隐私设置由 Chrome 管理，不由此扩展控制。点击 GitHub 链接会打开 GitHub。点击「复制译文」会将译文写入系统剪贴板。扩展不监听剪贴板、不保存文本到本地存储。

卡片属于当前网页的 DOM。Shadow DOM 用于样式隔离，并不是网页内容与扩展之间的安全隔离；请勿把它理解为网站无法观察的私密窗口。

---

MacLingo has no accounts, analytics, ads, developer-operated servers, or translation history database. It reads the selected text only when you invoke the context-menu action, then renders a card in the current page. Text is processed through Chrome's language detection and on-device translation APIs. The extension makes no network requests to third-party translation services with that text.

Chrome may contact its model-download services to obtain language packs. Browser downloads, telemetry, and privacy settings are controlled by Chrome. Clicking the GitHub link opens GitHub. Clicking Copy writes the translation to the system clipboard; the extension does not monitor the clipboard or persist text in local storage.

The card is part of the webpage DOM. Shadow DOM isolates styling; it is not a security boundary or a private window inaccessible to the website.
