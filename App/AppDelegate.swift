import UIKit
import UserNotifications
import FirebaseCore
import FirebaseMessaging

/// Notifications : l'iPhone reçoit les alertes de course (confirmée, chauffeur en route, chauffeur arrivé) via Firebase Cloud Messaging.
/// Si le fichier GoogleService-Info.plist n'est pas encore dans l'appli, tout fonctionne sauf l'envoi du jeton au serveur.
final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
    static private(set) var firebaseReady = false

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        if Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil {
            FirebaseApp.configure()
            Messaging.messaging().delegate = self
            AppDelegate.firebaseReady = true
        }
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        if AppDelegate.firebaseReady {
            Messaging.messaging().apnsToken = deviceToken
        }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {}

    // Jeton Firebase : transmis à la page, qui l'enregistre sur le compte du client
    nonisolated func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken, !token.isEmpty else { return }
        Task { @MainActor in WebController.shared.setPushToken(token) }
    }

    // Notification reçue pendant que l'appli est ouverte : bandeau + actualisation des courses
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter,
                                            willPresent notification: UNNotification,
                                            withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        Task { @MainActor in WebController.shared.pushReceived() }
        completionHandler([.banner, .list, .sound])
    }

    // Toucher la notification : ouvre la course concernée
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter,
                                            didReceive response: UNNotificationResponse,
                                            withCompletionHandler completionHandler: @escaping () -> Void) {
        let info = response.notification.request.content.userInfo
        let url = (info["url"] as? String) ?? (info["link"] as? String)
        Task { @MainActor in WebController.shared.openFromPush(url) }
        completionHandler()
    }
}
