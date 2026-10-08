import AppKit
import SwiftUI

struct SettingsView: View {
    @ObservedObject var preferences: Preferences
    @ObservedObject var model: TranslationModel
    var register: (UInt32, UInt32) -> Bool
    var permission: () -> Void
    var clipboard: () -> Void
    var initialMessage = ""
    @State private var key: UInt32 = 0
    @State private var modifiers: UInt32 = 0
    @State private var message = ""
    @State private var trusted = SelectionReader.isTrusted

    var body: some View {
        Form {
            Section("翻译语言") {
                LanguagePickers(preferences: preferences, languages: model.languages)
                Text("Apple 翻译在本机执行。首次使用某种语言时，系统会请求下载语言包。").font(.callout).foregroundStyle(.secondary)
            }
            Section("全局快捷键") {
                HStack {
                    Picker("修饰键", selection: $modifiers) { ForEach(Preferences.modifiers, id: \.1) { Text($0.0).tag($0.1) } }
                    Picker("按键", selection: $key) { ForEach(Preferences.keys, id: \.1) { Text($0.0).tag($0.1) } }
                }
                Button("保存快捷键") {
                    if register(key, modifiers) {
                        preferences.shortcutKey = key
                        preferences.shortcutModifiers = modifiers
                        message = "快捷键已保存：\(preferences.shortcutLabel)"
                    } else { message = "快捷键已被占用，原快捷键继续有效。请选择其它组合。" }
                }
                if !message.isEmpty { Text(message).font(.callout) }
            }
            Section("辅助功能权限") {
                Text(trusted ? "已允许读取选中文字。" : "尚未允许读取选中文字。剪贴板翻译仍可使用。")
                HStack {
                    Button("打开系统设置", action: permission)
                    Button("重新检查") { trusted = SelectionReader.isTrusted }
                }
                Button("翻译剪贴板", action: clipboard)
                Text("可以先复制一段文字再试译，无需辅助功能权限。").font(.callout).foregroundStyle(.secondary)
                Text("支持取词的应用可通过快捷键翻译选区；不支持时，请主动复制后选择“翻译剪贴板”。").font(.callout).foregroundStyle(.secondary)
                Text("若重新构建后权限已开启仍无法取词，请移除旧的辅助功能条目，再添加当前应用。").font(.caption).foregroundStyle(.secondary)
            }
        }
        .formStyle(.grouped)
        .tint(Color(red: 34 / 255, green: 107 / 255, blue: 104 / 255))
        .padding(8)
        .frame(width: 480, height: 470)
        .onAppear { key = preferences.shortcutKey; modifiers = preferences.shortcutModifiers; trusted = SelectionReader.isTrusted; message = initialMessage }
    }
}
