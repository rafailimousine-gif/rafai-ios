# Page de réservation : photo de fond de l'appli sur la page de connexion du site (rlFond v1).
import io, os, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
if 'rlFond v1' in s:
    print('deja rlFond v1'); sys.exit(0)
JS = io.open(os.path.join(H, 'rl-fond-web.js'), encoding='utf-8').read().rstrip() + '\n'
if '</script' in JS:
    print('ARRET balise de fin dans le script'); sys.exit(1)
a = s.find('/* ---------- rlFn v1')
if a < 0 or s.find('rlPrix v1') < 0 or s.find('rlPrix v1') > a:
    print('ARRET blocs rlPrix / rlFn introuvables'); sys.exit(1)
s = s[:a] + JS + s[a:]
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlFond v1', len(s))
