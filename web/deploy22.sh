#!/bin/bash
# Page de réservation : écran « Bienvenue sur RL » et photo de la page de connexion (appli uniquement, rlAccueil v2)
set -e
cd ~
B="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/89362844cccd736d34e3796c1b86615b78d17646/web"
curl -sLf -o fix22.py "$B/fix22.py"
curl -sLf -o rl-accueil.js "$B/appli/rl-accueil.js"
curl -sLf -o rl-fond.jpg "$B/appli/rl-fond.jpg"
[ -f booking-index-avant-accueil.html ] || cp booking/public/index.html booking-index-avant-accueil.html
python3 fix22.py
cp rl-fond.jpg booking/public/rl-fond.jpg
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
sleep 20
echo "accueil : $(curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c "rlAccueil v2")"
echo "photo : $(curl -s -o /dev/null -w "%{http_code}" "https://booking.rafai-limousine.com/rl-fond.jpg")"
echo FIN-DEPLOY22
