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

# Page Confidentialité : section « Supprimer votre compte » (lien demandé par Google Play), FR + EN
pf = os.path.join(H, 'booking/public/confidentialite/index.html')
if os.path.exists(pf):
    p = io.open(pf, encoding='utf-8').read()
    if 'id="suppression"' in p:
        print('deja section suppression')
    else:
        FR = ('<h2 id="suppression">Supprimer votre compte</h2>\n'
              '<p>Rafai Limousine (Rafai Limousine SAS) : vous pouvez supprimer votre compte et les données associées à tout moment, '
              'depuis l’appli Rafai Limousine (Android ou iPhone) ou depuis le site :</p>\n'
              '<ol>\n<li>Ouvrez l’appli Rafai Limousine ou <a href="https://booking.rafai-limousine.com/">booking.rafai-limousine.com</a> et connectez-vous.</li>\n'
              '<li>Touchez <strong>Compte</strong>, puis <strong>Supprimer mon compte</strong>, et touchez une seconde fois pour confirmer.</li>\n</ol>\n'
              '<p>Vous pouvez aussi écrire à <a href="mailto:contact@rafai-limousine.com">contact@rafai-limousine.com</a> '
              '(objet « Suppression de compte ») depuis l’adresse e-mail de votre compte.</p>\n'
              '<p>Données supprimées sous 30 jours : nom, e-mail, téléphone, adresses, historique et détails des courses, identifiants de connexion. '
              'Données conservées : factures et pièces comptables, pendant 10 ans (obligation légale).</p>\n\n')
        EN = ('<h2 id="delete-account">Delete your account</h2>\n'
              '<p>Rafai Limousine (Rafai Limousine SAS): you can delete your account and the related data at any time, '
              'from the Rafai Limousine app (Android or iPhone) or from the website:</p>\n'
              '<ol>\n<li>Open the Rafai Limousine app or <a href="https://booking.rafai-limousine.com/">booking.rafai-limousine.com</a> and sign in.</li>\n'
              '<li>Tap <strong>Account</strong>, then <strong>Delete my account</strong>, and tap again to confirm.</li>\n</ol>\n'
              '<p>You can also e-mail <a href="mailto:contact@rafai-limousine.com">contact@rafai-limousine.com</a> '
              '(subject “Account deletion”) from your account’s e-mail address.</p>\n'
              '<p>Deleted within 30 days: name, e-mail, phone, addresses, ride history and details, sign-in identifiers. '
              'Kept: invoices and accounting records, for 10 years (legal obligation).</p>\n\n')
        k = 0
        for title, blk in (('Mesure publicitaire', FR), ('Advertising measurement', EN)):
            for tag in ('h2', 'h3'):
                mark = '<%s>%s</%s>' % (tag, title, tag)
                i = p.find(mark)
                if i >= 0:
                    p = p[:i] + blk.replace('<h2', '<' + tag).replace('</h2>', '</%s>' % tag) + p[i:]; k += 1
                    break
            else:
                print('introuvable : ' + title)
        if k:
            io.open(pf, 'w', encoding='utf-8').write(p)
        print('ok section suppression', k)

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
