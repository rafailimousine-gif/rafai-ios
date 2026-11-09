/* ---------- rlFt v2 · Fast Track VIP ajouté à la main (9 nov. 2026, demande de Yassine) ----------
   Ajouté dans APP_HTML juste après l'onglet rlFt v1 par apply-ft2.js.
   - Onglet Fast Track VIP : bouton « + Ajouter un Fast Track » pour une course déjà enregistrée (ou une nouvelle course).
   - Formulaire « Nouvelle course » : case « Fast Track VIP (+240 €) » avec ses détails ; la demande arrive dans l'onglet. */
var FT_LANGS = ['Français', 'English', 'Español', 'Italiano', 'Deutsch', 'Português', 'العربية', '中文', 'Русский'];
function ft2Fields(P, o) {
  o = o || {};
  return '<div class="fg">' +
    '<label class="f">Type<select id="' + P + 'k"><option value="arr"' + (o.k === 'dep' ? '' : ' selected') + '>Arrivée · accueil à la sortie de l’avion</option>' +
      '<option value="dep"' + (o.k === 'dep' ? ' selected' : '') + '>Départ · accompagnement jusqu’à l’embarquement</option></select></label>' +
    '<label class="f">Vol<input id="' + P + 'fl" type="text" value="' + esc(o.flight || '') + '"></label>' +
    '<label class="f">Passagers<input id="' + P + 'px" type="number" min="1" value="' + esc(o.pax || 1) + '"></label>' +
    '<label class="f">Bagages<input id="' + P + 'bg" type="number" min="0" value="' + esc(o.bags == null ? 0 : o.bags) + '"></label>' +
    '<label class="f full">Pancarte (nom affiché)<input id="' + P + 'sg" type="text" value="' + esc(o.sign || '') + '"></label>' +
    '<label class="f">Langue de l’agent<select id="' + P + 'lg">' + FT_LANGS.map(function (l) { return '<option' + (l === (o.lang || 'Français') ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></label>' +
    '<label class="f full">Message pour l’agent<input id="' + P + 'ms" type="text" value="' + esc(o.msg || '') + '"></label>' +
  '</div>';
}
function ft2Read(P) {
  function v(id) { var e = document.getElementById(P + id); return e ? String(e.value || '').trim() : ''; }
  return { k: v('k') === 'dep' ? 'dep' : 'arr', flight: v('fl'), pax: Number(v('px')) || 1, bags: Number(v('bg')) || 0, sign: v('sg'), lang: v('lg'), msg: v('ms') };
}
function ft2Fill(P, b) {
  if (!b) return;
  function set(id, val) { var e = document.getElementById(P + id); if (e && val != null && val !== '') e.value = val; }
  set('fl', String(b.flight || '').toUpperCase());
  set('px', b.pax); set('bg', b.bags);
  if (b.lname) set('sg', 'M. / Mme ' + String(b.lname).toUpperCase());
  if (/a[ée]roport|airport|\bcdg\b|\bory\b|\borly\b|roissy|bourget/i.test(String(b.to || '')) && !/a[ée]roport|airport|\bcdg\b|\bory\b|\borly\b|roissy|bourget/i.test(String(b.from || ''))) set('k', 'dep');
}
/* « + Ajouter un Fast Track » : pour une course déjà enregistrée */
function ft2Open() {
  var have = {}; (FT.list || []).forEach(function (o) { have[o.ref] = 1; });
  var t0 = today();
  var L = (S.bookings || []).filter(function (b) { return b.status !== 'Annulée' && !have[b.ref] && String(b.date || '') >= t0; })
    .sort(function (a, b) { return (String(a.date) + String(a.time)).localeCompare(String(b.date) + String(b.time)); });
  var h = head('FAST TRACK VIP', 'Ajouter un Fast Track', 'Accueil VIP à l’aéroport par Global VIP Exclusive Services') + '<div class="sb">' +
    '<div class="box"><h3>Course</h3><label class="f">Course du client<select id="ftaRef"><option value="">— Choisir une course —</option>' +
      L.map(function (b) {
        var d = b.date || ''; try { d = frDate(b.date); } catch (e) {}
        return '<option value="' + esc(b.ref) + '">' + esc(d + ' ' + (b.time || '') + ' · ' + ((b.fname || '') + ' ' + (b.lname || '')).trim() + ' · ' + (b.from || '') + ' → ' + (b.to || '') + ' · ' + b.ref) + '</option>';
      }).join('') + '</select></label>' +
      '<p class="hint" style="margin-top:8px">La course n’est pas encore créée ? <a href="#" id="ftaNew">Nouvelle course avec Fast Track</a></p></div>' +
    '<div class="box"><h3>✦ Fast Track VIP</h3>' + ft2Fields('fta') + '</div>' +
    '<div class="row"><button class="btn dark" id="ftaSave" type="button">' + I.plus + 'Ajouter le Fast Track</button></div>' +
    '<p class="hint" style="margin-top:10px">La demande arrive dans l’onglet Fast Track VIP, prête à envoyer à Global VIP. Pensez à ajouter les ' + 240 + ' € au prix de la course si le client paie l’option.</p></div>';
  openSheet(h);
  var sel = document.getElementById('ftaRef');
  sel.addEventListener('change', function () { ft2Fill('fta', ftBk(sel.value)); });
  document.getElementById('ftaNew').addEventListener('click', function (e) { e.preventDefault(); window.__ftNew = 1; openNew(); });
  document.getElementById('ftaSave').addEventListener('click', function (e) {
    var btn = e.currentTarget, ref = sel.value;
    if (!ref) { toast('Choisissez la course', true); return; }
    busy(btn, true);
    call('ftAdd', { ref: ref, ft: ft2Read('fta') }).then(function (r) {
      busy(btn, false); ftSet(r && r.item); closeSheet(); toast('Fast Track VIP ajouté à ' + ref); FT.f = 'todo'; if (S.view === 'ft') renderFt(); else ftBadge();
    }).catch(function (er) { busy(btn, false); toast(String(er), true); });
  });
}
/* Formulaire « Nouvelle course » : case Fast Track VIP */
function ft2NewBox() {
  var cb = document.getElementById('createB');
  if (!cb || document.getElementById('ftNB')) return;
  var row = cb.closest('.row') || cb.parentNode;
  var box = document.createElement('div'); box.className = 'box'; box.id = 'ftNB';
  box.innerHTML = '<h3>✦ Fast Track VIP</h3>' +
    '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-weight:600;font-size:14px;margin:4px 0"><input type="checkbox" id="ftnOn" style="width:20px;height:20px;flex:none"> <span>Ajouter le Fast Track VIP (+240 €) · accueil VIP à l’aéroport par Global VIP</span></label>' +
    '<div id="ftnF" style="display:none;margin-top:10px">' + ft2Fields('ftn') + '<p class="hint" id="ftnP" style="margin-top:6px"></p></div>';
  row.parentNode.insertBefore(box, row);
  var on = document.getElementById('ftnOn'), F = document.getElementById('ftnF'), po = document.getElementById('npo'), added = false;
  function price() { return po ? Number(String(po.value || '').replace(',', '.').replace(/[^\d.]/g, '')) : NaN; }
  on.addEventListener('change', function () {
    F.style.display = on.checked ? '' : 'none';
    var nb = document.getElementById('newBox'), b = {};
    if (on.checked && nb) { ['flight', 'pax', 'bags', 'lname', 'from', 'to'].forEach(function (k) { var i = nb.querySelector('[data-k="' + k + '"]'); if (i) b[k] = i.value; }); ft2Fill('ftn', b); }
    var p = price(), msg = document.getElementById('ftnP');
    if (on.checked && !added && po && p > 0) { po.value = String(Math.round((p + 240) * 100) / 100); added = true; }
    else if (!on.checked && added && po && p >= 240) { po.value = String(Math.round((p - 240) * 100) / 100); added = false; }
    if (msg) msg.textContent = on.checked ? (added ? 'Les 240 € sont ajoutés au prix client.' : 'Pensez à mettre les 240 € dans le prix client.') : '';
  });
  if (window.__ftNew) { window.__ftNew = 0; on.checked = true; on.dispatchEvent(new Event('change')); }
}
(function () {
  if (typeof openNew === 'function') { var _on = openNew; openNew = function () { var r = _on.apply(this, arguments); try { ft2NewBox(); } catch (e) {} return r; }; }
  if (typeof call === 'function') {
    var _c = call;
    call = function (name, p) {
      var withFt = false;
      if (name === 'createBooking' && p && !p.ft) { var on = document.getElementById('ftnOn'); if (on && on.checked) { p.ft = ft2Read('ftn'); withFt = true; } }
      var pr = _c.apply(this, arguments);
      if (withFt && pr && pr.then) pr.then(function () { FT.t = 0; ftLoad(true); }, function () {});
      return pr;
    };
  }
  var _rf = renderFt;
  renderFt = function () {
    var r = _rf.apply(this, arguments);
    try {
      var hd = document.querySelector('#app .head');
      if (hd && !document.getElementById('ftAddB')) {
        var b = document.createElement('button'); b.className = 'btn dark'; b.id = 'ftAddB'; b.type = 'button';
        b.innerHTML = I.plus + 'Ajouter un Fast Track';
        b.addEventListener('click', ft2Open);
        hd.appendChild(b);
      }
    } catch (e) {}
    return r;
  };
})();
