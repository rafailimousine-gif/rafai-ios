#!/bin/bash
# Met en ligne le mode « appli iPhone RL Driver » de la page chauffeur (Cloud Shell)
set -e
cd ~
curl -sL -o fix9.py https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/main/web/fix9.py
[ -f chauffeur-index-avant-appli.html ] || cp suivi/public/chauffeur/index.html chauffeur-index-avant-appli.html
python3 fix9.py
cd ~/suivi && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -3
