#!/bin/bash
# Appli client : réservation « À l'heure » sur plusieurs jours (rlMulti v1). Étape test : adresse de test, l'appli et le site ne changent pas.
set -e
cd ~
H="${1:?commit}"
B="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o fix30.py "$B/fix30.py"
curl -sLf -o rl-multi.js "$B/appli/rl-multi.js"
[ -f booking-index-avant-multi.html ] || cp booking/public/index.html booking-index-avant-multi.html
python3 fix30.py < /dev/null
node -e "const s=require('fs').readFileSync(process.env.HOME+'/booking/public/index.html','utf8');const m=[...s.matchAll(/<script>([\s\S]*?)<\/script>/g)];m.forEach((x,i)=>{try{new Function(x[1])}catch(e){console.log('ERREUR script',i,e.message);process.exit(1)}});console.log('scripts ok',m.length)"
cd ~/booking && firebase hosting:channel:deploy multi --expires 2d --project rafai-suivi < /dev/null 2>&1 | grep -E "Channel URL|Error" | tail -2
echo FIN-TEST30
