<p align="center"><img src="extension/icons/icon128.png" width="88" height="88" alt="MacLingo icon"></p>
<h1 align="center">MacLingo · 麦译</h1>
<p align="center">为 Mac 打造的 Chrome 划词翻译扩展<br>Quiet, on-device translation for Chrome on Mac.</p>
<p align="center"><a href="README.en.md">English</a> · <a href="https://github.com/ThornWu/maclingo/releases/latest">下载安装包</a> · <a href="LICENSE">MIT</a></p>

选中文字，右键「用麦译翻译」，在当前网页的小卡片中阅读译文。

**MacLingo** 将 Mac 和语言联系起来；**麦译**取 Mac 的谐音，表达随手翻译、继续阅读的轻量体验。

## 特点

- **留在页面**：译文出现在选区附近，点击空白处或按 Esc 关闭。
- **主动触发**：只在右键翻译时运行，不自动弹窗、不监听剪贴板。
- **本机翻译**：使用 Chrome Translator API，无需 API Key，扩展不上传选中文字到第三方翻译服务。
- **便于阅读**：可复制译文、展开原文、切换语言，支持深浅色。
- **权限克制**：只请求 `contextMenus`、`activeTab` 和 `scripting`，不常驻读取所有网站。

## 在 Mac 上安装

需要支持 Translator API 的 **Chrome 138+ 桌面版**。这是 Chrome 扩展，使用浏览器的翻译能力。

1. 从 [Releases](https://github.com/ThornWu/maclingo/releases/latest) 下载 `maclingo.zip` 并解压，或下载本仓库源码。
2. 在 Chrome 打开 `chrome://extensions`，启用右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」：安装 ZIP 时选择解压后包含 `manifest.json` 的目录；源码安装时选择 `extension` 目录。
4. 打开普通 HTTPS 网页，选中文字，右键选择「用麦译翻译」。

目前通过已解压扩展安装，尚未上架 Chrome Web Store。请保留安装目录；更新文件后，在扩展管理页点击「重新加载」，再刷新网页。

## 使用说明

默认自动识别原文并翻译为简体中文。卡片中可切换原文与目标语言；短词识别不准时可手动选择原文语言。首次使用需要联网下载语言包；如果出现提示，点击「开始本机翻译」。下载完成后由浏览器在设备上执行翻译。

每次最多 10,000 个字符。重复翻译只保留一张卡片，不存储翻译记录。iframe 中的选中文字会在顶层网页显示，无法定位原选区时放在右上角。

## 兼容性与限制

以 **macOS + Chrome** 为主要使用和验证环境。其他桌面系统或 Chromium 浏览器可能可用，但需实际支持 Translator API，尚未验证。Safari 暂不支持。

浏览器内部页、扩展商店、内置 PDF 阅读器禁止注入卡片。网页的安全上下文或 Permissions Policy 可能限制翻译。语言包下载失败、不支持的语言、超时会显示提示；不会自动切换到在线翻译服务。

## 开发

运行时无 npm 依赖，无需构建。使用 Node.js 22+ 执行：

```sh
npm run check
npm test
npm run package
```

安装包生成在 `dist/maclingo.zip`。图标源文件是 `assets/icon.svg`，PNG 已随源码提交；如需重新导出，安装开发工具 `sharp` 后执行 `node scripts/icons.cjs`。

后台测试覆盖右键菜单、按需注入、消息路由、受限页面及并发请求。可用 Playwright 运行 `tests/browser-check.cjs <cdp-url>` 检查隔离测试浏览器中的卡片交互；具体要求见 [英文开发说明](README.en.md#browser-check)。

已验证真实 Chrome 本机翻译、卡片交互、深浅色及本机扩展加载。不同网站和浏览器的支持情况仍可能不同。

## 开源与隐私

代码和自绘图标采用 [MIT 许可证](LICENSE)。欢迎通过 [Issues](https://github.com/ThornWu/maclingo/issues) 报告问题或提交 Pull Request；请说明 Chrome / macOS 版本、页面类型和复现步骤，避免附带私人文本。

详情见 [隐私说明](PRIVACY.md)。MacLingo 是独立项目，与 Apple 或 Google 无隶属或背书关系。

接口文档：[右键菜单](https://developer.chrome.com/docs/extensions/reference/api/contextMenus) · [activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab) · [Translator API](https://developer.chrome.com/docs/ai/translator-api)
