#!/bin/bash
# Page de réservation : reprise du trajet commencé sur www.rafai-limousine.com, version 2 (date, heure, passagers, prix après connexion)
set -e
cd ~
curl -sL -o fix15.py "https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/main/web/fix15.py?$(date +%s)"
[ -f booking-index-avant-rsv2.html ] || cp booking/public/index.html booking-index-avant-rsv2.html
python3 fix15.py
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c "rsvSite v2"
echo FIN-DEPLOY15
