# Vidéo émotion : place les phrases de la voix (p01.wav ... p11.wav) sur la musique -> mix.wav
import numpy as np, wave, json
TL = json.load(open('timing.json'))

def rd(f):
    with wave.open(f) as w:
        sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        a = np.frombuffer(w.readframes(n), dtype='<i2').astype(np.float64) / 32768
    return (a.reshape(-1, ch) if ch > 1 else a), sr

def resample(a, sr, SR):
    if sr == SR: return a
    n = len(a); m = int(round(n * SR / sr))
    A = np.fft.rfft(a); B = np.zeros(m // 2 + 1, complex); k = min(len(A), len(B)); B[:k] = A[:k]
    return np.fft.irfft(B, m) * (m / n)

def conv(x, h):
    m = len(x) + len(h); M = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, M) * np.fft.rfft(h, M), M)[:len(x)]

mus, SR = rd('musique-emo.wav')
N = len(mus); v = np.zeros(N)
for i, s in enumerate(TL['S']):
    a, sr = rd('p%02d.wav' % (i + 1))
    if a.ndim > 1: a = a.mean(1)
    a = resample(a, sr, SR)
    i0 = int(s * SR); m = min(len(a), N - i0); v[i0:i0 + m] += a[:m]
# coupe les très basses fréquences
V = np.fft.rfft(v); f = np.fft.rfftfreq(N, 1 / SR); V *= 1 / np.sqrt(1 + (70 / np.maximum(f, 1)) ** 4); v = np.fft.irfft(V, N)
# petite salle (chaleur)
r = np.random.RandomState(5); n = int(.8 * SR); t = np.arange(n) / SR
h = r.randn(n) * np.exp(-t * 6.9 / .55); h[:int(.012 * SR)] = 0
H = np.fft.rfft(h); fr = np.fft.rfftfreq(n, 1 / SR); H *= 1 / (1 + (fr / 4000) ** 2); h = np.fft.irfft(H, n); h /= np.sqrt((h ** 2).sum())
v = v + 0.16 * conv(v, h)
# niveau de la voix : -17 dB (moyenne sur les passages parlés)
fr_ = int(.05 * SR); e = np.array([np.sqrt((v[i:i + fr_] ** 2).mean()) for i in range(0, N - fr_, fr_)])
act = e[e > 10 ** (-45 / 20)]
g = 10 ** (-17 / 20) / np.sqrt((act ** 2).mean()); v *= g
out = mus + v[:, None]
ax = np.abs(out); out = np.where(ax < .8, out, np.sign(out) * (.8 + .18 * np.tanh((ax - .8) / .18)))
print('voix gain', round(20 * np.log10(g), 1), 'dB ; crête', round(float(np.abs(out).max()), 3))
with wave.open('mix.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
print('MIX OK', round(N / SR, 2), 's')
