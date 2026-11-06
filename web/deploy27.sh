#!/bin/bash
# RL Driver : mise en ligne de la nouvelle présentation (rlUI v1), après contrôle sur le canal de test.
set -e
cd ~
grep -q 'rlUI v1' suivi/public/chauffeur/index.html || { echo "ARRET rlUI absent"; exit 1; }
cd ~/suivi && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
sleep 15
echo "rlUI : $(curl -s "https://team.rafai-limousine.com/chauffeur/?_=$(date +%s)" | grep -c 'rlUI v1')"
echo FIN-DEPLOY27
