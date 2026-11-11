/* Blocs (réservation, cartes…) : chargés juste après le premier affichage de la page, pour que le texte et la photo s'affichent d'abord */
(function () {
  var fait = false;
  function charge() {
    if (fait) return; fait = true;
    Array.prototype.forEach.call(document.querySelectorAll('iframe[data-src]'), function (f) {
      f.src = f.getAttribute('data-src'); f.removeAttribute('data-src');
    });
  }
  try {
    var po = new PerformanceObserver(function (l) {
      if (l.getEntries().some(function (e) { return e.name === 'first-contentful-paint'; })) { po.disconnect(); setTimeout(charge, 0); }
    });
    po.observe({ type: 'paint', buffered: true });
  } catch (e) {}
  /* secours : après le chargement, une fois une image affichée (deux images d'animation plus tard) */
  addEventListener('load', function () { requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(charge, 0); }); }); });
  setTimeout(charge, 4000);
})();
/* Photos de fond des sections plus bas : chargées quand le visiteur s'en approche */
(function () {
  var l = document.querySelectorAll('[data-bg]');
  if (!l.length) return;
  function met(e) { e.style.backgroundImage = 'url("' + e.getAttribute('data-bg') + '")'; e.removeAttribute('data-bg'); }
  if (!('IntersectionObserver' in window)) { Array.prototype.forEach.call(l, met); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (x) { if (x.isIntersecting) { io.unobserve(x.target); met(x.target); } });
  }, { rootMargin: '700px 0px' });
  Array.prototype.forEach.call(l, function (e) { io.observe(e); });
})();
/* Menu du site et mesure d'audience chargée après l'affichage */
(function () {
  var m = document.getElementById('rlmenu'), n = document.getElementById('rlnav');
  if (m) m.addEventListener('click', function () {
    var w = n.querySelector('nav');
    if (w) w.style.top = Math.max(0, n.getBoundingClientRect().bottom) + 'px';
    var o = n.classList.toggle('open');
    m.setAttribute('aria-expanded', o ? 'true' : 'false');
    document.body.style.overflow = o ? 'hidden' : '';
  });
  Array.prototype.forEach.call(document.querySelectorAll('#rlnav li.dd > button'), function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      var li = b.parentNode, o = li.classList.toggle('open');
      b.setAttribute('aria-expanded', o ? 'true' : 'false');
      if (window.innerWidth >= 900) Array.prototype.forEach.call(li.parentNode.children, function (x) { if (x !== li) x.classList.remove('open'); });
    });
  });
  document.addEventListener('click', function (e) {
    if (window.innerWidth < 900 || (e.target.closest && e.target.closest('#rlnav'))) return;
    Array.prototype.forEach.call(document.querySelectorAll('#rlnav li.open'), function (x) { x.classList.remove('open'); });
  });
  /* Agent IA : le bouton suit le visiteur sur toutes les pages, la conversation se charge au premier clic */
  (function () {
    var fab = document.getElementById('rlyfab'), tz = document.getElementById('rlytz');
    var h = document.documentElement, vv = window.visualViewport, fr = null;
    if (!fab) return;
    function fit() {
      if (!fr) return;
      var on = h.classList.contains('rly') && window.innerWidth < 600;
      fr.style.height = on ? (vv ? vv.height : window.innerHeight) + 'px' : '';
      fr.style.top = on ? (vv ? vv.offsetTop : 0) + 'px' : '';
    }
    function go() {
      var d = fr.contentDocument;
      d.body.classList.toggle('ph', window.innerWidth < 600);
      d.getElementById('fab').click();
    }
    function ouvre() {
      h.classList.add('rly');
      if (fr) { fit(); go(); return; }
      fr = document.createElement('iframe');
      fr.id = 'rlyframe';
      fr.title = fab.getAttribute('aria-label');
      fr.allow = 'geolocation; clipboard-write; microphone';
      fr.src = fab.getAttribute('data-src');
      fr.addEventListener('load', function () {
        var b = fr.contentDocument.body, was = false;
        new MutationObserver(function () {
          var o = b.classList.contains('open');
          if (was && !o) setTimeout(function () { if (!b.classList.contains('open')) { h.classList.remove('rly'); fit(); } }, 380);
          was = o;
        }).observe(b, { attributes: true, attributeFilter: ['class'] });
        go();
      });
      document.body.appendChild(fr);
      fit();
    }
    /* (ancienne ouverture automatique 15 s après l'arrivée : désactivée, voir plus bas) */
    var auto = null, fini = false;
    try { fini = sessionStorage.getItem('rl_yauto') === '1'; } catch (e) {}
    function stop() {
      fini = true;
      if (auto) { clearTimeout(auto); auto = null; }
      try { sessionStorage.setItem('rl_yauto', '1'); } catch (e) {}
    }
    function arme(ms) {
      if (fini) return;
      auto = setTimeout(function () {
        auto = null;
        if (fini) return;
        var nav = document.getElementById('rlnav');
        if (document.hidden || (nav && nav.classList.contains('open'))) { arme(4000); return; }
        stop();
        ouvre();
      }, ms);
    }
    window.addEventListener('blur', function () {
      setTimeout(function () {
        var a = document.activeElement;
        if (a && a.tagName === 'IFRAME' && a.classList.contains('rlif')) stop();
      }, 0);
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a[href*="booking.rafai-limousine.com"]')) stop();
    }, true);
    /* plus d'ouverture automatique (10 nov. 2026, demande de Yassine) : l'agent reste fermé, il s'ouvre seulement quand le client clique dessus */
    fab.addEventListener('click', function () { stop(); ouvre(); });
    if (tz) tz.addEventListener('click', function () { stop(); ouvre(); });
    if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); }
    window.addEventListener('resize', fit);
  })();
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  var EEA = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH'];
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', region: EEA });
  gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'denied', analytics_storage: 'granted' });
  gtag('js', new Date());
  gtag('config', 'AW-18537077612');
  gtag('config', 'G-FX5KTFL7W8');
  var d = 0;
  function go() {
    if (d) return; d = 1;
    var s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=AW-18537077612';
    document.head.appendChild(s);
  }
  ['pointerdown', 'keydown', 'scroll'].forEach(function (e) { addEventListener(e, go, { once: true, passive: true }); });
  setTimeout(go, 8000);
})();
/* Fenêtre « -10 % sur votre première course » (11 nov. 2026, demande de Yassine) : remplace la fenêtre « Ouvrir l'application ».
   Le visiteur donne prénom, nom, e-mail et téléphone → e-mail « Validez votre adresse » ; le lien de l'e-mail revient sur le site
   (?rlpromo=…) : adresse validée, code personnel RL10-XXXXX affiché (et envoyé par e-mail), bouton vers la réservation avec le code rempli.
   Ordinateur : fenêtre au centre de l'écran, fond assombri. Téléphone : fenêtre en bas.
   Une fois par visite, jamais dans l'appli, plus du tout une fois inscrit sur ce navigateur. Test : ?promo=1 */
(function () {
  var API = 'https://script.google.com/macros/s/AKfycbwrVkg7W2mb0onawqUJdwA4f-5LWAEvcDkEfpwtg-LWuD7TX5NlBClvSfbxx7WiipW5/exec';
  var BOOK = 'https://booking.rafai-limousine.com/';
  var AS = 'https://apps.apple.com/fr/app/rafai-limousine/id6829341896';
  var PL = 'https://play.google.com/store/apps/details?id=com.rafailimousine.client';
  var d = document, h = d.documentElement, w = window, ua = navigator.userAgent || '';
  if (w.__rlNative || /RafaiApp\//.test(ua)) return;
  var qs = location.search || '', tok = (qs.match(/[?&]rlpromo=([a-f0-9]{32,40})/i) || [])[1] || '', force = /[?&]promo=1(&|$)/.test(qs);
  var K = 'rl_promo_v1', KD = 'rl_promo_done';
  function st(o, k, v) { try { var x = w[o]; if (v === undefined) return x.getItem(k); x.setItem(k, v); } catch (e) {} return null; }
  if (!tok && !force && (st('localStorage', KD) || st('sessionStorage', K))) return;
  var ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1), and = /Android/.test(ua);
  var g = String(h.lang || navigator.language || 'en').slice(0, 2).toLowerCase() === 'fr' ? 'fr' : 'en';
  var TX = {
    fr: { pc: '-10 %', t: 'sur votre première course', s: 'Inscrivez-vous en 30 secondes : nous vous envoyons votre code personnel par e-mail.',
      fn: 'Prénom', ln: 'Nom', e: 'E-mail', tel: 'Téléphone', opt: 'Recevoir nos offres par e-mail (désinscription à tout moment)',
      go: 'Recevoir mon code -10 %', later: 'Plus tard', legal: 'Vos informations servent à vous envoyer votre code et à gérer vos réservations.', priv: 'Confidentialité',
      app: 'Ou téléchargez l’appli gratuite', wait: 'Envoi…',
      sentT: 'Vérifiez votre boîte mail', sentP: 'Nous avons envoyé un lien à {e}. Cliquez dessus pour valider votre adresse : votre code -10 % s’affichera aussitôt.',
      sentN: 'Pas reçu ? Regardez dans les courriers indésirables.', againT: 'Code renvoyé', againP: 'Votre code -10 % vous a été renvoyé par e-mail à {e}.',
      okT: 'Adresse validée', okP: 'Votre code personnel : -10 % sur votre première course', copy: 'Copier', copied: 'Copié ✓', book: 'Réserver avec -10 %',
      okN: 'Le code vous a aussi été envoyé par e-mail. Valable une seule fois.', usedP: 'Ce code a déjà été utilisé pour une réservation.', close: 'Fermer',
      err: { client: 'Cette offre est réservée aux nouveaux clients. Merci de votre fidélité !', deja: 'Un code a déjà été envoyé pour ce numéro de téléphone.',
        utilise: 'Votre code a déjà été utilisé.', quota: 'Trop de demandes : réessayez dans une heure.', champs: 'Merci de remplir tous les champs.',
        email: 'Adresse e-mail non valable.', jeton: 'Ce lien n’est pas valable. Réessayez depuis le site.', serveur: 'Une erreur est survenue, réessayez.' } },
    en: { pc: '10% off', t: 'your first ride', s: 'Sign up in 30 seconds: we will e-mail you your personal code.',
      fn: 'First name', ln: 'Last name', e: 'E-mail', tel: 'Phone', opt: 'Send me offers by e-mail (unsubscribe anytime)',
      go: 'Get my 10% off code', later: 'Not now', legal: 'Your details are only used to send your code and manage your bookings.', priv: 'Privacy',
      app: 'Or get the free app', wait: 'Sending…',
      sentT: 'Check your inbox', sentP: 'We sent a link to {e}. Click it to confirm your e-mail: your 10% off code will appear right away.',
      sentN: 'Nothing yet? Check your spam folder.', againT: 'Code sent again', againP: 'Your 10% off code was sent again to {e}.',
      okT: 'E-mail confirmed', okP: 'Your personal code: 10% off your first ride', copy: 'Copy', copied: 'Copied ✓', book: 'Book with 10% off',
      okN: 'We also sent the code by e-mail. Single use.', usedP: 'This code has already been used for a booking.', close: 'Close',
      err: { client: 'This offer is for new customers. Thank you for riding with us again!', deja: 'A code was already sent for this phone number.',
        utilise: 'Your code has already been used.', quota: 'Too many requests: please try again in an hour.', champs: 'Please fill in all the fields.',
        email: 'This e-mail address is not valid.', jeton: 'This link is not valid. Please try again from the website.', serveur: 'Something went wrong, please try again.' } }
  }, T = TX[g];
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var p, body, bg;
  function close() {
    if (p) p.remove(); if (bg) bg.remove(); h.classList.remove('rlchon', 'rlpmon');
    d.removeEventListener('keydown', esc1);
    st('sessionStorage', K, '1');
  }
  function esc1(e) { if (e.key === 'Escape') close(); }
  function shell() {
    p = d.createElement('div');
    p.id = 'rlch'; p.className = 'rlpm'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-labelledby', 'rlchT');
    p.innerHTML = '<button type="button" class="x" aria-label="' + esc(T.close) + '">×</button><div class="ph"></div>' +
      '<div class="bt"><div class="tp"><span class="lg"><img src="/img/logo.png" alt="" width="44" height="44"></span><b>RAFAI LIMOUSINE</b></div><div class="bd"></div></div>';
    body = p.querySelector('.bd');
    p.querySelector('.x').addEventListener('click', close);
    /* ordinateur : vraie fenêtre au centre, le reste de l'écran assombri (clic à côté ou Échap pour fermer) */
    bg = d.createElement('div'); bg.id = 'rlpmbg'; bg.addEventListener('click', close);
    d.addEventListener('keydown', esc1);
    d.body.appendChild(bg); d.body.appendChild(p); h.classList.add('rlchon', 'rlpmon');
  }
  function later() { return '<button type="button" class="st">' + esc(T.later) + '</button>'; }
  function wire() { var b = body.querySelector('button.st'); if (b) b.addEventListener('click', close); }
  function api(u, o) { return fetch(API + u, o).then(function (r) { return r.json(); }); }
  function form() {
    body.innerHTML = '<h2 id="rlchT"><span class="pc">' + esc(T.pc) + '</span> ' + esc(T.t) + '</h2><p>' + esc(T.s) + '</p>' +
      '<form class="pf" novalidate><div class="two"><input name="fn" autocomplete="given-name" placeholder="' + esc(T.fn) + '" aria-label="' + esc(T.fn) + '">' +
      '<input name="ln" autocomplete="family-name" placeholder="' + esc(T.ln) + '" aria-label="' + esc(T.ln) + '"></div>' +
      '<input name="e" type="email" autocomplete="email" inputmode="email" placeholder="' + esc(T.e) + '" aria-label="' + esc(T.e) + '">' +
      '<input name="tel" type="tel" autocomplete="tel" inputmode="tel" placeholder="' + esc(T.tel) + '" aria-label="' + esc(T.tel) + '">' +
      '<input name="hp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<label class="ck"><input type="checkbox" name="opt"> <span>' + esc(T.opt) + '</span></label>' +
      '<div class="er" role="alert"></div><button type="submit" class="go">' + esc(T.go) + '</button></form>' +
      '<small class="lgl">' + esc(T.legal) + ' <a href="/confidentialite">' + esc(T.priv) + '</a></small>' +
      ((ios || and) ? '<a class="app" href="' + (ios ? AS : PL) + '" target="_blank" rel="noopener">' + esc(T.app) + '</a>' : '') + later();
    wire();
    var f = body.querySelector('form'), er = body.querySelector('.er'), bt = f.querySelector('.go');
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = { fn: f.fn.value.trim(), ln: f.ln.value.trim(), e: f.e.value.trim(), tel: f.tel.value.trim(), opt: f.opt.checked, hp: f.hp.value, lang: g, src: location.pathname };
      [].forEach.call(f.querySelectorAll('input'), function (i) { i.classList.remove('bad'); });
      var miss = ['fn', 'ln', 'e', 'tel'].filter(function (k) { return !v[k]; });
      if (v.e && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.e)) miss.push('e');
      if (v.tel && v.tel.replace(/\D/g, '').length < 9) miss.push('tel');
      if (miss.length) { miss.forEach(function (k) { f[k].classList.add('bad'); }); er.textContent = miss.length === 1 && miss[0] === 'e' && v.e ? T.err.email : T.err.champs; return; }
      er.textContent = ''; bt.disabled = true; bt.textContent = T.wait;
      api('?app=cpjoin', { method: 'POST', body: JSON.stringify(v) }).then(function (r) {
        if (r && r.ok) {
          st('localStorage', KD, '1');
          try { w.gtag && w.gtag('event', 'generate_lead', { method: 'promo10' }); } catch (e) {}
          return sent(v.e, r.sent === 'code');
        }
        bt.disabled = false; bt.textContent = T.go;
        if (r && r.fields) r.fields.forEach(function (k) { if (f[k]) f[k].classList.add('bad'); });
        er.textContent = T.err[(r && r.err) || 'serveur'] || T.err.serveur;
      }).catch(function () { bt.disabled = false; bt.textContent = T.go; er.textContent = T.err.serveur; });
    });
  }
  function sent(e, again) {
    body.innerHTML = '<h2 id="rlchT">' + esc(again ? T.againT : T.sentT) + '</h2><p>' + esc((again ? T.againP : T.sentP).replace('{e}', e)) + '</p>' +
      (again ? '' : '<small class="lgl">' + esc(T.sentN) + '</small>') + '<button type="button" class="st">' + esc(T.close) + '</button>';
    wire();
  }
  function code(r) {
    var link = BOOK + '?promo=' + encodeURIComponent(r.code);
    body.innerHTML = '<h2 id="rlchT">' + esc(T.okT) + ' ✓</h2><p>' + esc(r.used ? T.usedP : T.okP) + '</p>' +
      '<div class="cd"><b>' + esc(r.code) + '</b><button type="button" class="cp">' + esc(T.copy) + '</button></div>' +
      (r.used ? '' : '<a class="go" href="' + esc(link) + '">' + esc(T.book) + '</a><small class="lgl">' + esc(T.okN) + '</small>') +
      '<button type="button" class="st">' + esc(T.close) + '</button>';
    wire();
    var cp = body.querySelector('.cp');
    cp.addEventListener('click', function () {
      try { navigator.clipboard.writeText(r.code).then(function () { cp.textContent = T.copied; }); } catch (e) {}
    });
  }
  function start() {
    if (d.getElementById('rlch')) return;
    shell();
    if (!tok) return form();
    /* retour du lien de l'e-mail : le jeton est retiré de l'adresse affichée */
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
    body.innerHTML = '<h2 id="rlchT">' + esc(T.wait) + '</h2>';
    api('?app=cpok&t=' + tok).then(function (r) {
      if (r && r.ok) { st('localStorage', KD, '1'); return code(r); }
      body.innerHTML = '<h2 id="rlchT">-10 %</h2><p>' + esc(T.err[(r && r.err) || 'serveur'] || T.err.serveur) + '</p>' + '<button type="button" class="st">' + esc(T.close) + '</button>';
      wire();
    }).catch(function () { body.innerHTML = '<p>' + esc(T.err.serveur) + '</p><button type="button" class="st">' + esc(T.close) + '</button>'; wire(); });
  }
  if (tok || force) { if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start(); }
  else setTimeout(start, 4000);
})();
/* Animations sur tout le site (10 nov. 2026, demande de Yassine) : les blocs apparaissent en douceur quand on descend,
   les cartes une par une ; reflet doré sur les boutons. Rien ne bouge si le visiteur a demandé moins d'animations. */
(function () {
  var d = document, w = window;
  try { if (w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
  if (!('IntersectionObserver' in w)) return;
  var st = d.createElement('style');
  st.textContent = '.rl-rv{opacity:0;transform:translateY(26px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}' +
    '.rl-rv.rl-in{opacity:1;transform:none}' +
    '.rl-rv.rl-z{transform:translateY(18px) scale(.97)}.rl-rv.rl-z.rl-in{transform:none}' +
    '.btn-dark,.rlsv .bk,.rlco .gold,.rlrt .b,.go .btn,.btn.book{position:relative;overflow:hidden}' +
    '.btn-dark:after,.rlsv .bk:after,.rlco .gold:after,.rlrt .b:after,.go .btn:after,.btn.book:after{content:"";position:absolute;top:-20%;bottom:-20%;left:0;width:40%;' +
    'background:linear-gradient(100deg,rgba(255,255,255,0),rgba(255,248,225,.55),rgba(255,255,255,0));transform:translateX(-160%) skewX(-18deg);animation:rlShine 4.5s ease-in-out 1.5s infinite;pointer-events:none}' +
    '@keyframes rlShine{0%{transform:translateX(-160%) skewX(-18deg)}35%,100%{transform:translateX(330%) skewX(-18deg)}}';
  d.head.appendChild(st);
  function isCards(el) {
    if (el.children.length < 3) return false;
    var cs = w.getComputedStyle(el);
    return cs.display.indexOf('grid') >= 0 || (cs.display.indexOf('flex') >= 0 && (cs.flexWrap === 'wrap' || el.classList.contains('car-x')));
  }
  var items = [];
  function mark(el, i, zoom) {
    if (!el || el.nodeType !== 1 || el.classList.contains('rl-rv')) return;
    var tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || el.id === 'rlyfab' || el.id === 'rlytz' || el.id === 'rlch') return;
    var r = el.getBoundingClientRect();
    if (r.height < 8 || r.top < w.innerHeight * 0.92) return;   // déjà à l'écran au chargement : on n'y touche pas
    el.classList.add('rl-rv'); if (zoom) el.classList.add('rl-z');
    if (i) el.style.transitionDelay = Math.min(i * 90, 450) + 'ms';
    items.push(el);
  }
  function walk(box, depth) {
    // descend tant qu'il n'y a qu'un seul enfant (enveloppes), puis anime les blocs ; les grilles de cartes une par une
    while (box && box.children.length === 1 && depth < 8) { box = box.children[0]; depth++; }
    if (!box) return;
    [].forEach.call(box.children, function (c) {
      if (isCards(c)) { [].forEach.call(c.children, function (k, i) { mark(k, i, true); }); }
      else mark(c, 0, false);
    });
  }
  function run() {
    var secs = d.querySelectorAll('main section, body > section, section.yaqOZd, .rlsv .q, .rlsv .end, .rlco > section, .rlco > .stats, .rlteam, footer');
    [].forEach.call(secs, function (s) { if (!s.closest('.rl-rv')) walk(s, 0); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('rl-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0.04 });
    items.forEach(function (el) { io.observe(el); });
    // bas de page atteint : tout ce qui reste s'affiche
    w.addEventListener('scroll', function () {
      if (w.innerHeight + w.scrollY >= d.documentElement.scrollHeight - 4) items.forEach(function (el) { el.classList.add('rl-in'); });
    }, { passive: true });
    // sécurité : tout s'affiche au bout de 6 s même si l'observateur ne se déclenche pas
    setTimeout(function () { items.forEach(function (el) { if (el.getBoundingClientRect().top < w.innerHeight) el.classList.add('rl-in'); }); }, 6000);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', run); else run();
})();
