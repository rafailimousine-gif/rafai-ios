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

/// Ouverture de RL Driver : le R, puis le L, puis DRIVER, puis Rafai Limousine.
struct DriverSplashView: View {
    @State private var r = false
    @State private var l = false
    @State private var badge = false
    @State private var name = false
    @State private var shine = false
    @Environment(\.accessibilityReduceMotion) private var reduce

    private let bg = Color(red: 0x11 / 255, green: 0x11 / 255, blue: 0x13 / 255)
    private let gold = LinearGradient(colors: [Color(red: 0xE8 / 255, green: 0xCB / 255, blue: 0x8A / 255),
                                               Color(red: 0xC9 / 255, green: 0xA0 / 255, blue: 0x63 / 255),
                                               Color(red: 0x9C / 255, green: 0x76 / 255, blue: 0x38 / 255)],
                                      startPoint: .top, endPoint: .bottom)

    private func serif(_ size: CGFloat) -> Font { .custom("Didot-Bold", size: size) }

    var body: some View {
        ZStack {
            bg.ignoresSafeArea()
            VStack(spacing: 0) {
                HStack(alignment: .firstTextBaseline, spacing: -4) {
                    Text("R")
                        .font(serif(104))
                        .foregroundColor(.white)
                        .opacity(r ? 1 : 0)
                        .scaleEffect(r ? 1 : 0.82)
                        .offset(y: r ? 0 : 10)
                    Text("L")
                        .font(serif(104))
                        .foregroundStyle(gold)
                        .opacity(l ? 1 : 0)
                        .offset(x: l ? 0 : 26)
                        .overlay(
                            LinearGradient(colors: [.clear, .white.opacity(0.55), .clear], startPoint: .leading, endPoint: .trailing)
                                .frame(width: 36)
                                .offset(x: shine ? 60 : -60)
                                .opacity(shine ? 0 : 1)
                                .mask(Text("L").font(serif(104)))
                                .allowsHitTesting(false)
                        )
                }
                Text("DRIVER")
                    .font(.system(size: 17, weight: .heavy, design: .default))
                    .tracking(5)
                    .foregroundColor(bg)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 7)
                    .background(Capsule().fill(gold))
                    .scaleEffect(x: badge ? 1 : 0.05, y: 1)
                    .opacity(badge ? 1 : 0)
                    .padding(.top, 2)
                Text("Rafai Limousine")
                    .font(.system(size: 19, weight: .semibold, design: .serif))
                    .tracking(2.5)
                    .foregroundColor(Color(red: 0.86, green: 0.83, blue: 0.77))
                    .opacity(name ? 1 : 0)
                    .offset(y: name ? 0 : 12)
                    .padding(.top, 26)
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("RL Driver, Rafai Limousine")
        }
        .onAppear(perform: play)
    }

    private func play() {
        if reduce { r = true; l = true; badge = true; name = true; return }
        let steps: [(Double, () -> Void)] = [
            (0.10, { withAnimation(.spring(response: 0.55, dampingFraction: 0.78)) { r = true } }),
            (0.55, { withAnimation(.spring(response: 0.55, dampingFraction: 0.8)) { l = true } }),
            (1.05, { withAnimation(.spring(response: 0.5, dampingFraction: 0.75)) { badge = true } }),
            (1.30, { withAnimation(.easeInOut(duration: 0.7)) { shine = true } }),
            (1.50, { withAnimation(.easeOut(duration: 0.6)) { name = true } })
        ]
        for (t, f) in steps { DispatchQueue.main.asyncAfter(deadline: .now() + t, execute: f) }
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
