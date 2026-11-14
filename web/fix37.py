# Appli RL Driver (team.rafai-limousine.com/chauffeur/) : photo du chauffeur dans un cadre « arche » doré comme sur le site (rlArch v1, 14 nov. 2026)
# Usage : python3 fix37.py ~/suivi/public/chauffeur/index.html
import io, os, sys
f = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/suivi/public/chauffeur/index.html')
s = io.open(f, encoding='utf-8').read()
if 'rlArch v1' in s:
    print('deja en place'); sys.exit(0)
CSS = ('<style id="rlArch">/* rlArch v1 : cadre arche, tete jamais coupee */'
       '.pf img.av{width:64px;height:84px;border-radius:50% 50% 14% 14%/40% 40% 10% 10%;object-fit:cover;object-position:50% 18%;'
       'border:2px solid #D9B46A;box-shadow:0 0 0 1px rgba(111,81,32,.45),0 4px 16px rgba(224,186,108,.3);background:#141312}'
       '.pf div.av{border-radius:50% 50% 14% 14%/40% 40% 10% 10%;width:64px;height:84px}</style>')
A = '</head>'
assert s.count(A) == 1, 'ancre </head>'
s = s.replace(A, CSS + A, 1)
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlArch v1', len(s))
