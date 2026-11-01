#!/bin/bash
# Page de réservation / appli client : rester sur « Mes courses » (ou « Compte ») après une actualisation
set -e
cd ~
curl -sL -o fix16.py "https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/main/web/fix16.py?$(date +%s)"
[ -f booking-index-avant-onglet.html ] || cp booking/public/index.html booking-index-avant-onglet.html
python3 fix16.py
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c "keepTab v1"
echo FIN-DEPLOY16
