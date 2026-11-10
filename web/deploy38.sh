#!/bin/bash
# Écran de connexion (appli et booking.rafai-limousine.com) sur téléphone : la photo montre le chauffeur ET la cliente en entier
# (10 nov. 2026, demande de Yassine). Seul le cadrage de la photo change. Retour arrière : la copie ~/index-avant-gate-*.html
set -e
cd ~/booking/public
cp index.html ~/index-avant-gate-$(date +%Y%m%d-%H%M).html
python3 - <<'PY'
import io
f='index.html'; t=io.open(f,encoding='utf-8').read()
R=[('65% 0/auto 100% no-repeat','56% 0/175% auto no-repeat'),
   ('height:min(177vw,88vh)','height:min(98.5vw,88vh)'),
   ('linear-gradient(180deg,rgba(12,12,14,.8) 0,rgba(12,12,14,.66) 31%,rgba(12,12,14,.06) 43%,rgba(12,12,14,.1) 59%,rgba(12,12,14,.86) 72%,#0c0c0e 85%)',
    'linear-gradient(180deg,rgba(12,12,14,.5) 0,rgba(12,12,14,.12) 12%,rgba(12,12,14,.18) 35%,rgba(12,12,14,.22) 55%,rgba(12,12,14,.55) 78%,#0c0c0e 100%)')]
for a,b in R:
    n=t.count(a)
    if n!=2: raise SystemExit('ARRET : %d au lieu de 2 pour %s' % (n,a[:40]))
    t=t.replace(a,b)
io.open(f,'w',encoding='utf-8').write(t); print('photo connexion : cadrage modifie')
PY
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -3
echo FIN
