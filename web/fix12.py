# Page de réservation : message clair quand une course est hors zone (France uniquement :
# départ et arrivée en France). Le contrôle lui-même est fait par le serveur (erreur « zone »).
import io, os, re, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
if 'errZone' in s:
    print('deja modifie'); sys.exit(0)

# 1. Textes (fr, en, ar, zh : ordre des dictionnaires dans la page)
Z = [
    "Nous intervenons uniquement en France : le départ et l’arrivée doivent être en France.",
    "We only operate in France: pickup and drop-off must both be in France.",
    "نعمل داخل فرنسا فقط: يجب أن يكون مكان الانطلاق والوصول في فرنسا.",
    "我们仅在法国提供服务：出发地和目的地都须位于法国境内。",
]
it = iter(Z)
s, n = re.subn(r"errRoute:\s*'", lambda m: "errZone: '" + next(it) + "', " + m.group(0), s)
if n != 4:
    print('ARRET textes', n); sys.exit(1)

# 2. Devis et modification d'une course
s, n = re.subn(r"r\s*&&\s*r\.err\s*===\s*'route'\s*\?\s*t\('errRoute'\)\s*:",
               lambda m: "r && r.err === 'zone' ? t('errZone') : " + m.group(0), s)
if n != 2:
    print('ARRET devis', n); sys.exit(1)

# 3. Envoi de la réservation
s, n = re.subn(r"err\('e3',\s*r\s*&&\s*r\.err\s*===\s*'quota'",
               lambda m: "err('e3', r && r.err === 'zone' ? t('errZone') : " + m.group(0)[len("err('e3',"):].lstrip(), s)
if n != 1:
    print('ARRET reservation', n); sys.exit(1)

io.open(f, 'w', encoding='utf-8').write(s)
print('ok page', len(s))
