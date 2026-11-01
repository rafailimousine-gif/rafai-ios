import Foundation
import CoreLocation

/// GPS du chauffeur : suit la voiture pendant la course, y compris en arrière-plan (Waze ouvert, écran verrouillé).
/// - `watch` : la page affiche la position (appli au premier plan)
/// - `trip` : une course est en cours ; en arrière-plan, l'appli envoie elle-même la position au serveur (route drvtrk « ping »)
final class DriverGPS: NSObject, CLLocationManagerDelegate {
    struct Trip: Equatable {
        let ref: String
        let key: String
        let api: String
    }

    private let manager = CLLocationManager()
    private(set) var trip: Trip?
    private var watch = false
    private var running = false
    private var lastPing = Date.distantPast
    private var pinging = false
    private var oneShot: [(CLLocation?, Int) -> Void] = []
    private(set) var last: CLLocation?

    /// position à afficher dans la page
    var onLocation: ((CLLocation) -> Void)?
    /// réponse du serveur à un envoi en arrière-plan (statut de la course)
    var onStatus: (([String: Any]) -> Void)?
    /// l'appli est-elle au premier plan ?
    var isForeground: (() -> Bool)?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = 15
        manager.activityType = .automotiveNavigation
        manager.pausesLocationUpdatesAutomatically = false
    }

    func setWatch(_ on: Bool) {
        watch = on
        update()
    }

    func setTrip(_ t: Trip?) {
        if t != trip { lastPing = .distantPast }
        trip = t
        update()
    }

    /// une position (code : 0 trouvée, 1 refusée, 2 indisponible)
    func request(_ done: @escaping (CLLocation?, Int) -> Void) {
        let st = manager.authorizationStatus
        if st == .denied || st == .restricted { done(nil, 1); return }
        if let l = last, Date().timeIntervalSince(l.timestamp) < 20 { done(l, 0); return }
        oneShot.append(done)
        if st == .notDetermined { manager.requestWhenInUseAuthorization() } else { manager.requestLocation() }
    }

    private func update() {
        let want = watch || trip != nil
        let st = manager.authorizationStatus
        if want && st == .notDetermined { manager.requestWhenInUseAuthorization(); return }
        let ok = st == .authorizedWhenInUse || st == .authorizedAlways
        if want && ok {
            manager.allowsBackgroundLocationUpdates = trip != nil
            manager.showsBackgroundLocationIndicator = trip != nil
            if !running { manager.startUpdatingLocation(); running = true }
        } else if running {
            manager.stopUpdatingLocation()
            manager.allowsBackgroundLocationUpdates = false
            running = false
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let st = manager.authorizationStatus
        if !oneShot.isEmpty {
            if st == .authorizedWhenInUse || st == .authorizedAlways { manager.requestLocation() }
            else if st == .denied || st == .restricted { flush(nil, 1) }
        }
        update()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let l = locations.last else { return }
        last = l
        if !oneShot.isEmpty { flush(l, 0) }
        onLocation?(l)
        pingIfNeeded(l)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        if !oneShot.isEmpty { flush(nil, (error as? CLError)?.code == .denied ? 1 : 2) }
    }

    private func flush(_ l: CLLocation?, _ code: Int) {
        let p = oneShot
        oneShot = []
        p.forEach { $0(l, code) }
    }

    static func parseStatus(_ data: Data?) -> [String: Any]? {
        guard let data = data, let j = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              (j["ok"] as? Bool) == true else { return nil }
        return j["s"] as? [String: Any]
    }

    /// En arrière-plan, la page ne tourne plus : l'appli envoie la position toutes les 12 s environ
    private func pingIfNeeded(_ l: CLLocation) {
        guard let t = trip, !pinging, Date().timeIntervalSince(lastPing) >= 12 else { return }
        if isForeground?() ?? true { return }
        let d: [String: Any] = ["lat": l.coordinate.latitude, "lng": l.coordinate.longitude, "acc": Int(max(0, l.horizontalAccuracy).rounded())]
        guard let dj = try? JSONSerialization.data(withJSONObject: d), let ds = String(data: dj, encoding: .utf8),
              var c = URLComponents(string: t.api) else { return }
        c.queryItems = [URLQueryItem(name: "app", value: "drvtrk"), URLQueryItem(name: "ref", value: t.ref),
                        URLQueryItem(name: "k", value: t.key), URLQueryItem(name: "a", value: "ping"),
                        URLQueryItem(name: "d", value: ds), URLQueryItem(name: "_", value: String(Int(Date().timeIntervalSince1970 * 1000)))]
        guard let url = c.url else { return }
        pinging = true
        lastPing = Date()
        var req = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 20)
        req.httpMethod = "GET"
        URLSession.shared.dataTask(with: req) { [weak self] data, _, _ in
            let status = DriverGPS.parseStatus(data)
            DispatchQueue.main.async {
                guard let self = self else { return }
                self.pinging = false
                if let s = status {
                    self.onStatus?(s)
                    if (s["st"] as? String) == "Terminée" { self.setTrip(nil) }
                }
            }
        }.resume()
    }
}
