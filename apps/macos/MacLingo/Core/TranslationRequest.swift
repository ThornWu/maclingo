import Foundation

enum TextValidationError: LocalizedError {
    case empty, tooLong
    var errorDescription: String? {
        switch self {
        case .empty: "没有可翻译的文字。请先选择文字，或复制后使用“翻译剪贴板”。"
        case .tooLong: "文字过长，请选择不超过 10,000 个字符。"
        }
    }
}

struct TranslationRequest: Equatable {
    let id: UUID
    let text: String
    let source: String?
    let target: String
    init(text: String, source: String?, target: String) throws {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw TextValidationError.empty }
        guard trimmed.count <= 10_000 else { throw TextValidationError.tooLong }
        self.id = UUID()
        self.text = trimmed
        self.source = source?.isEmpty == false ? source : nil
        self.target = target
    }
}

/// Keeps delayed successes/errors from replacing the latest request or reviving a dismissed panel.
struct RequestGate {
    private(set) var current: TranslationRequest?
    mutating func begin(_ request: TranslationRequest) { current = request }
    mutating func cancel() { current = nil }
    func accepts(_ id: UUID) -> Bool { current?.id == id }
}
