/* ---------- rlFt v1 · onglet « Fast Track VIP » de l'espace équipe ----------
   Copie du bloc ajouté à la fin du script de APP_HTML (Code.gs, projet « Espace équipe Rafai Limousine ») par apply-ft.js.
   Les demandes viennent de la page de réservation (option Fast Track VIP, 240 €), gardées côté serveur dans FT_<réf>.
   Pour chaque demande : « Envoyer à Global VIP » (e-mail avec la mission), puis nom et numéro de l'agent,
   qui s'affichent dans la réservation du client. */
var FTI = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg>';
var FT = { f: 'todo', list: null, t: 0, busy: false };
function ftCss() {
  if (document.getElementById('ftCss')) return;
  var s = document.createElement('style'); s.id = 'ftCss';
  s.textContent =
    '.ftc{border:1px solid var(--line);border-radius:16px;background:#fff;padding:14px 16px;margin:0 0 12px}' +
    '.ftc.new{border-color:#C9A063;box-shadow:0 0 0 3px rgba(201,160,99,.15)}' +
    '.fth{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:space-between}' +
    '.fth b{font-size:15px}' +
    '.ftst{font-size:11.5px;font-weight:800;letter-spacing:.04em;padding:3px 9px;border-radius:999px;background:#F2EFE8}' +
    '.ftst.new{background:#C9A063;color:#111}.ftst.sent{background:#E8F0FB;color:#1C4E8A}.ftst.agent{background:#E9F5EE;color:#1E5B38}.ftst.cx{background:#FDECEA;color:#9F1D12}' +
    '.ftg{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px 14px;margin:10px 0;font-size:13px}' +
    '.ftg div span{display:block;font-size:11px;opacity:.6;text-transform:uppercase;letter-spacing:.06em}' +
    '.ftm{font-size:13px;background:var(--paper);border-radius:10px;padding:8px 10px;margin:0 0 10px}' +
    '.fta{display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
    '.fta input[type=text],.fta input[type=tel]{flex:1;min-width:140px;padding:9px 10px;border:1px solid var(--line);border-radius:10px;font:inherit;font-size:13px}' +
    '.fta label{font-size:12.5px;display:flex;align-items:center;gap:6px}' +
    '.ftn{font-size:12px;opacity:.65;margin-top:6px}' +
    '.ftb:not(:empty){display:inline-block;min-width:17px;padding:0 5px;margin-left:5px;border-radius:999px;background:#C9A063;color:#111;font-size:11px;font-weight:800;line-height:17px;text-align:center}' +
    '.ftnew{font-size:9.5px;font-weight:800;letter-spacing:.06em;background:#C9A063;color:#111;border-radius:6px;padding:1px 5px;margin-left:6px;vertical-align:2px}';
  document.head.appendChild(s);
}
function ftBk(ref) { var l = S.bookings || []; for (var i = 0; i < l.length; i++) if (l[i].ref === ref) return l[i]; return null; }
function ftKind(o) { return o.k === 'dep' ? 'Départ' : 'Arrivée'; }
function ftState(o, b) { if (b && b.status === 'Annulée') return 'cx'; return o.agent && o.agent.name ? 'agent' : (o.sentAt ? 'sent' : 'new'); }
function ftBadge() {
  var n = (FT.list || []).filter(function (o) { return ftState(o, ftBk(o.ref)) === 'new'; }).length;
  ['ftB1', 'ftB2'].forEach(function (id) { var e = document.getElementById(id); if (e) e.textContent = n ? String(n) : ''; });
}
function ftLoad(force) {
  if (FT.busy || (!force && FT.list && Date.now() - FT.t < 60000)) return Promise.resolve();
  FT.busy = true;
  return call('ftList', {}).then(function (r) { FT.busy = false; FT.list = (r && r.ft) || []; FT.t = Date.now(); ftBadge(); })
    .catch(function () { FT.busy = false; });
}
function ftNav() {
  ftCss();
  var t = document.getElementById('tabs');
  if (t && !t.querySelector('[data-v="ft"]')) {
    var b = document.createElement('button'); b.dataset.v = 'ft'; b.type = 'button';
    b.innerHTML = FTI + 'Fast Track VIP<span class="ftnew">NOUVEAU</span><span class="ftb" id="ftB1"></span>';
    var c1 = t.querySelector('[data-v="gnet"]') || t.querySelector('[data-v="courses"]');
    t.insertBefore(b, c1 ? c1.nextSibling : t.firstChild);
    b.addEventListener('click', function () { go('ft'); });
  }
  var n = document.getElementById('bnav');
  if (n && n.children.length && !n.querySelector('[data-v="ft"]')) {
    var c = document.createElement('button'); c.dataset.v = 'ft'; c.type = 'button';
    c.innerHTML = FTI + 'Fast Track<span class="ftb" id="ftB2"></span>';
    var c2 = n.querySelector('[data-v="gnet"]') || n.querySelector('[data-v="courses"]');
    n.insertBefore(c, c2 ? c2.nextSibling : n.firstChild);
    c.addEventListener('click', function () { go('ft'); });
  }
  if (S.view === 'ft') $$('#tabs button,#bnav button').forEach(function (x) { x.classList.toggle('on', x.dataset.v === 'ft'); });
  ftLoad(false);
  ftBadge();
}
function ftCard(o) {
  var b = ftBk(o.ref), st = ftState(o, b), lbl = { new: 'À envoyer', sent: 'Envoyée à Global VIP', agent: 'Agent confirmé', cx: 'Course annulée' }[st];
  var day = b ? (b.date || '') + ' · ' + (b.time || '') : '';
  try { if (b && b.date) day = frDate(b.date) + ' · ' + (b.time || ''); } catch (e) {}
  var cli = b ? ((b.fname || '') + ' ' + (b.lname || '')).trim() : '';
  var place = b ? (o.k === 'dep' ? b.to : b.from) : '';
  var sent = o.sentAt ? new Date(o.sentAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
  return '<div class="ftc' + (st === 'new' ? ' new' : '') + '" data-ft="' + esc(o.ref) + '">' +
    '<div class="fth"><b>✦ ' + esc(ftKind(o)) + ' · ' + esc(o.ref) + '</b><span class="ftst ' + st + '">' + esc(lbl) + '</span></div>' +
    '<div class="ftg">' +
      '<div><span>Date</span>' + esc(day || '—') + '</div>' +
      '<div><span>Client</span>' + esc(cli || '—') + '</div>' +
      '<div><span>Aéroport</span>' + esc(place || '—') + '</div>' +
      '<div><span>Vol</span>' + esc(o.flight || (b && b.flight) || 'à confirmer') + '</div>' +
      '<div><span>Passagers · bagages</span>' + esc(String(o.pax || '') + ' · ' + String(o.bags == null ? '' : o.bags)) + '</div>' +
      '<div><span>Pancarte</span>' + esc(o.sign || '—') + '</div>' +
      '<div><span>Langue</span>' + esc(o.lang || 'Français') + '</div>' +
      '<div><span>Chauffeur</span>' + esc((b && b.driver) || 'non assigné') + '</div>' +
    '</div>' +
    (o.msg ? '<div class="ftm">💬 ' + esc(o.msg) + '</div>' : '') +
    (st === 'cx' ? '' :
      '<div class="fta">' +
        '<button class="btn' + (st === 'new' ? ' gold' : '') + '" type="button" data-fts="' + esc(o.ref) + '">' + (o.sentAt ? 'Renvoyer à Global VIP' : 'Envoyer à Global VIP') + '</button>' +
        (b ? '<button class="btn" type="button" data-fto="' + esc(o.ref) + '">Ouvrir la course</button>' : '') +
      '</div>' +
      '<div class="fta" style="margin-top:8px">' +
        '<input type="text" placeholder="Prénom de l’agent" data-ftn="' + esc(o.ref) + '" value="' + esc((o.agent && o.agent.name) || '') + '">' +
        '<input type="tel" placeholder="Téléphone de l’agent" data-ftt="' + esc(o.ref) + '" value="' + esc((o.agent && o.agent.tel) || '') + '">' +
        '<label><input type="checkbox" data-ftm="' + esc(o.ref) + '"' + (o.agent && o.agent.name ? '' : ' checked') + '> Prévenir le client par e-mail</label>' +
        '<button class="btn dark" type="button" data-fta="' + esc(o.ref) + '">Enregistrer l’agent</button>' +
      '</div>') +
    '<div class="ftn">' + (sent ? 'Envoyée le ' + esc(sent) + '. ' : '') + (o.agent && o.agent.name ? 'Le client voit son agent dans « Mes courses ». ' : '') + 'Option facturée ' + '240 € au client.</div>' +
  '</div>';
}
function renderFt() {
  ftCss();
  var all = FT.list || [], L = { todo: [], sent: [], ok: [], cx: [] };
  all.forEach(function (o) { var st = ftState(o, ftBk(o.ref)); (st === 'new' ? L.todo : st === 'sent' ? L.sent : st === 'agent' ? L.ok : L.cx).push(o); });
  if (!L[FT.f]) FT.f = 'todo';
  var kp = [['todo', 'À envoyer'], ['sent', 'Envoyées'], ['ok', 'Agent confirmé'], ['cx', 'Annulées']];
  var h = '<div class="head"><div><div class="eyb">Partenaire · Global VIP Exclusive Services</div><h1>Fast Track VIP <span class="ftnew" style="font-size:11px">NOUVEAU</span></h1><p>Les demandes d’accueil VIP à l’aéroport faites par vos clients</p></div></div>' +
    '<div class="kpis">' + kp.map(function (k) {
      return '<button class="kpi' + (k[0] === 'todo' && L.todo.length ? ' alert' : '') + (FT.f === k[0] ? ' on' : '') + '" data-ftf="' + k[0] + '"><b>' + L[k[0]].length + '</b><span>' + k[1] + '</span></button>';
    }).join('') + '</div>' +
    '<p class="gnh" style="font-size:12.5px;opacity:.7;margin:0 0 12px">1. Envoyez la demande à Global VIP. 2. Quand ils répondent, notez le prénom et le numéro de l’agent : le client les voit dans sa réservation.</p>' +
    '<div id="ftL"></div>';
  $('#app').innerHTML = h;
  $$('[data-ftf]').forEach(function (b) { b.addEventListener('click', function () { FT.f = b.dataset.ftf; renderFt(); }); });
  var el = $('#ftL'), V = L[FT.f];
  if (FT.list === null) { el.innerHTML = '<div class="empty"><b>Chargement…</b></div>'; ftLoad(true).then(function () { if (S.view === 'ft') renderFt(); }); return; }
  if (!V.length) {
    el.innerHTML = '<div class="empty"><b>' + (all.length ? 'Rien dans cette liste' : 'Aucune demande Fast Track VIP pour l’instant') + '</b>' +
      (all.length ? 'Choisissez une autre case ci-dessus.' : 'Dès qu’un client ajoute le Fast Track VIP à sa réservation, la demande arrive ici.') + '</div>';
    ftBadge(); return;
  }
  el.innerHTML = V.map(ftCard).join('');
  $$('[data-fts]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.dataset.ok !== '1') { btn.dataset.ok = '1'; btn.dataset.l0 = btn.innerHTML; btn.innerHTML = 'Confirmer l’envoi à Global VIP ?'; setTimeout(function () { if (btn.dataset.ok === '1' && !btn.classList.contains('busy')) { btn.dataset.ok = ''; btn.innerHTML = btn.dataset.l0; } }, 5000); return; }
      btn.dataset.ok = ''; busy(btn, true);
      call('ftSend', { ref: btn.dataset.fts }).then(function (r) { busy(btn, false); ftSet(r && r.item); toast('Demande envoyée à Global VIP'); renderFt(); })
        .catch(function (e) { busy(btn, false); toast(String(e), true); });
    });
  });
  $$('[data-fta]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var ref = btn.dataset.fta, nm = $('[data-ftn="' + ref + '"]').value.trim(), tl = $('[data-ftt="' + ref + '"]').value.trim(), mm = $('[data-ftm="' + ref + '"]').checked;
      busy(btn, true);
      call('ftAgent', { ref: ref, name: nm, tel: tl, notify: mm && !!nm }).then(function (r) { busy(btn, false); ftSet(r && r.item); toast(nm ? (r && r.mailed ? 'Agent enregistré, client prévenu' : 'Agent enregistré') : 'Agent retiré'); renderFt(); })
        .catch(function (e) { busy(btn, false); toast(String(e), true); });
    });
  });
  $$('[data-fto]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var ref = btn.dataset.fto, row = document.querySelector('[data-ref="' + ref + '"]');
      if (row) { row.click(); return; }
      go('courses'); setTimeout(function () { var r2 = document.querySelector('[data-ref="' + ref + '"]'); if (r2) r2.click(); }, 400);
    });
  });
  ftBadge();
}
function ftSet(item) {
  if (!item || !item.ref) return;
  var l = FT.list || [], i;
  for (i = 0; i < l.length; i++) if (l[i].ref === item.ref) { l[i] = item; return; }
  l.unshift(item); FT.list = l;
}
(function () {
  var _render = render;
  render = function () { if (S.view === 'ft') { try { navIcons(); updateTitle(); } catch (e) {} return renderFt(); } return _render.apply(this, arguments); };
  setTimeout(ftNav, 400); setInterval(ftNav, 3000);
})();
