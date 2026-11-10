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
# Pages chinoises et arabes retirées (10 nov. 2026, demande de Yassine) : plus construites ni dans les menus ;
# les anciennes adresses /zh et /ar renvoient vers l'accueil (redirections dans www.sh)
def _zhar(u):
    return bool(re.match(r'/(zh|ar)(/|$)', u or ''))
PAGES[:] = [p for p in PAGES if not _zhar(p)]
CFG['nav'][:] = [i for i in CFG['nav'] if not _zhar(i.get('u'))]
for _g in CFG['groups']:
    _g[:] = [q for q in _g if not _zhar(q)]
CFG['groups'][:] = [g for g in CFG['groups'] if len(g) > 1]
# « Lifting Rafai Limousine » (10 nov. 2026, demande de Yassine) : nouvelle page d'accueil en anglais (/home) et en français (/fr).
# Le bloc de réservation de Google Sites (prix, étapes, paiement), l'agent IA et l'écran appli restent les mêmes.
LIFT_PAGES = {'/home': 'en', '/fr': 'fr'}
BOOK = {}
BOOKM = {}
BOOKD = {}
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
        name = (sha(raw) if maxw == 1600 else sha(raw + b'|%d' % maxw)) + '.webp'  # une taille = un nom de fichier
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
    # barre du haut : seulement les logos App Store et Google Play, sans texte (10 nov. 2026, demande de Yassine)
    return ('<div id="rlbar">%s</div>' % btn +
            '<header id="rlnav"><button type="button" id="rlmenu" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button>'
            '<a class="brand" href="/home"><img src="%s" alt="Rafai Limousine" width="40" height="40"><span>Rafai Limousine</span></a>'
            '<nav><ul>%s</ul></nav></header>' % (LOGO, ''.join(li(i) for i in tree)))

# « Trajets populaires » (10 nov. 2026, demande de Yassine) : CDG, Orly et Le Bourget → Paris avec les forfaits aéroport
# (mêmes prix que le bloc de réservation, voir RL_AP). Section ajoutée sur l'accueil des 4 langues, juste avant « Réserver ».
RT_ANCHOR = {'en': 'Three steps, no surprises', 'fr': 'Trois étapes, aucune surprise', 'zh': '三步完成，没有意外', 'ar': 'ثلاث خطوات، بلا مفاجآت'}
RT_PRICE = (170, 200, 265, 350)
RT_TX = {
    'en': {'k': 'Popular routes', 'h': 'Airport transfers at a fixed price',
           'p': 'To or from Paris, the same price both ways. Name sign, real-time flight tracking and 1 hour of free waiting included.',
           'r': [('Paris-CDG → Paris', 'Charles de Gaulle Airport · about 45 min'), ('Paris-Orly → Paris', 'Orly Airport · about 35 min'),
                 ('Le Bourget → Paris', 'Private jet terminals · about 30 min')],
           'c': ('E-Class', 'V-Class', 'S-Class', 'Range Rover'), 'f': lambda v: '€%d' % v, 'b': 'Book', 'n': 'Prices per vehicle, VAT included.'},
    'fr': {'k': 'Trajets populaires', 'h': 'Transferts aéroport à prix fixe',
           'p': 'Vers ou depuis Paris, le même prix dans les deux sens. Pancarte à votre nom, vol suivi en temps réel et 1 h d’attente offerte.',
           'r': [('Roissy-CDG → Paris', 'Aéroport Charles-de-Gaulle · environ 45 min'), ('Orly → Paris', 'Aéroport d’Orly · environ 35 min'),
                 ('Le Bourget → Paris', 'Terminaux jets privés · environ 30 min')],
           'c': ('Classe E', 'Classe V', 'Classe S', 'Range Rover'), 'f': lambda v: '%d €' % v, 'b': 'Réserver', 'n': 'Prix par véhicule, TTC.'},
    'zh': {'k': '热门路线', 'h': '机场接送，固定价格',
           'p': '往返巴黎市区，双向同价。含接机举牌、实时航班跟踪和 1 小时免费等候。',
           'r': [('戴高乐机场 (CDG) → 巴黎', '约 45 分钟'), ('奥利机场 (ORY) → 巴黎', '约 35 分钟'), ('勒布尔热 → 巴黎', '私人飞机航站楼 · 约 30 分钟')],
           'c': ('E级', 'V级', 'S级', '揽胜'), 'f': lambda v: '€%d' % v, 'b': '预订', 'n': '每辆车价格，含增值税。'},
    'ar': {'k': 'المسارات الأكثر طلبًا', 'h': 'التوصيل من وإلى المطار بسعر ثابت',
           'p': 'من باريس أو إليها، بالسعر نفسه في الاتجاهين. يشمل لافتة باسمك، وتتبع رحلتك الجوية مباشرةً، وساعة انتظار مجانية.',
           'r': [('مطار شارل ديغول ← باريس', 'حوالي 45 دقيقة'), ('مطار أورلي ← باريس', 'حوالي 35 دقيقة'), ('لو بورجيه ← باريس', 'صالات الطائرات الخاصة · حوالي 30 دقيقة')],
           'c': ('الفئة E', 'الفئة V', 'الفئة S', 'رينج روفر'), 'f': lambda v: '%d €' % v, 'b': 'احجز', 'n': 'السعر لكل سيارة، شامل الضريبة.'},
}
RT_CSS = ('<style>.rlrt{max-width:1148px;margin:0 auto;padding:40px 0 64px;font-family:Manrope,Arial,sans-serif;color:#111113}'
          '.rlrt .k{margin:0;font-size:16px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;color:#8A6630}'
          '.rlrt h2{margin:18px 0 0;font:700 34.67px/1.5 Manrope,Arial,sans-serif;color:#111113}'
          '.rlrt .p{margin:14px 0 0;max-width:720px;font-size:16px;line-height:1.6;color:#5C5C64}'
          '.rlrt .g{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:32px}'
          '.rlrt .c{display:flex;flex-direction:column;background:#fff;border:1px solid #E5E3DE;border-radius:16px;padding:24px 24px 22px}'
          '.rlrt h3{margin:0;font:700 19px/1.3 Manrope,Arial,sans-serif;color:#111113}'
          '.rlrt .s{margin:6px 0 16px;font-size:14px;color:#5C5C64}'
          '.rlrt dl{margin:0 0 18px;display:grid;grid-template-columns:1fr auto;row-gap:0}'
          '.rlrt dt,.rlrt dd{margin:0;padding:9px 0;border-top:1px solid #EFEDE8;font-size:15px}'
          '.rlrt dt{color:#3A3A40}.rlrt dd{font-weight:700;text-align:end}'
          '.rlrt .b{margin-top:auto;display:inline-flex;align-self:flex-start;align-items:center;gap:8px;padding:11px 22px;border-radius:999px;background:#111113;color:#fff;font-weight:700;font-size:15px;text-decoration:none}'
          '.rlrt .b:hover{background:#2A2A2E}'
          '.rlrt .n{margin:16px 0 0;font-size:13px;color:#8B867C}'
          '@media (max-width:900px){.rlrt{padding:32px 24px 48px}.rlrt h2{font-size:28px;line-height:1.3}.rlrt .g{grid-template-columns:1fr;gap:14px}}</style>')
def routes_html(lg):
    x = RT_TX[lg]
    cards = ''
    for t, sub in x['r']:
        rows = ''.join('<dt>%s</dt><dd>%s</dd>' % (html.escape(c), html.escape(x['f'](v))) for c, v in zip(x['c'], RT_PRICE))
        cards += ('<div class="c"><h3>%s</h3><p class="s">%s</p><dl>%s</dl><a class="b" href="#">%s</a></div>'
                  % (html.escape(t), html.escape(sub), rows, html.escape(x['b'])))
    return (RT_CSS + '<section class="rlrt"%s><p class="k">%s</p><h2>%s</h2><p class="p">%s</p><div class="g">%s</div><p class="n">%s</p></section>'
            % (' dir="rtl"' if lg == 'ar' else '', html.escape(x['k']), html.escape(x['h']), html.escape(x['p']), cards, html.escape(x['n'])))
NRT = []
def add_routes(s, p, lg):
    if p not in ('/home', '/fr', '/zh', '/ar'):
        return
    a = RT_ANCHOR[lg]
    secs = [e for e in s.find_all('section') if a in e.get_text()]
    if not secs:
        print('ARRET trajets populaires : ancre introuvable sur', p); sys.exit(1)
    sec = secs[-1]  # la section la plus intérieure qui contient le titre « Réserver »
    sec.insert_before(BeautifulSoup(routes_html(lg), 'html.parser'))
    NRT.append(p)

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
        if p in LIFT_PAGES and 'id="trip"' in e['data-code'] and 'id="from"' in e['data-code']:
            # Google Sites : sur certaines pages un bloc pour ordinateur et un bloc pour téléphone (chacun se vide sur l'autre appareil)
            c0 = e['data-code'].replace(' ', '')
            if "Math.min(screen.width,screen.height)>=600)document.write('<plaintext" in c0:
                BOOKM.setdefault(p, src)
            elif 'Math.min(screen.width,screen.height)<600' in c0:
                BOOKD.setdefault(p, src)
            else:
                BOOK.setdefault(p, src)
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
    add_routes(s, p, lang(p))
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
           'alt': 'Team Rafai Limousine: Yassine Rafai, CEO and President, and the chauffeurs',
           'c1': 'Book on WhatsApp', 'c2': 'Contact us', 'cu': '/contact', 'n': ''},
    'fr': {'p': '/fr/equipe', 'k': 'Notre équipe', 'v': ['Ponctualité', 'Rigueur', 'Professionnalisme'],
           'd': ["Vol suivi en temps réel et 1 h d'attente offerte à l'aéroport.",
                 'Prix fixe annoncé avant la course, véhicules impeccables, chaque détail vérifié.',
                 'Chauffeurs discrets et courtois, pancarte à votre nom, disponibles 24h/24 et 7j/7.'],
           'alt': "Team Rafai Limousine : Yassine Rafai, CEO – Président, et les chauffeurs",
           'c1': 'Réserver sur WhatsApp', 'c2': 'Nous contacter', 'cu': '/fr/contact', 'n': ''}}
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
             '%s</main>'
             % (html.escape(x['k']), ' · '.join(html.escape(v) for v in x['v']), TEAM_IMG, html.escape(x['alt'], quote=True), cards,
                html.escape(x['c1']), x['cu'], html.escape(x['c2']), ('<p class="n">%s</p>' % html.escape(x['n'])) if x['n'] else ''))
    docs.append((x['p'], lg, 'Team Rafai Limousine', '', inner))
print('onglet Team :', ', '.join(x['p'] for x in TEAM_TX.values()))

# Onglet « Services » (10 nov. 2026, demande de Yassine) : tout le contenu remplacé par sa photo et son texte
# (services-en.txt, traduit en français dans services-fr.txt). Fond noir doré. Le chinois et l'arabe ne changent pas.
SVC_JPG = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'services-paris.jpg')
SVC_TXT = {'/services': ('en', 'services-en.txt'), '/fr/services': ('fr', 'services-fr.txt')}
if not os.path.exists(SVC_JPG):
    print('ARRET photo services absente (services-paris.jpg)'); sys.exit(1)
SVC_IMG = '/img/svc-%s.webp' % sha(open(SVC_JPG, 'rb').read())[:10]
Image.open(SVC_JPG).convert('RGB').save(OUT + SVC_IMG, 'WEBP', quality=84, method=6)
SVC_CSS = ('<style>body.rlsvc{background:#0b0b0c}'
           '.rlsv{background:#0b0b0c;color:#c8c2b6;font:400 16.5px/1.75 Manrope,system-ui,sans-serif}'
           '.rlsv .ph{margin:0;position:relative;background:#0b0b0c}'
           '.rlsv .ph img{display:block;width:100%;height:auto;max-height:82vh;object-fit:cover;object-position:center 45%}'
           '.rlsv .ph:after{content:"";position:absolute;left:0;right:0;bottom:0;height:22%;background:linear-gradient(180deg,rgba(11,11,12,0),#0b0b0c);pointer-events:none}'
           '.rlsv .in{max-width:860px;margin:0 auto;padding:8px 22px 72px}'
           '.rlsv .k{margin:0;font-size:12.5px;font-weight:800;letter-spacing:.24em;text-transform:uppercase;color:#E0BA6C}'
           '.rlsv h1{margin:10px 0 18px;font:600 clamp(32px,5.4vw,52px)/1.12 "Cormorant Garamond",Lora,Georgia,serif;color:#f3eee4}'
           '.rlsv .bk{display:inline-flex;align-items:center;gap:10px;padding:14px 28px;border-radius:999px;background:linear-gradient(135deg,#f0d394 0%,#d9b36a 45%,#b8873f 100%);color:#16110a;font-weight:800;font-size:16px;text-decoration:none;box-shadow:0 10px 30px rgba(199,154,74,.28)}'
           '.rlsv .q{margin:44px 0 0;padding:30px 0 0;border-top:1px solid rgba(224,186,108,.22)}'
           '.rlsv h2{margin:0 0 14px;font:600 clamp(25px,3.6vw,33px)/1.2 "Cormorant Garamond",Lora,Georgia,serif;color:#f3eee4}'
           '.rlsv h3{margin:26px 0 8px;font:700 18px/1.35 Manrope,system-ui,sans-serif;color:#E0BA6C}'
           '.rlsv p{margin:0 0 14px}.rlsv strong{color:#f3eee4}'
           '.rlsv ul{margin:4px 0 18px;padding:0;list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}'
           '.rlsv li{position:relative;padding:12px 14px 12px 38px;border:1px solid rgba(224,186,108,.2);border-radius:14px;background:#141316;color:#e6e0d4;line-height:1.5}'
           '.rlsv li:before{content:"";position:absolute;left:15px;top:19px;width:9px;height:9px;border-radius:50%;background:#E0BA6C;box-shadow:0 0 0 4px rgba(224,186,108,.16)}'
           '.rlsv a{color:#E0BA6C}'
           '.rlsv .end{margin:52px 0 0;padding:34px 26px;border:1px solid rgba(224,186,108,.4);border-radius:22px;background:linear-gradient(180deg,#151317,#0e0d10);text-align:center}'
           '.rlsv .end .t{margin:0 0 6px;font:600 clamp(24px,3.4vw,30px)/1.25 "Cormorant Garamond",Lora,Georgia,serif;color:#f3eee4}'
           '.rlsv .end .m{margin:0 0 18px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;font-size:13px;color:#E0BA6C}'
           '.rlsv .end .c{margin:18px 0 0;display:flex;flex-wrap:wrap;justify-content:center;gap:8px 22px;font-size:15px}'
           '.rlsv .end .c span{color:#9a9488}'
           '.rlsv .n{margin:20px 0 0;font-size:12.5px;color:#8b867c;text-align:center}'
           '@media (max-width:640px){.rlsv .ph img{max-height:none}.rlsv .in{padding:4px 18px 56px}.rlsv ul{grid-template-columns:1fr}.rlsv .bk{width:100%;justify-content:center;box-sizing:border-box}}</style>')
SVC_UI = {'en': {'k': 'Our services', 'b': 'Book now', 'alt': 'Rafai Limousine chauffeur loading luggage into a Mercedes-Benz in front of a Paris hotel, Eiffel Tower in the background',
                 'n': 'Photo: illustration.'},
          'fr': {'k': 'Nos services', 'b': 'Réserver', 'alt': "Chauffeur Rafai Limousine chargeant les bagages dans une Mercedes-Benz devant un hôtel parisien, tour Eiffel au fond",
                 'n': 'Photo : illustration.'}}
SVC_DESC = {'en': 'Private chauffeur in Paris: airport transfers (CDG, Orly, Le Bourget, Beauvais), hourly hire, corporate and VIP travel in a Mercedes-Benz S-Class, V-Class or Range Rover.',
            'fr': 'Chauffeur privé à Paris : transferts aéroport (CDG, Orly, Le Bourget, Beauvais), mise à disposition, voyages d’affaires et VIP en Mercedes-Benz Classe S, Classe V ou Range Rover.'}
RE_URL = re.compile(r'(https?://[^\s<]+|[\w.+-]+@[\w-]+\.[\w.]+)')
def svc_link(s):
    s = html.escape(s)
    def a(m):
        u = m.group(1)
        if '@' in u and not u.startswith('http'):
            return '<a href="mailto:%s">%s</a>' % (u, u)
        return '<a href="%s"%s>%s</a>' % (u, ' target="_blank" rel="noopener"' if 'booking.' in u else '', u.split('://', 1)[1].rstrip('/'))
    return RE_URL.sub(a, s)
def svc_page(p, lg, src):
    lines = io.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), src), encoding='utf-8').read().split('\n')
    ui = SVC_UI[lg]
    h1 = next(l[2:].strip() for l in lines if l.startswith('# '))
    # dernières lignes : slogan et contacts dans un encadré
    body = [l for l in lines if not l.startswith('# ')]
    while body and not body[-1].strip():
        body.pop()
    tail = []
    while body and (not body[-1].strip() or RE_URL.search(body[-1]) or body[-1].rstrip().endswith(':')):
        tail.insert(0, body.pop())
    tail = [l for l in tail if l.strip()]
    motto = []
    while body and body[-1].strip() and len(motto) < 2:
        motto.insert(0, body.pop().strip())
        while body and not body[-1].strip():
            body.pop()
    out, ul, sec, faq, cur = [], [], False, [], None
    def flush():
        if ul:
            out.append('<ul>%s</ul>' % ''.join('<li>%s</li>' % svc_link(x) for x in ul)); del ul[:]
    for l in body:
        s = l.strip()
        if not s:
            continue
        if s.startswith('* '):
            ul.append(s[2:]); 
            if cur is not None: cur[1].append(s[2:])
            continue
        flush()
        if s.startswith('## '):
            if sec: out.append('</section>')
            out.append('<section class="q"><h2>%s</h2>' % html.escape(s[3:])); sec = True
            cur = [s[3:], []]; faq.append(cur)
        elif s.startswith('### '):
            out.append('<h3>%s</h3>' % html.escape(s[4:]))
            if cur is not None: cur[1].append(s[4:])
        else:
            out.append('<p>%s</p>' % svc_link(s))
            if cur is not None: cur[1].append(s)
    flush()
    if sec: out.append('</section>')
    cta = tail[0].rstrip(':').strip() if tail and tail[0].rstrip().endswith(':') else ''
    rows = [l for l in tail if RE_URL.search(l)]
    contacts = ''.join('<span>%s</span>' % svc_link(r) for r in rows)
    end = ('<div class="end"><p class="t">%s</p><p class="m">%s</p>%s<a class="bk" href="https://booking.rafai-limousine.com/">%s →</a><p class="c">%s</p></div>'
           % (html.escape(motto[0]) if motto else '', html.escape(motto[1]) if len(motto) > 1 else '',
              ('<p>%s</p>' % html.escape(cta)) if cta else '', html.escape(ui['b']), contacts))
    ld = {'@context': 'https://schema.org', '@type': 'FAQPage', 'inLanguage': lg,
          'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': ' '.join(a)}} for q, a in faq]}
    inner = (SVC_CSS + '<script type="application/ld+json">%s</script>' % json.dumps(ld, ensure_ascii=False).replace('</', '<\\/') +
             '<main class="rlsv"><figure class="ph"><img src="%s" width="1448" height="1086" alt="%s" decoding="async" fetchpriority="high"></figure>'
             '<div class="in"><p class="k">%s</p><h1>%s</h1><a class="bk" href="https://booking.rafai-limousine.com/">%s →</a>%s%s<p class="n">%s</p></div></main>'
             % (SVC_IMG, html.escape(ui['alt'], quote=True), html.escape(ui['k']), html.escape(h1), html.escape(ui['b']), ''.join(out), end, html.escape(ui['n'])))
    return h1, inner
for i, (p, lg, title, cls, inner) in enumerate(docs):
    if p in SVC_TXT:
        h1, inner = svc_page(p, *SVC_TXT[p])
        docs[i] = (p, lg, h1, (cls + ' rlsvc').strip(), inner)
        CFG.setdefault('titles', {})[p] = h1
        CFG['desc'][p] = SVC_DESC[lg]
        HERO[p] = SVC_IMG
print('onglet Services :', ', '.join(SVC_TXT), SVC_IMG)

# « Lifting » : la page d'accueil /home (anglais) et /fr (français) sont remplacées par la nouvelle page (dossier lifting/).
HERE = os.path.dirname(os.path.abspath(__file__))
LIFT_DIR = os.path.join(HERE, 'lifting')
LIFT_TPL = io.open(os.path.join(LIFT_DIR, 'lifting.html'), encoding='utf-8').read()
LURL = {'services': ('/services', '/fr/services'), 'fleet': ('/fleet', '/fr/flotte'), 'team': ('/team', '/fr/equipe'),
        'about': ('/about', '/fr/a-propos'), 'contact': ('/contact', '/fr/contact'),
        'airport': ('/services/airport-transfers', '/fr/services/transferts-aeroport'),
        'business': ('/services/business-travel', '/fr/services/voyages-affaires'),
        'weddings': ('/services/weddings-events', '/fr/services/mariages-evenements'),
        'hourly': ('/services/hourly-hire', '/fr/services/mise-a-disposition'),
        'corporate': ('/corporate', '/fr/entreprises'), 'vip': ('/vip-fast-track', '/fr/fast-track-vip')}
for _u in [u for v in LURL.values() for u in v] + ['/cgv', '/confidentialite', '/mentions-legales']:
    if _u not in PAGES and _u not in ('/team', '/fr/equipe', '/corporate', '/fr/entreprises', '/vip-fast-track', '/fr/fast-track-vip'):
        print('ARRET lifting : page inconnue', _u); sys.exit(1)
LIMG = {}
LSMALL = {}  # grande version -> petite version (téléphones)
def lift_img(n):
    if n not in LIMG and n not in ('hero',) and not n.startswith(('logo-', 'team-')):
        f0 = os.path.join(LIFT_DIR, 'img', n + '.png')
        f0 = f0 if os.path.exists(f0) else os.path.join(LIFT_DIR, 'img', n + '.jpg')
        if os.path.exists(f0) and not n.startswith('tm-'):
            _raw = open(f0, 'rb').read()
            big = webp(_raw, 'lift-' + n, maxw=900)
            LSMALL[big] = webp(_raw, 'lift-s-' + n, maxw=480)
    if n not in LIMG:
        f = os.path.join(LIFT_DIR, 'img', n + '.png')  # logos et portraits détourés (tm-*) en PNG
        if not os.path.exists(f):
            f = os.path.join(LIFT_DIR, 'img', n + '.jpg')
        LIMG[n] = webp(open(f, 'rb').read(), 'lift-' + n, maxw=1920 if n == 'hero' else (1080 if n.startswith('team-') else 900))
    return LIMG[n]
def css_blocks(css):
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0:
            break
        k, dep = j, 0
        while k < n:
            if css[k] == '{':
                dep += 1
            elif css[k] == '}':
                dep -= 1
                if dep == 0:
                    break
            k += 1
        out.append(css[i:k + 1].strip())
        i = k + 1
    return out
# la page n'utilise pas site.css (styles de Google Sites) : seulement les règles de l'agent IA et de l'écran appli
_blk = css_blocks(io.open(os.path.join(HERE, 'site.css.add'), encoding='utf-8').read())
_sel = [b for b in _blk if re.search(r'rly|rlch|rlwave|rlring', b) and not b.startswith('@keyframes')]
_anim = set(re.findall(r'animation(?:-name)?:\s*([A-Za-z][\w-]*)', '\n'.join(_sel)))
LIFT_CSS = '\n'.join(_sel + [b for b in _blk if b.startswith('@keyframes') and b.split()[1].split('{')[0] in _anim])
# polices de l'accueil hébergées sur le site (plus de feuille Google qui bloque l'affichage) ; préchargées et en « optional »
# pour que le texte ne bouge pas quand la police arrive (score Google PageSpeed). Si le téléchargement échoue, on garde Google Fonts.
def self_fonts():
    try:
        css = get(LFONTS).decode('utf-8')
        out, pre, seen = [], [], {}
        for sub, block in re.findall(r'/\*\s*([a-z-]+)\s*\*/\s*(@font-face\s*\{[^}]*\})', css):
            if sub not in ('latin', 'latin-ext'):
                continue
            u = re.search(r'url\((https://fonts\.gstatic\.com/[^)]+?\.woff2)\)', block).group(1)
            if u not in seen:
                raw = get(u)
                seen[u] = '/img/f-%s.woff2' % sha(raw)
                open(OUT + seen[u], 'wb').write(raw)
            block = block.replace(u, seen[u]).replace('font-display: swap', 'font-display: optional')
            out.append(block)
            fam = re.search(r"font-family:\s*'([^']+)'", block).group(1); sty = re.search(r'font-style:\s*(\w+)', block).group(1)
            if sub == 'latin' and (fam, sty) not in [x[0] for x in pre]:
                pre.append(((fam, sty), seen[u]))
        print('polices accueil :', len(seen), 'fichiers')
        return ''.join(out), [p for _, p in pre]
    except Exception as e:
        print('polices accueil : Google Fonts gardé', str(e)[:60])
        return None, []
# photo du haut pour téléphone : 1080 px de large, beaucoup plus légère
def _hero_m():
    raw = open(os.path.join(LIFT_DIR, 'img', 'hero.jpg'), 'rb').read()
    return webp(raw, 'lift-hero-m', maxw=828)
HERO_M = _hero_m()
LFONTS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Manrope:wght@400;500;600;700;800&display=swap'
FONT_CSS, FONT_PRE = self_fonts()
# Shopping (10 nov. 2026, demande de Yassine) : photos libres de droits de Wikimedia Commons, retouchées (recadrage, tons chauds),
# avec le nom de l'auteur et la licence sous les cartes. Si une photo ne se télécharge pas, la carte garde l'icône dorée.
SHOP = [  # clé, fichier Commons, auteur, licence, lien licence, point de cadrage (x, y)
    ('lafayette', 'People at the top of Galeries Lafayette.jpg', 'Tangopaso', 'domaine public', '', (.5, .5)),
    ('printemps', 'Boulevard Haussmann - panoramio (2).jpg', 'Romāns Kolduns', 'CC BY 3.0', 'https://creativecommons.org/licenses/by/3.0/', (.5, .5)),
    ('bonmarche', 'Le Bon Marché, Paris 3 November 2008 - panoramio.jpg', 'hiro449944', 'CC BY 3.0', 'https://creativecommons.org/licenses/by/3.0/', (.5, .45)),
    ('montaigne', 'Avenue Montaigne - Paris - panoramio.jpg', 'Charles Lecompte', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0/', (.62, .5)),
    ('sthonore', 'Boutique Azzaro rue du Faubourg-Saint-Honoré à Paris.JPG', 'Erwmat', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0/', (.78, .5)),
    ('bhv', 'Bazar Hôtel Ville - Paris IV (FR75) - 2024-06-05 - 1.jpg', 'Chabe01', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', (.5, .4)),
    ('vallee', 'Vallée Village (Serris) (2).jpg', 'Gzen92', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', (.5, .5)),
]
SHOP_ALT = {'lafayette': ('Façade des Galeries Lafayette, boulevard Haussmann', 'Galeries Lafayette, boulevard Haussmann'),
            'printemps': ('Le Printemps Haussmann', 'Printemps Haussmann'),
            'bonmarche': ('Le Bon Marché, rue de Sèvres', 'Le Bon Marché, rue de Sèvres'),
            'montaigne': ('L’avenue Montaigne illuminée le soir', 'Avenue Montaigne at night'),
            'sthonore': ('Boutique rue du Faubourg-Saint-Honoré', 'Boutique on rue du Faubourg-Saint-Honoré'),
            'bhv': ('Le BHV Marais, rue de Rivoli', 'BHV Marais, rue de Rivoli'),
            'vallee': ('Entrée de La Vallée Village', 'La Vallée Village entrance')}
SHOP_IMG = {}
def shop_photos():
    from PIL import ImageEnhance, ImageFilter
    ua = {'User-Agent': 'RafaiLimousineSite/1.0 (https://www.rafai-limousine.com; contact@rafai-limousine.com)'}
    for k, fn, who, lic, lu, (fx, fy) in SHOP:
        cache = os.path.join(SRC, 'shop-%s.jpg' % k)
        try:
            if not os.path.exists(cache):
                u = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(fn.replace(' ', '_')) + '?width=1600'
                with urllib.request.urlopen(urllib.request.Request(u, headers=ua), timeout=60) as r:
                    open(cache, 'wb').write(r.read())
            im = Image.open(cache).convert('RGB')
            # recadrage 16:10 autour du point choisi
            W, H = im.size; tw = min(W, int(H * 1.6)); th = int(tw / 1.6)
            x0 = int(min(max(0, fx * W - tw / 2), W - tw)); y0 = int(min(max(0, fy * H - th / 2), H - th))
            im = im.crop((x0, y0, x0 + tw, y0 + th)).resize((1200, 750), Image.LANCZOS)
            # retouche : un peu plus chaud, contraste et couleurs relevés, léger vignettage
            r, g, b = im.split(); r = r.point(lambda v: min(255, int(v * 1.04))); b = b.point(lambda v: int(v * .95)); im = Image.merge('RGB', (r, g, b))
            im = ImageEnhance.Contrast(im).enhance(1.06); im = ImageEnhance.Color(im).enhance(1.06)
            vg = Image.new('L', (1200, 750), 0); from PIL import ImageDraw
            ImageDraw.Draw(vg).ellipse((-150, -120, 1350, 870), fill=255); vg = vg.filter(ImageFilter.GaussianBlur(120))
            im = Image.composite(im, ImageEnhance.Brightness(im).enhance(.72), vg)
            b2 = io.BytesIO(); im.save(b2, 'JPEG', quality=90)
            SHOP_IMG[k] = webp(b2.getvalue(), 'shop-' + k, maxw=900)
        except Exception as e:
            print('shopping : photo absente', k, str(e)[:80])
    print('shopping : photos', len(SHOP_IMG), '/', len(SHOP))
shop_photos()
def shop_html(t, lg):
    for k, fn, who, lic, lu, _ in SHOP:
        if k not in SHOP_IMG:
            continue
        t = re.sub(r'<div class="ph shop" aria-hidden="true" data-shop="%s">.*?</div>' % k,
                   lambda m: '<div class="ph"><img src="%s" alt="%s" loading="lazy" decoding="async"></div>' % (SHOP_IMG[k], html.escape(SHOP_ALT[k][0 if lg == 'fr' else 1], quote=True)), t, count=1, flags=re.S)
    cred = [('<a href="https://commons.wikimedia.org/wiki/File:%s" target="_blank" rel="noopener">%s</a>, %s' %
             (urllib.parse.quote(fn.replace(' ', '_')), html.escape(who), ('<a href="%s" target="_blank" rel="noopener">%s</a>' % (lu, lic)) if lu else ('public domain' if lg == 'en' else lic)))
            for k, fn, who, lic, lu, _ in SHOP if k in SHOP_IMG]
    if cred:
        t = t.replace('<p class="shopcred"></p>', '<p class="shopcred">%s %s.</p>' % ('Photos (Wikimedia Commons, retouched):' if lg == 'en' else 'Photos (Wikimedia Commons, retouchées) :', ' · '.join(cred)), 1)
    return t
def lift_page(p, lg):
    desk = BOOKD.get(p) or BOOK.get(p) or BOOKM.get(p)
    mob = BOOKM.get(p) or BOOK.get(p) or BOOKD.get(p)
    if not desk:
        print('ARRET lifting : bloc de reservation introuvable sur', p); sys.exit(1)
    fr_ = '<iframe id="%s" class="rlif %s" title="Rafai Limousine" scrolling="no" frameborder="0" allow="geolocation; clipboard-write" data-src="%s"></iframe>'
    book = fr_ % ('bookFrame', 'bf-d', desk) + ('' if mob == desk else fr_ % ('bookFrameM', 'bf-m', mob))
    t = LIFT_TPL
    t = re.sub(r'%%IMG:([a-z0-9-]+)%%', lambda m: lift_img(m.group(1)), t)
    t = re.sub(r'%%PNG:(light|dark)%%', lambda m: lift_img('logo-' + m.group(1)), t)
    t = re.sub(r'%%U:([a-z]+)%%', lambda m: LURL[m.group(1)][0 if lg == 'en' else 1], t)
    t = t.replace('%%BOOK%%', book)
    t = shop_html(t, lg)
    t = t.replace('%%BADGES%%', '<!--rlbadges-->')  # badges App Store / Google Play, posés à l'écriture de la page
    if '%%' in t:
        print('ARRET lifting : repere non remplace', re.findall(r'%%[^%]*%%', t)[:3]); sys.exit(1)
    s = BeautifulSoup(t, 'html.parser')
    for el in s.select('[data-en]'):
        if lg == 'en':
            v = el['data-en']
            el.clear()
            el.append(BeautifulSoup(v, 'html.parser'))
        del el['data-en']
    for el in s.find_all(True):
        for a in [a for a in el.attrs if a.startswith('data-en-')]:
            if lg == 'en':
                el['placeholder' if a == 'data-en-ph' else 'data-' + a[8:]] = el[a]
            del el[a]
    for el in s.find_all('img'):
        el['decoding'] = 'async'
        if not set(el.get('class') or []) & {'logo-light', 'logo-dark'}:
            el['loading'] = 'lazy'
        src = el.get('src') or ''
        if src in LSMALL and not el.get('srcset'):
            el['srcset'] = '%s 480w, %s 900w' % (LSMALL[src], src)
            el['sizes'] = '(max-width: 640px) 86vw, 420px'
        if not (el.get('width') and el.get('height')) and src.startswith('/img/') and os.path.exists(OUT + src):
            try:
                with Image.open(OUT + src) as _im:
                    el['width'], el['height'] = str(_im.width), str(_im.height)
            except Exception:
                pass
    # les images ont maintenant largeur et hauteur (PageSpeed) : sans « height:auto » les photos des cartes s'étirent en hauteur
    return '<style>' + LIFT_CSS + '\n.svc img,.gal img,.route img{height:auto}</style>' + str(s)
for i, (p, lg, title, cls, inner) in enumerate(docs):
    if p in LIFT_PAGES:
        docs[i] = (p, lg, title, 'rllift', lift_page(p, LIFT_PAGES[p]))
print('lifting :', ', '.join(LIFT_PAGES), '· bloc de reservation', BOOK, '· ordinateur', BOOKD, '· telephone', BOOKM, '· images', len(LIMG), '· styles agent', len(LIFT_CSS))

# Onglet « Corporate » (10 nov. 2026, demande de Yassine) : même mise en page que la page entreprises d'un partenaire,
# avec nos propres textes (corporate.json) et sa photo (corporate-paris.jpg). Anglais /corporate, français /fr/entreprises.
CORP = json.load(io.open(os.path.join(HERE, 'corporate.json'), encoding='utf-8'))
CORP_JPG = os.path.join(HERE, 'corporate-paris.jpg')
if not os.path.exists(CORP_JPG):
    print('ARRET photo corporate absente (corporate-paris.jpg)'); sys.exit(1)
CORP_IMG = '/img/corp-%s.webp' % sha(open(CORP_JPG, 'rb').read())[:10]
Image.open(CORP_JPG).convert('RGB').save(OUT + CORP_IMG, 'WEBP', quality=84, method=6)
CORP_CSS = ('<style>body.rlcorp{background:#0b0b0c}'
  '.rlco{--g:#E0BA6C;--ink:#f3eee4;--tx:#c8c2b6;--mu:#9a9488;--ln:rgba(224,186,108,.22);background:#0b0b0c;color:var(--tx);font:400 16.5px/1.7 Manrope,system-ui,sans-serif}'
  '.rlco a{color:var(--g)}.rlco h1,.rlco h2,.rlco h3{color:var(--ink);margin:0}'
  '.rlco h2{font:600 clamp(28px,4vw,42px)/1.15 "Cormorant Garamond",Lora,Georgia,serif}'
  '.rlco h3{font:700 18.5px/1.35 Manrope,system-ui,sans-serif}'
  '.rlco .w{max-width:1160px;margin:0 auto;padding:0 24px}'
  '.rlco .k{margin:0 0 10px;font-size:12.5px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--g)}'
  '.rlco .btn{display:inline-flex;align-items:center;gap:10px;padding:14px 26px;border-radius:999px;font-weight:800;font-size:15.5px;text-decoration:none}'
  '.rlco .gold{background:linear-gradient(135deg,#f0d394 0%,#d9b36a 45%,#b8873f 100%);color:#16110a;box-shadow:0 10px 30px rgba(199,154,74,.28)}'
  '.rlco .ghost{border:1.5px solid rgba(243,238,228,.7);color:var(--ink)}'
  '.rlco .hero{position:relative;min-height:min(86vh,820px);display:flex;align-items:flex-end;background:#0b0b0c}'
  '.rlco .hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 58%}'
  '.rlco .hero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,12,.25) 0%,rgba(11,11,12,0) 30%,rgba(11,11,12,.55) 62%,#0b0b0c 100%)}'
  '.rlco .hero .w{position:relative;z-index:1;width:100%;box-sizing:border-box;padding-bottom:56px}'
  '.rlco .crumb{margin:0 0 14px;font-size:13.5px;color:#d9d2c4}.rlco .crumb a{color:#d9d2c4;text-decoration:none}.rlco .crumb span{margin:0 8px;color:var(--g)}'
  '.rlco h1{max-width:820px;font:600 clamp(36px,6vw,66px)/1.05 "Cormorant Garamond",Lora,Georgia,serif;text-shadow:0 2px 24px rgba(0,0,0,.45)}'
  '.rlco .sub{max-width:640px;margin:16px 0 26px;font-size:18px;color:#e6e0d4;text-shadow:0 1px 12px rgba(0,0,0,.5)}'
  '.rlco .ctas{display:flex;flex-wrap:wrap;gap:12px}'
  '.rlco .stats{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--ln);border-bottom:1px solid var(--ln)}'
  '.rlco .stats div{padding:28px 18px;text-align:center}.rlco .stats div+div{border-left:1px solid var(--ln)}'
  '.rlco .stats b{display:block;font:600 clamp(30px,4vw,44px)/1 "Cormorant Garamond",Lora,Georgia,serif;color:var(--g)}'
  '.rlco .stats span{display:block;margin-top:8px;font-size:12.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--mu)}'
  '.rlco .sec{padding:84px 0 0}'
  '.rlco .split{display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center}'
  '.rlco .split.rev>figure{order:2}'
  '.rlco figure{margin:0}.rlco .split img{display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.5)}'
  '.rlco .split p{margin:16px 0 0}'
  '.rlco ul.tick{margin:18px 0 0;padding:0;list-style:none}.rlco ul.tick li{position:relative;padding:10px 0 10px 30px;border-bottom:1px solid var(--ln);color:var(--ink)}'
  '.rlco ul.tick li:before{content:"";position:absolute;left:2px;top:19px;width:9px;height:9px;border-radius:50%;background:var(--g);box-shadow:0 0 0 4px rgba(224,186,108,.16)}'
  '.rlco .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:30px}'
  '.rlco .card{padding:26px 24px;border:1px solid var(--ln);border-radius:18px;background:#141316}'
  '.rlco .card p{margin:10px 0 0;font-size:15.5px}'
  '.rlco .card .ic{display:flex;align-items:center;justify-content:center;width:44px;height:44px;margin-bottom:16px;border-radius:12px;border:1px solid rgba(224,186,108,.45);color:var(--g)}'
  '.rlco .card .ic svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}'
  '.rlco .cards.four{grid-template-columns:repeat(4,1fr)}'
  '.rlco .num{display:block;margin-bottom:14px;font:600 34px/1 "Cormorant Garamond",Lora,Georgia,serif;color:var(--g)}'
  '.rlco .calls{display:grid;grid-template-columns:1fr 1fr;gap:18px}'
  '.rlco .call{padding:30px 28px;border-radius:18px;border:1px solid rgba(224,186,108,.4);background:linear-gradient(180deg,#161418,#0f0e11)}'
  '.rlco .call p{margin:8px 0 14px}.rlco .call a{font-weight:800;text-decoration:none}'
  '.rlco .banner{margin-top:84px}.rlco .banner img{display:block;width:100%;height:min(60vh,560px);object-fit:cover}'
  '.rlco details{border-bottom:1px solid var(--ln)}.rlco details:first-of-type{border-top:1px solid var(--ln);margin-top:26px}'
  '.rlco summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:16px;padding:20px 0;font-weight:700;font-size:17px;color:var(--ink)}'
  '.rlco summary::-webkit-details-marker{display:none}.rlco summary:after{content:"+";flex:none;font-size:24px;line-height:1;color:var(--g)}'
  '.rlco details[open] summary:after{content:"−"}.rlco details p{margin:0 0 20px}'
  '.rlco .more{margin:20px 0 0}'
  '.rlco .also{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;margin:70px 0 0;padding:26px 0 72px;border-top:1px solid var(--ln)}'
  '.rlco .also b{color:var(--ink)}.rlco .also a{padding:8px 16px;border:1px solid var(--ln);border-radius:999px;text-decoration:none;font-weight:600;font-size:14.5px}'
  '.rlco .note{margin:0 0 0 auto;font-size:12.5px;color:#7d786e}'
  '@media (max-width:900px){.rlco .split,.rlco .calls{grid-template-columns:1fr;gap:28px}.rlco .split.rev>figure{order:0}.rlco .cards,.rlco .cards.four{grid-template-columns:1fr 1fr}}'
  '@media (max-width:640px){.rlco .w{padding:0 18px}.rlco .hero{display:block;min-height:0}.rlco .hero img{position:static;height:auto;aspect-ratio:1/1}'
  '.rlco .hero:after{top:0;bottom:auto;height:100vw;background:linear-gradient(180deg,rgba(11,11,12,0) 55%,#0b0b0c 100%)}'
  '.rlco .hero .w{margin-top:-64px;padding-bottom:36px}.rlco .sub{font-size:16.5px}.rlco .ctas .btn{flex:1 1 100%;justify-content:center}'
  '.rlco .stats div{padding:20px 8px}.rlco .stats span{font-size:10.5px;letter-spacing:.08em}'
  '.rlco .sec{padding-top:60px}.rlco .cards,.rlco .cards.four{grid-template-columns:1fr}.rlco .banner{margin-top:60px}.rlco .note{margin:8px 0 0;width:100%}}</style>')
CORP_IC = ['<path d="M2 16l20-6-3-2-6 2-6-6-2 1 4 6-5 2-2-2-1 1z"/><path d="M3 21h18"/>',
           '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
           '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>']
def corp_page(lg):
    x = CORP[lg]; U = lambda k: LURL[k][0 if lg == 'en' else 1]; e = html.escape
    hm = '/' if lg == 'en' else '/fr'
    o = [CORP_CSS, '<main class="rlco">']
    o.append('<section class="hero"><img src="%s" width="1254" height="1254" alt="%s" fetchpriority="high" decoding="async"><div class="w">'
             '<p class="crumb"><a href="%s">%s</a><span>/</span>%s</p><h1>%s</h1><p class="sub">%s</p>'
             '<p class="ctas"><a class="btn gold" href="https://booking.rafai-limousine.com/">%s →</a><a class="btn ghost" href="https://wa.me/33667099494" target="_blank" rel="noopener">%s</a></p></div></section>'
             % (CORP_IMG, e(x['alt'], quote=True), hm, e(x['crumb'][0]), e(x['crumb'][1]), e(x['h1']), e(x['sub']), e(x['b1']), e(x['b2'])))
    o.append('<div class="stats">%s</div>' % ''.join('<div><b>%s</b><span>%s</span></div>' % (e(a), e(b)) for a, b in x['stats']))
    i = x['intro']
    o.append('<section class="sec"><div class="w split"><figure><img src="%s" alt="%s" loading="lazy" decoding="async"></figure><div><p class="k">%s</p><h2>%s</h2><p>%s</p></div></div></section>'
             % (lift_img('u-s-paris'), e(i['alt'], quote=True), e(i['k']), e(i['h']), e(i['p'])))
    a = x['adv']
    o.append('<section class="sec"><div class="w"><h2>%s</h2><div class="cards">%s</div></div></section>'
             % (e(a['h']), ''.join('<div class="card"><span class="ic"><svg viewBox="0 0 24 24">%s</svg></span><h3>%s</h3><p>%s</p></div>' % (CORP_IC[n], e(h), e(p)) for n, (h, p) in enumerate(a['c']))))
    m = x['multi']
    o.append('<section class="sec"><div class="w split rev"><figure><img src="%s" alt="%s" loading="lazy" decoding="async"></figure><div><p class="k">%s</p><h2>%s</h2><p>%s</p><ul class="tick">%s</ul></div></div></section>'
             % (lift_img('u-v-thumb'), e(m['alt'], quote=True), e(m['k']), e(m['h']), e(m['p']), ''.join('<li>%s</li>' % e(l) for l in m['l'])))
    u = x['uses']
    o.append('<section class="sec"><div class="w"><h2>%s</h2><div class="cards four">%s</div></div></section>'
             % (e(u['h']), ''.join('<div class="card"><span class="num">%02d</span><h3>%s</h3><p>%s</p></div>' % (n + 1, e(h), e(p)) for n, (h, p) in enumerate(u['c']))))
    o.append('<section class="sec"><div class="w calls">%s</div></section>'
             % ''.join('<div class="call"><h3>%s</h3><p>%s</p><a href="%s">%s →</a></div>' % (e(h), e(p), U(k), e(l)) for h, p, l, k in x['call']))
    o.append('<figure class="banner"><img src="%s" alt="%s" loading="lazy" decoding="async"></figure>' % (lift_img('u-range-eiffel'), e(x['banner_alt'], quote=True)))
    f = x['faq']
    o.append('<section class="sec"><div class="w"><h2>%s</h2>%s<p class="more"><a href="%s">%s →</a></p></div></section>'
             % (e(f['h']), ''.join('<details><summary>%s</summary><p>%s</p></details>' % (e(q), e(r)) for q, r in f['q']), U('contact'), e(f['more'])))
    al = x['also']
    o.append('<div class="w"><p class="also"><b>%s</b>%s<span class="note">%s</span></p></div></main>'
             % (e(al['t']), ''.join('<a href="%s">%s</a>' % (U(k), e(l)) for l, k in al['l']), e(x['note'])))
    ld = {'@context': 'https://schema.org', '@type': 'FAQPage', 'inLanguage': lg,
          'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': r}} for q, r in f['q']]}
    o.insert(1, '<script type="application/ld+json">%s</script>' % json.dumps(ld, ensure_ascii=False).replace('</', '<\\/'))
    return ''.join(o)
for lg in ('en', 'fr'):
    x = CORP[lg]
    docs.append((x['p'], lg, x['title'], 'rlcorp', corp_page(lg)))
    CFG.setdefault('titles', {})[x['p']] = x['title']
    CFG['desc'][x['p']] = x['desc']
    HERO[x['p']] = CORP_IMG
CFG['groups'].append([CORP['en']['p'], CORP['fr']['p']])
# menu du site : « Corporate » après « Services » (anglais) et « Entreprises » dans le menu Français
def _nav_add(items, after, it):
    for n, i in enumerate(items):
        if i['u'] == after:
            items.insert(n + 1, it); return True
        if _nav_add(i.get('c', []), after, it):
            return True
    return False
if not (_nav_add(CFG['nav'], '/services', {'t': 'Corporate', 'u': '/corporate'}) and _nav_add(CFG['nav'], '/fr/services', {'t': 'Entreprises', 'u': '/fr/entreprises'})):
    print('ARRET menu : Services introuvable'); sys.exit(1)
print('onglet Corporate :', CORP['en']['p'], CORP['fr']['p'], CORP_IMG)

# Onglet « VIP Fast Track » (10 nov. 2026, demande de Yassine) : sa photo (vip-paris.jpg) et son texte (vip-en.txt, traduit
# en français dans vip-fr.txt). Les boutons « Réserver » ouvrent une petite fenêtre : réservation en ligne (l'option Fast Track VIP
# s'affiche au choix du véhicule pour CDG et Orly) ou demande envoyée par le client sur WhatsApp. /vip-fast-track#book l'ouvre directement.
VIP_JPG = os.path.join(HERE, 'vip-paris.jpg')
VIP_TXT = {'en': ('/vip-fast-track', 'vip-en.txt'), 'fr': ('/fr/fast-track-vip', 'vip-fr.txt')}
if not os.path.exists(VIP_JPG):
    print('ARRET photo VIP absente (vip-paris.jpg)'); sys.exit(1)
VIP_IMG = '/img/vip-%s.webp' % sha(open(VIP_JPG, 'rb').read())[:10]
Image.open(VIP_JPG).convert('RGB').save(OUT + VIP_IMG, 'WEBP', quality=84, method=6)
VIP_UI = {
    'en': {'k': 'VIP Fast Track', 'b': 'Book VIP Fast Track', 'wa': 'WhatsApp',
           'alt': 'Greeter holding a name sign at the arrivals of Paris-Charles de Gaulle airport, a chauffeur-driven car waiting outside',
           'n': 'Photo: illustration.', 'desc': 'VIP Fast Track and airport meet and assist in Paris (CDG, Orly, Le Bourget, Beauvais): aircraft-door welcome where authorised, priority formalities, luggage, VAT refund and your Rafai Limousine chauffeur.',
           'title': 'VIP Fast Track & Airport Meet and Assist in Paris – Rafai Limousine',
           'w': {'h': 'Book your VIP Fast Track', 'on': 'Book online', 'onh': 'Enter your trip with the airport: the Fast Track VIP option appears when you choose your vehicle (CDG and Orly).',
                 'or': 'or send us your request', 'arr': 'Arrival', 'dep': 'Departure', 'air': 'Airport', 'date': 'Date', 'tarr': 'Landing time', 'tdep': 'Flight time',
                 'fl': 'Flight number', 'pax': 'Passengers', 'car': 'With a Rafai Limousine chauffeur', 'sign': 'Name on the sign', 'send': 'Send on WhatsApp',
                 'x': 'Close', 'need': 'Please choose a date.', 'note': 'Your request opens in WhatsApp, ready to send to our team (+33 6 67 09 94 94).',
                 'm0': 'Hello Rafai Limousine, I would like to book a VIP Fast Track.', 'yes': 'yes', 'no': 'no', 'at': 'at', 'sp': ': '}},
    'fr': {'k': 'Fast Track VIP', 'b': 'Réserver le Fast Track VIP', 'wa': 'WhatsApp',
           'alt': "Agent d’accueil tenant une pancarte au nom des clients aux arrivées de l’aéroport Paris-Charles de Gaulle, une voiture avec chauffeur qui attend dehors",
           'n': 'Photo : illustration.', 'desc': "Fast Track VIP et accueil personnalisé dans les aéroports de Paris (CDG, Orly, Le Bourget, Beauvais) : accueil à la porte de l’avion si autorisé, formalités prioritaires, bagages, détaxe et votre chauffeur Rafai Limousine.",
           'title': 'Fast Track VIP et accueil à l’aéroport à Paris – Rafai Limousine',
           'w': {'h': 'Réservez votre Fast Track VIP', 'on': 'Réserver en ligne', 'onh': 'Indiquez votre trajet avec l’aéroport : l’option Fast Track VIP s’affiche au choix du véhicule (CDG et Orly).',
                 'or': 'ou envoyez-nous votre demande', 'arr': 'Arrivée', 'dep': 'Départ', 'air': 'Aéroport', 'date': 'Date', 'tarr': 'Heure d’atterrissage', 'tdep': 'Heure du vol',
                 'fl': 'Numéro de vol', 'pax': 'Passagers', 'car': 'Avec un chauffeur Rafai Limousine', 'sign': 'Nom sur la pancarte', 'send': 'Envoyer sur WhatsApp',
                 'x': 'Fermer', 'need': 'Choisissez une date.', 'note': 'Votre demande s’ouvre dans WhatsApp, prête à envoyer à notre équipe (+33 6 67 09 94 94).',
                 'm0': 'Bonjour Rafai Limousine, je souhaite réserver un Fast Track VIP.', 'yes': 'oui', 'no': 'non', 'at': 'à', 'sp': ' : '}}}
VIP_AIR = {'en': ['Paris-Charles de Gaulle (CDG)', 'Paris-Orly (ORY)', 'Paris-Le Bourget (LBG)', 'Paris-Beauvais (BVA)'],
           'fr': ['Paris-Charles de Gaulle (CDG)', 'Paris-Orly (ORY)', 'Paris-Le Bourget (LBG)', 'Paris-Beauvais (BVA)']}
VIP_CSS = ('<style>body.rlvip{background:#0b0b0c}'
  '.rlsv .lead{margin:-4px 0 22px;font:500 clamp(19px,2.4vw,23px)/1.45 "Cormorant Garamond",Lora,Georgia,serif;font-style:italic;color:#E0BA6C}'
  '.rlsv .cta{display:flex;flex-wrap:wrap;gap:12px;margin:0}'
  '.rlsv button.bk{border:0;cursor:pointer;font-family:inherit}'
  '.rlsv .gh{display:inline-flex;align-items:center;padding:13px 24px;border-radius:999px;border:1.5px solid rgba(243,238,228,.6);color:#f3eee4;font-weight:800;font-size:15.5px;text-decoration:none}'
  '.rlsv .fine{margin:26px 0 0;padding:16px 18px;border-left:2px solid rgba(224,186,108,.5);background:#111012;font-size:14px;line-height:1.6;color:#9a9488}'
  '.rlsv .end p.x{margin:0 auto 10px;max-width:560px}'
  '.ftw{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:12px}'
  '.ftw[hidden]{display:none}'
  '.ftw-bg{position:absolute;inset:0;background:rgba(5,5,6,.72);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}'
  '.ftw-box{position:relative;width:min(460px,100%);max-height:calc(100vh - 24px);max-height:calc(100dvh - 24px);overflow:auto;box-sizing:border-box;padding:24px 22px 20px;border-radius:22px;'
  'background:linear-gradient(180deg,#17151a,#0f0e11);border:1px solid rgba(224,186,108,.45);box-shadow:0 30px 80px rgba(0,0,0,.7);color:#c8c2b6;font:400 15px/1.5 Manrope,system-ui,sans-serif;color-scheme:dark;animation:ftwUp .35s cubic-bezier(.2,.7,.2,1)}'
  '@keyframes ftwUp{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}'
  '.ftw-x{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;border:1px solid rgba(224,186,108,.35);background:#0b0b0c;color:#f3eee4;font-size:22px;line-height:1;cursor:pointer}'
  '.ftw-k{margin:0;font-size:12px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#E0BA6C}'
  '.ftw h2{margin:6px 40px 16px 0;font:600 27px/1.15 "Cormorant Garamond",Lora,Georgia,serif;color:#f3eee4}'
  '.ftw .bk{display:flex;width:100%;box-sizing:border-box;justify-content:center;align-items:center;gap:8px;padding:14px 20px;border:0;border-radius:999px;cursor:pointer;font:800 15.5px/1.2 Manrope,system-ui,sans-serif;text-decoration:none;'
  'background:linear-gradient(135deg,#f0d394 0%,#d9b36a 45%,#b8873f 100%);color:#16110a;box-shadow:0 10px 30px rgba(199,154,74,.25)}'
  '.ftw .ftw-h{margin:9px 2px 0;font-size:13px;color:#9a9488}'
  '.ftw-or{display:flex;align-items:center;gap:12px;margin:18px 0 14px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8b867c}'
  '.ftw-or:before,.ftw-or:after{content:"";flex:1;height:1px;background:rgba(224,186,108,.22)}'
  '.ftw .sg{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:4px;border-radius:999px;background:#0b0b0c;border:1px solid rgba(224,186,108,.25);margin-bottom:12px}'
  '.ftw .sg button{padding:9px 10px;border:0;border-radius:999px;background:none;color:#c8c2b6;font:700 14px Manrope,system-ui,sans-serif;cursor:pointer}'
  '.ftw .sg button.on{background:#E0BA6C;color:#16110a}'
  '.ftw label{display:block;margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9a9488}'
  '.ftw input,.ftw select{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:11px 12px;border-radius:12px;border:1px solid rgba(224,186,108,.28);background:#0b0b0c;color:#f3eee4;font:500 16px Manrope,system-ui,sans-serif;text-transform:none;letter-spacing:0}'
  '.ftw input:focus,.ftw select:focus{outline:2px solid rgba(224,186,108,.6);outline-offset:1px}'
  '.ftw .r2{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
  '.ftw label.ck{display:flex;align-items:center;gap:10px;margin:4px 0 12px;font-size:14px;font-weight:600;letter-spacing:0;text-transform:none;color:#e6e0d4;cursor:pointer}'
  '.ftw label.ck input{width:20px;height:20px;margin:0;flex:none;accent-color:#E0BA6C}'
  '.ftw .wa{background:#0b0b0c;color:#E0BA6C;border:1.5px solid #E0BA6C;box-shadow:none}'
  '.ftw .er{min-height:18px;margin:6px 2px 0;font-size:13px;color:#f0a58a}'
  '.ftw .nt{margin:6px 2px 0;font-size:12px;color:#7d786e}'
  'html.ftwon,html.ftwon body{overflow:hidden}'
  '@media (max-width:640px){.rlsv .cta .bk,.rlsv .cta .gh{flex:1 1 100%;justify-content:center}.ftw{align-items:flex-end;padding:0}'
  '.ftw-box{width:100%;max-height:92vh;max-height:92dvh;border-radius:22px 22px 0 0;padding:22px 18px calc(18px + env(safe-area-inset-bottom,0px))}}'
  '@media (prefers-reduced-motion:reduce){.ftw-box{animation:none}}</style>')
def vip_window(lg):
    w = VIP_UI[lg]['w']; e = lambda s: html.escape(s, quote=True)
    opts = ''.join('<option>%s</option>' % e(a) for a in VIP_AIR[lg])
    pax = ''.join('<option%s>%d</option>' % (' selected' if n == 2 else '', n) for n in range(1, 9))
    js = ('(function(){var W=document.getElementById("ftw");if(!W)return;var F=document.getElementById("ftwF"),T=%s,k="arr",last=null;'
          'function seg(){[].forEach.call(W.querySelectorAll(".sg button"),function(b){var o=b.getAttribute("data-k")===k;b.classList.toggle("on",o);b.setAttribute("aria-pressed",o?"true":"false")});'
          'document.getElementById("ftwTl").firstChild.nodeValue=k==="arr"?T.tarr:T.tdep}'
          'function open(){var c=document.querySelector("#rlch button.st");if(c)c.click();last=document.activeElement;W.hidden=false;document.documentElement.classList.add("ftwon");try{W.querySelector(".ftw-box .bk").focus({preventScroll:true})}catch(e){}}'
          'function close(){W.hidden=true;document.documentElement.classList.remove("ftwon");if(location.hash==="#book")try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}'
          'try{last&&last.focus({preventScroll:true})}catch(e){}}'
          '[].forEach.call(document.querySelectorAll("[data-ftw]"),function(b){b.addEventListener("click",function(ev){ev.preventDefault();open()})});'
          '[].forEach.call(W.querySelectorAll("[data-x]"),function(b){b.addEventListener("click",close)});'
          'document.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&!W.hidden)close()});'
          '[].forEach.call(W.querySelectorAll(".sg button"),function(b){b.addEventListener("click",function(){k=b.getAttribute("data-k");seg()})});'
          'F.addEventListener("submit",function(ev){ev.preventDefault();var g=function(n){return (F.elements[n].value||"").trim()},er=W.querySelector(".er");'
          'if(!g("date")){er.textContent=T.need;F.elements.date.focus();return}er.textContent="";'
          'var d=g("date").split("-"),ds=d.length===3?d[2]+"/"+d[1]+"/"+d[0]:g("date"),L=[T.m0,"",'
          '"• "+(k==="arr"?T.arr:T.dep)+" · "+g("air"),"• "+T.date+T.sp+ds+(g("time")?" "+T.at+" "+g("time"):"")];'
          'if(g("flight"))L.push("• "+T.fl+T.sp+g("flight").toUpperCase());L.push("• "+T.pax+T.sp+g("pax"));'
          'L.push("• "+T.car+T.sp+(F.elements.car.checked?T.yes:T.no));if(g("sign"))L.push("• "+T.sign+T.sp+g("sign"));'
          'window.open("https://wa.me/33667099494?text="+encodeURIComponent(L.join("\\n")),"_blank","noopener")});'
          'seg();function auto(){if(location.hash==="#book"||location.hash==="#reserver")open()}'
          'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",auto);else auto()})();'
          % json.dumps({x: w[x] for x in ('tarr', 'tdep', 'need', 'm0', 'arr', 'dep', 'date', 'fl', 'pax', 'car', 'sign', 'yes', 'no', 'at', 'sp')}, ensure_ascii=False).replace('</', '<\\/'))
    return ('<div class="ftw" id="ftw" hidden><div class="ftw-bg" data-x></div>'
            '<div class="ftw-box" role="dialog" aria-modal="true" aria-labelledby="ftwT">'
            '<button type="button" class="ftw-x" data-x aria-label="%s">×</button><p class="ftw-k">✦ Fast Track VIP</p><h2 id="ftwT">%s</h2>'
            '<a class="bk" href="https://booking.rafai-limousine.com/" target="_blank" rel="noopener">%s →</a><p class="ftw-h">%s</p>'
            '<p class="ftw-or">%s</p><form id="ftwF" novalidate>'
            '<div class="sg" role="group"><button type="button" data-k="arr">%s</button><button type="button" data-k="dep">%s</button></div>'
            '<label>%s<select name="air">%s</select></label>'
            '<div class="r2"><label>%s<input type="date" name="date"></label><label id="ftwTl">%s<input type="time" name="time"></label></div>'
            '<div class="r2"><label>%s<input name="flight" autocomplete="off" autocapitalize="characters" placeholder="AF 1231"></label><label>%s<select name="pax">%s</select></label></div>'
            '<label class="ck"><input type="checkbox" name="car" checked>%s</label>'
            '<label>%s<input name="sign" autocomplete="name"></label>'
            '<button class="bk wa" type="submit">%s →</button><p class="er" role="alert"></p><p class="nt">%s</p></form></div></div>'
            '<script>%s</script>'
            % (e(w['x']), e(w['h']), e(w['on']), e(w['onh']), e(w['or']), e(w['arr']), e(w['dep']), e(w['air']), opts, e(w['date']), e(w['tarr']),
               e(w['fl']), e(w['pax']), pax, e(w['car']), e(w['sign']), e(w['send']), e(w['note']), js))
def vip_page(lg):
    p, src = VIP_TXT[lg]; ui = VIP_UI[lg]; e = html.escape
    lines = [l.rstrip() for l in io.open(os.path.join(HERE, src), encoding='utf-8').read().split('\n')]
    n_end = lines.index('@end')
    body, endl = lines[:n_end], [l.strip() for l in lines[n_end + 1:] if l.strip()]
    h1 = next(l[2:].strip() for l in body if l.startswith('# '))
    lead = next((l[2:].strip() for l in body if l.startswith('> ')), '')
    out, ul, sec, faq, cur = [], [], False, [], None
    def flush():
        if ul:
            out.append('<ul>%s</ul>' % ''.join('<li>%s</li>' % svc_link(x) for x in ul)); del ul[:]
    for l in body:
        s = l.strip()
        if not s or s.startswith('# ') or s.startswith('> '):
            continue
        if s.startswith('* '):
            ul.append(s[2:])
            if cur is not None: cur[1].append(s[2:])
            continue
        flush()
        if s.startswith('## '):
            if sec: out.append('</section>')
            out.append('<section class="q"><h2>%s</h2>' % e(s[3:])); sec = True
            cur = [s[3:], []]; faq.append(cur)
        elif s.startswith('### '):
            out.append('<h3>%s</h3>' % e(s[4:]))
        elif s.startswith('! '):
            out.append('<p class="fine">%s</p>' % svc_link(s[2:]))
        else:
            out.append('<p>%s</p>' % svc_link(s))
            if cur is not None: cur[1].append(s)
    flush()
    if sec: out.append('</section>')
    et = next((l[3:] for l in endl if l.startswith('## ')), '')
    ep = [l for l in endl if not l.startswith('## ') and not l.startswith('~ ') and not RE_URL.search(l)]
    em = next((l[2:] for l in endl if l.startswith('~ ')), '')
    ec = ''.join('<span>%s</span>' % svc_link(l) for l in endl if RE_URL.search(l))
    end = ('<div class="end"><p class="t">%s</p>%s<p class="cta" style="justify-content:center;margin-top:16px"><button class="bk" type="button" data-ftw>%s →</button></p>'
           '<p class="m" style="margin:20px 0 0">%s</p><p class="c">%s</p></div>'
           % (e(et), ''.join('<p class="x">%s</p>' % e(x) for x in ep), e(ui['b']), e(em), ec))
    ld = {'@context': 'https://schema.org', '@type': 'Service', 'name': h1, 'serviceType': 'VIP Fast Track & Airport Meet and Assist', 'inLanguage': lg,
          'provider': {'@type': 'LocalBusiness', 'name': 'Rafai Limousine', 'url': 'https://www.rafai-limousine.com/', 'telephone': '+33667099494'},
          'areaServed': 'Paris', 'description': ui['desc']}
    inner = (SVC_CSS + VIP_CSS + '<script type="application/ld+json">%s</script>' % json.dumps(ld, ensure_ascii=False).replace('</', '<\\/') +
             '<main class="rlsv"><figure class="ph"><img src="%s" width="1448" height="1086" alt="%s" decoding="async" fetchpriority="high"></figure>'
             '<div class="in"><p class="k">%s</p><h1>%s</h1><p class="lead">%s</p><p class="cta"><button class="bk" type="button" data-ftw>%s →</button>'
             '<a class="gh" href="https://wa.me/33667099494" target="_blank" rel="noopener">%s</a></p>%s%s<p class="n">%s</p></div></main>'
             % (VIP_IMG, e(ui['alt'], quote=True), e(ui['k']), e(h1), e(lead), e(ui['b']), e(ui['wa']), ''.join(out), end, e(ui['n'])) + vip_window(lg))
    return h1, inner
for lg in ('en', 'fr'):
    p = VIP_TXT[lg][0]
    h1, inner = vip_page(lg)
    docs.append((p, lg, VIP_UI[lg]['title'], 'rlsvc rlvip', inner))
    CFG.setdefault('titles', {})[p] = VIP_UI[lg]['title']
    CFG['desc'][p] = VIP_UI[lg]['desc']
    HERO[p] = VIP_IMG
CFG['groups'].append([VIP_TXT['en'][0], VIP_TXT['fr'][0]])
if not (_nav_add(CFG['nav'], '/corporate', {'t': 'VIP Fast Track', 'u': '/vip-fast-track'}) and _nav_add(CFG['nav'], '/fr/entreprises', {'t': 'Fast Track VIP', 'u': '/fr/fast-track-vip'})):
    print('ARRET menu : Corporate introuvable'); sys.exit(1)
print('onglet VIP Fast Track :', VIP_TXT['en'][0], VIP_TXT['fr'][0], VIP_IMG)

# Onglet « Team » : l'image est remplacée par les vraies photos en arche avec contours dorés animés (comme l'accueil), sans Sabrina
TV_CSS = '/* équipe : vraies photos en arche, contours dorés animés (demande de Yassine, 10 nov.) */\n@property --tva{syntax:\'<angle>\';inherits:false;initial-value:0deg}\n.tv{position:relative;max-width:780px;margin:34px auto 0;padding:34px 28px 30px;border-radius:28px;background:#0d0c0e;border:1px solid rgba(224,186,108,.38);box-shadow:0 30px 80px -24px rgba(0,0,0,.85);overflow:hidden;text-align:center}\n.tv:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 70% 55% at 50% 30%,rgba(224,186,108,.10),rgba(224,186,108,0) 70%);pointer-events:none}\n.tv .boss{position:relative;display:flex;align-items:center;justify-content:center;gap:28px;text-align:left}\n.tv .ar{--tva:0deg;position:relative;display:block;padding:3px;border-radius:50% 50% 12% 12% / 38% 38% 9% 9%;background:conic-gradient(from var(--tva),#6f5120,#b8873f 12%,#f6dfa4 22%,#fff6dc 26%,#E0BA6C 32%,#7a5a24 50%,#b8873f 68%,#f0d394 80%,#6f5120);animation:tvspin 4.5s linear infinite,tvglow 3s ease-in-out infinite}\n.tv .ar>span{display:block;overflow:hidden;border-radius:inherit;background:radial-gradient(ellipse 80% 70% at 50% 35%,#2a2622 0%,#141312 70%,#0e0d0c 100%)}\n.tv .ar img{display:block;width:100%;height:auto;aspect-ratio:150/198;object-fit:cover;object-position:50% 20%}\n.tv .boss .ar{width:210px;flex:none}\n.tv .boss .ar>span{background:#fff}\n.tv .who b{display:block;font-family:"Cormorant Garamond",Lora,Georgia,serif;font-size:36px;font-weight:600;line-height:1.1;color:var(--ink,#f3eee4)}\n.tv .who span{display:block;margin-top:8px;font-size:15px;font-weight:700;letter-spacing:.06em;color:#E0BA6C}\n.tv .mem{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:24px 20px;margin:32px auto 0;max-width:640px}\n.tv .m span.n{display:block;margin-top:9px;font-size:14.5px;font-weight:600;color:var(--ink,#f3eee4)}\n.tv .m:nth-child(2) .ar{animation-delay:-.55s,-.4s}.tv .m:nth-child(3) .ar{animation-delay:-1.1s,-.8s}.tv .m:nth-child(4) .ar{animation-delay:-1.65s,-1.2s}\n.tv .m:nth-child(5) .ar{animation-delay:-2.2s,-1.6s}.tv .m:nth-child(6) .ar{animation-delay:-2.75s,-2s}.tv .m:nth-child(7) .ar{animation-delay:-3.3s,-2.4s}.tv .m:nth-child(8) .ar{animation-delay:-3.85s,-2.8s}\n@keyframes tvspin{to{--tva:360deg}}\n@keyframes tvglow{0%,100%{box-shadow:0 10px 26px rgba(0,0,0,.55),0 0 0 rgba(224,186,108,0)}50%{box-shadow:0 10px 26px rgba(0,0,0,.55),0 0 22px rgba(224,186,108,.35)}}\n@media (max-width:640px){.tv{padding:24px 14px 22px;border-radius:22px}.tv .boss{gap:16px}.tv .boss .ar{width:140px}.tv .who b{font-size:27px}.tv .who span{font-size:13px}.tv .mem{gap:16px 10px;margin-top:24px}.tv .m span.n{font-size:12.5px}}\n@media (prefers-reduced-motion:reduce){.tv .ar{animation:none}}\n'
TV_M = ['Alex', 'David', 'Frantzdy', 'Jeremy', 'Joseph', 'Amadou', 'Amine', 'Elham']
def team_block(lg):
    return (('<style>%s</style>' % TV_CSS) +
            '<div class="tv"><div class="boss"><span class="ar"><span><img src="%s" alt="Yassine Rafai" width="210" height="277" fetchpriority="high"></span></span>'
            '<div class="who"><b>Yassine Rafai</b><span>%s</span><span>Rafai Limousine</span></div></div><div class="mem">%s</div></div>'
            % (lift_img('tm-yassine'), 'CEO – President' if lg == 'en' else 'CEO – Président',
               ''.join('<div class="m"><span class="ar"><span><img src="%s" alt="%s" width="150" height="198" loading="lazy"></span></span><span class="n">%s</span></div>'
                       % (lift_img('tm-' + n.lower()), n, n) for n in TV_M)))
_ntv = 0
for i, (p, lg, title, cls, inner) in enumerate(docs):
    if p in ('/team', '/fr/equipe'):
        new = re.sub(r'<figure><img src="/img/team-[^"]+"[^>]*></figure>', lambda m: team_block(lg), inner, count=1)
        if new != inner:
            docs[i] = (p, lg, title, cls, new); _ntv += 1
if _ntv != 2:
    print('ARRET onglet Team : image non trouvee', _ntv); sys.exit(1)

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
# image de partage (aperçu du lien dans WhatsApp, Facebook…) : la photo du haut de l'accueil en 1200 × 630 (10 nov. 2026, demande de Yassine)
_oi = Image.open(os.path.join(LIFT_DIR, 'img', 'hero.jpg')).convert('RGB'); _w, _h = _oi.size; _th = min(_h, round(_w / 1.905)); _t = (_h - _th) // 2
_oi = _oi.crop((0, _t, _w, _t + _th)).resize((1200, 630), Image.LANCZOS)
_ob = io.BytesIO(); _oi.save(_ob, 'JPEG', quality=86, optimize=True, progressive=True)
OG = '/img/og-%s.jpg' % sha(_ob.getvalue())[:10]
open(OUT + OG, 'wb').write(_ob.getvalue())
# photo de la petite fenêtre « ouvrir l'application » (nouvelle photo paysage)
open(OUT + '/img/rlch-3.webp', 'wb').write(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rlch-3.webp'), 'rb').read())
for _, _, _, _, inner in docs:
    m = re.search(r'<img[^>]*alt="Download on the App Store"[^>]*src="(/img/[^"]+)"', inner)
    if m and os.path.exists(OUT + m.group(1)):
        AB = badge(open(OUT + m.group(1), 'rb').read(), 'appstore-bar')
        break
print('badges Google Play ajoutes', NGP[0], '· barre', 'badges' if (AB and GP) else 'bouton texte', '· badge Play', GP)
BADGES = (('<a href="%s" target="_blank" rel="noopener"><img src="%s" alt="Download on the App Store" width="%d" height="26"></a>'
           '<a href="%s" target="_blank" rel="noopener"><img src="%s" alt="Get it on Google Play" width="%d" height="26"></a>')
          % (CFG['bar']['u'], AB[0], round(AB[1] * 26 / AB[2]), GPU, GP[0], round(GP[1] * 26 / GP[2]))) if (AB and GP and GPU) else (
          '<a href="%s" target="_blank" rel="noopener">App Store</a><a href="%s" target="_blank" rel="noopener">Google Play</a>' % (CFG['bar']['u'], GPU))
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
            '<meta property="og:image" content="%s%s"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">' % (BASE, OG), '<link rel="icon" href="/img/logo.png">',
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="%s" media="print" onload="this.media=\'all\'">' % fonts,
            '<link rel="stylesheet" href="/css/site.css">']
    lifted = p in LIFT_PAGES
    if lifted:
        if FONT_CSS:
            head[-2] = ''.join('<link rel="preload" as="font" type="font/woff2" href="%s" crossorigin>' % u for u in FONT_PRE) + '<style>%s</style>' % FONT_CSS
        else:
            head[-2] = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
                        '<link rel="preload" as="style" href="%s" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="%s"></noscript>' % (LFONTS, LFONTS))
        head[-1] = ('<link rel="preload" as="image" href="%s" media="(min-width:641px)" fetchpriority="high">'
                    '<link rel="preload" as="image" href="%s" media="(max-width:640px)" fetchpriority="high">'
                    '<style>@media (max-width:640px){.hero-bg{--hero:url(%s)!important}}</style>' % (LIMG['hero'], HERO_M, HERO_M))
    hp = None if lifted else HERO.get(p)
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
    if lifted:
        inner = inner.replace('<!--rlbadges-->', BADGES)
    page = ''.join(head) + '<body class="%s">' % cls + ('' if lifted else header(p, lg)) + inner + yb + '<script src="/css/site.js" defer></script></body></html>'
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
print('trajets populaires sur', ', '.join(NRT))
if len(NRT) != 4:
    print('ARRET trajets populaires absents d une page d accueil'); sys.exit(1)
print('a bord (Evian, USB-C, Wi-Fi) dans', NBD[0], 'bloc(s) de reservation · musique dans', NMU[0])
if NBD[0] == 0:
    print('ARRET icones a bord non appliquees (bloc de reservation change sur Google Sites)'); sys.exit(1)
if NAP[0] == 0:
    print('ARRET forfaits aeroport non appliques (bloc de reservation change sur Google Sites)'); sys.exit(1)
print('pages', len(docs), 'blocs', len(EMB), 'images', len(IMG), '· photos du haut prechargees', NPRE[0], '· recadrees telephone', len([1 for v in HM.values() if v]), '· photos de fond differees', NLZ[0], '· polices des blocs sans blocage', NFA[0])
