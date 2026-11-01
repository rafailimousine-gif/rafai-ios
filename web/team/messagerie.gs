/* ---------- Messagerie de l'espace équipe : fils chauffeur ↔ équipe et client ↔ chauffeur au même endroit.
   Fils « course » : l'équipe lit sans toucher au « lu » du client et du chauffeur (sa lecture est gardée à part). ---------- */
function inboxSeen_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('INBOX_SEEN') || '{}') || {}; } catch (e) { return {}; }
}
function inboxSeenSet_(key, at) {
  var m = inboxSeen_(); m[key] = at;
  var ks = Object.keys(m);
  if (ks.length > 300) ks.sort(function (a, b) { return m[a] - m[b]; }).slice(0, ks.length - 300).forEach(function (k) { delete m[k]; });
  try { PropertiesService.getScriptProperties().setProperty('INBOX_SEEN', JSON.stringify(m)); } catch (e) {}
}
/* Supprimer une conversation : elle disparaît de la messagerie de l'équipe (feuille « Messagerie effacée »).
   Les messages restent dans la feuille « Messages » : le chauffeur et le client gardent leur fil ; un nouveau message la fait réapparaître. */
var SH_INBOX_DEL = 'Messagerie effacée';
function inboxDelSheet_() {
  var ss = ss_(), sh = ss.getSheetByName(SH_INBOX_DEL);
  if (!sh) {
    sh = ss.insertSheet(SH_INBOX_DEL);
    sh.getRange(1, 1, 1, 4).setValues([['Conversation', 'Horodatage', 'Supprimée le', 'Par']]);
    try { sh.setFrozenRows(1); sh.hideSheet(); } catch (e) {}
  }
  return sh;
}
function inboxDel_() {
  var c = CacheService.getScriptCache(), hit = c.get('inboxDel1');
  if (hit) { try { return JSON.parse(hit); } catch (e) {} }
  var sh = inboxDelSheet_(), last = sh.getLastRow(), m = {};
  if (last >= 2) sh.getRange(2, 1, last - 1, 2).getValues().forEach(function (r) {
    var k = String(r[0] || ''), at = Number(r[1]) || 0;
    if (k && at > (m[k] || 0)) m[k] = at;
  });
  try { c.put('inboxDel1', JSON.stringify(m), 600); } catch (e) {}
  return m;
}
function inboxDelete_(p, me) {
  var keys = [].concat(p.keys || []).map(String).filter(function (k, i, a) { return /^[drs]:[A-Za-z0-9_.@\-]{1,80}$/.test(k) && a.indexOf(k) === i; }).slice(0, 300);
  if (!keys.length) throw new Error('Aucune conversation à supprimer');
  keys.forEach(function (k) { if (/^d:/.test(k)) { try { teamChatGet_({ id: k.slice(2) }); } catch (e) {} } });
  var now = Date.now(), when = Utilities.formatDate(new Date(now), TZ, 'dd/MM/yyyy HH:mm'), sh = inboxDelSheet_();
  sh.getRange(sh.getLastRow() + 1, 1, keys.length, 4).setValues(keys.map(function (k) { return [k, now, when, me || '']; }));
  CacheService.getScriptCache().remove('inboxDel1');
  log_(keys.length === 1 && /^[rs]:/.test(keys[0]) ? keys[0].slice(2) : '', keys.length > 1 ? 'Messagerie : conversations supprimées' : 'Messagerie : conversation supprimée',
    keys.length > 1 ? keys.length + ' conversations' : keys[0], me);
  return { ok: true, n: keys.length };
}
function inboxList_() {
  var rows = chatRows_(), seen = inboxSeen_(), del = inboxDel_(), conv = {}, names = {};
  try { listDrivers_().forEach(function (d) { names[String(d.id)] = drvName_(d); }); } catch (e) {}
  rows.forEach(function (o) {
    var ride = o.ch === 'client';
    if (o.ch !== 'team' && !ride) return;
    if (ride ? !o.ref : !o.drv) return;
    var key = ride ? 'r:' + o.ref : 'd:' + o.drv, c = conv[key];
    if (o.at <= (del[key] || 0)) return;
    if (!c) c = conv[key] = { key: key, kind: ride ? 'ride' : 'drv', id: o.drv, ref: o.ref, driver: names[o.drv] || '', client: '', unread: 0, n: 0, last: null };
    c.n++;
    if (ride && o.from === 'client' && o.name) c.client = o.name;
    if (!c.driver && o.from === 'driver' && o.name) c.driver = o.name;
    if (ride ? (o.from !== 'team' && o.at > (seen[key] || 0)) : (o.from === 'driver' && !o.read)) c.unread++;
    if (!c.last || o.at >= c.last.at) c.last = { at: o.at, from: o.from, name: o.name, text: o.text.slice(0, 140), alert: !!o.alert };
  });
  var list = Object.keys(conv).map(function (k) { return conv[k]; }).sort(function (a, b) { return b.last.at - a.last.at; }).slice(0, 150);
  var total = 0; list.forEach(function (c) { total += c.unread; });
  return { list: list, total: total, now: Date.now(), sdel: Object.keys(del).filter(function (k) { return /^s:/.test(k); }) };
}
function inboxGet_(p) {
  var key = String(p.key || ''), cut = inboxDel_()[key] || 0;
  if (/^d:/.test(key)) {
    var r = teamChatGet_({ id: key.slice(2) }); r.key = key;
    if (cut) r.msgs = (r.msgs || []).filter(function (m) { return Number(m.at) > cut; });
    return r;
  }
  if (!/^r:/.test(key)) throw new Error('Conversation introuvable');
  var ref = key.slice(2), bk = null;
  try { bk = getBooking_(book_(), ref); } catch (e) { bk = null; }
  var msgs = chatRows_().filter(function (o) { return o.ch === 'client' && o.ref === ref && o.at > cut; }).slice(-150)
    .map(function (o) { return { at: o.at, from: o.from, name: o.name, text: o.text, alert: o.alert, read: o.read }; });
  inboxSeenSet_(key, Date.now());
  return {
    key: key, msgs: msgs, open: bk ? chatOpen_(bk) : false, now: Date.now(),
    ride: bk ? { ref: bk.ref, date: bk.date, time: bk.time, from: bk.from, to: bk.to, status: bk.status, client: ((bk.fname || '') + ' ' + (bk.lname || '')).trim(), driver: bk.driver || '', tel: bk.tel || '' } : null
  };
}
function inboxSend_(p, me) {
  var key = String(p.key || ''), text = chatClean_(p.text, 1000);
  if (!text) throw new Error('Écrivez un message');
  if (/^d:/.test(key)) { teamChatSend_({ id: key.slice(2), text: text }, me); return inboxGet_({ key: key }); }
  if (!/^r:/.test(key)) throw new Error('Conversation introuvable');
  var ref = key.slice(2), bk = null;
  try { bk = getBooking_(book_(), ref); } catch (e) { bk = null; }
  if (!bk || !bk.driverId) throw new Error('Course sans chauffeur : écrivez au client par WhatsApp ou e-mail');
  chatAdd_({ drv: bk.driverId, ref: bk.ref, ch: 'client', from: 'team', name: 'Rafai Limousine', text: text, by: me });
  chatPush_(bk.driverId, 'Rafai Limousine · course ' + bk.ref, text, bk.ref, 'chat', '/chauffeur/');
  try { log_(bk.ref, 'Message dans le fil de la course', text.slice(0, 80), me); } catch (e) {}
  return inboxGet_({ key: key });
}
