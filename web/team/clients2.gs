/* ---------- rlCli2 v1 (12 nov. 2026, demande de Yassine) : fiche client « Supprimer » et « Bloquer » ----------
 * Bloquer = date dans « Bloqué le » (colonne ajoutée à la feuille « Clients ») :
 *   l'appli client et booking.rafai-limousine.com refusent ses nouvelles réservations (cliBook_ → err 'bloque'),
 *   badge « ⛔ Bloqué » dans l'Espace équipe (liste, fiche, course). Débloquer = la date est effacée. Aucun e-mail au client.
 * Supprimer = la ligne de la feuille « Clients » est effacée ; ses courses restent dans la liste des courses.
 *   Pour que la synchronisation automatique (syncClients_) ne recrée pas la fiche à partir de ses anciennes courses,
 *   CLI_DEL_KEYS garde son téléphone / e-mail avec la dernière référence de course connue ; une nouvelle course la recrée. */
function cliRowById_(id) {
  var sh = cliSheet_(), last = sh.getLastRow();
  if (!id || last < 2) return -1;
  var ids = sh.getRange(2, 1, last - 1, 1).getDisplayValues();
  for (var i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return -1;
}
function cliLabel_(c) { return [((c.fname || '') + ' ' + (c.lname || '')).trim(), c.tel || c.email, c.id].filter(Boolean).join(' · '); }
function cliBlocked_(o) {
  var keys = cliKeys_(o || {});
  if (!keys.length) return false;
  return listClients_().some(function (c) { return !!c.blocked && cliKeys_(c).some(function (k) { return keys.indexOf(k) >= 0; }); });
}
function blockClient_(p, me) {
  var id = String(p.id || ''), on = p.on !== false, row = cliRowById_(id);
  if (row < 0) throw new Error('Client introuvable');
  var c = listClients_()[row - 2];
  cliSheet_().getRange(row, CLI_KEYS.indexOf('blocked') + 1).setValue(on ? cell_(now_()) : '');
  log_('', on ? 'Client bloqué' : 'Client débloqué', cliLabel_(c), me);
  return { clients: listClients_() };
}
function cliDelKeys_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('CLI_DEL_KEYS') || '{}') || {}; } catch (e) { return {}; }
}
var CLI_DEL_MAP_ = null;
function cliDelSkip_(o) {
  if (!CLI_DEL_MAP_) CLI_DEL_MAP_ = cliDelKeys_();
  var ref = String(o.ref || '');
  return cliKeys_(o).some(function (k) { return CLI_DEL_MAP_[k] && ref <= CLI_DEL_MAP_[k]; });
}
function deleteClient_(p, me) {
  var id = String(p.id || ''), row = cliRowById_(id);
  if (row < 0) throw new Error('Client introuvable');
  var c = listClients_()[row - 2], keys = cliKeys_(c), top = '';
  try {
    listBookings_(book_()).forEach(function (b) {
      if (b.ref && cliKeys_(b).some(function (k) { return keys.indexOf(k) >= 0; }) && String(b.ref) > top) top = String(b.ref);
    });
  } catch (e) {}
  if (top && keys.length) {
    var del = cliDelKeys_();
    keys.forEach(function (k) { if (!del[k] || del[k] < top) del[k] = top; });
    var ks = Object.keys(del);
    while (JSON.stringify(del).length > 8500 && ks.length) delete del[ks.shift()];
    PropertiesService.getScriptProperties().setProperty('CLI_DEL_KEYS', JSON.stringify(del));
    CLI_DEL_MAP_ = del;
  }
  cliSheet_().deleteRow(row);
  log_('', 'Client supprimé', cliLabel_(c), me);
  return { clients: listClients_() };
}
