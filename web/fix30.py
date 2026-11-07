# Page de réservation (appli client et site) : « À l'heure » sur plusieurs jours, programme par jour (rlMulti v1).
import io, os, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
JS = io.open(os.path.join(H, 'rl-multi.js'), encoding='utf-8').read().rstrip() + '\n'
if '</script' in JS:
    print('ARRET balise de fin dans le script'); sys.exit(1)
a = s.find('/* ---------- rlMulti v1')
if a >= 0:
    # le bloc se termine par la dernière ligne « })(); » avant le bloc suivant
    nxt = s.find('/* ---------- ', a + 10)
    end = s.rfind('})();\n', a, nxt if nxt > 0 else len(s))
    if end < 0:
        print('ARRET fin du bloc rlMulti introuvable'); sys.exit(1)
    s = s[:a] + JS + s[end + len('})();\n'):]
else:
    a = s.find('/* ---------- rlFn v1')
    if a < 0:
        print('ARRET bloc rlFn introuvable'); sys.exit(1)
    s = s[:a] + JS + s[a:]
for x in ('function metaHtml()', 'function showCars()', 'function applyLang()', "id=\"hWrap\""):
    if x not in s:
        print('ARRET repere absent : ' + x); sys.exit(1)
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlMulti v1', len(s), s.count('rlMulti v1'))
