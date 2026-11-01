/* ---------- Appli iPhone RL Driver : la page s'adapte quand elle est ouverte dans l'appli (window.__rlNative posé par l'appli) ---------- */
(function () {
  if (!window.__rlNative || window.__rnInit) return;
  window.__rnInit = 1;
  document.documentElement.classList.add('rn-app');
  function send(m) { try { window.webkit.messageHandlers.rn.postMessage(m); } catch (e) {} }
  var RN = window.RN = { ps: 'default', tok: '', busy: 0, asked: false };

  /* 1. GPS : l'appli suit la voiture pendant la course, même sur Waze ou écran verrouillé (remplace Overland) */
  tkOv = function () { return ''; };
  var lastGps = null;
  function gpsState() {
    var x = null; try { x = tkActive(); } catch (e) {}
    var m = x ? { t: 'gps', on: true, ref: x.ref, k: x.k, api: APP } : { t: 'gps', on: false }, key = JSON.stringify(m);
    if (key === lastGps) return;
    lastGps = key; send(m);
  }
  var _on = tkGpsOn, _off = tkGpsOff;
  tkGpsOn = function () { var r = _on.apply(this, arguments); gpsState(); return r; };
  tkGpsOff = function () { var r = _off.apply(this, arguments); gpsState(); return r; };
  gpsUi = function () {
    var el = $('gps'); if (!el) return;
    var x = null; try { x = tkActive(); } catch (e) {}
    el.innerHTML = x ? '<div class="gpsok">📍 GPS de l’appli actif pendant la course, même sur Waze ou écran verrouillé.</div>' : '';
  };
  /* position : fournie par l'iPhone (une seule autorisation) */
  try {
    var G = navigator.geolocation, W = {}, wn = 0, cbs = {}, gn = 0;
    var pos = function (d) { return { coords: { latitude: d.lat, longitude: d.lng, accuracy: d.acc || 30, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() }; };
    if (G) {
      G.getCurrentPosition = function (ok, ko) { var id = ++gn; cbs[id] = [ok, ko]; send({ t: 'geo', id: id }); };
      G.watchPosition = function (ok, ko) { var id = ++wn; W[id] = [ok, ko]; send({ t: 'watch', on: true }); return id; };
      G.clearWatch = function (id) { delete W[id]; if (!Object.keys(W).length) send({ t: 'watch', on: false }); };
      RN.geo = function (id, good, d) {
        var c = cbs[id]; if (!c) return; delete cbs[id]; d = d || {};
        if (good) { if (c[0]) c[0](pos(d)); }
        else if (c[1]) c[1]({ code: d.code || 2, message: '', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
      };
      RN.loc = function (d) { var p = pos(d || {}); Object.keys(W).forEach(function (k) { try { W[k][0](p); } catch (e) {} }); };
    }
  } catch (e) {}
  /* l'appli a envoyé une position en arrière-plan : la page se met à jour au retour */
  RN.bg = function (s) {
    try { var x = tkActive(); if (x && s && (s.st || '') !== (tkS(x).st || '')) tkApply(x.ref, s); } catch (e) {}
  };

  /* 2. Notifications de l'iPhone (à la place des notifications web) */
  function regPush() {
    if (!ID || !KEY || !RN.tok || RN.busy) return;
    var key = RN.tok + '|' + ID;
    try { if (LS.get('rc_ntok') === key) return; } catch (e) {}
    RN.busy = 1;
    fetch(APP + '?app=drvnpush&id=' + encodeURIComponent(ID) + '&k=' + encodeURIComponent(KEY) + '&t=' + encodeURIComponent(RN.tok) + '&os=ios&_=' + Date.now(), { cache: 'no-store', credentials: 'omit' })
      .then(function (r) { return r.json(); })
      .then(function (j) { RN.busy = 0; if (j && j.ok) { try { LS.set('rc_ntok', key); } catch (e) {} } })
      .catch(function () { RN.busy = 0; });
  }
  pushUi = function () {
    var el = $('push'); if (!el) return;
    if (!ID || !KEY) { el.innerHTML = ''; return; }
    if (RN.ps === 'granted') { el.innerHTML = ''; try { $('pushst').textContent = 'Notifications de mission activées sur ce téléphone.'; } catch (e) {} return; }
    if (RN.ps === 'denied') {
      el.innerHTML = '<div class="note warn">Notifications bloquées : autorisez-les dans Réglages › RL Driver › Notifications pour être prévenu de chaque mission.<button class="btn" type="button" id="pset" style="margin-top:10px">Ouvrir les réglages</button></div>';
      $('pset').onclick = function () { send({ t: 'settings' }); };
      return;
    }
    el.innerHTML = '<div class="note"><b style="color:var(--txt)">Soyez prévenu de chaque mission</b><br>Une notification dès qu’une course vous est confiée, modifiée ou annulée, même appli fermée.<button class="btn gold" type="button" id="pushon" style="margin-top:10px">Activer les notifications</button></div>';
    $('pushon').onclick = function () { send({ t: 'push' }); };
  };
  RN.push = function (d) {
    d = d || {};
    if (d.s) RN.ps = d.s;
    if (d.tok) RN.tok = d.tok;
    if (ID && KEY && RN.ps === 'default' && !RN.asked) { RN.asked = true; setTimeout(function () { send({ t: 'push' }); }, 1500); }
    regPush();
    try { pushUi(); } catch (e) {}
  };
  RN.pushed = function () { try { load(false); } catch (e) {} };

  /* 3. Première ouverture : coller le lien personnel reçu par SMS, WhatsApp ou e-mail */
  function useLink(v) {
    var s = String(v || '').trim(), m = s.match(/\/chauffeur\/([^\/?#\s]+)/), a = m ? m[1] : s;
    try { a = decodeURIComponent(a); } catch (e) {}
    if (!/^[^.]+\.[A-Za-z0-9_-]{16,}$/.test(a)) return false;
    try { LS.set('rc_auth', a); } catch (e) {}
    location.href = '/chauffeur/' + encodeURIComponent(a);
    return true;
  }
  RN.pasted = function (t) {
    var i = $('rnLink'); if (i && t) i.value = t;
    if (!useLink(t)) { var e = $('rnErr'); if (e) e.textContent = 'Ce n’est pas un lien Rafai Limousine valide. Copiez le lien complet reçu par SMS, puis réessayez.'; }
  };
  function drawLink() {
    var L0 = $('list'); if (!L0 || $('rnLink')) return;
    try { $('sub').textContent = 'Lien personnel requis'; } catch (e) {}
    L0.innerHTML = '<div class="empty"><img src="/chauffeur/icon-192.png" alt=""><b>Bienvenue</b>Collez le lien personnel envoyé par Rafai Limousine (SMS, WhatsApp ou e-mail) pour voir vos missions.' +
      '<button class="btn gold" type="button" id="rnPaste" style="margin-top:16px">Coller mon lien</button>' +
      '<input id="rnLink" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="https://team.rafai-limousine.com/chauffeur/…" style="display:block;width:100%;box-sizing:border-box;margin-top:12px;padding:13px 14px;border-radius:14px;border:1px solid #3A3A3F;background:#1C1C20;color:#fff;font:inherit;font-size:16px">' +
      '<button class="btn" type="button" id="rnGo" style="margin-top:10px">Ouvrir mes missions</button><p id="rnErr" style="color:#FF8A65;margin:10px 0 0;font-size:14px"></p></div>';
    $('rnPaste').onclick = function () { send({ t: 'paste' }); };
    $('rnGo').onclick = function () { RN.pasted($('rnLink').value); };
  }
  var _render = render;
  render = function () {
    if (!ID || !KEY) { drawLink(); return; }
    var r = _render.apply(this, arguments);
    try { tkGps(); } catch (e) {}
    gpsState();
    return r;
  };
  if (!ID || !KEY) drawLink();

  send({ t: 'ready', id: !!(ID && KEY) });
  gpsState();
})();
