#!/bin/bash
# Page de réservation (booking.rafai-limousine.com) : nouvelle photo de fond (le chauffeur ouvre la porte). Rien d'autre ne change.
# La photo garde son nom (rl-fond.jpg) : la page et son cadrage restent les mêmes. Ancienne photo gardée dans ~/booking-rl-fond-avant-chauffeur.jpg
set -e
cd ~
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web"
[ -f booking-rl-fond-avant-chauffeur.jpg ] || cp booking/public/rl-fond.jpg booking-rl-fond-avant-chauffeur.jpg
curl -sLf -o rl-fond-chauffeur.jpg "$R/appli/rl-fond-chauffeur.jpg"
python3 -c "from PIL import Image; im=Image.open('rl-fond-chauffeur.jpg'); assert im.size==(1122,900), im.size; print('photo ok', im.size)"
cp rl-fond-chauffeur.jpg booking/public/rl-fond.jpg
cd ~/booking && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -2
sleep 15
echo "photo en ligne : $(curl -s "https://booking.rafai-limousine.com/rl-fond.jpg?_=$(date +%s)" | md5sum | cut -c1-8) / attendu $(md5sum < ~/rl-fond-chauffeur.jpg | cut -c1-8)"
curl -sI "https://booking.rafai-limousine.com/rl-fond.jpg" | grep -i '^cache-control' || true
echo FIN-DEPLOY37
