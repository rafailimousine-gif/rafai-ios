import UIKit
import AuthenticationServices
import CoreLocation

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
