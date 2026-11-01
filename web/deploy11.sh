#!/bin/bash
# Appli iPhone v2 : boutons Apple + Google natifs, fichier de liaison Face ID (clés d'accès)
set -e
cd ~
curl -sL -o fix11.py https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/main/web/fix11.py
[ -f booking-index-avant-v2.html ] || cp booking/public/index.html booking-index-avant-v2.html
[ -f booking-firebase-avant-v2.json ] || cp booking/firebase.json booking-firebase-avant-v2.json
python3 fix11.py
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
curl -s https://booking.rafai-limousine.com/.well-known/apple-app-site-association; echo
echo FIN-DEPLOY11
