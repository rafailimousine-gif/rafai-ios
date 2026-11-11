# Page de réservation : code promo -10 % première course (rlPromo v1, 11 nov. 2026, demande de Yassine).
# - message du code : pourcentage renvoyé par le serveur ({p}) au lieu de « -30 % » écrit en dur ; « déjà utilisé » ; « non valable »
# - lien « Réserver avec -10 % » de l'e-mail / du site (?promo=RL10-XXXXX) : champ « Code promo » ouvert et rempli
#   (gardé pour l'onglet en cas de rechargement, jamais écrasé par un brouillon sans code)
import io, os, sys
H = os.path.expanduser('~')
f = sys.argv[1] if len(sys.argv) > 1 else os.path.join(H, 'booking/public/index.html')
s = io.open(f, encoding='utf-8').read()
if 'rlPromo v1' in s:
    print('deja rlPromo v1'); sys.exit(0)
R = [
    ("promoOk: 'Code {c} appliqué : -30 %'", "promoOk: 'Code {c} appliqué : -{p} %'"),
    ("promoOk: 'Code {c} applied: -30%'", "promoOk: 'Code {c} applied: -{p}%'"),
    ("promoOk: 'تم تطبيق الرمز {c}: خصم 30%'", "promoOk: 'تم تطبيق الرمز {c}: خصم {p}%'"),
    ("promoOk: '已使用优惠码 {c}：减 30%'", "promoOk: '已使用优惠码 {c}：减 {p}%'"),
    ("promoBad: 'Code {c} non valable pour cette date.'", "promoBad: 'Code {c} non valable.', promoUsed: 'Code {c} déjà utilisé.'"),
    ("promoBad: 'Code {c} is not valid for this date.'", "promoBad: 'Code {c} is not valid.', promoUsed: 'Code {c} has already been used.'"),
    ("promoBad: 'الرمز {c} غير صالح لهذا التاريخ.'", "promoBad: 'الرمز {c} غير صالح.', promoUsed: 'تم استخدام الرمز {c} من قبل.'"),
    ("promoBad: '优惠码 {c} 不适用于该日期。'", "promoBad: '优惠码 {c} 无效。', promoUsed: '优惠码 {c} 已被使用。'"),
    ("t(pm.ok ? 'promoOk' : 'promoBad', { c: pm.code })", "t(pm.ok ? 'promoOk' : (pm.why === 'used' ? 'promoUsed' : 'promoBad'), { c: pm.code, p: pm.pct || 30 })"),
    ("$('code').value = x.code || '';", "$('code').value = x.code || rlPromo0() || '';"),
]
for a, b in R:
    n = s.count(a)
    if n != 1:
        print('ARRET ancre (%d) : %s' % (n, a[:60])); sys.exit(1)
    s = s.replace(a, b)
JS = r'''/* rlPromo v1 : lien « Réserver avec -10 % » (?promo=RL10-XXXXX) : champ « Code promo » ouvert et rempli */
function rlPromo0() {
  try {
    var m = /[?&]promo=([A-Za-z0-9-]{3,20})(&|$)/.exec(location.search);
    if (m) { var c = m[1].toUpperCase(); try { sessionStorage.setItem('rl_promo0', c); } catch (e) {} return c; }
    return sessionStorage.getItem('rl_promo0') || '';
  } catch (e) { return ''; }
}
(function () {
  var c = rlPromo0(), i = $('code');
  if (!c || !i) return;
  if (!i.value) i.value = c;
  try { $('promoWrap').classList.remove('hide'); $('promoBtn').classList.add('hide'); } catch (e) {}
})();
'''
E = '\n})();\n</script>\n</body>'
if s.count(E) != 1:
    print('ARRET ancre fin', s.count(E)); sys.exit(1)
s = s.replace(E, '\n' + JS + '})();\n</script>\n</body>')
io.open(f, 'w', encoding='utf-8').write(s)
print('ok rlPromo v1', len(s))
