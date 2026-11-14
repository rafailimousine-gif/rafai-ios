# Appli RL Driver : cadre de la photo comme sur le site (or qui tourne + lueur) et photo à jour tout de suite (rlArch v2, 14 nov. 2026)
# - remplace le style rlArch v1 par la version du site (.tv .ar de rafai-limousine.com)
# - la photo gardée sur le téléphone est oubliée une fois (nouvelles photos du 14/11) et n'est plus gardée qu'5 min au lieu d'1 h
import io, os, re, sys
f = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/suivi/public/chauffeur/index.html')
s = io.open(f, encoding='utf-8').read()
if 'rlArch v2' in s:
    print('deja en place'); sys.exit(0)
CSS = ('<style id="rlArch">/* rlArch v2 : cadre arche du site, tete jamais coupee */'
       '@property --tva{syntax:"<angle>";inherits:false;initial-value:0deg}'
       '@keyframes tvspin{to{--tva:360deg}}'
       '@keyframes tvglow{0%,100%{box-shadow:0 10px 26px rgba(0,0,0,.55),0 0 0 rgba(224,186,108,0)}50%{box-shadow:0 10px 26px rgba(0,0,0,.55),0 0 22px rgba(224,186,108,.35)}}'
       '.pf img.av{--tva:0deg;width:88px;height:116px;padding:0;border:3px solid transparent;border-radius:50% 50% 12% 12%/38% 38% 9% 9%;'
       'object-fit:cover;object-position:50% 20%;'
       'background:radial-gradient(ellipse 80% 70% at 50% 35%,#2a2622 0%,#141312 70%,#0e0d0c 100%) padding-box,'
       'conic-gradient(from var(--tva),#6f5120,#b8873f 12%,#f6dfa4 22%,#fff6dc 26%,#E0BA6C 32%,#7a5a24 50%,#b8873f 68%,#f0d394 80%,#6f5120) border-box;'
       'animation:tvspin 4.5s linear infinite,tvglow 3s ease-in-out infinite}'
       '.pf div.av{width:88px;height:116px;border-radius:50% 50% 12% 12%/38% 38% 9% 9%}'
       '@media (prefers-reduced-motion:reduce){.pf img.av{animation:none}}</style>'
       '<script>/* rlArch v2 : photos du 14/11 */try{if(localStorage.getItem("rc_ph_v")!=="2"){for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i);if(k&&k.indexOf("rc_ph_")===0)localStorage.removeItem(k)}localStorage.setItem("rc_ph_v","2")}}catch(e){}</script>')
m = re.search(r'<style id="rlArch">.*?</style>', s, re.S)
if m:
    s = s[:m.start()] + CSS + s[m.end():]
else:
    assert s.count('</head>') == 1
    s = s.replace('</head>', CSS + '</head>', 1)
TTL = 'Date.now() - (PH.at || 0) < 36e5'
if s.count(TTL) == 1:
    s = s.replace(TTL, 'Date.now() - (PH.at || 0) < 3e5', 1)
else:
    print('attention : delai de la photo non trouve')
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlArch v2', len(s), s.count('rlArch v2'))
