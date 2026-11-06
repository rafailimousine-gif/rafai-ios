# Page de réservation sur ordinateur : grande mise en page (rlGrand v1). Le téléphone et l'appli ne changent pas.
import io, os, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
JS = io.open(os.path.join(H, 'rl-grand.js'), encoding='utf-8').read().rstrip() + '\n'
if '</script' in JS:
    print('ARRET balise de fin dans le script'); sys.exit(1)
a = s.find('/* ---------- rlGrand v1')
if a >= 0:
    b = s.find('})();\n', a)
    if b < 0:
        print('ARRET fin du bloc rlGrand introuvable'); sys.exit(1)
    b += len('})();\n')
    s = s[:a] + JS + s[b:]
else:
    a = s.find('/* ---------- rlFn v1')
    if a < 0 or s.find('rlFond v1') < 0 or s.find('rlFond v1') > a:
        print('ARRET blocs rlFond / rlFn introuvables'); sys.exit(1)
    s = s[:a] + JS + s[a:]
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlGrand v1', len(s))
