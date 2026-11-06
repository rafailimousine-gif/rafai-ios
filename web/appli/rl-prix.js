/* ---------- rlPrix v1 : sur le web, le prix se voit sans compte ; la connexion arrive au moment de reserver (appli inchangee) ---------- */
(function rlPrix() {
  if (window.__rlNative || window.__rlTwa || /RafaiApp\//.test(navigator.userAgent) || window.__rlRideLink) return;
  window.__rlGuest = 1;
  var demande = false, attente = false;
  var MSG = {
    fr: 'Votre trajet et votre prix sont gardés. Connectez-vous ou créez votre compte pour confirmer.',
    en: 'Your trip and price are saved. Sign in or create your account to confirm.',
    ar: 'تم حفظ رحلتك وسعرها. سجّل الدخول أو أنشئ حسابك للتأكيد.',
    zh: '您的行程和价格已保存。请登录或创建账户以确认。'
  };
  var st = document.createElement('style');
  st.textContent = '.gate .gback{position:absolute;top:calc(14px + env(safe-area-inset-top));left:16px;margin:0;padding:6px 12px;' +
    'border:1px solid #2E2E33;border-radius:999px;background:#1C1C20;color:#fff;font:inherit;font-size:13px;font-weight:600;cursor:pointer}' +
    '[dir=rtl] .gate .gback{left:auto;right:16px}';
  (document.head || document.documentElement).appendChild(st);
  var bk = document.createElement('button');
  bk.type = 'button'; bk.id = 'gBack'; bk.className = 'gback hide';
  $('gate').querySelector('.gw').appendChild(bk);
  function besoin() { return demande || TAB !== 'book' || !$('b3').classList.contains('hide'); }
  function cacher() {
    $('gate').classList.remove('on');
    document.body.classList.remove('gon');
    document.documentElement.classList.remove('gon');
  }
  var _gs = gateShow, _gd = gateDraw, _t = tab, _sh = show;
  gateShow = function () {
    if (!auth() && !besoin()) { bk.classList.add('hide'); cacher(); return; }
    if (!auth()) demande = true;
    var r = _gs.apply(this, arguments), A = auth();
    bk.classList.toggle('hide', !!A);
    if (A) demande = false;
    if (A && attente && !$('gate').classList.contains('on')) {
      attente = false;
      try { step3(); show(3); } catch (x) {}
    }
    return r;
  };
  gateDraw = function () {
    var r = _gd.apply(this, arguments);
    bk.textContent = t('back');
    if (attente && GL.v === 'home') $('gS').textContent = MSG[L] || MSG.en;
    return r;
  };
  tab = function (n) {
    var r = _t.apply(this, arguments);
    if (n !== 'book' && !auth()) { demande = true; gateShow(); }
    return r;
  };
  show = function (n) {
    if (n === 3 && !auth()) { attente = true; demande = true; gateShow(); return; }
    return _sh.apply(this, arguments);
  };
  bk.addEventListener('click', function () {
    demande = false; attente = false; GL = { v: 'home', e: '' };
    if (TAB !== 'book') tab('book');
    if (!$('b3').classList.contains('hide')) _sh(2);
    gateShow();
  });
  gateShow();
})();
