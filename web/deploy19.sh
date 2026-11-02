#!/bin/bash
# Page Confidentialité de booking.rafai-limousine.com : paragraphe « Mesure publicitaire » (FR + EN)
set -e
cd ~
curl -sL -o fix19.py "https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/main/web/fix19.py?$(date +%s)"
[ -f booking-confidentialite-avant-pub.html ] || cp booking/public/confidentialite/index.html booking-confidentialite-avant-pub.html
python3 fix19.py
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
sleep 20
curl -s "https://booking.rafai-limousine.com/confidentialite/?_=$(date +%s)" | grep -c "Mesure publicitaire" || true
echo FIN-DEPLOY19
