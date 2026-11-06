/* ---------- demande de modification d'une course confirmée : l'équipe accepte ou refuse ----------
   Copie de ce qui a été ajouté dans Code.gs (projet « Espace équipe Rafai Limousine »).
   cliEdit_ garde la demande dans CLI_MOD_<réf> (nouvelles valeurs comprises). Rien n'est changé tant que
   l'équipe n'a pas décidé. Accepter applique les changements ; refuser les abandonne. Le client est prévenu.

   Autres branchements dans Code.gs :
   - cliEdit_ : JSON.stringify({ at, ch, nf, un, promo, route, routeUrl }) au lieu de { at, ch }
   - api() : case 'modDecide'
   - api('bookings') et init_() : withMods_(...)
   - clean_() : ajoute modReq si une demande est en attente
   - APP_HTML : tableau des courses, menu latéral, apparence claire ou sombre, glissement des lignes */
function modRead_(ref, props) {
  var raw = props ? props['CLI_MOD_' + ref] : PropertiesService.getScriptProperties().getProperty('CLI_MOD_' + ref);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}
function modView_(b, m) {
  var rows = (m.ch || []).map(function (k) {
    var a = k === 'notes' ? cliUserNotes_(b.notes) : (k === 'price' && money_(b.priceOk) !== '' ? money_(b.priceOk) : b[k]);
    var z = !m.nf ? null : (k === 'notes' ? m.un : m.nf[k]);
    if (k === 'date') { a = a ? frDate_(a) : a; if (z) z = frDate_(z); }
    if (k === 'price') { a = a !== '' && a != null ? a + ' €' : ''; if (z !== null && z !== '') z = z + ' €'; }
    return { k: k, l: BOOK_COLS[k] || k, a: a == null ? '' : String(a), z: z === null ? null : String(z == null ? '' : z) };
  });
  var paid = null;
  try { var pi = payInfo_(b.ref); paid = pi && pi.paid ? (pi.amount || true) : null; } catch (e) {}
  return { at: m.at || '', rows: rows, full: !!m.nf, paid: paid };
}
function withMods_(list) {
  var props = cliProps_();
  list.forEach(function (o) { var m = modRead_(o.ref, props); if (m) o.modReq = modView_(o, m); });
  return list;
}
function modDecide_(p, me) {
  var b = book_(), bk = getBooking_(b, p.ref), m = modRead_(bk.ref), sent = {}, accept = p.decision === 'accept';
  if (!m) throw new Error('Cette demande n’est plus en attente.');
  var lbl = (m.ch || []).map(function (k) { return BOOK_COLS[k] || k; }).join(', ');
  if (accept) {
    if (!m.nf) throw new Error('Le détail de cette demande est dans le mail : modifiez la course à la main ou refusez.');
    if (bk.status === 'Annulée' || bk.status === 'Terminée') throw new Error('Cette course est ' + bk.status.toLowerCase() + ' : elle ne peut plus être modifiée.');
    var set = { updated: now_() };
    m.ch.forEach(function (k) { if (k !== 'notes') set[k] = m.nf[k]; });
    var sys = String(bk.notes || '').split(' / ').filter(function (g) { return g && cliSysNote_(g) && !/^Code /.test(g); });
    set.notes = [m.un].concat(sys, [m.promo]).filter(Boolean).join(' / ');
    if (set.date !== undefined || set.time !== undefined) { set.trkWatch = ''; set.trkAlert = ''; }
    set.route = m.route || '';
    set.routeUrl = m.routeUrl || '';
    if (set.price !== undefined && p.priceOk !== undefined) {
      var po = String(p.priceOk).replace(',', '.').replace(/[^\d.]/g, '');
      if (po !== '') set.priceOk = Math.round(Number(po) * 100) / 100;
    }
    setCells_(b, bk._row, set);
  }
  PropertiesService.getScriptProperties().deleteProperty('CLI_MOD_' + bk.ref);
  var nb = getBooking_(b, bk.ref);
  log_(bk.ref, accept ? 'Modification acceptée' : 'Modification refusée', lbl, me);
  if (accept && nb.driverEmail && p.resendDriver && nb.status !== 'Annulée') {
    try {
      var drv = driverById_(bk.driverId);
      if (drv) { sendMission_(nb, drvFor_(nb, drv), '', 'update'); sent.driverUpdate = true; log_(bk.ref, 'E-mail chauffeur', 'Mise à jour envoyée à ' + nb.driver, me); }
    } catch (e) { sent.driverError = true; }
  }
  try { sent.client = cliNotice_(nb, accept ? 'modok' : 'modno'); } catch (e) { sent.client = false; }
  return { booking: clean_(nb), sent: sent };
}
/* E-mail et notification au client après la décision de l'équipe (4 langues) */
CLI_NOTICE.fr.modok = { s: 'Modification acceptée – {ref}', h: 'Votre modification est acceptée', p: 'Votre course a bien été modifiée. Elle est maintenant prévue le {date}.', more: CLI_NOTICE.fr.cxok.more, btn: CLI_NOTICE.fr.cxok.btn, push: ['Modification acceptée', 'Votre course est prévue le {date}.'] };
CLI_NOTICE.fr.modno = { s: 'Modification non retenue – {ref}', h: 'Votre modification n’a pas pu être acceptée', p: 'Nous ne pouvons pas appliquer la modification demandée. Votre course reste prévue le {date}, sans changement.', more: CLI_NOTICE.fr.cxok.more, btn: CLI_NOTICE.fr.cxok.btn, push: ['Modification non retenue', 'Votre course reste prévue le {date}.'] };
CLI_NOTICE.en.modok = { s: 'Change accepted – {ref}', h: 'Your change has been accepted', p: 'Your ride has been updated. It is now scheduled on {date}.', more: CLI_NOTICE.en.cxok.more, btn: CLI_NOTICE.en.cxok.btn, push: ['Change accepted', 'Your ride is scheduled on {date}.'] };
CLI_NOTICE.en.modno = { s: 'Change not accepted – {ref}', h: 'We could not accept your change', p: 'We are unable to apply the change you requested. Your ride remains scheduled on {date}, unchanged.', more: CLI_NOTICE.en.cxok.more, btn: CLI_NOTICE.en.cxok.btn, push: ['Change not accepted', 'Your ride remains scheduled on {date}.'] };
CLI_NOTICE.ar.modok = { s: 'تم قبول التعديل – {ref}', h: 'تم قبول التعديل الذي طلبته', p: 'تم تعديل رحلتك. موعدها الآن {date}.', more: CLI_NOTICE.ar.cxok.more, btn: CLI_NOTICE.ar.cxok.btn, push: ['تم قبول التعديل', 'موعد رحلتك {date}.'] };
CLI_NOTICE.ar.modno = { s: 'تعذّر قبول التعديل – {ref}', h: 'تعذّر قبول التعديل الذي طلبته', p: 'لا يمكننا تطبيق التعديل المطلوب. تبقى رحلتك كما هي في {date}.', more: CLI_NOTICE.ar.cxok.more, btn: CLI_NOTICE.ar.cxok.btn, push: ['تعذّر قبول التعديل', 'تبقى رحلتك في {date}.'] };
CLI_NOTICE.zh.modok = { s: '修改已接受 – {ref}', h: '您的修改已被接受', p: '您的行程已更新，现在安排在 {date}。', more: CLI_NOTICE.zh.cxok.more, btn: CLI_NOTICE.zh.cxok.btn, push: ['修改已接受', '您的行程安排在 {date}。'] };
CLI_NOTICE.zh.modno = { s: '修改未被接受 – {ref}', h: '我们无法接受您的修改', p: '我们无法执行您请求的修改。您的行程保持不变，时间仍为 {date}。', more: CLI_NOTICE.zh.cxok.more, btn: CLI_NOTICE.zh.cxok.btn, push: ['修改未被接受', '您的行程仍安排在 {date}。'] };
