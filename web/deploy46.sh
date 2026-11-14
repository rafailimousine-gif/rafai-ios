#!/bin/bash
# Cadre photo chauffeur « comme sur le site » : RL Driver (fix39, + photo à jour tout de suite) et page de réservation (fix40). 14 nov. 2026.
# APERCU=1 : copies sur les adresses d'aperçu Firebase (2 jours).
set -e
cd ~
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o fix39.py "$R/fix39.py"; curl -sLf -o fix40.py "$R/fix40.py"
grep -q 'rlArch v2' fix39.py && grep -q 'rlArchB v2' fix40.py || { echo "ARRET fix absent"; exit 1; }
if [ -n "${APERCU:-}" ]; then
  rm -rf ~/suivi-apercu ~/bk-apercu && cp -r ~/suivi ~/suivi-apercu && cp -r ~/booking ~/bk-apercu
  python3 fix39.py ~/suivi-apercu/public/chauffeur/index.html < /dev/null; python3 fix40.py ~/bk-apercu/public/index.html < /dev/null
  (cd ~/suivi-apercu && firebase hosting:channel:deploy apercu-drv --expires 2d --project rafai-suivi < /dev/null 2>&1 | grep -E "Channel URL|Error" | tail -1)
  (cd ~/bk-apercu && firebase hosting:channel:deploy apercu --expires 2d --project rafai-suivi < /dev/null 2>&1 | grep -E "Channel URL|Error" | tail -1)
else
  [ -f chauffeur-index-avant-arche2.html ] || cp ~/suivi/public/chauffeur/index.html chauffeur-index-avant-arche2.html
  [ -f booking-index-avant-arche2.html ] || cp ~/booking/public/index.html booking-index-avant-arche2.html
  python3 fix39.py ~/suivi/public/chauffeur/index.html < /dev/null; python3 fix40.py ~/booking/public/index.html < /dev/null
  (cd ~/suivi && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -1)
  (cd ~/booking && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -1); sleep 10
  echo "RL Driver : $(curl -s "https://team.rafai-limousine.com/chauffeur/?_=$(date +%s)" | grep -c 'rlArch v2') · réservation : $(curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c 'rlArchB v2')"
fi
echo FIN-DEPLOY46
