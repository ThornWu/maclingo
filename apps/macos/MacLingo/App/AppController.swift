import AppKit
import SwiftUI

final class TranslationPanel: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }
}

@MainActor final class AppController: NSObject, NSApplicationDelegate, NSMenuDelegate, NSWindowDelegate {
    private let preferences = Preferences()
    private lazy var model = TranslationModel(preferences: preferences)
    private let shortcut = GlobalShortcut()
    private var statusItem: NSStatusItem?
    private var panel: TranslationPanel?
    private var settingsWindow: NSWindow?
    private var outsideMonitor: Any?
    private var keyMonitor: Any?
    private var lastRegistrationSucceeded = true
    private var sourceApplication: NSRunningApplication?
    private var presentedAt: TimeInterval = 0

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        shortcut.action = { [weak self] in self?.translateSelection() }
        lastRegistrationSucceeded = shortcut.register(key: preferences.shortcutKey, modifiers: preferences.shortcutModifiers) == noErr
        let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        item.button?.image = NSImage(systemSymbolName: "character.bubble.fill", accessibilityDescription: "麦译")
        item.button?.toolTip = "麦译 MacLingo"
        let menu = NSMenu()
        menu.delegate = self
        menu.addItem(menuItem("翻译选中文字", action: #selector(translateSelection)))
        menu.addItem(menuItem("翻译剪贴板", action: #selector(translateClipboard)))
        menu.addItem(.separator())
        menu.addItem(menuItem("设置…", action: #selector(showSettings)))
        menu.addItem(menuItem("辅助功能权限…", action: #selector(openPermission)))
        menu.addItem(.separator())
        menu.addItem(menuItem("退出麦译", action: #selector(quit)))
        item.menu = menu
        statusItem = item
        keyMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            if event.keyCode == 53, self?.panel?.isKeyWindow == true {
                self?.dismissPanel()
                return nil
            }
            return event
        }
        Task { await model.loadLanguages() }
        let onboardingKey = "hasShownFirstRunSettings"
        if !UserDefaults.standard.bool(forKey: onboardingKey) {
            UserDefaults.standard.set(true, forKey: onboardingKey)
            showSettings()
        } else if !lastRegistrationSucceeded { showSettings() }
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if let panel, panel.isVisible {
            panel.makeKeyAndOrderFront(nil)
        } else if let settingsWindow, settingsWindow.isVisible {
            settingsWindow.makeKeyAndOrderFront(nil)
        } else {
            showSettings()
        }
        return true
    }

    func menuWillOpen(_ menu: NSMenu) {
        menu.items.first?.title = "翻译选中文字（\(preferences.shortcutLabel)）"
    }

    private func menuItem(_ title: String, action: Selector) -> NSMenuItem {
        let item = NSMenuItem(title: title, action: action, keyEquivalent: "")
        item.target = self
        return item
    }

    @objc private func translateSelection() {
        if NSWorkspace.shared.frontmostApplication?.processIdentifier != ProcessInfo.processInfo.processIdentifier {
            sourceApplication = NSWorkspace.shared.frontmostApplication
        }
        // Capture the external application's AX selection before making any MacLingo window key.
        let anchor: CGRect?
        do {
            let selection = try SelectionReader.read()
            anchor = selection.bounds
            model.begin(text: selection.text)
        } catch {
            anchor = nil
            model.fail(error.localizedDescription)
        }
        showPanel(anchor: anchor)
    }

    @objc func translateClipboard() {
        if NSWorkspace.shared.frontmostApplication?.processIdentifier != ProcessInfo.processInfo.processIdentifier {
            sourceApplication = NSWorkspace.shared.frontmostApplication
        }
        // This explicit action is the only place where source text is read from the pasteboard.
        model.begin(text: NSPasteboard.general.string(forType: .string) ?? "")
        showPanel(anchor: nil)
    }

    private func showPanel(anchor: CGRect?) {
        model.isPresented = true
        settingsWindow?.orderOut(nil)
        if panel == nil {
            let panel = TranslationPanel(contentRect: CGRect(x: 0, y: 0, width: 460, height: 460), styleMask: [.titled, .fullSizeContentView, .resizable], backing: .buffered, defer: false)
            panel.title = "麦译"
            panel.titleVisibility = .hidden
            panel.titlebarAppearsTransparent = true
            panel.isReleasedWhenClosed = false
            panel.level = .floating
            panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
            panel.hidesOnDeactivate = false
            panel.delegate = self
            panel.contentView = NSHostingView(rootView: TranslationView(model: model, preferences: preferences, clipboard: { [weak self] in self?.translateClipboard() }, permission: { [weak self] in self?.openPermission() }, dismiss: { [weak self] in self?.dismissPanel() }))
            self.panel = panel
        }
        guard let panel else { return }
        let mouse = NSEvent.mouseLocation
        let point = anchor.map { CGPoint(x: $0.midX, y: $0.midY) } ?? mouse
        let screen = NSScreen.screens.first(where: { $0.frame.contains(point) }) ?? NSScreen.main ?? NSScreen.screens.first
        if let screen {
            panel.setFrame(PanelPlacement.frame(size: panel.frame.size, anchor: anchor ?? CGRect(origin: mouse, size: .zero), visibleFrame: screen.visibleFrame), display: true)
        }
        presentedAt = ProcessInfo.processInfo.systemUptime
        panel.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        if outsideMonitor == nil {
            outsideMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { [weak self] event in
                // Apple's language download authorization may be hosted by a separate system process.
                MainActor.assumeIsolated {
                    guard let self, let panel = self.panel, panel.isVisible,
                          event.timestamp > self.presentedAt,
                          !self.model.awaitingDownload else { return }
                    // NSEvent carries the click position even when a synthetic click does not move
                    // the physical pointer. Nil-window events already use screen coordinates.
                    let click = event.window.map { $0.convertPoint(toScreen: event.locationInWindow) } ?? event.locationInWindow
                    guard !panel.frame.contains(click) else { return }
                    self.dismissPanel(restoreFocus: false)
                }
            }
        }
    }

    private func dismissPanel(restoreFocus: Bool = true) {
        model.isPresented = false
        let wasKey = panel?.isKeyWindow == true
        model.cancel()
        panel?.orderOut(nil)
        if let outsideMonitor { NSEvent.removeMonitor(outsideMonitor); self.outsideMonitor = nil }
        if restoreFocus, wasKey, NSWorkspace.shared.frontmostApplication?.processIdentifier == ProcessInfo.processInfo.processIdentifier {
            sourceApplication?.activate(options: [])
        }
    }

    func windowShouldClose(_ sender: NSWindow) -> Bool {
        if sender === panel { dismissPanel(); return false }
        return true
    }

    @objc func showSettings() {
        if settingsWindow == nil {
            let window = NSWindow(contentRect: CGRect(x: 0, y: 0, width: 480, height: 470), styleMask: [.titled, .closable], backing: .buffered, defer: false)
            window.title = "麦译设置"
            window.isReleasedWhenClosed = false
            window.contentView = NSHostingView(rootView: SettingsView(preferences: preferences, model: model, register: { [weak self] key, modifiers in
                guard let self else { return false }
                return shortcut.register(key: key, modifiers: modifiers) == noErr
            }, permission: { [weak self] in self?.openPermission() }, clipboard: { [weak self] in self?.translateClipboard() }, initialMessage: lastRegistrationSucceeded ? "" : "默认快捷键已被其它应用占用。请选择其它组合并保存。"))
            window.center()
            settingsWindow = window
        }
        settingsWindow?.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    @objc private func openPermission() {
        SelectionReader.requestPermission()
        if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility") { NSWorkspace.shared.open(url) }
    }
    @objc private func quit() { NSApp.terminate(nil) }
    func applicationWillTerminate(_ notification: Notification) {
        model.cancel()
        shortcut.stop()
        if let outsideMonitor { NSEvent.removeMonitor(outsideMonitor) }
        if let keyMonitor { NSEvent.removeMonitor(keyMonitor) }
    }
}
