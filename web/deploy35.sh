#!/bin/bash
# Fast Track VIP (rlFt v1) sur la page de réservation : mise en ligne (site + applis iPhone et Android).
set -e
cd ~
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o fix33.py "$R/fix33.py"
curl -sLf -o rl-ft.js "$R/appli/rl-ft.js"
grep -q 'rlFt v1' rl-ft.js || { echo "ARRET script Fast Track absent"; exit 1; }
[ -f booking-index-avant-ft.html ] || cp booking/public/index.html booking-index-avant-ft.html
python3 fix33.py < /dev/null
node -e "const s=require('fs').readFileSync(process.env.HOME+'/booking/public/index.html','utf8');const m=[...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];m.forEach((x,i)=>{try{new Function(x[1])}catch(e){console.log('ERREUR script',i,e.message);process.exit(1)}});console.log('scripts ok',m.length,'rlFt',s.split('rlFt v1').length-1)"
cd ~/booking && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -2
sleep 15
echo "Fast Track en ligne : $(curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c 'rlFt v1')"
echo FIN-DEPLOY35
