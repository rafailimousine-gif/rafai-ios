/* ===================== Suppression automatique des positions GPS =====================
   La politique de confidentialité annonce : « les positions sont conservées 30 jours après la course ».
   Une fois par jour, on efface les colonnes « Position GPS » et « Position reçue »
   des courses passées depuis plus de 30 jours. Rien d'autre n'est touché.
   Si la date d'une course est illisible, la ligne reste telle quelle.

   Mise en place : coller ce bloc à la fin de Code.gs, enregistrer, puis lancer une seule fois
   installerPurgeGps (elle crée le passage quotidien et note dans le journal le nombre de courses concernées). */
var GPS_KEEP_DAYS = 30;
var GPS_PURGE_MAX = 300; // au plus 300 courses par passage ; le reste passe le lendemain

function gpsCourseMs_(o) {
  var d = null;
  try { d = startDate_(o); } catch (e) { d = null; }
  var ms = d && d.getTime ? d.getTime() : NaN;
  return isFinite(ms) && ms > 0 ? ms : NaN;
}

/* Les courses à effacer : position présente et course plus vieille que la durée annoncée */
function gpsPurgeList_(list, nowMs) {
  var limit = nowMs - GPS_KEEP_DAYS * 86400000;
  return (list || []).filter(function (o) {
    if (!o || !o.ref || (!o.trkPos && !o.trkPosAt)) return false;
    var ms = gpsCourseMs_(o);
    return isFinite(ms) && ms < limit;
  });
}

function purgePositionsGps() {
  var done = 0;
  locked_(function () {
    var b = book_();
    gpsPurgeList_(listBookings_(b), Date.now()).slice(0, GPS_PURGE_MAX).forEach(function (o) {
      var row = findRow_(b, o.ref);
      if (!row) return;
      setCells_(b, row, { trkPos: '', trkPosAt: '' });
      done++;
    });
  });
  if (done) { try { log_('', 'Positions GPS effacées', done + ' course(s) de plus de ' + GPS_KEEP_DAYS + ' jours', 'Automatique'); } catch (e) {} }
  return done;
}

/* À lancer une seule fois. N'efface rien : le premier passage a lieu la nuit suivante. */
function installerPurgeGps() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'purgePositionsGps') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('purgePositionsGps').timeBased().everyDays(1).atHour(4).create();
  var n = gpsPurgeList_(listBookings_(book_()), Date.now()).length;
  Logger.log('Suppression GPS installée. Courses concernées au prochain passage : ' + n);
  return n;
}
