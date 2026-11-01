# Génère fix9.py : ajoute le bloc « appli iPhone RL Driver » (driver-native.js) à la page chauffeur (~/suivi/public/chauffeur/index.html)
import json, os
here = os.path.dirname(os.path.abspath(__file__))
blk = open(os.path.join(here, 'driver-native.js'), encoding='utf-8').read().rstrip() + '\n'
A = "\n})();\n</script>\n</body>"
P = [(A, "\n" + blk + "})();\n</script>\n</body>")]
fix = '''# Page chauffeur : adaptation automatique dans l'appli iPhone RL Driver
import io, os, sys, json
H = os.path.expanduser('~')
f = os.path.join(H, 'suivi/public/chauffeur/index.html')
s = io.open(f, encoding='utf-8').read()
if 'rn-app' in s:
    print('deja modifie'); sys.exit(0)
for i, (a, b) in enumerate(json.loads(%s)):
    n = s.count(a)
    if n != 1:
        print('ARRET ancre', i, n); sys.exit(1)
    s = s.replace(a, b)
io.open(f, 'w', encoding='utf-8').write(s)
print('ok', len(s))
''' % json.dumps(json.dumps(P, ensure_ascii=False), ensure_ascii=False)
open(os.path.join(here, 'fix9.py'), 'w', encoding='utf-8').write(fix)
print('fix9.py', len(fix))
