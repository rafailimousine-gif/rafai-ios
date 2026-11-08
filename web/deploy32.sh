#!/bin/bash
# RL Driver : nouvelle photo de fond de la connexion (CDG 2E, chauffeur avec la tablette), recadrée pour téléphone,
# photo entière sur ordinateur. L'ancienne photo (rl-login-fond.jpg) est supprimée. Mise en ligne.
set -e
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
cd ~
curl -sLf -o fix26.py "$R/fix26.py"
curl -sLf -o rl-login-drv.js "$R/appli/rl-login-drv.js"
grep -q 'rl-fond-cdg.jpg' rl-login-drv.js || { echo "ARRET script sans la nouvelle photo"; exit 1; }
curl -sLf -o suivi/public/chauffeur/rl-fond-cdg.jpg "$R/appli/rl-fond-cdg.jpg"
curl -sLf -o suivi/public/chauffeur/rl-fond-cdg-large.jpg "$R/appli/rl-fond-cdg-large.jpg"
cp suivi/public/chauffeur/index.html chauffeur-index-avant-fond-cdg.html
python3 fix26.py < /dev/null
grep -q 'rl-fond-cdg.jpg' suivi/public/chauffeur/index.html || { echo "ARRET nouvelle photo absente de la page"; exit 1; }
node -e "const s=require('fs').readFileSync(process.env.HOME+'/suivi/public/chauffeur/index.html','utf8');const m=[...s.matchAll(/<script>([\s\S]*?)<\/script>/g)];m.forEach((x,i)=>{try{new Function(x[1])}catch(e){console.log('ERREUR script',i,e.message);process.exit(1)}});console.log('scripts ok',m.length,'ancienne photo',s.split('rl-login-fond').length-1)"
rm -f suivi/public/chauffeur/rl-login-fond.jpg
cd ~/suivi && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -2
sleep 15
T=$(date +%s)
echo "page : $(curl -s "https://team.rafai-limousine.com/chauffeur/?_=$T" | grep -c 'rl-fond-cdg.jpg')"
echo "photo telephone : $(curl -s -o /dev/null -w '%{http_code}' "https://team.rafai-limousine.com/chauffeur/rl-fond-cdg.jpg?_=$T")"
echo "photo ordinateur : $(curl -s -o /dev/null -w '%{http_code}' "https://team.rafai-limousine.com/chauffeur/rl-fond-cdg-large.jpg?_=$T")"
echo FIN-DEPLOY32
