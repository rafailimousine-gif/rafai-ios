#!/bin/bash
# Lifting « bordeaux & blanc » — MISE EN LIGNE (rlBdx v1, « Publie » de Yassine le 16 nov. 2026).
# Sauvegarde les pages actuelles dans ~/avant-bdx-DATE, ajoute les couleurs bordeaux / blanc (toujours allumées)
# au site, à la réservation, à RL Driver / suivi et à l'espace équipe, puis publie sur les vraies adresses.
# www.sh et equipe.sh sont mis à jour pour garder le bordeaux aux prochaines constructions.
set -e
cd ~
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o theme-bdx.py "$R/theme-bdx.py"; grep -q 'rlBdx v1' theme-bdx.py || { echo "ARRET theme-bdx absent"; exit 1; }
curl -sLf -o www.sh.new "$R/site2/www.sh" && grep -q 'rlBdx' www.sh.new && mv www.sh.new www.sh
curl -sLf -o equipe.sh.new "$R/equipe/equipe.sh" && grep -q 'rlBdx' equipe.sh.new && mv equipe.sh.new equipe.sh
B=~/avant-bdx-$(date +%Y%m%d-%H%M); mkdir -p "$B"
for d in site-www booking suivi equipe; do cp -r ~/$d/public "$B/$d-public"; done
echo "sauvegarde : $B"
live() { find "$1/public" -name '*.html' -not -path '*/public/e/*' -print0 | xargs -0 python3 ~/theme-bdx.py --live "$2"; }
echo "== SITE";        live ~/site-www www;  (cd ~/site-www && FIREBASE_HOSTING_UPLOAD_CONCURRENCY=6 firebase deploy --only hosting:www --project rafai-suivi < /dev/null 2>&1 | tail -1)
echo "== RESERVATION"; live ~/booking bk;    (cd ~/booking && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -1)
echo "== RL DRIVER";   live ~/suivi suivi;   (cd ~/suivi && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -1)
echo "== EQUIPE";      live ~/equipe team;   (cd ~/equipe && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -1)
sleep 10
for u in https://www.rafai-limousine.com/fr https://booking.rafai-limousine.com/ https://team.rafai-limousine.com/chauffeur/; do echo "$u : $(curl -s "$u?_=$(date +%s)" | grep -c 'rlBdx v1')"; done
echo FIN-DEPLOY48
