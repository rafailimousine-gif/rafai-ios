# Musique « espoir » : pop optimiste (do majeur, 100 BPM), piano, cordes, basse, batterie légère,
# montée + explosion au moment « validées par Apple », baissée sous la voix.
import numpy as np, json, wave
SR = 44100
TL = json.load(open('timing.json'))
T = TL['T']; N = int(T * SR)
BPM = TL.get('bpm', 100); BEAT = 60 / BPM; BAR = 4 * BEAT; E8 = BEAT / 2; E16 = BEAT / 4
S = TL['S']
LIFT = TL['lift']; OUTRO = TL['outro']; VERSE = TL['verse']
rng = np.random.RandomState(21)
L = np.zeros(N); R = np.zeros(N); Lw = np.zeros(N); Rw = np.zeros(N)
PUMP = np.ones(N)            # compression rythmique (cordes/basse) sous la grosse caisse
mf = lambda m: 440.0 * 2 ** ((m - 69) / 12)

def add(sig, t0, pan=0.0, wet=0.25, gain=1.0, pump=False):
    i0 = int(round(t0 * SR))
    if i0 >= N or i0 + len(sig) <= 0: return
    if i0 < 0: sig = sig[-i0:]; i0 = 0
    s = sig[:N - i0] * gain
    if pump: s = s * PUMP[i0:i0 + len(s)]
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i0:i0 + len(s)] += s * gl; R[i0:i0 + len(s)] += s * gr
    Lw[i0:i0 + len(s)] += s * gl * wet; Rw[i0:i0 + len(s)] += s * gr * wet

def lp(x, a):                 # passe-bas 1 pôle (court)
    y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y

def piano(m, vel, hold):
    f = mf(m); dur = hold + 0.3; n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for k in range(1, 12):
        fk = k * f * np.sqrt(1 + 0.0004 * k * k)
        if fk > 16000: break
        ak = (1 / k ** 1.15) * np.exp(-(k - 1) * (0.42 - 0.3 * vel))
        dk = (0.7 + 0.28 * k) * (f / 261.6) ** 0.35
        out += ak * (0.7 * np.exp(-t * dk * 1.5) + 0.3 * np.exp(-t * dk * 0.35)) * np.sin(2 * np.pi * fk * t + rng.rand() * 6.28)
    return out * np.minimum(1, t / 0.003) * np.clip((dur - t) / 0.25, 0, 1) * vel * 0.2

def pluck(m, vel):
    f = mf(m); n = int(0.9 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) * np.exp(-t * 9) + 0.25 * np.sin(6 * np.pi * f * t) * np.exp(-t * 14)
    return s * np.exp(-t * 4.5) * np.minimum(1, t / 0.002) * vel * 0.16

def pad(ms, dur, gain):
    n = int((dur + 0.8) * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for m in ms:
        for det in (-0.004, 0.0, 0.004):
            ff = mf(m) * (1 + det); ph = rng.rand() * 6.28
            for k in range(1, 9):
                if k * ff > 9000: break
                out += (1 / k) * np.exp(-k / 3.0) * np.sin(2 * np.pi * k * ff * t + ph * k)
    env = np.minimum(1, t / 0.35) * np.clip((dur + 0.8 - t) / 0.8, 0, 1)
    return out * env * gain / (len(ms) * 3)

def bassnote(m, dur, gain):
    f = mf(m); n = int((dur + 0.05) * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return s * np.minimum(1, t / 0.008) * np.exp(-t * 2.2) * np.clip((dur + 0.05 - t) / 0.05, 0, 1) * gain

nz = rng.randn(int(2.5 * SR))
def kick():
    n = int(0.32 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (45 * t + 75 / 18 * (1 - np.exp(-t * 18)))) * np.exp(-t * 11) + 0.15 * nz[:n] * np.exp(-t * 250)) * 0.9
def clap():
    n = int(0.25 * SR); t = np.arange(n) / SR; x = nz[:n].copy()
    x = x - lp(x, 0.08); x = lp(x, 0.55)
    env = np.zeros(n)
    for d in (0, 0.011, 0.022): env += np.where(t >= d, np.exp(-(t - d) * (60 if d < 0.02 else 18)), 0)
    return x * env * 0.45
def shaker():
    n = int(0.06 * SR); t = np.arange(n) / SR; x = nz[1000:1000 + n].copy(); x = x - lp(x, 0.3)
    return x * np.minimum(1, t / 0.01) * np.exp(-t * 60) * 0.12
def crash():
    n = int(2.4 * SR); t = np.arange(n) / SR; x = rng.randn(n); x = x - lp(x, 0.25)
    return x * np.exp(-t * 1.6) * 0.22
KICK, CLAP, SHAK, CRASH = kick(), clap(), shaker(), crash()

CH = {'C': (36, [60, 64, 67, 72, 76, 72, 67, 64], [60, 64, 67]),
      'G': (43, [59, 62, 67, 71, 74, 71, 67, 62], [59, 62, 67]),
      'Am': (45, [60, 64, 69, 72, 76, 72, 69, 64], [57, 60, 64]),
      'F': (41, [60, 65, 69, 72, 77, 72, 69, 65], [57, 60, 65])}
LOOP = ['C', 'G', 'Am', 'F']
HOOK = {'C': [76, None, 79, None, 81, 79, 76, None], 'G': [74, None, None, None, 71, 74, 79, None],
        'Am': [76, None, 72, None, 76, 81, 79, None], 'F': [77, None, 76, None, 72, None, 74, None]}
nb = int(np.ceil(T / BAR)) + 1
bar_of = lambda t: int(round(t / BAR))
bV, bL, bO = bar_of(VERSE), bar_of(LIFT), bar_of(OUTRO)

# 1) grosses caisses d'abord (pour la compression rythmique)
for b in range(nb):
    t0 = b * BAR
    if bV <= b < bO:
        beats = (0, 1, 2, 3) if b >= bL else (0, 2)
        for k in beats:
            tk = t0 + k * BEAT; i0 = int(tk * SR)
            if i0 < N:
                n = min(int(0.3 * SR), N - i0); tt = np.arange(n) / SR
                PUMP[i0:i0 + n] = np.minimum(PUMP[i0:i0 + n], 1 - (0.45 if b >= bL else 0.25) * np.exp(-tt / 0.11))

for b in range(nb):
    t0 = b * BAR
    if t0 >= T: break
    if b >= bO:
        name = ['F', 'G', 'C', 'C', 'C', 'C'][min(b - bO, 5)]
    else:
        name = LOOP[b % 4]
    bs, arp, st = CH[name]
    lift = bL <= b < bO; verse = bV <= b < bL; outro = b >= bO
    last = outro and b - bO >= 2
    # piano : croches (couplet), doubles-croches légères (montée)
    if not last:
        vel = 0.5 if b < bV else (0.56 if verse else (0.62 if lift else 0.5))
        for i, m in enumerate(arp):
            v = vel * (1 if i % 4 == 0 else 0.8) * (0.93 + 0.1 * rng.rand())
            add(piano(m + (12 if lift and i % 2 else 0), v, E8 * 2.5), t0 + i * E8 + rng.rand() * 0.006, pan=(m - 66) / 30, wet=0.25)
    elif b - bO == 2:
        for i, m in enumerate([36, 48, 55, 60, 64, 67, 72, 76, 79]):
            add(piano(m, 0.55, T - t0 - i * 0.07), t0 + i * 0.07, pan=(m - 62) / 30, wet=0.4)
    # accords plaqués sur 1 et 3 (énergie)
    if lift:
        for k in (0, 2):
            for m in st: add(piano(m + 12, 0.42, BEAT * 1.6), t0 + k * BEAT, pan=0.1, wet=0.25)
    # cordes
    if b >= 1 and not (outro and b - bO >= 3):
        g = 0.06 if b < bV else (0.09 if verse else (0.14 if lift else 0.1))
        notes = st + [n + 12 for n in st] if lift else st
        add(pad(notes, BAR, g), t0 - 0.15, pan=-0.25, wet=0.45, pump=True)
        add(pad(notes, BAR, g * 0.85), t0 - 0.15, pan=0.25, wet=0.45, pump=True)
    # basse : croches pulsées
    if (verse or lift) :
        for i in range(8):
            if verse and i % 2: continue
            add(bassnote(bs + (12 if (lift and i % 4 == 3) else 0), E8 * (0.9 if lift else 1.8), 0.17 if lift else 0.15), t0 + i * E8, wet=0.05, pump=True)
    elif outro and b - bO < 2:
        add(bassnote(bs, BAR, 0.15), t0, wet=0.05)
    # batterie
    if verse or lift:
        for k in ((0, 1, 2, 3) if lift else (0, 2)):
            add(KICK, t0 + k * BEAT, wet=0.03, gain=0.8 if lift else 0.55)
        for k in (1, 3):
            add(CLAP, t0 + k * BEAT, pan=0.05, wet=0.3, gain=0.8 if lift else 0.45)
        for i in range(16 if lift else 8):
            st_ = E16 if lift else E8
            add(SHAK, t0 + i * st_, pan=0.35, wet=0.1, gain=(1.0 if i % 2 else 0.6))
    # mélodie (refrain)
    if lift:
        for i, m in enumerate(HOOK[name]):
            if m is None: continue
            add(pluck(m, 0.9), t0 + i * E8, pan=0.2, wet=0.35)
            add(pluck(m, 0.35), t0 + i * E8 + 3 * E16, pan=-0.3, wet=0.5)   # écho
    # intro : petite note-cloche sur 1
    if b < bV:
        add(pluck(arp[4] + 12, 0.45), t0, pan=0.25, wet=0.5)

# montée vers le refrain + crash
a = LIFT - 2 * BAR; n = int(2 * BAR * SR); t = np.arange(n) / SR
x = rng.randn(n); y = np.zeros(n); acc = 0.0; cut = 0.01 + 0.35 * (t / t[-1]) ** 2
for i in range(n): acc += cut[i] * (x[i] - acc); y[i] = acc
add(y * (t / t[-1]) ** 2.2 * 0.35, a, wet=0.3)
for k in range(8):                               # roulement de clap
    add(CLAP, LIFT - BAR + k * E8, gain=0.25 + 0.08 * k, wet=0.2)
add(CRASH, LIFT, wet=0.3); add(KICK, LIFT, gain=1.0)
add(CRASH, OUTRO, wet=0.4, gain=0.7)

def ir(seed):
    r = np.random.RandomState(seed); n = int(2.4 * SR); t = np.arange(n) / SR
    h = r.randn(n) * np.exp(-t * 6.9 / 2.0); h[:int(.015 * SR)] = 0
    H = np.fft.rfft(h); fr = np.fft.rfftfreq(n, 1 / SR); H *= 1 / (1 + (fr / 6000) ** 2); h = np.fft.irfft(H, n)
    return h / np.sqrt((h ** 2).sum())
def conv(x, h):
    m = len(x) + len(h); M = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, M) * np.fft.rfft(h, M), M)[:len(x)]
L += conv(Lw, ir(1)) * 0.8; R += conv(Rw, ir(2)) * 0.8
mix = np.stack([L, R], 1)
mix *= 10 ** (-20 / 20) / np.sqrt((mix ** 2).mean())
tt = np.arange(N) / SR; g = np.ones(N)
for s, d in zip(S, TL['D']):
    a, b = s - 0.15, s + d + 0.05
    g = np.minimum(g, 1 - 0.62 * np.clip(np.minimum((tt - (a - .25)) / .25, ((b + .35) - tt) / .35), 0, 1))
fade = np.clip(tt / 0.05, 0, 1) * np.clip((T - tt) / 2.5, 0, 1)
mix *= (g * fade)[:, None]
ax = np.abs(mix); mix = np.where(ax < .7, mix, np.sign(mix) * (.7 + .25 * np.tanh((ax - .7) / .25)))
print('crête', round(float(np.abs(mix).max()), 3))
with wave.open('musique-emo.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print('ok', T)
