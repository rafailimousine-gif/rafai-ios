# Page de réservation sur ordinateur : rlGrand v2 remplace v1 (dès 900 px, connexion en pleine page). Le téléphone et l'appli ne changent pas.
import io, os, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
JS = io.open(os.path.join(H, 'rl-grand.js'), encoding='utf-8').read().rstrip() + '\n'
if '</script' in JS or 'rlGrand v2' not in JS:
    print('ARRET script rlGrand v2 incorrect'); sys.exit(1)
a = s.find('/* ---------- rlGrand v1')
if a < 0:
    a = s.find('/* ---------- rlGrand v2')
if a < 0:
    print('ARRET bloc rlGrand introuvable'); sys.exit(1)
b = s.find('})();\n', a)
if b < 0:
    print('ARRET fin du bloc rlGrand introuvable'); sys.exit(1)
b += len('})();\n')
s = s[:a] + JS + s[b:]
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlGrand v2', len(s))
