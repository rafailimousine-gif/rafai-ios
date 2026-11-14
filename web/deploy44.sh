#!/bin/bash
# Appli RL Driver : photo du chauffeur en cadre « arche » (rlArch v1, 14 nov. 2026, demande de Yassine).
# APERCU=1 : copie sur une adresse d'aperçu Firebase (2 jours), la vraie page ne change pas.
set -e
cd ~
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o fix37.py "$R/fix37.py"
grep -q 'rlArch v1' fix37.py || { echo "ARRET fix37 absent"; exit 1; }
if [ -n "${APERCU:-}" ]; then rm -rf ~/suivi-apercu && cp -r ~/suivi ~/suivi-apercu; P=~/suivi-apercu/public/chauffeur/index.html; else P=~/suivi/public/chauffeur/index.html; [ -f chauffeur-index-avant-arche.html ] || cp "$P" chauffeur-index-avant-arche.html; fi
python3 fix37.py "$P" < /dev/null
grep -c 'rlArch v1' "$P"
if [ -n "${APERCU:-}" ]; then cd ~/suivi-apercu && firebase hosting:channel:deploy apercu-drv --expires 2d --project rafai-suivi < /dev/null 2>&1 | grep -E "Channel URL|http|Error" | tail -3
else cd ~/suivi && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -2; sleep 10
  echo "Cadre arche en ligne : $(curl -s "https://team.rafai-limousine.com/chauffeur/?_=$(date +%s)" | grep -c 'rlArch v1')"; fi
echo FIN-DEPLOY44
