# Page de réservation : sur le web, voir le prix sans compte et se connecter au moment de réserver (rlPrix v1). Appli inchangée.
import io, os, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
if 'rlPrix v1' in s:
    print('deja rlPrix v1'); sys.exit(0)
JS = io.open(os.path.join(H, 'rl-prix.js'), encoding='utf-8').read().rstrip() + '\n'
if '</script' in JS:
    print('ARRET balise de fin dans le script'); sys.exit(1)
R = [
    ("if (quoted || !A || !$('from').value || $('b1').classList.contains('hide')) return;",
     "var G = !A && window.__rlGuest;\nif (quoted || (!A && !G) || !$('from').value || $('b1').classList.contains('hide')) return;"),
    ("try { if (typeof profOk === 'function' && !profOk()) return; } catch (x) {}",
     "try { if (!G && typeof profOk === 'function' && !profOk()) return; } catch (x) {}"),
    ("setTimeout(function () { try { toast(MSG[L] || MSG.en); } catch (x) {} }, 600);",
     "setTimeout(function () { try { if (!window.__rlGuest) toast(MSG[L] || MSG.en); } catch (x) {} }, 600);"),
    ("applyLang();\ngateShow();\nloadCfg();",
     "applyLang();\nwindow.__rlRideLink = /ride=/.test(location.hash);\ngateShow();\nloadCfg();"),
]
for a, b in R:
    if s.count(a) != 1:
        print('ARRET repere absent ou double : ' + a[:50]); sys.exit(1)
    s = s.replace(a, b)
a = s.find('/* ---------- rlFn v1')
if a < 0 or s.find('rlAccueil v2') < 0 or s.find('rlAccueil v2') > a:
    print('ARRET blocs rlAccueil / rlFn introuvables'); sys.exit(1)
s = s[:a] + JS + s[a:]
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlPrix v1', len(s))
