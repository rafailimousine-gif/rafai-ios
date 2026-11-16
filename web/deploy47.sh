#!/bin/bash
# Lifting « bordeaux & blanc » — VERSION TEST (rlBdx v1, 16 nov. 2026, demande de Yassine).
# Copie le site, la réservation, RL Driver / suivi et l'espace équipe, ajoute les couleurs bordeaux / blanc
# et met chaque copie sur une adresse d'aperçu Firebase « bordeaux » (7 jours). Les vraies adresses ne changent pas.
set -e
cd ~
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
curl -sLf -o theme-bdx.py "$R/theme-bdx.py"
grep -q 'rlBdx v1' theme-bdx.py || { echo "ARRET theme-bdx absent"; exit 1; }
dep() { # dossier source, copie, appli, canal, options firebase
  [ -d "$1/public" ] || { echo "ARRET $1/public absent"; return 1; }
  rm -rf "$2"; mkdir -p "$2"
  rsync -a --exclude '/node_modules' --exclude '/tools' --exclude '/src' "$1/" "$2/"
  find "$2/public" -name '*.html' -not -path '*/public/e/*' -print0 | xargs -0 python3 ~/theme-bdx.py "$3"
  (cd "$2" && firebase hosting:channel:deploy "$4" --expires 7d $5 --project rafai-suivi < /dev/null 2>&1 | grep -E "Channel URL|Error" | tail -2)
}
echo "== SITE";        dep ~/site-www ~/bdx-www   www   bordeaux     "--only www"
echo "== RESERVATION"; dep ~/booking  ~/bdx-bk    bk    bordeaux     ""
echo "== RL DRIVER";   dep ~/suivi    ~/bdx-suivi suivi bordeaux-drv ""
echo "== EQUIPE";      dep ~/equipe   ~/bdx-equipe team bordeaux     ""
echo FIN-DEPLOY47
