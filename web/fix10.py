# Google réserve le paramètre « c » des URL d'applis Web Apps Script (erreur immédiate, « Pas de connexion »).
# Les pages envoient désormais « tk » (même valeur) ; le serveur accepte les deux.
import io, os, sys
H = os.path.expanduser('~')
JOBS = [
    (os.path.join(H, 'booking/public/index.html'), [
        ("var q = Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');",
         "var q = Object.keys(params).map(function (k) { return encodeURIComponent(k === 'c' ? 'tk' : k) + '=' + encodeURIComponent(params[k]); }).join('&');"),
    ]),
    (os.path.join(H, 'suivi/public/chauffeur/index.html'), [
        ("'&c=' + c", "'&tk=' + c"),
        ("'&c=team&_='", "'&tk=team&_='"),
    ]),
]
for f, reps in JOBS:
    s = io.open(f, encoding='utf-8').read()
    if all(b in s for a, b in reps):
        print('deja modifie', f); continue
    for a, b in reps:
        n = s.count(a)
        if n != 1:
            print('ARRET', f, a, n); sys.exit(1)
        s = s.replace(a, b)
    io.open(f, 'w', encoding='utf-8').write(s)
    print('ok', f, len(s))
