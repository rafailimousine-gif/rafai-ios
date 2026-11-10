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
    /* Ouverture automatique : 15 s après l'arrivée, une seule fois par visite,
       sauf si le visiteur a déjà touché à la réservation (ou à un autre bloc) ou ouvert l'agent */
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
    arme(15000);
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
/* Petite fenêtre en bas sur téléphone (le site reste visible) : ouvrir l'appli (App Store sur iPhone, Google Play sur Android), lien ou × pour rester sur le site.
   Une fois par visite. Test : ?appchoix=ios ou ?appchoix=android */
(function () {
  var AS = 'https://apps.apple.com/fr/app/rafai-limousine/id6829341896';
  var PL = 'https://play.google.com/store/apps/details?id=com.rafailimousine.client';
  var K = 'rl_app_choix_v2', ua = navigator.userAgent || '', f = '';
  try { f = (location.search.match(/[?&]appchoix=(ios|android)/) || [])[1] || ''; } catch (e) {}
  var ios = f === 'ios' || (!f && (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)));
  var and = f === 'android' || (!f && /Android/.test(ua));
  if (!ios && !and) return;
  if (!f) { try { if (sessionStorage.getItem(K)) return; } catch (e) {} }
  var TX = {
    fr: ['Votre chauffeur privé à Paris', 'Réservez en quelques secondes, prix fixe annoncé à l’avance, suivez votre chauffeur en direct.', 'Ouvrir l’application', 'Rester sur le site', ['Gratuit sur l’App Store', 'Gratuit sur Google Play'], 'Fermer'],
    en: ['Your private chauffeur in Paris', 'Book in seconds, fixed price upfront, follow your chauffeur live.', 'Open the app', 'Stay on the website', ['Free on the App Store', 'Free on Google Play'], 'Close'],
    zh: ['您在巴黎的私人司机', '几秒钟完成预订，价格提前确定，实时查看您的司机。', '打开应用', '留在网站', ['免费下载 · App Store', '免费下载 · Google Play'], '关闭'],
    ar: ['سائقك الخاص في باريس', 'احجز في ثوانٍ، سعر ثابت مسبقًا، وتابع سائقك مباشرة.', 'فتح التطبيق', 'البقاء على الموقع', ['مجاني على App Store', 'مجاني على Google Play'], 'إغلاق']
  };
  var g = String(document.documentElement.lang || navigator.language || 'en').slice(0, 2).toLowerCase(), T = TX[g] || TX.en;
  var d = document, h = d.documentElement, p = d.createElement('div');
  p.id = 'rlch'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-labelledby', 'rlchT');
  p.dir = g === 'ar' ? 'rtl' : 'ltr';
  p.innerHTML = '<button type="button" class="x">×</button><div class="ph"></div>' +
    '<div class="bt"><div class="tp"><span class="lg"><img src="/img/logo.png" alt="" width="44" height="44"></span><b>RAFAI LIMOUSINE</b></div>' +
    '<h2 id="rlchT"></h2><p></p><a class="go" target="_blank" rel="noopener"></a><small class="sto"></small>' +
    '<button type="button" class="st"></button></div>';
  p.querySelector('h2').textContent = T[0];
  p.querySelector('p').textContent = T[1];
  var o = p.querySelector('a.go'), s = p.querySelector('button.st');
  o.textContent = T[2]; o.href = ios ? AS : PL; s.textContent = T[3];
  p.querySelector('.sto').textContent = T[4][ios ? 0 : 1];
  function close() {
    p.remove(); h.classList.remove('rlchon');
    try { sessionStorage.setItem(K, '1'); } catch (e) {}
  }
  o.addEventListener('click', function () { setTimeout(close, 300); });
  s.addEventListener('click', close);
  var x = p.querySelector('.x'); x.setAttribute('aria-label', T[5]); x.addEventListener('click', close);
  d.body.appendChild(p); h.classList.add('rlchon');
  try { o.focus({ preventScroll: true }); } catch (e) {}
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
