#!/usr/bin/env python3
# Prospection Rafai Limousine : pour chaque site officiel de la liste, lit l'accueil et les pages contact / mentions légales
# et relève les adresses e-mail publiées par la société elle-même (aucune adresse devinée).
# Usage (Cloud Shell) : python3 emails.py domaines.txt > resultats.tsv
import sys, re, html, ssl, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
EM = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
LK = re.compile(r'href=["\']([^"\'#]+)["\']', re.I)
KEY = re.compile(r'contact|nous-contacter|contactez|contact-us|get-in-touch|mentions|legal|imprint|impressum|about|a-propos|offices|bureaux|enquir', re.I)
BAD = re.compile(r'noreply|no-reply|donotreply|rgpd|gdpr|dpo|privacy|confidential|recrut|career|jobs|job@|cv@|candidat|hr@|rh@|webmaster|example|sentry|wixpress|domain\.com|email\.com|\.(png|jpg|jpeg|gif|webp|svg)$', re.I)
CTX = ssl.create_default_context()


def get(url, n=600000):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'fr,en;q=0.8'}), timeout=12, context=CTX)
        return r.geturl(), r.read(n).decode('utf-8', 'ignore')
    except Exception as e:
        return None, ''


def cf(s):
    # adresses masquées par Cloudflare (data-cfemail)
    out = []
    for h in re.findall(r'data-cfemail="([0-9a-fA-F]+)"', s):
        k = int(h[:2], 16)
        out.append(''.join(chr(int(h[i:i + 2], 16) ^ k) for i in range(2, len(h), 2)))
    return out


def emails(s):
    s2 = html.unescape(urllib.parse.unquote(s))
    found = EM.findall(s2) + cf(s)
    return [e.lower().strip('.') for e in found if not BAD.search(e)]


def one(line):
    parts = line.split('|')
    cat, dom = parts[0].strip(), parts[1].strip()
    name = parts[2].strip() if len(parts) > 2 else dom
    base = 'https://' + dom + '/'
    final, h = get(base)
    if not h:
        final, h = get('https://www.' + dom + '/') if not dom.startswith('www.') else (None, '')
    if not h:
        return '\t'.join([cat, name, dom, 'HS', '', ''])
    title = re.search(r'<title[^>]*>(.*?)</title>', h, re.S | re.I)
    title = re.sub(r'\s+', ' ', html.unescape(title.group(1))).strip()[:60] if title else ''
    got = emails(h)
    host = urllib.parse.urlparse(final).netloc
    links = []
    for l in LK.findall(h):
        u = urllib.parse.urljoin(final, l)
        p = urllib.parse.urlparse(u)
        if p.netloc == host and KEY.search(p.path) and u not in links:
            links.append(u)
    for u in links[:5]:
        _, hh = get(u)
        got += emails(hh)
    seen = []
    for e in got:
        if e not in seen:
            seen.append(e)
    root = re.sub(r'^www\.', '', host)
    same = [e for e in seen if e.split('@')[1].endswith(root.split('.')[-2] + '.' + root.split('.')[-1]) or root.split('.')[-2] in e.split('@')[1]]
    other = [e for e in seen if e not in same]
    return '\t'.join([cat, name, dom, title, ','.join(same[:8]), ','.join(other[:3])])


if __name__ == '__main__':
    rows = [l.strip() for l in open(sys.argv[1], encoding='utf-8') if l.strip() and not l.startswith('#')]
    with ThreadPoolExecutor(16) as ex:
        for r in ex.map(one, rows):
            print(r, flush=True)
