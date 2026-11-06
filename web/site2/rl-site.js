/* Menu du site et mesure d'audience chargée après l'affichage */
(function () {
  var m = document.getElementById('rlmenu'), n = document.getElementById('rlnav');
  if (m) m.addEventListener('click', function () {
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
