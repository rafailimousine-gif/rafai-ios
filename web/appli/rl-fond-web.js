/* ---------- rlFond v1 : page de connexion du site, meme photo de fond que dans l'appli (sans animation) ---------- */
(function rlFond() {
  if (window.__rlAccueil || window.__rlNative || window.__rlTwa || /RafaiApp\//.test(navigator.userAgent)) return;
  var FOND = window.__rlFond || '/rl-fond.jpg';
  var css =
    '.gate.on{background:#0c0c0e}' +
    '.gate:before,.gate:after{content:"";position:fixed;top:0;left:0;right:0;height:min(177vw,88vh);z-index:0;pointer-events:none}' +
    '.gate:before{background:url(' + FOND + ') 65% 0/auto 100% no-repeat}' +
    '.gate:after{background:linear-gradient(180deg,rgba(12,12,14,.8) 0,rgba(12,12,14,.66) 31%,rgba(12,12,14,.06) 43%,rgba(12,12,14,.1) 59%,rgba(12,12,14,.86) 72%,#0c0c0e 85%)}' +
    '.gate .gw{z-index:1}' +
    '.gate .glogo{width:72px;height:72px;margin:0 auto 12px}' +
    '.gate h1{font-size:22px}' +
    '.gate .gs{margin-bottom:0;font-size:14px}' +
    '#gateF{margin-top:min(62vw,30vh)}' +
    '@media (min-width:760px){' +
    '.gate:before,.gate:after{height:100vh}' +
    '.gate:before{background:url(' + FOND + ') 50% 38%/cover no-repeat}' +
    '.gate:after{background:linear-gradient(90deg,rgba(12,12,14,.3) 0,rgba(12,12,14,.84) 33%,rgba(12,12,14,.9) 50%,rgba(12,12,14,.84) 67%,rgba(12,12,14,.3) 100%)}' +
    '.gate .gs{margin-bottom:20px}' +
    '#gateF{margin-top:0}' +
    '}';
  var st = document.createElement('style');
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
})();
