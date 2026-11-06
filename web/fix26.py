# Page chauffeur : connexion par code e-mail (rlLogin v1), à la fin du script principal, après le bloc « appli iPhone ».
import io, os, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'suivi/public/chauffeur/index.html')
s = io.open(f, encoding='utf-8').read()
JS = io.open(os.path.join(H, 'rl-login-drv.js'), encoding='utf-8').read().rstrip() + '\n'
if '</script' in JS:
    print('ARRET balise de fin dans le script'); sys.exit(1)
M = '/* ---------- rlLogin v1'
a = s.find(M)
if a >= 0:
    b = s.find('\n})();\n', a)
    if b < 0:
        print('ARRET fin du bloc rlLogin introuvable'); sys.exit(1)
    s = s[:a] + JS + s[b + len('\n})();\n'):]
else:
    A = '\n})();\n</script>\n</body>'
    if s.count(A) != 1 or 'rn-app' not in s:
        print('ARRET ancre', s.count(A)); sys.exit(1)
    s = s.replace(A, '\n' + JS.rstrip('\n') + A)
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlLogin v1', len(s), s.count(M))
