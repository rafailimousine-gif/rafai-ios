#!/bin/bash
# Page de réservation / appli client : compteur anonyme des étapes (feuille « Entonnoir »)
set -e
cd ~
curl -sL -o fix17.py "https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/main/web/fix17.py?$(date +%s)"
[ -f booking-index-avant-entonnoir.html ] || cp booking/public/index.html booking-index-avant-entonnoir.html
python3 fix17.py
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c "rlFn v1"
echo FIN-DEPLOY17
