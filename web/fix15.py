# Page de réservation : reprise d'une réservation commencée sur www.rafai-limousine.com (#rsv=…), version 2.
# Le code est placé DANS le script principal (accès à Q, setType, toast, auth, signedIn, done…) :
# trajet, date, heure, passagers, bagages, nom et e-mail pré-remplis ; après connexion, les prix s'affichent.
import io, os, sys, re
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
MARK2 = 'rsvSite v2'
if MARK2 in s:
    print('deja v2'); sys.exit(0)

# 1) retirer l'ancien bloc (fix14), qui tournait hors du script principal
OLD = 'reservation commencee sur le site rafai-limousine.com'
i = s.find(OLD)
if i >= 0:
    a = s.rfind('<script>', 0, i)
    b = s.find('</script>', i)
    if a < 0 or b < 0:
        print('ARRET ancien bloc'); sys.exit(1)
    b += len('</script>')
    if s[b:b + 1] == '\n':
        b += 1
    s = s[:a] + s[b:]
    print('ancien bloc retire')

# 2) insérer la v2 juste avant la fin du script principal
q = s.find('var Q = {')
if q < 0:
    print('ARRET Q'); sys.exit(1)
e = s.find('</script>', q)
end = s.rfind('})();', q, e)
if e < 0 or end < 0:
    print('ARRET fin script'); sys.exit(1)

JS = r'''/* ---------- rsvSite v2 : reservation commencee sur www.rafai-limousine.com (#rsv=...) ----------
   trajet, date, heure, passagers, bagages, nom et e-mail pre-remplis ; le client se connecte ou cree son compte
   (Apple, Google, e-mail, Face ID), voit les prix et confirme ; paiement en ligne apres confirmation */
(function rsvSite() {
  var raw = null, m = String(location.hash || '').match(/rsv=([A-Za-z0-9_-]+)/);
  try { if (m) { raw = m[1]; sessionStorage.setItem('rl_rsv', raw); } else raw = sessionStorage.getItem('rl_rsv'); } catch (x) { raw = m ? m[1] : null; }
  if (!raw) return;
  var d = null;
  try { d = JSON.parse(decodeURIComponent(escape(atob(raw.replace(/-/g, '+').replace(/_/g, '/'))))); } catch (x) { d = null; }
  if (!d || typeof d !== 'object') return;
  if (m) { try { history.replaceState(null, '', location.pathname + location.search); } catch (x) {} }
  function S(k, n) { return String(d[k] == null ? '' : d[k]).trim().slice(0, n || 200); }
  function put(id, v, keep) {
    var x = $(id); if (!x || !v || (keep && x.value)) return;
    x.value = v;
    try { x.dispatchEvent(new Event('input', { bubbles: true })); x.dispatchEvent(new Event('change', { bubbles: true })); } catch (y) {}
  }
  var hr = S('type') === 'hourly', car = /^(sedan|van|first|suv)$/.test(S('car')) ? S('car') : '';
  try { setType(hr ? 'hourly' : 'transfer'); } catch (x) {}
  put('from', S('from')); if (!hr) put('to', S('to'));
  var dt = S('date', 10), tm = S('time', 5);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dt) && dt >= today(0)) put('date', dt);
  if (/^\d{2}:\d{2}$/.test(tm)) put('time', tm);
  if (hr && S('h')) put('hours', String(Math.min(12, Math.max(2, Number(S('h')) || 3))));
  var p = Number(d.pax), b = Number(d.bags);
  if (p >= 1 && p <= 8) { Q.pax = p; $('pax').textContent = p; }
  if (S('bags') !== '' && b >= 0 && b <= 8) { Q.bags = b; $('bags').textContent = b; }
  var notes = [S('notes', 500), S('booker') ? 'Réservé par : ' + S('booker', 80) : '', S('tel') ? 'Tél. donné sur le site : ' + S('tel', 30) : ''].filter(Boolean).join(' · ');
  put('flight', S('flight', 40), true); put('notes', notes, true);
  put('fname', S('fname', 60), true); put('lname', S('lname', 60), true); put('email', S('email', 120), true);
  put('ge', S('email', 120), true);
  try {
    var me = LS.json('rl_me', {}) || {};
    if (!me.fname && S('fname')) me.fname = S('fname', 60);
    if (!me.lname && S('lname')) me.lname = S('lname', 60);
    if (!me.tel && /^\+\d[\d ]{6,}$/.test(S('tel', 30))) me.tel = S('tel', 30);
    LS.set('rl_me', JSON.stringify(me));
  } catch (x) {}
  var MSG = { fr: 'Votre trajet est repris du site : connectez-vous ou créez votre compte pour voir le prix et confirmer.',
    en: 'Your trip from our website is ready: sign in or create your account to see the price and confirm.',
    ar: 'تم نقل رحلتك من الموقع: سجّل الدخول أو أنشئ حسابك لرؤية السعر والتأكيد.',
    zh: '已载入您在网站上填写的行程：请登录或创建账户以查看价格并确认。' };
  setTimeout(function () { try { toast(MSG[L] || MSG.en); } catch (x) {} }, 600);
  var quoted = false;
  function quote() {
    var A = null; try { A = auth(); } catch (x) {}
    if (quoted || !A || !$('from').value || $('b1').classList.contains('hide')) return;
    try { if (typeof profOk === 'function' && !profOk()) return; } catch (x) {}
    quoted = true;
    setTimeout(function () {
      try { $('go1').click(); } catch (x) { return; }
      if (!car) return;
      var n = 0, w = setInterval(function () {
        if (++n > 40) { clearInterval(w); return; }
        if (Q.res && !$('b2').classList.contains('hide')) {
          clearInterval(w);
          var pr = Q.res.prices && Q.res.prices[car];
          if (pr && Q.pax <= pr.pax && !Q.car) { Q.car = car; try { showCars(); } catch (x) {} }
        }
      }, 250);
    }, 500);
  }
  setTimeout(quote, 900);
  var _si = signedIn;
  signedIn = function () { var r = _si.apply(this, arguments); setTimeout(quote, 700); return r; };
  var _dn = done;
  done = function () { try { sessionStorage.removeItem('rl_rsv'); } catch (x) {} return _dn.apply(this, arguments); };
  document.addEventListener('click', function (ev) { if (ev.target && ev.target.closest && ev.target.closest('#pfSave,#pf_save,[data-prof-save]')) setTimeout(quote, 1500); }, true);
})();
'''
s = s[:end] + JS + s[end:]
io.open(f, 'w', encoding='utf-8').write(s)
print('ok v2', len(s))
