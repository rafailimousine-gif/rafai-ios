#!/bin/bash
# Page de réservation (site + applis) : « Mes factures » (factures Qonto déposées par l'équipe) + bouton Sombre / Clair / Auto
# (rlInvTheme v1, 14 nov. 2026, demande de Yassine).
# APERCU=1 : copie de la page sur l'adresse d'aperçu Firebase (2 jours), la vraie page ne change pas.
set -e
cd ~
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o fix36.py "$R/fix36.py"
grep -q 'rlInvTheme v1' fix36.py || { echo "ARRET fix36 absent"; exit 1; }
if [ -n "${APERCU:-}" ]; then rm -rf ~/bk-apercu && cp -r ~/booking ~/bk-apercu; P=~/bk-apercu/public/index.html; else P=~/booking/public/index.html; [ -f booking-index-avant-factures.html ] || cp "$P" booking-index-avant-factures.html; fi
python3 fix36.py "$P" < /dev/null
node -e "const s=require('fs').readFileSync('$P','utf8');const m=[...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];m.forEach((x,i)=>{try{new Function(x[1])}catch(e){console.log('ERREUR script',i,e.message);process.exit(1)}});console.log('scripts ok',m.length,'rlInvTheme',s.split('rlInvTheme v1').length-1,'rlThE',s.split('id=\"rlThE\"').length-1)"
if [ -n "${APERCU:-}" ]; then cd ~/bk-apercu && firebase hosting:channel:deploy apercu --expires 2d --project rafai-suivi < /dev/null 2>&1 | grep -E "Channel URL|http|Error" | tail -3
else cd ~/booking && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -2; sleep 15
  echo "Factures + thème en ligne : $(curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c 'rlInvTheme v1')"; fi
echo FIN-DEPLOY43
