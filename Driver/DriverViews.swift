import SwiftUI
import WebKit

struct DriverRootView: View {
    @EnvironmentObject var web: DriverController

    var body: some View {
        ZStack {
            Color(red: 0x11 / 255, green: 0x11 / 255, blue: 0x13 / 255).ignoresSafeArea()
            DriverWebHost(webView: web.webView)
                .ignoresSafeArea()
            if web.offline {
                DriverOfflineView()
            }
            if web.splash {
                DriverSplashView()
                    .transition(.opacity)
            }
        }
        .ignoresSafeArea(.keyboard)
    }
}

struct DriverWebHost: UIViewRepresentable {
    let webView: WKWebView
    func makeUIView(context: Context) -> WKWebView { webView }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

struct DriverSplashView: View {
    var body: some View {
        ZStack {
            Color(red: 0x11 / 255, green: 0x11 / 255, blue: 0x13 / 255).ignoresSafeArea()
            Image("LaunchLogo")
        }
    }
}

struct DriverOfflineView: View {
    @EnvironmentObject var web: DriverController
    private let gold = Color(red: 0xC9 / 255, green: 0xA0 / 255, blue: 0x63 / 255)

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "wifi.slash")
                .font(.system(size: 34, weight: .semibold))
                .foregroundColor(gold)
            Text("Pas de connexion internet")
                .font(.system(size: 21, weight: .bold))
                .foregroundColor(.white)
            Text("Vos missions s’afficheront dès que le réseau revient. En cas d’urgence, appelez Rafai Limousine.")
                .font(.system(size: 15))
                .foregroundColor(Color(red: 0.79, green: 0.76, blue: 0.72))
                .multilineTextAlignment(.center)
                .padding(.bottom, 8)
            Button { web.load() } label: {
                Text("Réessayer")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(Color(red: 0x11 / 255, green: 0x11 / 255, blue: 0x13 / 255))
                    .frame(maxWidth: .infinity, minHeight: 54)
                    .background(RoundedRectangle(cornerRadius: 16).fill(gold))
            }
            .buttonStyle(.plain)
            Button {
                if let u = URL(string: "tel:+33667099494") { UIApplication.shared.open(u) }
            } label: {
                Label("Appeler Rafai Limousine", systemImage: "phone.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity, minHeight: 54)
                    .background(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.2), lineWidth: 1))
            }
            .buttonStyle(.plain)
        }
        .padding(28)
        .frame(maxWidth: 460)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(red: 0x11 / 255, green: 0x11 / 255, blue: 0x13 / 255).ignoresSafeArea())
    }
}
