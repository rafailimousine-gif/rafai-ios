# Chronologie commune : voix (Cloud Shell), musique, sous-titres (ad).
import json
D = [3.96, 6.0, 1.75, 8.39, 4.52, 6.75, 5.6, 4.26, 5.18, 5.17, 4.46]
S = [2.2, 7.1, 14.1, 16.6, 25.9, 31.0, 39.0, 46.0, 51.0, 57.1, 63.5]
T = 74.5
L = [
 [("Je m'appelle Yassine.", None, 0), ("Je suis chauffeur, comme vous.", None, 0)],
 [("Pendant deux ans, jour et nuit,", None, 0), ("entre deux courses, j'ai construit quelque chose.", None, 0)],
 [("Deux applications.", None, 1)],
 [("La première, pour nos clients : Rafaï Limousine.", "La première, pour nos clients : Rafai Limousine.", 0), ("Réserver en une minute,", None, 0), ("et suivre son chauffeur en direct.", None, 0)],
 [("La seconde, pour nous, les chauffeurs :", None, 0), ("Ère Elle Draïveur.", "RL Driver.", 1)],
 [("Nos missions, nos trajets,", None, 0), ("notre bon de mission en cas de contrôle :", None, 0), ("tout est là, dans notre poche.", None, 0)],
 [("Aujourd'hui, ces deux applications", None, 0), ("sont validées par Apple, sur l'App Store.", None, 0)],
 [("Je voulais vous le dire, à vous, mes collègues :", None, 0), ("c'est possible.", None, 1)],
 [("Possible de changer.", None, 1), ("Possible de créer sa propre indépendance.", None, 1)],
 [("Tout est possible dans la vie.", None, 0), ("Main dans la main, on peut tous y arriver.", None, 1)],
 [("Merci à vous.", None, 1), ("À très bientôt, sur Rafaï Limousine.", "À très bientôt, sur Rafai Limousine.", 1)],
]
LEAD, TRAIL = 0.12, 0.22
def w(s): return len(s) + 7 * sum(s.count(c) for c in ',:.') 
chunks = []
for i, line in enumerate(L):
    a, d = S[i] + LEAD, D[i] - LEAD - TRAIL
    tot = sum(w(p) for p, _, _ in line); acc = 0
    for j, (p, disp, hide) in enumerate(line):
        s0 = a + d * acc / tot; acc += w(p); s1 = a + d * acc / tot
        chunks.append({'l': i, 'j': j, 'a': round(s0, 2), 'b': round(s1, 2), 't': disp or p, 'h': hide})
json.dump({'S': S, 'D': D, 'T': T, 'C': chunks}, open('timing.json', 'w'), ensure_ascii=False, indent=0)
for c in chunks: print(c['l'], c['j'], c['a'], c['b'], c['h'], c['t'])
