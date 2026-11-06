import Foundation
import LocalAuthentication
import Security

/// RL Driver : entrer sans code grâce à Face ID (ou Touch ID).
/// Après une connexion par code e-mail, l'appli garde l'accès du chauffeur (ID.clé) dans le trousseau de l'iPhone,
/// protégé par Face ID : il ne peut être relu qu'après un visage reconnu. Rien ne quitte le téléphone.
enum DriverFaceID {
    private static let service = "com.rafailimousine.driver.auth"
    private static let account = "rc_auth"
    private static let flag = "rl_faceid_on"

    /// Face ID ou Touch ID configuré sur cet iPhone
    static var available: Bool {
        var e: NSError?
        return LAContext().canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &e)
    }

    static var name: String {
        let c = LAContext()
        var e: NSError?
        _ = c.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &e)
        return c.biometryType == .touchID ? "Touch ID" : "Face ID"
    }

    /// Un accès est gardé (sans le relire, donc sans déclencher Face ID)
    static var saved: Bool { UserDefaults.standard.bool(forKey: flag) && available }

    @discardableResult
    static func save(_ auth: String) -> Bool {
        remove()
        guard let ac = SecAccessControlCreateWithFlags(nil, kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
                                                       .biometryCurrentSet, nil) else { return false }
        let q: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: Data(auth.utf8),
            kSecAttrAccessControl as String: ac
        ]
        let ok = SecItemAdd(q as CFDictionary, nil) == errSecSuccess
        UserDefaults.standard.set(ok, forKey: flag)
        return ok
    }

    static func remove() {
        let q: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(q as CFDictionary)
        UserDefaults.standard.set(false, forKey: flag)
    }

    /// Demande Face ID puis relit l'accès gardé. `done(nil)` si refusé, annulé ou plus valable.
    static func unlock(_ done: @escaping @MainActor (String?) -> Void) {
        let ctx = LAContext()
        ctx.localizedCancelTitle = "Code par e-mail"
        ctx.localizedFallbackTitle = ""
        ctx.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
                           localizedReason: "Entrer dans RL Driver sans code") { ok, _ in
            var out: String?
            if ok {
                let q: [String: Any] = [
                    kSecClass as String: kSecClassGenericPassword,
                    kSecAttrService as String: service,
                    kSecAttrAccount as String: account,
                    kSecReturnData as String: true,
                    kSecMatchLimit as String: kSecMatchLimitOne,
                    kSecUseAuthenticationContext as String: ctx
                ]
                var item: CFTypeRef?
                let st = SecItemCopyMatching(q as CFDictionary, &item)
                if st == errSecSuccess, let d = item as? Data { out = String(data: d, encoding: .utf8) }
                if out == nil { UserDefaults.standard.set(false, forKey: flag) }
            }
            let res = out
            Task { @MainActor in done(res) }
        }
    }
}
