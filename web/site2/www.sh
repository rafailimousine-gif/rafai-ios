#!/bin/bash
# Nouveau site : construit les pages dans ~/site-www et les met sur l'adresse de test Firebase (Google Sites ne change pas).
set -e
COMMIT="$1"
B="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$COMMIT/web/site2"
mkdir -p ~/site-www/tools ~/site-www/src ~/site-src
cd ~/site-www/src
for f in build.py rl-site.js site.css.add pages.json logo.png agent.webp; do curl -sLf -o "$f" "$B/$f"; done
python3 -c "import bs4, PIL" 2>/dev/null || pip3 install --user --quiet beautifulsoup4 pillow
[ -x ~/site-www/tools/node_modules/.bin/purgecss ] || npm i --silent --prefix ~/site-www/tools purgecss@6 >/dev/null 2>&1
cd ~/site-www
rm -rf public/e public/css
python3 src/build.py "${2:-}"
tools/node_modules/.bin/purgecss --css atari.css --content 'public/**/*.html' --output public/css/ >/dev/null
cat public/css/atari.css src/site.css.add > public/css/site.css && rm public/css/atari.css
V=$(cat public/css/site.css public/css/site.js | md5sum | cut -c1-8)
find public -name '*.html' -not -path 'public/e/*' -print0 | xargs -0 sed -i "s#/css/site\.css\"#/css/site.css?v=$V\"#; s#/css/site\.js\"#/css/site.js?v=$V\"#"
[ -f public/img/og.jpg ] || curl -sLf -o public/img/og.jpg "https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$COMMIT/web/site/rafai-accueil-5.jpg"
cat > firebase.json <<J
{"hosting":{"target":"www","public":"public","cleanUrls":true,"trailingSlash":false,
"rewrites":[{"source":"/","destination":"/home.html"}],
"headers":[{"source":"/img/**","headers":[{"key":"Cache-Control","value":"public,max-age=31536000,immutable"}]},
{"source":"/e/**","headers":[{"key":"Cache-Control","value":"public,max-age=3600"}]},
{"source":"/css/**","headers":[{"key":"Cache-Control","value":"public,max-age=31536000,immutable"}]},
{"source":"!/@(img|e|css)/**","headers":[{"key":"Cache-Control","value":"public,max-age=300"}]}]}}
J
SITE="${RL_SITE:-rafai-limousine-paris}"
printf '{"projects":{"default":"rafai-suivi"},"targets":{"rafai-suivi":{"hosting":{"www":["%s"]}}}}' "$SITE" > .firebaserc
firebase hosting:sites:list --project rafai-suivi 2>/dev/null | grep -q "$SITE" || firebase hosting:sites:create "$SITE" --project rafai-suivi 2>&1 | tail -2
FIREBASE_HOSTING_UPLOAD_CONCURRENCY=6 firebase deploy --only hosting:www --project rafai-suivi 2>&1 | tail -3
du -sh public public/img public/e public/css | tr '\n' ' '; echo; wc -c public/css/site.css public/home.html | head -2
echo "FIN-WWW https://$SITE.web.app"
