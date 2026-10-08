import SwiftUI

@main struct MacLingoApp: App {
    @NSApplicationDelegateAdaptor(AppController.self) var controller
    var body: some Scene {
        Settings { EmptyView() }
            .commands {
                CommandGroup(replacing: .appSettings) {
                    Button("设置…") { controller.showSettings() }
                        .keyboardShortcut(",")
                }
                CommandMenu("翻译") {
                    Button("翻译剪贴板") { controller.translateClipboard() }
                }
            }
    }
}
