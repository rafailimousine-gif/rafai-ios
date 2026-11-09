/* ---------- rlFt v1 : option Fast Track VIP (accueil VIP à l'aéroport, 240 €) ----------
   Page de réservation booking.rafai-limousine.com (et donc les applis iPhone et Android, qui affichent cette page).
   - Étape « véhicule » et étape « coordonnées » : bloc NOUVEAU « Fast Track VIP » si le trajet passe par un aéroport.
   - Formulaire : Arrivée ou Départ, vol, passagers (4 max), bagages, nom sur la pancarte, langue de l'agent, message.
   - Envoi : la demande part avec la réservation (champ ft) ; le serveur ajoute 240 € et garde la demande.
   - « Mes courses » : la course montre le Fast Track VIP et, dès qu'il est connu, le prénom et le numéro de l'agent. */
var FT_EUR = 240, FT_RX = /a[ée]roport|airport|\bcdg\b|\bory\b|\borly\b|roissy|bourget/i;
var FTB = { on: false, d: null };
var FT_TX = {
  fr: { nw: 'NOUVEAU', add: 'Ajouter Fast Track VIP', added: 'Fast Track VIP ajouté', edit: 'Modifier', rm: 'Retirer',
    desc: 'Un agent vous attend à l’aéroport avec une pancarte à votre nom et vous accompagne jusqu’à votre chauffeur ou jusqu’à l’embarquement.',
    arr: 'Arrivée', dep: 'Départ', fl: 'Numéro de vol', pax: 'Passagers', bags: 'Bagages', sign: 'Nom sur la pancarte', lang: 'Langue de l’agent',
    msg: 'Message pour l’agent (facultatif)', ok1: 'Annulation gratuite jusqu’à 24 h avant', ok2: 'Vol suivi en temps réel',
    max: 'Plus de 4 passagers ? Contactez-nous.', go: 'Valider', cx: 'Annuler', eFl: 'Indiquez votre numéro de vol.',
    ag: 'Votre agent Fast Track VIP', wait: 'Le prénom et le numéro de votre agent vous seront communiqués avant votre vol.',
    mArr: 'Il vous attend à la sortie de l’avion, avec une pancarte à votre nom.', mDep: 'Il vous attend à votre arrivée à l’aéroport.', call: 'Appeler' },
  en: { nw: 'NEW', add: 'Add Fast Track VIP', added: 'Fast Track VIP added', edit: 'Edit', rm: 'Remove',
    desc: 'An agent meets you at the airport with a sign showing your name and walks you to your chauffeur or to boarding.',
    arr: 'Arrival', dep: 'Departure', fl: 'Flight number', pax: 'Passengers', bags: 'Luggage', sign: 'Name on the sign', lang: 'Agent’s language',
    msg: 'Message for the agent (optional)', ok1: 'Free cancellation up to 24 h before', ok2: 'Flight tracked in real time',
    max: 'More than 4 passengers? Contact us.', go: 'Confirm', cx: 'Cancel', eFl: 'Please enter your flight number.',
    ag: 'Your Fast Track VIP agent', wait: 'Your agent’s name and phone number will be sent to you before your flight.',
    mArr: 'They will meet you off the plane, with a sign showing your name.', mDep: 'They will meet you when you arrive at the airport.', call: 'Call' },
  ar: { nw: 'جديد', add: 'أضف Fast Track VIP', added: 'تمت إضافة Fast Track VIP', edit: 'تعديل', rm: 'إزالة',
    desc: 'يستقبلك موظف في المطار بلافتة تحمل اسمك ويرافقك حتى سائقك أو حتى الصعود إلى الطائرة.',
    arr: 'الوصول', dep: 'المغادرة', fl: 'رقم الرحلة', pax: 'الركاب', bags: 'الأمتعة', sign: 'الاسم على اللافتة', lang: 'لغة الموظف',
    msg: 'رسالة للموظف (اختياري)', ok1: 'إلغاء مجاني حتى 24 ساعة قبل الموعد', ok2: 'متابعة الرحلة مباشرة',
    max: 'أكثر من 4 ركاب؟ تواصل معنا.', go: 'تأكيد', cx: 'إلغاء', eFl: 'يرجى إدخال رقم الرحلة.',
    ag: 'موظف Fast Track VIP الخاص بك', wait: 'سنرسل لك اسم الموظف ورقم هاتفه قبل رحلتك.',
    mArr: 'سيستقبلك عند الخروج من الطائرة بلافتة تحمل اسمك.', mDep: 'سيستقبلك عند وصولك إلى المطار.', call: 'اتصال' },
  zh: { nw: '新', add: '添加 Fast Track VIP', added: '已添加 Fast Track VIP', edit: '修改', rm: '移除',
    desc: '机场专员手持您的姓名牌迎接您，并陪同您前往司机处或登机口。',
    arr: '到达', dep: '出发', fl: '航班号', pax: '乘客', bags: '行李', sign: '接机牌姓名', lang: '专员语言',
    msg: '给专员的留言（可选）', ok1: '提前 24 小时免费取消', ok2: '实时追踪航班',
    max: '超过 4 位乘客？请联系我们。', go: '确认', cx: '取消', eFl: '请输入航班号。',
    ag: '您的 Fast Track VIP 专员', wait: '我们会在您的航班前发送专员的姓名和电话。',
    mArr: '专员将在您下飞机时手持您的姓名牌迎接您。', mDep: '专员将在您抵达机场时迎接您。', call: '致电' }
};
function ftT(k) { var l = 'fr'; try { l = L; } catch (e) {} var d = FT_TX[l] || FT_TX.en; return d[k] || FT_TX.en[k] || ''; }
function ftEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function ftEur(v) { try { return eur(v); } catch (e) { return v + ' €'; } }
function ftAir() {
  try { var q = Q.q || {}; return Q.type !== 'hourly' && FT_RX.test((q.from || '') + ' ' + (q.to || '')); } catch (e) { return false; }
}
function ftOn() { var ed = false; try { ed = !!EDIT; } catch (e) {} return FTB.on && !!FTB.d && !ed && ftAir(); }
function ftDef() {
  var q = {}; try { q = Q.q || {}; } catch (e) {}
  var k = FT_RX.test(q.from || '') ? 'arr' : 'dep', pax = 1, bags = 0, ln = '';
  try { pax = Math.min(4, Math.max(1, Number(Q.pax) || 1)); bags = Math.max(0, Number(Q.bags) || 0); } catch (e) {}
  try { var me = LS.json('rl_me', {}); ln = String(me.lname || '').toUpperCase(); } catch (e) {}
  var fl = ''; try { fl = ($('flight') && $('flight').value) || ''; } catch (e) {}
  return { k: k, flight: fl, pax: pax, bags: bags, sign: ln, lang: 'Français', msg: '' };
}
function ftCssAdd() {
  if (document.getElementById('ftCss')) return;
  var s = document.createElement('style'); s.id = 'ftCss';
  s.textContent =
    '.ftx{position:relative;margin:14px 0 6px;border-radius:18px;padding:16px;background:#111113;color:#F4F0E8;border:1.5px solid var(--gold);box-shadow:0 10px 26px rgba(169,129,63,.28)}' +
    '.ftx .nw{position:absolute;top:-10px;right:14px;font-size:10.5px;font-weight:800;letter-spacing:.08em;background:var(--gold);color:#111113;padding:3px 9px;border-radius:10px}' +
    '.ftx .hd{display:flex;align-items:center;justify-content:space-between;gap:10px;font-weight:800;letter-spacing:.04em;color:#E6CC93;font-size:15px}' +
    '.ftx .hd b{color:#fff;font-size:15px;white-space:nowrap}' +
    '.ftx p{font-size:13px;line-height:1.5;color:#D7CFC0;margin:8px 0 12px}' +
    '.ftx .ad{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:13px;color:#fff}' +
    '.ftx .ad .ck{color:#7BD3A0;font-weight:800}' +
    '.ftx .lk{background:none;border:0;color:#E6CC93;font:inherit;font-weight:700;text-decoration:underline;cursor:pointer;padding:0}' +
    '.ftx .btn{width:100%}' +
    '#ftOv{position:fixed;inset:0;z-index:9999;background:rgba(17,17,19,.55);display:none;align-items:flex-end;justify-content:center}' +
    '#ftOv.on{display:flex}' +
    '#ftOv .bx{background:var(--bg);width:100%;max-width:480px;max-height:92vh;overflow:auto;border-radius:22px 22px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom))}' +
    '@media(min-width:700px){#ftOv{align-items:center}#ftOv .bx{border-radius:22px}}' +
    '#ftOv h3{margin:0 0 12px;font-size:19px;display:flex;justify-content:space-between;align-items:center}' +
    '#ftOv .x{background:none;border:0;font-size:24px;color:var(--mut);cursor:pointer;line-height:1}' +
    '#ftOv .sg{display:flex;background:#EDE6D8;border-radius:12px;padding:3px;margin:0 0 12px}' +
    '#ftOv .sg button{flex:1;border:0;background:none;padding:9px 0;border-radius:10px;font:inherit;font-weight:700;font-size:13.5px;color:var(--mut);cursor:pointer}' +
    '#ftOv .sg button.on{background:#111113;color:#E6CC93}' +
    '#ftOv label{display:block;font-size:12px;font-weight:600;color:var(--mut);margin:10px 2px 5px}' +
    '#ftOv input,#ftOv select,#ftOv textarea{width:100%;border:1px solid var(--line);background:#fff;border-radius:12px;padding:11px 12px;font:inherit;font-size:15px;color:var(--ink)}' +
    '#ftOv textarea{min-height:64px;resize:vertical}' +
    '#ftOv .r2{display:flex;gap:10px}#ftOv .r2>div{flex:1}' +
    '#ftOv .st{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--line);background:#fff;border-radius:12px;padding:5px 6px;font-weight:700}' +
    '#ftOv .st button{width:34px;height:34px;border-radius:9px;border:1px solid var(--line);background:#fff;font-size:18px;cursor:pointer;color:var(--ink)}' +
    '#ftOv .ok{font-size:12.5px;color:#4A4640;margin:12px 2px 0;line-height:1.7}#ftOv .ok b{color:var(--ok)}' +
    '#ftOv .er{color:var(--red);font-size:13px;margin:8px 2px 0;min-height:1em}' +
    '#ftOv .ac{display:flex;gap:10px;margin-top:12px}#ftOv .ac .btn{flex:1}' +
    '.ftr .ag{display:flex;align-items:center;gap:12px}' +
    '.ftr .av{width:48px;height:48px;border-radius:24px;flex:none;background:#111113;color:#E6CC93;font-weight:700;font-size:21px;display:flex;align-items:center;justify-content:center;border:2px solid var(--gold)}' +
    '.ftr .sm{font-size:12.5px;color:var(--mut);margin-top:6px;line-height:1.5}' +
    '.ftr .bt{display:flex;gap:8px;margin-top:10px}.ftr .bt a{flex:1;text-align:center}';
  document.head.appendChild(s);
}
function ftSummary() {
  var d = FTB.d || {};
  return ftEsc((d.k === 'dep' ? ftT('dep') : ftT('arr')) + (d.flight ? ' · ' + d.flight : '') + ' · ' + d.pax + ' ' + ftT('pax').toLowerCase());
}
function ftBoxHtml() {
  var h = '<span class="nw">' + ftEsc(ftT('nw')) + '</span><div class="hd"><span>✦ FAST TRACK VIP</span><b>+ ' + ftEsc(ftEur(FT_EUR)) + '</b></div>';
  if (ftOn()) {
    h += '<div class="ad" style="margin-top:10px"><span class="ck">✓</span><span>' + ftEsc(ftT('added')) + ' · ' + ftSummary() + '</span></div>' +
      '<div class="ad" style="margin-top:8px"><button type="button" class="lk" data-ftx="edit">' + ftEsc(ftT('edit')) + '</button><button type="button" class="lk" data-ftx="rm">' + ftEsc(ftT('rm')) + '</button></div>';
  } else {
    h += '<p>' + ftEsc(ftT('desc')) + '</p><button type="button" class="btn gold" data-ftx="add">' + ftEsc(ftT('add')) + '</button>';
  }
  return h;
}
function ftWire(el) {
  Array.prototype.forEach.call(el.querySelectorAll('[data-ftx]'), function (b) {
    b.onclick = function (e) {
      e.preventDefault(); e.stopPropagation();
      var a = b.getAttribute('data-ftx');
      if (a === 'rm') { FTB.on = false; ftRefresh(); return; }
      ftOpen();
    };
  });
}
function ftBox(id, anchor, where) {
  var el = document.getElementById(id);
  if (!ftAir() || !anchor) { if (el) el.remove(); return; }
  try { if (EDIT) { if (el) el.remove(); return; } } catch (e) {}
  ftCssAdd();
  if (!el) { el = document.createElement('div'); el.id = id; el.className = 'ftx'; anchor.insertAdjacentElement(where, el); }
  el.innerHTML = ftBoxHtml();
  ftWire(el);
}
function ftStep3() {
  try {
    if (!Q.res || !Q.car || !Q.res.prices[Q.car]) return;
    var p = Q.res.prices[Q.car], ed = false; try { ed = !!EDIT; } catch (e) {}
    if (ed) return;
    var tot = Number(p.v) + (ftOn() ? FT_EUR : 0);
    $('go3').innerHTML = ftEsc(t('book') + ' · ' + ftEur(tot));
    var m = $('meta3'), x = document.getElementById('ftMeta');
    if (ftOn()) { if (!x && m) { x = document.createElement('span'); x.id = 'ftMeta'; m.appendChild(x); } if (x) x.innerHTML = '<b>✦ Fast Track VIP + ' + ftEsc(ftEur(FT_EUR)) + '</b>'; }
    else if (x) x.remove();
  } catch (e) {}
}
function ftRefresh() {
  try { ftBox('ftBox2', $('cars'), 'afterend'); } catch (e) {}
  try { ftBox('ftBox3', $('go3'), 'beforebegin'); } catch (e) {}
  ftStep3();
}
function ftOv() {
  var o = document.getElementById('ftOv');
  if (o) return o;
  ftCssAdd();
  o = document.createElement('div'); o.id = 'ftOv';
  o.addEventListener('click', function (e) { if (e.target === o) ftClose(); });
  document.body.appendChild(o);
  return o;
}
function ftOpen() {
  var o = ftOv(), d = FTB.d ? JSON.parse(JSON.stringify(FTB.d)) : ftDef(), rtl = false;
  try { rtl = L === 'ar'; } catch (e) {}
  if (!d.flight) { try { d.flight = ($('flight') && $('flight').value) || ''; } catch (e) {} }
  var langs = ['Français', 'English', 'العربية'];
  o.innerHTML = '<div class="bx"' + (rtl ? ' dir="rtl"' : '') + '><h3><span>✦ Fast Track VIP</span><button type="button" class="x" id="ftX" aria-label="×">×</button></h3>' +
    '<div class="sg"><button type="button" data-k="arr">' + ftEsc(ftT('arr')) + '</button><button type="button" data-k="dep">' + ftEsc(ftT('dep')) + '</button></div>' +
    '<label for="ftFl">' + ftEsc(ftT('fl')) + '</label><input id="ftFl" autocomplete="off" autocapitalize="characters" placeholder="AF 1231" value="' + ftEsc(d.flight) + '">' +
    '<div class="r2"><div><label>' + ftEsc(ftT('pax')) + '</label><div class="st"><button type="button" data-s="pax" data-v="-1">−</button><span id="ftPx">' + d.pax + '</span><button type="button" data-s="pax" data-v="1">+</button></div></div>' +
    '<div><label>' + ftEsc(ftT('bags')) + '</label><div class="st"><button type="button" data-s="bags" data-v="-1">−</button><span id="ftBg">' + d.bags + '</span><button type="button" data-s="bags" data-v="1">+</button></div></div></div>' +
    '<label for="ftSg">' + ftEsc(ftT('sign')) + '</label><input id="ftSg" autocomplete="off" value="' + ftEsc(d.sign) + '">' +
    '<label for="ftLg">' + ftEsc(ftT('lang')) + '</label><select id="ftLg">' + langs.map(function (x) { return '<option' + (x === d.lang ? ' selected' : '') + '>' + ftEsc(x) + '</option>'; }).join('') + '</select>' +
    '<label for="ftMs">' + ftEsc(ftT('msg')) + '</label><textarea id="ftMs" maxlength="300">' + ftEsc(d.msg) + '</textarea>' +
    '<div class="ok"><b>✓</b> ' + ftEsc(ftT('ok1')) + '<br><b>✓</b> ' + ftEsc(ftT('ok2')) + '<br><span style="color:var(--mut)">' + ftEsc(ftT('max')) + '</span></div>' +
    '<div class="er" id="ftEr"></div>' +
    '<div class="ac"><button type="button" class="btn" id="ftCx">' + ftEsc(ftT('cx')) + '</button><button type="button" class="btn gold" id="ftGo">' + ftEsc(ftT('go') + ' · + ' + ftEur(FT_EUR)) + '</button></div></div>';
  function seg() { Array.prototype.forEach.call(o.querySelectorAll('.sg button'), function (b) { b.classList.toggle('on', b.getAttribute('data-k') === d.k); }); }
  Array.prototype.forEach.call(o.querySelectorAll('.sg button'), function (b) { b.onclick = function () { d.k = b.getAttribute('data-k'); seg(); }; });
  Array.prototype.forEach.call(o.querySelectorAll('.st button'), function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-s'), v = Number(b.getAttribute('data-v'));
      if (k === 'pax') { d.pax = Math.min(4, Math.max(1, d.pax + v)); document.getElementById('ftPx').textContent = d.pax; }
      else { d.bags = Math.min(10, Math.max(0, d.bags + v)); document.getElementById('ftBg').textContent = d.bags; }
    };
  });
  seg();
  document.getElementById('ftX').onclick = ftClose;
  document.getElementById('ftCx').onclick = ftClose;
  document.getElementById('ftGo').onclick = function () {
    d.flight = String(document.getElementById('ftFl').value || '').toUpperCase().replace(/\s+/g, ' ').trim().slice(0, 20);
    d.sign = String(document.getElementById('ftSg').value || '').trim().slice(0, 60);
    d.lang = document.getElementById('ftLg').value;
    d.msg = String(document.getElementById('ftMs').value || '').trim().slice(0, 300);
    if (d.flight.replace(/\s/g, '').length < 3) { document.getElementById('ftEr').textContent = ftT('eFl'); return; }
    FTB.d = d; FTB.on = true;
    try { if ($('flight') && !$('flight').value) $('flight').value = d.flight; } catch (e) {}
    ftClose(); ftRefresh();
  };
  o.classList.add('on');
}
function ftClose() { var o = document.getElementById('ftOv'); if (o) o.classList.remove('on'); }
function ftRideHtml(x) {
  var f = x.ft, h = '<h2>✦ Fast Track VIP</h2><div class="card ftr">';
  h += '<div style="font-weight:700">' + ftEsc((f.k === 'dep' ? ftT('dep') : ftT('arr')) + (f.flight ? ' · ' + f.flight : '') + (f.sign ? ' · « ' + f.sign + ' »' : '')) + '</div>';
  if (f.agent && f.agent.name) {
    var tel = String(f.agent.tel || ''), dg = tel.replace(/[^\d+]/g, ''), wa = dg.replace(/^\+/, '').replace(/^0/, '33');
    h += '<div class="ag" style="margin-top:12px"><div class="av">' + ftEsc(f.agent.name.charAt(0).toUpperCase()) + '</div><div><div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--gold2);text-transform:uppercase">' + ftEsc(ftT('ag')) + '</div>' +
      '<div style="font-weight:700;font-size:16px">' + ftEsc(f.agent.name) + '</div>' + (tel ? '<div style="font-size:13px">' + ftEsc(tel) + '</div>' : '') + '</div></div>' +
      '<div class="sm">' + ftEsc(f.k === 'dep' ? ftT('mDep') : ftT('mArr')) + '</div>' +
      (dg ? '<div class="bt"><a class="btn" href="tel:' + ftEsc(dg) + '">' + ftEsc(ftT('call')) + '</a><a class="btn" href="https://wa.me/' + ftEsc(wa) + '" target="_blank" rel="noopener">WhatsApp</a></div>' : '');
  } else {
    h += '<div class="sm">' + ftEsc(ftT('wait')) + '</div>';
  }
  return h + '</div>';
}
(function () {
  try { ftCssAdd(); } catch (e) {}
  if (typeof showCars === 'function') { var _sc = showCars; showCars = function () { var r = _sc.apply(this, arguments); try { ftRefresh(); } catch (e) {} return r; }; }
  if (typeof step3 === 'function') { var _s3 = step3; step3 = function () { var r = _s3.apply(this, arguments); try { ftRefresh(); } catch (e) {} return r; }; }
  if (typeof post === 'function') {
    var _po = post;
    post = function (a, b) {
      var sent = false;
      if (a === 'cbook' && b && typeof b === 'object' && ftOn()) {
        b.ft = JSON.stringify(FTB.d); sent = true;
        if (!b.flight && FTB.d.flight) b.flight = FTB.d.flight;
      }
      var pr = _po.apply(this, arguments);
      if (sent && pr && pr.then) pr.then(function (r) { if (r && r.ok) { FTB.on = false; FTB.d = null; } }, function () {});
      return pr;
    };
  }
  if (typeof drawRide === 'function') {
    var _dr2 = drawRide;
    drawRide = function (x) {
      var r = _dr2.apply(this, arguments);
      try {
        if (x && x.ft) {
          var B = $('rideB'), w = document.createElement('div');
          w.id = 'ftRide'; w.innerHTML = ftRideHtml(x);
          var c = B && B.querySelector('.card');
          if (c && c.nextSibling) B.insertBefore(w, c.nextSibling); else if (B) B.appendChild(w);
        }
      } catch (e) {}
      return r;
    };
  }
})();
