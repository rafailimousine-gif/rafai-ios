# Chronologie rythmée (voix rapide) calée sur une grille de 100 BPM.
import json, sys, math
D = json.loads(sys.argv[1]); BPM = 100; BAR = 240 / BPM
exec(open('tl.py').read().split("LEAD, TRAIL")[0].split("T = 74.5")[1])   # récupère L (textes)
GAP = [0.45, 0.5, 0.35, 0.45, 0.4, 0.5, 0.6, 0.4, 0.45, 0.5]
S = [BAR]
for i in range(1, 11):
    s = S[-1] + D[i - 1] + GAP[i - 1]
    if i in (6, 10):                       # « validées par Apple » et « merci » sur un début de mesure
        s = math.ceil((s - 0.05) / BAR) * BAR
    S.append(round(s, 2))
T = math.ceil((S[10] + D[10] + 5.5) / BAR) * BAR + 0.5
LEAD, TRAIL = 0.1, 0.18
def w(s): return len(s) + 7 * sum(s.count(c) for c in ',:.')
chunks = []
for i, line in enumerate(L):
    a, d = S[i] + LEAD, D[i] - LEAD - TRAIL
    tot = sum(w(p) for p, _, _ in line); acc = 0
    for j, (p, disp, hide) in enumerate(line):
        s0 = a + d * acc / tot; acc += w(p); s1 = a + d * acc / tot
        chunks.append({'l': i, 'j': j, 'a': round(s0, 2), 'b': round(s1, 2), 't': disp or p, 'h': hide})
verse = round(math.floor(S[1] / BAR) * BAR, 3)
out = {'S': S, 'D': D, 'T': round(T, 2), 'C': chunks, 'bpm': BPM, 'verse': verse, 'lift': S[6], 'outro': S[10]}
json.dump(out, open('timing.json', 'w'), ensure_ascii=False, indent=0)
print('S', S); print('T', out['T'], 'verse', verse, 'lift', S[6], 'outro', S[10])
