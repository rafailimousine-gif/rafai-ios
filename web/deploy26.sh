#!/bin/bash
# RL Driver : mise en ligne de la connexion par code e-mail (rlLogin v1), après contrôle sur le canal de test.
set -e
cd ~
grep -q 'rlLogin v1' suivi/public/chauffeur/index.html || { echo "ARRET rlLogin absent"; exit 1; }
cd ~/suivi && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
sleep 15
echo "login : $(curl -s "https://team.rafai-limousine.com/chauffeur/?_=$(date +%s)" | grep -c 'rlLogin v1')"
echo FIN-DEPLOY26
