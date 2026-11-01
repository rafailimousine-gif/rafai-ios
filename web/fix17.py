# Page de réservation / appli client : compteur anonyme des étapes (rlFn v1), dans le script principal.
# arrivée, écran de connexion, code e-mail demandé, connecté, prix affichés, voiture choisie, réservation envoyée.
# Aucune donnée personnelle : seulement l'étape, la langue et la source (site, appli, direct, pub).
import io, os, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
MARK = 'rlFn v1'
if MARK in s:
    print('deja rlFn v1'); sys.exit(0)
q = s.find('var Q = {')
if q < 0:
    print('ARRET Q'); sys.exit(1)
e = s.find('</script>', q)
end = s.rfind('})();', q, e)
if e < 0 or end < 0:
    print('ARRET fin script'); sys.exit(1)
for need in ('function show(n)', 'function gateShow()', 'function gateDraw()', 'function signedIn(r)', 'function done(r, payLater)', 'var APP = '):
    if need not in s:
        print('ARRET absent : ' + need); sys.exit(1)

JS = r'''/* ---------- rlFn v1 : compteur anonyme des etapes de reservation (aucune donnee personnelle) ---------- */
(function rlFn() {
  var SK = 'rl_fn', seen = {}, src = 'direct';
  try { seen = JSON.parse(sessionStorage.getItem(SK) || '{}') || {}; } catch (x) {}
  try {
    src = sessionStorage.getItem('rl_fn_src') || '';
    if (!src) {
      src = (window.__rlNative || /RafaiApp\//.test(navigator.userAgent)) ? 'app'
        : (/[?&](gclid|gbraid|wbraid)=/.test(location.search)) ? 'pub'
        : (sessionStorage.getItem('rl_rsv') || /rsv=/.test(location.hash)) ? 'site' : 'direct';
      sessionStorage.setItem('rl_fn_src', src);
    }
  } catch (x) { src = src || 'direct'; }
  function fn(k) {
    if (seen[k]) return; seen[k] = 1;
    try { sessionStorage.setItem(SK, JSON.stringify(seen)); } catch (x) {}
    try { fetch(APP + '?app=cfn&s=' + k + '&lg=' + L + '&src=' + src + '&_=' + Date.now(), { mode: 'no-cors', keepalive: true, credentials: 'omit' }); } catch (x) {}
  }
  function gate() { try { if (!auth() && $('gate').classList.contains('on')) fn('b_gate'); } catch (x) {} }
  fn('b_open'); gate();
  var _gs = gateShow; gateShow = function () { var r = _gs.apply(this, arguments); gate(); return r; };
  var _gd = gateDraw; gateDraw = function () { var r = _gd.apply(this, arguments); try { if (GL && GL.v === 'code') fn('b_code'); } catch (x) {} return r; };
  var _si = signedIn; signedIn = function () { fn('b_in'); return _si.apply(this, arguments); };
  var _sh = show; show = function (n) { var r = _sh.apply(this, arguments); if (n === 2) fn('b_prix'); else if (n === 3) fn('b_car'); return r; };
  var _dn = done; done = function () { fn('b_resa'); return _dn.apply(this, arguments); };
})();
'''
s = s[:end] + JS + s[end:]
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlFn v1', len(s))
