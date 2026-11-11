#!/bin/bash
# Espace équipe sur Firebase (rlTeamWeb v1, 11 nov. 2026, demande de Yassine).
# Par défaut : adresse de TEST (canal « test » du site Firebase de l'équipe, 7 jours). LIVE=1 seulement après « Publie » de Yassine.
set -e
H="${1:?commit}"
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web/equipe"
API='https://script.google.com/macros/s/AKfycbzsKErtOvPRAJ-9NqnuNRGPzhP7lJmHf2mBBB6xPhvSoRZFrYct4DSIA3QvpnmdN1_s/exec'
mkdir -p ~/equipe/public && cd ~/equipe
for f in patch-equipe.py; do curl -sLf -o "$f" "$R/$f"; done
for f in icon-192.png icon-512.png logo.png manifest.webmanifest; do curl -sLf -o "public/$f" "$R/$f"; done
curl -sLf -o app.html "$API?teamapp=1"
python3 patch-equipe.py app.html "$API" public/index.html < /dev/null
node -e "const s=require('fs').readFileSync('public/index.html','utf8');const m=[...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];m.forEach((x,i)=>{try{new Function(x[1])}catch(e){console.log('ERREUR script',i,e.message);process.exit(1)}});console.log('scripts ok',m.length)"
SITE=""
for s in rafai-equipe rafai-limousine-equipe rafai-team-paris; do
  if firebase hosting:sites:list --project rafai-suivi < /dev/null 2>/dev/null | grep -q "$s"; then SITE="$s"; break; fi
  if firebase hosting:sites:create "$s" --project rafai-suivi < /dev/null > /dev/null 2>&1; then SITE="$s"; break; fi
done
[ -n "$SITE" ] || { echo "ARRET site Firebase"; exit 1; }
cat > firebase.json <<J
{ "hosting": { "site": "$SITE", "public": "public", "cleanUrls": true,
  "headers": [ { "source": "**/*.html", "headers": [ { "key": "Cache-Control", "value": "no-cache" } ] },
               { "source": "/", "headers": [ { "key": "Cache-Control", "value": "no-cache" } ] } ] } }
J
echo "site $SITE"
if [ -n "${LIVE:-}" ]; then firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -3
else firebase hosting:channel:deploy test --expires 7d --project rafai-suivi < /dev/null 2>&1 | grep -E "Channel URL|http|Error" | tail -3; fi
echo FIN-EQUIPE
