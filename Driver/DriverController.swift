import SwiftUI
import UIKit
import WebKit
import SafariServices
import UserNotifications
import CoreLocation

/// RL Driver : l'espace chauffeur (team.rafai-limousine.com/chauffeur/) dans une vue web plein écran,
/// avec le GPS de l'iPhone pendant les courses, les notifications de mission et l'ouverture directe de Waze, Téléphone et WhatsApp.
@MainActor
final class DriverController: NSObject, ObservableObject {
    static let shared = DriverController()
    static let host = "team.rafai-limousine.com"
    static let home = URL(string: "https://team.rafai-limousine.com/chauffeur/")!

    @Published var splash = true
    @Published var offline = false

    let webView: WKWebView
    private let content: WKUserContentController
    private var scriptsOn = false
    private var ready = false
    private var pendingHash: String?
    private var pushToken: String?
    private var pushState = "default"
    private var lastStatus: [String: Any]?
    private var faceTried = false
    private var newAuth: String?
    private let gps = DriverGPS()
    private let refresher = UIRefreshControl()

    override init() {
        let uc = WKUserContentController()
        let cfg = WKWebViewConfiguration()
        cfg.userContentController = uc
        cfg.allowsInlineMediaPlayback = true
        cfg.applicationNameForUserAgent = "Mobile/15E148 RLDriver/" + DriverInfo.version
        content = uc
        webView = WKWebView(frame: .zero, configuration: cfg)
        super.init()
        content.add(self, name: "rn")
        setScripts(true)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = UIColor(drv: 0x111113)
        webView.underPageBackgroundColor = UIColor(drv: 0x111113)
        webView.scrollView.backgroundColor = UIColor(drv: 0x111113)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.keyboardDismissMode = .interactive
        webView.allowsLinkPreview = false
        refresher.tintColor = .white
        refresher.addTarget(self, action: #selector(pulled), for: .valueChanged)
        webView.scrollView.refreshControl = refresher
        gps.isForeground = { UIApplication.shared.applicationState == .active }
        gps.onLocation = { [weak self] l in
            guard let self = self, UIApplication.shared.applicationState == .active else { return }
            let d: [String: Any] = ["lat": l.coordinate.latitude, "lng": l.coordinate.longitude, "acc": Int(max(0, l.horizontalAccuracy).rounded())]
            self.js("window.RN&&RN.loc&&RN.loc(\(self.jsJSON(d)))")
        }
        gps.onStatus = { [weak self] s in self?.lastStatus = s }
        NotificationCenter.default.addObserver(self, selector: #selector(becameActive),
                                               name: UIApplication.didBecomeActiveNotification, object: nil)
        load()
        refreshPushState()
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 9_000_000_000)
            self?.hideSplash()
        }
    }

    // MARK: Chargement

    func load() {
        offline = false
        ready = false
        setScripts(true)
        webView.load(URLRequest(url: Self.home, cachePolicy: .useProtocolCachePolicy, timeoutInterval: 30))
    }

    private func setScripts(_ on: Bool) {
        if on == scriptsOn { return }
        scriptsOn = on
        content.removeAllUserScripts()
        guard on else { return }
        content.addUserScript(WKUserScript(source: DriverBridge.start, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        if DriverFaceID.saved {
            content.addUserScript(WKUserScript(source: "window.__rlFace=\(jsString(DriverFaceID.name));",
                                               injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
    }

    private func refreshScripts() {
        scriptsOn = false
        setScripts(true)
    }

    var isOnSite: Bool { (webView.url?.host ?? "").lowercased() == Self.host }

    func hideSplash() {
        guard splash else { return }
        withAnimation(.easeOut(duration: 0.35)) { splash = false }
    }

    // MARK: Échanges avec la page

    fileprivate func handle(_ type: String, _ b: [String: Any]) {
        switch type {
        case "ready":
            ready = true
            offline = false
            hideSplash()
            sendPushState()
            if let h = pendingHash { pendingHash = nil; js("location.hash=\(jsString(h))") }
            let logged = (b["id"] as? Bool) ?? true
            if !logged && DriverFaceID.saved && !faceTried {
                faceTried = true
                Task { @MainActor [weak self] in
                    try? await Task.sleep(nanoseconds: 450_000_000)
                    self?.faceUnlock()
                }
            }
            if logged, let a = newAuth { newAuth = nil; offerFaceID(a) }
        case "gps":
            let on = (b["on"] as? Bool) ?? false
            if on, let ref = b["ref"] as? String, let k = b["k"] as? String, let api = b["api"] as? String {
                gps.setTrip(DriverGPS.Trip(ref: ref, key: k, api: api))
            } else {
                gps.setTrip(nil)
            }
            UIApplication.shared.isIdleTimerDisabled = on
        case "watch":
            gps.setWatch((b["on"] as? Bool) ?? false)
        case "geo":
            if let id = (b["id"] as? NSNumber)?.intValue { geo(id) }
        case "push":
            requestPush()
        case "settings":
            if let u = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(u) }
        case "paste":
            let s = UIPasteboard.general.string ?? ""
            js("window.RN&&RN.pasted(\(jsString(s)))")
        case "faceid":
            faceUnlock()
        case "auth":
            if let a = b["auth"] as? String, a.range(of: #"^[^.]+\.[A-Za-z0-9_-]{16,}$"#, options: .regularExpression) != nil {
                newAuth = a
            }
        case "open":
            if let s = b["url"] as? String, let u = URL(string: s) { route(u) }
        default:
            break
        }
    }

    func js(_ code: String) {
        guard isOnSite else { return }
        webView.evaluateJavaScript(code, completionHandler: nil)
    }

    func jsString(_ s: String) -> String {
        jsJSON([s]).dropFirst().dropLast().description
    }

    func jsJSON(_ obj: Any) -> String {
        guard JSONSerialization.isValidJSONObject(obj),
              let d = try? JSONSerialization.data(withJSONObject: obj),
              let s = String(data: d, encoding: .utf8) else { return "null" }
        return s
    }

    private func geo(_ id: Int) {
        gps.request { [weak self] loc, code in
            guard let self = self else { return }
            if let l = loc {
                let d: [String: Any] = ["lat": l.coordinate.latitude, "lng": l.coordinate.longitude, "acc": Int(max(0, l.horizontalAccuracy).rounded())]
                self.js("window.RN&&RN.geo(\(id),true,\(self.jsJSON(d)))")
            } else {
                self.js("window.RN&&RN.geo(\(id),false,{code:\(code)})")
            }
        }
    }

    // MARK: Face ID

    /// Face ID reconnu : l'accès gardé ouvre directement les missions, sans code e-mail
    func faceUnlock() {
        DriverFaceID.unlock { [weak self] auth in
            guard let self = self else { return }
            if let a = auth {
                let p = self.jsString(a)
                self.js("try{localStorage.setItem('rc_auth',\(p))}catch(e){};location.replace('/chauffeur/'+encodeURIComponent(\(p)))")
            } else {
                self.refreshScripts()
                self.js("window.RLL&&RLL.faceOff&&RLL.faceOff(\(DriverFaceID.saved ? "true" : "false"))")
            }
        }
    }

    /// Après la première connexion par code : proposer Face ID pour les fois suivantes
    private func offerFaceID(_ auth: String) {
        guard DriverFaceID.available, !DriverFaceID.saved else { return }
        let n = DriverFaceID.name
        let a = UIAlertController(title: "Activer \(n) ?",
                                  message: "La prochaine fois, entrez dans RL Driver avec \(n), sans code par e-mail.",
                                  preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "Plus tard", style: .cancel))
        a.addAction(UIAlertAction(title: "Activer \(n)", style: .default) { [weak self] _ in
            if DriverFaceID.save(auth) { self?.refreshScripts() }
        })
        drvTopViewController()?.present(a, animated: true)
    }

    // MARK: Liens

    /// Waze, Plans, Google Maps, WhatsApp, Téléphone → applis de l'iPhone ; documents et autres sites → Safari intégré
    func route(_ url: URL) {
        let scheme = (url.scheme ?? "").lowercased()
        guard scheme == "http" || scheme == "https" else { UIApplication.shared.open(url); return }
        let host = (url.host ?? "").lowercased()
        if host == Self.host && url.path.hasPrefix("/chauffeur") { setScripts(true); webView.load(URLRequest(url: url)); return }
        if Self.isAppLink(url) { UIApplication.shared.open(url); return }
        openSafari(url)
    }

    static func isAppLink(_ url: URL) -> Bool {
        let h = (url.host ?? "").lowercased()
        let p = url.path.lowercased()
        let apps = ["wa.me", "api.whatsapp.com", "whatsapp.com", "www.whatsapp.com", "maps.apple.com", "waze.com",
                    "www.waze.com", "ul.waze.com", "maps.app.goo.gl", "apps.apple.com"]
        if apps.contains(h) { return true }
        if (h == "www.google.com" || h == "google.com" || h.hasPrefix("maps.google.")) && (p.hasPrefix("/maps") || h.hasPrefix("maps.")) { return true }
        return false
    }

    func openSafari(_ url: URL) {
        let s = (url.scheme ?? "").lowercased()
        guard s == "http" || s == "https" else { UIApplication.shared.open(url); return }
        let vc = SFSafariViewController(url: url)
        vc.preferredControlTintColor = UIColor(drv: 0xA9813F)
        vc.dismissButtonStyle = .close
        vc.modalPresentationStyle = .pageSheet
        drvTopViewController()?.present(vc, animated: true)
    }

    // MARK: Notifications

    func refreshPushState() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let st: String
            switch settings.authorizationStatus {
            case .authorized, .provisional, .ephemeral: st = "granted"
            case .denied: st = "denied"
            default: st = "default"
            }
            Task { @MainActor in
                DriverController.shared.pushState = st
                if st == "granted" { UIApplication.shared.registerForRemoteNotifications() }
                DriverController.shared.sendPushState()
            }
        }
    }

    func requestPush() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in
            Task { @MainActor in DriverController.shared.refreshPushState() }
        }
    }

    func sendPushState() {
        var p: [String: Any] = ["s": pushState]
        if let t = pushToken { p["tok"] = t }
        js("window.RN&&RN.push(\(jsJSON(p)))")
    }

    func setPushToken(_ token: String) {
        pushToken = token
        sendPushState()
    }

    func pushReceived() {
        js("window.RN&&RN.pushed&&RN.pushed()")
    }

    func openFromPush(_ s: String?) {
        guard let s = s, let u = URL(string: s), let frag = u.fragment, !frag.isEmpty else { pushReceived(); return }
        if ready && isOnSite { js("location.hash=\(jsString("#" + frag))") }
        else { pendingHash = "#" + frag; if !isOnSite { load() } }
    }

    // MARK: Cycle de vie

    @objc private func pulled() {
        if !isOnSite || !ready { load() } else { js("try{RN.pushed()}catch(e){}") }
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 900_000_000)
            self?.refresher.endRefreshing()
        }
    }

    @objc private func becameActive() {
        UNUserNotificationCenter.current().setBadgeCount(0, withCompletionHandler: nil)
        refreshPushState()
        if offline { load(); return }
        if let s = lastStatus {
            lastStatus = nil
            js("window.RN&&RN.bg&&RN.bg(\(jsJSON(s)))")
        }
        if let l = gps.last {
            let d: [String: Any] = ["lat": l.coordinate.latitude, "lng": l.coordinate.longitude, "acc": Int(max(0, l.horizontalAccuracy).rounded())]
            js("window.RN&&RN.loc&&RN.loc(\(jsJSON(d)))")
        }
    }

    fileprivate func failed(_ error: Error) {
        refresher.endRefreshing()
        let e = error as NSError
        if e.domain == NSURLErrorDomain && e.code == NSURLErrorCancelled { return }
        if e.domain == "WebKitErrorDomain" && (e.code == 102 || e.code == 101) { return }
        let network: Set<Int> = [NSURLErrorNotConnectedToInternet, NSURLErrorNetworkConnectionLost, NSURLErrorTimedOut,
                                 NSURLErrorCannotFindHost, NSURLErrorCannotConnectToHost, NSURLErrorDNSLookupFailed,
                                 NSURLErrorInternationalRoamingOff, NSURLErrorDataNotAllowed, NSURLErrorSecureConnectionFailed]
        if !ready || (e.domain == NSURLErrorDomain && network.contains(e.code)) {
            offline = true
            hideSplash()
        }
    }
}

extension DriverController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let type = body["t"] as? String else { return }
        handle(type, body)
    }
}

extension DriverController: WKNavigationDelegate {
    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        let scheme = (url.scheme ?? "").lowercased()
        if scheme != "http" && scheme != "https" {
            if ["about", "blob", "data", "javascript"].contains(scheme) { decisionHandler(.allow); return }
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        if let frame = navigationAction.targetFrame, !frame.isMainFrame { decisionHandler(.allow); return }
        let host = (url.host ?? "").lowercased()
        if host == Self.host { setScripts(true); decisionHandler(.allow); return }
        if Self.isAppLink(url) { UIApplication.shared.open(url); decisionHandler(.cancel); return }
        openSafari(url)
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        offline = false
        refresher.endRefreshing()
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 2_500_000_000)
            self?.hideSplash()
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        failed(error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        failed(error)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        load()
    }
}

extension DriverController: WKUIDelegate {
    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url { route(url) }
        return nil
    }

    func webView(_ webView: WKWebView,
                 runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping () -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        if let vc = drvTopViewController() { vc.present(a, animated: true) } else { completionHandler() }
    }

    func webView(_ webView: WKWebView,
                 runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (Bool) -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "Annuler", style: .cancel) { _ in completionHandler(false) })
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        if let vc = drvTopViewController() { vc.present(a, animated: true) } else { completionHandler(false) }
    }
}

@MainActor
func drvTopViewController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
    var vc = (scene?.windows.first { $0.isKeyWindow } ?? scene?.windows.first)?.rootViewController
    while let p = vc?.presentedViewController { vc = p }
    return vc
}

enum DriverInfo {
    static var version: String {
        (Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String) ?? "1.0"
    }
}

extension UIColor {
    convenience init(drv rgb: UInt32) {
        self.init(red: CGFloat((rgb >> 16) & 0xFF) / 255, green: CGFloat((rgb >> 8) & 0xFF) / 255,
                  blue: CGFloat(rgb & 0xFF) / 255, alpha: 1)
    }
}
