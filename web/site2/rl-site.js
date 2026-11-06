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
  /* Youri : le bouton suit le visiteur sur toutes les pages, la conversation se charge au premier clic */
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
      if (tz) tz.hidden = true;
      h.classList.add('rly');
      if (fr) { fit(); go(); return; }
      fr = document.createElement('iframe');
      fr.id = 'rlyframe';
      fr.title = 'Youri';
      fr.allow = 'geolocation; clipboard-write';
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
    fab.addEventListener('click', ouvre);
    if (tz) {
      tz.addEventListener('click', ouvre);
      var vu = false;
      try { vu = sessionStorage.getItem('rl_ytz') === '1'; sessionStorage.setItem('rl_ytz', '1'); } catch (e) {}
      if (!vu) setTimeout(function () {
        if (!h.classList.contains('rly')) tz.hidden = false;
        setTimeout(function () { tz.hidden = true; }, 9000);
      }, 2500);
    }
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
  setTimeout(go, 3500);
})();
