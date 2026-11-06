/* ---------- rlAccueil v1 : appli Rafai Limousine, écran de bienvenue animé et photo de fond de l'onglet Réserver ---------- */
(function rlAccueil() {
  var inApp = window.__rlPv || window.__rlNative || window.__rlTwa || /RafaiApp\//.test(navigator.userAgent);
  if (!inApp || window.__rlAccueil) return;
  window.__rlAccueil = 1;
  var FOND = window.__rlFond || '/rl-fond.jpg', LOGO = window.__rlLogo || '/icon-192.png';
  var css =
    'html:has(#v-book:not(.hide)) body{background:#0c0c0e}' +
    '#rlBg{display:none;position:fixed;inset:0;z-index:0;pointer-events:none;background:#0c0c0e url(' + FOND + ') center top/100% auto no-repeat}' +
    'html:has(#v-book:not(.hide)) #rlBg{display:block}' +
    '#rlBg:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,12,14,.5) 0,rgba(12,12,14,.12) 22%,rgba(12,12,14,.3) 36%,rgba(12,12,14,.9) 52%,#0c0c0e 62%)}' +
    '.wrap{position:relative;z-index:1}' +
    '#v-book .hero{background:none;box-shadow:none;border:0;min-height:236px;padding-top:6px;text-shadow:0 2px 14px rgba(0,0,0,.75)}' +
    'html:has(#v-book:not(.hide)) .legal,html:has(#v-book:not(.hide)) .legal a{color:#b9b4aa}' +
    '#rlBv{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(70% 45% at 50% 44%,#2a2115 0,#0c0c0e 70%);animation:rlOut .55s ease-in 2.35s forwards;-webkit-user-select:none;user-select:none}' +
    '#rlBv .lg{position:relative;width:128px;height:128px;border-radius:28px;overflow:hidden;box-shadow:0 18px 50px -14px rgba(201,160,99,.55);animation:rlIn .8s cubic-bezier(.2,.8,.2,1) both}' +
    '#rlBv .lg img{display:block;width:100%;height:100%}' +
    '#rlBv .lg:after{content:"";position:absolute;inset:-20%;background:linear-gradient(115deg,transparent 42%,rgba(255,236,200,.75) 50%,transparent 58%);transform:translateX(-90%);animation:rlSh .9s ease-in-out .75s forwards}' +
    '#rlBv .tx{margin-top:26px;font:700 25px/1.25 Manrope,-apple-system,system-ui,sans-serif;letter-spacing:-.01em;color:#fff;opacity:0;animation:rlUp .6s ease-out .55s forwards}' +
    '#rlBv .tx b{font-weight:800;background:linear-gradient(90deg,#E4C47E,#B8904F);-webkit-background-clip:text;background-clip:text;color:transparent}' +
    '#rlBv .ln{width:72px;height:2px;margin-top:16px;background:linear-gradient(90deg,transparent,#C9A063,transparent);transform:scaleX(0);animation:rlLn .7s ease-out .95s forwards}' +
    '@keyframes rlIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}' +
    '@keyframes rlUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}' +
    '@keyframes rlLn{to{transform:scaleX(1)}}' +
    '@keyframes rlSh{to{transform:translateX(90%)}}' +
    '@keyframes rlOut{to{opacity:0;transform:scale(1.04);visibility:hidden}}' +
    '@media (prefers-reduced-motion:reduce){#rlBv,#rlBv *{animation-duration:.01s!important;animation-delay:0s!important}#rlBv{animation-delay:1.6s!important}}';
  var st = document.createElement('style');
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
  function start() {
    var bg = document.createElement('div');
    bg.id = 'rlBg';
    document.body.insertBefore(bg, document.body.firstChild);
    var vu = false;
    try { vu = sessionStorage.getItem('rl_bv') === '1'; sessionStorage.setItem('rl_bv', '1'); } catch (e) {}
    if (vu && !window.__rlPv) return;
    var lg = 'fr';
    try { lg = L; } catch (e) { lg = (document.documentElement.lang || 'fr').slice(0, 2); }
    var TX = { fr: 'Bienvenue sur', en: 'Welcome to', zh: '欢迎来到', ar: 'مرحبًا بكم في' };
    var o = document.createElement('div');
    o.id = 'rlBv';
    o.setAttribute('aria-hidden', 'true');
    var im = document.createElement('div');
    im.className = 'lg';
    im.innerHTML = '<img alt="" src="' + LOGO + '">';
    var tx = document.createElement('div');
    tx.className = 'tx';
    tx.dir = lg === 'ar' ? 'rtl' : 'ltr';
    tx.textContent = (TX[lg] || TX.en) + ' ';
    var b = document.createElement('b');
    b.textContent = 'RL';
    tx.appendChild(b);
    var ln = document.createElement('div');
    ln.className = 'ln';
    o.appendChild(im); o.appendChild(tx); o.appendChild(ln);
    document.body.appendChild(o);
    function fin() { if (o.parentNode) o.parentNode.removeChild(o); }
    o.addEventListener('click', fin);
    setTimeout(fin, 3000);
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
