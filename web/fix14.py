# Page de réservation : reprise d'une réservation commencée sur www.rafai-limousine.com (#rsv=…).
# Le trajet et les coordonnées sont pré-remplis ; le client se connecte ou crée son compte, puis confirme ;
# Rafai Limousine confirme la course, puis le client paie en ligne (Stripe), comme dans l'appli.
import io, os, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
MARK = 'reservation commencee sur le site rafai-limousine.com'
if MARK in s:
    print('deja modifie'); sys.exit(0)
JS = r'''<script>
/* ---------- reservation commencee sur le site rafai-limousine.com (#rsv=...) : trajet et coordonnees pre-remplis,
   le client se connecte ou cree son compte puis confirme ; paiement en ligne apres confirmation ---------- */
(function () {
  var raw = null, m = String(location.hash || '').match(/rsv=([A-Za-z0-9_-]+)/);
  try { if (m) { raw = m[1]; sessionStorage.setItem('rl_rsv', raw); } else raw = sessionStorage.getItem('rl_rsv'); } catch (e) { raw = m ? m[1] : null; }
  if (!raw) return;
  var d = null;
  try { d = JSON.parse(decodeURIComponent(escape(atob(raw.replace(/-/g, '+').replace(/_/g, '/'))))); } catch (e) { d = null; }
  if (!d || typeof d !== 'object') return;
  if (m) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
  function S(k, n) { return String(d[k] == null ? '' : d[k]).trim().slice(0, n || 200); }
  function el(id) { return document.getElementById(id); }
  function put(id, v) {
    var x = el(id); if (!x || !v || x.value) return;
    x.value = v;
    try { x.dispatchEvent(new Event('input', { bubbles: true })); x.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
  }
  var filled = false, quoted = false;
  function fill() {
    if (!filled) {
      filled = true;
      var hr = S('type') === 'hourly';
      try { setType(hr ? 'hourly' : 'transfer'); } catch (e) {}
      put('from', S('from')); if (!hr) put('to', S('to'));
      put('date', S('date', 10)); put('time', S('time', 5));
      if (hr && S('h') && el('hours')) { el('hours').value = S('h', 2); try { el('hours').dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {} }
      try {
        var p = Number(d.pax), b = Number(d.bags);
        if (p >= 1 && p <= 8) { Q.pax = p; if (el('pax')) el('pax').textContent = p; }
        if (S('bags') !== '' && b >= 0 && b <= 8) { Q.bags = b; if (el('bags')) el('bags').textContent = b; }
        if (/^(sedan|first|van|suv)$/.test(S('car'))) Q.car = S('car');
      } catch (e) {}
      var notes = [S('notes', 500), S('booker') ? 'Réservé par : ' + S('booker', 80) : '', S('tel') ? 'Tél. donné sur le site : ' + S('tel', 30) : ''].filter(Boolean).join(' · ');
      put('flight', S('flight', 40)); put('notes', notes);
      put('fname', S('fname', 60)); put('lname', S('lname', 60)); put('email', S('email', 120));
      var lg = 'fr'; try { lg = L; } catch (e) {}
      try { toast(lg === 'fr' ? 'Votre trajet est repris du site : connectez-vous ou créez votre compte pour confirmer.' : 'Your trip from our website is ready: sign in or create your account to confirm.'); } catch (e) {}
    }
    var a = null; try { a = auth(); } catch (e) {}
    if (a && !quoted && el('go1') && el('from') && el('from').value) { quoted = true; setTimeout(function () { try { el('go1').click(); } catch (e) {} }, 400); }
  }
  setTimeout(fill, 700);
  if (typeof signedIn === 'function') { var _si = signedIn; signedIn = function () { var r = _si.apply(this, arguments); setTimeout(fill, 600); return r; }; }
  if (typeof done === 'function') { var _dn = done; done = function () { try { sessionStorage.removeItem('rl_rsv'); } catch (e) {} return _dn.apply(this, arguments); }; }
})();
</script>
'''
i = s.rfind('</body>')
if i < 0:
    print('ARRET body'); sys.exit(1)
s = s[:i] + JS + s[i:]
io.open(f, 'w', encoding='utf-8').write(s)
print('ok page', len(s))
