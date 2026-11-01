/* ---------- Appli iPhone Rafai Limousine : la page s'adapte quand elle est ouverte dans l'appli (window.__rlNative posé par l'appli) ---------- */
(function () {
  if (!window.__rlNative || window.__rnInit) return;
  window.__rnInit = 1;
  document.documentElement.classList.add('rn-app');
  function send(m) { try { window.webkit.messageHandlers.rn.postMessage(m); } catch (e) {} }
  function $i(id) { return document.getElementById(id); }
  var RN = window.RN = { ps: 'default', tok: '', asked: false, busy: 0 };
  var TX = {
    fr: { apple: 'Continuer avec Apple', set: 'Ouvrir les réglages', or: 'ou' },
    en: { apple: 'Continue with Apple', set: 'Open Settings', or: 'or' },
    ar: { apple: 'المتابعة باستخدام Apple', set: 'فتح الإعدادات', or: 'أو' },
    zh: { apple: '通过 Apple 继续', set: '打开设置', or: '或' }
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

  /* 5. Connexion : bouton natif « Continuer avec Apple » (Face ID) à la place des boutons web Apple et Google,
        affiché dès que le serveur accepte la connexion Apple de l'appli (CFG.appleApp) */
  function addApple() {
    var f = $i('gateF'); if (!f || $i('gA')) return;
    var w = document.createElement('div');
    w.innerHTML = '<button class="btn sso rn-ap" type="button" id="gA"><i></i><span></span></button><div class="gor"></div>';
    var b = w.children[0], g = w.children[1], first = f.firstChild;
    b.querySelector('span').textContent = tx('apple');
    g.textContent = tt('gOr') || tx('or');
    f.insertBefore(b, first);
    if (!f.querySelector('.gor')) f.insertBefore(g, first);
    b.onclick = function () {
      try { err('eG', ''); } catch (e) {}
      try { busyBtn(b, true); } catch (e) {}
      send({ t: 'apple' });
    };
  }
  function appleIdle() { var b = $i('gA'); if (b) { try { busyBtn(b, false); } catch (e) {} } }
  if (typeof gateDraw === 'function') {
    var _gd = gateDraw;
    gateDraw = function () {
      var c = cfg(), sa = c && c.apple, sg = c && c.gid;
      if (c) { c.apple = ''; c.gid = ''; }
      try { _gd.apply(this, arguments); } finally { if (c) { c.apple = sa; c.gid = sg; } }
      try { if (GL.v === 'home' && c && c.appleApp) addApple(); } catch (e) {}
    };
    if (gate && gate.classList.contains('on')) { try { gateDraw(); } catch (e) {} }
  }
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
