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
function inboxList_() {
  var rows = chatRows_(), seen = inboxSeen_(), conv = {}, names = {};
  try { listDrivers_().forEach(function (d) { names[String(d.id)] = drvName_(d); }); } catch (e) {}
  rows.forEach(function (o) {
    var ride = o.ch === 'client';
    if (o.ch !== 'team' && !ride) return;
    if (ride ? !o.ref : !o.drv) return;
    var key = ride ? 'r:' + o.ref : 'd:' + o.drv, c = conv[key];
    if (!c) c = conv[key] = { key: key, kind: ride ? 'ride' : 'drv', id: o.drv, ref: o.ref, driver: names[o.drv] || '', client: '', unread: 0, n: 0, last: null };
    c.n++;
    if (ride && o.from === 'client' && o.name) c.client = o.name;
    if (!c.driver && o.from === 'driver' && o.name) c.driver = o.name;
    if (ride ? (o.from !== 'team' && o.at > (seen[key] || 0)) : (o.from === 'driver' && !o.read)) c.unread++;
    if (!c.last || o.at >= c.last.at) c.last = { at: o.at, from: o.from, name: o.name, text: o.text.slice(0, 140), alert: !!o.alert };
  });
  var list = Object.keys(conv).map(function (k) { return conv[k]; }).sort(function (a, b) { return b.last.at - a.last.at; }).slice(0, 150);
  var total = 0; list.forEach(function (c) { total += c.unread; });
  return { list: list, total: total, now: Date.now() };
}
function inboxGet_(p) {
  var key = String(p.key || '');
  if (/^d:/.test(key)) { var r = teamChatGet_({ id: key.slice(2) }); r.key = key; return r; }
  if (!/^r:/.test(key)) throw new Error('Conversation introuvable');
  var ref = key.slice(2), bk = null;
  try { bk = getBooking_(book_(), ref); } catch (e) { bk = null; }
  var msgs = chatRows_().filter(function (o) { return o.ch === 'client' && o.ref === ref; }).slice(-150)
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
