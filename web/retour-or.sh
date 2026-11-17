#!/bin/bash
# RL Driver et appli client : retour au noir et or d'avant le bordeaux, ancien logo doré
# (Yassine, 17 nov. 2026 08:05 « Remet l'appli comme elle était avant le bordeaux », 08:08 « Même l'appli client »).
# Le site, l'espace équipe et les e-mails restent en bordeaux.
set -e
cd ~
B0=$(ls -d ~/avant-bdx-* | sort | head -1)
echo "origine (avant bordeaux) : $B0"
echo "  rlBdx dans l'origine : $(grep -rl rlBdx "$B0/booking-public" "$B0/suivi-public" --include='*.html' 2>/dev/null | wc -l) page(s)"
S=~/avant-retour-or-$(date +%Y%m%d-%H%M); mkdir -p "$S"
for d in booking suivi; do
  cp -r ~/$d/public "$S/$d-public"
  find ~/$d/public -name '*.html' -print0 | xargs -0 python3 -c '
import io,re,sys
n=0
for p in sys.argv[1:]:
    s=io.open(p,encoding="utf-8").read()
    t=re.sub(r"<style id=\"rlBdxCss\">.*?</style><script id=\"rlBdx\">.*?</script>","",s,flags=re.S)
    if t!=s:
        io.open(p,"w",encoding="utf-8").write(t); n+=1
print("  '$d' sans bordeaux :",n,"page(s)")'
  (cd "$B0/$d-public" && find . -type f \( -name '*.png' -o -name '*.webp' -o -name '*.jpg' -o -name '*.ico' -o -name '*.svg' \)) | while read f; do
    if [ -f ~/$d/public/$f ] && ! cmp -s "$B0/$d-public/$f" ~/$d/public/$f; then cp "$B0/$d-public/$f" ~/$d/public/$f; echo "  image d'origine : $d/${f#./}"; fi
  done
  echo "  rlBdx restant $d : $(grep -rl rlBdx ~/$d/public --include='*.html' | wc -l)"
done
echo "sauvegarde : $S"
echo "== RESERVATION"; (cd ~/booking && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -1)
echo "== RL DRIVER";   (cd ~/suivi && firebase deploy --only hosting --project rafai-suivi < /dev/null 2>&1 | tail -1)
sleep 8
for u in https://booking.rafai-limousine.com/ https://team.rafai-limousine.com/chauffeur/; do echo "$u rlBdx : $(curl -s "$u?_=$(date +%s)" | grep -c 'rlBdx')"; done
echo FIN-RETOUR-OR
