#!/bin/bash
# RL Driver : connexion par code e-mail sur la page chauffeur. Étape test : canal de prévisualisation, la page en ligne ne change pas.
set -e
cd ~
H="${1:?commit}"
B="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o fix26.py "$B/fix26.py"
curl -sLf -o rl-login-drv.js "$B/appli/rl-login-drv.js"
curl -sLf -o suivi/public/chauffeur/rl-login-bg.jpg "$B/appli/rl-login-bg.jpg"
[ -f chauffeur-index-avant-login.html ] || cp suivi/public/chauffeur/index.html chauffeur-index-avant-login.html
python3 fix26.py
cd ~/suivi && firebase hosting:channel:deploy rllogin --expires 2d --project rafai-suivi 2>&1 | tail -3
echo FIN-TEST26
