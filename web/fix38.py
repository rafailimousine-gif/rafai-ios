# Page de réservation (site + applis) : photo du chauffeur dans un cadre « arche » doré comme sur le site (rlArchB v1, 14 nov. 2026)
import io, os, sys
f = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
if 'rlArchB v1' in s:
    print('deja en place'); sys.exit(0)
CSS = ('<style id="rlArchB">/* rlArchB v1 : cadre arche, tete jamais coupee */'
       '.drv img.av{width:58px;height:76px;border-radius:50% 50% 14% 14%/40% 40% 10% 10%;object-fit:cover;object-position:50% 18%;'
       'border:2px solid #D9B46A;box-shadow:0 0 0 1px rgba(111,81,32,.45),0 4px 14px rgba(224,186,108,.3);background:#141312}</style>')
A = '</head>'
assert s.count(A) == 1, 'ancre </head>'
s = s.replace(A, CSS + A, 1)
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlArchB v1', len(s))
