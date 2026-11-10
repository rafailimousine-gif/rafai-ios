#!/bin/bash
# booking.rafai-limousine.com/#login (bonhomme du site) : le bouton « Back » de la page de connexion ramène sur le site
# (la page d'où vient le client), pas sur la page de réservation. Une fois connecté, rien ne change (page de réservation).
# 10 nov. 2026, demande de Yassine. Retour arrière : ~/index-avant-back-*.html
set -e
if [ -n "${APERCU:-}" ]; then rm -rf ~/bk-apercu && cp -r ~/booking ~/bk-apercu && cd ~/bk-apercu/public; else cd ~/booking/public; cp index.html ~/index-avant-back-$(date +%Y%m%d-%H%M).html; fi
python3 - <<'PY'
import io
f='index.html'; t=io.open(f,encoding='utf-8').read()
if 'rlLogin v1' not in t: raise SystemExit('ARRET : rlLogin v1 absent (lancer deploy40.sh avant)')
if 'rlLogin v2' in t: raise SystemExit('ARRET : deja en place')
A="  var va = true;\n"
if t.count(A)!=1: raise SystemExit('ARRET : repere rlLogin introuvable (%d)' % t.count(A))
new=(A+
"  /* rlLogin v2 : « Back » ramène sur le site (la page d'où vient le client) tant qu'il n'est pas connecté */\n"
"  var rf = document.referrer || '', rm = /^https:\\/\\/(www\\.)?rafai-limousine\\.com(\\/[^?#]*)?/.exec(rf);\n"
"  var SITE = (rm && rm[2] && rm[2] !== '/') ? rf : 'https://www.rafai-limousine.com/' + (L === 'fr' ? 'fr' : '');\n"
"  document.addEventListener('click', function (e) { if (!va || auth() || !e.target || !e.target.closest || !e.target.closest('#gBack')) return; e.preventDefault(); e.stopPropagation(); location.href = SITE; }, true);\n")
t=t.replace(A,new)
io.open(f,'w',encoding='utf-8').write(t); print('appli : Back vers le site ajoute')
PY
if [ -n "${APERCU:-}" ]; then cd ~/bk-apercu && firebase hosting:channel:deploy apercu --expires 2d --project rafai-suivi 2>&1 | grep -E "Channel URL|http|Error" | tail -3
else cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -3; fi
echo FIN
