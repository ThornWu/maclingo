import AppKit
import Carbon
import Combine

@MainActor final class Preferences: ObservableObject {
    private let defaults: UserDefaults
    @Published var source: String { didSet { defaults.set(source, forKey: "sourceLanguage") } }
    @Published var target: String { didSet { defaults.set(target, forKey: "targetLanguage") } }
    @Published var shortcutKey: UInt32 { didSet { defaults.set(Int(shortcutKey), forKey: "shortcutKey") } }
    @Published var shortcutModifiers: UInt32 { didSet { defaults.set(Int(shortcutModifiers), forKey: "shortcutModifiers") } }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        source = defaults.string(forKey: "sourceLanguage") ?? ""
        target = defaults.string(forKey: "targetLanguage") ?? "zh-Hans"
        shortcutKey = UInt32(defaults.object(forKey: "shortcutKey") as? Int ?? kVK_ANSI_M)
        shortcutModifiers = UInt32(defaults.object(forKey: "shortcutModifiers") as? Int ?? (controlKey | optionKey))
    }

    static let keys: [(String, UInt32)] = [
        ("M", UInt32(kVK_ANSI_M)), ("T", UInt32(kVK_ANSI_T)), ("Y", UInt32(kVK_ANSI_Y)),
        ("L", UInt32(kVK_ANSI_L)), ("K", UInt32(kVK_ANSI_K)), ("J", UInt32(kVK_ANSI_J)),
        ("F", UInt32(kVK_ANSI_F)), ("G", UInt32(kVK_ANSI_G)), ("Space", UInt32(kVK_Space))
    ]
    static let modifiers: [(String, UInt32)] = [
        ("⌃⌥", UInt32(controlKey | optionKey)), ("⌃⇧", UInt32(controlKey | shiftKey)),
        ("⌘⌥", UInt32(cmdKey | optionKey)), ("⌘⇧", UInt32(cmdKey | shiftKey)),
        ("⌃⌥⇧", UInt32(controlKey | optionKey | shiftKey))
    ]
    var shortcutLabel: String {
        let modifiers = Self.modifiers.first { $0.1 == shortcutModifiers }?.0 ?? ""
        let key = Self.keys.first { $0.1 == shortcutKey }?.0 ?? "?"
        return modifiers + key
    }
}
