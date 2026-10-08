import AppKit
import AVFoundation

@MainActor final class SpeechService {
    private let synthesizer = AVSpeechSynthesizer()

    func voice(for language: String) -> AVSpeechSynthesisVoice? {
        let available = AVSpeechSynthesisVoice.speechVoices()
        if let exact = available.first(where: { $0.language.caseInsensitiveCompare(language) == .orderedSame }) { return exact }
        let base = Locale.Language(identifier: language).languageCode?.identifier
        return available.first { Locale.Language(identifier: $0.language).languageCode?.identifier == base }
    }

    func speak(_ text: String, language: String) {
        guard let voice = voice(for: language) else { return }
        stop()
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = voice
        synthesizer.speak(utterance)
    }
    func stop() { synthesizer.stopSpeaking(at: .immediate) }
}
