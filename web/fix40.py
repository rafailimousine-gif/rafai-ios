# Page de réservation (site + applis) : cadre de la photo du chauffeur comme sur le site (or qui tourne + lueur) (rlArchB v2, 14 nov. 2026)
import io, os, re, sys
f = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
if 'rlArchB v2' in s:
    print('deja en place'); sys.exit(0)
CSS = ('<style id="rlArchB">/* rlArchB v2 : cadre arche du site, tete jamais coupee */'
       '@property --tva{syntax:"<angle>";inherits:false;initial-value:0deg}'
       '@keyframes tvspin{to{--tva:360deg}}'
       '@keyframes tvglow{0%,100%{box-shadow:0 8px 20px rgba(0,0,0,.35),0 0 0 rgba(224,186,108,0)}50%{box-shadow:0 8px 20px rgba(0,0,0,.35),0 0 20px rgba(224,186,108,.4)}}'
       '.drv img.av{--tva:0deg;width:72px;height:95px;padding:0;border:3px solid transparent;border-radius:50% 50% 12% 12%/38% 38% 9% 9%;'
       'object-fit:cover;object-position:50% 20%;'
       'background:radial-gradient(ellipse 80% 70% at 50% 35%,#2a2622 0%,#141312 70%,#0e0d0c 100%) padding-box,'
       'conic-gradient(from var(--tva),#6f5120,#b8873f 12%,#f6dfa4 22%,#fff6dc 26%,#E0BA6C 32%,#7a5a24 50%,#b8873f 68%,#f0d394 80%,#6f5120) border-box;'
       'animation:tvspin 4.5s linear infinite,tvglow 3s ease-in-out infinite}'
       '@media (prefers-reduced-motion:reduce){.drv img.av{animation:none}}</style>')
m = re.search(r'<style id="rlArchB">.*?</style>', s, re.S)
if m:
    s = s[:m.start()] + CSS + s[m.end():]
else:
    assert s.count('</head>') == 1
    s = s.replace('</head>', CSS + '</head>', 1)
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlArchB v2', len(s))
