# Page de réservation : écran « Bienvenue sur RL » et photo de la page de connexion, seulement dans l'appli (rlAccueil v2)
import io, os, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
if 'rlAccueil v2' in s:
    print('deja rlAccueil v2'); sys.exit(0)
if 'rlAccueil v1' in s:
    print('ARRET une ancienne version rlAccueil v1 est deja dans la page'); sys.exit(1)
JS = io.open(os.path.join(H, 'rl-accueil.js'), encoding='utf-8').read().rstrip() + '\n'
if '</script' in JS:
    print('ARRET balise de fin dans le script'); sys.exit(1)
a = s.find('/* ---------- rlFn v1')
if a < 0 or s.find('rlTwa v1') < 0 or s.find('rlTwa v1') > a:
    print('ARRET blocs rlTwa / rlFn introuvables'); sys.exit(1)
s = s[:a] + JS + s[a:]
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlAccueil v2', len(s))
