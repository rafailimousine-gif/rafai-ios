/* ---------- rlLogin v1 : RL Driver, connexion par code e-mail quand le chauffeur n'a pas de lien personnel ---------- */
(function rlLogin() {
  if (window.__rlLogin) return;
  window.__rlLogin = 1;
  var st = document.createElement('style');
  st.textContent =
    '.rlgbg{position:fixed;inset:0;z-index:-1;pointer-events:none;background:#111113 url(/chauffeur/rl-login-bg.jpg) 50% 0/cover no-repeat}' +
    '.rlgbg:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(17,17,19,.6) 0,rgba(17,17,19,.12) 16%,rgba(17,17,19,.18) 30%,rgba(17,17,19,.82) 47%,#111113 60%)}' +
    '@media (min-width:700px){.rlgbg{background-size:auto 100%}.rlgbg:before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,#111113 calc(50% - 36vh),rgba(17,17,19,0) calc(50% - 22vh),rgba(17,17,19,0) calc(50% + 22vh),#111113 calc(50% + 36vh))}}' +
    'html.rlgon body{background:transparent!important}' +
    '.rlg{position:relative;max-width:420px;margin:0 auto;padding:min(40vh,360px) 18px 24px;text-align:center;color:var(--txt)}' +
    '.rlg h2{margin:0 0 6px;font-size:21px}' +
    '.rlg p{margin:0 0 18px;color:var(--mut);font-size:14.5px;line-height:1.45}' +
    '.rlg label{display:block;text-align:start;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);margin:0 0 6px}' +
    '.rlg input{display:block;width:100%;box-sizing:border-box;height:52px;padding:0 14px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--txt);font-size:17px;outline:none}' +
    '.rlg input:focus{border-color:var(--gold)}' +
    '.rlg input.rlc{text-align:center;font-size:26px;letter-spacing:.35em;font-weight:800}' +
    '.rlg .rlb{display:block;width:100%;height:54px;margin-top:14px;border:0;border-radius:14px;background:linear-gradient(180deg,var(--gold),var(--gold2));color:#111113;font-size:16.5px;font-weight:800;cursor:pointer}' +
    '.rlg .rlb[disabled]{opacity:.6}' +
    '.rlg .rll{display:inline-block;margin:16px 8px 0;background:none;border:0;color:var(--gold);font-size:14px;font-weight:700;cursor:pointer}' +
    '.rlg .rlm{min-height:20px;margin-top:12px;font-size:14px;color:var(--mut)}' +
    '.rlg .rlm.ko{color:var(--red)}' +
    '.rlg .rlh{margin-top:22px;font-size:13px;color:var(--dim)}';
  (document.head || document.documentElement).appendChild(st);

  var S = { step: 'mail', mail: '' }, FACE = window.__rlFace || '';
  function nat(m) { try { window.webkit.messageHandlers.rn.postMessage(m); return true; } catch (e) { return false; } }
  /* appli iPhone : Face ID (si le chauffeur l'a activé) et collage du lien personnel */
  window.RLL = {
    faceOff: function (still) { if (!still) FACE = ''; S.step = 'mail'; draw(); msg(still ? '' : 'Connectez-vous avec le code reçu par e-mail.'); }
  };
  try { S.mail = localStorage.getItem('rl_drv_mail') || ''; } catch (e) {}
  function api(q) {
    return fetch(APP + '?' + q + '&_=' + Date.now(), { cache: 'no-store', credentials: 'omit' }).then(function (r) { return r.json(); });
  }
  function el(id) { return document.getElementById(id); }
  function msg(t, ko) { var m = el('rlm'); if (m) { m.textContent = t || ''; m.className = 'rlm' + (ko ? ' ko' : ''); } }
  function busy(b) { var x = el('rlgo'); if (x) x.disabled = !!b; }

  function draw() {
    var L = el('list'); if (!L) return;
    var sub = el('sub'); if (sub) sub.textContent = 'Connexion chauffeur';
    document.documentElement.classList.add('rlgon');
    if (!el('rlgbg')) { var bgd = document.createElement('div'); bgd.id = 'rlgbg'; bgd.className = 'rlgbg'; document.body.insertBefore(bgd, document.body.firstChild); }
    var h = '<div class="rlg">';
    if (S.step === 'mail') {
      if (FACE) h += '<button class="rlb" id="rlface" type="button" style="margin:0 0 22px">Entrer avec ' + FACE + '</button>';
      h += '<h2>Connexion</h2><p>Entrez l’adresse e-mail enregistrée chez Rafai Limousine. Vous recevrez un code à 6 chiffres.</p>' +
        '<form id="rlf" novalidate><label for="rle">E-mail</label>' +
        '<input id="rle" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="prenom@exemple.fr">' +
        '<button class="rlb" id="rlgo" type="submit">Recevoir mon code</button></form>' +
        '<button class="rll" id="rllk" type="button">J’ai reçu un lien personnel</button>';
    } else if (S.step === 'link') {
      h += '<h2>Lien personnel</h2><p>Collez le lien reçu de Rafai Limousine par SMS, WhatsApp ou e-mail.</p>' +
        '<form id="rlf" novalidate><label for="rlu">Lien</label>' +
        '<input id="rlu" type="url" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="https://team.rafai-limousine.com/chauffeur/…">' +
        '<button class="rlb" id="rlgo" type="submit">Ouvrir mes missions</button></form>' +
        '<button class="rll" id="rlch" type="button">Recevoir un code par e-mail</button>';
    } else {
      h += '<h2>Votre code</h2><p>Si <b></b> est enregistrée chez Rafai Limousine, un code vient d’y être envoyé. Il est valable 15 minutes.</p>' +
        '<form id="rlf" novalidate><label for="rlk">Code à 6 chiffres</label>' +
        '<input id="rlk" class="rlc" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••">' +
        '<button class="rlb" id="rlgo" type="submit">Valider</button></form>' +
        '<button class="rll" id="rlre" type="button">Renvoyer le code</button><button class="rll" id="rlch" type="button">Changer d’adresse</button>';
    }
    h += '<div class="rlm" id="rlm" role="status"></div>' +
      '<div class="rlh">Un souci ? Appelez Rafai Limousine au +33 6 67 09 94 94.</div></div>';
    L.innerHTML = h;
    if (S.step === 'code') { L.querySelector('.rlg p b').textContent = S.mail; }
    var f = el('rlf');
    f.addEventListener('submit', function (ev) { ev.preventDefault(); S.step === 'mail' ? sendMail() : S.step === 'link' ? useLink() : sendCode(); });
    if (S.step === 'mail') {
      var i = el('rle'); i.value = S.mail;
      el('rllk').onclick = function () { S.step = 'link'; draw(); };
      if (el('rlface')) el('rlface').onclick = function () { msg(''); if (!nat({ t: 'faceid' })) { FACE = ''; draw(); } };
    } else if (S.step === 'link') {
      el('rlch').onclick = function () { S.step = 'mail'; draw(); };
    }
    else {
      var k = el('rlk');
      k.addEventListener('input', function () { k.value = k.value.replace(/\D/g, '').slice(0, 6); if (k.value.length === 6) sendCode(); });
      el('rlre').onclick = function () { sendMail(true); };
      el('rlch').onclick = function () { S.step = 'mail'; draw(); };
    }
  }
  function useLink() {
    var v = String(el('rlu').value || '').trim(), m = v.match(/\/chauffeur\/([^\/?#\s]+)/), a = m ? m[1] : v;
    try { a = decodeURIComponent(a); } catch (e) {}
    if (!/^[^.]+\.[A-Za-z0-9_-]{16,}$/.test(a)) { msg('Ce n’est pas un lien Rafai Limousine valide. Copiez le lien complet, puis réessayez.', true); return; }
    try { localStorage.setItem('rc_auth', a); } catch (e) {}
    location.replace('/chauffeur/' + encodeURIComponent(a));
  }
  function sendMail(again) {
    var e = S.step === 'mail' ? String(el('rle').value || '').trim().toLowerCase() : S.mail;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) { msg('Vérifiez l’adresse e-mail.', true); return; }
    busy(1); msg('Envoi…');
    api('app=drvlogin&e=' + encodeURIComponent(e)).then(function (j) {
      busy(0);
      if (j && j.ok) {
        S.mail = e; try { localStorage.setItem('rl_drv_mail', e); } catch (x) {}
        S.step = 'code'; draw();
        msg(again ? 'Nouveau code envoyé si l’adresse est enregistrée.' : '');
        var k = el('rlk'); if (k) k.focus();
      } else msg(j && j.err === 'quota' ? 'Trop de demandes. Réessayez dans une heure ou appelez Rafai Limousine.' : 'Vérifiez l’adresse e-mail.', true);
    }).catch(function () { busy(0); msg('Pas de connexion internet. Réessayez.', true); });
  }
  function sendCode() {
    var k = el('rlk'), c = String(k && k.value || '').replace(/\D/g, '');
    if (c.length !== 6) { msg('Le code fait 6 chiffres.', true); return; }
    if (sendCode.on) return; sendCode.on = 1;
    busy(1); msg('Vérification…');
    api('app=drvverify&e=' + encodeURIComponent(S.mail) + '&code=' + c).then(function (j) {
      sendCode.on = 0; busy(0);
      if (j && j.ok && j.auth) {
        msg('Connexion réussie.');
        try { localStorage.setItem('rc_auth', j.auth); } catch (x) {}
        nat({ t: 'auth', auth: j.auth });
        location.replace('/chauffeur/' + encodeURIComponent(j.auth));
      } else {
        msg(j && j.err === 'expire' ? 'Code expiré ou trop d’essais. Demandez un nouveau code.' : 'Code incorrect. Vérifiez et réessayez.', true);
        if (k) { k.value = ''; k.focus(); }
      }
    }).catch(function () { sendCode.on = 0; busy(0); msg('Pas de connexion internet. Réessayez.', true); });
  }

  /* appli : une fois connecté, demander la localisation et les notifications dès l'ouverture (pas seulement au début d'une course) */
  var LOC = { busy: 0, err: '' };
  function locOk() { try { return localStorage.getItem('rl_loc_ok') === '1'; } catch (e) { return false; } }
  function askLoc(auto) {
    if (LOC.busy || !navigator.geolocation) return;
    LOC.busy = 1; LOC.err = '';
    navigator.geolocation.getCurrentPosition(function () {
      LOC.busy = 0; try { localStorage.setItem('rl_loc_ok', '1'); } catch (e) {} perms();
    }, function (e) {
      LOC.busy = 0;
      if (!auto) LOC.err = e && e.code === 1 ? 'Localisation refusée : ouvrez Réglages › RL Driver › Position et choisissez « Toujours ».' : 'Position introuvable pour l’instant. Réessayez dehors ou près d’une fenêtre.';
      perms();
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  }
  function perms() {
    var L = el('list'); if (!L || !window.__rlNative || !ID || !KEY) return;
    var c = el('rlperm'), ps = (window.RN && RN.ps) || 'default', lo = locOk();
    if (lo && ps === 'granted') { if (c) c.parentNode.removeChild(c); return; }
    if (!c) { c = document.createElement('div'); c.id = 'rlperm'; c.className = 'rlpm'; }
    if (L.firstChild !== c) L.insertBefore(c, L.firstChild);
    var h = '<b>Préparez votre téléphone</b><span>Pour recevoir vos missions et partager la position de la voiture pendant les courses.</span>';
    h += lo ? '<div class="rlpok">✓ Localisation activée</div>' : '<button type="button" class="rlb" id="rlploc">📍 Activer la localisation</button>';
    if (ps === 'granted') h += '<div class="rlpok">✓ Notifications activées</div>';
    else if (ps === 'denied') h += '<button type="button" class="rlb rlb2" id="rlpset">🔔 Autoriser les notifications dans Réglages</button>';
    else h += '<button type="button" class="rlb" id="rlpnot">🔔 Activer les notifications</button>';
    if (LOC.err) h += '<div class="rlperr">' + LOC.err + '</div><button type="button" class="rlb rlb2" id="rlpset2">Ouvrir les réglages</button>';
    c.innerHTML = h;
    if (el('rlploc')) el('rlploc').onclick = function () { askLoc(false); };
    if (el('rlpnot')) el('rlpnot').onclick = function () { nat({ t: 'push' }); };
    if (el('rlpset')) el('rlpset').onclick = function () { nat({ t: 'settings' }); };
    if (el('rlpset2')) el('rlpset2').onclick = function () { nat({ t: 'settings' }); };
  }
  /* déconnexion : efface l'accès gardé dans le navigateur de l'appli et revient à l'écran de connexion */
  function logoutBtn() {
    var L = el('list'); if (!L || !ID || !KEY || el('rllo')) return;
    var d = document.createElement('div'); d.id = 'rllo'; d.className = 'rllo';
    d.innerHTML = '<button type="button" id="rllogout">Se déconnecter</button>';
    L.appendChild(d);
    el('rllogout').onclick = function () {
      if (!confirm('Se déconnecter de RL Driver ? Vous pourrez revenir avec un code reçu par e-mail.')) return;
      try {
        var ks = [];
        for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^rc_/.test(k)) ks.push(k); }
        ks.forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
      nat({ t: 'logout' });
      location.replace('/chauffeur/');
    };
  }
  var pst = document.createElement('style');
  pst.textContent = '.rlpm{margin:12px 0 16px;padding:16px;border-radius:18px;background:var(--card);border:1px solid var(--gold2);color:var(--txt);text-align:start}' +
    '.rlpm b{display:block;font-size:17px;margin-bottom:4px}.rlpm span{display:block;color:var(--mut);font-size:14px;line-height:1.4;margin-bottom:6px}' +
    '.rlpm .rlb{display:block;width:100%;height:50px;margin-top:10px;border:0;border-radius:14px;background:linear-gradient(180deg,var(--gold),var(--gold2));color:#111113;font-size:16px;font-weight:800}' +
    '.rlpm .rlb2{background:transparent;border:1px solid var(--line);color:var(--txt)}' +
    '.rlpok{margin-top:10px;color:var(--ok);font-weight:700;font-size:15px}.rlperr{margin-top:10px;color:var(--red);font-size:14px;line-height:1.4}' +
    '.rllo{text-align:center;margin:26px 0 10px}.rllo button{background:none;border:1px solid var(--line);border-radius:12px;color:var(--mut);font-size:14.5px;font-weight:700;padding:11px 20px;cursor:pointer}';
  (document.head || document.documentElement).appendChild(pst);
  if (window.RN && typeof RN.push === 'function') {
    var _push = RN.push;
    RN.push = function () { var r = _push.apply(this, arguments); setTimeout(perms, 0); return r; };
  }

  if (typeof render === 'function') {
    var _render = render;
    render = function () {
      if (!ID || !KEY) { if (!el('rlf')) draw(); return; }
      var r = _render.apply(this, arguments);
      perms();
      logoutBtn();
      return r;
    };
  }
  if (ID && KEY && window.__rlNative) {
    setTimeout(function () { perms(); if (!locOk()) askLoc(true); }, 1200);
  }
  if (!ID || !KEY) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', draw); else draw();
  }
})();
