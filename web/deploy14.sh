#!/bin/bash
# Site rafai-limousine.com -> réservation avec compte client et paiement en ligne (page booking pré-remplie)
set -e
cd ~
curl -sL -o fix14.py "https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/main/web/fix14.py?$(date +%s)"
[ -f booking-index-avant-rsv.html ] || cp booking/public/index.html booking-index-avant-rsv.html
python3 fix14.py
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c "rl_rsv"
echo FIN-DEPLOY14
