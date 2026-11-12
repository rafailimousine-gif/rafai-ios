/* ---------- rlSup v1 (12 nov. 2026, demande de Yassine) : fiches fournisseurs de l'Espace équipe ----------
 * Feuille « Fournisseurs » : créée au premier appel, remplie avec les affiliés GNet (76) et les sociétés
 * qui nous ont écrit avec leurs coordonnées (Formula Group, HILUX, ICON Global, Global VIP ; Limos4 complété).
 * Appels : suppliers (liste), saveSupplier (ajout / modification), deleteSupplier (suppression de la fiche). */
var SUP_SH = 'Fournisseurs';
var SUP_HEAD = ['ID', 'Société', 'Prénom', 'Nom', 'E-mail', 'Téléphone', 'Ville', 'Pays', 'Source', 'GNet ID', 'Services', 'Notes', 'Site', 'Ajouté le'];
var SUP_KEYS = ['id', 'co', 'fn', 'ln', 'email', 'tel', 'city', 'country', 'src', 'gnet', 'svc', 'notes', 'site', 'at'];
var SUP_SEED = []; /* rempli au moment de la mise en ligne (coordonnées des fournisseurs : pas gardées dans le dépôt) */
function supNow_() { return Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM/yyyy HH:mm'); }
function supSheet_() {
  var s = ss_(), sh = s.getSheetByName(SUP_SH);
  if (!sh) {
    sh = s.insertSheet(SUP_SH);
    sh.getRange(1, 1, 1, SUP_HEAD.length).setValues([SUP_HEAD]);
    styleHead_(sh.getRange(1, 1, 1, SUP_HEAD.length));
    sh.setFrozenRows(1);
    var at = supNow_();
    var rows = SUP_SEED.map(function (r, i) { return ['F' + ('000' + (i + 1)).slice(-3)].concat(r, [at]); });
    if (rows.length) sh.getRange(2, 1, rows.length, SUP_HEAD.length).setNumberFormat('@').setValues(rows);
  }
  return sh;
}
function listSuppliers_() {
  var sh = supSheet_(), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, SUP_HEAD.length).getDisplayValues().map(function (r) {
    var o = {}; SUP_KEYS.forEach(function (k, i) { o[k] = r[i]; }); return o;
  }).filter(function (o) { return o.id; });
}
function supRow_(sh, id) {
  var n = sh.getLastRow() - 1;
  if (!id || n < 1) return -1;
  var ids = sh.getRange(2, 1, n, 1).getDisplayValues();
  for (var i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return -1;
}
function supNewId_(sh) {
  var n = sh.getLastRow() - 1, max = 0;
  if (n > 0) sh.getRange(2, 1, n, 1).getDisplayValues().forEach(function (r) { var m = /^F(\d+)$/.exec(r[0]); if (m) max = Math.max(max, +m[1]); });
  return 'F' + ('000' + (max + 1)).slice(-3);
}
function saveSupplier_(p, me) {
  var x = (p && p.supplier) || {}, sh = supSheet_(), id = String(x.id || ''), row = supRow_(sh, id);
  if (id && row < 0) throw new Error('Fournisseur introuvable');
  if (!String(x.co || '').trim() && !String(x.ln || '').trim()) throw new Error('Indiquez la société ou le nom');
  var cur = row > 0 ? sh.getRange(row, 1, 1, SUP_HEAD.length).getDisplayValues()[0] : null;
  if (!cur) { id = supNewId_(sh); row = sh.getLastRow() + 1; }
  var vals = SUP_KEYS.map(function (k, i) {
    if (k === 'id') return id;
    if (k === 'at') return cur ? cur[i] : supNow_();
    if (k === 'src' && x.src == null) return cur ? cur[i] : 'Ajouté à la main';
    var v = x[k] == null ? (cur ? cur[i] : '') : x[k];
    return String(v).replace(/^[=+@-]+(?=\D)/, '').trim().slice(0, 2000);
  });
  sh.getRange(row, 1, 1, SUP_HEAD.length).setNumberFormat('@').setValues([vals]);
  log_('', cur ? 'Fournisseur modifié' : 'Fournisseur ajouté', vals[1] || [vals[2], vals[3]].join(' '), me);
  return { suppliers: listSuppliers_(), id: id };
}
function deleteSupplier_(p, me) {
  var sh = supSheet_(), id = String((p && p.id) || ''), row = supRow_(sh, id);
  if (row < 0) throw new Error('Fournisseur introuvable');
  var r = sh.getRange(row, 1, 1, SUP_HEAD.length).getDisplayValues()[0];
  sh.deleteRow(row);
  log_('', 'Fournisseur supprimé', r[1] || [r[2], r[3]].join(' '), me);
  return { suppliers: listSuppliers_() };
}
