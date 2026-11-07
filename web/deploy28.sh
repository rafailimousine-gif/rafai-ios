#!/bin/bash
# RL Driver : apparence Sombre / Clair / Auto dans « Mon compte » (rlTheme v1), mise en ligne.
set -e
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
cd ~
curl -sLf -o fix27.py "$R/fix27.py"
curl -sLf -o rl-drv-ui.js "$R/appli/rl-drv-ui.js"
grep -q 'rlTheme v1' rl-drv-ui.js || { echo "ARRET script sans rlTheme"; exit 1; }
cp suivi/public/chauffeur/index.html chauffeur-index-avant-rltheme.html
python3 fix27.py < /dev/null
grep -q 'rlTheme v1' suivi/public/chauffeur/index.html || { echo "ARRET rlTheme absent"; exit 1; }
cd ~/suivi && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -2
sleep 15
echo "rlTheme : $(curl -s "https://team.rafai-limousine.com/chauffeur/?_=$(date +%s)" | grep -c 'rlTheme v1')"
echo FIN-DEPLOY28
