#!/bin/bash
# Espace équipe : « Envoyer la configuration » = étapes de l'appli RL Driver (au lieu d'Overland) — « Publie » de Yassine, 20 nov. 2026.
# Reconstruit seulement la page de l'équipe depuis le serveur (version 120), garde les icônes et logos actuels, ajoute le bordeaux, publie.
# Étape 1 (sans argument LIVE) : construit dans ~/equipe-new et montre les différences. Étape 2 : LIVE=1 publie.
set -e
cd ~
API='https://script.google.com/macros/s/AKfycbzsKErtOvPRAJ-9NqnuNRGPzhP7lJmHf2mBBB6xPhvSoRZFrYct4DSIA3QvpnmdN1_s/exec'
N=~/equipe-new; rm -rf "$N"; mkdir -p "$N"; cp -r ~/equipe/public "$N/public"; rm -f "$N"/public/app.*.js
curl -sLf -o "$N/app.html" "$API?teamapp=1"
grep -q 'Configuration de l’appli RL Driver' "$N/app.html" || { echo "ARRET nouvelle version absente du serveur"; exit 1; }
python3 ~/equipe/patch-equipe.py "$N/app.html" "$API" "$N/public/index.html" < /dev/null
python3 ~/theme-bdx.py --live team "$N/public/index.html"
# garde le logo actuellement en ligne (remplacé par le logo or le 17 nov.)
python3 - "$N/public/index.html" <<'PY'
import io, os, re, sys
cur = io.open(os.path.expanduser('~/equipe/public/index.html'), encoding='utf-8').read()
p = sys.argv[1]; new = io.open(p, encoding='utf-8').read()
m = re.search(r"var LOGO='[^']*'", cur); n = re.search(r"var LOGO='[^']*'", new)
if m and n:
    new = new[:n.start()] + m.group(0) + new[n.end():]
    io.open(p, 'w', encoding='utf-8').write(new); print('logo actuel conservé')
PY
node -e "const fs=require('fs'),d=process.argv[1];const s=fs.readFileSync(d+'/index.html','utf8')+fs.readdirSync(d).filter(f=>/^app\..*\.js$/.test(f)).map(f=>'<script>'+fs.readFileSync(d+'/'+f,'utf8')+'</script>').join('');const m=[...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];m.forEach((x,i)=>{try{new Function(x[1])}catch(e){console.log('ERREUR script',i,e.message);process.exit(1)}});console.log('scripts ok',m.length)" "$N/public"
echo "== fichiers différents :"; diff -rq ~/equipe/public "$N/public" | sed 's#'"$HOME"'/##' | head -20
OLD=$(ls ~/equipe/public/app.*.js | head -1); NEW=$(ls "$N"/public/app.*.js | head -1)
echo "== lignes changées dans le script de l'appli :"; diff <(tr ';' '\n' < "$OLD") <(tr ';' '\n' < "$NEW") | grep '^[<>]' | cut -c1-160 | head -40
echo "== index.html :"; diff <(sed 's/app\.[a-z0-9]*\.js/app.X.js/g' ~/equipe/public/index.html | tr '>' '\n') <(sed 's/app\.[a-z0-9]*\.js/app.X.js/g' "$N/public/index.html" | tr '>' '\n') | grep '^[<>]' | cut -c1-160 | head -20
if [ -n "${LIVE:-}" ]; then
  B=~/avant-equipe-$(date +%Y%m%d-%H%M); cp -r ~/equipe/public "$B"; echo "sauvegarde : $B"
  rm -rf ~/equipe/public; cp -r "$N/public" ~/equipe/public
  (cd ~/equipe && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -2)
  sleep 8
  echo "en ligne : $(curl -s "https://equipe.rafai-limousine.com/?_=$(date +%s)" | grep -o 'app\.[a-z0-9]*\.js' | head -1)"
  J=$(curl -s "https://equipe.rafai-limousine.com/?_=$(date +%s)" | grep -o 'app\.[a-z0-9]*\.js' | head -1); echo "RL Driver dans la page : $(curl -s "https://equipe.rafai-limousine.com/$J" | grep -c 'Configuration de l’appli RL Driver')"
fi
echo FIN-DEPLOY51
