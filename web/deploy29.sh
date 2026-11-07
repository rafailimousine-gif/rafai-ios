#!/bin/bash
# RL Driver : remise en ligne de l'apparence (rlTheme v1) avec le site Firebase indiqué en clair.
# La version 15 de l'outil Firebase exige "site" dans firebase.json quand le projet a plusieurs sites.
set -e
cd ~/suivi
grep -q 'rlTheme v1' public/chauffeur/index.html || { echo "ARRET rlTheme absent de la page"; exit 1; }
cp firebase.json ~/firebase-avant-site.json
python3 - <<'EOF'
import json
p = 'firebase.json'
d = json.load(open(p))
h = d['hosting']
if isinstance(h, dict):
    h.setdefault('site', 'rafai-suivi')
else:
    for x in h:
        if 'site' not in x and 'target' not in x:
            x['site'] = 'rafai-suivi'
json.dump(d, open(p, 'w'), indent=2)
print('site :', h.get('site') if isinstance(h, dict) else [x.get('site') for x in h])
EOF
firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -3
sleep 15
echo "rlTheme en ligne : $(curl -s "https://team.rafai-limousine.com/chauffeur/?_=$(date +%s)" | grep -c 'rlTheme v1')"
echo FIN-DEPLOY29
