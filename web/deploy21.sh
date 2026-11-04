#!/bin/bash
# Page Confidentialité de booking.rafai-limousine.com : section « Application RL Driver (chauffeurs) » (FR + EN)
set -e
cd ~
curl -sL -o fix21.py "https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/politique-rl-driver/web/fix21.py?$(date +%s)"
[ -f booking-confidentialite-avant-driver.html ] || cp booking/public/confidentialite/index.html booking-confidentialite-avant-driver.html
python3 fix21.py
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
sleep 20
echo "section chauffeurs : $(curl -s "https://booking.rafai-limousine.com/confidentialite/?_=$(date +%s)" | grep -c 'id="rl-driver"')"
echo FIN-DEPLOY21
