import SwiftUI
import WebKit

extension Color {
    init(rgb: UInt32) {
        self.init(red: Double((rgb >> 16) & 0xFF) / 255, green: Double((rgb >> 8) & 0xFF) / 255, blue: Double(rgb & 0xFF) / 255)
    }
    static let ink = Color(rgb: 0x111113)
    static let paper = Color(rgb: 0xF4F0E8)
    static let gold = Color(rgb: 0xC9A063)
    static let gold2 = Color(rgb: 0xA9813F)
    static let goldLight = Color(rgb: 0xE0BA6C)
    static let mut = Color(rgb: 0x6E6E73)
    static let line = Color(rgb: 0xE9E2D4)
}

enum Contact {
    static let phone = "+33 6 67 09 94 94"
    static let tel = "tel:+33667099494"
    static let whatsapp = "https://wa.me/33667099494"
    static let email = "contact@rafai-limousine.com"
    static let web = "https://www.rafai-limousine.com"
    static let instagram = "https://www.instagram.com/rafailimousine"
    static let address = "99 av. Achille Peretti, 92200 Neuilly-sur-Seine"
    static let maps = "https://maps.apple.com/?q=Rafai%20Limousine&address=99%20Avenue%20Achille%20Peretti,%2092200%20Neuilly-sur-Seine"
    static let cgv = "https://booking.rafai-limousine.com/cgv/"
    static let privacy = "https://booking.rafai-limousine.com/confidentialite/"
}

struct RootView: View {
    @EnvironmentObject var web: WebController

    var body: some View {
        ZStack {
            Color.ink.ignoresSafeArea()
            VStack(spacing: 0) {
                ZStack {
                    WebHost(webView: web.webView)
                        .ignoresSafeArea(.container, edges: showBar ? [.top] : [.top, .bottom])
                    if web.tab == .contact && showBar {
                        ContactView()
                    }
                    if web.offline {
                        OfflineView()
                    }
                }
                if showBar {
                    TabBar()
                }
            }
            if web.splash {
                SplashView()
                    .transition(.opacity)
            }
        }
        .ignoresSafeArea(.keyboard)
        .environment(\.layoutDirection, web.lang == "ar" ? .rightToLeft : .leftToRight)
    }

    private var showBar: Bool { web.nativeUI && !web.gate && !web.offline }
}

/// La page de réservation (une seule vue web pour toute l'appli)
struct WebHost: UIViewRepresentable {
    let webView: WKWebView
    func makeUIView(context: Context) -> WKWebView { webView }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

struct TabBar: View {
    @EnvironmentObject var web: WebController

    var body: some View {
        HStack(spacing: 0) {
            item(.book, "car.fill")
            item(.rides, "calendar", badge: web.badge)
            item(.contact, "phone.fill")
            item(.acc, "person.crop.circle")
        }
        .padding(.top, 7)
        .padding(.bottom, 3)
        .background(Color.white.ignoresSafeArea(edges: .bottom))
        .overlay(alignment: .top) { Rectangle().fill(Color.line).frame(height: 0.5) }
    }

    private func item(_ t: AppTab, _ symbol: String, badge: String = "") -> some View {
        let on = web.tab == t
        return Button {
            web.select(t)
        } label: {
            VStack(spacing: 3) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: symbol)
                        .font(.system(size: 21, weight: on ? .semibold : .regular))
                        .frame(width: 34, height: 26)
                    if !badge.isEmpty {
                        let dot = badge == "•"
                        Text(dot ? "" : badge)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, dot ? 0 : 4)
                            .frame(minWidth: dot ? 9 : 17, minHeight: dot ? 9 : 17)
                            .background(Capsule().fill(Color(rgb: 0xC2410C)))
                            .offset(x: 6, y: -3)
                    }
                }
                Text(web.label(t))
                    .font(.system(size: 11, weight: on ? .semibold : .medium))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 3)
            .foregroundColor(on ? .gold2 : .mut)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(web.label(t))
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

struct ContactView: View {
    @EnvironmentObject var web: WebController

    private func s(_ k: String) -> String { L10n.s(k, web.lang) }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                VStack(spacing: 10) {
                    Image("LaunchLogo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 120)
                        .padding(.top, 18)
                        .accessibilityLabel("Rafai Limousine")
                    Text(s("tagline"))
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.white)
                    Text(s("avail"))
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.goldLight)
                }
                .frame(maxWidth: .infinity)
                .padding(.bottom, 26)
                .background(Color.ink.ignoresSafeArea(edges: .top))

                VStack(spacing: 14) {
                    Button { web.openURL(Contact.tel) } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "phone.fill")
                            VStack(alignment: .leading, spacing: 1) {
                                Text(s("call")).font(.system(size: 17, weight: .bold))
                                Text(Contact.phone).font(.system(size: 13, weight: .medium)).opacity(0.75)
                                    .environment(\.layoutDirection, .leftToRight)
                            }
                            Spacer(minLength: 0)
                            Image(systemName: "chevron.forward").font(.system(size: 14, weight: .semibold)).opacity(0.6)
                        }
                        .foregroundColor(.ink)
                        .padding(.horizontal, 18)
                        .frame(minHeight: 62)
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(LinearGradient(colors: [Color(rgb: 0xE2C072), Color(rgb: 0xB68F3E)], startPoint: .top, endPoint: .bottom))
                        )
                    }
                    .buttonStyle(.plain)

                    card {
                        row("message.fill", s("whatsapp"), Contact.phone) { web.openURL(Contact.whatsapp) }
                        Divider().padding(.leading, 52)
                        row("envelope.fill", s("email"), Contact.email) { web.openURL("mailto:" + Contact.email) }
                        Divider().padding(.leading, 52)
                        row("globe", s("web"), "rafai-limousine.com") { web.openURL(Contact.web) }
                        Divider().padding(.leading, 52)
                        row("camera.fill", s("insta"), "@rafailimousine") { web.openURL(Contact.instagram) }
                    }

                    card {
                        row("mappin.and.ellipse", s("office"), Contact.address) { web.openURL(Contact.maps) }
                    }

                    card {
                        row("doc.text.fill", s("cgv"), nil) { web.openURL(Contact.cgv) }
                        Divider().padding(.leading, 52)
                        row("lock.fill", s("privacy"), nil) { web.openURL(Contact.privacy) }
                    }

                    Text("Rafai Limousine SAS · EVTC092230979\n\(s("version")) \(AppInfo.version) (\(AppInfo.build))")
                        .font(.system(size: 12))
                        .foregroundColor(.mut)
                        .multilineTextAlignment(.center)
                        .padding(.top, 6)
                        .padding(.bottom, 24)
                }
                .padding(16)
            }
        }
        .background(
            VStack(spacing: 0) {
                Color.ink.frame(height: 300)
                Color.paper
            }
            .ignoresSafeArea()
        )
    }

    private func card<C: View>(@ViewBuilder _ c: () -> C) -> some View {
        VStack(spacing: 0) { c() }
            .background(RoundedRectangle(cornerRadius: 16).fill(Color.white))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.line, lineWidth: 1))
    }

    private func row(_ icon: String, _ title: String, _ detail: String?, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.gold2)
                    .frame(width: 26)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.system(size: 16, weight: .semibold)).foregroundColor(.ink)
                    if let d = detail {
                        Text(d).font(.system(size: 13)).foregroundColor(.mut).lineLimit(2)
                    }
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.forward").font(.system(size: 13, weight: .semibold)).foregroundColor(Color(rgb: 0xA3A3A8))
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

struct OfflineView: View {
    @EnvironmentObject var web: WebController

    var body: some View {
        VStack(spacing: 14) {
            Image("LaunchLogo")
                .resizable()
                .scaledToFit()
                .frame(width: 96)
                .padding(.bottom, 10)
            Image(systemName: "wifi.slash")
                .font(.system(size: 30, weight: .semibold))
                .foregroundColor(.goldLight)
            Text(L10n.s("offT", web.lang))
                .font(.system(size: 21, weight: .bold))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
            Text(L10n.s("offS", web.lang))
                .font(.system(size: 15))
                .foregroundColor(Color(rgb: 0xC9C3B8))
                .multilineTextAlignment(.center)
                .padding(.bottom, 8)
            Button { web.load() } label: {
                Text(L10n.s("retry", web.lang))
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(.ink)
                    .frame(maxWidth: .infinity, minHeight: 54)
                    .background(RoundedRectangle(cornerRadius: 16).fill(Color.gold))
            }
            .buttonStyle(.plain)
            Button { web.openURL(Contact.tel) } label: {
                Label(L10n.s("call", web.lang) + " · " + Contact.phone, systemImage: "phone.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity, minHeight: 54)
                    .background(RoundedRectangle(cornerRadius: 16).stroke(Color(rgb: 0x3A3A3F), lineWidth: 1))
            }
            .buttonStyle(.plain)
        }
        .padding(28)
        .frame(maxWidth: 460)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.ink.ignoresSafeArea())
    }
}

/// Même image que l'écran de lancement, pour une transition sans coupure
struct SplashView: View {
    @State private var spin = false

    var body: some View {
        ZStack {
            Color.ink.ignoresSafeArea()
            Image("LaunchLogo")
            VStack {
                Spacer()
                ProgressView()
                    .tint(.goldLight)
                    .opacity(spin ? 1 : 0)
                    .padding(.bottom, 60)
            }
        }
        .onAppear {
            withAnimation(.easeIn(duration: 0.4).delay(1.2)) { spin = true }
        }
    }
}
