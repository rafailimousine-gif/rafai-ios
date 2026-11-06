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

/// Ouverture de RL Driver, façon générique de film : le R arrive avec un impact, puis le L,
/// un trait de lumière traverse l'écran, DRIVER apparaît, puis « RAFAI LIMOUSINE ».
/// Les trois morceaux (LogoR, LogoL, LogoDriver) sont découpés dans le vrai logo et se superposent exactement.
struct DriverSplashView: View {
    @State private var glow = false
    @State private var r = false
    @State private var l = false
    @State private var badge = false
    @State private var name = false
    @State private var flash: Double = 0
    @State private var shake: CGFloat = 0
    @State private var flare: CGFloat = -1.2
    @State private var flareOn = false
    @Environment(\.accessibilityReduceMotion) private var reduce

    private let bg = Color(red: 0x11 / 255, green: 0x11 / 255, blue: 0x13 / 255)
    private let gold = Color(red: 0xC9 / 255, green: 0xA0 / 255, blue: 0x63 / 255)
    private let goldLight = Color(red: 0xF3 / 255, green: 0xD9 / 255, blue: 0xA6 / 255)

    var body: some View {
        GeometryReader { geo in
            ZStack {
                bg.ignoresSafeArea()
                RadialGradient(colors: [gold.opacity(0.30), .clear], center: .center, startRadius: 0, endRadius: 280)
                    .scaleEffect(glow ? 1 : 0.5)
                    .opacity(glow ? 1 : 0)
                    .offset(y: -40)
                VStack(spacing: 26) {
                    ZStack {
                        Image("LogoR").resizable().scaledToFit()
                            .scaleEffect(r ? 1 : 2.6, anchor: UnitPoint(x: 0.33, y: 0.26))
                            .blur(radius: r ? 0 : 16)
                            .opacity(r ? 1 : 0)
                        Image("LogoL").resizable().scaledToFit()
                            .scaleEffect(l ? 1 : 1.8, anchor: UnitPoint(x: 0.74, y: 0.26))
                            .offset(x: l ? 0 : 170)
                            .blur(radius: l ? 0 : 14)
                            .opacity(l ? 1 : 0)
                        Image("LogoDriver").resizable().scaledToFit()
                            .scaleEffect(badge ? 1 : 0.2, anchor: UnitPoint(x: 0.5, y: 0.88))
                            .opacity(badge ? 1 : 0)
                    }
                    .frame(width: 236)
                    Text("RAFAI LIMOUSINE")
                        .font(.system(size: 14, weight: .semibold))
                        .tracking(name ? 7 : 1)
                        .foregroundColor(Color(red: 0.86, green: 0.83, blue: 0.77))
                        .opacity(name ? 1 : 0)
                }
                .offset(x: shake)
                Capsule()
                    .fill(LinearGradient(colors: [.clear, goldLight.opacity(0.85), .white, goldLight.opacity(0.85), .clear],
                                         startPoint: .leading, endPoint: .trailing))
                    .frame(width: geo.size.width * 0.95, height: 3)
                    .shadow(color: goldLight.opacity(0.9), radius: 12)
                    .blur(radius: 0.6)
                    .offset(x: flare * geo.size.width, y: -62)
                    .opacity(flareOn ? 1 : 0)
                Color.white.opacity(flash).ignoresSafeArea().allowsHitTesting(false)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("RL Driver, Rafai Limousine")
        .onAppear(perform: play)
    }

    private func impact() {
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        flash = 0.22
        shake = 8
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.03) {
            withAnimation(.easeOut(duration: 0.28)) { flash = 0 }
            withAnimation(.interpolatingSpring(stiffness: 700, damping: 9)) { shake = 0 }
        }
    }

    private func play() {
        if reduce { glow = true; r = true; l = true; badge = true; name = true; return }
        let steps: [(Double, () -> Void)] = [
            (0.05, { withAnimation(.easeOut(duration: 0.9)) { glow = true } }),
            (0.15, { withAnimation(.easeIn(duration: 0.24)) { r = true } }),
            (0.39, { impact() }),
            (0.62, { withAnimation(.easeIn(duration: 0.22)) { l = true } }),
            (0.84, { impact() }),
            (1.08, { flareOn = true; withAnimation(.easeInOut(duration: 0.75)) { flare = 1.2 } }),
            (1.18, { withAnimation(.spring(response: 0.42, dampingFraction: 0.55)) { badge = true } }),
            (1.62, { withAnimation(.easeOut(duration: 0.9)) { name = true } }),
            (1.90, { flareOn = false })
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
