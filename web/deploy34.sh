#!/bin/bash
# RL Driver en anglais par défaut (rlLang v1) + bouton Français : mise en ligne.
set -e
cd ~
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
for x in fix26.py fix27.py fix32.py; do curl -sLf -o $x "$R/$x"; done
curl -sLf -o rl-login-drv.js "$R/appli/rl-login-drv.js"
curl -sLf -o rl-drv-ui.js "$R/appli/rl-drv-ui.js"
curl -sLf -o rl-lang.js "$R/appli/rl-lang.js"
grep -q 'rlLang v1' rl-lang.js || { echo "ARRET script langue absent"; exit 1; }
[ -f chauffeur-index-avant-rllang.html ] || cp suivi/public/chauffeur/index.html chauffeur-index-avant-rllang.html
python3 fix26.py < /dev/null
python3 fix27.py < /dev/null
python3 fix32.py < /dev/null
node -e "const s=require('fs').readFileSync(process.env.HOME+'/suivi/public/chauffeur/index.html','utf8');const m=[...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];m.forEach((x,i)=>{try{new Function(x[1])}catch(e){console.log('ERREUR script',i,e.message);process.exit(1)}});console.log('scripts ok',m.length,'langue',s.split('<script id=\"rllang\">').length-1,'bouton',s.split('data-rllang').length-1)"
cd ~/suivi && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -2
sleep 15
T=$(date +%s)
echo "langue en ligne : $(curl -s "https://team.rafai-limousine.com/chauffeur/?_=$T" | grep -c 'rlLang v1')"
echo "photo flotte : $(curl -s "https://team.rafai-limousine.com/chauffeur/?_=$T" | grep -c 'rl-fond-flotte.jpg')"
echo FIN-DEPLOY34
