#!/bin/bash
# RL Driver : nouvelle présentation (courses en lignes, calendrier, menu, Mon compte). Étape test : canal de prévisualisation, la page en ligne ne change pas.
set -e
cd ~
H="${1:?commit}"
B="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o fix26.py "$B/fix26.py"
curl -sLf -o rl-login-drv.js "$B/appli/rl-login-drv.js"
curl -sLf -o fix27.py "$B/fix27.py"
curl -sLf -o rl-drv-ui.js "$B/appli/rl-drv-ui.js"
[ -f chauffeur-index-avant-rlui.html ] || cp suivi/public/chauffeur/index.html chauffeur-index-avant-rlui.html
python3 fix26.py
python3 fix27.py
cd ~/suivi && firebase hosting:channel:deploy rllogin --expires 2d --project rafai-suivi 2>&1 | tail -3
echo FIN-TEST27
