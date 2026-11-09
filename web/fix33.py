# Page de réservation : option Fast Track VIP (rlFt v1), bloc « NOUVEAU » et formulaire d'accueil VIP à l'aéroport.
# Le script rl-ft.js se place dans le grand script de la page, juste avant sa fermeture, pour utiliser Q, post, step3…
# Relancer le script remplace le bloc existant (entre les repères rlFt-debut et rlFt-fin).
import io, os, sys
H = os.path.expanduser('~')
f = sys.argv[1] if len(sys.argv) > 1 else os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
JS = io.open(os.path.join(H, 'rl-ft.js'), encoding='utf-8').read().rstrip() + '\n'
if '</script' in JS:
    print('ARRET balise de fin dans le script'); sys.exit(1)
A0, A1 = '/* rlFt-debut */\n', '/* rlFt-fin */\n'
BLK = A0 + '(function () {\n' + JS + '})();\n' + A1
a = s.find(A0)
if a >= 0:
    b = s.find(A1, a)
    if b < 0:
        print('ARRET fin du bloc rlFt introuvable'); sys.exit(1)
    s = s[:a] + BLK + s[b + len(A1):]
else:
    E = '\n})();\n</script>\n</body>'
    if s.count(E) != 1:
        print('ARRET ancre', s.count(E)); sys.exit(1)
    s = s.replace(E, '\n' + BLK + '})();\n</script>\n</body>')
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlFt v1', len(s), s.count(A0))
