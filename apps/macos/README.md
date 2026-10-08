# MacLingo for macOS

完全原生的菜单栏翻译应用，使用 SwiftUI、AppKit、Accessibility、Apple Translation 和系统本机语音。要求 macOS 15+；默认构建 Apple Silicon 版本。

## 构建和运行

需要完整 Xcode 和已安装的 macOS SDK。在仓库根目录执行：

```bash
npm run build:macos
open apps/macos/.build/xcode/Build/Products/Debug/MacLingo.app
npm run test:macos
```

也可以直接执行 `bash apps/macos/scripts/build.sh`、`bash apps/macos/scripts/test.sh`，或用 Xcode 打开 `MacLingo.xcodeproj`，选择共享的 MacLingo scheme 构建。

应用常驻菜单栏，没有 Dock 图标。初次运行自动打开设置窗口；之后双击应用也会打开设置。点击设置中的“打开系统设置”，进入系统设置 → 隐私与安全性 → 辅助功能，允许 **MacLingo / 麦译**。在其它应用选择文字后按 `Control + Option + M` 即可翻译。快捷键组合和原文、译文语言可在菜单栏“设置…”中修改；占用冲突会提示，已有的有效组合继续生效。

原文默认自动识别，译文默认简体中文。语言列表从本机 Translation 框架读取；本机不支持的语言组合会提示。指定原文语言组合不可用且自动识别可用时，本次请求回退到自动识别，保留偏好设置。首次使用尚未安装的语言包时，系统会请求授权下载。下载过程中保持浮窗打开，避免点击系统授权界面导致请求被取消；Esc、关闭按钮或“取消”可以结束请求。

浮窗支持切换语言、展开原文、复制译文和朗读。只提供本机可用的声音；没有可用声音时朗读按钮禁用。连续触发只显示最新请求，Esc 或点击应用外部关闭浮窗（语言包授权期间保留浮窗）。可以在多个显示器上使用，浮窗按选区位置或鼠标位置限制在屏幕可见区域。

应用或设置窗口前台时，也可以使用 macOS 顶部应用菜单“翻译 → 翻译剪贴板”。菜单栏图标和全局快捷键提供跨应用选区翻译入口。

## 取词范围和隐私

通过 Accessibility 读取当前焦点元素的选中文字和可用的选区位置，先取词再打开窗口；拒绝安全密码输入框。取词接口有超时，应用不支持选区或权限缺失时显示明确提示。只有点击“翻译剪贴板”才读取剪贴板原文，不将旧剪贴板自动视为当前选区。

翻译和朗读在本机执行；语言包首次下载由系统管理。应用不提供 OCR、自动划词监听、历史记录、云端接口或自动更新。与扩展共享 `../../shared/assets/icon.svg` 品牌资源，资源打包进应用；界面为原生控件。

## 交付和验证

预览分发使用 Release 构建、Apple Silicon 架构和固定自签名证书 `thorn.maclingo`；Bundle ID 同为 `thorn.maclingo`。未经过 Apple 公证，首次下载运行可能需要在「系统设置 → 隐私与安全性」点击「仍要打开」。无需安装证书或关闭 Gatekeeper。辅助功能权限另行授权，应用未启用 App Sandbox。面向普通用户的 Developer ID 签名和公证可后续接入，无需上架 App Store。

升级时先退出应用，将新版本放到同一安装位置。由旧开发版 `com.thornwu.MacLingo` 切换至新身份时，需要重新授权，应用偏好会重置；Apple 管理的语言包不随 Bundle ID 打包。固定证书应长期复用，不能保证所有系统版本都会保留辅助功能授权。

如果系统权限开关已开启，但“重新检查”仍显示未授权：先退出麦译，在系统权限列表移除旧的 MacLingo 项，再用 `+` 添加当前构建的 `MacLingo.app` 并开启。随后重开麦译检查。开发构建的 ad-hoc 签名随代码变化，旧项可能仍绑定上一版签名；仅重启不一定解决。请完成构建后再授权，授权后不要立即重编译。较新 macOS 的对应页面可能显示为“设备控制与数据访问”（Device Control and Data Access），可使用应用内“打开系统设置”直接进入。

核心测试覆盖空文本、10,000 字符限制、最新请求覆盖、取消后拒绝旧结果以及浮窗多屏边界。自动测试不代表真实应用取词或语言包下载通过验收；TextEdit、Safari、Preview 可选文本 PDF 的实际取词情况与权限、系统语言包有关，需要实机验证。系统最低版本通过编译目标设为 macOS 15，本次开发环境为 macOS 27.2 / Xcode 27，尚未在 macOS 15 实机运行。

### 本机验证记录（2026-10-08）

- 原生 Debug 构建和 ad-hoc 签名校验通过；6 项 Swift 核心测试通过。扩展 21 项测试及语法检查通过，扩展运行时源码与拆分前逐字节一致。
- 实际界面确认首次运行设置引导、快捷键保存、翻译浮窗及系统语言包下载界面可用。
- 英语和简体中文语言包通过 Apple 系统界面下载。独立调用真实 Apple Translation 接口确认状态为 `installed`，测试句子 `The quiet joy of reading.` 返回 `阅读的安静乐趣。`。这是系统引擎的实际结果，不是模拟翻译；不等同于跨应用取词端到端验收。
- 已在系统设置移除旧签名绑定的 MacLingo 授权项，并重新添加当前固定构建；系统开关开启，应用内检查显示“已允许读取选中文字”。当时开发构建 CDHash 为 `68591f9ceb4fe29a9fbfea9a57c30d87b2d841b0`；该记录属于旧身份开发版，不代表之后的 Release 版本。
- 用户已确认真实全局快捷键和选词翻译使用正常。用户未指明具体测试应用，因此不据此宣称 TextEdit / Safari / Preview 的逐项兼容性均已验证。自动化工具的模拟组合键未触发全局热键，窗口激活和外部点击也会影响浮窗观察；真实按键验收以用户实测反馈为准。

## 自签名发布

```sh
npm run package:macos
```

此命令构建 Release、使用固定证书签名并校验，生成 `dist/MacLingo-0.1.0-macos-arm64.zip` 和 `.sha256`。普通 `npm run build:macos` 仍用于 ad-hoc Debug 开发。发布标签按平台区分：原生首版 `macos-v0.1.0-preview.1`，扩展保持 `0.1.5`。

打包脚本默认使用仓库外的 `~/Library/Application Support/MacLingoSigning/thorn.maclingo.keychain-db`；可通过 `MACLINGO_SIGNING_ROOT`、`MACLINGO_SIGNING_KEYCHAIN` 和 `MACLINGO_SIGNING_IDENTITY` 指定已有签名环境。钥匙串需先解锁。没有签名身份时脚本失败，不会静默退回临时签名。

维护者应安全备份该目录的加密 `identity.p12` 与密码文件，并限制访问。私钥、钥匙串和密码禁止提交或包含在安装包中。构建脚本不会生成或替换证书，也不会改变系统信任策略。

扩展与原生端并非完全同功能：扩展默认快捷键为 Control + Shift + M，支持可选自动划词和朗读原文；原生默认 Control + Option + M，主动取词并朗读译文。两端分别管理偏好。

### 预览版分发验证（2026-10-08）

Release 编译、21 项扩展测试、6 项原生测试及签名校验通过。修改临时副本的构建号并重签后，仍满足原版本的 designated requirement（Bundle ID + 固定证书指纹），不再绑定单次构建的 CDHash。这是签名身份升级验证，不等同于跨升级的系统辅助功能授权实测。旧开发版的真实全局按键已由用户验收；新 Bundle ID 的首次授权及下载后 Gatekeeper 放行尚未在全新用户环境实测。
