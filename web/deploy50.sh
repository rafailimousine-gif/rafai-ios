#!/bin/bash
# Site : pages secondaires (Flotte, services, à propos, contact, CGV…) en fonds blancs comme l'accueil,
# pied de page bordeaux lisible, logos Stripe / App Store / Google Play visibles (Yassine, 19 nov. 2026 « modifie et publie »).
# Met à jour seulement le site www (pas la réservation, ni RL Driver, ni l'espace équipe).
set -e
cd ~
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o theme-bdx.py "$R/theme-bdx.py"; grep -q 'pages secondaires (Flotte' theme-bdx.py || { echo "ARRET theme-bdx sans correctif"; exit 1; }
B=~/avant-pages-$(date +%Y%m%d-%H%M); mkdir -p "$B"; cp -r ~/site-www/public "$B/site-www-public"; echo "sauvegarde : $B"
find ~/site-www/public -name '*.html' -not -path '*/public/e/*' -print0 | xargs -0 python3 ~/theme-bdx.py --live www
(cd ~/site-www && FIREBASE_HOSTING_UPLOAD_CONCURRENCY=6 firebase deploy --only hosting:www --project rafai-suivi < /dev/null 2>&1 | tail -1)
sleep 8
for u in https://www.rafai-limousine.com/fleet https://www.rafai-limousine.com/fr/flotte https://www.rafai-limousine.com/; do echo "$u : $(curl -s "$u?_=$(date +%s)" | grep -c 'pages secondaires (Flotte')"; done
echo FIN-DEPLOY50
