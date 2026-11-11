#!/bin/bash
# Code promo -10 % première course (rlPromo v1, 11 nov. 2026, demande de Yassine) : page de réservation (site + applis).
# APERCU=1 : copie de la page sur l'adresse d'aperçu Firebase (2 jours), la vraie page ne change pas.
set -e
cd ~
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o fix35.py "$R/fix35.py"
grep -q 'rlPromo v1' fix35.py || { echo "ARRET fix35 absent"; exit 1; }
if [ -n "${APERCU:-}" ]; then rm -rf ~/bk-apercu && cp -r ~/booking ~/bk-apercu; P=~/bk-apercu/public/index.html; else P=~/booking/public/index.html; [ -f booking-index-avant-promo.html ] || cp "$P" booking-index-avant-promo.html; fi
python3 fix35.py "$P" < /dev/null
node -e "const s=require('fs').readFileSync('$P','utf8');const m=[...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];m.forEach((x,i)=>{try{new Function(x[1])}catch(e){console.log('ERREUR script',i,e.message);process.exit(1)}});console.log('scripts ok',m.length,'rlPromo',s.split('rlPromo v1').length-1)"
if [ -n "${APERCU:-}" ]; then cd ~/bk-apercu && firebase hosting:channel:deploy apercu --expires 2d --project rafai-suivi < /dev/null 2>&1 | grep -E "Channel URL|http|Error" | tail -3
else cd ~/booking && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -2; sleep 15
  echo "Promo en ligne : $(curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c 'rlPromo v1')"; fi
echo FIN-DEPLOY42
