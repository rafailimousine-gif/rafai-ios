# Remplace les captures iPhone d'une version App Store en attente, puis la renvoie à la validation.
# Demande de Yassine (« publie tout », 17 nov. 2026) : nouvelles captures bordeaux.
# Variables : BUNDLE, VERSION, DIR (dossier des PNG 1206x2622, triés par nom).
import os, sys, time, json, re, textwrap, hashlib, glob, urllib.request, urllib.error
import jwt
KID, ISS = os.environ['ASC_KEY_ID'], os.environ['ASC_ISSUER_ID']
raw = os.environ['ASC_KEY_P8'].replace('\r', '')
m = re.search(r'-----BEGIN PRIVATE KEY-----(.*?)-----END PRIVATE KEY-----', raw, re.S)
body = re.sub(r'[^A-Za-z0-9+/=]', '', m.group(1) if m else raw)
KEY = '-----BEGIN PRIVATE KEY-----\n' + '\n'.join(textwrap.wrap(body, 64)) + '\n-----END PRIVATE KEY-----\n'
BUNDLE, VER, DIR = os.environ['BUNDLE'], os.environ['VERSION'], os.environ['DIR']
FILES = sorted(glob.glob(os.path.join(DIR, '*-1206x2622.png')))
if not FILES: print('::error::aucune capture dans', DIR); sys.exit(1)
def tok():
    n = int(time.time())
    return jwt.encode({'iss': ISS, 'iat': n, 'exp': n + 1000, 'aud': 'appstoreconnect-v1'}, KEY, algorithm='ES256', headers={'kid': KID, 'typ': 'JWT'})
def api(method, path, data=None, ok=()):
    req = urllib.request.Request('https://api.appstoreconnect.apple.com' + path, method=method,
        data=json.dumps(data).encode() if data is not None else None,
        headers={'Authorization': 'Bearer ' + tok(), 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as r:
            t = r.read().decode(); return json.loads(t) if t else {}
    except urllib.error.HTTPError as e:
        t = e.read().decode()
        if e.code in ok: print('  (%s : %s)' % (e.code, t[:300])); return {}
        print('::error::%s %s -> %s %s' % (method, path, e.code, t[:2000])); sys.exit(1)
app = api('GET', '/v1/apps?filter[bundleId]=' + BUNDLE)['data'][0]; AID = app['id']
print('Appli', app['attributes']['name'], AID, '-', len(FILES), 'captures')
def version():
    vs = api('GET', '/v1/apps/%s/appStoreVersions?filter[platform]=IOS&filter[versionString]=%s' % (AID, VER))['data']
    if not vs: print('::error::version %s introuvable' % VER); sys.exit(1)
    v = vs[0]; return v, v['attributes'].get('appVersionState') or v['attributes'].get('appStoreState')
v, st = version(); VID = v['id']; print('Version', VER, st)
def plan():
    out = []
    for loc in api('GET', '/v1/appStoreVersions/%s/appStoreVersionLocalizations?limit=50' % VID)['data']:
        for ss in api('GET', '/v1/appStoreVersionLocalizations/%s/appScreenshotSets?limit=50' % loc['id'])['data']:
            dt = ss['attributes']['screenshotDisplayType']
            old = api('GET', '/v1/appScreenshotSets/%s/appScreenshots?limit=50' % ss['id'])['data']
            dims = {(o['attributes'].get('imageAsset') or {}).get('width', 0) for o in old} | set()
            hs = {(o['attributes'].get('imageAsset') or {}).get('height', 0) for o in old}
            ok = bool(old) and dt.startswith('APP_IPHONE') and dims == {1206} and hs == {2622}
            print(' ', loc['attributes']['locale'], dt, len(old), 'capture(s)', sorted(dims), sorted(hs), '-> remplacé' if ok else '-> inchangé')
            if ok: out.append((loc['attributes']['locale'], dt, ss['id'], [o['id'] for o in old]))
    return out
TARGETS = plan()
if not TARGETS: print('::error::aucun jeu de captures 1206x2622 : rien changé, version laissée en examen'); sys.exit(1)
EDIT = ('PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY', 'READY_FOR_REVIEW')
# 1. retirer de l'examen si besoin
if st not in EDIT:
    for s in ('WAITING_FOR_REVIEW', 'IN_REVIEW', 'UNRESOLVED_ISSUES'):
        for r in api('GET', '/v1/reviewSubmissions?filter[app]=%s&filter[platform]=IOS&filter[state]=%s' % (AID, s))['data']:
            api('PATCH', '/v1/reviewSubmissions/' + r['id'], {'data': {'type': 'reviewSubmissions', 'id': r['id'], 'attributes': {'canceled': True}}})
            print('Retiré de l\'examen :', r['id'], s)
    for i in range(40):
        time.sleep(15); v, st = version(); print('  état', st)
        if st in EDIT: break
    else: print('::error::version toujours %s' % st); sys.exit(1)
# 2. captures, pour chaque langue
def upload(set_id, f):
    data = open(f, 'rb').read()
    s = api('POST', '/v1/appScreenshots', {'data': {'type': 'appScreenshots', 'attributes': {'fileName': os.path.basename(f), 'fileSize': len(data)},
        'relationships': {'appScreenshotSet': {'data': {'type': 'appScreenshotSets', 'id': set_id}}}}})['data']
    for op in s['attributes']['uploadOperations']:
        chunk = data[op['offset']:op['offset'] + op['length']]
        req = urllib.request.Request(op['url'], method=op['method'], data=chunk, headers={h['name']: h['value'] for h in op.get('requestHeaders', [])})
        urllib.request.urlopen(req).read()
    api('PATCH', '/v1/appScreenshots/' + s['id'], {'data': {'type': 'appScreenshots', 'id': s['id'], 'attributes': {'uploaded': True, 'sourceFileChecksum': hashlib.md5(data).hexdigest()}}})
    return s['id']
for locale, dt, sid, old in TARGETS:
    for o in old: api('DELETE', '/v1/appScreenshots/' + o, ok=(404, 409))
    ids = [upload(sid, f) for f in FILES]
    for k in range(40):
        states = [api('GET', '/v1/appScreenshots/' + i)['data']['attributes'].get('assetDeliveryState', {}).get('state') for i in ids]
        if all(x == 'COMPLETE' for x in states): break
        if any(x == 'FAILED' for x in states): print('::error::traitement échoué', states); break
        time.sleep(6)
    print(' ', locale, dt, ': nouvelles captures', states)
# 3. renvoi à la validation
rs = api('GET', '/v1/reviewSubmissions?filter[app]=%s&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW' % AID)['data']
RID = rs[0]['id'] if rs else api('POST', '/v1/reviewSubmissions', {'data': {'type': 'reviewSubmissions', 'attributes': {'platform': 'IOS'},
    'relationships': {'app': {'data': {'type': 'apps', 'id': AID}}}}})['data']['id']
api('POST', '/v1/reviewSubmissionItems', {'data': {'type': 'reviewSubmissionItems', 'relationships': {
    'reviewSubmission': {'data': {'type': 'reviewSubmissions', 'id': RID}}, 'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': VID}}}}}, ok=(409,))
r = api('PATCH', '/v1/reviewSubmissions/' + RID, {'data': {'type': 'reviewSubmissions', 'id': RID, 'attributes': {'submitted': True}}})
print('RENVOYÉ à Apple :', VER, 'état', r['data']['attributes'].get('state'))
