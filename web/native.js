/* ---------- Appli iPhone Rafai Limousine : la page s'adapte quand elle est ouverte dans l'appli (window.__rlNative posé par l'appli) ---------- */
(function () {
  if (!window.__rlNative || window.__rnInit) return;
  window.__rnInit = 1;
  document.documentElement.classList.add('rn-app');
  function send(m) { try { window.webkit.messageHandlers.rn.postMessage(m); } catch (e) {} }
  function $i(id) { return document.getElementById(id); }
  var RN = window.RN = { ps: 'default', tok: '', asked: false, busy: 0 };
  var TX = {
    fr: { apple: 'Continuer avec Apple', google: 'Continuer avec Google', set: 'Ouvrir les réglages', or: 'ou' },
    en: { apple: 'Continue with Apple', google: 'Continue with Google', set: 'Open Settings', or: 'or' },
    ar: { apple: 'المتابعة باستخدام Apple', google: 'المتابعة باستخدام Google', set: 'فتح الإعدادات', or: 'أو' },
    zh: { apple: '通过 Apple 继续', google: '通过 Google 继续', set: '打开设置', or: '或' }
  };
  function lg() { try { return L; } catch (e) { return 'fr'; } }
  function tx(k) { var d = TX[lg()] || TX.en; return d[k] || TX.en[k]; }
  function tt(k) { try { return t(k); } catch (e) { return ''; } }
  function authed() { try { return auth(); } catch (e) { return null; } }
  function cfg() { try { return CFG; } catch (e) { return null; } }

  /* 1. Apparence : la barre d'onglets de la page est remplacée par la barre native de l'iPhone */
  var st = document.createElement('style');
  st.textContent = '.tabs{display:none!important}' +
    'body{padding-bottom:calc(24px + env(safe-area-inset-bottom))!important}' +
    '.gate .btn.rn-ap{background:#fff;color:#111113;border:0;font-weight:650}' +
    '.gate .btn.rn-ap i{font-style:normal;font-size:21px;line-height:1;margin-top:-3px;font-family:-apple-system,system-ui}' +
    '.gate .btn.rn-gg{background:#fff;color:#1F1F1F;border:0;font-weight:650;margin-top:10px}' +
    '.gate .btn.rn-gg svg{width:19px;height:19px;flex:none}' +
    '*{-webkit-tap-highlight-color:transparent}';
  (document.head || document.documentElement).appendChild(st);

  /* 2. Onglets : la page prévient l'appli, l'appli change d'onglet dans la page */
  if (typeof tab === 'function') {
    var _tab = tab;
    tab = function (n) {
      var r = _tab.apply(this, arguments);
      send({ t: 'tab', v: n });
      afterAuth();
      return r;
    };
  }
  RN.go = function (n) {
    try {
      Array.prototype.forEach.call(document.querySelectorAll('.ov.on'), function (o) {
        try { ovClose(o.id, false); } catch (e) { o.classList.remove('on'); }
      });
    } catch (e) {}
    var cur = ''; try { cur = TAB; } catch (e) {}
    if (cur === n) {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); if (n === 'rides') loadRides(); } catch (e) {}
      send({ t: 'tab', v: n });
      return;
    }
    try { tab(n); } catch (e) {}
  };

  /* 3. Écran de connexion : quand il est affiché, la barre native se cache */
  var gate = $i('gate');
  function gs() { send({ t: 'gate', v: !!(gate && gate.classList.contains('on')) }); setTimeout(afterAuth, 300); }
  if (gate) new MutationObserver(gs).observe(gate, { attributes: true, attributeFilter: ['class'] });

  /* 4. Pastille sur « Mes courses » */
  var bd = $i('rbd');
  function bs() {
    var v = bd && !bd.classList.contains('hide') ? (String(bd.textContent || '').trim() || '•') : '';
    send({ t: 'badge', v: v });
  }
  if (bd) new MutationObserver(bs).observe(bd, { attributes: true, childList: true, characterData: true, subtree: true });

  /* 5. Connexion : boutons natifs « Continuer avec Apple » (Face ID) et « Continuer avec Google » (fenêtre sécurisée
        de l'iPhone, exigée par Google) à la place des boutons web. Apple : dès que le serveur l'accepte (CFG.appleApp) ;
        Google : appli version 2 ou plus récente (window.__rlNativeV) et connexion Google active sur le site (CFG.gid) */
  var GSVG = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  function ssoBtn(id, cls, icon, label, msg) {
    var w = document.createElement('div');
    w.innerHTML = '<button class="btn sso ' + cls + '" type="button" id="' + id + '">' + icon + '<span></span></button>';
    var b = w.children[0];
    b.querySelector('span').textContent = label;
    b.onclick = function () {
      try { err('eG', ''); } catch (e) {}
      try { busyBtn(b, true); } catch (e) {}
      send({ t: msg });
    };
    return b;
  }
  function addSso(apple, google) {
    var f = $i('gateF'); if (!f) return;
    var first = f.firstChild, added = false;
    if (google && !$i('gGg')) { f.insertBefore(ssoBtn('gGg', 'rn-gg', GSVG, tx('google'), 'google'), first); first = $i('gGg'); added = true; }
    if (apple && !$i('gA')) { f.insertBefore(ssoBtn('gA', 'rn-ap', '<i></i>', tx('apple'), 'apple'), first); added = true; }
    if (added && !f.querySelector('.gor')) {
      var g = document.createElement('div'); g.className = 'gor'; g.textContent = tt('gOr') || tx('or');
      var last = $i('gGg') || $i('gA');
      f.insertBefore(g, last ? last.nextSibling : f.firstChild);
    }
  }
  function appleIdle() { var b = $i('gA'); if (b) { try { busyBtn(b, false); } catch (e) {} } }
  function googleIdle() { var b = $i('gGg'); if (b) { try { busyBtn(b, false); } catch (e) {} } }
  if (typeof gateDraw === 'function') {
    var _gd = gateDraw;
    gateDraw = function () {
      var c = cfg(), sa = c && c.apple, sg = c && c.gid;
      if (c) { c.apple = ''; c.gid = ''; }
      try { _gd.apply(this, arguments); } finally { if (c) { c.apple = sa; c.gid = sg; } }
      try { if (GL.v === 'home' && c) addSso(!!c.appleApp, !!sg && (window.__rlNativeV || 0) >= 2); } catch (e) {}
    };
    if (gate && gate.classList.contains('on')) { try { gateDraw(); } catch (e) {} }
  }
  RN.googleDone = function (d) {
    d = d || {};
    post('cgoogle', { t: d.t, app: 1 }).then(function (r) {
      googleIdle();
      if (!r || !r.ok) { err('eG', tt('pkErr')); return; }
      r.via = 'Google'; signedIn(r);
    }).catch(function () { googleIdle(); try { err('eG', tt('errNet')); } catch (e) {} });
  };
  RN.googleErr = function (code) {
    googleIdle();
    if (code !== 'cancel') { try { err('eG', tt('pkErr')); } catch (e) {} }
  };
  RN.appleDone = function (d) {
    d = d || {};
    post('capple', { t: d.t, fn: d.fn || '', ln: d.ln || '', app: 1 }).then(function (r) {
      appleIdle();
      if (!r || !r.ok) { err('eG', tt('pkErr')); return; }
      r.via = 'Apple'; signedIn(r);
    }).catch(function () { appleIdle(); try { err('eG', tt('errNet')); } catch (e) {} });
  };
  RN.appleErr = function (code) {
    appleIdle();
    if (code !== 'cancel') { try { err('eG', tt('pkErr')); } catch (e) {} }
  };
  if (typeof signedIn === 'function') {
    var _si = signedIn;
    signedIn = function () { var r = _si.apply(this, arguments); setTimeout(afterAuth, 300); return r; };
  }

  /* 6. Notifications de l'iPhone (à la place des notifications web) */
  var wasAuth = !!authed();
  function afterAuth() {
    var a = !!authed();
    if (a && !wasAuth && RN.ps === 'default' && !RN.asked) { RN.asked = true; setTimeout(function () { send({ t: 'push' }); }, 1200); }
    wasAuth = a;
    regPush();
  }
  function regPush() {
    try {
      var A = authed(); if (!A || !RN.tok || RN.busy) return;
      var key = RN.tok + '|' + A.e;
      if (LS.get('rl_ntok') === key) return;
      RN.busy = 1;
      api({ app: 'cnpush', e: A.e, k: A.k, t: RN.tok, os: 'ios', lang: lg() }).then(function (r) {
        RN.busy = 0; if (r && r.ok) LS.set('rl_ntok', key);
      }).catch(function () { RN.busy = 0; });
    } catch (e) { RN.busy = 0; }
  }
  RN.push = function (d) {
    d = d || {};
    if (d.s) RN.ps = d.s;
    if (d.tok) RN.tok = d.tok;
    regPush();
    try { if (TAB === 'acc') pushUi(); } catch (e) {}
  };
  pushUi = function () {
    var el = $i('pushBox'); if (!el) return;
    if (!authed()) { el.innerHTML = ''; return; }
    if (RN.ps === 'granted') {
      el.innerHTML = '<div class="note" style="background:#E9F5EE;border-color:#BFE3CC;color:#1E5B38">' + esc(tt('notifOk')) + '</div>';
      return;
    }
    if (RN.ps === 'denied') {
      el.innerHTML = '<div class="note">' + esc(tt('notifNo')) + '<button class="btn" type="button" id="pset" style="margin-top:10px">' + esc(tx('set')) + '</button></div>';
      $i('pset').onclick = function () { send({ t: 'settings' }); };
      return;
    }
    el.innerHTML = '<div class="note">' + esc(tt('notifS')) + '<button class="btn gold" type="button" id="pon" style="margin-top:10px">' + esc(tt('notifOn')) + '</button></div>';
    $i('pon').onclick = function () { send({ t: 'push' }); };
  };

  /* 7. Factures : aperçu natif de l'iPhone (partager, enregistrer dans Fichiers, imprimer) */
  invShow = function (f) {
    try {
      var rd = new FileReader();
      rd.onload = function () {
        var s = String(rd.result || ''), i = s.indexOf(',');
        send({ t: 'file', name: f.name || 'Facture.pdf', type: f.type || '', b64: s.slice(i + 1) });
      };
      rd.readAsDataURL(f);
    } catch (e) {}
  };
  if (typeof getInv === 'function') {
    var _gi = getInv;
    getInv = function (x) {
      var had = false; try { had = !!INVF[x.ref]; } catch (e) {}
      var r = _gi.apply(this, arguments);
      if (!had) {
        var n = 0, iv = setInterval(function () {
          var f = null; try { f = INVF[x.ref]; } catch (e) {}
          if (f) { clearInterval(iv); invShow(f); } else if (++n > 80) clearInterval(iv);
        }, 250);
      }
      return r;
    };
  }

  /* 8. Position : demandée par l'appli (une seule autorisation, celle de l'iPhone) */
  try {
    var G = navigator.geolocation, gcb = {}, gid = 0;
    if (G) {
      G.getCurrentPosition = function (ok, ko) { var id = ++gid; gcb[id] = [ok, ko]; send({ t: 'geo', id: id }); };
      RN.geo = function (id, good, d) {
        var c = gcb[id]; if (!c) return; delete gcb[id]; d = d || {};
        if (good) {
          if (c[0]) c[0]({ coords: { latitude: d.lat, longitude: d.lng, accuracy: d.acc || 30, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() });
        } else if (c[1]) c[1]({ code: d.code || 2, message: '', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
      };
    }
  } catch (e) {}

  /* 9. Actualisation : tirer vers le bas, retour dans l'appli, notification reçue */
  RN.refresh = function () {
    try {
      var ro = $i('ride');
      if (ro && ro.classList.contains('on') && CUR) refreshRide(true);
      else if (TAB === 'rides') loadRides();
      else if (TAB === 'acc') renderAcc();
    } catch (e) {}
  };
  RN.pushed = function () {
    try {
      if (TAB === 'rides') loadRides();
      var ro = $i('ride');
      if (CUR && ro && ro.classList.contains('on')) refreshRide();
    } catch (e) {}
  };

  /* 10. Langue : noms des onglets pour la barre native */
  function labels() { send({ t: 'labels', lang: lg(), book: tt('tBook'), rides: tt('tRides'), acc: tt('tAcc') }); }
  ['langS', 'gLangS'].forEach(function (id) {
    var s = $i(id); if (s) s.addEventListener('change', function () { setTimeout(labels, 60); });
  });

  labels(); gs(); bs();
  var cur = 'book'; try { cur = TAB; } catch (e) {}
  send({ t: 'ready', tab: cur, auth: !!authed() });
})();
