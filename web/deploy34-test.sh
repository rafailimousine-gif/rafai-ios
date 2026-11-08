#!/bin/bash
# RL Driver en anglais par défaut (rlLang v1) + bouton Français (connexion et « Mon compte »).
# Étape test : canal de prévisualisation, la page en ligne ne change pas.
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
node -e "const s=require('fs').readFileSync(process.env.HOME+'/suivi/public/chauffeur/index.html','utf8');const m=[...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];m.forEach((x,i)=>{try{new Function(x[1])}catch(e){console.log('ERREUR script',i,e.message);process.exit(1)}});console.log('scripts ok',m.length,'rlLang',s.split('rlLang v1').length-1,'globe',s.split('data-rllang').length-1)"
cd ~/suivi && firebase hosting:channel:deploy rllang --expires 3d --project rafai-suivi < /dev/null 2>&1 | grep -E "Channel URL|Error" | tail -2
echo FIN-TEST34
