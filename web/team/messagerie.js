/* ---------- Messagerie : tous les messages des chauffeurs, des clients et du site au même endroit ---------- */
var MX = { sel: '', list: [], total: 0, sig: '', tsig: '' };
var MXI = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
function mxCss() {
  if (document.getElementById('mxCss')) return;
  var s = document.createElement('style'); s.id = 'mxCss';
  s.textContent =
    '.mx{display:grid;grid-template-columns:minmax(260px,340px) 1fr;gap:14px;align-items:start}' +
    '@media (max-width:760px){.mx{grid-template-columns:1fr}.mx.sel .mxl{display:none}.mx:not(.sel) .mxr{display:none}}' +
    '.mxl{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;max-height:76vh;overflow-y:auto}' +
    '.mxi{display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--line);padding:11px 13px;cursor:pointer;font:inherit;color:inherit}' +
    '.mxi:last-child{border-bottom:0}.mxi:hover{background:var(--paper)}.mxi.on{background:var(--paper);box-shadow:inset 3px 0 0 var(--ink)}' +
    '.mxt{display:flex;justify-content:space-between;gap:8px;font-size:14px;font-weight:800}.mxt small{font-weight:600;opacity:.6;font-size:11.5px;white-space:nowrap}' +
    '.mxs{display:block;font-size:12px;opacity:.65;margin-top:2px}.mxp{margin:4px 0 0;font-size:13px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.mxi.un .mxp{font-weight:800;opacity:1}.mxn{display:inline-block;min-width:18px;padding:1px 6px;border-radius:999px;background:#C0392B;color:#fff;font-size:11px;font-weight:800;text-align:center;margin-left:6px;font-style:normal}' +
    '.mxr{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px}.mxh{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px}' +
    '.mxh h2{margin:0;font-size:17px}.mxh p{margin:3px 0 0;font-size:12.5px;opacity:.7}.mxr .chl{max-height:52vh}.mxf{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center}' +
    '.mxr textarea{width:100%;margin-top:10px;font:inherit;padding:10px 12px;border:1px solid var(--line);border-radius:11px;resize:vertical;min-height:62px;box-sizing:border-box}' +
    '.mxq{white-space:pre-wrap;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:12px;font-size:14px;line-height:1.45}' +
    '.mbadge:not(:empty){display:inline-block;min-width:17px;padding:0 5px;margin-left:5px;border-radius:999px;background:#C0392B;color:#fff;font-size:11px;font-weight:800;line-height:17px;text-align:center}';
  document.head.appendChild(s);
}
function mxNav() {
  var t = document.getElementById('tabs');
  if (t && !t.querySelector('[data-v="msgs"]')) {
    var b = document.createElement('button'); b.dataset.v = 'msgs'; b.type = 'button';
    b.innerHTML = 'Messagerie<span class="mbadge" id="msgB1"></span>';
    t.insertBefore(b, t.querySelector('[data-v="clients"]'));
    b.addEventListener('click', function () { go('msgs'); });
  }
  var n = document.getElementById('bnav');
  if (n && n.children.length && !n.querySelector('[data-v="msgs"]')) {
    var c = document.createElement('button'); c.dataset.v = 'msgs'; c.type = 'button';
    c.innerHTML = MXI + 'Messages<span class="mbadge" id="msgB2"></span>';
    n.insertBefore(c, n.querySelector('[data-v="live"]'));
    c.addEventListener('click', function () { go('msgs'); });
  }
  if (S.view === 'msgs') $$('#tabs button,#bnav button').forEach(function (x) { x.classList.toggle('on', x.dataset.v === 'msgs'); });
  mxBadge();
}
function mxWhen(at) {
  if (!at) return '';
  var d = new Date(at), n = new Date(), hm = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  if (d.toDateString() === n.toDateString()) return hm;
  return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + hm;
}
function mxAt(b) {
  var s = String(b.received || ''), m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\D+(\d{1,2}):(\d{2})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]).getTime();
  var t = Date.parse(s); return isNaN(t) ? 0 : t;
}
function mxSite() {
  return (S.bookings || []).filter(function (b) { return isMsg(b) && !isClosed(b); }).slice(0, 80);
}
function mxBadge() {
  var site = (S.bookings || []).filter(function (b) { return isMsg(b) && b.status === 'À confirmer'; }).length, n = MX.total + site;
  ['msgB1', 'msgB2'].forEach(function (id) { var e = document.getElementById(id); if (e) e.textContent = n ? String(n) : ''; });
}
function mxLoad() {
  return call('inbox', {}).then(function (r) {
    MX.list = (r && r.list) || []; MX.total = (r && r.total) || 0;
    mxBadge(); if (S.view === 'msgs') mxDrawList();
  }).catch(function () {});
}
function mxItems() {
  var a = MX.list.map(function (c) {
    var ride = c.kind === 'ride', l = c.last || {};
    return {
      key: c.key, at: l.at || 0, icon: ride ? '👤' : '🚗', un: c.unread || 0,
      title: ride ? (c.client || 'Client') + ' ↔ ' + (c.driver || 'chauffeur') : (c.driver || 'Chauffeur'),
      sub: ride ? 'Course ' + c.ref + ' · client et chauffeur' : 'Chauffeur · fil avec l’équipe',
      text: (l.from === 'team' ? 'Vous : ' : '') + (l.alert ? '🚨 ' : '') + (l.text || '')
    };
  });
  mxSite().forEach(function (b) {
    a.push({
      key: 's:' + b.ref, at: mxAt(b), icon: '🌐', un: b.status === 'À confirmer' ? 1 : 0,
      title: ((b.fname || '') + ' ' + (b.lname || '')).trim() || 'Visiteur du site',
      sub: 'Message du site ou de Youri · ' + b.ref, text: String(b.notes || b.from || '').replace(/\s+/g, ' ').slice(0, 140)
    });
  });
  return a.sort(function (x, y) { return y.at - x.at; });
}
function mxDrawList() {
  var L = document.getElementById('mxL'); if (!L) return;
  var it = mxItems(), sig = JSON.stringify(it) + MX.sel;
  if (sig === MX.sig) return; MX.sig = sig;
  L.innerHTML = it.length ? it.map(function (i) {
    return '<button type="button" class="mxi' + (i.un ? ' un' : '') + (MX.sel === i.key ? ' on' : '') + '" data-k="' + esc(i.key) + '">' +
      '<span class="mxt"><span>' + i.icon + ' ' + esc(i.title) + (i.un ? '<i class="mxn">' + i.un + '</i>' : '') + '</span><small>' + mxWhen(i.at) + '</small></span>' +
      '<span class="mxs">' + esc(i.sub) + '</span><p class="mxp">' + esc(i.text) + '</p></button>';
  }).join('') : '<p class="hint" style="padding:12px;margin:0">Aucun message pour l’instant.</p>';
  Array.prototype.forEach.call(L.querySelectorAll('.mxi'), function (b) { b.addEventListener('click', function () { mxOpen(b.dataset.k); }); });
}
function renderMsgs() {
  mxCss(); try { chatCss(); } catch (e) {}
  $('#app').innerHTML = '<div class="head"><div><h1>Messagerie</h1><p>Chauffeurs, clients et messages du site : tout arrive ici</p></div></div>' +
    '<div class="mx' + (MX.sel ? ' sel' : '') + '" id="mx"><div class="mxl" id="mxL"><p class="hint" style="padding:12px;margin:0">Chargement…</p></div>' +
    '<div class="mxr" id="mxR"><p class="hint" style="margin:0">Choisissez une conversation.</p></div></div>';
  MX.sig = ''; mxNav(); mxDrawList(); mxLoad();
  if (MX.sel) mxOpen(MX.sel);
}
function mxWho(m) {
  if (m.from === 'team') return 'Rafai Limousine';
  if (m.from === 'driver') return 'Chauffeur' + (m.name ? ' · ' + m.name : '');
  if (m.from === 'client') return 'Client' + (m.name ? ' · ' + m.name : '');
  return m.name || '';
}
function mxMsgs(l) {
  return l.length ? l.map(function (m) {
    return '<div class="chm ' + (m.from === 'team' ? 'me' : 'th') + (m.alert ? ' al' : '') + '">' + esc(m.text) + '<small>' + esc(mxWho(m)) + ' · ' + mxWhen(m.at) + '</small></div>';
  }).join('') : '<p class="hint" style="margin:0">Aucun message pour l’instant.</p>';
}
function mxBack() { return '<button class="btn" type="button" id="mxB">← Conversations</button>'; }
function mxWire(key) {
  var bk = document.getElementById('mxB');
  if (bk) bk.addEventListener('click', function () { MX.sel = ''; var x = document.getElementById('mx'); if (x) x.classList.remove('sel'); MX.sig = ''; mxDrawList(); });
}
function mxOpen(key) {
  MX.sel = key; MX.tsig = '';
  var X = document.getElementById('mx'), R = document.getElementById('mxR'); if (!R) return;
  if (X) X.classList.add('sel');
  MX.sig = ''; mxDrawList();
  if (/^s:/.test(key)) {
    var b = booking(key.slice(2));
    if (!b) { R.innerHTML = '<p class="hint" style="margin:0">Message introuvable.</p>' + mxBack(); mxWire(key); return; }
    var name = ((b.fname || '') + ' ' + (b.lname || '')).trim() || 'Visiteur du site';
    R.innerHTML = '<div class="mxh"><div><h2>🌐 ' + esc(name) + '</h2><p>Message du site ou de Youri · ' + esc(b.ref) + (b.received ? ' · reçu le ' + esc(String(b.received)) : '') + '</p></div></div>' +
      '<div class="mxq">' + esc(String(b.notes || b.from || '(sans texte)')) + '</div>' +
      '<p class="hint">' + (b.tel ? esc(b.tel) + ' · ' : '') + (b.email ? esc(b.email) : '') + '</p>' +
      '<div class="mxf">' + (b.tel ? '<a class="btn primary" target="_blank" href="' + esc(waLink(b.tel, 'Bonjour ' + (b.fname || '') + ', Rafai Limousine suite à votre message : ')) + '">Répondre sur WhatsApp</a>' : '') +
      (b.email ? '<a class="btn" href="mailto:' + esc(b.email) + '?subject=' + encodeURIComponent('Rafai Limousine – votre message') + '">Répondre par e-mail</a>' : '') +
      (b.tel ? '<a class="btn" href="tel:' + esc(b.tel) + '">Appeler</a>' : '') +
      '<button class="btn" type="button" id="mxO">Ouvrir la demande</button>' + mxBack() + '</div>';
    document.getElementById('mxO').addEventListener('click', function () { openBooking(b.ref); });
    mxWire(key); return;
  }
  R.innerHTML = '<p class="hint" style="margin:0">Chargement…</p>';
  call('inboxGet', { key: key }).then(function (r) { if (MX.sel === key) mxDraw(key, r); }).catch(function (e) { R.innerHTML = '<p class="hint" style="margin:0">' + esc(String(e)) + '</p>' + mxBack(); mxWire(key); });
}
function mxDraw(key, r) {
  var R = document.getElementById('mxR'); if (!R) return;
  var ride = /^r:/.test(key), c = null;
  MX.list.forEach(function (x) { if (x.key === key) c = x; });
  var head;
  if (ride) {
    var k = r.ride || {};
    head = '<div><h2>👤 ' + esc(k.client || (c && c.client) || 'Client') + ' ↔ ' + esc(k.driver || (c && c.driver) || 'chauffeur') + '</h2><p>Course ' + esc(key.slice(2)) +
      (k.date ? ' · ' + esc(String(k.date)) + (k.time ? ' ' + esc(String(k.time)) : '') : '') + (k.from ? ' · ' + esc(k.from) + (k.to ? ' → ' + esc(k.to) : '') : '') + (k.status ? ' · ' + esc(k.status) : '') + '</p></div>' +
      '<div class="mxf"><button class="btn" type="button" id="mxO">Ouvrir la course</button>' + (k.tel ? '<a class="btn" target="_blank" href="' + esc(waLink(k.tel, '')) + '">WhatsApp client</a>' : '') + '</div>';
  } else {
    var d = null; try { d = driver(key.slice(2)); } catch (e) {}
    head = '<div><h2>🚗 ' + esc((c && c.driver) || (d && ((d.fname || '') + ' ' + (d.lname || '')).trim()) || 'Chauffeur') + '</h2><p>Fil entre le chauffeur et l’équipe' + (r.push ? '' : ' · notifications non activées sur son téléphone') + '</p></div>' +
      '<div class="mxf"><button class="btn" type="button" id="mxO">Ouvrir la fiche</button>' + (d && d.tel ? '<a class="btn" target="_blank" href="' + esc(waLink(d.tel, '')) + '">WhatsApp</a>' : '') + '</div>';
  }
  R.innerHTML = '<div class="mxh">' + head + '</div><div class="chl" id="mxM">' + mxMsgs(r.msgs || []) + '</div>' +
    '<textarea id="mxT" placeholder="' + (ride ? 'Message visible par le client et par le chauffeur…' : 'Message au chauffeur…') + '"></textarea>' +
    '<div class="mxf"><button class="btn primary" type="button" id="mxS">Envoyer</button>' + mxBack() +
    '<span class="hint" style="margin:0">' + (ride ? 'Le chauffeur reçoit une notification ; le client le voit dans le suivi de sa course.' : 'Le chauffeur reçoit une notification sur son téléphone.') + '</span></div>';
  MX.tsig = JSON.stringify(r.msgs || []);
  var M = document.getElementById('mxM'); M.scrollTop = M.scrollHeight;
  document.getElementById('mxO').addEventListener('click', function () { if (ride) openBooking(key.slice(2)); else openDriver(key.slice(2)); });
  var S2 = document.getElementById('mxS');
  S2.addEventListener('click', function () {
    var T = document.getElementById('mxT'), text = String(T.value || '').trim(); if (!text) return;
    busy(S2, true);
    call('inboxSend', { key: key, text: text }).then(function (r2) { busy(S2, false); T.value = ''; mxDraw(key, r2); mxLoad(); })
      .catch(function (e) { busy(S2, false); toast(String(e), true); });
  });
  mxWire(key); mxLoad();
}
function mxRefresh() {
  var key = MX.sel; if (!key || /^s:/.test(key) || !document.getElementById('mxM')) return;
  call('inboxGet', { key: key }).then(function (r) {
    if (MX.sel !== key) return;
    var sig = JSON.stringify(r.msgs || []); if (sig === MX.tsig) return; MX.tsig = sig;
    var M = document.getElementById('mxM'); if (!M) return;
    M.innerHTML = mxMsgs(r.msgs || []); M.scrollTop = M.scrollHeight;
  }).catch(function () {});
}
(function () {
  var _render = render;
  render = function () { if (S.view === 'msgs') { try { updateTitle(); } catch (e) {} return renderMsgs(); } return _render.apply(this, arguments); };
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('#chatBub');
    if (!b) return;
    e.stopImmediatePropagation(); e.preventDefault();
    MX.sel = b.dataset.id ? 'd:' + b.dataset.id : ''; go('msgs');
  }, true);
  setTimeout(mxNav, 300); setInterval(mxNav, 3000);
  setTimeout(mxLoad, 2500);
  setInterval(function () {
    if (document.visibilityState !== 'visible') return;
    if (S.view === 'msgs') { mxLoad(); mxRefresh(); }
  }, 15000);
  setInterval(function () { if (document.visibilityState === 'visible' && S.view !== 'msgs') mxLoad(); }, 60000);
})();
