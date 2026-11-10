#!/bin/bash
# booking.rafai-limousine.com : lien « Espace client » du site (petit bonhomme, 10 nov. 2026, demande de Yassine).
# booking.rafai-limousine.com/#login ouvre tout de suite la page de connexion ; une fois connecté, la page de réservation s'affiche.
# Déjà connecté : la page de réservation directement. Rien d'autre ne change. Retour arrière : ~/index-avant-login-*.html
set -e
# APERCU=1 : copie à part, mise sur une adresse d'aperçu (2 jours), la vraie page booking ne change pas
if [ -n "${APERCU:-}" ]; then rm -rf ~/bk-apercu && cp -r ~/booking ~/bk-apercu && cd ~/bk-apercu/public; else cd ~/booking/public; cp index.html ~/index-avant-login-$(date +%Y%m%d-%H%M).html; fi
python3 - <<'PY'
import io
f='index.html'; t=io.open(f,encoding='utf-8').read()
if 'rlLogin v1' in t: raise SystemExit('ARRET : deja en place')
A='/* ---------- rlBord v1'
if t.count(A)!=1: raise SystemExit('ARRET : repere rlBord introuvable (%d)' % t.count(A))
for k in ('function signedIn(', 'function tab(', 'function auth('):
    if t.count(k)!=1: raise SystemExit('ARRET : %s introuvable' % k)
new=r'''/* ---------- rlLogin v1 : lien « Espace client » du site (#login) : la connexion s'ouvre tout de suite, puis la réservation (10 nov. 2026) ---------- */
(function rlLogin() {
  if (!/^#(login|connexion)$/.test(location.hash)) return;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  if (auth()) { try { tab('book'); } catch (e) {} return; }
  var va = true;
  var _si = signedIn; signedIn = function () { var r = _si.apply(this, arguments); if (va) { va = false; try { tab('book'); } catch (e) {} } return r; };
  try { tab('acc'); } catch (e) {}
})();
'''
t=t.replace(A,new+A)
io.open(f,'w',encoding='utf-8').write(t); print('appli : lien #login ajoute')
PY
if [ -n "${APERCU:-}" ]; then cd ~/bk-apercu && firebase hosting:channel:deploy apercu --expires 2d --project rafai-suivi 2>&1 | grep -E "Channel URL|http|Error" | tail -3
else cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -3; fi
echo FIN
