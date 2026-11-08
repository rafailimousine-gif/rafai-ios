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
print('pages', len(docs), 'blocs', len(EMB), 'images', len(IMG), '· photos du haut prechargees', NPRE[0], '· recadrees telephone', len([1 for v in HM.values() if v]), '· photos de fond differees', NLZ[0], '· polices des blocs sans blocage', NFA[0])
