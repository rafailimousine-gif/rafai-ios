# Page de réservation (et appli client) : quand on actualise, on reste sur l'onglet ouvert (Mes courses, Compte)
# au lieu de revenir sur « Réserver ». Placé à la fin du script principal (accès à tab, auth…).
import io, os, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
MARK = 'keepTab v1'
if MARK in s:
    print('deja modifie'); sys.exit(0)
q = s.find('var Q = {')
if q < 0:
    print('ARRET Q'); sys.exit(1)
e = s.find('</script>', q)
end = s.rfind('})();', q, e)
if e < 0 or end < 0:
    print('ARRET fin script'); sys.exit(1)
JS = r'''/* ---------- keepTab v1 : garder l'onglet ouvert (Mes courses, Compte) quand on actualise la page ---------- */
(function keepTab() {
  var SK = 'rl_tab', _t = tab;
  tab = function (n) { var r = _t.apply(this, arguments); try { sessionStorage.setItem(SK, n); } catch (x) {} return r; };
  var sv = null, rsv = false, A = null;
  try { sv = sessionStorage.getItem(SK); rsv = !!sessionStorage.getItem('rl_rsv'); } catch (x) {}
  try { A = auth(); } catch (x) {}
  if ((sv === 'rides' || sv === 'acc') && A && !rsv && !/ride=|rsv=/.test(location.hash)) { try { tab(sv); } catch (x) {} }
})();
'''
s = s[:end] + JS + s[end:]
io.open(f, 'w', encoding='utf-8').write(s)
print('ok onglet', len(s))
