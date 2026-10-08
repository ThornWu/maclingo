import AppKit
import ApplicationServices

struct SelectedText {
    let text: String
    let bounds: CGRect?
}

enum SelectionError: LocalizedError {
    case permission, unavailable, empty
    var errorDescription: String? {
        switch self {
        case .permission: "请在系统设置 → 隐私与安全性 → 辅助功能中允许麦译读取选中文字。"
        case .unavailable: "当前应用未提供选中文字。请复制文字，再点击“翻译剪贴板”。"
        case .empty: "没有选中文字。请先选择文字，再按快捷键。"
        }
    }
}

@MainActor enum SelectionReader {
    static var isTrusted: Bool { AXIsProcessTrusted() }
    static func requestPermission() {
        let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
        _ = AXIsProcessTrustedWithOptions(options)
    }

    static func read() throws -> SelectedText {
        guard isTrusted else { throw SelectionError.permission }
        let system = AXUIElementCreateSystemWide()
        AXUIElementSetMessagingTimeout(system, 0.4)
        var focusedValue: CFTypeRef?
        guard AXUIElementCopyAttributeValue(system, kAXFocusedUIElementAttribute as CFString, &focusedValue) == .success,
              let focusedValue, CFGetTypeID(focusedValue) == AXUIElementGetTypeID() else {
            throw SelectionError.unavailable
        }
        let focused = unsafeBitCast(focusedValue, to: AXUIElement.self)
        AXUIElementSetMessagingTimeout(focused, 0.4)
        var subrole: CFTypeRef?
        if AXUIElementCopyAttributeValue(focused, kAXSubroleAttribute as CFString, &subrole) == .success,
           subrole as? String == kAXSecureTextFieldSubrole as String { throw SelectionError.unavailable }
        var selectedValue: CFTypeRef?
        guard AXUIElementCopyAttributeValue(focused, kAXSelectedTextAttribute as CFString, &selectedValue) == .success,
              let text = selectedValue as? String else { throw SelectionError.unavailable }
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw SelectionError.empty }

        var rangeValue: CFTypeRef?
        var boundsValue: CFTypeRef?
        var cocoaBounds: CGRect?
        if AXUIElementCopyAttributeValue(focused, kAXSelectedTextRangeAttribute as CFString, &rangeValue) == .success,
           let rangeValue,
           AXUIElementCopyParameterizedAttributeValue(focused, kAXBoundsForRangeParameterizedAttribute as CFString, rangeValue, &boundsValue) == .success,
           let boundsValue, CFGetTypeID(boundsValue) == AXValueGetTypeID() {
            let value = unsafeBitCast(boundsValue, to: AXValue.self)
            var bounds = CGRect.zero
            if AXValueGetValue(value, .cgRect, &bounds), bounds.width >= 0, bounds.height > 0,
               let primary = NSScreen.screens.first {
                cocoaBounds = CGRect(x: bounds.minX, y: primary.frame.maxY - bounds.maxY, width: bounds.width, height: bounds.height)
            }
        }
        return SelectedText(text: text, bounds: cocoaBounds)
    }
}
