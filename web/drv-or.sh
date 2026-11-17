#!/bin/bash
# RL Driver : Start trip doré + barres d'étapes en or (noir et or). Publie sur team.rafai-limousine.com/chauffeur.
set -e
cd ~
H="${1:?commit}"
curl -sLf -o ~/drv-or.py "https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web/drv-or.py"
B=~/avant-drv-or-$(date +%Y%m%d-%H%M); cp -r ~/suivi/public "$B"; echo "sauvegarde : $B"
find ~/suivi/public -name '*.html' -print0 | xargs -0 python3 ~/drv-or.py
(cd ~/suivi && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -1)
sleep 6; echo "en ligne rlOr : $(curl -s "https://team.rafai-limousine.com/chauffeur/?_=$(date +%s)" | grep -c 'rlOr v1')"
echo FIN-DRV-OR
