# Lecture seule : état des versions App Store et des soumissions (aucune modification).
import os, sys, time, json, re, textwrap, urllib.request
import jwt
KID, ISS = os.environ['ASC_KEY_ID'], os.environ['ASC_ISSUER_ID']
raw = os.environ['ASC_KEY_P8'].replace('\r', '')
m = re.search(r'-----BEGIN PRIVATE KEY-----(.*?)-----END PRIVATE KEY-----', raw, re.S)
body = re.sub(r'[^A-Za-z0-9+/=]', '', m.group(1) if m else raw)
KEY = '-----BEGIN PRIVATE KEY-----\n' + '\n'.join(textwrap.wrap(body, 64)) + '\n-----END PRIVATE KEY-----\n'
def tok():
    n = int(time.time())
    return jwt.encode({'iss': ISS, 'iat': n, 'exp': n + 1000, 'aud': 'appstoreconnect-v1'}, KEY, algorithm='ES256', headers={'kid': KID, 'typ': 'JWT'})
def api(path):
    req = urllib.request.Request('https://api.appstoreconnect.apple.com' + path, headers={'Authorization': 'Bearer ' + tok()})
    with urllib.request.urlopen(req) as r: return json.loads(r.read().decode())
for bid in ('com.rafailimousine.client', 'com.rafailimousine.driver'):
    a = api('/v1/apps?filter[bundleId]=' + bid)['data'][0]; AID = a['id']
    print('==', a['attributes']['name'], bid)
    for v in api('/v1/apps/%s/appStoreVersions?filter[platform]=IOS&limit=5' % AID)['data']:
        at = v['attributes']
        try: b = api('/v1/appStoreVersions/%s/build' % v['id'])['data']; bn = b['attributes']['version'] if b else '-'
        except Exception: bn = '?'
        print('  version', at['versionString'], at.get('appVersionState') or at.get('appStoreState'), 'build', bn, at.get('createdDate', '')[:16])
    for s in api('/v1/reviewSubmissions?filter[app]=%s&filter[platform]=IOS&limit=5' % AID)['data']:
        print('  soumission', s['id'][:8], s['attributes'].get('state'), s['attributes'].get('submittedDate', ''))
    bs = api('/v1/builds?filter[app]=%s&sort=-uploadedDate&limit=3' % AID)['data']
    print('  derniers builds', [(x['attributes']['version'], x['attributes']['processingState']) for x in bs])
