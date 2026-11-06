# Essaie plusieurs voix d'homme françaises (Piper) sur la narration, mesure la hauteur et la vivacité.
import sys, os, json, wave, numpy as np
from piper import PiperVoice
try:
    from piper import SynthesisConfig
except ImportError:
    SynthesisConfig = None
lines = [l.strip() for l in open('texte.txt', encoding='utf-8') if l.strip()]
C = json.load(open('candidats.json'))
def f0stats(path):
    w = wave.open(path); sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
    N, H = 1024, 256; f = []
    for i in range(0, len(a) - N, H):
        x = a[i:i + N] * np.hanning(N)
        if np.sqrt((x ** 2).mean()) < 0.02: continue
        r = np.fft.irfft(np.abs(np.fft.rfft(x, 2 * N)) ** 2)[:N]
        if r[0] <= 0: continue
        r /= r[0]; lo, hi = int(sr / 300), int(sr / 65)
        k = lo + int(np.argmax(r[lo:hi]))
        if r[k] > 0.45: f.append(sr / k)
    f = np.array(f)
    if len(f) < 10: return 0, 0
    st = 12 * np.log2(f / np.median(f))
    return float(np.median(f)), float(np.std(st))
out = {}
def run(c):
  v = PiperVoice.load(c['model'])
  d = 'cand/' + c['name']; os.makedirs(d, exist_ok=True)
  tot = 0; meds = []; sds = []
  for i, l in enumerate(lines, 1):
      fn = '%s/p%02d.wav' % (d, i)
      with wave.open(fn, 'wb') as w:
          if SynthesisConfig:
              v.synthesize_wav(l, w, syn_config=SynthesisConfig(speaker_id=c.get('spk'), length_scale=c['ls'], noise_scale=c.get('ns', 0.7), noise_w_scale=c.get('nw', 0.85)))
          else:
              v.synthesize(l, w, speaker_id=c.get('spk'), length_scale=c['ls'])
      with wave.open(fn) as w: tot += w.getnframes() / w.getframerate()
      if i in (1, 2, 8, 9, 10):
          m, s = f0stats(fn); meds.append(m); sds.append(s)
  durs = []
  for i in range(1, len(lines) + 1):
      with wave.open('%s/p%02d.wav' % (d, i)) as w: durs.append(round(w.getnframes() / w.getframerate(), 2))
  out[c['name']] = {'f0': round(float(np.median(meds)), 1), 'vivacite': round(float(np.mean(sds)), 2), 'total': round(tot, 1), 'durees': durs}
  print('CAND', c['name'], out[c['name']]['f0'], 'Hz  vivacite', out[c['name']]['vivacite'], 'st  total', out[c['name']]['total'], 's', flush=True)
for c in C:
    try:
        run(c)
    except Exception as e:
        print('ERREUR', c['name'], e, flush=True)
json.dump(out, open('cand/stats.json', 'w'), indent=1)
