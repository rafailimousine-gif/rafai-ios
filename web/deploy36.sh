#!/bin/bash
# « Offert à bord » (Evian, USB-C, Wi-Fi) et « Musique à bord » (rlBord v1) sur la page de réservation : mise en ligne (site + applis iPhone et Android).
set -e
cd ~
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o fix34.py "$R/fix34.py"
curl -sLf -o rl-bord.js "$R/appli/rl-bord.js"
grep -q 'rlBord v1' rl-bord.js || { echo "ARRET script a bord absent"; exit 1; }
[ -f booking-index-avant-bord.html ] || cp booking/public/index.html booking-index-avant-bord.html
python3 fix34.py < /dev/null
node -e "const s=require('fs').readFileSync(process.env.HOME+'/booking/public/index.html','utf8');const m=[...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];m.forEach((x,i)=>{try{new Function(x[1])}catch(e){console.log('ERREUR script',i,e.message);process.exit(1)}});console.log('scripts ok',m.length,'rlFt',s.split('rlFt v1').length-1,'rlBord',s.split('rlBord v1').length-1)"
cd ~/booking && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -2
sleep 15
echo "A bord en ligne : $(curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c 'rlBord v1')"
echo FIN-DEPLOY36
