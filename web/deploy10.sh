#!/bin/bash
# Paiement / factures / messagerie : remplace le paramètre « c » (réservé par Google) par « tk » sur les deux pages
set -e
cd ~
curl -sL -o fix10.py https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/main/web/fix10.py
[ -f booking-index-avant-tk.html ] || cp booking/public/index.html booking-index-avant-tk.html
[ -f chauffeur-index-avant-tk.html ] || cp suivi/public/chauffeur/index.html chauffeur-index-avant-tk.html
python3 fix10.py
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
cd ~/suivi && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
echo FIN-DEPLOY10
