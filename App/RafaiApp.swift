import SwiftUI

@main
struct RafaiApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var web = WebController.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(web)
        }
    }
}
