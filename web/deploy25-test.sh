#!/bin/bash
# Page de réservation sur ordinateur (rlGrand v1). Étape test : le site en ligne ne change pas.
set -e
cd ~
H="${1:?commit}"
B="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o fix25.py "$B/fix25.py"
curl -sLf -o rl-grand.js "$B/appli/rl-grand.js"
[ -f booking-index-avant-grand.html ] || cp booking/public/index.html booking-index-avant-grand.html
python3 fix25.py
cd ~/booking && firebase hosting:channel:deploy prix --expires 2d --project rafai-suivi 2>&1 | tail -2
echo FIN-TEST25
