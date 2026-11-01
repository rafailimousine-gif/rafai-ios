/* ===================== Entonnoir de réservation : compteur anonyme des étapes =====================
   Le formulaire du site (Google Sites) et la page booking.rafai-limousine.com envoient
   ?app=cfn&s=<étape>&lg=<langue>&src=<site|app|direct|pub>, une seule fois par visite et par étape.
   Aucune donnée personnelle, aucun cookie : seulement l'heure, l'étape, la langue et la source.
   Résultat dans la feuille « Entonnoir » (lignes brutes en A:E, résumé en H:M, recalculé au plus toutes les 10 min). */
var SH_FUNNEL = 'Entonnoir';
var FN_ORDER = [
  ['s_vue', 'Site · formulaire de réservation affiché'],
  ['s_prix', 'Site · prix affichés'],
  ['s_car', 'Site · voiture choisie'],
  ['s_coord', 'Site · étape coordonnées'],
  ['s_go', 'Site · clic « Créer mon compte et confirmer »'],
  ['s_mar', 'Site · demande mariage envoyée'],
  ['s_wa', 'Site · clic WhatsApp'],
  ['s_tel', 'Site · clic Appeler'],
  ['b_open', 'Page résa · arrivée'],
  ['b_gate', 'Page résa · écran de connexion (pas de compte)'],
  ['b_code', 'Page résa · code e-mail demandé'],
  ['b_in', 'Page résa · connecté'],
  ['b_prix', 'Page résa · prix affichés'],
  ['b_car', 'Page résa · voiture choisie'],
  ['b_resa', 'Page résa · réservation envoyée']
];
function funnelSheet_() {
  var ss = ss_(), sh = ss.getSheetByName(SH_FUNNEL);
  if (!sh) {
    sh = ss.insertSheet(SH_FUNNEL);
    sh.getRange(1, 1, 1, 5).setValues([['Horodatage', 'Étape', 'Code', 'Langue', 'Source']]);
    try { sh.setFrozenRows(1); sh.setColumnWidth(2, 320); sh.setColumnWidth(8, 360); } catch (e) {}
  }
  return sh;
}
function cliFunnel_(q) {
  var s = String(q.s || ''), lab = null;
  FN_ORDER.forEach(function (x) { if (x[0] === s) lab = x[1]; });
  if (!lab) return { ok: false, err: 'etape' };
  var lg = /^(fr|en|ar|zh)$/.test(String(q.lg || '')) ? String(q.lg) : '';
  var src = /^(site|app|direct|pub)$/.test(String(q.src || '')) ? String(q.src) : '';
  var c = CacheService.getScriptCache(), key = 'fn1:' + Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyyMMdd');
  var n = Number(c.get(key) || 0);
  if (n >= 5000) return { ok: true };   // garde-fou contre les envois en rafale
  c.put(key, String(n + 1), 21600);
  funnelSheet_().appendRow([new Date(), lab, s, lg, src]);
  if (!c.get('fnSum1')) { c.put('fnSum1', '1', 600); try { funnelSummary_(); } catch (e) {} }
  return { ok: true };
}
function funnelSummary_() {
  var sh = funnelSheet_(), last = sh.getLastRow(), tz = 'Europe/Paris';
  var rows = last >= 2 ? sh.getRange(2, 1, last - 1, 5).getValues() : [];
  var now = new Date(), d0 = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  var d7 = Utilities.formatDate(new Date(now.getTime() - 6 * 864e5), tz, 'yyyy-MM-dd');
  var d30 = Utilities.formatDate(new Date(now.getTime() - 29 * 864e5), tz, 'yyyy-MM-dd');
  var cnt = {};
  FN_ORDER.forEach(function (x) { cnt[x[0]] = [0, 0, 0]; });
  rows.forEach(function (r) {
    var k = String(r[2]); if (!cnt[k] || !(r[0] instanceof Date)) return;
    var d = Utilities.formatDate(r[0], tz, 'yyyy-MM-dd');
    if (d === d0) cnt[k][0]++;
    if (d >= d7) cnt[k][1]++;
    if (d >= d30) cnt[k][2]++;
  });
  function pct(k, base) { var b = cnt[base][2]; return b ? Math.round(cnt[k][2] * 100 / b) + ' %' : ''; }
  var out = [['Étape (une fois par visite)', "Aujourd'hui", '7 jours', '30 jours', '% du départ (30 j)', 'Mis à jour : ' + Utilities.formatDate(now, tz, 'dd/MM HH:mm')]];
  FN_ORDER.forEach(function (x) {
    var base = x[0].charAt(0) === 's' ? 's_vue' : 'b_open';
    out.push([x[1], cnt[x[0]][0], cnt[x[0]][1], cnt[x[0]][2], pct(x[0], base), '']);
  });
  sh.getRange(1, 8, Math.max(sh.getMaxRows(), out.length), 6).clearContent();
  sh.getRange(1, 8, out.length, 6).setValues(out);
  try { sh.getRange(1, 8, 1, 6).setFontWeight('bold'); } catch (e) {}
  return out;
}
/* À lancer depuis l'éditeur pour recalculer le résumé tout de suite */
function rapportEntonnoir() { var o = funnelSummary_(); Logger.log(o.map(function (r) { return r.slice(0, 5).join(' | '); }).join('\n')); }
