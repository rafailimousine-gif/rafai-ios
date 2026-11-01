#!/bin/bash
# Android : clé de signature + configuration Firebase de RL Driver, posées directement dans les secrets GitHub (rien à copier-coller),
# puis fichier de liaison du site de réservation (assetlinks.json) pour l'appli Android Rafai Limousine.
set -e
cd ~
REPO=rafailimousine-gif/rafai-ios
KEYS=~/android-keys
mkdir -p "$KEYS" && chmod 700 "$KEYS"

echo "== 1/4 Outil GitHub"
if ! command -v gh >/dev/null 2>&1; then
  V=2.62.0
  curl -sL "https://github.com/cli/cli/releases/download/v$V/gh_${V}_linux_amd64.tar.gz" | tar xz -C ~
  export PATH=~/gh_${V}_linux_amd64/bin:$PATH
fi
if ! gh auth status -h github.com >/dev/null 2>&1; then
  echo ">>> Connexion GitHub : un code va s'afficher. Ouvrez https://github.com/login/device et tapez ce code vous-même."
  gh auth login -h github.com -p https -w
fi

echo "== 2/4 Appli Android RL Driver dans Firebase"
APPID=$(firebase apps:list ANDROID --project rafai-suivi --json 2>/dev/null | python3 -c "import sys,json
d=json.load(sys.stdin).get('result',[])
print(next((a['appId'] for a in d if a.get('packageName')=='com.rafailimousine.driver'),''))" || true)
if [ -z "$APPID" ]; then
  APPID=$(firebase apps:create ANDROID "RL Driver Android" --package-name com.rafailimousine.driver --project rafai-suivi --json | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['appId'])")
fi
echo "Appli Firebase : $APPID"
firebase apps:sdkconfig ANDROID "$APPID" --project rafai-suivi --out "$KEYS/google-services.json" >/dev/null 2>&1 || \
  firebase apps:sdkconfig ANDROID "$APPID" --project rafai-suivi > "$KEYS/google-services.json"
python3 -c "import json; d=json.load(open('$KEYS/google-services.json')); assert any(c['client_info']['android_client_info']['package_name']=='com.rafailimousine.driver' for c in d['client']); print('google-services.json : ok')"
base64 -w0 "$KEYS/google-services.json" | gh secret set GOOGLE_SERVICES_JSON -R "$REPO"

echo "== 3/4 Clé de signature Android (gardée dans ~/android-keys)"
if [ ! -f "$KEYS/rafai-release.jks" ]; then
  PASS=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 32)
  keytool -genkeypair -keystore "$KEYS/rafai-release.jks" -storetype PKCS12 -alias rafai -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$PASS" -keypass "$PASS" -dname "CN=Rafai Limousine, O=Rafai Limousine SAS, L=Neuilly-sur-Seine, C=FR" >/dev/null 2>&1
  printf %s "$PASS" > "$KEYS/mot-de-passe-cle.txt"
  chmod 600 "$KEYS"/*
fi
PASS=$(cat "$KEYS/mot-de-passe-cle.txt")
base64 -w0 "$KEYS/rafai-release.jks" | gh secret set ANDROID_KEYSTORE_B64 -R "$REPO"
printf %s "$PASS" | gh secret set ANDROID_KEY_PASS -R "$REPO"
printf rafai | gh secret set ANDROID_KEY_ALIAS -R "$REPO"
SHA=$(keytool -list -v -keystore "$KEYS/rafai-release.jks" -storepass "$PASS" -alias rafai | grep -E "SHA256:" | head -1 | sed 's/^.*SHA256: //')
echo "Empreinte : $SHA"
printf %s "$SHA" > "$KEYS/empreinte-sha256.txt"

echo "== 4/4 Fichier de liaison du site (assetlinks.json)"
mkdir -p ~/booking/public/.well-known
python3 - "$SHA" <<'PY'
import json, os, sys
sha = sys.argv[1]
f = os.path.expanduser('~/booking/public/.well-known/assetlinks.json')
prints = [sha]
try:
    for st in json.load(open(f)):
        for p in st.get('target', {}).get('sha256_cert_fingerprints', []):
            if p not in prints: prints.append(p)
except Exception:
    pass
json.dump([{"relation": ["delegate_permission/common.handle_all_urls"],
            "target": {"namespace": "android_app", "package_name": "com.rafailimousine.client", "sha256_cert_fingerprints": prints}}],
          open(f, 'w'), indent=2)
print('assetlinks.json :', len(prints), 'empreinte(s)')
PY
cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -2
curl -s https://booking.rafai-limousine.com/.well-known/assetlinks.json | head -c 200; echo
echo FIN-ANDROID-SETUP
