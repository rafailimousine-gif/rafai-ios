#!/bin/bash
# RL Driver : le bouton « Bon de mission » ouvre l'ordre de mission sur le serveur de l'équipe (version à jour :
# logo et couleurs bordeaux). Le reste de l'appli ne change pas, rien n'est envoyé aux chauffeurs.
# (Yassine, 18 nov. 2026 vers 20h30 : « Ordre de mission seul »)
set -e
cd ~
T='https://script.google.com/macros/s/AKfycbzsKErtOvPRAJ-9NqnuNRGPzhP7lJmHf2mBBB6xPhvSoRZFrYct4DSIA3QvpnmdN1_s/exec'
F=$(grep -rl "app=drvodm" ~/suivi/public --include='*.html' || true)
[ -n "$F" ] || { echo "ARRET drvodm introuvable"; exit 1; }
S=~/avant-odm-$(date +%Y%m%d-%H%M); mkdir -p "$S"; cp -r ~/suivi/public "$S/suivi-public"
echo "sauvegarde : $S"
for f in $F; do
  python3 - "$f" "$T" <<'PY'
import io, sys
p, t = sys.argv[1], sys.argv[2]
s = io.open(p, encoding='utf-8').read()
a = "APP + '?app=drvodm"
n = s.count(a)
s = s.replace(a, "'" + t + "?app=drvodm")
io.open(p, 'w', encoding='utf-8').write(s)
print(p, ': remplacements', n)
PY
done
echo "liens a jour : $(grep -c "$T?app=drvodm" $F | tr '\n' ' ')"
(cd ~/suivi && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -1)
sleep 8
echo "en ligne : $(curl -s "https://team.rafai-limousine.com/chauffeur/x?_=$(date +%s)" | grep -c "$T?app=drvodm")"
echo FIN-ODM
