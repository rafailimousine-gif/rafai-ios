/* ---------- rlDrvStat v1 (12 nov. 2026, demande de Yassine) : onglet Chauffeurs en lignes, appli installée, dernière position ----------
 * DRV_SEEN_<id> : dernière ouverture de l'appli RL Driver (une écriture au plus toutes les 10 min)
 * GPS_POS_<id>  : dernière position envoyée par le GPS du chauffeur (Overland), « lat,lng|ms », même hors course
 * driverStatus_() : état de chaque chauffeur pour l'onglet Chauffeurs (appli, GPS, dernière position)
 *
 * Branchements dans Code.gs :
 * - drvAppRoute_ : if (q.app === 'drv') { drvSeen_(id, k); return drvAppApi_(id, k); }
 * - gpsIn_       : après « if (best && nowMs - best.t > GPS_MAX_AGE_MIN * 60000) best = null; » → if (best) gpsLastSave_(d.id, best, props);
 * - api          : case 'driverStatus': return driverStatus_(); */
function drvSeen_(id, k) {
  try {
    if (!id || !k || id === 'TEAM' || k !== drvAppKey_(id)) return;
    var p = PropertiesService.getScriptProperties(), now = Date.now();
    if (now - (Number(p.getProperty('DRV_SEEN_' + id)) || 0) > 600000) p.setProperty('DRV_SEEN_' + id, String(now));
  } catch (e) {}
}
function gpsLastSave_(id, best, props) {
  try {
    var cur = String(props.getProperty('GPS_POS_' + id) || '').split('|'), t = Number(cur[1]) || 0;
    if (best.t > t && (best.t - t > 60000 || cur[0] !== best.pos)) props.setProperty('GPS_POS_' + id, best.pos + '|' + best.t);
  } catch (e) {}
}
function driverStatus_() {
  var all = PropertiesService.getScriptProperties().getProperties(), out = {};
  var js = function (k) { try { return JSON.parse(all[k] || '[]') || []; } catch (e) { return []; } };
  listDrivers_().forEach(function (d) {
    var id = d.id, np = js('NPUSH_' + id), ws = js('PUSH_SUB_' + id), pos = String(all['GPS_POS_' + id] || '').split('|');
    var nAt = np.reduce(function (m, x) { return Math.max(m, Number(x && x.at) || 0); }, 0);
    out[id] = {
      app: np.length ? String(np[np.length - 1].os || 'ios') : (ws.length ? 'web' : ''),
      appAt: Math.max(Number(all['DRV_SEEN_' + id]) || 0, nAt),
      gpsAt: Number(all['GPS_AT_' + id]) || 0,
      pos: pos[0] || '', posAt: Number(pos[1]) || 0, ref: ''
    };
  });
  /* pendant une course, la position du suivi (appli ou GPS) peut être plus récente */
  try {
    listBookings_(book_()).forEach(function (b) {
      var o = b.driverId && out[b.driverId];
      if (!o || !b.trkPos) return;
      var t = Number(String(b.trkPosAt || '').replace(/\D/g, '')) || 0, p = String(b.trkPos).replace(/^'/, '');
      if (t > o.posAt && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(p)) { o.pos = p; o.posAt = t; o.ref = b.ref; }
    });
  } catch (e) {}
  return { status: out, now: Date.now() };
}
