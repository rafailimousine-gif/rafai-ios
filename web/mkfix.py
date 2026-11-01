# Génère fix8.py : ajoute le bloc « appli iPhone » (native.js) à la page de réservation (~/booking/public/index.html)
import json, os
here = os.path.dirname(os.path.abspath(__file__))
blk = open(os.path.join(here, 'native.js'), encoding='utf-8').read().rstrip() + '\n'
A = "\n})();\n</script>\n</body>"
P = [(A, "\n" + blk + "})();\n</script>\n</body>"),
     ("var c = { gid: r.gid || '', apple: r.apple || '', pk: r.pk !== false }, ch = JSON.stringify(c) !== JSON.stringify({ gid: CFG.gid || '', apple: CFG.apple || '', pk: CFG.pk !== false });",
      "var c = { gid: r.gid || '', apple: r.apple || '', pk: r.pk !== false, appleApp: !!r.appleApp }, ch = JSON.stringify(c) !== JSON.stringify({ gid: CFG.gid || '', apple: CFG.apple || '', pk: CFG.pk !== false, appleApp: !!CFG.appleApp });")]
fix = '''# Page de réservation : adaptation automatique dans l'appli iPhone Rafai Limousine
import io, os, sys, json
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/index.html')
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
open(os.path.join(here, 'fix8.py'), 'w', encoding='utf-8').write(fix)
print('fix8.py', len(fix))
