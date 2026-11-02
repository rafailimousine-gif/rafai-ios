#!/bin/bash
# Page de réservation : appli Android Rafai Limousine reconnue (rlTwa v1), section « Supprimer votre compte »,
# clé de signature Google Play ajoutée à .well-known/assetlinks.json (écran plein dans l'appli Android)
set -e
cd ~
curl -sL -o fix20.py "https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/8d9251b013a839a49a01a9ca24e5e3660db8445f/web/fix20.py"
[ -f booking-index-avant-android.html ] || cp booking/public/index.html booking-index-avant-android.html
python3 fix20.py 90:7F:10:46:98:C1:0C:55:28:FA:33:F1:FD:15:9C:F8:6C:68:DF:8D:5F:D8:37:1B:36:7F:12:30:BD:D5:A9:E9
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
sleep 20
echo "rlTwa : $(curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c "rlTwa v1")"
echo "suppression : $(curl -s "https://booking.rafai-limousine.com/confidentialite/?_=$(date +%s)" | grep -c 'id="suppression"')"
echo "assetlinks : $(curl -s "https://booking.rafai-limousine.com/.well-known/assetlinks.json?_=$(date +%s)" | grep -c "90:7F:10:46")"
echo FIN-DEPLOY20
