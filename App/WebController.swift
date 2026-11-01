import SwiftUI
import UIKit
import WebKit
import SafariServices
import QuickLook
import UserNotifications
import CoreLocation

enum AppTab: String {
    case book, rides, contact, acc
}

/// Le cœur de l'appli : la page de réservation (booking.rafai-limousine.com) dans une vue web,
/// pilotée par la barre d'onglets native et enrichie par l'iPhone (Apple, notifications, position, factures, appels).
@MainActor
final class WebController: NSObject, ObservableObject {
    static let shared = WebController()
    static let host = "booking.rafai-limousine.com"
    static let home = URL(string: "https://booking.rafai-limousine.com/")!

    @Published var tab: AppTab = .book
    @Published var splash = true
    @Published var offline = false
    @Published var gate = false
    @Published var nativeUI = false
    @Published var badge = ""
    @Published var lang: String = L10n.deviceLang()
    @Published var webLabels: [String: String] = [:]

    let webView: WKWebView
    private let content: WKUserContentController
    private var scriptsOn = false
    private var ready = false
    private var webTab: AppTab = .book
    private var pendingHash: String?
    private var pendingTab: AppTab?
    private var pushToken: String?
    private var pushState = "default"
    private var lastActive = Date()
    private let apple = AppleSignIn()
    private let location = LocationHelper()
    private var preview: PreviewSource?
    private let refresher = UIRefreshControl()

    override init() {
        let uc = WKUserContentController()
        let cfg = WKWebViewConfiguration()
        cfg.userContentController = uc
        cfg.allowsInlineMediaPlayback = true
        cfg.applicationNameForUserAgent = "Mobile/15E148 RafaiApp/" + AppInfo.version
        content = uc
        webView = WKWebView(frame: .zero, configuration: cfg)
        super.init()
        content.add(self, name: "rn")
        setScripts(true)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = UIColor(rgb: 0xF4F0E8)
        webView.underPageBackgroundColor = UIColor(rgb: 0x111113)
        webView.scrollView.backgroundColor = UIColor(rgb: 0xF4F0E8)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.keyboardDismissMode = .interactive
        webView.allowsLinkPreview = false
        webView.allowsBackForwardNavigationGestures = false
        refresher.tintColor = .white
        refresher.addTarget(self, action: #selector(pulled), for: .valueChanged)
        webView.scrollView.refreshControl = refresher
        NotificationCenter.default.addObserver(self, selector: #selector(becameActive),
                                               name: UIApplication.didBecomeActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(resigned),
                                               name: UIApplication.willResignActiveNotification, object: nil)
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

    /// Le petit script de l'appli (« je suis dans l'appli iPhone ») n'est ajouté que sur le site de réservation ;
    /// il est retiré pendant le paiement Stripe pour garder Apple Pay disponible.
    private func setScripts(_ on: Bool) {
        if on == scriptsOn { return }
        scriptsOn = on
        content.removeAllUserScripts()
        guard on else { return }
        content.addUserScript(WKUserScript(source: Bridge.start, injectionTime: .atDocumentStart, forMainFrameOnly: true))
    }

    var isOnSite: Bool { (webView.url?.host ?? "").lowercased() == Self.host }

    func hideSplash() {
        guard splash else { return }
        withAnimation(.easeOut(duration: 0.35)) { splash = false }
    }

    // MARK: Onglets

    func label(_ t: AppTab) -> String {
        if t != .contact, let s = webLabels[t.rawValue], !s.isEmpty { return s }
        return L10n.s(t.rawValue, lang)
    }

    func select(_ t: AppTab) {
        UISelectionFeedbackGenerator().selectionChanged()
        if t == .contact { tab = .contact; return }
        let wasContact = tab == .contact
        tab = t
        if !isOnSite { pendingTab = t; load(); return }
        if !ready { pendingTab = t; return }
        if wasContact && t == webTab { return }
        js("window.RN&&RN.go(\(jsString(t.rawValue)))")
    }

    // MARK: Échanges avec la page

    fileprivate func handle(_ type: String, _ b: [String: Any]) {
        switch type {
        case "ready":
            ready = true
            nativeUI = true
            offline = false
            if let v = b["tab"] as? String, let t = AppTab(rawValue: v) { webTab = t; if tab != .contact { tab = t } }
            hideSplash()
            sendPushState()
            if let h = pendingHash { pendingHash = nil; js("location.hash=\(jsString(h))") }
            if let p = pendingTab { pendingTab = nil; select(p) }
        case "tab":
            if let v = b["v"] as? String, let t = AppTab(rawValue: v) { webTab = t; tab = t }
        case "gate":
            gate = (b["v"] as? Bool) ?? false
        case "badge":
            badge = (b["v"] as? String) ?? ""
        case "labels":
            if let l = b["lang"] as? String { lang = L10n.norm(l) }
            var d: [String: String] = [:]
            for k in ["book", "rides", "acc"] {
                if let s = b[k] as? String, !s.isEmpty { d[k] = s }
            }
            webLabels = d
        case "apple":
            startApple()
        case "push":
            requestPush()
        case "settings":
            openSettings()
        case "geo":
            if let id = (b["id"] as? NSNumber)?.intValue { geo(id) }
        case "file":
            if let b64 = b["b64"] as? String { showFile((b["name"] as? String) ?? "Facture.pdf", b64) }
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

    // MARK: Liens

    /// Liens : appels, e-mails, WhatsApp, Plans, Waze → applis de l'iPhone ; autres sites → Safari intégré.
    func route(_ url: URL) {
        let scheme = (url.scheme ?? "").lowercased()
        guard scheme == "http" || scheme == "https" else { UIApplication.shared.open(url); return }
        let host = (url.host ?? "").lowercased()
        if host == Self.host { setScripts(true); webView.load(URLRequest(url: url)); return }
        if Self.isAppLink(url) { UIApplication.shared.open(url); return }
        openSafari(url)
    }

    func openURL(_ s: String) {
        if let u = URL(string: s) { route(u) }
    }

    static func isAppLink(_ url: URL) -> Bool {
        let h = (url.host ?? "").lowercased()
        let p = url.path.lowercased()
        let apps = ["wa.me", "api.whatsapp.com", "whatsapp.com", "www.whatsapp.com", "maps.apple.com", "waze.com",
                    "www.waze.com", "ul.waze.com", "instagram.com", "www.instagram.com", "apps.apple.com", "maps.app.goo.gl"]
        if apps.contains(h) { return true }
        if (h == "www.google.com" || h == "google.com" || h.hasPrefix("maps.google.")) && (p.hasPrefix("/maps") || h.hasPrefix("maps.")) { return true }
        return false
    }

    static func isPayHost(_ h: String) -> Bool {
        h == "stripe.com" || h.hasSuffix(".stripe.com") || h.hasSuffix(".stripe.network") || h.hasSuffix(".stripecdn.com")
    }

    func openSafari(_ url: URL) {
        let s = (url.scheme ?? "").lowercased()
        guard s == "http" || s == "https" else { UIApplication.shared.open(url); return }
        let vc = SFSafariViewController(url: url)
        vc.preferredControlTintColor = UIColor(rgb: 0xA9813F)
        vc.dismissButtonStyle = .close
        vc.modalPresentationStyle = .pageSheet
        topViewController()?.present(vc, animated: true)
    }

    func openSettings() {
        if let u = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(u) }
    }

    // MARK: Connexion avec Apple

    private func startApple() {
        apple.start(anchor: keyWindow()) { [weak self] token, first, last, error in
            guard let self = self else { return }
            if let token = token {
                self.js("window.RN&&RN.appleDone(\(self.jsJSON(["t": token, "fn": first, "ln": last])))")
            } else {
                self.js("window.RN&&RN.appleErr(\(self.jsString(error ?? "fail")))")
            }
        }
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
                WebController.shared.pushState = st
                if st == "granted" { UIApplication.shared.registerForRemoteNotifications() }
                WebController.shared.sendPushState()
            }
        }
    }

    func requestPush() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in
            Task { @MainActor in WebController.shared.refreshPushState() }
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
        guard let s = s, let u = URL(string: s) else { select(.rides); return }
        let host = (u.host ?? "").lowercased()
        if host == Self.host, let frag = u.fragment, !frag.isEmpty {
            tab = .rides
            if ready && isOnSite { js("location.hash=\(jsString("#" + frag))") }
            else { pendingHash = "#" + frag; if !isOnSite { load() } }
        } else {
            select(.rides)
        }
    }

    // MARK: Position

    private func geo(_ id: Int) {
        location.request { [weak self] loc, code in
            guard let self = self else { return }
            if let l = loc {
                let d: [String: Any] = ["lat": l.coordinate.latitude, "lng": l.coordinate.longitude, "acc": l.horizontalAccuracy]
                self.js("window.RN&&RN.geo(\(id),true,\(self.jsJSON(d)))")
            } else {
                self.js("window.RN&&RN.geo(\(id),false,{code:\(code)})")
            }
        }
    }

    // MARK: Factures

    private func showFile(_ name: String, _ b64: String) {
        guard let data = Data(base64Encoded: b64, options: .ignoreUnknownCharacters) else { return }
        var safe = name.replacingOccurrences(of: "/", with: "-").replacingOccurrences(of: ":", with: "-")
        if safe.isEmpty { safe = "Facture.pdf" }
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(safe)
        do { try data.write(to: url, options: .atomic) } catch { return }
        let src = PreviewSource(url: url)
        preview = src
        let q = QLPreviewController()
        q.dataSource = src
        topViewController()?.present(q, animated: true)
    }

    // MARK: Cycle de vie

    @objc private func pulled() {
        if !isOnSite || !ready { load() } else { js("window.RN&&RN.refresh()") }
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 900_000_000)
            self?.refresher.endRefreshing()
        }
    }

    @objc private func becameActive() {
        UNUserNotificationCenter.current().setBadgeCount(0, withCompletionHandler: nil)
        refreshPushState()
        if offline { load(); return }
        if Date().timeIntervalSince(lastActive) > 300 { js("window.RN&&RN.refresh()") }
    }

    @objc private func resigned() {
        lastActive = Date()
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

// MARK: - Messages de la page

extension WebController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let type = body["t"] as? String else { return }
        handle(type, body)
    }
}

// MARK: - Navigation

extension WebController: WKNavigationDelegate {
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
        // cadres intégrés (carte de suivi, 3-D Secure…) : toujours dans la page
        if let frame = navigationAction.targetFrame, !frame.isMainFrame { decisionHandler(.allow); return }
        let host = (url.host ?? "").lowercased()
        if host == Self.host { setScripts(true); decisionHandler(.allow); return }
        if Self.isAppLink(url) { UIApplication.shared.open(url); decisionHandler(.cancel); return }
        // paiement Stripe (et ses étapes bancaires) : dans l'appli, retour automatique sur la course
        if Self.isPayHost(host) || !isOnSite { setScripts(false); decisionHandler(.allow); return }
        openSafari(url)
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        offline = false
        refresher.endRefreshing()
        if !isOnSite { hideSplash() }
        // ancienne version de la page (sans le mode appli) : on garde la page telle quelle
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 2_500_000_000)
            guard let self = self else { return }
            if self.isOnSite && !self.ready { self.nativeUI = false; self.hideSplash() }
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

// MARK: - Fenêtres et alertes de la page

extension WebController: WKUIDelegate {
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
        if let vc = topViewController() { vc.present(a, animated: true) } else { completionHandler() }
    }

    func webView(_ webView: WKWebView,
                 runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (Bool) -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: L10n.s("cancel", lang), style: .cancel) { _ in completionHandler(false) })
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        if let vc = topViewController() { vc.present(a, animated: true) } else { completionHandler(false) }
    }
}

// MARK: - Aperçu des factures

final class PreviewSource: NSObject, QLPreviewControllerDataSource {
    let url: URL
    init(url: URL) { self.url = url }
    func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }
    func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem { url as NSURL }
}

// MARK: - Outils

@MainActor
func keyWindow() -> UIWindow? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
    return scene?.windows.first { $0.isKeyWindow } ?? scene?.windows.first
}

@MainActor
func topViewController() -> UIViewController? {
    var vc = keyWindow()?.rootViewController
    while let p = vc?.presentedViewController { vc = p }
    return vc
}

enum AppInfo {
    static var version: String {
        (Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String) ?? "1.0"
    }
    static var build: String {
        (Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String) ?? "1"
    }
}

extension UIColor {
    convenience init(rgb: UInt32) {
        self.init(red: CGFloat((rgb >> 16) & 0xFF) / 255, green: CGFloat((rgb >> 8) & 0xFF) / 255,
                  blue: CGFloat(rgb & 0xFF) / 255, alpha: 1)
    }
}
