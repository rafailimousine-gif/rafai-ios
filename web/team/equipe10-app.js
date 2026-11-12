/* ---------- rlTeam10 v1 (12 nov. 2026, demande de Yassine) : onglet Chauffeurs en lignes ----------
 * Une ligne par chauffeur : photo, nom, téléphone, véhicule, appli RL Driver (installée ou non), position, prochaine course.
 * Bouton « Carte » : la dernière position de chaque chauffeur sur une carte, même hors course (GPS du chauffeur).
 * Données : call('driverStatus') (voir drv-statut.gs), relu toutes les minutes tant que l'onglet est ouvert.
 * La recherche existante (drvListFilter) marche toujours : chaque ligne garde la classe dcard et son data-s. */
var DL = { mode: 'list', st: null, at: 0, busy: 0, map: null, layer: null };
function dlAgo(ms) {
  if (!ms) return '';
  var m = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (m < 1) return 'à l’instant';
  if (m < 60) return 'il y a ' + m + ' min';
  var h = Math.round(m / 60);
  if (h < 24) return 'il y a ' + h + ' h';
  return 'il y a ' + Math.round(h / 24) + ' j';
}
function dlApp(x) {
  if (!x) return { c: '', t: '…', s: '' };
  var seen = x.appAt ? 'ouverte ' + dlAgo(x.appAt) : '';
  if (x.app === 'ios') return { c: 'ok', t: 'Installée · iPhone', s: seen };
  if (x.app === 'android') return { c: 'ok', t: 'Installée · Android', s: seen };
  if (x.app === 'web') return { c: 'mid', t: 'Version web', s: seen || 'notifications activées' };
  if (x.appAt) return { c: 'mid', t: 'Ouverte, sans notifications', s: seen };
  return { c: 'no', t: 'Pas installée', s: '' };
}
function dlGps(x) {
  if (!x) return { c: '', t: '…', s: '' };
  if (x.pos && x.posAt) {
    var age = Date.now() - x.posAt;
    return { c: age < 20 * 60000 ? 'ok' : (age < 24 * 3600000 ? 'mid' : 'no'), t: dlAgo(x.posAt), s: x.ref ? 'course ' + x.ref : (age < 20 * 60000 ? 'en direct' : 'dernière position') };
  }
  if (x.gpsAt) return { c: 'mid', t: 'GPS relié', s: 'pas encore de position' };
  return { c: 'no', t: 'Pas de GPS', s: '' };
}
function dlLL(p) { var a = String(p || '').split(','), la = Number(a[0]), lo = Number(a[1]); return isFinite(la) && isFinite(lo) && (la || lo) ? [la, lo] : null; }
function dlCells(id) {
  var x = DL.st && DL.st[id], a = dlApp(x), g = dlGps(x);
  return {
    app: '<span class="dlb ' + a.c + '">' + esc(a.t) + '</span>' + (a.s ? '<small>' + esc(a.s) + '</small>' : ''),
    gps: '<span class="dlb ' + g.c + '">' + esc(g.t) + '</span>' + (g.s ? '<small>' + esc(g.s) + '</small>' : '') +
      (x && dlLL(x.pos) ? '<button type="button" class="dlmap" data-dlmap="' + esc(id) + '">Voir sur la carte</button>' : '')
  };
}
function dlFill() {
  $$('#drvGrid [data-dlid]').forEach(function (r) {
    var c = dlCells(r.dataset.dlid), a = $('.dl-app', r), g = $('.dl-gps', r);
    if (a) a.innerHTML = c.app;
    if (g) g.innerHTML = c.gps;
  });
  var n = DL.st ? S.drivers.filter(function (d) { var x = DL.st[d.id]; return x && (x.app === 'ios' || x.app === 'android'); }).length : null;
  var e = $('#dlInst'); if (e) e.textContent = n === null ? '' : n + ' / ' + S.drivers.length + ' avec l’appli installée';
  if (DL.mode === 'map') dlMapPaint(false);
}
function dlLoad(force) {
  if (DL.busy || (!force && DL.st && Date.now() - DL.at < 50000)) return;
  DL.busy = 1;
  call('driverStatus', {}).then(function (r) { DL.busy = 0; DL.st = (r && r.status) || {}; DL.at = Date.now(); if (S.view === 'drivers') dlFill(); })
    .catch(function () { DL.busy = 0; if (!DL.st) { DL.st = {}; if (S.view === 'drivers') dlFill(); } });
}
function dlRow(d) {
  var ph = (S.photos || {})[d.id] || {}, c = dlCells(d.id);
  var up = S.bookings.filter(function (b) { return b.driverId === d.id && isUpcoming(b); }).sort(function (a, b) { return sortKey(a) < sortKey(b) ? -1 : 1; });
  var st = d.blocked ? '<b class="dlred">Bloqué</b>' : (d.active === 'Oui' ? 'Actif' : 'Inactif');
  var veh = [d.car, d.plate].filter(Boolean).join(' · ');
  return '<div class="dcard drow' + (d.active === 'Oui' ? '' : ' off') + '" data-s="' + esc(drvHay(d)) + '" data-dlid="' + esc(d.id) + '">' +
    '<div class="dl-who">' + (ph.drv ? '<img class="av" src="' + ph.drv + '" alt="">' : '<span class="av">' + esc(initials(drvName(d))) + '</span>') +
      '<div class="dl-n"><b>' + esc(drvName(d)) + '</b><small>' + esc(d.id) + ' · ' + st + (d.company ? ' · ' + esc(d.company) : '') + '</small></div></div>' +
    '<div class="dl-tel">' + (d.tel ? esc(d.tel) : '<span class="hint">—</span>') + '</div>' +
    '<div class="dl-veh">' + (veh ? esc(veh) : '<span class="hint">—</span>') + (d.carType ? '<small>' + esc(carShort(d.carType)) + '</small>' : '') + '</div>' +
    '<div class="dl-app">' + c.app + '</div>' +
    '<div class="dl-gps">' + c.gps + '</div>' +
    '<div class="dl-next">' + (up.length ? esc(shortDate(up[0].date)) + ' ' + esc(up[0].time) + '<small>' + up.length + ' course(s)</small>' : '<span class="hint">aucune</span>') + '</div>' +
    '<div class="dl-act"><button class="btn small" type="button" data-dledit="' + esc(d.id) + '">' + I.edit + 'Fiche</button>' +
      (d.tel ? '<a class="btn small" href="' + esc(telHref(d.tel)) + '" title="Appeler">' + I.phone + '</a><a class="btn small" target="_blank" rel="noopener" href="' + esc(waLink(d.tel)) + '" title="WhatsApp">' + I.wa + '</a>' : '') +
    '</div></div>';
}
function dlEnhance() {
  var grid = $('#drvGrid'), app = $('#app');
  if (!app) return;
  /* photos des catégories repliées : elles restent accessibles mais prennent moins de place */
  var cat = $('#catBox');
  if (cat && !cat.closest('details')) {
    var det = document.createElement('details'); det.className = 'dlcat';
    det.innerHTML = '<summary>Photos des véhicules par catégorie</summary>';
    cat.parentNode.insertBefore(det, cat); det.appendChild(cat);
  }
  var bar = document.createElement('div'); bar.className = 'dlbar';
  bar.innerHTML = '<div class="cpseg"><button type="button" data-dlmode="list"' + (DL.mode === 'list' ? ' class="on"' : '') + '>Liste</button>' +
    '<button type="button" data-dlmode="map"' + (DL.mode === 'map' ? ' class="on"' : '') + '>Carte</button></div><span class="hint" id="dlInst"></span>';
  var anchor = grid ? grid.previousElementSibling : null;
  if (anchor && anchor.classList.contains('filters')) anchor.parentNode.insertBefore(bar, anchor); else if (grid) grid.parentNode.insertBefore(bar, grid); else app.appendChild(bar);
  if (grid) {
    var D = S.drivers.slice().sort(function (a, b) { return (a.active === b.active ? 0 : a.active === 'Oui' ? -1 : 1) || drvName(a).localeCompare(drvName(b)); });
    grid.className = 'dlist';
    grid.innerHTML = '<div class="dlhead"><span>Chauffeur</span><span>Téléphone</span><span>Véhicule</span><span>Appli RL Driver</span><span>Position</span><span>Prochaine course</span><span></span></div>' + D.map(dlRow).join('');
    var mp = document.createElement('div'); mp.id = 'dlMapBox'; mp.innerHTML = '<div id="dlMap"></div><p class="hint" id="dlMapN"></p>';
    grid.parentNode.insertBefore(mp, grid.nextSibling);
    $$('[data-dledit]', grid).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); openDriver(b.dataset.dledit); }); });
    $$('.drow', grid).forEach(function (r) {
      r.addEventListener('click', function (e) {
        if (e.target.closest('a,button,input,label')) return;
        openDriver(r.dataset.dlid);
      });
    });
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-dlmap]'); if (!b) return;
      e.stopPropagation(); dlMode('map', b.dataset.dlmap);
    });
    if (S.dq) drvListFilter(S.dq);
  }
  $$('[data-dlmode]', bar).forEach(function (b) { b.addEventListener('click', function () { dlMode(b.dataset.dlmode); }); });
  dlMode(DL.mode, null, true);
  dlFill();
  dlLoad(false);
}
function dlMode(m, focus, quiet) {
  DL.mode = m === 'map' ? 'map' : 'list';
  $$('[data-dlmode]').forEach(function (b) { b.classList.toggle('on', b.dataset.dlmode === DL.mode); });
  var g = $('#drvGrid'), f = $('.dlbar + .filters') || (g && g.previousElementSibling), box = $('#dlMapBox');
  if (g) g.style.display = DL.mode === 'map' ? 'none' : '';
  if (f && f.classList && f.classList.contains('filters')) f.style.display = DL.mode === 'map' ? 'none' : 'flex';
  if (box) box.style.display = DL.mode === 'map' ? 'block' : 'none';
  if (DL.mode === 'map') {
    loadLeaflet(function () {
      var el = $('#dlMap'); if (!el || !window.L) return;
      if (!DL.map || DL.map.getContainer() !== el) {
        DL.map = L.map(el, { zoomControl: true }).setView([48.8566, 2.3522], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(DL.map);
        DL.layer = L.layerGroup().addTo(DL.map);
      }
      setTimeout(function () { try { DL.map.invalidateSize(); } catch (e) {} dlMapPaint(true, focus); }, 60);
    });
    dlLoad(true);
  } else if (!quiet) {
    var q = $('#dq'); if (q && S.dq) drvListFilter(S.dq);
  }
}
function dlMapPaint(fit, focus) {
  if (!DL.map || !DL.layer || !window.L) return;
  DL.layer.clearLayers();
  var pts = [], hit = null;
  S.drivers.forEach(function (d) {
    var x = DL.st && DL.st[d.id], ll = x && dlLL(x.pos);
    if (!ll) return;
    var ph = (S.photos || {})[d.id] || {}, age = Date.now() - (x.posAt || 0), cls = age < 20 * 60000 ? 'ok' : (age < 24 * 3600000 ? 'mid' : 'no');
    var ic = L.divIcon({ className: 'dlpin ' + cls, iconSize: [44, 44], iconAnchor: [22, 22],
      html: ph.drv ? '<img src="' + ph.drv + '" alt="">' : '<span>' + esc(initials(drvName(d))) + '</span>' });
    var mk = L.marker(ll, { icon: ic, title: drvName(d) }).bindPopup(
      '<b>' + esc(drvName(d)) + '</b><br>' + esc([d.car, d.plate].filter(Boolean).join(' · ')) +
      '<br><span style="color:#6b6b70">Position ' + esc(dlAgo(x.posAt)) + (x.ref ? ' · course ' + esc(x.ref) : '') + '</span>' +
      (d.tel ? '<br><a href="' + esc(telHref(d.tel)) + '">Appeler</a> · <a target="_blank" rel="noopener" href="' + esc(waLink(d.tel)) + '">WhatsApp</a>' : '') +
      '<br><a target="_blank" rel="noopener" href="https://www.google.com/maps?q=' + ll.join(',') + '">Ouvrir dans Maps</a>');
    mk.addTo(DL.layer); pts.push(ll);
    if (focus && focus === d.id) hit = { mk: mk, ll: ll };
  });
  var n = $('#dlMapN');
  if (n) n.textContent = pts.length ? pts.length + ' chauffeur(s) sur la carte · dernière position envoyée par leur GPS, même hors course · mise à jour chaque minute'
    : (DL.st ? 'Aucune position pour l’instant : la position apparaît quand le GPS du chauffeur est activé.' : 'Chargement des positions…');
  if (hit) { DL.map.setView(hit.ll, 15); hit.mk.openPopup(); }
  else if (fit && pts.length) { if (pts.length === 1) DL.map.setView(pts[0], 13); else DL.map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 }); }
}
(function () {
  if (typeof renderDrivers !== 'function') return;
  var _rd = renderDrivers;
  renderDrivers = function () { _rd.apply(this, arguments); try { dlEnhance(); } catch (e) { try { console.warn('rlTeam10', e); } catch (x) {} } };
  setInterval(function () { if (S.view === 'drivers' && !document.hidden) dlLoad(false); }, 60000);
})();
