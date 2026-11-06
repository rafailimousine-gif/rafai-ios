#!/bin/bash
# Page de réservation sur ordinateur : mise en ligne de rlGrand v1, après contrôle sur l'adresse de test.
set -e
cd ~
grep -q 'rlGrand v1' booking/public/index.html || { echo "ARRET rlGrand absent"; exit 1; }
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
sleep 20
echo "grand : $(curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c "rlGrand v1")"
echo FIN-DEPLOY25
