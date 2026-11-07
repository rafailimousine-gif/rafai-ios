/* ---------- rlGrand v2 : page de réservation sur ordinateur, grande mise en page (site uniquement)
   v2 : dès 900 px de large (avant 1024), page de connexion en pleine page (texte à gauche, connexion à droite) ---------- */
(function rlGrand() {
  if (window.__rlAccueil || window.__rlNative || window.__rlTwa || /RafaiApp\//.test(navigator.userAgent)) return;
  var FOND = window.__rlFond || '/rl-fond.jpg';
  var P = {
    fr: ['Accueil avec pancarte à votre nom', 'Si votre vol a du retard, nous attendons', '1 heure d’attente offerte', 'Flotte Mercedes et Range Rover'],
    en: ['Meet & greet with a name sign', 'If your flight is late, we wait', '1 hour wait, no extra charge', 'Mercedes and Range Rover fleet'],
    zh: ['持姓名牌接机', '航班延误，我们等候', '免费等候 1 小时', '梅赛德斯-奔驰与路虎揽胜车队'],
    ar: ['استقبال بلوحة تحمل اسمكم', 'إذا تأخرت رحلتكم، ننتظركم', 'ساعة انتظار دون رسوم إضافية', 'أسطول مرسيدس ورينج روفر']
  };
  var css =
    '.rlperks{display:none}' +
    '@media (min-width:900px){' +
    'body{padding-bottom:0;background:#0c0c0e}' +
    'body:before,body:after{content:"";position:fixed;inset:0;z-index:0;pointer-events:none}' +
    'body:before{background:url(' + FOND + ') 50% 38%/cover no-repeat}' +
    'body:after{background:linear-gradient(90deg,rgba(12,12,14,.86) 0,rgba(12,12,14,.68) 48%,rgba(12,12,14,.5) 100%)}' +
    /* en-tête et menu */
    '.top{height:76px;padding:0 40px;background:rgba(12,12,14,.78);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}' +
    '.top img{width:46px;height:46px}.top b{font-size:15px}.top small{font-size:13px}' +
    '.tabs{top:0;bottom:auto;left:50%;right:auto;transform:translateX(-50%);height:76px;padding:0;display:flex;align-items:center;gap:6px;background:none;-webkit-backdrop-filter:none;backdrop-filter:none;border:0}' +
    '.tabs button{flex-direction:row;gap:9px;padding:11px 20px;border-radius:12px;font-size:15.5px;color:rgba(255,255,255,.74)}' +
    '.tabs button svg{width:20px;height:20px}' +
    '.tabs button:hover{background:rgba(255,255,255,.07)}' +
    '.tabs button.on{color:#fff;background:rgba(255,255,255,.12)}.tabs button.on svg{stroke:#E0BA6C}' +
    '.tabs .bd{top:2px;left:auto;right:4px}' +
    /* grande colonne */
    'body>.wrap{position:relative;z-index:1;max-width:1320px;padding:44px 48px 0}' +
    '#b1{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,740px);gap:64px;align-items:center;min-height:calc(100vh - 170px)}' +
    '#b1>.hero{margin:0;padding:0;background:none;border-radius:0}' +
    '#b1>.hero h1{font-size:clamp(44px,4.8vw,70px);line-height:1.05;letter-spacing:-.02em}' +
    '#b1>.hero p{margin-top:18px;max-width:30em;font-size:19px;line-height:1.5;color:#E4DED2}' +
    '.rlperks{display:block;list-style:none;margin:30px 0 0;padding:0}' +
    '.rlperks li{position:relative;padding-inline-start:24px;margin-top:12px;font-size:17px;font-weight:600;color:#fff}' +
    '.rlperks li:before{content:"";position:absolute;inset-inline-start:2px;top:.48em;width:9px;height:9px;border-radius:50%;background:#E0BA6C}' +
    /* carte de réservation */
    '#b1>.card{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:22px;align-items:start;margin:0;padding:30px;border:0;border-radius:26px;box-shadow:0 40px 90px -30px rgba(0,0,0,.7)}' +
    '#b1>.card>*{grid-column:1/-1}' +
    '#b1>.card>label.ac{grid-column:1;grid-row:2}' +
    '#b1>.card>.chips{grid-column:1;grid-row:3}' +
    '#b1 #toWrap{grid-column:2;grid-row:2/span 2;position:relative}' +
    '#b1 #hWrap{grid-column:2;grid-row:2}' +
    '#b1 #toWrap .swap{position:absolute;top:-4px;inset-inline-end:0;margin:0;z-index:1}' +
    '#b1>.card>.row2{grid-column:auto}' +
    '#b1 .seg{margin-bottom:20px}' +
    '.seg button{padding:13px;font-size:16px}' +
    '#b1 .in,#b3 .in{padding:15px 16px;font-size:17px}' +
    '#b1 .chip{font-size:13.5px}' +
    '#b1 #go1{min-height:62px;margin-top:10px;font-size:18px}' +
    /* autres écrans : panneau clair sur la photo */
    '#b2,#b3,#b4,#v-rides,#v-acc{margin-inline:auto;padding:34px;background:var(--bg);border-radius:26px;box-shadow:0 40px 90px -30px rgba(0,0,0,.7)}' +
    '#b2,#b4,#v-rides,#v-acc{max-width:1040px}' +
    '#b3{max-width:1180px}' +
    '#b2 h2,#b3 h2,#v-rides h2,#v-acc h2{font-size:13px}' +
    '#cars{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:stretch}' +
    '#cars>*{margin:0}' +
    '#rides{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:start}' +
    '#rides>*{margin:0}#rides>:not(.ride){grid-column:1/-1}' +
    '.rlCols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:34px;align-items:start}' +
    '.rlCols h2:first-child{margin-top:4px}' +
    '#ride .wrap{max-width:760px}' +
    /* pied de page sur la photo */
    '#legal{margin-top:44px;padding-bottom:18px;color:rgba(255,255,255,.62);border-top-color:rgba(255,255,255,.16)}' +
    '#legal a,#legal button{color:#E0BA6C}#legal .lgDel{color:#FF8A65}' +
    /* connexion */
    '.gate:before,.gate:after{height:auto;bottom:0}' +
    '.gate:before{background:url(' + FOND + ') 50% 38%/cover no-repeat}' +
    '.gate:after{background:linear-gradient(90deg,rgba(12,12,14,.9) 0,rgba(12,12,14,.72) 50%,rgba(12,12,14,.5) 100%)}' +
    '.gate .gw{position:relative;max-width:1240px;min-height:100vh;box-sizing:border-box;margin:0 auto;padding:96px 48px 30px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,460px);grid-template-rows:1fr auto auto auto auto 1fr auto auto;column-gap:clamp(40px,6vw,104px);align-items:start;text-align:start}' +
    '.gate .glang{position:absolute;top:26px;inset-inline-end:48px;margin:0}' +
    '.gate .gback{position:absolute;top:26px;inset-inline-start:48px;margin:0}' +
    '.gate .glogo{grid-column:1;grid-row:2;width:96px;height:96px;margin:0 0 24px}' +
    '.gate h1{grid-column:1;grid-row:3;margin:0;font-size:clamp(38px,4.2vw,62px);line-height:1.06;letter-spacing:-.02em;text-align:start}' +
    '.gate .gs{grid-column:1;grid-row:4;margin:18px 0 0;max-width:28em;font-size:19px;line-height:1.5;text-align:start}' +
    '.gate .rlperks{grid-column:1;grid-row:5;margin-top:26px}' +
    '.gate #gateF{grid-column:2;grid-row:1/span 6;align-self:center;margin:0;padding:32px;border-radius:26px;background:rgba(16,16,18,.76);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.1);box-shadow:0 40px 90px -30px rgba(0,0,0,.75)}' +
    '.gate #gCall{grid-column:2;grid-row:7;margin:16px 0 0;align-items:stretch}.gate #gCall>.btn{margin:0}' +
    '.gate #gLegal{grid-column:1/-1;grid-row:8;margin-top:40px}' +
    '}' +
    /* entre 900 et 1179 px : texte au-dessus, carte en dessous ; en-tête plus compact */
    '@media (min-width:900px) and (max-width:1179px){' +
    '#b1{grid-template-columns:minmax(0,1fr);gap:30px;max-width:820px;margin-inline:auto;min-height:0}' +
    '#b1>.hero h1{font-size:46px}' +
    '.top small{display:none}' +
    '.tabs button{padding:10px 14px;font-size:14.5px}' +
    '.gate .gw{grid-template-columns:minmax(0,1fr) minmax(0,420px);padding-inline:36px}' +
    '.gate .glang{inset-inline-end:36px}.gate .gback{inset-inline-start:36px}' +
    '}';
  var st = document.createElement('style');
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
  function byId(i) { return document.getElementById(i); }
  var hero = document.querySelector('#b1 .hero'), sel = byId('langS');
  function liste(box, after) {
    if (!box) return;
    var l = sel && P[sel.value] ? sel.value : 'fr', u = box.querySelector(':scope > .rlperks');
    if (!u) {
      u = document.createElement('ul'); u.className = 'rlperks';
      if (after && after.parentNode === box) box.insertBefore(u, after.nextSibling); else box.appendChild(u);
    }
    u.textContent = '';
    P[l].forEach(function (t) { var li = document.createElement('li'); li.textContent = t; u.appendChild(li); });
  }
  function perks() {
    liste(hero, null);
    var gw = document.querySelector('.gate .gw');
    liste(gw, byId('gS'));
  }
  function colonnes() {
    var b = byId('b3'), p = byId('pays');
    if (!b || !p || b.querySelector('.rlCols')) return;
    var kids = [].slice.call(b.children), i = kids.indexOf(p) - 1;
    if (i < 1 || kids[i].tagName !== 'H2') return;
    var c = document.createElement('div'), g = document.createElement('div'), d = document.createElement('div');
    c.className = 'rlCols';
    kids.slice(0, i).forEach(function (n) { g.appendChild(n); });
    kids.slice(i).forEach(function (n) { d.appendChild(n); });
    c.appendChild(g); c.appendChild(d); b.appendChild(c);
  }
  function go() {
    perks();
    colonnes();
    if (sel) sel.addEventListener('change', function () { setTimeout(perks, 0); });
    var gsel = byId('gLangS');
    if (gsel) gsel.addEventListener('change', function () { setTimeout(perks, 50); });
    [hero && hero.querySelector('h1'), byId('gT')].forEach(function (h1) {
      if (h1) new MutationObserver(function () { setTimeout(perks, 0); }).observe(h1, { childList: true, characterData: true, subtree: true });
    });
  }
  if (document.getElementById('b3')) go(); else document.addEventListener('DOMContentLoaded', go);
})();
