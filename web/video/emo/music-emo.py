# Musique émotion (piano + cordes), synthèse numpy, baissée sous la voix.
import numpy as np, json, wave
SR = 44100
TL = json.load(open('timing.json'))
T = TL['T']; N = int(T * SR)
BAR = 3.25; BEAT = BAR / 4; E8 = BEAT / 2
rng = np.random.RandomState(11)
L = np.zeros(N); Rr = np.zeros(N)          # piste "sèche"
Lw = np.zeros(N); Rw = np.zeros(N)         # envoi réverbe
mf = lambda m: 440.0 * 2 ** ((m - 69) / 12)

def add(sig, t0, pan=0.0, wet=0.3, gain=1.0):
    i0 = int(t0 * SR)
    if i0 >= N: return
    s = sig[:N - i0] * gain
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i0:i0 + len(s)] += s * gl; Rr[i0:i0 + len(s)] += s * gr
    Lw[i0:i0 + len(s)] += s * gl * wet; Rw[i0:i0 + len(s)] += s * gr * wet

def piano(m, vel, hold):
    f = mf(m); dur = hold + 0.35; n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n); B = 0.00035
    for k in range(1, 11):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 15000: break
        ak = (1 / k ** 1.25) * np.exp(-(k - 1) * (0.55 - 0.3 * vel))
        dk = (0.55 + 0.22 * k) * (f / 261.6) ** 0.35
        env = 0.72 * np.exp(-t * dk * 1.6) + 0.28 * np.exp(-t * dk * 0.35)
        out += ak * env * np.sin(2 * np.pi * fk * t + rng.rand() * 6.28)
    a = np.minimum(1, t / 0.004)
    rel = np.clip((dur - t) / 0.3, 0, 1)                # pédale relevée
    return out * a * rel * vel * 0.22

def pad(ms, dur, gain):
    n = int((dur + 1.4) * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for m in ms:
        f = mf(m)
        for det in (-0.0045, 0.0, 0.0045):
            ff = f * (1 + det); ph = rng.rand() * 6.28
            for k in range(1, 11):
                if k * ff > 9000: break
                out += (1 / k) * np.exp(-k / 3.2) * np.sin(2 * np.pi * k * ff * t + ph * k)
    env = np.minimum(1, t / 1.0) * np.clip((dur + 1.4 - t) / 1.4, 0, 1)
    trem = 1 + 0.06 * np.sin(2 * np.pi * 0.25 * t)
    return out * env * trem * gain / (len(ms) * 3)

def bass(m, dur, gain):
    f = mf(m); n = int((dur + .5) * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + .28 * np.sin(4 * np.pi * f * t) + .1 * np.sin(6 * np.pi * f * t)
    env = np.minimum(1, t / .06) * (0.75 + 0.25 * np.exp(-t * 2)) * np.clip((dur + .5 - t) / .5, 0, 1)
    return s * env * gain

CH = {  # basse, arpège 8 croches, notes des cordes
 'Am': (45, [57, 64, 69, 72, 76, 72, 69, 64], [57, 60, 64, 69]),
 'F':  (41, [53, 60, 65, 69, 72, 69, 65, 60], [53, 57, 60, 65]),
 'C':  (48, [55, 60, 64, 67, 72, 67, 64, 60], [55, 60, 64, 67]),
 'G':  (43, [55, 62, 67, 71, 74, 71, 67, 62], [55, 59, 62, 67]),
}
prog = ['Am', 'F', 'C', 'G'] * 3 + ['F', 'G', 'Am', 'C', 'F', 'G', 'C', 'C'] + ['F', 'C', 'C']
mel = {12: [77, 72], 13: [74, 71], 14: [72, 76], 15: [79, 76], 16: [81, 77], 17: [79, 74], 18: [76], 19: [72]}

for b, name in enumerate(prog):
    t0 = b * BAR
    if b >= 22: break
    if t0 >= T: break
    bs, arp, st = CH[name]
    lift = 12 <= b <= 19; end = b >= 20
    # piano
    if b < 20:
        vel = 0.5 if b < 4 else (0.52 if b < 12 else 0.62)
        for i, m in enumerate(arp):
            if b < 2 and i % 2 == 1: continue                 # début plus dépouillé
            v = vel * (1.0 if i % 4 == 0 else 0.82) * (0.92 + 0.12 * rng.rand())
            add(piano(m, v, BAR - i * E8), t0 + i * E8 + rng.rand() * 0.012, pan=(m - 64) / 40, wet=0.35)
    elif b == 20:  # F, plus lent
        for i, m in enumerate([53, 60, 65, 69]):
            add(piano(m, 0.5, BAR - i * BEAT), t0 + i * BEAT, pan=(m - 64) / 40, wet=0.4)
    elif b == 21:  # accord final arpégé, C add9
        for i, m in enumerate([36, 48, 55, 62, 64, 67, 72, 76]):
            add(piano(m, 0.5 if m > 40 else 0.4, T - t0 - i * 0.09 - 0.2), t0 + i * 0.09, pan=(m - 60) / 40, wet=0.45)
    # mélodie
    if b in mel:
        ns = mel[b]; d = BAR / len(ns)
        for i, m in enumerate(ns):
            add(piano(m, 0.62, d), t0 + i * d, pan=0.15, wet=0.45)
            add(piano(m - 12, 0.32, d), t0 + i * d, pan=-0.1, wet=0.45)
    # cordes
    if b >= 3:
        g = 0.05 if b == 3 else (0.10 if b < 12 else 0.16)
        if end: g = 0.12
        dur = BAR if b < 21 else T - t0 - 1.0
        notes = st + ([n + 12 for n in st[1:]] if lift else [])
        sig = pad(notes, dur, g)
        add(sig, t0 - (0.4 if b > 3 else 0), pan=-0.2, wet=0.5)
        add(pad(notes, dur, g * 0.8), t0 - (0.4 if b > 3 else 0), pan=0.25, wet=0.5)
    # basse
    if 4 <= b <= 21:
        add(bass(bs, BAR if b < 21 else T - t0 - 1.0, 0.16 if b < 12 else 0.2), t0, pan=0, wet=0.08)
    # pulsation (partie montante)
    if lift:
        for k in (0, 2):
            n = int(.45 * SR); t = np.arange(n) / SR
            th = np.sin(2 * np.pi * (52 + 40 * np.exp(-t * 30)) * t) * np.exp(-t * 9) * 0.5
            add(th, t0 + k * BEAT, wet=0.05)

# montée de souffle 36.8 -> 39.0, puis impact à 39.0
a, z = 36.8, 39.0; n = int((z - a) * SR); t = np.arange(n) / SR
nz = rng.randn(n); y = np.zeros(n); c = 0.0; acc = 0.0
cut = 0.01 + 0.25 * (t / t[-1]) ** 2
for i in range(n):
    acc += cut[i] * (nz[i] - acc); y[i] = acc
add(y * (t / t[-1]) ** 2 * 0.22, a, wet=0.3)
n = int(2.4 * SR); t = np.arange(n) / SR
boom = np.sin(2 * np.pi * (36 + 50 * np.exp(-t * 6)) * t) * np.exp(-t * 2.2) * 0.4
add(boom, 39.0, wet=0.25)
# petites notes de cloche (icônes, coches, logo)
def bell(f, g):
    n = int(3 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3)) * np.exp(-t * 1.6) * g
C = {(c['l'], c['j']): c for c in TL['C']}
k = C[(6, 1)]['a']
for tt, f in [(13.75, 1318.5), (14.0, 1567.98), (k + .3, 1567.98), (k + .5, 2093.0), (63.35, 1318.5), (63.55, 1975.5)]:
    add(bell(f, 0.035), tt, pan=0.2, wet=0.6)

# réverbe (convolution, bruit décroissant)
def ir(seed):
    r = np.random.RandomState(seed); n = int(3.0 * SR); t = np.arange(n) / SR
    h = r.randn(n) * np.exp(-t * 6.9 / 2.6); h[:int(.02 * SR)] = 0
    # adoucit les aigus de la queue
    H = np.fft.rfft(h); fr = np.fft.rfftfreq(n, 1 / SR); H *= 1 / (1 + (fr / 5000) ** 2); h = np.fft.irfft(H, n)
    return h / np.sqrt((h ** 2).sum())
def conv(x, h):
    m = len(x) + len(h); M = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, M) * np.fft.rfft(h, M), M)[:len(x)]
L += conv(Lw, ir(1)) * 0.9; Rr += conv(Rw, ir(2)) * 0.9

mix = np.stack([L, Rr], 1)
mix *= 10 ** (-21 / 20) / np.sqrt((mix ** 2).mean())
# baisse sous la voix
tt = np.arange(N) / SR; g = np.ones(N)
for s, d in zip(TL['S'], TL['D']):
    a, b = s - 0.2, s + d + 0.05
    g = np.minimum(g, 1 - 0.68 * np.clip(np.minimum((tt - (a - .35)) / .35, ((b + .45) - tt) / .45), 0, 1))
fade = np.clip(tt / 0.25, 0, 1) * np.clip((T - tt) / 2.2, 0, 1)
mix *= (g * fade)[:, None]
ax = np.abs(mix); mix = np.where(ax < .7, mix, np.sign(mix) * (.7 + .25 * np.tanh((ax - .7) / .25)))
pk = np.abs(mix).max(); print('crête', round(pk, 3))
with wave.open('musique-emo.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print('ok', T)
