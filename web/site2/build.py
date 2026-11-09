#!/usr/bin/env python3
# Nouveau site Rafai Limousine : reprend les pages publiées de Google Sites (mêmes adresses, même contenu)
# et en fait des pages statiques légères pour Firebase Hosting. Rien n'est modifié sur Google Sites.
import base64, hashlib, html, io, json, os, re, sys, urllib.parse, urllib.request
from bs4 import BeautifulSoup
from PIL import Image

H = os.path.expanduser('~')
SRC = H + '/site-src'
ROOT = H + '/site-www'
OUT = ROOT + '/public'
BASE = 'https://www.rafai-limousine.com'
TEST = '--prod' not in sys.argv
CFG = json.load(io.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pages.json'), encoding='utf-8'))
PAGES = CFG['pages']
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36'}
for d in (SRC, OUT + '/img', OUT + '/e', OUT + '/css'):
    os.makedirs(d, exist_ok=True)

def get(url):
    q = urllib.parse.quote(url, safe=':/?&=%#+,;~@!$*()')
    with urllib.request.urlopen(urllib.request.Request(q, headers=UA), timeout=60) as r:
        return r.read()

def sha(b):
    return hashlib.sha1(b if isinstance(b, bytes) else b.encode('utf-8')).hexdigest()[:14]

IMG = {}
# Photos remplacées sur le site (pages.json « swap ») : empreinte de l'ancienne image → nouveau fichier à côté de build.py
SWAP = {}
for k, f in (CFG.get('swap') or {}).items():
    sp = os.path.join(os.path.dirname(os.path.abspath(__file__)), f)
    if os.path.exists(sp):
        SWAP[k] = open(sp, 'rb').read()
    else:
        print('ARRET photo de remplacement absente', f); sys.exit(1)
def webp(raw, key, maxw=1600):
    if sha(raw) in SWAP:
        print('photo remplacee', sha(raw))
        raw = SWAP[sha(raw)]
    if key in IMG:
        return IMG[key]
    name = None
    try:
        im = Image.open(io.BytesIO(raw))
        im.load()
        alpha = im.mode in ('RGBA', 'LA', 'P')
        im = im.convert('RGBA' if alpha else 'RGB')
        if im.width > maxw:
            im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
        name = sha(raw) + '.webp'
        im.save(OUT + '/img/' + name, 'WEBP', quality=80, method=6)
    except Exception:
        ext = 'svg' if raw[:200].lstrip()[:4] in (b'<svg', b'<?xm') else 'bin'
        name = sha(raw) + '.' + ext
        open(OUT + '/img/' + name, 'wb').write(raw)
    IMG[key] = '/img/' + name
    return IMG[key]

RE_DATA = re.compile(r'data:image/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+')
RE_LH = re.compile(r'https://(?:lh\d+(?:-[a-z]+)?\.googleusercontent\.com|ssl\.gstatic\.com/atari/images)/[^"\'\s)<>\\]+')

def data_img(m):
    s = m.group(0)
    if len(s) < 900:
        return s
    return webp(base64.b64decode(s.split(',', 1)[1]), sha(s))

def lh_img(m):
    u = html.unescape(m.group(0))
    p = SRC + '/lh-' + sha(u)
    if not os.path.exists(p):
        try:
            open(p, 'wb').write(get(u))
        except Exception as e:
            print('image absente', u[:80], e)
            return m.group(0)
    return webp(open(p, 'rb').read(), sha(u))

def lazy_ads(c):
    # Le suivi Google de chaque bloc se charge au premier geste du visiteur : le code de conversion reste identique.
    a = re.search(r'<script[^>]*src=["\']https://www\.googletagmanager\.com/gtag/js\?id=([^"\']+)["\'][^>]*></script>', c)
    if not a:
        return c
    load = ('<script>(function(){var d=0;function l(){if(d)return;d=1;var s=document.createElement("script");s.async=1;'
            's.src="https://www.googletagmanager.com/gtag/js?id=%s";document.head.appendChild(s)}'
            '["pointerdown","keydown","focusin"].forEach(function(e){addEventListener(e,l,{once:true,passive:true})})})();</script>' % a.group(1))
    return c[:a.start()] + load + c[a.end():]

def fonts_async(c):
    # police Google des blocs : chargée sans bloquer l'affichage (sinon la page entière attend le serveur de polices)
    def f(m):
        t = m.group(0)
        if 'fonts.googleapis.com' in t and 'stylesheet' in t and 'media=' not in t:
            t = t[:-1].rstrip().rstrip('/').rstrip() + ' media="print" onload="this.media=\'all\'">'
            NFA[0] += 1
        return t
    return re.sub(r'<link\b[^>]*>', f, c)
NFA = [0]

def rename(c):
    for x, y in CFG['rename']:
        c = c.replace(x, y)
    return c

# Carte de réservation sur ordinateur : plus grande, contenu centré dans la partie noire (le téléphone ne change pas)
BIG = ('<style>@media (min-width:440px) and (min-height:600px){'
       '.photo{display:flex;flex-direction:column;justify-content:center;padding-bottom:40px}'
       '.photo p{font-size:clamp(30px,6vw,46px);line-height:1.04;padding:24px 30px 6px}'
       '.photo p small{font-size:12.5px;letter-spacing:.18em;margin-bottom:12px}'
       '.photo p span{font-size:16px;margin-top:12px}'
       '.photo ul{padding:14px 30px 0;font-size:17px}'
       '.photo li{gap:11px;margin-bottom:12px}.photo li::before{width:8px;height:8px}'
       '.photo::after{left:30px;right:30px}'
       '.card{padding:20px 24px 22px}'
       '.tab{font-size:15.5px;padding:10px 20px}.note{font-size:13.5px;margin-top:4px}'
       '#s1 .fields{gap:12px;margin-top:14px}#s1 .f{padding:11px 16px;border-radius:14px}'
       '#s1 .f label{font-size:11px}#s1 .f input,#s1 .f select{font-size:18px}'
       '#s1 .see{font-size:17px;padding:17px 18px;border-radius:14px}#s1 .duo{gap:12px;margin-top:12px}#s1 .duo .btn{padding:14px 16px}'
       '}</style>')
NBIG = [0]
NLZ = [0]
HERO = {}
NCH = [0]

NAP = [0]
# Forfaits aéroport (9 nov. 2026) : Paris ↔ CDG, Orly ou Le Bourget, prix fixes TTC sans hausse ni « à partir de »
# Classe E 170 €, Classe V 200 €, Classe S 265 €, Range Rover 350 €. Le bloc de réservation vient de Google Sites : on le corrige ici.
AP_OLD = 'function price(c){var p=rlHike(price0(c));'
AP_NEW = ('var RL_AP={sedan:170,van:200,first:265,suv:350},'
          'RL_APX={cdg:{lat:49.0097,lon:2.5479,r:4},ory:{lat:48.7262,lon:2.3652,r:2.5},lbg:{lat:48.9694,lon:2.4414,r:2.5}};'
          'function rlKm(a,b){var r=Math.PI/180,x=(b.lat-a.lat)*r,y=(b.lon-a.lon)*r,'
          'h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(y/2)*Math.sin(y/2);'
          'return 12742*Math.asin(Math.sqrt(h));}'
          'function rlApOf(p){if(!hasGeo(p))return \'\';for(var k in RL_APX)if(rlKm(p,RL_APX[k])<=RL_APX[k].r)return k;return \'\';}'
          'function rlZ(s){s=(s||\'\').toLowerCase();if(/bourget|\\blbg\\b/.test(s))return \'lbg\';'
          'var z=zone(s);return (z===\'cdg\'||z===\'ory\'||z===\'paris\')?z:\'\';}'
          'function rlAP(c){if(mode!==\'oneway\'||!RL_AP[c])return null;var a=sel.from,b=sel.to,aa,bb,pa,pb;'
          'if(hasGeo(a)&&hasGeo(b)){aa=rlApOf(a);bb=rlApOf(b);pa=!aa&&rlKm(a,GEO.PAR)<=12;pb=!bb&&rlKm(b,GEO.PAR)<=12;}'
          'else{var za=rlZ(($(\'from\')||{}).value),zb=rlZ(($(\'to\')||{}).value);'
          'aa=za===\'paris\'?\'\':za;bb=zb===\'paris\'?\'\':zb;pa=za===\'paris\';pb=zb===\'paris\';}'
          'if((aa&&pb)||(bb&&pa))return {v:RL_AP[c],note:\'Fixed airport price\'};return null;}'
          'function price(c){var p=rlAP(c)||rlHike(price0(c));')
def airport_rates(c):
    if AP_OLD in c:
        c = c.replace(AP_OLD, AP_NEW, 1)
        NAP[0] += 1
    return c

# « À bord de chaque voiture » (9 nov. 2026, demande de Yassine) : sous les voitures du bloc de réservation,
# trois icônes : 2 bouteilles d'Evian, câble de charge USB-C, Wi-Fi illimité (comme sur l'appli).
NBD = [0]
BD_OLD = '<div class="promo" id="promoF">'
BD_TX = {
    'fr': ('Offert à bord de chaque voiture', '2 bouteilles d’Evian', 'Câble de charge USB-C', 'Wi-Fi illimité'),
    'en': ('Complimentary in every car', '2 bottles of Evian', 'USB-C charging cable', 'Unlimited Wi-Fi'),
    'ar': ('مجانًا في كل سيارة', 'زجاجتان من مياه إيفيان', 'كابل شحن USB-C', 'واي فاي غير محدود'),
    'zh': ('每辆车免费提供', '2 瓶依云矿泉水', 'USB-C 充电线', '无限 Wi-Fi'),
}
# « Musique à bord » (9 nov. 2026, demande de Yassine) : champ juste avant « Comments » de l'étape 3 ;
# le choix est ajouté en tête du commentaire envoyé (« Music: Jazz »), sans rien changer d'autre au bloc.
MU_OLD = '<div class="f wide"><label for="notes">'
MU_TX = {
    'fr': ('Musique à bord', 'Pas de préférence', 'Musique', ['Sans musique', 'Classique', 'Jazz', 'Lounge / chill', 'Pop', 'R&B / Soul', 'Orientale', 'Radio']),
    'en': ('Music on board', 'No preference', 'Music', ['No music', 'Classical', 'Jazz', 'Lounge / chill', 'Pop', 'R&B / Soul', 'Arabic / Oriental', 'Radio']),
    'ar': ('الموسيقى في السيارة', 'بدون تفضيل', 'الموسيقى', ['بدون موسيقى', 'كلاسيكية', 'جاز', 'لاونج / هادئة', 'بوب', 'آر أند بي / سول', 'شرقية', 'راديو']),
    'zh': ('车内音乐', '无偏好', '音乐', ['不要音乐', '古典', '爵士', '休闲 Lounge', '流行', 'R&B / 灵魂乐', '东方音乐', '电台']),
}
MU_JS = ('<script>(function(){var s=document.getElementById("rlMus"),n=document.getElementById("notes"),b=document.getElementById("next3");'
         'if(!s||!n||!b)return;var P=s.getAttribute("data-p")+": ";'
         'b.addEventListener("click",function(){var v=n.value.split("\\n").filter(function(l){return l.indexOf(P)!==0;}).join("\\n").trim();'
         'if(s.value)v=P+s.options[s.selectedIndex].text+(v?"\\n"+v:"");n.value=v;},true);})();</script>')
BD_IC = (
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 2.5h4v2.2l1.3 1.7c.5.7.7 1.4.7 2.2V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8.6c0-.8.2-1.5.7-2.2L10 4.7z"/><path d="M8 11.5h8M8 16h8"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7.5" y="2.5" width="9" height="8" rx="2.5"/><path d="M10.5 6.5h3"/><path d="M12 10.5v3.5c0 2.2-1.6 3.5-3.5 3.5S5 18.7 5 21.5"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 8.8a14 14 0 0 1 19 0"/><path d="M5.5 12.2a9.6 9.6 0 0 1 13 0"/><path d="M8.7 15.5a5 5 0 0 1 6.6 0"/><circle cx="12" cy="19.2" r="1.3" fill="currentColor" stroke="none"/></svg>')
BD_CSS = ('<style>.rlbd{margin:12px 0 4px;padding:12px 14px;border:1px solid var(--line,#E5E3DE);border-radius:12px;background:rgba(201,160,99,.07)}'
          '.rlbd .t{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-text,#8A6630);margin:0 0 9px}'
          '.rlbd .r{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}'
          '.rlbd .i{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;font-size:12.5px;font-weight:700;line-height:1.25;color:var(--ink,#111113)}'
          '.rlbd .c{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#111113;color:#E6CC93}'
          '.rlbd svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}</style>')
def onboard(c):
    if BD_OLD not in c or 'class="rlbd"' in c:
        return c
    lg = 'fr' if 'passagers' in c else 'ar' if 'ركاب' in c else 'zh' if '乘客' in c else 'en'
    t = BD_TX[lg]
    blk = ('<div class="rlbd"><div class="t">%s</div><div class="r">' % html.escape(t[0]) +
           ''.join('<div class="i"><span class="c">%s</span>%s</div>' % (BD_IC[i], html.escape(t[i + 1])) for i in range(3)) + '</div></div>\n    ')
    c = c.replace(BD_OLD, blk + BD_OLD, 1)
    if '</head>' in c:
        c = c.replace('</head>', BD_CSS + '</head>', 1)
    NBD[0] += 1
    if MU_OLD in c and 'id="rlMus"' not in c and '</body>' in c:
        m = MU_TX[lg]
        fld = ('<div class="f wide"><label for="rlMus"><svg class="ico"><use href="#note"/></svg>%s</label>'
               '<select id="rlMus" data-p="%s"><option value="">%s</option>%s</select></div>\n      '
               % (html.escape(m[0]), html.escape(m[2], quote=True), html.escape(m[1]),
                  ''.join('<option value="%d">%s</option>' % (i, html.escape(o)) for i, o in enumerate(m[3]))))
        c = c.replace(MU_OLD, fld + MU_OLD, 1)
        c = c.replace('</body>', MU_JS + '</body>', 1)
        NMU[0] += 1
    return c
NMU = [0]

EMB = {}
def embed(code):
    k = sha(code)
    if k in EMB:
        return EMB[k]
    c = RE_DATA.sub(data_img, code)
    c = RE_LH.sub(lh_img, c)
    c = lazy_ads(c)
    c = fonts_async(c)
    c = re.sub(r'https?://(?:www\.)?rafai-limousine\.com(?=[/"\'])', '', c)
    c = rename(c)
    c = airport_rates(c)
    c = onboard(c)
    # l'ancien écran de choix (dans le bloc de réservation, iPhone seulement) est remplacé par celui de toute la page (rl-site.js)
    if 'if (window.__rlCh) return; window.__rlCh = 1;' in c:
        c = c.replace('if (window.__rlCh) return; window.__rlCh = 1;', 'return;', 1)
        NCH[0] += 1
    if '<div class="photo">' in c and 'id="s1"' in c and '</head>' in c:
        c = c.replace('</head>', BIG + '</head>', 1)
        NBIG[0] += 1
    n = sha(c)  # le nom suit le contenu : un bloc modifié n'est jamais servi depuis l'ancien cache
    io.open(OUT + '/e/' + n + '.html', 'w', encoding='utf-8').write(c)
    EMB[k] = '/e/' + n + '.html'
    return EMB[k]

# Badges des stores : Google Play (badge officiel téléchargé par www.sh) et App Store (repris de Google Sites), marges retirées
def trim(raw):
    im = Image.open(io.BytesIO(raw)).convert('RGBA')
    a = im.getchannel('A')
    if a.getextrema()[0] < 250:
        box = a.point(lambda v: 255 if v > 16 else 0).getbbox()
    else:
        bg = Image.new('RGBA', im.size, im.getpixel((0, 0)))
        from PIL import ImageChops
        box = ImageChops.difference(im, bg).convert('L').point(lambda v: 255 if v > 24 else 0).getbbox()
    return im.crop(box) if box else im
def badge(raw, key):
    im = trim(raw)
    b = io.BytesIO(); im.save(b, 'PNG')
    path = webp(b.getvalue(), key, maxw=800)
    return path, im.width, im.height
GPF = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gplay.png')
GP = badge(open(GPF, 'rb').read(), 'gplay') if os.path.exists(GPF) else None
GPU = CFG['bar'].get('u2', '')
AB = None
NGP = [0]

def unwrap(u):
    m = re.match(r'https?://www\.google\.com/url\?q=([^&]+)', u)
    if m:
        u = urllib.parse.unquote(m.group(1))
    return re.sub(r'^https?://(?:www\.)?rafai-limousine\.com(?=/|$)', '', u) or '/'

def lang(p):
    return p[1:3] if re.match(r'/(fr|zh|ar)(/|$)', p) else 'en'

def header(p, lg):
    tree = CFG['nav']
    def li(it):
        cur = ' class="on"' if it['u'] == p else ''
        kids = it.get('c')
        if not kids:
            return '<li><a href="%s"%s>%s</a></li>' % (it['u'], cur, html.escape(it['t']))
        return ('<li class="dd"><a href="%s"%s>%s</a><button type="button" aria-label="%s" aria-expanded="false"></button><ul>%s</ul></li>'
                % (it['u'], cur, html.escape(it['t']), html.escape(it['t']), ''.join(li(k) for k in kids)))
    bar = CFG['bar']
    if AB and GP and GPU:
        btn = ('<span class="st"><a href="%s" target="_blank" rel="noopener"><img src="%s" alt="Download on the App Store" width="%d" height="30"></a>'
               '<a href="%s" target="_blank" rel="noopener"><img src="%s" alt="Get it on Google Play" width="%d" height="30"></a></span>'
               % (bar['u'], AB[0], round(AB[1] * 30 / AB[2]), GPU, GP[0], round(GP[1] * 30 / GP[2])))
    else:
        btn = '<a href="%s" target="_blank" rel="noopener">%s</a>' % (bar['u'], bar['b'])
    return ('<div id="rlbar"><p>%s</p>%s</div>' % (html.escape(bar['t']), btn) +
            '<header id="rlnav"><button type="button" id="rlmenu" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button>'
            '<a class="brand" href="/home"><img src="%s" alt="Rafai Limousine" width="40" height="40"><span>Rafai Limousine</span></a>'
            '<nav><ul>%s</ul></nav></header>' % (LOGO, ''.join(li(i) for i in tree)))

CSSRC = None
YCODE = None
YV = ''
STY = {}
LOGO = '/img/logo.png'
docs = []
for p in PAGES:
    f = SRC + '/p-' + sha(p) + '.html'
    if not os.path.exists(f):
        open(f, 'wb').write(get(BASE + p))
    t = open(f, 'rb').read().decode('utf-8')
    s = BeautifulSoup(t, 'html.parser')
    title = (s.title.string if s.title else 'Rafai Limousine').strip()
    if CSSRC is None:
        CSSRC = [l.get('href') for l in s.find_all('link', rel='stylesheet')]
    sty = ''.join(x.get_text() for x in s.find_all('style'))
    STY[sha(sty)] = sty
    hd = s.find('header', id='atIdViewHeader')
    if hd:
        hd.decompose()
    for c in ('PPhIP', 'p9b27', 'BuY5Fd', 'TbNlJb', 'M63kCb', 'dZA9kd', 'JPdR6b', 'Q0cSn', 'hBW7Hb', 'lhbLEe'):
        for e in s.select('.' + c):
            e.decompose()
    for e in s.find_all(['script', 'noscript', 'link', 'style']):
        e.decompose()
    # carte de réservation : sa colonne s'élargit sur ordinateur (voir site.css.add)
    for e in s.select('[data-code]'):
        c0 = e['data-code']
        if not ('<div class="photo">' in c0 and 'id="s1"' in c0):
            continue
        col = e
        while col.parent and 'LS81yb' not in (col.parent.get('class') or []):
            col = col.parent
        row = col.parent
        if not row or col is e:
            continue
        sib = [x for x in row.find_all(recursive=False) if x is not col]
        fond = any('<plaintext' in (d.get('data-code') or '') for x in sib for d in x.select('[data-code]'))
        col['class'] = (col.get('class') or []) + ['rlbook']
        row['class'] = (row.get('class') or []) + ['rlbook-bg' if fond else 'rlbook-duo']
    n = 0
    for e in s.select('[data-code]'):
        if 'id="fab"' in e['data-code'] and 'class="app"' in e['data-code']:
            # Youri quitte le bas de page : il devient le bouton flottant de toutes les pages
            if p == '/home':
                YCODE = e['data-code']
            col = e
            while col.parent and 'LS81yb' not in (col.parent.get('class') or []):
                col = col.parent
            row = col.parent
            col.decompose()
            if row:
                row['class'] = row.get('class', []) + ['rlsolo']
            continue
        n += 1
        src = embed(e['data-code'])
        ttl = (e.find('iframe') or {}).get('title', '') if e.find('iframe') else ''
        # le bloc se charge juste après le premier affichage de la page (rl-site.js) : la page s'affiche plus vite
        new = s.new_tag('iframe', title='Rafai Limousine', scrolling='no', frameborder='0', allow='geolocation; clipboard-write')
        new['data-src'] = src
        new['class'] = 'rlif'
        if n > 2:
            new['loading'] = 'lazy'
        e.replace_with(new)
    for a in s.find_all('a', href=True):
        a['href'] = unwrap(a['href'])
    if GP and GPU:
        for a in s.find_all('a', href=re.compile(r'apps\.apple\.com')):
            if not a.find('img') or 'rlgp' in (a.get('class') or []):
                continue
            g = s.new_tag('a', href=GPU, target='_blank', rel='noopener')
            g['class'] = ['rlgp']
            gi = s.new_tag('img', src=GP[0], alt='Get it on Google Play', width=str(round(GP[1] * 40 / GP[2])), height='40')
            g.append(gi)
            a.insert_after(g)
            NGP[0] += 1
    for e in s.find_all(True):
        for k in ('jscontroller', 'jsaction', 'jsname', 'jsdata', 'jsmodel', 'jsshadow', 'jsslot', 'data-tile-id'):
            if e.has_attr(k):
                del e[k]
    # photos de fond des sections : la première (haut de page) reste, les suivantes se chargent quand on s'en approche (rl-site.js)
    hero = None
    for k, e in enumerate(s.find_all(style=re.compile('background-image'))):
        st = RE_LH.sub(lh_img, e['style'])
        m = re.search(r'background-image:\s*url\((["\']?)(/img/[^"\')]+)\1\)\s*;?', st)
        if not m:
            e['style'] = st
            continue
        if hero is None:
            hero = m.group(2)
            e['style'] = st
        else:
            e['style'] = (st[:m.start()] + st[m.end():]).strip()
            e['data-bg'] = m.group(2)
            NLZ[0] += 1
    HERO[p] = hero
    imgs = s.find_all('img')
    for i, e in enumerate(imgs):
        if i:
            e['loading'] = 'lazy'
        e['decoding'] = 'async'
        if not e.get('alt'):
            sec = e.find_parent('section')
            h = sec.find(['h1', 'h2', 'h3']) if sec else None
            e['alt'] = (h.get_text(' ', strip=True) if h else '') or title
    body = s.body
    cls = ' '.join(body.get('class', []))
    inner = body.decode_contents()
    inner = RE_LH.sub(lh_img, inner)
    inner = rename(inner)
    if GP:
        inner = inner.replace('and App Store are trademarks of Apple Inc.', 'and App Store are trademarks of Apple Inc. Google Play and the Google Play logo are trademarks of Google LLC.')
    lg = lang(p)
    docs.append((p, lg, title, cls, inner))

# Onglet « Team » (9 nov. 2026, demande de Yassine) : la photo d'équipe et les trois valeurs.
# Page faite ici (pas sur Google Sites) : /team en anglais, /fr/equipe en français.
TEAM_JPG = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'team-rafai.jpg')
if not os.path.exists(TEAM_JPG):
    print('ARRET photo equipe absente (team-rafai.jpg)'); sys.exit(1)
# Nom tiré du contenu : les images /img/ sont gardées un an par les navigateurs (immutable).
TEAM_IMG = '/img/team-%s.webp' % sha(open(TEAM_JPG, 'rb').read())[:10]
Image.open(TEAM_JPG).convert('RGB').save(OUT + TEAM_IMG, 'WEBP', quality=84, method=6)
TEAM_TX = {
    'en': {'p': '/team', 'k': 'Our team', 'v': ['Punctuality', 'Rigour', 'Professionalism'],
           'd': ['Your flight is tracked in real time, with one hour of waiting time included at the airport.',
                 'A fixed price confirmed before the ride, immaculate vehicles, every detail checked.',
                 'Discreet, courteous chauffeurs, a name sign at arrivals, available 24/7.'],
           'alt': 'Team Rafai Limousine: Yassine Rafai, CEO and President, the chauffeurs and the fleet',
           'c1': 'Book on WhatsApp', 'c2': 'Contact us', 'cu': '/contact', 'n': 'Vehicle photos: illustrations.'},
    'fr': {'p': '/fr/equipe', 'k': 'Notre équipe', 'v': ['Ponctualité', 'Rigueur', 'Professionnalisme'],
           'd': ["Vol suivi en temps réel et 1 h d'attente offerte à l'aéroport.",
                 'Prix fixe annoncé avant la course, véhicules impeccables, chaque détail vérifié.',
                 'Chauffeurs discrets et courtois, pancarte à votre nom, disponibles 24h/24 et 7j/7.'],
           'alt': "Team Rafai Limousine : Yassine Rafai, CEO – Président, les chauffeurs et la flotte",
           'c1': 'Réserver sur WhatsApp', 'c2': 'Nous contacter', 'cu': '/fr/contact', 'n': "Photos des véhicules : illustrations."}}
TEAM_CSS = ('<style>.rlteam{max-width:1080px;margin:0 auto;padding:48px 20px 64px;font:500 16px/1.6 Manrope,system-ui,sans-serif;color:#111;text-align:center}'
            '.rlteam .k{margin:0;font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#8a6a2f}'
            '.rlteam h1{margin:8px 0 6px;font:600 clamp(30px,5vw,46px)/1.15 Lora,Georgia,serif}'
            '.rlteam .v{margin:0 0 28px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#8a6a2f;font-size:clamp(12px,2.4vw,15px)}'
            '.rlteam figure{margin:0 auto;max-width:640px}.rlteam figure img{display:block;width:100%;height:auto;border-radius:18px;box-shadow:0 18px 40px rgba(0,0,0,.18)}'
            '.rlteam .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:36px 0 0;text-align:left}'
            '.rlteam .cards div{border:1px solid #e7e1d4;border-radius:16px;padding:20px 22px;background:#fffdf8}'
            '.rlteam .cards h2{margin:0 0 6px;font:600 21px/1.25 Lora,Georgia,serif;color:#7a5c24}.rlteam .cards p{margin:0;color:#4a4640;font-size:15px}'
            '.rlteam .cta{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin:32px 0 0}'
            '.rlteam .cta a{display:inline-block;padding:13px 24px;border-radius:999px;text-decoration:none;font-weight:700}'
            '.rlteam .cta a.w{background:#111;color:#fff}.rlteam .cta a.c{border:1.5px solid #111;color:#111}'
            '.rlteam .n{margin:22px 0 0;font-size:12.5px;color:#8b867c}'
            '@media (max-width:760px){.rlteam .cards{grid-template-columns:1fr}.rlteam{padding-top:32px}}</style>')
for lg, x in TEAM_TX.items():
    cards = ''.join('<div><h2>%s</h2><p>%s</p></div>' % (html.escape(v), html.escape(d)) for v, d in zip(x['v'], x['d']))
    inner = (TEAM_CSS + '<main class="rlteam"><p class="k">%s</p><h1>Team Rafai Limousine</h1><p class="v">%s</p>'
             '<figure><img src="%s" width="1080" height="1350" alt="%s" decoding="async" fetchpriority="high"></figure>'
             '<section class="cards">%s</section>'
             '<p class="cta"><a class="w" href="https://wa.me/33667099494" target="_blank" rel="noopener">%s</a><a class="c" href="%s">%s</a></p>'
             '<p class="n">%s</p></main>'
             % (html.escape(x['k']), ' · '.join(html.escape(v) for v in x['v']), TEAM_IMG, html.escape(x['alt'], quote=True), cards,
                html.escape(x['c1']), x['cu'], html.escape(x['c2']), html.escape(x['n'])))
    docs.append((x['p'], lg, 'Team Rafai Limousine', '', inner))
print('onglet Team :', ', '.join(x['p'] for x in TEAM_TX.values()))

# feuilles de style
css = ''
for u in CSSRC:
    if 'gstatic.com/_/atari' in u:
        css = get(u).decode('utf-8')
io.open(ROOT + '/atari.css', 'w', encoding='utf-8').write(css + '\n' + '\n'.join(STY.values()))
print('styles differents :', len(STY), 'atari', len(css))
fonts = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Instrument+Sans:ital,wght@0,400;0,700;1,400&display=swap'
JS = io.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rl-site.js'), encoding='utf-8').read()
# Youri : la version de la Home (la plus récente) dans les 4 langues, sans ouverture automatique ni bouton interne
yf = OUT + embed(YCODE)
yc = io.open(yf, encoding='utf-8').read()
os.remove(yf)
for x in ("function arm(){", "var L0='en'", '<html lang="en">', '</head>'):
    assert x in yc, x
yc = yc.replace('function arm(){', 'function arm(){return;', 1)
# Message vocal : bouton micro dans la barre de l'agent. La voix est transcrite par le navigateur
# (reconnaissance vocale de Chrome / Safari) puis envoyée comme un message écrit. Bouton caché si le navigateur ne sait pas faire.
VOICE = r'''<style>
form.bar button.mic{background:#fff;color:#A8844B;border:1px solid var(--line)}
form.bar button.mic.wait{background:#FFF4E5;color:#A8844B;border-color:#C29B5E}
form.bar button.mic.rec{background:#B3261E;color:#fff;border-color:#B3261E;animation:rlpulse 1.2s ease-in-out infinite}
@keyframes rlpulse{0%,100%{box-shadow:0 0 0 0 rgba(179,38,30,.45)}50%{box-shadow:0 0 0 8px rgba(179,38,30,0)}}
.rlvtip{margin:0 12px 8px;padding:8px 12px;border-radius:12px;background:#FFF4E5;color:#5C4320;font-size:13px;line-height:1.4;text-align:center}
.rlvtip.err{background:#FDECEA;color:#8C1D18}
</style>
<script>
(function(){
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var bar = document.getElementById('bar'), inp = document.getElementById('in');
  if (!SR || !bar || !inp) return;
  var IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var T = {
    en: {a: 'Voice message', w: 'Allow the microphone in the window that appears…', l: 'Listening… speak, then tap the red button to send', n: 'The microphone is blocked. Allow it for this site in your browser settings, then try again.', k: 'Voice message is not available here. Tap the microphone on your keyboard to dictate your message.', e: 'Voice message not available, please type your message.'},
    fr: {a: 'Message vocal', w: 'Autorisez le micro dans la fenêtre qui s’affiche…', l: 'Je vous écoute… parlez, puis touchez le bouton rouge pour envoyer', n: 'Le micro est bloqué. Autorisez-le pour ce site dans les réglages du navigateur, puis réessayez.', k: 'Le message vocal n’est pas disponible ici. Touchez le micro de votre clavier pour dicter votre message.', e: 'Message vocal indisponible, écrivez votre message.'},
    zh: {a: '语音消息', w: '请在弹出的窗口中允许使用麦克风…', l: '正在聆听…说完后点击红色按钮发送', n: '麦克风已被阻止。请在浏览器设置中允许本网站使用麦克风，然后重试。', k: '此处无法使用语音消息。请点击键盘上的麦克风进行听写。', e: '语音消息不可用，请输入文字。'},
    ar: {a: 'رسالة صوتية', w: 'اسمح باستخدام الميكروفون في النافذة التي تظهر…', l: 'أستمع إليك… تحدث ثم اضغط الزر الأحمر للإرسال', n: 'الميكروفون محظور. اسمح به لهذا الموقع في إعدادات المتصفح ثم حاول مجددًا.', k: 'الرسالة الصوتية غير متاحة هنا. اضغط على ميكروفون لوحة المفاتيح لإملاء رسالتك.', e: 'الرسالة الصوتية غير متاحة، يرجى كتابة رسالتك.'}
  };
  var LOC = {en: 'en-GB', fr: 'fr-FR', zh: 'zh-CN', ar: 'ar-SA'};
  function lg() { var l = (document.documentElement.lang || 'en').slice(0, 2); return T[l] ? l : 'en'; }
  var b = document.createElement('button');
  b.type = 'button'; b.id = 'rlmic'; b.className = 'mic'; b.setAttribute('aria-pressed', 'false');
  b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';
  bar.insertBefore(b, bar.querySelector('button[type=submit]'));
  var tip = document.createElement('div');
  tip.className = 'rlvtip'; tip.setAttribute('role', 'status'); tip.hidden = true;
  bar.parentNode.insertBefore(tip, bar);
  function lab() { b.setAttribute('aria-label', T[lg()].a); b.title = T[lg()].a; }
  lab();
  new MutationObserver(lab).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  var rec = null, state = 'off', txt = '', ph = '', dog = null, hideT = null;
  function show(k, err, keep) {
    clearTimeout(hideT);
    tip.textContent = T[lg()][k]; tip.className = 'rlvtip' + (err ? ' err' : ''); tip.hidden = false;
    if (!keep) hideT = setTimeout(function () { tip.hidden = true; }, 9000);
  }
  function hide() { clearTimeout(hideT); tip.hidden = true; }
  function ui(s) {
    state = s;
    b.classList.toggle('wait', s === 'wait'); b.classList.toggle('rec', s === 'rec');
    b.setAttribute('aria-pressed', String(s !== 'off'));
    if (s === 'off') { clearTimeout(dog); if (ph) inp.placeholder = ph; }
  }
  /* Safari (iPhone) renvoie parfois la phrase entière à chaque résultat : on évite les doublons */
  function merge(res) {
    var acc = '';
    for (var i = 0; i < res.length; i++) {
      var r = (res[i][0].transcript || '').trim(); if (!r) continue;
      if (!acc || r.toLowerCase().indexOf(acc.toLowerCase()) === 0) acc = r;
      else if (acc.toLowerCase().indexOf(r.toLowerCase()) === -1) acc += ' ' + r;
    }
    return acc;
  }
  function send() {
    var v = (txt || '').trim(); if (!v) return;
    inp.value = v;
    if (bar.requestSubmit) bar.requestSubmit(); else bar.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}));
  }
  function keyboard() { ui('off'); show('k', false); try { inp.focus(); } catch (e) {} }
  var granted = false, tries = 0;
  /* une seule session de reconnaissance, réutilisée à chaque message (Safari sur iPhone refuse souvent d'en créer une deuxième) */
  /* Sur iPhone, Safari n'accepte souvent qu'une seule écoute par page : chaque message vocal utilise
     une petite page invisible neuve (iframe vide), ce qui remet la reconnaissance à zéro */
  var box = null;
  function ctor(fresh) {
    if (!IOS || !fresh) return SR;
    try {
      if (box) box.remove();
      box = document.createElement('iframe');
      box.setAttribute('allow', 'microphone'); box.setAttribute('aria-hidden', 'true'); box.tabIndex = -1;
      box.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden';
      document.body.appendChild(box);
      var w = box.contentWindow;
      return (w && (w.SpeechRecognition || w.webkitSpeechRecognition)) || SR;
    } catch (e) { return SR; }
  }
  function make(fresh) {
    var C = ctor(fresh), r = new C();
    r.interimResults = true; r.maxAlternatives = 1;
    r.onstart = r.onaudiostart = function () { if (r !== rec) return; granted = true; if (state === 'wait') { ui('rec'); inp.placeholder = T[lg()].l; show('l', false, true); } };
    r.onresult = function (e) { if (r !== rec) return; granted = true; if (state === 'wait') { ui('rec'); show('l', false, true); } txt = merge(e.results); inp.value = txt; };
    r.onerror = function (e) {
      if (r !== rec || state === 'off') return;
      var er = e.error;
      if (er === 'not-allowed') { ui('off'); show('n', true); }
      else if (er === 'service-not-allowed' || er === 'audio-capture' || er === 'network' || er === 'language-not-supported') { keyboard(); }
      else if (er === 'no-speech' || er === 'aborted') { ui('off'); hide(); }
      else { ui('off'); show('e', true); }
    };
    r.onend = function () { if (r !== rec) return; var was = state; ui('off'); if (was === 'rec') { hide(); send(); } };
    return r;
  }
  function begin(fresh) {
    if (fresh && rec) { var o = rec; rec = null; try { o.abort(); } catch (e) {} }
    if (!rec) { try { rec = make(fresh || IOS); } catch (e) { try { rec = make(false); } catch (e2) { keyboard(); return; } } }
    rec.lang = LOC[lg()]; rec.continuous = !IOS;
    try { rec.start(); } catch (e) {
      /* session précédente pas encore libérée : on recommence avec une session neuve */
      if (tries++ < 1) { begin(true); return; }
      keyboard(); return;
    }
    clearTimeout(dog);
    dog = setTimeout(function () {
      if (state !== 'wait') return;
      if (!granted) { show('w', false, true); return; }
      /* micro déjà autorisé mais rien ne démarre : nouvelle tentative, puis dictée du clavier */
      if (tries++ < 1) begin(true); else keyboard();
    }, granted ? 3500 : 6000);
  }
  /* le doigt sur le bouton ne doit pas fermer le clavier avant le clic (sinon le bouton bouge et le clic se perd) */
  b.addEventListener('mousedown', function (e) { e.preventDefault(); });
  b.addEventListener('touchstart', function () {}, {passive: true});
  b.addEventListener('click', function () {
    if (state !== 'off') {
      if (state === 'wait') { ui('off'); hide(); try { rec.abort(); } catch (e) {} }
      else { try { rec.stop(); } catch (e) { ui('off'); } }
      return;
    }
    txt = ''; tries = 0; ph = inp.placeholder;
    /* sur iPhone, si la zone de texte avait la main (clavier), on la libère avant d'ouvrir le micro */
    var foc = document.activeElement === inp;
    try { inp.blur(); } catch (e) {}
    inp.value = ''; ui('wait'); show(granted ? 'l' : 'w', false, true);
    if (IOS && foc) setTimeout(function () { if (state === 'wait') begin(true); }, 350); else begin(IOS);
  });
})();
</script>
'''
assert yc.count('</body>') == 1, 'fin de page agent'
assert 'id="bar"' in yc and 'id="in"' in yc and 'id="small"' in yc, 'barre agent'
yc = yc.replace('</body>', VOICE + '</body>', 1)
AGENT = {'en': 'Agent AI Concierge', 'fr': 'Agent AI Concierge', 'zh': 'Agent AI Concierge', 'ar': 'Agent AI Concierge'}
avb = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'agent.webp'), 'rb').read()
AV = '/img/agent-%s.webp' % sha(avb)[:8]
open(OUT + AV, 'wb').write(avb)
for x in ('<b>Youri</b>', '<div class="av" aria-hidden="true">Y</div>', "$('sub').textContent=t('sub');"):
    assert x in yc, x
yc = yc.replace('<b>Youri</b>', '<b id="whoT">Agent</b>', 1)
yc = yc.replace("$('sub').textContent=t('sub');", "$('sub').textContent=t('sub');$('whoT').textContent=%s[l]||'';" % json.dumps(AGENT, ensure_ascii=False), 1)
yc = yc.replace('<div class="av" aria-hidden="true">Y</div>', '<div class="av" aria-hidden="true" style="background:#fff url(%s) center/cover"></div>' % AV, 1)
yc = yc.replace('</head>', '<style>.fab,.teaser{display:none!important}body.ph .app{border-radius:0;border:0}</style></head>', 1)
YV = sha(yc)[:8]
# contrôle : le code de l'agent doit rester du JavaScript valide après les remplacements
import subprocess, tempfile
for i, sc in enumerate(re.findall(r'<script>([\s\S]*?)</script>', yc)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as tf:
        tf.write(sc)
    r = subprocess.run(['node', '--check', tf.name], capture_output=True, text=True)
    os.remove(tf.name)
    if r.returncode:
        raise SystemExit('ARRET script agent %d invalide : %s' % (i, r.stderr[:300]))
for l, tag in (('en', 'en'), ('fr', 'fr'), ('zh', 'zh-CN'), ('ar', 'ar')):
    io.open(OUT + '/e/agent-%s-%s.html' % (l, YV), 'w', encoding='utf-8').write(
        yc.replace("var L0='en'", "var L0='%s'" % l, 1).replace('<html lang="en">', '<html lang="%s">' % tag, 1))
open(OUT + '/img/logo.png', 'wb').write(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logo.png'), 'rb').read())
for _, _, _, _, inner in docs:
    m = re.search(r'<img[^>]*alt="Download on the App Store"[^>]*src="(/img/[^"]+)"', inner)
    if m and os.path.exists(OUT + m.group(1)):
        AB = badge(open(OUT + m.group(1), 'rb').read(), 'appstore-bar')
        break
print('badges Google Play ajoutes', NGP[0], '· barre', 'badges' if (AB and GP) else 'bouton texte', '· badge Play', GP)
# grande photo du haut de page (image LCP) : demandée en priorité dès le début du chargement
NPRE = [0]
HM = {}
def hero_m(path):
    # sur téléphone la photo couvre une section haute et étroite : seule la bande du milieu se voit, on n'envoie qu'elle
    if path in HM:
        return HM[path]
    out = None
    try:
        im = Image.open(OUT + path).convert('RGB')
        w, h = im.size
        cw = min(w, round(h * 0.5))
        if cw < w * 0.8:
            x = (w - cw) // 2
            out = path[:-5] + '-m.webp'
            im.crop((x, 0, x + cw, h)).save(OUT + out, 'WEBP', quality=72, method=6)
    except Exception as e:
        print('photo du haut non recadree', path, e)
    HM[path] = out
    return out
urls = []
for p, lg, title, cls, inner in docs:
    d = CFG['desc'].get(p) or CFG['desc'].get(lg, '')
    title = CFG.get('titles', {}).get(p, title)
    canon = BASE + ('/' if p == '/home' else urllib.parse.quote(p))
    head = ['<!doctype html><html lang="%s"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' % lg,
            '<title>%s</title>' % html.escape(title), '<meta name="description" content="%s">' % html.escape(d, quote=True),
            '<link rel="canonical" href="%s">' % canon, '<meta property="og:title" content="%s">' % html.escape(title, quote=True),
            '<meta property="og:type" content="website"><meta property="og:url" content="%s">' % canon,
            '<meta property="og:description" content="%s">' % html.escape(d, quote=True),
            '<meta property="og:image" content="%s/img/og.jpg">' % BASE, '<link rel="icon" href="/img/logo.png">',
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="%s" media="print" onload="this.media=\'all\'">' % fonts,
            '<link rel="stylesheet" href="/css/site.css">']
    hp = HERO.get(p)
    if hp and hp.endswith('.webp') and os.path.exists(OUT + hp):
        mp = hero_m(hp)
        if mp:
            head.append('<link rel="preload" as="image" href="%s" media="(max-width:600px)" fetchpriority="high">' % mp)
            head.append('<link rel="preload" as="image" href="%s" media="(min-width:601px)" fetchpriority="high">' % hp)
            head.append('<style>@media (max-width:600px){[style*="%s"]{background-image:url(%s)!important}}</style>' % (hp, mp))
        else:
            head.append('<link rel="preload" as="image" href="%s" fetchpriority="high">' % hp)
        NPRE[0] += 1
    for g in CFG['groups']:
        if p in g:
            for l, q in zip(('en', 'fr', 'zh', 'ar'), g):
                head.append('<link rel="alternate" hreflang="%s" href="%s">' % (l, BASE + ('/' if q == '/home' else urllib.parse.quote(q))))
    if TEST:
        head.append('<meta name="robots" content="noindex">')
    head.append('</head>')
    y = CFG['youri'][lg]
    yb = ('<button type="button" id="rlyfab" aria-label="%s" data-src="/e/agent-%s-%s.html"><img src="%s" alt="" width="62" height="62"><span class="rlwave" aria-hidden="true">👋</span></button>'
          '<button type="button" id="rlytz"%s><b>%s</b><span>%s</span></button>'
          % (html.escape(y['a'], quote=True), lg, YV, AV, ' dir="rtl"' if lg == 'ar' else '', html.escape(y['t1']), html.escape(y['t2'])))
    page = ''.join(head) + '<body class="%s">' % cls + header(p, lg) + inner + yb + '<script src="/css/site.js" defer></script></body></html>'
    fn = OUT + ('/index.html' if False else p + '.html')
    os.makedirs(os.path.dirname(fn), exist_ok=True)
    io.open(fn, 'w', encoding='utf-8').write(page)
    urls.append(canon)
nf = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      '<title>Rafai Limousine</title><meta name="robots" content="noindex"><link rel="icon" href="/img/logo.png"><link rel="stylesheet" href="/css/site.css"></head><body>' +
      header('/home', 'en') + '<main style="max-width:560px;margin:0 auto;padding:72px 24px;text-align:center;font:500 17px/1.7 Manrope,system-ui,sans-serif;color:#111">'
      '<h1 style="font-size:26px;margin:0 0 16px">Page not found</h1><p style="margin:0 0 24px">Page introuvable · 页面未找到 · <span dir="rtl">الصفحة غير موجودة</span></p>'
      '<p style="margin:0"><a href="/" style="color:#8a6a2f">Rafai Limousine</a></p></main><script src="/css/site.js" defer></script></body></html>')
io.open(OUT + '/404.html', 'w', encoding='utf-8').write(nf)
io.open(OUT + '/css/site.js', 'w', encoding='utf-8').write(JS)
io.open(OUT + '/sitemap.xml', 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    ''.join('<url><loc>%s</loc></url>' % html.escape(u) for u in urls) + '</urlset>')
io.open(OUT + '/robots.txt', 'w', encoding='utf-8').write('User-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n' % BASE)
reste = 0
for d, _, fs in os.walk(OUT):
    for f in fs:
        if f.endswith('.html'):
            reste += io.open(os.path.join(d, f), encoding='utf-8').read().replace("src:'Youri", '').count('Youri')
print('nom Youri restant', reste)
print('cartes de reservation agrandies', NBIG[0], '· ancien ecran de choix coupe', NCH[0])
print('forfaits aeroport (E 170, V 200, S 265, RR 350) dans', NAP[0], 'bloc(s) de reservation')
print('a bord (Evian, USB-C, Wi-Fi) dans', NBD[0], 'bloc(s) de reservation · musique dans', NMU[0])
if NBD[0] == 0:
    print('ARRET icones a bord non appliquees (bloc de reservation change sur Google Sites)'); sys.exit(1)
if NAP[0] == 0:
    print('ARRET forfaits aeroport non appliques (bloc de reservation change sur Google Sites)'); sys.exit(1)
print('pages', len(docs), 'blocs', len(EMB), 'images', len(IMG), '· photos du haut prechargees', NPRE[0], '· recadrees telephone', len([1 for v in HM.values() if v]), '· photos de fond differees', NLZ[0], '· polices des blocs sans blocage', NFA[0])
