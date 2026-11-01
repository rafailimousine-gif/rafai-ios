#!/bin/bash
# Zone de service : message « France uniquement (départ et arrivée en France) » sur la page de réservation
set -e
cd ~
curl -sL -o fix12.py "https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/main/web/fix12.py?$(date +%s)"
[ -f booking-index-avant-zone.html ] || cp booking/public/index.html booking-index-avant-zone.html
python3 fix12.py
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c errZone
echo FIN-DEPLOY12
