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
def webp(raw, key, maxw=1600):
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

EMB = {}
def embed(code):
    k = sha(code)
    if k in EMB:
        return EMB[k]
    c = RE_DATA.sub(data_img, code)
    c = RE_LH.sub(lh_img, c)
    c = lazy_ads(c)
    c = re.sub(r'https?://(?:www\.)?rafai-limousine\.com(?=[/"\'])', '', c)
    io.open(OUT + '/e/' + k + '.html', 'w', encoding='utf-8').write(c)
    EMB[k] = '/e/' + k + '.html'
    return EMB[k]

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
    return ('<div id="rlbar"><p>%s</p><a href="%s" target="_blank" rel="noopener">%s</a></div>' % (html.escape(bar['t']), bar['u'], bar['b']) +
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
        new = s.new_tag('iframe', src=src, title='Rafai Limousine', scrolling='no', frameborder='0', allow='geolocation; clipboard-write')
        new['class'] = 'rlif'
        if n > 2:
            new['loading'] = 'lazy'
        e.replace_with(new)
    for a in s.find_all('a', href=True):
        a['href'] = unwrap(a['href'])
    for e in s.find_all(True):
        for k in ('jscontroller', 'jsaction', 'jsname', 'jsdata', 'jsmodel', 'jsshadow', 'jsslot', 'data-tile-id'):
            if e.has_attr(k):
                del e[k]
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
yc = yc.replace('</head>', '<style>.fab,.teaser{display:none!important}body.ph .app{border-radius:0;border:0}</style></head>', 1)
YV = sha(yc)[:8]
for l, tag in (('en', 'en'), ('fr', 'fr'), ('zh', 'zh-CN'), ('ar', 'ar')):
    io.open(OUT + '/e/youri-%s-%s.html' % (l, YV), 'w', encoding='utf-8').write(
        yc.replace("var L0='en'", "var L0='%s'" % l, 1).replace('<html lang="en">', '<html lang="%s">' % tag, 1))
open(OUT + '/img/logo.png', 'wb').write(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logo.png'), 'rb').read())
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
    for g in CFG['groups']:
        if p in g:
            for l, q in zip(('en', 'fr', 'zh', 'ar'), g):
                head.append('<link rel="alternate" hreflang="%s" href="%s">' % (l, BASE + ('/' if q == '/home' else urllib.parse.quote(q))))
    if TEST:
        head.append('<meta name="robots" content="noindex">')
    head.append('</head>')
    y = CFG['youri'][lg]
    yb = ('<button type="button" id="rlyfab" aria-label="%s" data-src="/e/youri-%s-%s.html">Y</button>'
          '<button type="button" id="rlytz"%s><b>%s</b><span>%s</span></button>'
          % (html.escape(y['a'], quote=True), lg, YV, ' dir="rtl"' if lg == 'ar' else '', html.escape(y['t1']), html.escape(y['t2'])))
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
print('pages', len(docs), 'blocs', len(EMB), 'images', len(IMG))
