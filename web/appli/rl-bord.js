/* ---------- rlBord v1 : « Offert à bord » et choix de la musique (9 nov. 2026, demandes de Yassine) ----------
   Page de réservation booking.rafai-limousine.com (et donc les applis iPhone et Android).
   - Étape « véhicule » : sous la liste des voitures, trois icônes offertes : 2 bouteilles d'Evian, câble de charge USB-C, Wi-Fi illimité.
   - Étape « coordonnées » : « Musique à bord » (sans musique ou le style voulu). Le choix part dans la note de la course (« ♪ Musique : … »). */
var BD_TX = {
  fr: { t: 'Offert à bord de chaque voiture', a: '2 bouteilles d’Evian', b: 'Câble de charge USB-C', c: 'Wi-Fi illimité',
    mu: 'Musique à bord', m0: 'Pas de préférence', mt: 'Musique',
    ms: ['Sans musique', 'Classique', 'Jazz', 'Lounge / chill', 'Pop', 'R&B / Soul', 'Orientale', 'Radio'] },
  en: { t: 'Complimentary in every car', a: '2 bottles of Evian', b: 'USB-C charging cable', c: 'Unlimited Wi-Fi',
    mu: 'Music on board', m0: 'No preference', mt: 'Music',
    ms: ['No music', 'Classical', 'Jazz', 'Lounge / chill', 'Pop', 'R&B / Soul', 'Arabic / Oriental', 'Radio'] },
  ar: { t: 'مجانًا في كل سيارة', a: 'زجاجتان من مياه إيفيان', b: 'كابل شحن USB-C', c: 'واي فاي غير محدود',
    mu: 'الموسيقى في السيارة', m0: 'بدون تفضيل', mt: 'الموسيقى',
    ms: ['بدون موسيقى', 'كلاسيكية', 'جاز', 'لاونج / هادئة', 'بوب', 'آر أند بي / سول', 'شرقية', 'راديو'] },
  zh: { t: '每辆车免费提供', a: '2 瓶依云矿泉水', b: 'USB-C 充电线', c: '无限 Wi-Fi',
    mu: '车内音乐', m0: '无偏好', mt: '音乐',
    ms: ['不要音乐', '古典', '爵士', '休闲 Lounge', '流行', 'R&B / 灵魂乐', '东方音乐', '电台'] }
};
/* le chauffeur lit la note en français : le style est toujours écrit en français dans la note */
var BD_MUS_FR = BD_TX.fr.ms;
var BD_IC = {
  a: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 2.5h4v2.2l1.3 1.7c.5.7.7 1.4.7 2.2V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8.6c0-.8.2-1.5.7-2.2L10 4.7z"/><path d="M8 11.5h8M8 16h8"/></svg>',
  b: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7.5" y="2.5" width="9" height="8" rx="2.5"/><path d="M10.5 6.5h3"/><path d="M12 10.5v3.5c0 2.2-1.6 3.5-3.5 3.5S5 18.7 5 21.5"/></svg>',
  c: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 8.8a14 14 0 0 1 19 0"/><path d="M5.5 12.2a9.6 9.6 0 0 1 13 0"/><path d="M8.7 15.5a5 5 0 0 1 6.6 0"/><circle cx="12" cy="19.2" r="1.3" fill="currentColor" stroke="none"/></svg>'
};
function bdT() { var l = 'fr'; try { l = L; } catch (e) {} return BD_TX[l] || BD_TX.en; }
function bdEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function bdCss() {
  if (document.getElementById('bdCss')) return;
  var s = document.createElement('style'); s.id = 'bdCss';
  s.textContent =
    '.rlbd{margin:12px 0 4px;padding:12px 14px;border:1px solid var(--line,#E5E3DE);border-radius:16px;background:rgba(201,160,99,.07)}' +
    '.rlbd .t{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#8A6630);margin:0 0 9px}' +
    '.rlbd .r{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}' +
    '.rlbd .i{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;font-size:12.5px;font-weight:600;line-height:1.25;color:var(--ink,#1C1B1A)}' +
    '.rlbd .c{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#111113;color:#E6CC93}' +
    '.rlbd svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}';
  document.head.appendChild(s);
}
function bdRefresh() {
  var cars = $('cars'); if (!cars) return;
  bdCss();
  var el = document.getElementById('rlBord');
  if (!el) { el = document.createElement('div'); el.id = 'rlBord'; el.className = 'rlbd'; }
  var x = bdT();
  el.innerHTML = '<div class="t">' + bdEsc(x.t) + '</div><div class="r">' +
    ['a', 'b', 'c'].map(function (k) { return '<div class="i"><span class="c">' + BD_IC[k] + '</span>' + bdEsc(x[k]) + '</div>'; }).join('') + '</div>';
  /* juste sous les voitures, avant le bloc Fast Track VIP */
  if (cars.nextElementSibling !== el) cars.insertAdjacentElement('afterend', el);
}
/* « Musique à bord » : juste avant le champ « Note » de l'étape coordonnées */
function bdMusic() {
  var n = $('notes'); if (!n) return;
  var lab = n.closest('label') || n.parentNode, x = bdT();
  var box = document.getElementById('rlMusF');
  if (!box) { box = document.createElement('label'); box.id = 'rlMusF'; box.className = 'f'; lab.insertAdjacentElement('beforebegin', box); }
  var cur = $('rlMus') ? $('rlMus').value : '';
  box.innerHTML = '<span>' + bdEsc(x.mu) + '</span><select class="in" id="rlMus"><option value="">' + bdEsc(x.m0) + '</option>' +
    x.ms.map(function (m, i) { return '<option value="' + i + '"' + (String(i) === cur ? ' selected' : '') + '>' + bdEsc(m) + '</option>'; }).join('') + '</select>';
}
function bdMusNote() {
  var s = $('rlMus'); if (!s || s.value === '') return '';
  return '♪ Musique : ' + BD_MUS_FR[Number(s.value)];
}
(function () {
  if (typeof showCars === 'function') { var _bc = showCars; showCars = function () { var r = _bc.apply(this, arguments); try { bdRefresh(); } catch (e) {} return r; }; }
  if (typeof step3 === 'function') { var _b3 = step3; step3 = function () { var r = _b3.apply(this, arguments); try { bdMusic(); } catch (e) {} return r; }; }
  if (typeof post === 'function') {
    var _bp = post;
    post = function (app, body) {
      try {
        if (app === 'cbook' && body) { var m = bdMusNote(); if (m) body.notes = m + (body.notes ? ' / ' + body.notes : ''); }
      } catch (e) {}
      return _bp.apply(this, arguments);
    };
  }
  try { bdRefresh(); } catch (e) {}
  try { bdMusic(); } catch (e) {}
})();
