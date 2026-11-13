/* ---------- rlTeam13 (13 nov. 2026, demande de Yassine) ----------
 * Entreprises déjà saisies : enregistrées dans la feuille « Entreprises » (raison sociale, SIRET, TVA, adresse de facturation)
 * pour ne pas les retaper. Remplie à chaque course créée ou modifiée avec « Client : Entreprise ».
 *
 * Branchements dans Code.gs :
 * - api            : case 'companies': return { companies: listCompanies_() };
 * - createBooking_ : try { coSave_(nb, me); } catch (e) {}   (après syncClients_)
 * - saveBooking_   : try { coSave_(p.fields, me); } catch (e) {}   (après coNorm_) */
var SH_CO = 'Entreprises', CO_HEAD = ['Raison sociale', 'SIRET', 'N° TVA intracom.', 'Adresse de facturation', 'Mise à jour', 'Par'];
function coSheet_() {
  var ss = ss_(), sh = ss.getSheetByName(SH_CO);
  if (!sh) {
    sh = ss.insertSheet(SH_CO); sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, CO_HEAD.length).setValues([CO_HEAD]);
    try { styleHead_(sh.getRange(1, 1, 1, CO_HEAD.length)); } catch (e) {}
  }
  return sh;
}
function coKey_(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function listCompanies_() {
  var sh = coSheet_(), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, 5).getDisplayValues().map(function (r) { return { name: r[0], siret: r[1], vat: r[2], addr: r[3], at: r[4] }; })
    .filter(function (c) { return c.name; });
}
function coSave_(f, me) {
  if (!f || f.ctype !== 'Entreprise' || !String(f.coName || '').trim()) return;
  var name = String(f.coName).trim(), k = coKey_(name), sir = String(f.siret || '').replace(/\D/g, ''), sh = coSheet_(), n = sh.getLastRow() - 1, row = 0;
  if (n > 0) {
    var v = sh.getRange(2, 1, n, 2).getDisplayValues();
    for (var i = 0; i < n; i++) if (coKey_(v[i][0]) === k || (sir && String(v[i][1]).replace(/\D/g, '') === sir)) { row = i + 2; break; }
  }
  var vals = [name, String(f.siret || ''), String(f.vatNo || ''), String(f.billAddr || ''), now_(), String(me || '')];
  if (row) {
    var old = sh.getRange(row, 1, 1, 4).getDisplayValues()[0];
    for (var j = 1; j < 4; j++) if (!vals[j]) vals[j] = old[j];
    sh.getRange(row, 1, 1, 6).setValues([vals.map(cell_)]);
  } else sh.appendRow(vals.map(cell_));
}
