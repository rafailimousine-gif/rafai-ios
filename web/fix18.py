# Page de réservation : balise Google Ads + conversion « Réservation payée (booking) » (adsConv v1).
# - gtag.js chargé avec AW-18537077612 (le gclid du clic pub est mémorisé par Google sur rafai-limousine.com)
# - consentement : refusé par défaut dans l'EEE, au Royaume-Uni et en Suisse (pas de bandeau cookies), accordé ailleurs
#   (campagnes USA et Golfe) ; jamais de personnalisation publicitaire
# - conversion envoyée quand une course apparaît « payée » (retour de Stripe), avec le prix et la référence
#   (transaction_id : Google ne la compte qu'une fois), une seule fois par navigateur ; rien dans l'appli iPhone
import io, os, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
MARK = 'adsConv v1'
if MARK in s:
    print('deja adsConv v1'); sys.exit(0)
q = s.find('var Q = {')
if q < 0:
    print('ARRET Q'); sys.exit(1)
e = s.find('</script>', q)
end = s.rfind('})();', q, e)
if e < 0 or end < 0:
    print('ARRET fin script'); sys.exit(1)
for need in ('function drawRide(x, paidBack)', 'var LS', 'function refreshRide('):
    if need not in s:
        print('ARRET absent : ' + need); sys.exit(1)

JS = r'''/* ---------- adsConv v1 : balise Google Ads + conversion « Reservation payee (booking) » ---------- */
(function adsConv() {
  if (window.__rlNative || /RafaiApp\//.test(navigator.userAgent)) return;
  var AW = 'AW-18537077612', SEND = AW + '/AjD4CLiBqLAdEOy2lYdF';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  var EEA = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL',
    'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH'];
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', region: EEA });
  gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'denied', analytics_storage: 'denied' });
  gtag('js', new Date());
  gtag('config', AW);
  try { var sc = document.createElement('script'); sc.async = true; sc.src = 'https://www.googletagmanager.com/gtag/js?id=' + AW; document.head.appendChild(sc); } catch (x) {}
  function sent() { try { return LS.json('rl_conv', []) || []; } catch (x) { return []; } }
  function report(x) {
    if (!x || !x.paid || !x.ref) return;
    var done = sent(); if (done.indexOf(String(x.ref)) >= 0) return;
    var v = Number(x.price);
    gtag('event', 'conversion', { send_to: SEND, value: v > 0 ? v : 1, currency: 'EUR', transaction_id: String(x.ref) });
    done.push(String(x.ref)); try { LS.set('rl_conv', JSON.stringify(done.slice(-60))); } catch (y) {}
  }
  var _dr = drawRide;
  drawRide = function (x) { var r = _dr.apply(this, arguments); try { report(x); } catch (y) {} return r; };
})();
'''
s = s[:end] + JS + s[end:]
io.open(f, 'w', encoding='utf-8').write(s)
print('ok adsConv v1', len(s))
