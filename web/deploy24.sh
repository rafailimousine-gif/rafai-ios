#!/bin/bash
# Page de connexion du site : mise en ligne de la photo de fond (rlFond v1), après contrôle sur l'adresse de test.
set -e
cd ~
grep -q 'rlFond v1' booking/public/index.html || { echo "ARRET rlFond absent"; exit 1; }
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
sleep 20
echo "fond : $(curl -s "https://booking.rafai-limousine.com/?_=$(date +%s)" | grep -c "rlFond v1")"
echo FIN-DEPLOY24
