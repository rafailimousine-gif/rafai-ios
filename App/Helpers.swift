import UIKit
import AuthenticationServices
import CoreLocation
import CryptoKit
import Security

/// Connexion avec Apple (Face ID) : renvoie le jeton d'identité que le serveur vérifie (route « capple »).
final class AppleSignIn: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    private var done: ((String?, String, String, String?) -> Void)?
    private var controller: ASAuthorizationController?
    private var anchor: UIWindow?

    func start(anchor: UIWindow?, _ done: @escaping (String?, String, String, String?) -> Void) {
        self.done = done
        self.anchor = anchor
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        let c = ASAuthorizationController(authorizationRequests: [request])
        c.delegate = self
        c.presentationContextProvider = self
        controller = c
        c.performRequests()
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let cred = authorization.credential as? ASAuthorizationAppleIDCredential,
              let data = cred.identityToken,
              let token = String(data: data, encoding: .utf8) else {
            finish(nil, "", "", "token")
            return
        }
        finish(token, cred.fullName?.givenName ?? "", cred.fullName?.familyName ?? "", nil)
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        let canceled = (error as? ASAuthorizationError)?.code == .canceled
        finish(nil, "", "", canceled ? "cancel" : "fail")
    }

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        if let w = anchor { return w }
        return ASPresentationAnchor()
    }

    private func finish(_ token: String?, _ first: String, _ last: String, _ error: String?) {
        let d = done
        done = nil
        controller = nil
        d?(token, first, last, error)
    }
}

/// Connexion avec Google : Google interdit sa connexion dans une page intégrée, elle s'ouvre donc dans la fenêtre
/// sécurisée de l'iPhone. Le code reçu (protégé par PKCE) est échangé contre le jeton d'identité que le serveur vérifie (route « cgoogle »).
final class GoogleSignIn: NSObject, ASWebAuthenticationPresentationContextProviding {
    /// identifiant OAuth « iOS » du projet Google rafai-suivi (public, sans secret)
    static let clientID = "1010543786852-i8d9pqepgcqlj7np6hie6odloh75g054.apps.googleusercontent.com"
    static var scheme: String {
        "com.googleusercontent.apps." + clientID.replacingOccurrences(of: ".apps.googleusercontent.com", with: "")
    }

    private var session: ASWebAuthenticationSession?
    private var anchor: UIWindow?
    private var done: ((String?, String?) -> Void)?

    func start(anchor: UIWindow?, lang: String, _ done: @escaping (String?, String?) -> Void) {
        if self.done != nil { return }
        self.anchor = anchor
        self.done = done
        let verifier = Self.random(48)
        let challenge = Self.b64url(Data(SHA256.hash(data: Data(verifier.utf8))))
        let state = Self.random(16)
        let redirect = Self.scheme + ":/oauth2redirect"
        var c = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        c.queryItems = [
            URLQueryItem(name: "client_id", value: Self.clientID),
            URLQueryItem(name: "redirect_uri", value: redirect),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: "openid email profile"),
            URLQueryItem(name: "code_challenge", value: challenge),
            URLQueryItem(name: "code_challenge_method", value: "S256"),
            URLQueryItem(name: "state", value: state),
            URLQueryItem(name: "prompt", value: "select_account"),
            URLQueryItem(name: "hl", value: lang)
        ]
        guard let url = c.url else { finish(nil, "fail"); return }
        let s = ASWebAuthenticationSession(url: url, callbackURLScheme: Self.scheme) { [weak self] cb, error in
            DispatchQueue.main.async {
                guard let self = self else { return }
                if let e = error as? ASWebAuthenticationSessionError, e.code == .canceledLogin { self.finish(nil, "cancel"); return }
                let q = cb.flatMap { URLComponents(url: $0, resolvingAgainstBaseURL: false)?.queryItems } ?? []
                guard q.first(where: { $0.name == "state" })?.value == state,
                      let code = q.first(where: { $0.name == "code" })?.value, !code.isEmpty else {
                    self.finish(nil, q.first(where: { $0.name == "error" })?.value == "access_denied" ? "cancel" : "fail")
                    return
                }
                self.exchange(code: code, verifier: verifier, redirect: redirect)
            }
        }
        s.presentationContextProvider = self
        s.prefersEphemeralWebBrowserSession = false
        session = s
        if !s.start() { finish(nil, "fail") }
    }

    private func exchange(code: String, verifier: String, redirect: String) {
        guard let u = URL(string: "https://oauth2.googleapis.com/token") else { finish(nil, "fail"); return }
        var req = URLRequest(url: u, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30)
        req.httpMethod = "POST"
        req.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        let p: [(String, String)] = [("code", code), ("client_id", Self.clientID), ("redirect_uri", redirect),
                                     ("code_verifier", verifier), ("grant_type", "authorization_code")]
        req.httpBody = p.map { "\($0.0)=\(Self.enc($0.1))" }.joined(separator: "&").data(using: .utf8)
        URLSession.shared.dataTask(with: req) { [weak self] data, _, _ in
            var tok: String?
            if let data = data, let j = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] {
                tok = j["id_token"] as? String
            }
            DispatchQueue.main.async { self?.finish(tok, tok == nil ? "fail" : nil) }
        }.resume()
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        if let w = anchor { return w }
        return ASPresentationAnchor()
    }

    private func finish(_ token: String?, _ error: String?) {
        let d = done
        done = nil
        session = nil
        d?(token, error)
    }

    private static func random(_ n: Int) -> String {
        var b = [UInt8](repeating: 0, count: n)
        if SecRandomCopyBytes(kSecRandomDefault, n, &b) != errSecSuccess {
            b = (0..<n).map { _ in UInt8.random(in: 0...255) }
        }
        return b64url(Data(b))
    }

    private static func b64url(_ d: Data) -> String {
        d.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    private static func enc(_ s: String) -> String {
        s.addingPercentEncoding(withAllowedCharacters: CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "-._~"))) ?? s
    }
}

/// Position du client (adresse de prise en charge) : une seule autorisation, celle de l'iPhone.
final class LocationHelper: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var pending: [(CLLocation?, Int) -> Void] = []

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters
    }

    /// code : 0 = position trouvée, 1 = refusée, 2 = indisponible
    func request(_ done: @escaping (CLLocation?, Int) -> Void) {
        let status = manager.authorizationStatus
        if status == .denied || status == .restricted { done(nil, 1); return }
        pending.append(done)
        if status == .notDetermined { manager.requestWhenInUseAuthorization() } else { manager.requestLocation() }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard !pending.isEmpty else { return }
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways: manager.requestLocation()
        case .denied, .restricted: flush(nil, 1)
        default: break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        if let l = locations.last { flush(l, 0) } else { flush(nil, 2) }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        let denied = (error as? CLError)?.code == .denied
        flush(nil, denied ? 1 : 2)
    }

    private func flush(_ l: CLLocation?, _ code: Int) {
        let p = pending
        pending = []
        p.forEach { $0(l, code) }
    }
}
