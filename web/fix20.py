# Page de réservation : reconnaître l'appli Android Rafai Limousine (Trusted Web Activity) (rlTwa v1)
# - l'appli Android ouvre https://booking.rafai-limousine.com/?src=android (ou arrive avec le référent android-app://)
# - dans l'appli : pas de balise Google Ads (comme dans l'appli iPhone) et compteur d'étapes classé « app »
# - option : python3 fix20.py <empreinte SHA-256> ajoute la clé de signature Google Play à .well-known/assetlinks.json
import io, json, os, re, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
MARK = 'rlTwa v1'
if MARK in s:
    print('deja rlTwa v1')
else:
    a = s.find('/* ---------- rlFn v1')
    b = s.find('/* ---------- adsConv v1')
    if a < 0 or b < 0:
        print('ARRET blocs rlFn / adsConv introuvables'); sys.exit(1)
    OLD_ADS = "if (window.__rlNative || /RafaiApp\\//.test(navigator.userAgent)) return;"
    NEW_ADS = "if (window.__rlNative || window.__rlTwa || /RafaiApp\\//.test(navigator.userAgent)) return;"
    OLD_FN = "src = (window.__rlNative || /RafaiApp\\//.test(navigator.userAgent)) ? 'app'"
    NEW_FN = "src = (window.__rlNative || window.__rlTwa || /RafaiApp\\//.test(navigator.userAgent)) ? 'app'"
    i_ads = s.find(OLD_ADS, b)
    i_fn = s.find(OLD_FN, a)
    if i_ads < 0 or i_fn < 0:
        print('ARRET garde adsConv ou source rlFn introuvable'); sys.exit(1)
    s = s[:i_ads] + NEW_ADS + s[i_ads + len(OLD_ADS):]
    i_fn = s.find(OLD_FN, a)
    s = s[:i_fn] + NEW_FN + s[i_fn + len(OLD_FN):]
    JS = r'''/* ---------- rlTwa v1 : appli Android Rafai Limousine (Trusted Web Activity) ---------- */
(function rlTwa() {
  try {
    if (/[?&]src=android\b/.test(location.search) || /^android-app:\/\/com\.rafailimousine\.client/.test(document.referrer || '')) sessionStorage.setItem('rl_twa', '1');
    if (sessionStorage.getItem('rl_twa') === '1') window.__rlTwa = 1;
  } catch (x) {}
})();
'''
    a = s.find('/* ---------- rlFn v1')
    s = s[:a] + JS + s[a:]
    io.open(f, 'w', encoding='utf-8').write(s)
    print('ok rlTwa v1', len(s))

if len(sys.argv) > 1:
    sha = sys.argv[1].strip().upper()
    if not re.match(r'^([0-9A-F]{2}:){31}[0-9A-F]{2}$', sha):
        print('ARRET empreinte invalide'); sys.exit(1)
    al = os.path.join(H, 'booking/public/.well-known/assetlinks.json')
    d = json.load(io.open(al, encoding='utf-8'))
    for st in d:
        t = st.get('target', {})
        if t.get('package_name') == 'com.rafailimousine.client':
            fp = t.setdefault('sha256_cert_fingerprints', [])
            if sha not in fp:
                fp.append(sha)
    io.open(al, 'w', encoding='utf-8').write(json.dumps(d, indent=2) + '\n')
    print('ok assetlinks', sum(len(st['target'].get('sha256_cert_fingerprints', [])) for st in d), 'empreinte(s)')
