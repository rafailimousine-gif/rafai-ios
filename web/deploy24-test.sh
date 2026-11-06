#!/bin/bash
# Page de connexion du site : photo de fond (rlFond v1). Étape test : le site en ligne ne change pas.
set -e
cd ~
B="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/aa858fb6c30b0543ba44bca5ee7d529d7735b805/web"
curl -sLf -o fix24.py "$B/fix24.py"
curl -sLf -o rl-fond-web.js "$B/appli/rl-fond-web.js"
[ -f booking-index-avant-fond.html ] || cp booking/public/index.html booking-index-avant-fond.html
python3 fix24.py
cd ~/booking && firebase hosting:channel:deploy prix --expires 2d --project rafai-suivi 2>&1 | tail -2
echo FIN-TEST24
