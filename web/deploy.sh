#!/bin/bash
# Met en ligne le mode « appli iPhone » de la page de réservation (Cloud Shell)
set -e
cd ~
curl -sL -o fix8.py https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/main/web/fix8.py
[ -f booking-index-avant-appli.html ] || cp booking/public/index.html booking-index-avant-appli.html
python3 fix8.py
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -3
