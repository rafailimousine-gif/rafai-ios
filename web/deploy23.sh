#!/bin/bash
# Page de réservation : mise en ligne du prix sans compte (rlPrix v1), après contrôle sur l'adresse de test.
set -e
cd ~
grep -q 'rlPrix v1' booking/public/index.html || { echo "ARRET rlPrix absent"; exit 1; }
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
sleep 20
echo "prix : $(curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c "rlPrix v1")"
echo FIN-DEPLOY23
