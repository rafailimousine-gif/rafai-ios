import SwiftUI
import UIKit
import WebKit
import UserNotifications
import FirebaseCore
import FirebaseMessaging

@main
struct DriverApp: App {
    @UIApplicationDelegateAdaptor(DriverDelegate.self) private var appDelegate
    @StateObject private var web = DriverController.shared

    var body: some Scene {
        WindowGroup {
            DriverRootView()
                .environmentObject(web)
        }
    }
}

/// Notifications de mission (nouvelle course, modification, annulation, message de l'équipe) via Firebase Cloud Messaging
final class DriverDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
    static private(set) var firebaseReady = false

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        if Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil {
            FirebaseApp.configure()
            Messaging.messaging().delegate = self
            DriverDelegate.firebaseReady = true
        }
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        if DriverDelegate.firebaseReady { Messaging.messaging().apnsToken = deviceToken }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {}

    nonisolated func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken, !token.isEmpty else { return }
        Task { @MainActor in DriverController.shared.setPushToken(token) }
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter,
                                            willPresent notification: UNNotification,
                                            withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        Task { @MainActor in DriverController.shared.pushReceived() }
        completionHandler([.banner, .list, .sound])
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter,
                                            didReceive response: UNNotificationResponse,
                                            withCompletionHandler completionHandler: @escaping () -> Void) {
        let info = response.notification.request.content.userInfo
        let url = (info["url"] as? String) ?? (info["link"] as? String)
        Task { @MainActor in DriverController.shared.openFromPush(url) }
        completionHandler()
    }
}
