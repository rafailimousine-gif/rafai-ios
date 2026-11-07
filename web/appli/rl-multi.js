/* ---------- rlMulti v1 : réservation « À l'heure » sur plusieurs jours, avec un programme par jour ----------
 * Le client ajoute des jours (date, heure, durée, départ, programme). Le prix affiché est le total de tous les jours.
 * À la réservation, chaque jour devient une course (une demande cbook par jour), liée aux autres dans les commentaires.
 * Chaque course se paie séparément dans « Mes courses », après confirmation. Le serveur ne change pas.
 */
(function rlMulti() {
  if (window.__rlMulti) return;
  window.__rlMulti = 1;
  var MAXD = 7;
  var MT = {
    fr: { add: '＋ Ajouter un jour', day: 'Jour {n}', del: 'Retirer', prog: 'Programme du jour', progP: 'Ex. : 9 h Versailles, 13 h déjeuner, 16 h shopping…',
      p0: 'Programme du jour 1', hint: 'Plusieurs jours ? Ajoutez chaque jour avec son programme. Une course par jour, chacune se paie à part dans « Mes courses ».',
      days: '{n} jours · {h} h au total', tot: 'Prix total pour {n} jours', note: 'Mise à disposition sur {n} jours ({a} → {b}) · Jour {i}/{n}', progK: 'Programme',
      errDay: 'Jour {n} : ', okMany: '{n} courses envoyées (une par jour) : {r}. Chacune se paiera dans « Mes courses » après confirmation.',
      partial: 'Jours envoyés : {r}. Le jour {n} n’a pas pu être envoyé : appelez-nous au +33 6 67 09 94 94.' },
    en: { add: '＋ Add a day', day: 'Day {n}', del: 'Remove', prog: 'Plan for the day', progP: 'E.g. 9 am Versailles, 1 pm lunch, 4 pm shopping…',
      p0: 'Plan for day 1', hint: 'Several days? Add each day with its plan. One ride per day, each paid separately in “My rides”.',
      days: '{n} days · {h} h in total', tot: 'Total price for {n} days', note: 'Hourly hire over {n} days ({a} → {b}) · Day {i}/{n}', progK: 'Plan',
      errDay: 'Day {n}: ', okMany: '{n} rides sent (one per day): {r}. Each one is paid in “My rides” once confirmed.',
      partial: 'Days sent: {r}. Day {n} could not be sent: please call us on +33 6 67 09 94 94.' },
    ar: { add: '＋ إضافة يوم', day: 'اليوم {n}', del: 'حذف', prog: 'برنامج اليوم', progP: 'مثال: 9 صباحًا فرساي، 1 ظهرًا غداء، 4 عصرًا تسوّق…',
      p0: 'برنامج اليوم 1', hint: 'عدة أيام؟ أضف كل يوم مع برنامجه. رحلة واحدة لكل يوم، وتُدفع كل رحلة على حدة في «رحلاتي».',
      days: '{n} أيام · {h} ساعة إجمالًا', tot: 'السعر الإجمالي لـ {n} أيام', note: 'Hourly hire over {n} days ({a} → {b}) · Day {i}/{n}', progK: 'Plan',
      errDay: 'اليوم {n}: ', okMany: 'تم إرسال {n} رحلات (رحلة لكل يوم): {r}. تُدفع كل رحلة في «رحلاتي» بعد التأكيد.',
      partial: 'الأيام المرسلة: {r}. تعذّر إرسال اليوم {n}: يرجى الاتصال بنا على 94 94 09 67 6 33+.' },
    zh: { add: '＋ 添加一天', day: '第 {n} 天', del: '删除', prog: '当天行程', progP: '例如：9 点凡尔赛，13 点午餐，16 点购物…',
      p0: '第 1 天行程', hint: '需要多天？请逐天添加并填写行程。每天一单，分别在“我的行程”中付款。',
      days: '{n} 天 · 共 {h} 小时', tot: '{n} 天总价', note: 'Hourly hire over {n} days ({a} → {b}) · Day {i}/{n}', progK: 'Plan',
      errDay: '第 {n} 天：', okMany: '已发送 {n} 单（每天一单）：{r}。确认后在“我的行程”中分别付款。',
      partial: '已发送：{r}。第 {n} 天未能发送，请致电 +33 6 67 09 94 94。' }
  };
  function mt(k, v) { var s = (MT[L] && MT[L][k]) || MT.en[k] || k; if (v) Object.keys(v).forEach(function (x) { s = s.split('{' + x + '}').join(v[x]); }); return s; }
  var css = '#mdWrap{margin:4px 0 2px}#mdWrap .mdDay{border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:12px 12px 2px;margin:12px 0}' +
    '#mdWrap .mdH{display:flex;align-items:center;justify-content:space-between;margin:0 0 8px}#mdWrap .mdH b{font-size:14.5px}' +
    '#mdWrap .mdX{border:0;background:none;color:#FF6B6B;font:inherit;font-size:13px;font-weight:600;cursor:pointer;padding:4px}' +
    '#mdWrap textarea.in{min-height:64px}#mdWrap .mdHint{font-size:12.5px;line-height:1.45;opacity:.7;margin:8px 2px 0}#mdAdd{margin-top:6px}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);
  var W = document.createElement('div'); W.id = 'mdWrap'; W.className = 'hide';
  var hw = $('hWrap'); if (!hw) return;
  hw.parentNode.insertBefore(W, hw.nextSibling);

  function hOpts(v) { var h = ''; for (var i = 2; i <= 12; i++) h += '<option value="' + i + '"' + (String(v) === String(i) ? ' selected' : '') + '>' + esc(t('hoursN', { h: i })) + '</option>'; return h; }
  function addDays(iso, n) { var d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function extra() { return Array.prototype.slice.call(W.querySelectorAll('.mdDay')); }
  function val(el, k) { var x = el.querySelector('[data-k="' + k + '"]'); return x ? String(x.value || '').trim() : ''; }
  function dayHtml(n, d) {
    return '<div class="mdDay"><div class="mdH"><b>' + esc(mt('day', { n: n })) + '</b><button type="button" class="mdX">' + esc(mt('del')) + '</button></div>' +
      '<div class="row2"><label class="f"><span>' + esc(t('date')) + '</span><input class="in" type="date" data-k="date" min="' + esc(today(0)) + '" value="' + esc(d.date) + '"></label>' +
      '<label class="f"><span>' + esc(t('time')) + '</span><input class="in" type="time" step="300" data-k="time" value="' + esc(d.time) + '"></label></div>' +
      '<label class="f"><span>' + esc(t('hours')) + '</span><select class="in" data-k="h">' + hOpts(d.h) + '</select></label>' +
      '<label class="f"><span>' + esc(t('from')) + '</span><input class="in" data-k="from" autocomplete="off" placeholder="' + esc(t('fromP')) + '" value="' + esc(d.from) + '"></label>' +
      '<label class="f"><span>' + esc(mt('prog')) + '</span><textarea class="in" data-k="prog" maxlength="300" placeholder="' + esc(mt('progP')) + '">' + esc(d.prog) + '</textarea></label></div>';
  }
  /* état lu dans la page, pour redessiner (langue) sans rien perdre */
  function read() {
    return extra().map(function (el) { return { date: val(el, 'date'), time: val(el, 'time'), h: val(el, 'h') || '3', from: val(el, 'from'), prog: val(el, 'prog') }; });
  }
  function draw(list) {
    var p0 = $('mdP0') ? $('mdP0').value : '';
    var h = '';
    if (list.length) h += '<label class="f"><span>' + esc(mt('p0')) + '</span><textarea class="in" id="mdP0" maxlength="300" placeholder="' + esc(mt('progP')) + '">' + esc(p0) + '</textarea></label>';
    h += list.map(function (d, i) { return dayHtml(i + 2, d); }).join('');
    if (list.length + 1 < MAXD) h += '<button type="button" class="chip" id="mdAdd">' + esc(mt('add')) + '</button>';
    h += '<p class="mdHint">' + esc(mt('hint')) + '</p>';
    W.innerHTML = h;
  }
  function vis() { W.classList.toggle('hide', Q.type !== 'hourly' || !!EDIT); }
  W.addEventListener('click', function (e) {
    var a = e.target.closest('#mdAdd'), x = e.target.closest('.mdX');
    if (a) {
      var l = read(), last = l.length ? l[l.length - 1] : { date: $('date').value || today(1), time: $('time').value || '09:00', h: $('hours').value || '3', from: $('from').value.trim() };
      l.push({ date: addDays(last.date || today(1), 1), time: last.time || '09:00', h: last.h || '3', from: last.from || $('from').value.trim(), prog: '' });
      draw(l);
      var ds = extra(); if (ds.length) ds[ds.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (x) {
      var el = x.closest('.mdDay'), i = extra().indexOf(el), l2 = read();
      l2.splice(i, 1); draw(l2);
    }
  });
  draw([]); vis();
  $('type').addEventListener('click', function () { setTimeout(vis, 0); });
  var _al = applyLang;
  applyLang = function () { var r = _al.apply(this, arguments); try { draw(read()); } catch (x) {} return r; };

  /* ---------- tous les jours (jour 1 = les champs habituels), triés par date ---------- */
  function days() {
    var l = [{ date: $('date').value, time: $('time').value, h: Number($('hours').value) || 3, from: $('from').value.trim(), prog: $('mdP0') ? $('mdP0').value.trim() : '', n: 1 }];
    extra().forEach(function (el, i) {
      l.push({ date: val(el, 'date'), time: val(el, 'time'), h: Number(val(el, 'h')) || 3, from: val(el, 'from') || l[0].from, prog: val(el, 'prog'), n: i + 2 });
    });
    return l;
  }
  function multi() { return Q.type === 'hourly' && !EDIT && extra().length > 0; }
  function sorted(l) { return l.slice().sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; }); }

  /* ---------- devis : un par jour, prix additionnés ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('#go1') : null;
    if (!b || !multi() || b.getAttribute('aria-disabled')) return;
    e.stopPropagation(); e.preventDefault();
    err('e1', '');
    var l = days();
    for (var i = 0; i < l.length; i++) {
      var d = l[i];
      if (!d.from) return err('e1', mt('errDay', { n: d.n }) + t('errAddr'));
      if (!d.date || !d.time) return err('e1', mt('errDay', { n: d.n }) + t('errDate'));
      if (d.date < today(0)) return err('e1', mt('errDay', { n: d.n }) + t('errPast'));
    }
    busyBtn(b, true);
    var code = $('code').value.trim();
    Promise.all(l.map(function (d) { return api({ app: 'cquote', type: 'hourly', from: d.from, to: '', date: d.date, time: d.time, h: d.h, code: code }); })).then(function (rs) {
      busyBtn(b, false);
      for (var j = 0; j < rs.length; j++) {
        var r = rs[j];
        if (!r || !r.ok) return err('e1', mt('errDay', { n: l[j].n }) + (r && r.err === 'zone' ? t('errZone') : r && r.err === 'quota' ? t('errQuota') : t('errServer')));
      }
      var tot = JSON.parse(JSON.stringify(rs[0])), hh = 0;
      l.forEach(function (d, j) { hh += Number(rs[j].h) || d.h; });
      Object.keys(tot.prices).forEach(function (k) {
        var v = 0, w = 0, was = false;
        rs.forEach(function (r) { var p = r.prices[k] || { v: 0 }; v += Number(p.v) || 0; w += Number(p.was || p.v) || 0; if (p.was) was = true; });
        tot.prices[k].v = v; if (was) tot.prices[k].was = w; else delete tot.prices[k].was;
      });
      tot.h = hh;
      Q.res = tot; Q.days = sorted(l); Q.dayRes = rs;
      Q.q = { app: 'cquote', type: 'hourly', from: l[0].from, to: '', date: l[0].date, time: l[0].time, h: l[0].h, code: code };
      Q.car = '';
      showCars(); show(2);
    }).catch(function () { busyBtn(b, false); err('e1', t('errNet')); });
    if (!FLEET) api({ app: 'cfleet' }).then(function (r) { if (r && r.ok) { FLEET = r.cars; LS.set('rl_fleet', JSON.stringify(FLEET)); if (Q.res) showCars(); } }).catch(function () {});
  }, true);
  /* un trajet simple ou un seul jour : rien de changé */
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('#go1') : null;
    if (b && !multi()) Q.days = null;
  }, true);

  /* résumé : nombre de jours et heures au total */
  var _mh = metaHtml;
  metaHtml = function () {
    var h = _mh.apply(this, arguments);
    if (Q.days && Q.days.length > 1 && Q.res && Q.res.type === 'hourly') {
      var a = Q.days[0], z = Q.days[Q.days.length - 1];
      h = '<span><b>' + esc(mt('days', { n: Q.days.length, h: Q.res.h })) + '</b></span><span>' + esc(dateTxt(a.date, a.time)) + ' → ' + esc(dateTxt(z.date, z.time)) + '</span>' +
        h.replace(/^<span><b>[^<]*<\/b><\/span>/, '');
    }
    return h;
  };
  var _sc = showCars;
  showCars = function () {
    var r = _sc.apply(this, arguments);
    if (Q.days && Q.days.length > 1 && $('promoMsg')) $('promoMsg').textContent = mt('tot', { n: Q.days.length }) + ($('promoMsg').textContent ? ' · ' + $('promoMsg').textContent : '');
    return r;
  };

  /* ---------- réservation : une course par jour ---------- */
  function dShort(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] : iso; }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('#go3') : null;
    if (!b || EDIT || !(Q.days && Q.days.length > 1) || Q.type !== 'hourly' || b.getAttribute('aria-disabled')) return;
    var A = auth(); if (!A) return;
    e.stopPropagation(); e.preventDefault();
    var f = {}; ['fname', 'lname', 'tel', 'email', 'flight', 'notes'].forEach(function (k) { f[k] = $(k).value.trim(); }); f.tel = telVal('tel');
    err('e3', '');
    if (!f.lname || f.tel.replace(/\D/g, '').length < 8 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return err('e3', t('errFields'));
    LS.set('rl_me', JSON.stringify({ fname: f.fname, lname: f.lname, tel: f.tel, email: f.email }));
    busyBtn(b, true);
    var l = Q.days, n = l.length, a = dShort(l[0].date), z = dShort(l[n - 1].date), refs = [], first = null, i = 0;
    function noteFor(d, k) {
      var s = mt('note', { n: n, a: a, b: z, i: k + 1 });
      if (L !== 'fr') s = MT.en.note.split('{n}').join(n).split('{a}').join(a).split('{b}').join(z).split('{i}').join(k + 1);
      if (d.prog) s += ' · ' + (L === 'fr' ? MT.fr.progK : MT.en.progK) + ' : ' + d.prog;
      if (f.notes) s += ' · ' + f.notes;
      return s.replace(/[\r\n]+/g, ' ').slice(0, 590);
    }
    function next() {
      if (i >= n) return fini();
      var d = l[i];
      var body = { type: 'hourly', from: d.from, to: '', date: d.date, time: d.time, h: d.h, code: Q.q.code, car: Q.car, pax: Q.pax, bags: Q.bags,
        fname: f.fname, lname: f.lname, tel: f.tel, email: f.email, flight: '', notes: noteFor(d, i), pay: 'online', lang: L, cgv: CGV_V, e: (auth() || {}).e || '', k: (auth() || {}).k || '' };
      post('cbook', body).then(function (r) {
        if (!refs.length && r && r.err === 'auth') { busyBtn(b, false); LS.del('rl_auth'); gateShow(); return; }
        if (!refs.length && r && r.err === 'profil') { busyBtn(b, false); setProf(Object.assign({}, PROF || {}, { ok: false })); gateShow(); return; }
        if (!r || !r.ok) {
          if (!refs.length) { busyBtn(b, false); return err('e3', r && r.err === 'zone' ? t('errZone') : r && r.err === 'quota' ? t('errQuota') : r && r.err === 'champs' ? t('errFields') : r && r.err === 'cgv' ? t('errCgv') : t('errServer')); }
          return fini(i + 1);
        }
        refs.push(r.ref); if (!first) first = r;
        var mine = LS.json('rl_rides', []); mine.unshift({ ref: r.ref, c: r.c }); LS.set('rl_rides', JSON.stringify(mine.slice(0, 40)));
        LS.set('rl_stripe', r.stripe ? '1' : '0');
        i++; next();
      }).catch(function () {
        if (!refs.length) { busyBtn(b, false); return err('e3', t('errNet')); }
        fini(i + 1);
      });
    }
    function fini(failed) {
      busyBtn(b, false); RIDES = null;
      done(first, false);
      $('okRef').textContent = refs.join(' · ');
      $('okPay').innerHTML = '<p class="mini" style="margin:0 0 12px">' + esc(failed ? mt('partial', { r: refs.join(', '), n: failed }) : mt('okMany', { n: refs.length, r: refs.join(', ') })) + '</p>';
      Q.days = null; draw([]); if ($('mdP0')) $('mdP0').value = '';
    }
    next();
  }, true);
})();
