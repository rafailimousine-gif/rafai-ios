/* ---------- Onglet GNet : les courses envoyées par les partenaires GNet ----------
   Copie du bloc ajouté à la fin du script de APP_HTML (Code.gs, projet « Espace équipe Rafai Limousine »).
   Les courses GNet sont créées par gnetPoll_ (voir gnet.gs) avec la source « GNet » et le n° GNet dans la note interne.
   Rien de nouveau côté serveur : l'onglet lit S.bookings. */
var GNI = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>';
var GN = { f: 'up' };
var GN_LINKS = [
  ['Réservations GNet', 'https://dashboard.grdd.net/dashboard/reservations'],
  ['Partenaires', 'https://dashboard.grdd.net/dashboard/partners'],
  ['Prospects', 'https://dashboard.grdd.net/dashboard/leads'],
  ['Mon profil GNet', 'https://connect.grdd.net/gnet/rafailimousine/fr']
];
function gnIs(b) { return /^gnet$/i.test(String((b && b.src) || '').trim()); }
function gnRes(b) { var m = String(b.internal || '').match(/r[ée]servation n°\s*(\d{6,})/i); return m ? m[1] : ''; }
function gnKey(b) { return (b.date || '9999-12-31') + ' ' + (b.time || '99:99'); }
function gnCss() {
  if (document.getElementById('gnCss')) return;
  var s = document.createElement('style'); s.id = 'gnCss';
  s.textContent =
    '.gnl{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}' +
    '.gnl a{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:#fff;color:inherit;text-decoration:none;font-size:13px;font-weight:700}' +
    '.gnl a:hover{background:var(--paper)}' +
    '.gnh{font-size:12.5px;opacity:.7;margin:0 0 12px}' +
    '.gnb:not(:empty){display:inline-block;min-width:17px;padding:0 5px;margin-left:5px;border-radius:999px;background:#C0392B;color:#fff;font-size:11px;font-weight:800;line-height:17px;text-align:center}';
  document.head.appendChild(s);
}
function gnBadge() {
  var n = (S.bookings || []).filter(function (b) { return gnIs(b) && b.status === 'À confirmer'; }).length;
  ['gnB1', 'gnB2'].forEach(function (id) { var e = document.getElementById(id); if (e) e.textContent = n ? String(n) : ''; });
}
function gnNav() {
  gnCss();
  var t = document.getElementById('tabs');
  if (t && !t.querySelector('[data-v="gnet"]')) {
    var b = document.createElement('button'); b.dataset.v = 'gnet'; b.type = 'button';
    b.innerHTML = GNI + 'GNet<span class="gnb" id="gnB1"></span>';
    var c1 = t.querySelector('[data-v="courses"]');
    t.insertBefore(b, c1 ? c1.nextSibling : t.firstChild);
    b.addEventListener('click', function () { go('gnet'); });
  }
  var n = document.getElementById('bnav');
  if (n && n.children.length && !n.querySelector('[data-v="gnet"]')) {
    var c = document.createElement('button'); c.dataset.v = 'gnet'; c.type = 'button';
    c.innerHTML = GNI + 'GNet<span class="gnb" id="gnB2"></span>';
    var c2 = n.querySelector('[data-v="courses"]');
    n.insertBefore(c, c2 ? c2.nextSibling : n.firstChild);
    c.addEventListener('click', function () { go('gnet'); });
  }
  if (S.view === 'gnet') $$('#tabs button,#bnav button').forEach(function (x) { x.classList.toggle('on', x.dataset.v === 'gnet'); });
  gnBadge();
  /* les données sont relues régulièrement : on redessine l'onglet seulement si une course GNet a changé */
  var sig = (S.bookings || []).filter(gnIs).map(function (b) { return [b.ref, b.status, b.driver, b.date, b.time, b.priceOk].join('|'); }).join(';');
  if (sig !== GN.sig) { var first = GN.sig === undefined; GN.sig = sig; if (!first && S.view === 'gnet' && !S.swo && !document.querySelector('#sheet.on')) renderGnet(); }
}
function renderGnet() {
  gnCss();
  var all = (S.bookings || []).filter(gnIs), t = today();
  var L = {
    todo: all.filter(function (b) { return b.status === 'À confirmer'; }),
    up: all.filter(function (b) { return isUpcoming(b); }),
    past: all.filter(function (b) { return b.status === 'Terminée' || (b.status !== 'Annulée' && b.date && b.date < t); }),
    cx: all.filter(function (b) { return b.status === 'Annulée'; })
  };
  L.todo.sort(function (a, b) { return gnKey(a) < gnKey(b) ? -1 : 1; });
  L.up.sort(function (a, b) { return gnKey(a) < gnKey(b) ? -1 : 1; });
  L.past.sort(function (a, b) { return gnKey(a) > gnKey(b) ? -1 : 1; });
  L.cx.sort(function (a, b) { return gnKey(a) > gnKey(b) ? -1 : 1; });
  if (!L[GN.f]) GN.f = 'up';
  var kp = [['todo', 'À confirmer'], ['up', 'À venir'], ['past', 'Terminées'], ['cx', 'Annulées']];
  var h = '<div class="head"><div><div class="eyb">Partenaires</div><h1>GNet</h1><p>Les courses envoyées par vos partenaires GNet</p></div></div>' +
    '<div class="kpis">' + kp.map(function (k) {
      return '<button class="kpi' + (k[0] === 'todo' && L.todo.length ? ' alert' : '') + (GN.f === k[0] ? ' on' : '') + '" data-gnf="' + k[0] + '"><b>' + L[k[0]].length + '</b><span>' + k[1] + '</span></button>';
    }).join('') + '</div>' +
    '<div class="gnl">' + GN_LINKS.map(function (l) { return '<a href="' + l[1] + '" target="_blank" rel="noopener">' + esc(l[0]) + ' ↗</a>'; }).join('') + '</div>' +
    '<p class="gnh">Une course GNet arrive ici toute seule quelques minutes après l’e-mail de GNet. Le n° de réservation GNet est dans la note interne de la course.</p>' +
    '<div id="gnL"></div>';
  $('#app').innerHTML = h;
  $$('[data-gnf]').forEach(function (b) { b.addEventListener('click', function () { GN.f = b.dataset.gnf; renderGnet(); }); });
  var V = L[GN.f], el = $('#gnL');
  if (!V.length) {
    el.innerHTML = '<div class="empty"><b>' + (all.length ? 'Rien dans cette liste' : 'Aucune course GNet pour l’instant') + '</b>' +
      (all.length ? 'Choisissez une autre case ci-dessus.' : 'Dès qu’un partenaire vous envoie une course sur GNet, elle apparaît ici et dans Courses.') + '</div>';
    gnBadge();
    return;
  }
  el.innerHTML = '<div class="tbl"><div class="thd"><span>Référence</span><span>Date</span><span>Partenaire</span><span>Trajet</span><span>Chauffeur</span><span>Statut</span><span>Prix</span></div>' +
    V.map(rowHtml).join('') + '</div>';
  swInit(el);
  gnBadge();
}
(function () {
  var _render = render;
  render = function () { if (S.view === 'gnet') { try { navIcons(); updateTitle(); } catch (e) {} return renderGnet(); } return _render.apply(this, arguments); };
  setTimeout(gnNav, 300); setInterval(gnNav, 3000);
})();
