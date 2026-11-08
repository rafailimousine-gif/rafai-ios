# Page chauffeur : langue de RL Driver (rlLang v1) — anglais par défaut, français au choix.
# Le script se place dans <head>, avant tous les autres, pour traduire la page dès son affichage.
import io, os, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'suivi/public/chauffeur/index.html')
s = io.open(f, encoding='utf-8').read()
JS = io.open(os.path.join(H, 'rl-lang.js'), encoding='utf-8').read().rstrip() + '\n'
if '</script' in JS:
    print('ARRET balise de fin dans le script'); sys.exit(1)
BLK = '<script id="rllang">\n' + JS + '</script>\n'
M = '<script id="rllang">'
a = s.find(M)
if a >= 0:
    b = s.find('</script>\n', a)
    if b < 0:
        print('ARRET fin du bloc rlLang introuvable'); sys.exit(1)
    s = s[:a] + BLK + s[b + len('</script>\n'):]
else:
    A = '</head>'
    if s.count(A) != 1:
        print('ARRET ancre', s.count(A)); sys.exit(1)
    s = s.replace(A, BLK + A)
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlLang v1', len(s), s.count(M))
