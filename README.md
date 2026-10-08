<p align="center"><img src="apps/extension/src/icons/icon128.png" width="88" height="88" alt="MacLingo icon"></p>
<h1 align="center">MacLingo · 麦译</h1>
<p align="center">Mac 本机翻译：Chrome 扩展与原生菜单栏应用<br>Quiet, on-device translation for Mac.</p>
<p align="center"><a href="README.en.md">English</a> · <a href="https://github.com/thornfe/maclingo/releases/latest">下载安装包</a> · <a href="LICENSE">MIT</a></p>

选中文字，右键「用麦译翻译」，或在 Mac 按 Control + Shift + M，在当前网页的小卡片中阅读译文。快捷键只在 Chrome 内生效，可在 chrome://extensions/shortcuts 修改；iframe 内选词请使用右键菜单。

**MacLingo** 将 Mac 和语言联系起来；**麦译**取 Mac 的谐音，表达随手翻译、继续阅读的轻量体验。

## Chrome 扩展特点

- **留在页面**：译文出现在选区附近，点击空白处或按 Esc 关闭。
- **主动触发**：默认通过右键或快捷键翻译，不监听剪贴板；可在扩展弹窗开启划词自动翻译。
- **本机翻译**：使用 Chrome Translator API，无需 API Key，扩展不上传选中文字到第三方翻译服务。
- **便于阅读**：可复制译文、展开原文、切换语言，支持深浅色。
- **权限克制**：只请求 `contextMenus`、`activeTab`、`scripting` 和 `storage`，默认不常驻读取网站；开启划词自动翻译时才请求可选的网页访问权限。

## Chrome 扩展安装

需要支持 Translator API 的 **Chrome 138+ 桌面版**。这是 Chrome 扩展，使用浏览器的翻译能力。

1. 从 [Releases](https://github.com/thornfe/maclingo/releases/latest) 下载 `maclingo.zip` 并解压，或下载本仓库源码。
2. 在 Chrome 打开 `chrome://extensions`，启用右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」：安装 ZIP 时选择解压后包含 `manifest.json` 的目录；源码安装时选择 `apps/extension/src` 目录。
4. 打开普通 HTTPS 网页，选中文字，右键选择「用麦译翻译」。

目前通过已解压扩展安装，尚未上架 Chrome Web Store。请保留安装目录；更新文件后，在扩展管理页点击「重新加载」，再刷新网页。

## 原生 Mac 客户端

原生客户端使用 SwiftUI / AppKit，面向 Apple Silicon、macOS 15+。通过菜单栏运行，默认按 **Control + Option + M** 翻译其它应用的选中文字，与扩展的快捷键独立。系统取词需要辅助功能权限；应用无法提供选区时，请手动复制，再选择菜单栏的「翻译剪贴板」。不会自动读取旧剪贴板作为取词结果。

翻译使用 Apple Translation，首次使用可能需要允许下载语言包。支持的语言和可取词应用取决于系统与应用；图片和扫描版 PDF 暂不支持。设置、构建及验收说明见 [原生客户端说明](apps/macos/README.md)。预览版采用固定自签名证书 `thorn.maclingo`，未经过 Apple 公证。

1. 从 [原生预览版](https://github.com/thornfe/maclingo/releases/tag/macos-v0.1.0-preview.1) 下载 `MacLingo-0.1.0-macos-arm64.zip`，解压并将 `MacLingo.app` 放入「应用程序」。
2. 首次打开若被拦截，进入「系统设置 → 隐私与安全性」，为刚打开的麦译选择「仍要打开」，按系统提示确认。无需安装或信任额外证书。
3. 在麦译设置中点击「打开系统设置」，开启辅助功能权限；选中文字后按 **Control + Option + M**。

从旧开发版升级时，先退出旧版；Bundle ID 已统一为 `thorn.maclingo`，需要重新授权，原有应用偏好也会重置。语言包由 Apple 管理。

## Chrome 扩展使用说明

默认自动识别原文并翻译为简体中文。卡片中可切换原文与目标语言；短词识别不准时可手动选择原文语言。扩展会在本机记住上次手动选择的原文语言；该语言组合不可用时，本次翻译自动切回自动识别，不覆盖已保存的选择。首次使用需要联网下载语言包；如果出现提示，点击「开始本机翻译」。下载完成后由浏览器在设备上执行翻译。

点击「朗读原文」使用对应语言的本机声音发音，再次点击可停止。关闭卡片或切换语言会停止朗读；只有存在匹配的本机声音时才显示朗读按钮，不会切换到在线语音服务。

每次最多 10,000 个字符。重复翻译只保留一张卡片，不存储翻译记录。iframe 中的选中文字会在顶层网页显示，无法定位原选区时放在右上角。

## Chrome 扩展兼容性与限制

以 **macOS + Chrome** 为主要使用和验证环境。其他桌面系统或 Chromium 浏览器可能可用，但需实际支持 Translator API，尚未验证。Safari 暂不支持。

浏览器内部页、扩展商店、内置 PDF 阅读器禁止注入卡片。网页的安全上下文或 Permissions Policy 可能限制翻译。语言包下载失败、不支持的语言、超时会显示提示；不会自动切换到在线翻译服务。

## 仓库结构

本仓库按 monorepo 管理浏览器扩展与完全原生的 macOS 客户端：

```text
apps/extension/   # Chrome 扩展：src、tests、scripts
apps/macos/       # 原生 macOS 客户端、Xcode 工程、测试与构建脚本
shared/assets/    # 共享品牌资源
```

Mac 客户端采用 Swift / SwiftUI / AppKit，不使用 WebView，也不共享 JavaScript UI 或业务运行时。两端共享品牌资源，平台功能与翻译引擎分别实现。

## 开发

以下命令在仓库根目录执行，并转发至扩展 workspace。扩展运行时无 npm 依赖，无需构建。使用 Node.js 22+：

```sh
npm run check
npm test
npm run package
```

原生客户端使用 Xcode，在仓库根目录执行：

```sh
npm run build:macos
npm run test:macos
```

也可以直接运行 `bash apps/macos/scripts/build.sh` 和 `bash apps/macos/scripts/test.sh`，原生构建无需 Node.js。

安装包生成在 `dist/maclingo.zip`。图标源文件是 `shared/assets/icon.svg`，PNG 已随源码提交；如需重新导出，安装开发工具 `sharp` 后执行 `node apps/extension/scripts/icons.cjs`。

后台测试覆盖右键菜单、按需注入、消息路由、受限页面及并发请求。可用 Playwright 运行 `apps/extension/tests/browser-check.cjs <cdp-url>` 检查隔离测试浏览器中的卡片交互；具体要求见 [英文开发说明](README.en.md#browser-check)。

已验证真实 Chrome 本机翻译、卡片交互、深浅色及本机扩展加载。不同网站和浏览器的支持情况仍可能不同。

## 开源与隐私

代码和自绘图标采用 [MIT 许可证](LICENSE)。欢迎通过 [Issues](https://github.com/thornfe/maclingo/issues) 报告问题或提交 Pull Request；请说明 Chrome / macOS 版本、页面类型和复现步骤，避免附带私人文本。

详情见 [隐私说明](PRIVACY.md)。MacLingo 是独立项目，与 Apple 或 Google 无隶属或背书关系。

接口文档：[右键菜单](https://developer.chrome.com/docs/extensions/reference/api/contextMenus) · [activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab) · [Translator API](https://developer.chrome.com/docs/ai/translator-api)

划词自动翻译默认关闭，点击工具栏麦译图标可开启。开启后在网页正文中选词自动翻译，输入框及翻译卡片内选词不会触发；关闭后立即停止监听。iframe 内仍使用右键菜单。
