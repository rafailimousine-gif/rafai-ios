#!/bin/bash
# Page de réservation : prix sans compte (rlPrix v1). Étape test : adresse de test, le site en ligne ne change pas.
set -e
cd ~
B="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/0212a701df0b7cad26aa123618d63007a9659fd9/web"
curl -sLf -o fix23.py "$B/fix23.py"
curl -sLf -o rl-prix.js "$B/appli/rl-prix.js"
[ -f booking-index-avant-prix.html ] || cp booking/public/index.html booking-index-avant-prix.html
python3 fix23.py
cd ~/booking && firebase hosting:channel:deploy prix --expires 2d --project rafai-suivi 2>&1 | tail -6
echo FIN-TEST23
