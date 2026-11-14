#!/bin/bash
# Photos chauffeurs en cadre « arche » : page de réservation (fix38) + appli RL Driver (fix37). 14 nov. 2026, demande de Yassine.
# APERCU=1 : copies sur les adresses d'aperçu Firebase (2 jours), les vraies pages ne changent pas.
set -e
cd ~
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o fix38.py "$R/fix38.py"; curl -sLf -o deploy44.sh "$R/deploy44.sh"
grep -q 'rlArchB v1' fix38.py || { echo "ARRET fix38 absent"; exit 1; }
if [ -n "${APERCU:-}" ]; then rm -rf ~/bk-apercu && cp -r ~/booking ~/bk-apercu; P=~/bk-apercu/public/index.html; else P=~/booking/public/index.html; [ -f booking-index-avant-arche.html ] || cp "$P" booking-index-avant-arche.html; fi
python3 fix38.py "$P" < /dev/null
if [ -n "${APERCU:-}" ]; then (cd ~/bk-apercu && firebase hosting:channel:deploy apercu --expires 2d --project rafai-suivi < /dev/null 2>&1 | grep -E "Channel URL|Error" | tail -2)
else (cd ~/booking && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -1); sleep 10
  echo "Arche booking en ligne : $(curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c 'rlArchB v1')"; fi
bash deploy44.sh "$H"
echo FIN-DEPLOY45
