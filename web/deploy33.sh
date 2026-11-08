#!/bin/bash
# RL Driver : photo de la flotte en fond de la connexion, entière sur toute la largeur du téléphone (tous les chauffeurs et
# les voitures), connexion juste en dessous. Les photos CDG (rl-fond-cdg*.jpg) sont supprimées. Mise en ligne.
set -e
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
cd ~
curl -sLf -o fix26.py "$R/fix26.py"
curl -sLf -o rl-login-drv.js "$R/appli/rl-login-drv.js"
grep -q 'rl-fond-flotte.jpg' rl-login-drv.js || { echo "ARRET script sans la nouvelle photo"; exit 1; }
curl -sLf -o suivi/public/chauffeur/rl-fond-flotte.jpg "$R/appli/rl-fond-flotte.jpg"
cp suivi/public/chauffeur/index.html chauffeur-index-avant-fond-flotte.html
python3 fix26.py < /dev/null
grep -q 'rl-fond-flotte.jpg' suivi/public/chauffeur/index.html || { echo "ARRET nouvelle photo absente de la page"; exit 1; }
node -e "const s=require('fs').readFileSync(process.env.HOME+'/suivi/public/chauffeur/index.html','utf8');const m=[...s.matchAll(/<script>([\s\S]*?)<\/script>/g)];m.forEach((x,i)=>{try{new Function(x[1])}catch(e){console.log('ERREUR script',i,e.message);process.exit(1)}});console.log('scripts ok',m.length,'photos CDG',s.split('rl-fond-cdg').length-1)"
rm -f suivi/public/chauffeur/rl-fond-cdg.jpg suivi/public/chauffeur/rl-fond-cdg-large.jpg suivi/public/chauffeur/rl-login-fond.jpg
cd ~/suivi && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -2
sleep 15
T=$(date +%s)
echo "page : $(curl -s "https://team.rafai-limousine.com/chauffeur/?_=$T" | grep -c 'rl-fond-flotte.jpg')"
echo "photo flotte : $(curl -s -o /dev/null -w '%{http_code}' "https://team.rafai-limousine.com/chauffeur/rl-fond-flotte.jpg?_=$T")"
echo "ancienne photo CDG : $(curl -s -o /dev/null -w '%{http_code}' "https://team.rafai-limousine.com/chauffeur/rl-fond-cdg.jpg?_=$T")"
echo FIN-DEPLOY33
