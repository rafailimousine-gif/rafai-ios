#!/bin/bash
# Page de réservation sur ordinateur (rlGrand v2). Étape test : adresse de test, le site et l'appli ne changent pas.
set -e
cd ~
H="${1:?commit}"
B="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o fix31.py "$B/fix31.py"
curl -sLf -o rl-grand.js "$B/appli/rl-grand.js"
cp booking/public/index.html booking-index-avant-grand2.html
python3 fix31.py < /dev/null
node -e "const s=require('fs').readFileSync(process.env.HOME+'/booking/public/index.html','utf8');const m=[...s.matchAll(/<script>([\s\S]*?)<\/script>/g)];m.forEach((x,i)=>{try{new Function(x[1])}catch(e){console.log('ERREUR script',i,e.message);process.exit(1)}});console.log('scripts ok',m.length, 'v1', s.split('rlGrand v1').length-1, 'v2', s.split('rlGrand v2').length-1, 'multi', s.split('rlMulti v1').length-1)"
cd ~/booking && firebase hosting:channel:deploy grand --expires 2d --project rafai-suivi < /dev/null 2>&1 | grep -E "Channel URL|Error" | tail -2
echo FIN-TEST31
