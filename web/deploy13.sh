#!/bin/bash
# RL Driver Android : les liens personnels des chauffeurs (team.rafai-limousine.com/chauffeur/…)
# s'ouvrent directement dans l'appli (fichier de liaison assetlinks.json sur le site équipe).
set -e
cd ~
SHA=$(cat ~/android-keys/empreinte-sha256.txt)
[ -n "$SHA" ] || { echo "ARRET : empreinte introuvable"; exit 1; }
OTHER=$(find ~/suivi/public -name '.*' -not -name '.well-known' -not -path '*/.well-known/*' | head -5)
[ -z "$OTHER" ] || { echo "ARRET : fichiers cachés dans le site équipe : $OTHER"; exit 1; }
[ -f suivi-firebase-avant-android.json ] || cp suivi/firebase.json suivi-firebase-avant-android.json
mkdir -p ~/suivi/public/.well-known
python3 - "$SHA" <<'PY'
import io, json, os, sys
H = os.path.expanduser('~'); sha = sys.argv[1]
f = os.path.join(H, 'suivi/public/.well-known/assetlinks.json')
try:
    st = json.load(io.open(f, encoding='utf-8'))
except Exception:
    st = []
st = [x for x in st if x.get('target', {}).get('package_name') != 'com.rafailimousine.driver']
st.append({"relation": ["delegate_permission/common.handle_all_urls"],
           "target": {"namespace": "android_app", "package_name": "com.rafailimousine.driver", "sha256_cert_fingerprints": [sha]}})
io.open(f, 'w', encoding='utf-8').write(json.dumps(st, indent=2))
fj = os.path.join(H, 'suivi/firebase.json')
cfg = json.load(io.open(fj, encoding='utf-8'))
hs = cfg['hosting'] if isinstance(cfg['hosting'], list) else [cfg['hosting']]
for h in hs:
    ign = [x for x in h.get('ignore', ['firebase.json', '**/.*', '**/node_modules/**']) if x != '**/.*']
    for x in ['**/.git/**', '**/.DS_Store']:
        if x not in ign: ign.append(x)
    h['ignore'] = ign
io.open(fj, 'w', encoding='utf-8').write(json.dumps(cfg, indent=2, ensure_ascii=False))
print('assetlinks.json chauffeur : ok')
PY
cd ~/suivi && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
curl -s "https://team.rafai-limousine.com/.well-known/assetlinks.json?_=$(date +%s)" | tr -d ' \n' | head -c 250; echo
echo FIN-DEPLOY13
