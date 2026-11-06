#!/bin/bash
# Vidéo émotion Rafai Limousine : voix (Piper, déjà faite dans ~/voix) + musique + image,
# puis mise en ligne sur un canal de prévisualisation Firebase (le site en ligne ne change pas).
set -e
H="${1:?commit}"
cd ~/voix
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web/video/emo"
for f in timing.json mixe.py musique-emo.wav image-emo.mp4; do curl -sLf -o $f "$R/$f"; done
ls p01.wav p11.wav >/dev/null
python3 mixe.py
python3 -c "import imageio_ffmpeg" 2>/dev/null || python3 -m pip install --user -q imageio-ffmpeg 2>&1 | tail -1
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -v error -y -i image-emo.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart Rafai-Limousine-merci.mp4
ls -la Rafai-Limousine-merci.mp4 | awk '{print "VIDEO", $5}'
mkdir -p ~/videopub/public && cp Rafai-Limousine-merci.mp4 ~/videopub/public/
cat > ~/videopub/public/index.html <<'EOF'
<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Rafai Limousine – Merci</title>
<style>body{margin:0;background:#0a0a0b;color:#eee;font-family:-apple-system,system-ui,sans-serif;text-align:center}video{width:100%;max-width:420px;max-height:78vh;display:block;margin:16px auto;border-radius:14px;background:#000}a{display:inline-block;margin:8px 16px 18px;padding:14px 26px;border-radius:999px;background:linear-gradient(180deg,#E0BA6C,#B68F3E);color:#111;font-weight:700;text-decoration:none}p{color:#aaa;font-size:14px;margin:0 20px 30px}</style></head>
<body><video src="Rafai-Limousine-merci.mp4" controls playsinline preload="metadata"></video>
<a href="Rafai-Limousine-merci.mp4" download>Télécharger la vidéo</a>
<p>Pour l’envoyer aux chauffeurs : téléchargez la vidéo, puis partagez le fichier (WhatsApp…).</p></body></html>
EOF
cd ~/videopub && echo '{"hosting":{"public":"public"}}' > firebase.json
firebase hosting:channel:deploy merci --expires 30d --project rafai-suivi 2>&1 | tail -3
echo FIN-EMO
