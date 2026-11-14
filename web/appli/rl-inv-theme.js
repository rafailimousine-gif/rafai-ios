/* ---------- rlInvTheme v1 (14 nov. 2026, demande de Yassine) ----------
 * 1. « Mes factures » : dans « Mes courses », un onglet Factures liste les factures Qonto déposées par l'équipe
 *    (course avec x.inv) ; « Voir la facture » utilise getInv (aperçu natif dans l'appli iPhone).
 *    Aussi dans Compte et par le lien #factures.
 * 2. Bouton Sombre / Clair / Auto : en haut (un appui = mode suivant) et dans Compte. Clair par défaut.
 *    Le mode sombre est calculé à partir des styles de la page (fonds clairs -> sombres, textes foncés -> clairs). */
(function () {
  if (window.__rlIT) return;
  window.__rlIT = 1;
  var D = document, H = D.documentElement;
  var TX = {
    fr: { app: 'Apparence', light: 'Clair', dark: 'Sombre', auto: 'Auto', autoS: 'Auto suit le réglage de votre téléphone.', th: 'Thème', rides: 'Courses', inv: 'Factures', myInv: 'Mes factures', none: 'Aucune facture pour le moment', noneS: 'Vos factures apparaissent ici après chaque course.', see: 'Voir la facture', invoice: 'Facture' },
    en: { app: 'Appearance', light: 'Light', dark: 'Dark', auto: 'Auto', autoS: 'Auto follows your phone setting.', th: 'Theme', rides: 'Rides', inv: 'Invoices', myInv: 'My invoices', none: 'No invoices yet', noneS: 'Your invoices appear here after each ride.', see: 'View invoice', invoice: 'Invoice' },
    ar: { app: 'المظهر', light: 'فاتح', dark: 'داكن', auto: 'تلقائي', autoS: 'الوضع التلقائي يتبع إعداد هاتفك.', th: 'المظهر', rides: 'الرحلات', inv: 'الفواتير', myInv: 'فواتيري', none: 'لا توجد فواتير حاليًا', noneS: 'تظهر فواتيرك هنا بعد كل رحلة.', see: 'عرض الفاتورة', invoice: 'فاتورة' },
    zh: { app: '外观', light: '浅色', dark: '深色', auto: '自动', autoS: '“自动”跟随手机的设置。', th: '主题', rides: '行程', inv: '发票', myInv: '我的发票', none: '暂无发票', noneS: '每次行程结束后，发票会显示在这里。', see: '查看发票', invoice: '发票' }
  };
  function lg() { try { return L; } catch (e) { return 'fr'; } }
  function tx(k) { var d = TX[lg()] || TX.en; return d[k] || TX.en[k]; }
  function E(s) { try { return esc(s); } catch (e) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); } }
  var TEST = /--apercu|^localhost$|^127\./.test(location.hostname) && /[?&]rltest=1/.test(location.search);
  function A() { if (TEST) return { e: 'test' }; try { return auth(); } catch (e) { return null; } }
  function ridesArr() { try { return RIDES; } catch (e) { return null; } }

  /* ================= 1. Thème ================= */
  var MQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var IC = {
    light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M5.4 18.6L7 17M17 7l1.6-1.6"/></svg>',
    dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 14.3A8.6 8.6 0 0 1 9.7 3.6a8.6 8.6 0 1 0 10.7 10.7z"/></svg>',
    auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6"/><path d="M12 3.4v17.2a8.6 8.6 0 0 0 0-17.2z" fill="currentColor" stroke="none"/></svg>'
  };
  function getM() { var m = ''; try { m = localStorage.getItem('rl_th') || ''; } catch (e) {} return /^(light|dark|auto)$/.test(m) ? m : 'light'; }
  function isDark(m) { return m === 'dark' || (m === 'auto' && !!(MQ && MQ.matches)); }
  function setM(m) { try { localStorage.setItem('rl_th', m); } catch (e) {} apply(); }
  function apply() {
    var m = getM(), d = isDark(m);
    if (d) { gen(); H.setAttribute('data-th', 'd'); } else H.removeAttribute('data-th');
    H.setAttribute('data-thm', m);
    var mt = D.querySelector('meta[name="theme-color"]'); if (mt) mt.setAttribute('content', d ? '#0B0B0C' : '#111113');
    paint();
  }
  if (MQ) {
    var onMQ = function () { if (getM() === 'auto') apply(); };
    if (MQ.addEventListener) MQ.addEventListener('change', onMQ); else if (MQ.addListener) MQ.addListener(onMQ);
  }

  /* ---- couleurs ---- */
  function rgb(v) {
    var m = /rgba?\(([^)]+)\)/.exec(v || ''); if (!m) return null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); if (p.length < 3 || isNaN(p[0])) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function hex(v) {
    var h = String(v).replace('#', ''); if (h.length === 3 || h.length === 4) h = h.split('').map(function (c) { return c + c; }).join('');
    if (h.length < 6) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  function hsl(c) {
    var r = c.r / 255, g = c.g / 255, b = c.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s = 0, h = 0, d = mx - mn;
    if (d) { s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return { h: h, s: s, l: l };
  }
  function chr(c) { return (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)) / 255; }
  function hs(h, s, l, a) { return 'hsla(' + Math.round(h) + ',' + Math.round(s * 100) + '%,' + Math.round(l * 100) + '%,' + (a == null ? 1 : Math.round(a * 100) / 100) + ')'; }
  function lightGrad(v) {
    var cs = v.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]+\)/gi) || []; if (!cs.length) return false;
    return cs.every(function (x) { var c = x.charAt(0) === '#' ? hex(x) : rgb(x); return c && (c.a < 0.05 || hsl(c).l > 0.85); });
  }
  function splitSel(s) {
    var out = [], d = 0, cur = '';
    for (var i = 0; i < s.length; i++) { var c = s.charAt(i); if (c === '(') d++; else if (c === ')') d--; if (c === ',' && !d) { out.push(cur); cur = ''; } else cur += c; }
    out.push(cur); return out;
  }
  function pre(p) {
    p = p.trim(); if (!p || /^:root/.test(p)) return '';
    if (/^html(?![\w-])/.test(p)) return p.replace(/^html/, 'html[data-th=d]');
    return 'html[data-th=d] ' + p;
  }
  function mapRule(st) {
    var out = [], bgS = (st.getPropertyValue('background') || '') + ' ' + (st.getPropertyValue('background-image') || ''), bgC = st.getPropertyValue('background-color') || '';
    var bgc = rgb(bgC), accent = /var\(--gold/.test(bgS + bgC) || (/gradient/.test(bgS) && !lightGrad(bgS));
    if (bgc) { var b0 = hsl(bgc); if (bgc.a > 0.3 && chr(bgc) > 0.2 && b0.l > 0.3 && b0.l < 0.8) accent = true; }
    if (/var\(--ink\)/.test(bgS + bgC)) out.push('background-color:#0B0B0C');
    else if (/gradient/.test(bgS) && lightGrad(bgS)) out.push('background:#1B1B1E');
    else if (bgc && bgc.a > 0.2) {
      var k = hsl(bgc);
      if (k.l > 0.8) out.push('background-color:' + (chr(bgc) < 0.06 ? (k.l > 0.965 ? hs(240, 0.05, 0.105, bgc.a) : hs(40, 0.06, 0.15, bgc.a)) : hs(k.h, 0.3, 0.17, bgc.a)));
    }
    var col = st.getPropertyValue('color') || '';
    if (/var\(--ink\)/.test(col)) { if (accent) out.push('color:#111113'); }
    else {
      var c = rgb(col);
      if (c && c.a > 0.3 && !accent) {
        var q = hsl(c), cc = chr(c);
        if (q.l < 0.3) out.push('color:' + (cc > 0.15 ? hs(q.h, Math.min(q.s, 0.7), 0.64, c.a) : '#ECE8E0'));
        else if (q.l < 0.6 && cc < 0.12) out.push('color:#A3A3A8');
        else if (q.l < 0.5 && cc >= 0.15) out.push('color:' + hs(q.h, Math.min(q.s, 0.7), 0.62, c.a));
      }
    }
    ['top', 'right', 'bottom', 'left'].forEach(function (sd) {
      var v = rgb(st.getPropertyValue('border-' + sd + '-color'));
      if (v && v.a > 0.2 && hsl(v).l > 0.75) out.push('border-' + sd + '-color:#2E2B26');
    });
    return out;
  }
  var EXTRA = [
    'html[data-th=d]{color-scheme:dark}',
    'html[data-th=d] .btn.dark{background:#2C2C31;color:#fff;border-color:#3A3A40}',
    'html[data-th=d] .btn.gold{color:#111113}',
    'html[data-th=d] .seg button.on{background:#3A3833;color:#F3EFE7}',
    'html[data-th=d] .in::placeholder,html[data-th=d] input::placeholder,html[data-th=d] textarea::placeholder{color:#7C7C82}',
    'html[data-th=d] #thB{color:#E3C786}'
  ].join('\n');
  var GEN = false;
  function gen() {
    if (GEN) return; GEN = true;
    var css = [];
    function walk(rules, media) {
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (!r.selectorText && r.cssRules) { var cond = r.conditionText || (r.media && r.media.mediaText) || ''; if (cond && !/^@keyframes/.test(r.cssText || '')) walk(r.cssRules, cond); continue; }
        if (!r.selectorText || !r.style || /nsm7Bb|data-th|#rlTh/.test(r.selectorText)) continue;
        var o = mapRule(r.style); if (!o.length) continue;
        var sel = splitSel(r.selectorText).map(pre).filter(Boolean).join(','); if (!sel) continue;
        var line = sel + '{' + o.join(';') + '}';
        css.push(media ? '@media ' + media + '{' + line + '}' : line);
      }
    }
    for (var i = 0; i < D.styleSheets.length; i++) {
      var sh = D.styleSheets[i], n = sh.ownerNode;
      if (n && (n.id === 'rlThE' || n.id === 'rlThG')) continue;
      if (sh.href && sh.href.indexOf(location.origin) !== 0) continue;
      try { walk(sh.cssRules, ''); } catch (e) {}
    }
    css.push(EXTRA);
    var el = D.createElement('style'); el.id = 'rlThG'; el.textContent = css.join('\n'); D.head.appendChild(el);
  }

  /* ---- boutons ---- */
  function paint() {
    var m = getM(), b = D.getElementById('thB');
    if (b) { b.innerHTML = IC[m]; b.setAttribute('aria-label', tx('th') + ' : ' + tx(m)); b.title = tx('th') + ' : ' + tx(m); }
    var sg = D.getElementById('thSeg');
    if (sg) Array.prototype.forEach.call(sg.querySelectorAll('button'), function (x) { x.classList.toggle('on', x.getAttribute('data-m') === m); });
  }
  function topBtn() {
    if (D.getElementById('thB')) return;
    var ls = D.querySelector('.top .lsel') || D.querySelector('.top .tb'); if (!ls) return;
    var b = D.createElement('button'); b.type = 'button'; b.className = 'tb'; b.id = 'thB';
    b.onclick = function () {
      var m = getM(), n = m === 'light' ? 'dark' : m === 'dark' ? 'auto' : 'light';
      setM(n); try { toast(tx('th') + ' : ' + tx(n)); } catch (e) {}
    };
    ls.parentNode.insertBefore(b, ls);
  }
  function accCard() {
    var acc = D.getElementById('acc'); if (!acc) return;
    var c = D.getElementById('thCard');
    if (!c) { c = D.createElement('div'); c.id = 'thCard'; acc.parentNode.insertBefore(c, acc.nextSibling); }
    var a = A();
    c.innerHTML = (a ? '<h2>' + E(tx('myInv')) + '</h2><div class="card"><button class="btn" type="button" id="thInvGo">📄 ' + E(tx('myInv')) + (invRides().length ? ' (' + invRides().length + ')' : '') + '</button></div>' : '') +
      '<h2>' + E(tx('app')) + '</h2><div class="card"><div class="seg rlTh3" id="thSeg">' +
      ['light', 'dark', 'auto'].map(function (m) { return '<button type="button" data-m="' + m + '">' + IC[m] + '<span>' + E(tx(m)) + '</span></button>'; }).join('') +
      '</div><p class="mini">' + E(tx('autoS')) + '</p></div>';
    var g = D.getElementById('thInvGo'); if (g) g.onclick = function () { openInvList(); };
    D.getElementById('thSeg').onclick = function (e) { var b = e.target.closest ? e.target.closest('button') : null; if (b) setM(b.getAttribute('data-m')); };
    paint();
  }

  /* ================= 2. Mes factures ================= */
  var RV = 'rides';
  function invRides() { return (ridesArr() || []).filter(function (x) { return x && x.inv; }); }
  function amt(x) {
    var n = Number(String(x.paidAmount || x.price || '').replace(',', '.'));
    if (!n) return '';
    try { return n.toLocaleString(lg() === 'en' ? 'en-GB' : lg() === 'ar' ? 'ar-MA' : lg() === 'zh' ? 'zh-CN' : 'fr-FR', { style: 'currency', currency: 'EUR' }); } catch (e) { return n.toFixed(2) + ' €'; }
  }
  function when(x) { try { return dateTxt(x.date, x.time); } catch (e) { return (x.date || '') + (x.time ? ' · ' + x.time : ''); } }
  function seg() {
    var v = D.getElementById('v-rides'); if (!v) return null;
    var sg = D.getElementById('rvSeg');
    if (!sg) {
      sg = D.createElement('div'); sg.className = 'seg'; sg.id = 'rvSeg'; v.insertBefore(sg, v.firstChild);
      var il = D.createElement('div'); il.id = 'invL'; v.appendChild(il);
      sg.onclick = function (e) { var b = e.target.closest ? e.target.closest('button') : null; if (b) { RV = b.getAttribute('data-r'); drawInv(); } };
    }
    var n = invRides().length;
    sg.style.display = A() ? '' : 'none';
    sg.innerHTML = '<button type="button" data-r="rides"' + (RV === 'rides' ? ' class="on"' : '') + '>' + E(tx('rides')) + '</button>' +
      '<button type="button" data-r="inv"' + (RV === 'inv' ? ' class="on"' : '') + '>' + E(tx('inv')) + (n ? ' (' + n + ')' : '') + '</button>';
    return sg;
  }
  function drawInv() {
    seg();
    var show = !!A() && RV === 'inv', rl = D.getElementById('rides'), il = D.getElementById('invL');
    if (rl) rl.style.display = show ? 'none' : '';
    if (!il) return;
    il.style.display = show ? '' : 'none';
    if (!show) return;
    var R = ridesArr();
    if (R === null) { il.innerHTML = '<div class="empty"><span class="spin"></span></div>'; return; }
    var list = invRides();
    if (!list.length) { il.innerHTML = '<div class="empty"><b>' + E(tx('none')) + '</b>' + E(tx('noneS')) + '</div>'; return; }
    il.innerHTML = list.map(function (x) {
      var done = false; try { done = !!INVF[x.ref]; } catch (e) {}
      return '<div class="ride rlInvC"><div class="hd"><div class="dt">' + E(when(x)) + '</div><span class="st g">' + E(tx('invoice')) + '</span></div>' +
        '<div class="rt">' + E(x.from || '') + (x.to ? ' → ' + E(x.to) : '') + '</div>' +
        '<div class="ft"><span>' + E(x.ref) + (x.car ? ' · ' + E(x.car) : '') + '</span><b>' + E(amt(x)) + '</b></div>' +
        '<button class="btn dark rlInvB" type="button" data-inv="' + E(x.ref) + '">📄 ' + E(done ? (function () { try { return t('invOpen'); } catch (e) { return tx('see'); } })() : tx('see')) + '</button></div>';
    }).join('');
    Array.prototype.forEach.call(il.querySelectorAll('[data-inv]'), function (b) {
      b.onclick = function () {
        var ref = b.getAttribute('data-inv'), x = invRides().filter(function (y) { return y.ref === ref; })[0];
        if (!x) return;
        if (TEST) { try { toast('test : ' + ref); } catch (e) {} return; }
        try { getInv(x, b); } catch (e) {}
      };
    });
  }
  function openInvList() { RV = 'inv'; try { tab('rides'); } catch (e) {} drawInv(); try { window.scrollTo(0, 0); } catch (e) {} }
  function hashGo() { if (/^#(factures|invoices)$/i.test(location.hash)) openInvList(); }

  /* ---- branchements ---- */
  if (typeof renderRides === 'function') {
    var _rr = renderRides;
    renderRides = function () { var r = _rr.apply(this, arguments); try { drawInv(); var c = D.getElementById('thInvGo'); if (c) accCard(); } catch (e) {} return r; };
  }
  if (typeof renderAcc === 'function') {
    var _ra = renderAcc;
    renderAcc = function () { var r = _ra.apply(this, arguments); try { accCard(); } catch (e) {} return r; };
  }
  var css = D.createElement('style'); css.id = 'rlThS';
  css.textContent = '.seg.rlTh3{grid-template-columns:repeat(3,1fr);margin:0}.seg.rlTh3 button{display:flex;align-items:center;justify-content:center;gap:6px}' +
    '.seg.rlTh3 svg,#thB svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}' +
    '#thB{border:0;background:none;cursor:pointer;color:inherit}' +
    '.rlInvC{cursor:default}.rlInvC .ft b{font-weight:800}.rlInvB{min-height:46px;margin-top:12px;font-size:15px}#rvSeg{margin-bottom:12px}';
  D.head.appendChild(css);
  if (TEST) window.__rlITt = { rides: function (r) { RIDES = r; renderRides(); }, tab: function (n) { try { tab(n); } catch (e) {} }, inv: openInvList };
  function init() { topBtn(); accCard(); apply(); drawInv(); hashGo(); }
  window.addEventListener('hashchange', hashGo);
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})();
