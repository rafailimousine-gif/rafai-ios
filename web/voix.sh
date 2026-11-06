#!/bin/bash
# Voix off de la vidéo : Piper (gratuit, sur la machine Cloud Shell), voix française d'homme.
set -e
H="${1:?commit}"; VOIX="${2:-tom}"
mkdir -p ~/voix && cd ~/voix
R="https://raw.githubusercontent.com/rafailimousine-gif/rafai-ios/$H/web/video"
curl -sLf -o texte.txt "$R/narration.txt"; curl -sLf -o voix.py "$R/voix.py"
python3 -c "import piper" 2>/dev/null || python3 -m pip install --user -q piper-tts 2>&1 | tail -2
case "$VOIX" in
  tom) V=fr_FR-tom-medium; P=fr/fr_FR/tom/medium ;;
  gilles) V=fr_FR-gilles-low; P=fr/fr_FR/gilles/low ;;
  upmc) V=fr_FR-upmc-medium; P=fr/fr_FR/upmc/medium ;;
esac
B="https://huggingface.co/rhasspy/piper-voices/resolve/main/$P"
[ -s $V.onnx ] || curl -sLf -o $V.onnx "$B/$V.onnx"
[ -s $V.onnx.json ] || curl -sLf -o $V.onnx.json "$B/$V.onnx.json"
rm -f p*.wav
python3 voix.py $V.onnx 1.12
which ffmpeg >/dev/null 2>&1 && echo "FFMPEG oui" || echo "FFMPEG non"
echo FIN-VOIX
