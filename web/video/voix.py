# Voix off : une phrase par ligne -> p01.wav, p02.wav... (Piper, voix française d'homme)
import sys, wave
model = sys.argv[1]; ls = float(sys.argv[2]) if len(sys.argv) > 2 else 1.1
lines = [l.strip() for l in open('texte.txt', encoding='utf-8') if l.strip()]
try:
    from piper import PiperVoice
except ImportError:
    from piper.voice import PiperVoice
v = PiperVoice.load(model)
for i, l in enumerate(lines, 1):
    fn = 'p%02d.wav' % i
    with wave.open(fn, 'wb') as w:
        try:
            from piper import SynthesisConfig
            v.synthesize_wav(l, w, syn_config=SynthesisConfig(length_scale=ls))
        except ImportError:
            v.synthesize(l, w, length_scale=ls)
    with wave.open(fn) as w:
        print('DUREE', i, round(w.getnframes() / w.getframerate(), 2))
