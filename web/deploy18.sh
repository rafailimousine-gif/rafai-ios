#!/bin/bash
# Page de réservation : balise Google Ads + conversion « Réservation payée (booking) »
set -e
cd ~
curl -sL -o fix18.py "https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/main/web/fix18.py?$(date +%s)"
[ -f booking-index-avant-conversion.html ] || cp booking/public/index.html booking-index-avant-conversion.html
python3 fix18.py
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
sleep 20
curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c "adsConv v1" || true
echo FIN-DEPLOY18
