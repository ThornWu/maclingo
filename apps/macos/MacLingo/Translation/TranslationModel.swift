import AppKit
import Combine
import NaturalLanguage
import Translation

struct LanguageChoice: Identifiable {
    let id: String
    var name: String { Locale.current.localizedString(forIdentifier: id) ?? id }
}

@MainActor final class TranslationModel: ObservableObject {
    @Published private(set) var request: TranslationRequest?
    @Published private(set) var original = ""
    @Published private(set) var result = ""
    @Published private(set) var message = "选择文字后按快捷键，或使用翻译剪贴板。"
    @Published private(set) var isBusy = false
    @Published private(set) var isError = false
    @Published private(set) var awaitingDownload = false
    @Published private(set) var usedAutomaticFallback = false
    @Published private(set) var resultLanguage = "zh-Hans"
    @Published private(set) var languages: [LanguageChoice] = []
    var isPresented = false
    let preferences: Preferences
    let speech = SpeechService()
    private var gate = RequestGate()
    private var activeSession: TranslationSession?

    init(preferences: Preferences) { self.preferences = preferences }

    func loadLanguages() async {
        let supported = await LanguageAvailability().supportedLanguages
        languages = supported.map { LanguageChoice(id: $0.minimalIdentifier) }.sorted { $0.name.localizedCompare($1.name) == .orderedAscending }
        if !languages.contains(where: { $0.id == preferences.target }), let fallback = languages.first(where: { $0.id == "zh-Hans" }) ?? languages.first {
            preferences.target = fallback.id
        }
        if !preferences.source.isEmpty, !languages.contains(where: { $0.id == preferences.source }) {
            preferences.source = ""
        }
    }

    func begin(text: String) {
        cancel()
        usedAutomaticFallback = false
        original = text
        result = ""
        do {
            let next = try TranslationRequest(text: text, source: preferences.source, target: preferences.target)
            original = next.text
            gate.begin(next)
            request = next
            isBusy = true
            isError = false
            message = "正在识别语言…"
        } catch { fail(error.localizedDescription) }
    }

    func retry() { if !original.isEmpty { begin(text: original) } }
    func fail(_ text: String) {
        cancel()
        original = ""
        usedAutomaticFallback = false
        result = ""
        isError = true
        message = text
    }
    func cancel() {
        if isBusy { message = "已取消翻译。" }
        gate.cancel()
        if #available(macOS 26.0, *) { activeSession?.cancel() }
        activeSession = nil
        request = nil
        isBusy = false
        awaitingDownload = false
        speech.stop()
    }

    func translate(_ request: TranslationRequest, using session: TranslationSession) async {
        guard gate.accepts(request.id) else { return }
        activeSession = session
        do {
            // Apple's translation engine does not translate a language to itself.
            let recognized = request.source ?? NLLanguageRecognizer.dominantLanguage(for: request.text)?.rawValue
            if recognized == request.target {
                complete(request, text: request.text, language: request.target, note: "原文已是目标语言。")
                return
            }
            let availability = LanguageAvailability()
            let target = Locale.Language(identifier: request.target)
            let status: LanguageAvailability.Status
            if let source = request.source {
                status = await availability.status(from: Locale.Language(identifier: source), to: target)
            } else {
                status = try await availability.status(for: request.text, to: target)
            }
            guard gate.accepts(request.id), !Task.isCancelled else { return }
            if status == .unsupported {
                if request.source != nil {
                    let automaticStatus = try await availability.status(for: request.text, to: target)
                    guard gate.accepts(request.id), !Task.isCancelled else { return }
                    if automaticStatus != .unsupported {
                        let fallback = try TranslationRequest(text: request.text, source: nil, target: request.target)
                        cancel()
                        usedAutomaticFallback = true
                        gate.begin(fallback)
                        self.request = fallback
                        isBusy = true
                        message = "已改为自动识别原文语言…"
                        return
                    }
                }
                throw TranslationError.unsupportedLanguagePairing
            }
            awaitingDownload = status == .supported
            message = status == .supported ? "需要语言包；请在系统提示中允许下载。" : "正在本机翻译…"
            // A nil source session needs the sample passed to translate() to identify the language.
            if request.source != nil { try await session.prepareTranslation() }
            guard gate.accepts(request.id), !Task.isCancelled else { return }
            message = "正在本机翻译…"
            let response = try await session.translate(request.text)
            guard !Task.isCancelled else { return }
            complete(request, text: response.targetText, language: response.targetLanguage.minimalIdentifier, note: "本机翻译")
        } catch {
            guard gate.accepts(request.id), !Task.isCancelled else { return }
            isBusy = false
            awaitingDownload = false
            isError = true
            message = "翻译未完成：\(error.localizedDescription) 可切换语言或重试。"
            activeSession = nil
        }
    }

    private func complete(_ request: TranslationRequest, text: String, language: String, note: String) {
        guard gate.accepts(request.id) else { return }
        result = text
        resultLanguage = language
        isBusy = false
        awaitingDownload = false
        isError = false
        message = note
        activeSession = nil
    }
}
