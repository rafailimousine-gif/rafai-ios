# Envoi d'une version iPhone à la validation App Store (API App Store Connect, clé déjà utilisée pour TestFlight).
# Demande de Yassine (« Envoie à Apple », 16 nov. 2026). Variables : BUNDLE, VERSION, BUILD, NOTES_FR, NOTES_EN, SUBMIT (1 = soumettre).
import os, sys, time, json, re, textwrap, urllib.request, urllib.error
import jwt
KID, ISS = os.environ['ASC_KEY_ID'], os.environ['ASC_ISSUER_ID']
raw = os.environ['ASC_KEY_P8'].replace('\r', '')
m = re.search(r'-----BEGIN PRIVATE KEY-----(.*?)-----END PRIVATE KEY-----', raw, re.S)
body = re.sub(r'[^A-Za-z0-9+/=]', '', m.group(1) if m else raw)
KEY = '-----BEGIN PRIVATE KEY-----\n' + '\n'.join(textwrap.wrap(body, 64)) + '\n-----END PRIVATE KEY-----\n'
BUNDLE, VER, BUILD = os.environ['BUNDLE'], os.environ['VERSION'], os.environ['BUILD']
FR, EN, SUBMIT = os.environ['NOTES_FR'].strip(), os.environ['NOTES_EN'].strip(), os.environ.get('SUBMIT') == '1'
def tok():
    n = int(time.time())
    return jwt.encode({'iss': ISS, 'iat': n, 'exp': n + 1000, 'aud': 'appstoreconnect-v1'}, KEY, algorithm='ES256', headers={'kid': KID, 'typ': 'JWT'})
def api(method, path, data=None, ok409=False):
    req = urllib.request.Request('https://api.appstoreconnect.apple.com' + path, method=method,
        data=json.dumps(data).encode() if data is not None else None,
        headers={'Authorization': 'Bearer ' + tok(), 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as r:
            t = r.read().decode()
            return json.loads(t) if t else {}
    except urllib.error.HTTPError as e:
        t = e.read().decode()
        if ok409 and e.code == 409:
            print('  (déjà fait : %s)' % t[:300]); return {}
        print('::error::%s %s -> %s %s' % (method, path, e.code, t[:2000])); sys.exit(1)
app = api('GET', '/v1/apps?filter[bundleId]=' + BUNDLE)['data']
if not app: print('::error::appli %s introuvable' % BUNDLE); sys.exit(1)
app = app[0]; AID = app['id']; print('Appli', app['attributes']['name'], AID)
# 1. build traité par Apple
b = None
for i in range(60):
    d = api('GET', '/v1/builds?filter[app]=%s&filter[version]=%s&filter[preReleaseVersion.version]=%s&limit=5' % (AID, BUILD, VER))['data']
    if d:
        b = d[0]; st = b['attributes']['processingState']; print('Build', BUILD, st)
        if st == 'VALID': break
        if st in ('FAILED', 'INVALID'): print('::error::build %s %s' % (BUILD, st)); sys.exit(1)
    else: print('Build', BUILD, 'pas encore visible')
    time.sleep(30)
else:
    print('::error::build %s pas prêt' % BUILD); sys.exit(1)
BID = b['id']
if b['attributes'].get('usesNonExemptEncryption') is None:
    api('PATCH', '/v1/builds/' + BID, {'data': {'type': 'builds', 'id': BID, 'attributes': {'usesNonExemptEncryption': False}}}); print('Chiffrement : non (standard)')
# 2. version App Store
vs = api('GET', '/v1/apps/%s/appStoreVersions?filter[platform]=IOS&limit=50' % AID)['data']
def state(v): return v['attributes'].get('appVersionState') or v['attributes'].get('appStoreState')
for v in vs: print('  version existante', v['attributes']['versionString'], state(v))
EDIT = ('PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY', 'READY_FOR_REVIEW')
v = next((x for x in vs if x['attributes']['versionString'] == VER), None)
REPLACE = os.environ.get('REPLACE') == '1'
if v and REPLACE and state(v) in ('WAITING_FOR_REVIEW', 'IN_REVIEW', 'UNRESOLVED_ISSUES'):
    # remplacement du build d'une version en attente (Yassine, 17 nov. 2026 : nouvelles icônes)
    for s in ('WAITING_FOR_REVIEW', 'IN_REVIEW', 'UNRESOLVED_ISSUES'):
        for r in api('GET', '/v1/reviewSubmissions?filter[app]=%s&filter[platform]=IOS&filter[state]=%s' % (AID, s))['data']:
            api('PATCH', '/v1/reviewSubmissions/' + r['id'], {'data': {'type': 'reviewSubmissions', 'id': r['id'], 'attributes': {'canceled': True}}})
            print('Retiré de l\'examen :', r['id'], s)
    for i in range(40):
        time.sleep(15)
        v = next(x for x in api('GET', '/v1/apps/%s/appStoreVersions?filter[platform]=IOS&limit=50' % AID)['data'] if x['attributes']['versionString'] == VER)
        print('  état', state(v))
        if state(v) in EDIT: break
    else: print('::error::version toujours %s' % state(v)); sys.exit(1)
if v and state(v) in ('WAITING_FOR_REVIEW', 'IN_REVIEW', 'PENDING_DEVELOPER_RELEASE', 'READY_FOR_SALE', 'READY_FOR_DISTRIBUTION', 'ACCEPTED', 'PROCESSING_FOR_DISTRIBUTION'):
    print('Version %s déjà %s : rien à faire' % (VER, state(v))); sys.exit(0)
if not v:
    v = next((x for x in vs if state(x) in EDIT), None)
    if v:
        api('PATCH', '/v1/appStoreVersions/' + v['id'], {'data': {'type': 'appStoreVersions', 'id': v['id'], 'attributes': {'versionString': VER}}}); print('Version modifiable renommée en', VER)
    else:
        v = api('POST', '/v1/appStoreVersions', {'data': {'type': 'appStoreVersions', 'attributes': {'platform': 'IOS', 'versionString': VER},
            'relationships': {'app': {'data': {'type': 'apps', 'id': AID}}}}})['data']; print('Version créée', VER)
VID = v['id']
api('PATCH', '/v1/appStoreVersions/%s/relationships/build' % VID, {'data': {'type': 'builds', 'id': BID}}); print('Build %s attaché à %s' % (BUILD, VER))
# 3. texte « Nouveautés »
for loc in api('GET', '/v1/appStoreVersions/%s/appStoreVersionLocalizations?limit=50' % VID)['data']:
    l = loc['attributes']['locale']; txt = FR if l.lower().startswith('fr') else EN
    api('PATCH', '/v1/appStoreVersionLocalizations/' + loc['id'], {'data': {'type': 'appStoreVersionLocalizations', 'id': loc['id'], 'attributes': {'whatsNew': txt}}})
    print('Nouveautés', l, ':', txt)
if not SUBMIT: print('Prêt (non soumis)'); sys.exit(0)
# 4. soumission
rs = api('GET', '/v1/reviewSubmissions?filter[app]=%s&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW' % AID)['data']
if rs: RID = rs[0]['id']
else:
    RID = api('POST', '/v1/reviewSubmissions', {'data': {'type': 'reviewSubmissions', 'attributes': {'platform': 'IOS'},
        'relationships': {'app': {'data': {'type': 'apps', 'id': AID}}}}})['data']['id']
api('POST', '/v1/reviewSubmissionItems', {'data': {'type': 'reviewSubmissionItems', 'relationships': {
    'reviewSubmission': {'data': {'type': 'reviewSubmissions', 'id': RID}}, 'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': VID}}}}}, ok409=True)
r = api('PATCH', '/v1/reviewSubmissions/' + RID, {'data': {'type': 'reviewSubmissions', 'id': RID, 'attributes': {'submitted': True}}})
print('SOUMIS à Apple :', VER, 'build', BUILD, 'état', r['data']['attributes'].get('state'))
