import AppKit
import SwiftUI
import Translation

struct TranslationWorker: View {
    let request: TranslationRequest
    @ObservedObject var model: TranslationModel
    var body: some View {
        Color.clear.frame(width: 0, height: 0)
            .translationTask(.init(source: request.source.map { Locale.Language(identifier: $0) }, target: Locale.Language(identifier: request.target))) { session in
                await model.translate(request, using: session)
            }
    }
}

struct LanguagePickers: View {
    @ObservedObject var preferences: Preferences
    let languages: [LanguageChoice]
    var body: some View {
        HStack {
            Picker("原文", selection: $preferences.source) {
                Text("自动识别").tag("")
                ForEach(languages) { language in Text(language.name).tag(language.id) }
            }
            Image(systemName: "arrow.right").foregroundStyle(.secondary)
            Picker("译文", selection: $preferences.target) {
                ForEach(languages) { language in Text(language.name).tag(language.id) }
                if languages.isEmpty { Text("简体中文").tag("zh-Hans") }
            }
        }.labelsHidden()
    }
}

struct TranslationView: View {
    @ObservedObject var model: TranslationModel
    @ObservedObject var preferences: Preferences
    var clipboard: () -> Void
    var permission: () -> Void
    var dismiss: () -> Void
    @State private var showOriginal = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "character.bubble.fill").foregroundStyle(Color(red: 34 / 255, green: 107 / 255, blue: 104 / 255))
                Text("麦译").font(.title3.bold())
                Spacer()
                Button(action: dismiss) { Image(systemName: "xmark") }.buttonStyle(.plain).help("关闭（Esc）")
            }
            LanguagePickers(preferences: preferences, languages: model.languages)
                .onChange(of: preferences.source) { _, _ in if model.isPresented { model.retry() } }
                .onChange(of: preferences.target) { _, _ in if model.isPresented { model.retry() } }
            HStack(spacing: 8) {
                if model.isBusy { ProgressView().controlSize(.small) }
                Text(model.message).font(.callout).foregroundStyle(model.isError ? Color.red : Color.secondary)
            }
            if model.usedAutomaticFallback {
                Text("当前语言组合不可用，本次已自动识别原文。保存的语言偏好保持不变。").font(.caption).foregroundStyle(.secondary)
            }
            if !model.result.isEmpty {
                ScrollView { Text(model.result).font(.system(size: 18)).textSelection(.enabled).frame(maxWidth: .infinity, alignment: .leading) }
                HStack {
                    Button("复制译文", systemImage: "doc.on.doc") {
                        NSPasteboard.general.clearContents()
                        NSPasteboard.general.setString(model.result, forType: .string)
                    }
                    Button("朗读", systemImage: "speaker.wave.2") { model.speech.speak(model.result, language: model.resultLanguage) }
                        .disabled(model.speech.voice(for: model.resultLanguage) == nil)
                        .help(model.speech.voice(for: model.resultLanguage) == nil ? "没有可用的本机语音，请在系统设置下载声音。" : "使用本机声音朗读译文")
                    Button("停止") { model.speech.stop() }
                }
            } else { Spacer(minLength: 0) }
            if !model.original.isEmpty {
                DisclosureGroup("原文", isExpanded: $showOriginal) {
                    ScrollView { Text(model.original).textSelection(.enabled).frame(maxWidth: .infinity, alignment: .leading) }.frame(maxHeight: 90)
                }.font(.callout)
            }
            Divider()
            HStack {
                Button("翻译剪贴板", action: clipboard)
                if !SelectionReader.isTrusted { Button("开启辅助功能", action: permission) }
                Spacer()
                if model.isBusy { Button("取消") { model.cancel() } }
                else if !model.original.isEmpty { Button("重试") { model.retry() } }
            }.controlSize(.small)
        }
        .padding(20)
        .frame(minWidth: 400, idealWidth: 460, minHeight: 330, idealHeight: 460)
        .background(.regularMaterial)
        .tint(Color(red: 34 / 255, green: 107 / 255, blue: 104 / 255))
        .overlay(alignment: .topLeading) {
            if let request = model.request { TranslationWorker(request: request, model: model).id(request.id) }
        }
    }
}
