import AppKit
import Carbon

@MainActor final class GlobalShortcut {
    private var hotKey: EventHotKeyRef?
    private var handler: EventHandlerRef?
    private var registeredKey: UInt32?
    private var registeredModifiers: UInt32?
    var action: (() -> Void)?

    init() {
        var event = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))
        InstallEventHandler(GetApplicationEventTarget(), { _, _, context in
            guard let context else { return OSStatus(eventNotHandledErr) }
            let shortcut = Unmanaged<GlobalShortcut>.fromOpaque(context).takeUnretainedValue()
            MainActor.assumeIsolated { shortcut.action?() }
            return noErr
        }, 1, &event, Unmanaged.passUnretained(self).toOpaque(), &handler)
    }

    /// Keep the previous working shortcut registered if a replacement conflicts.
    func register(key: UInt32, modifiers: UInt32) -> OSStatus {
        if key == registeredKey, modifiers == registeredModifiers { return noErr }
        var replacement: EventHotKeyRef?
        let identifier = EventHotKeyID(signature: 0x4D4C4E47, id: 1)
        let result = RegisterEventHotKey(key, modifiers, identifier, GetApplicationEventTarget(), OptionBits(kEventHotKeyExclusive), &replacement)
        if result == noErr {
            if let hotKey { UnregisterEventHotKey(hotKey) }
            hotKey = replacement
            registeredKey = key
            registeredModifiers = modifiers
        }
        return result
    }

    func stop() {
        if let hotKey { UnregisterEventHotKey(hotKey) }
        if let handler { RemoveEventHandler(handler) }
        hotKey = nil
        handler = nil
    }
}
