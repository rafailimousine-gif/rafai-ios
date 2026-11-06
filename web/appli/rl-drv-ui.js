/* ---------- rlUI v1 : RL Driver, courses en lignes, onglets, petit calendrier, menu et page « Mon compte » ---------- */
(function rlUI() {
  if (window.__rlUI || typeof render !== 'function') return;
  window.__rlUI = 1;
  var U = { sel: '', tab: 'up', day: '', cal: false, mon: null, hist: null, ht: 0, hl: 0, herr: 0, y: 0 };
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var JR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  function el(i) { return document.getElementById(i); }
  function hx(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nat(m) { try { window.webkit.messageHandlers.rn.postMessage(m); return true; } catch (e) { return false; } }
  function sv(p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  var I = {
    menu: sv('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    user: sv('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>'),
    car: sv('<path d="M4 16v-3l2-5.2A2 2 0 0 1 7.9 6.5h8.2A2 2 0 0 1 18 7.8l2 5.2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4.5 12.5h15M7 17v2M17 17v2"/>'),
    cal: sv('<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    hist: sv('<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5"/><path d="M3.5 3.5v5h5M12 7.5V12l3 2"/>'),
    chat: sv('<path d="M4 5.5h16v10.5H9.5L5 19.5v-3.5H4z"/>'),
    tel: sv('<path d="M5.5 4h3.2l1.8 4.6-2.3 1.4a11 11 0 0 0 5.8 5.8l1.4-2.3 4.6 1.8v3.2a1.8 1.8 0 0 1-1.9 1.8A15.5 15.5 0 0 1 3.7 5.9 1.8 1.8 0 0 1 5.5 4z"/>'),
    out: sv('<path d="M14 4h4.5a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 8l-4 4 4 4M6 12h10"/>'),
    bell: sv('<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
    pin: sv('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    face: sv('<path d="M4 8.5V5.5A1.5 1.5 0 0 1 5.5 4h3M15.5 4h3A1.5 1.5 0 0 1 20 5.5v3M20 15.5v3a1.5 1.5 0 0 1-1.5 1.5h-3M8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3"/><path d="M9 9v1.5M15 9v1.5M12 9v4h-1M9.5 15.5a4 4 0 0 0 5 0"/>'),
    back: sv('<path d="M15 5l-7 7 7 7"/>'),
    prev: sv('<path d="M14.5 6l-6 6 6 6"/>'),
    next: sv('<path d="M9.5 6l6 6-6 6"/>')
  };

  /* ---------- dates ---------- */
  function z2(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + z2(d.getMonth() + 1) + '-' + z2(d.getDate()); }
  function pd(s) { var p = String(s || '').split('-'); return p.length === 3 && /^\d{4}$/.test(p[0]) ? new Date(+p[0], p[1] - 1, +p[2]) : null; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function dshort(s) { var d = pd(s); return d ? cap(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })) : ''; }
  function dlong(s) { var d = pd(s); return d ? cap(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })) : ''; }
  function monday(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; }
  function when(x) {
    var d = pd(x.date); if (!d) return '';
    var m = /^(\d{1,2})[:h](\d{2})/.exec(x.time || ''); if (m) d.setHours(+m[1], +m[2]);
    var mn = Math.round((d.getTime() - Date.now()) / 60000);
    if (mn < 0) return '';
    var j = Math.floor(mn / 1440), h = Math.floor((mn % 1440) / 60), mi = mn % 60;
    return 'dans ' + (j ? j + ' j ' + h + ' h' : h ? h + ' h ' + z2(mi) : mi + ' min');
  }
  function num(p) { var n = parseFloat(String(p || '').replace(/\s/g, '').replace(/[^\d,.\-]/g, '').replace(',', '.')); return isFinite(n) ? n : 0; }
  function eur(n) { return (Math.round(n * 100) / 100).toLocaleString('fr-FR') + ' €'; }
  function hdate(h) { return /^\d{4}-\d{2}-\d{2}$/.test(h.date || '') ? h.date : (h.t ? iso(new Date(h.t)) : ''); }

  /* ---------- données ---------- */
  function split(xs) {
    var o = { live: [], up: [], tv: [], done: [], by: {} };
    xs.forEach(function (x) {
      o.by[x.ref] = x;
      if (x.done) { if (!(x.v && x.v.decl && x.v.inv) && !(x.v && x.v.ok)) o.tv.push(x); else o.done.push(x); }
      else if (LIVE.indexOf(x.trk) >= 0) o.live.push(x);
      else o.up.push(x);
    });
    return o;
  }
  /* courses terminées : historique du serveur (12 mois) + celles encore dans la liste du téléphone */
  function doneList(o) {
    var seen = {}, out = [];
    (U.hist || []).forEach(function (h) { seen[h.ref] = 1; out.push(h); });
    o.done.concat(o.tv).forEach(function (x) {
      if (seen[x.ref]) return;
      var d = pd(x.date), m = /^(\d{1,2})[:h](\d{2})/.exec(x.time || '');
      if (d && m) d.setHours(+m[1], +m[2]);
      out.push({ ref: x.ref, t: d ? d.getTime() : 0, date: x.date, time: x.time, service: x.service, from: x.from, to: x.to, car: x.car, price: x.pay || '' });
    });
    out.sort(function (a, b) { return (b.t || 0) - (a.t || 0); });
    return out;
  }
  function histLoad(force) {
    if (U.hl || !ID || !KEY) return;
    if (U.hist && !force && Date.now() - U.ht < 600000) return;
    U.hl = 1;
    fetch(APP + '?app=drvhist&id=' + encodeURIComponent(ID) + '&k=' + encodeURIComponent(KEY) + '&_=' + Date.now(), { cache: 'no-store', credentials: 'omit' })
      .then(function (r) { return r.json(); })
      .then(function (j) { U.hl = 0; if (j && j.ok) { U.hist = j.list || []; U.ht = Date.now(); U.herr = 0; } else U.herr = 1; render(); })
      .catch(function () { U.hl = 0; U.herr = 1; render(); });
  }

  /* ---------- lignes ---------- */
  function route(x) { return [x.from, x.to].filter(Boolean).join(' → ') || '—'; }
  function row(x, kind) {
    var tag = CHG[x.ref] ? '<span class="chip n">' + (CHG[x.ref] === 'new' ? 'Nouvelle' : 'Modifiée') + '</span>' :
      kind === 'val' ? '<span class="chip o">À valider</span>' : chip(x);
    var w = x.done ? '' : when(x);
    return '<button type="button" class="rlrow' + (x.done ? ' dn' : '') + '" data-rlsel="' + hx(x.ref) + '">' +
      '<span class="rlr-t"><b>' + hx(x.time || '--:--') + '</b><small>' + hx(dshort(x.date)) + '</small></span>' +
      '<span class="rlr-m"><span class="rlr-s">' + hx([x.service, x.car].filter(Boolean).join(' · ')) + '</span>' +
      '<span class="rlr-a">' + hx(route(x)) + '</span>' +
      (x.client ? '<span class="rlr-c">' + hx(x.client) + (x.pax ? ' · ' + hx(x.pax) + ' pass.' : '') + '</span>' : '') + '</span>' +
      '<span class="rlr-e">' + tag + (w ? '<i>' + hx(w) + '</i>' : '') + '</span><span class="rlr-g">' + I.next + '</span></button>';
  }
  function hrow(h, by) {
    var x = by[h.ref], p = num(h.price), dt = hdate(h);
    var inner = '<span class="rlr-t"><b>' + hx(h.time || '--:--') + '</b><small>' + hx(dshort(dt)) + '</small></span>' +
      '<span class="rlr-m"><span class="rlr-s">' + hx([h.service, h.car].filter(Boolean).join(' · ')) + '</span>' +
      '<span class="rlr-a">' + hx(route(h)) + '</span><span class="rlr-c">' + hx(h.ref || '') + '</span></span>' +
      '<span class="rlr-e">' + (p ? '<b class="rlpr">' + hx(eur(p)) + '</b>' : '<span class="chip">Terminée</span>') + '</span>';
    return x ? '<button type="button" class="rlrow dn" data-rlsel="' + hx(h.ref) + '">' + inner + '<span class="rlr-g">' + I.next + '</span></button>' :
      '<div class="rlrow dn">' + inner + '</div>';
  }

  /* ---------- petit calendrier : semaine, ou mois entier ---------- */
  function marks(o) {
    var m = {};
    function add(k, f) { if (!/^\d{4}-\d{2}-\d{2}$/.test(k || '')) return; (m[k] = m[k] || { u: 0, d: 0 })[f]++; }
    o.live.concat(o.up).forEach(function (x) { add(x.date, 'u'); });
    doneList(o).forEach(function (h) { add(hdate(h), 'd'); });
    return m;
  }
  function dayBtn(d, m, out) {
    var k = iso(d), c = m[k], cls = 'rld' + (out ? ' out' : '') + (k === today(0) ? ' td' : '') + (k === U.day ? ' on' : '');
    var dots = c ? '<i>' + (c.u ? '<b></b>' : '') + (c.d ? '<b class="d"></b>' : '') + '</i>' : '';
    return '<button type="button" class="' + cls + '" data-rlday="' + k + '" aria-label="' + hx(dlong(k)) + (c ? ', ' + (c.u + c.d) + ' course' + (c.u + c.d > 1 ? 's' : '') : '') + '">' + d.getDate() + dots + '</button>';
  }
  function cal(o) {
    var m = marks(o), base = pd(U.day) || pd(today(0)), h = '', n = 0, k;
    if (U.cal) {
      if (!U.mon) U.mon = new Date(base.getFullYear(), base.getMonth(), 1);
      var y = U.mon.getFullYear(), mo = U.mon.getMonth(), pre = '' + y + '-' + z2(mo + 1);
      for (k in m) if (k.indexOf(pre) === 0) n += m[k].u + m[k].d;
      h += '<div class="rlcal"><div class="rlcal-h"><button type="button" class="nv" data-rlmo="-1" aria-label="Mois précédent">' + I.prev + '</button>' +
        '<b>' + cap(MOIS[mo]) + ' ' + y + '<small>' + (n ? n + ' course' + (n > 1 ? 's' : '') : 'Aucune course') + '</small></b>' +
        '<button type="button" class="nv" data-rlmo="1" aria-label="Mois suivant">' + I.next + '</button></div>' +
        '<div class="rlgr">' + JR.map(function (j) { return '<small>' + j + '</small>'; }).join('');
      var first = new Date(y, mo, 1), start = monday(first), d = new Date(start);
      var weeks = Math.ceil(((first.getDay() + 6) % 7 + new Date(y, mo + 1, 0).getDate()) / 7);
      for (var i = 0; i < weeks * 7; i++) { h += dayBtn(d, m, d.getMonth() !== mo); d.setDate(d.getDate() + 1); }
      h += '</div><button type="button" class="rlcal-t" data-rlcal="0">Réduire le calendrier</button></div>';
    } else {
      var w = monday(base), mid = new Date(w); mid.setDate(mid.getDate() + 3);
      h += '<div class="rlcal"><div class="rlcal-h"><b>' + cap(MOIS[mid.getMonth()]) + ' ' + mid.getFullYear() + '</b>' +
        '<button type="button" class="rlcal-o" data-rlcal="1">' + I.cal + 'Mois</button></div><div class="rlgr">' +
        JR.map(function (j) { return '<small>' + j + '</small>'; }).join('');
      for (var j = 0; j < 7; j++) { h += dayBtn(w, m, false); w.setDate(w.getDate() + 1); }
      h += '</div></div>';
    }
    return h;
  }

  /* ---------- écrans ---------- */
  function dayView(o) {
    var k = U.day, items = [], seen = {};
    o.live.concat(o.up, o.tv, o.done).forEach(function (x) { if (x.date === k) { seen[x.ref] = 1; items.push({ t: x.time || '', h: row(x, o.tv.indexOf(x) >= 0 ? 'val' : '') }); } });
    doneList(o).forEach(function (h) { if (!seen[h.ref] && hdate(h) === k) items.push({ t: h.time || '', h: hrow(h, o.by) }); });
    items.sort(function (a, b) { return a.t < b.t ? -1 : a.t > b.t ? 1 : 0; });
    return '<div class="rlday"><span>' + hx(dlong(k)) + '</span><button type="button" data-rlday="">Tout voir ✕</button></div>' +
      (items.length ? items.map(function (x) { return x.h; }).join('') : '<div class="rlnone">Aucune course ce jour-là.</div>');
  }
  function upView(o) {
    if (!o.up.length) return '<div class="empty"><img src="/chauffeur/icon-192.png" alt=""><b>Aucune mission prévue</b>Dès qu’une course vous est confiée, elle apparaît ici.</div>';
    var g = {}, order = [], h = '';
    o.up.forEach(function (x) { var k = x.date || '?'; if (!g[k]) { g[k] = []; order.push(k); } g[k].push(x); });
    order.forEach(function (k) {
      h += '<div class="rlday"><span>' + hx(dayLabel(k)) + '</span><em>' + g[k].length + ' mission' + (g[k].length > 1 ? 's' : '') + '</em></div>' +
        g[k].map(function (x) { return row(x); }).join('');
    });
    return h;
  }
  function doneView(o) {
    if (!U.hist && !U.herr) { histLoad(); return '<div class="rlnone">Chargement de l’historique…</div>'; }
    var l = doneList(o);
    if (!l.length) return '<div class="rlnone">Aucune course terminée sur les 12 derniers mois.' + (U.herr ? '<br><button type="button" class="rlre" data-rlre="1">Réessayer</button>' : '') + '</div>';
    var g = {}, order = [], h = U.herr ? '<div class="rlnone">Historique complet indisponible pour l’instant : seules les dernières courses s’affichent.<br><button type="button" class="rlre" data-rlre="1">Réessayer</button></div>' : '';
    l.forEach(function (x) {
      var d = x.t ? new Date(x.t) : pd(x.date), key = d ? d.getFullYear() + '-' + d.getMonth() : 'x';
      if (!g[key]) { g[key] = { name: d ? cap(MOIS[d.getMonth()]) + ' ' + d.getFullYear() : 'Sans date', n: 0, s: 0, it: [] }; order.push(key); }
      g[key].n++; g[key].s += num(x.price); g[key].it.push(x);
    });
    order.forEach(function (k) {
      var m = g[k];
      h += '<div class="rlday"><span>' + hx(m.name) + '</span><em>' + m.n + ' course' + (m.n > 1 ? 's' : '') + (m.s ? ' · ' + hx(eur(m.s)) : '') + '</em></div>' +
        m.it.map(function (x) { return hrow(x, o.by); }).join('');
    });
    return h;
  }
  function mainView(o) {
    var h = cal(o);
    if (U.day) return h + dayView(o);
    h += o.live.length ? '<h2>En cours</h2>' + o.live.map(card).join('') : '<div class="rlnolive"><i></i>Aucune course en cours</div>';
    if (o.tv.length) h += '<h2>À valider<span>' + o.tv.length + ' course' + (o.tv.length > 1 ? 's' : '') + ' terminée' + (o.tv.length > 1 ? 's' : '') + '</span></h2>' +
      o.tv.map(function (x) { return row(x, 'val'); }).join('');
    h += '<div class="rltabs" role="tablist"><button type="button" role="tab" data-rltab="up" class="' + (U.tab === 'up' ? 'on' : '') + '">À venir' + (o.up.length ? '<span>' + o.up.length + '</span>' : '') + '</button>' +
      '<button type="button" role="tab" data-rltab="done" class="' + (U.tab === 'done' ? 'on' : '') + '">Terminées</button></div>';
    return h + (U.tab === 'done' ? doneView(o) : upView(o));
  }
  function draw() {
    var L = el('list'); if (!L || !DATA || !DATA.data) return;
    var o = split(DATA.data.missions || []), keep = el('rlperm');
    if (U.sel && !o.by[U.sel]) U.sel = '';
    if (U.sel) {
      var x = o.by[U.sel];
      L.innerHTML = '<div class="rlback"><button type="button" id="rlbk">' + I.back + 'Mes courses</button><span>' + hx(dshort(x.date)) + '</span></div>' + card(x);
    } else {
      L.innerHTML = mainView(o);
      if (keep) L.insertBefore(keep, L.firstChild);
    }
    document.documentElement.classList.toggle('rlsel', !!U.sel);
    if (!U.hist && !U.hl && !U.herr) setTimeout(function () { histLoad(); }, 1500);
    navHead();
  }

  /* ---------- menu (3 traits) ---------- */
  function navHead() {
    var d = DATA && DATA.data && DATA.data.drv, b = el('rlnvn');
    if (b) b.textContent = d ? [d.fname, d.lname].filter(Boolean).join(' ') : '';
  }
  function navOpen(on) {
    var n = el('rlnav'); if (!n) return;
    n.classList.toggle('on', !!on);
    document.documentElement.classList.toggle('rlnv-on', !!on);
  }
  function go(where) {
    navOpen(false);
    if (where === 'chat') { var c = el('chatBtn'); if (c) c.click(); return; }
    if (where === 'me') { accOpen(true); return; }
    accOpen(false);
    U.sel = ''; U.day = '';
    if (where === 'cal') { U.cal = true; U.mon = null; }
    if (where === 'up' || where === 'done') { U.tab = where; if (where === 'done') histLoad(true); }
    render();
    window.scrollTo(0, 0);
  }

  /* ---------- page « Mon compte » (petit bonhomme) ---------- */
  function accRows() {
    var b = el('rlacst'); if (!b) return;
    var h = '';
    if (window.__rlNative) {
      var ps = (window.RN && RN.ps) || 'default', lo = window.RLL && RLL.locOk ? RLL.locOk() : false;
      h += '<div class="rlac-r"><span>' + I.bell + 'Notifications</span>' +
        (ps === 'granted' ? '<em class="ok">Activées ✓</em>' : ps === 'denied' ? '<button type="button" data-rlact="set">Réglages</button>' : '<button type="button" data-rlact="push">Activer</button>') + '</div>';
      h += '<div class="rlac-r"><span>' + I.pin + 'Localisation</span>' + (lo ? '<em class="ok">Activée ✓</em>' : '<button type="button" data-rlact="loc">Activer</button>') + '</div>';
      if (window.__rlFace) h += '<div class="rlac-r"><span>' + I.face + hx(window.__rlFace) + '</span><em class="ok">Activé ✓</em></div>';
    }
    h += '<button type="button" class="rlac-r" data-rlgo="cal"><span>' + I.cal + 'Calendrier du mois</span>' + I.next + '</button>';
    h += '<button type="button" class="rlac-r" data-rlgo="done"><span>' + I.hist + 'Historique des courses</span>' + I.next + '</button>';
    b.innerHTML = h;
  }
  function accOpen(on) {
    var a = el('rlacc'); if (!a) return;
    if (on) { accRows(); a.scrollTop = 0; }
    a.classList.toggle('on', !!on);
    a.setAttribute('aria-hidden', on ? 'false' : 'true');
    document.documentElement.classList.toggle('rlac-on', !!on);
  }

  /* ---------- mise en place ---------- */
  var st = document.createElement('style');
  st.textContent =
    'html.rlui .top img{display:none}html.rlui .top{gap:10px}' +
    '#rlmn svg{width:22px;height:22px;color:var(--txt)}' +
    '.rlcal{margin:12px 0 4px;padding:12px 10px 8px;background:var(--card);border:1px solid var(--line);border-radius:18px}' +
    '.rlcal-h{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 4px 8px}' +
    '.rlcal-h b{font-size:15.5px;color:var(--txt);text-align:center}.rlcal-h b small{display:block;font-size:12px;font-weight:600;color:var(--mut);margin-top:1px}' +
    '.rlcal-h .nv{width:38px;height:38px;border:1px solid var(--line);border-radius:11px;background:#1d1d21;color:var(--txt);display:flex;align-items:center;justify-content:center;cursor:pointer}.rlcal-h .nv svg{width:18px;height:18px}' +
    '.rlcal-o{display:flex;align-items:center;gap:6px;height:34px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:#1d1d21;color:var(--gold);font:inherit;font-size:13.5px;font-weight:700;cursor:pointer}.rlcal-o svg{width:16px;height:16px}' +
    '.rlgr{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px;text-align:center}' +
    '.rlgr small{font-size:11px;font-weight:700;color:var(--dim);padding:0 0 4px}' +
    '.rld{position:relative;height:44px;border:0;border-radius:12px;background:none;color:var(--txt);font:inherit;font-size:15.5px;font-weight:600;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.rld.out{opacity:.35}.rld.td{color:var(--gold);font-weight:800}.rld.on{background:var(--gold);color:#111113}' +
    '.rld i{position:absolute;left:0;right:0;bottom:5px;display:flex;justify-content:center;gap:3px}.rld i b{width:5px;height:5px;border-radius:50%;background:var(--gold)}.rld i b.d{background:var(--mut)}.rld.on i b{background:#111113}' +
    '.rlcal-t{display:block;width:100%;margin-top:6px;padding:8px;border:0;background:none;color:var(--mut);font:inherit;font-size:13px;font-weight:700;cursor:pointer}' +
    '.rlnolive{display:flex;align-items:center;gap:10px;margin:14px 0 2px;padding:12px 14px;border:1px dashed var(--line);border-radius:14px;color:var(--mut);font-size:14px}.rlnolive i{width:8px;height:8px;border-radius:50%;background:var(--dim)}' +
    '.rltabs{display:flex;gap:4px;margin:20px 0 6px;padding:4px;background:#18181b;border:1px solid var(--line);border-radius:14px}' +
    '.rltabs button{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;height:42px;border:0;border-radius:10px;background:none;color:var(--mut);font:inherit;font-size:15px;font-weight:700;cursor:pointer}' +
    '.rltabs button.on{background:#2a2a2f;color:var(--txt)}.rltabs button span{min-width:20px;padding:2px 6px;border-radius:999px;background:var(--gold);color:#111113;font-size:12px;box-sizing:border-box}' +
    '.rlday{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:18px 4px 8px;font-size:12.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold)}' +
    '.rlday em{font-style:normal;letter-spacing:0;text-transform:none;font-weight:600;color:var(--dim)}' +
    '.rlday button{border:1px solid var(--line);border-radius:10px;background:#1d1d21;color:var(--txt);font:inherit;font-size:12.5px;font-weight:700;letter-spacing:0;text-transform:none;padding:7px 11px;cursor:pointer}' +
    '.rlrow{display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;margin:0 0 8px;padding:13px 10px 13px 14px;background:var(--card);border:1px solid var(--line);border-radius:16px;color:var(--txt);font:inherit;text-align:start;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    'button.rlrow:active{background:#222226}div.rlrow{cursor:default}.rlrow.dn .rlr-t b{color:var(--mut)}' +
    '.rlr-t{flex:none;width:66px;display:flex;flex-direction:column}.rlr-t b{font-size:19px;font-weight:800;letter-spacing:-.01em}.rlr-t small{margin-top:2px;font-size:11px;color:var(--mut);white-space:nowrap}' +
    '.rlr-m{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}' +
    '.rlr-m>span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.rlr-s{font-size:12.5px;font-weight:700;color:var(--gold)}.rlr-a{font-size:14.5px;font-weight:600}.rlr-c{font-size:12.5px;color:var(--mut)}' +
    '.rlr-e{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:5px;max-width:34%}.rlr-e i{font-style:normal;font-size:11.5px;color:var(--mut);white-space:nowrap}' +
    '.rlpr{font-size:15px;color:var(--ok)}' +
    '.rlr-g{flex:none;display:flex;color:var(--dim)}.rlr-g svg{width:18px;height:18px}' +
    '.rlnone{margin:14px 0;padding:18px 14px;border:1px solid var(--line);border-radius:16px;background:var(--card);color:var(--mut);font-size:14px;line-height:1.45;text-align:center}' +
    '.rlre{margin-top:10px;padding:9px 16px;border:1px solid var(--line);border-radius:10px;background:#1d1d21;color:var(--txt);font:inherit;font-weight:700;cursor:pointer}' +
    '.rlback{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:12px 0 10px}' +
    '.rlback button{display:flex;align-items:center;gap:4px;height:42px;padding:0 14px 0 8px;border:1px solid var(--line);border-radius:12px;background:#1d1d21;color:var(--txt);font:inherit;font-size:15px;font-weight:700;cursor:pointer}.rlback button svg{width:20px;height:20px}' +
    '.rlback span{color:var(--mut);font-size:13.5px}' +
    '#rlme{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:8;width:54px;height:54px;border-radius:50%;border:1px solid var(--gold2);background:#1d1d21;color:var(--gold);display:none;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(0,0,0,.55);cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '#rlme svg{width:26px;height:26px}html.rlui #rlme{display:flex}html.rlnv-on #rlme,html.rlac-on #rlme{display:none}' +
    'html.rlui .wrap{padding-bottom:84px}' +
    '#rlnav{position:fixed;inset:0;z-index:12;visibility:hidden;transition:visibility 0s .25s}#rlnav.on{visibility:visible;transition:none}' +
    '#rlnav .bg{position:absolute;inset:0;background:rgba(0,0,0,.55);opacity:0;transition:opacity .22s}#rlnav.on .bg{opacity:1}' +
    '#rlnav nav{position:absolute;top:0;bottom:0;left:0;width:min(82vw,320px);box-sizing:border-box;display:flex;flex-direction:column;gap:2px;overflow:auto;padding:calc(16px + env(safe-area-inset-top)) 12px calc(16px + env(safe-area-inset-bottom));background:#151517;border-right:1px solid var(--line);transform:translateX(-100%);transition:transform .22s ease}' +
    '#rlnav.on nav{transform:none}' +
    '#rlnav .hd{display:flex;align-items:center;gap:12px;padding:6px 8px 16px;margin-bottom:8px;border-bottom:1px solid var(--line)}#rlnav .hd img{width:44px;height:44px;border-radius:12px}' +
    '#rlnav .hd b{display:block;font-size:16px;color:var(--txt)}#rlnav .hd small{display:block;margin-top:2px;font-size:13px;color:var(--mut)}' +
    '.rlit{display:flex;align-items:center;gap:14px;width:100%;box-sizing:border-box;min-height:52px;padding:0 10px;border:0;border-radius:12px;background:none;color:var(--txt);font:inherit;font-size:16px;font-weight:600;text-align:start;text-decoration:none;cursor:pointer}' +
    '.rlit:active{background:#222226}.rlit svg{flex:none;width:22px;height:22px;color:var(--gold)}#rlnav .sp{flex:1}' +
    '#rlacc{position:fixed;inset:0;z-index:15;overflow:auto;-webkit-overflow-scrolling:touch;background:var(--bg);visibility:hidden;transform:translateY(100%);transition:transform .25s ease,visibility 0s .25s}' +
    '#rlacc.on{visibility:visible;transform:none;transition:transform .25s ease}' +
    '#rlacc .bar{position:sticky;top:0;z-index:1;display:flex;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 14px 10px;background:rgba(17,17,19,.95);border-bottom:1px solid var(--line)}' +
    '#rlacc .bar button{display:flex;align-items:center;gap:4px;height:42px;padding:0 14px 0 8px;border:1px solid var(--line);border-radius:12px;background:#1d1d21;color:var(--txt);font:inherit;font-size:15px;font-weight:700;cursor:pointer}#rlacc .bar button svg{width:20px;height:20px}' +
    '#rlacc .bar b{flex:1;text-align:center;margin-right:70px;font-size:16px;color:var(--txt)}' +
    '.rlac-in{max-width:620px;margin:0 auto;padding:6px 14px calc(30px + env(safe-area-inset-bottom))}' +
    '.rlac-g{margin:18px 0 0;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}' +
    '.rlac-r{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;box-sizing:border-box;min-height:56px;padding:0 14px;border:0;border-bottom:1px solid var(--line);background:none;color:var(--txt);font:inherit;font-size:15.5px;font-weight:600;text-align:start}' +
    '.rlac-r:last-child{border-bottom:0}button.rlac-r{cursor:pointer}button.rlac-r:active{background:#222226}' +
    '.rlac-r>span{display:flex;align-items:center;gap:12px}.rlac-r svg{width:20px;height:20px;color:var(--gold);flex:none}.rlac-r>svg{color:var(--dim)}' +
    '.rlac-r em{font-style:normal;font-size:14px;color:var(--mut)}.rlac-r em.ok{color:var(--ok);font-weight:700}' +
    '.rlac-r button{height:34px;padding:0 14px;border:0;border-radius:10px;background:linear-gradient(180deg,var(--gold),var(--gold2));color:#111113;font:inherit;font-size:14px;font-weight:800;cursor:pointer}' +
    '.rlac-lo{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:54px;margin:26px 0 0;border:0;border-radius:14px;background:#f3efe6;color:#111113;font:inherit;font-size:16px;font-weight:800;cursor:pointer}.rlac-lo svg{width:20px;height:20px}' +
    '.rlac-v{margin:14px 0 0;text-align:center;font-size:12.5px;color:var(--dim)}' +
    '#rlacc #pf{margin-top:8px}html.rlsel #rlperm{display:none}';
  (document.head || document.documentElement).appendChild(st);

  function setup() {
    var top = document.querySelector('.top');
    if (top && !el('rlmn')) {
      var mb = document.createElement('button');
      mb.type = 'button'; mb.className = 'ib'; mb.id = 'rlmn'; mb.setAttribute('aria-label', 'Menu');
      mb.innerHTML = I.menu;
      top.insertBefore(mb, top.firstChild);
    }
    var tel = (el('callRef') && el('callRef').getAttribute('href')) || 'tel:+33667099494';
    if (!el('rlnav')) {
      var n = document.createElement('div');
      n.id = 'rlnav';
      n.innerHTML = '<div class="bg" data-rlclose="1"></div><nav aria-label="Menu RL Driver">' +
        '<div class="hd"><img src="/chauffeur/apple-touch-icon.png" alt=""><div><b>RL Driver</b><small id="rlnvn"></small></div></div>' +
        '<button type="button" class="rlit" data-rlgo="up">' + I.car + 'Mes courses</button>' +
        '<button type="button" class="rlit" data-rlgo="cal">' + I.cal + 'Calendrier du mois</button>' +
        '<button type="button" class="rlit" data-rlgo="done">' + I.hist + 'Historique des courses</button>' +
        '<button type="button" class="rlit" data-rlgo="chat">' + I.chat + 'Messages</button>' +
        '<a class="rlit" href="' + hx(tel) + '">' + I.tel + 'Appeler Rafai Limousine</a>' +
        '<div class="sp"></div>' +
        '<button type="button" class="rlit" data-rlgo="me">' + I.user + 'Mon compte</button></nav>';
      document.body.appendChild(n);
    }
    if (!el('rlacc')) {
      var a = document.createElement('div');
      a.id = 'rlacc'; a.setAttribute('role', 'dialog'); a.setAttribute('aria-modal', 'true'); a.setAttribute('aria-hidden', 'true');
      a.innerHTML = '<div class="bar"><button type="button" data-rlacx="1">' + I.back + 'Retour</button><b>Mon compte</b></div>' +
        '<div class="rlac-in"><div id="rlacpf"></div><div class="rlac-g" id="rlacst"></div>' +
        '<button type="button" class="rlac-lo" data-rlact="out">' + I.out + 'Se déconnecter</button>' +
        '<p class="rlac-v">RL Driver · Rafai Limousine</p></div>';
      document.body.appendChild(a);
    }
    var pf = el('pf'), box = el('rlacpf');
    if (pf && box && pf.parentNode !== box) box.appendChild(pf);
    if (!el('rlme')) {
      var f = document.createElement('button');
      f.type = 'button'; f.id = 'rlme'; f.setAttribute('aria-label', 'Mon compte');
      f.innerHTML = I.user;
      document.body.appendChild(f);
    }
  }

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null, b;
    if (!t) return;
    if (t.closest('#rlmn')) { navOpen(true); return; }
    if (t.closest('#rlme')) { accOpen(true); return; }
    if (t.closest('[data-rlclose]')) { navOpen(false); return; }
    if (t.closest('[data-rlacx]')) { accOpen(false); return; }
    if ((b = t.closest('[data-rlgo]'))) { go(b.getAttribute('data-rlgo')); return; }
    if ((b = t.closest('[data-rlact]'))) {
      var a = b.getAttribute('data-rlact');
      if (a === 'out') { if (window.RLL && RLL.logout) RLL.logout(); return; }
      if (a === 'push') nat({ t: 'push' });
      else if (a === 'set') nat({ t: 'settings' });
      else if (a === 'loc' && window.RLL && RLL.askLoc) RLL.askLoc(false);
      setTimeout(accRows, 1500); setTimeout(accRows, 6000);
      return;
    }
    if (!t.closest('#list')) return;
    if ((b = t.closest('[data-rlsel]'))) { U.y = window.scrollY || 0; openMission(b.getAttribute('data-rlsel')); return; }
    if (t.closest('#rlbk')) { U.sel = ''; render(); window.scrollTo(0, U.y || 0); return; }
    if ((b = t.closest('[data-rltab]'))) { U.tab = b.getAttribute('data-rltab'); if (U.tab === 'done') histLoad(); render(); return; }
    if ((b = t.closest('[data-rlday]'))) { var k = b.getAttribute('data-rlday'); U.day = k && k !== U.day ? k : ''; render(); return; }
    if ((b = t.closest('[data-rlcal]'))) { U.cal = b.getAttribute('data-rlcal') === '1'; U.mon = null; render(); return; }
    if ((b = t.closest('[data-rlmo]'))) { var m = U.mon || new Date(); U.mon = new Date(m.getFullYear(), m.getMonth() + Number(b.getAttribute('data-rlmo')), 1); render(); return; }
    if (t.closest('[data-rlre]')) { U.herr = 0; histLoad(true); render(); return; }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { navOpen(false); accOpen(false); } });

  /* une notification ou un lien ouvre directement la course */
  if (typeof openMission === 'function') {
    var _om = openMission;
    openMission = function (ref) {
      if (!mission(ref) || !DATA) return _om.apply(this, arguments);
      try { if (CHG[ref]) { delete CHG[ref]; LS.set(XK, JSON.stringify(CHG)); } } catch (e) {}
      U.sel = ref; U.day = ''; navOpen(false); accOpen(false);
      render();
      window.scrollTo(0, 0);
      var c = document.querySelector('#list .card');
      if (c) { c.classList.add('hl'); setTimeout(function () { c.classList.remove('hl'); }, 2500); }
    };
  }
  var _render = render;
  render = function () {
    var r = _render.apply(this, arguments);
    var on = !!(ID && KEY && DATA && DATA.data);
    document.documentElement.classList.toggle('rlui', on);
    if (!on) return r;
    try { if (TK.stop && document.activeElement && document.activeElement.id === 'tkStopTxt') return r; } catch (e) {}
    try { setup(); draw(); } catch (e) { try { console.log('rlUI', e); } catch (e2) {} }
    return r;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { if (ID && KEY && DATA) render(); });
  else if (ID && KEY && DATA) render();
})();
