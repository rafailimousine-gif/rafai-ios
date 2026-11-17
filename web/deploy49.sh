#!/bin/bash
# Logo RL blanc et or partout (« R blanc, L doré, RAFAI blanc, LIMOUSINE doré », Yassine 17 nov. 2026).
# Remplace les icônes et logos de l'espace équipe, de la réservation, de RL Driver et du site,
# puis relance la mise en ligne bordeaux (deploy48.sh) avec le même commit.
set -e
cd ~
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
T=~/icons-or-$H; mkdir -p "$T"
for f in icon-192.png icon-512.png icon-512.webp apple-touch-icon.png favicon-32.png logo-or.png; do
  curl -sLf -o "$T/$f" "$R/icons-or/$f" || { echo "ARRET $f"; exit 1; }
done
for f in logo.png logo.webp; do curl -sLf -o "$T/equipe-$f" "$R/equipe/$f" || { echo "ARRET equipe/$f"; exit 1; }; done
B=~/avant-logo-or-$(date +%Y%m%d-%H%M); mkdir -p "$B"
put() { # put <fichier source> <destination> : remplace seulement si la destination existe déjà (sauf si $3 = force)
  if [ -f "$2" ] || [ "${3:-}" = force ]; then [ -f "$2" ] && { mkdir -p "$B/$(dirname "${2#$HOME/}")"; cp "$2" "$B/${2#$HOME/}"; }; cp "$1" "$2"; echo "  logo : ${2#$HOME/}"; fi
}
# Espace équipe (aussi utilisé par les e-mails : logo-or.png)
put "$T/icon-192.png" ~/equipe/public/icon-192.png force
put "$T/icon-512.png" ~/equipe/public/icon-512.png force
put "$T/equipe-logo.png" ~/equipe/public/logo.png force
put "$T/equipe-logo.webp" ~/equipe/public/logo.webp force
put "$T/logo-or.png" ~/equipe/public/logo-or.png force
# Réservation, RL Driver / suivi, site : seulement les fichiers d'icône déjà présents
for d in site-www; do  # réservation et RL Driver gardent l'ancien logo doré (17 nov. 2026)
  for f in icon-192.png icon-512.png icon-512.webp apple-touch-icon.png favicon-32.png; do put "$T/$f" ~/$d/public/$f; done
  put "$T/icon-192.png" ~/$d/public/icon.png
  put "$T/apple-touch-icon.png" ~/$d/public/apple-touch-icon-precomposed.png
  put "$T/icon-512.png" ~/$d/public/img/logo.png
done
echo "sauvegarde logos : $B"
curl -sLf -o ~/deploy48.sh "$R/deploy48.sh"
bash ~/deploy48.sh "$H"
echo FIN-DEPLOY49
