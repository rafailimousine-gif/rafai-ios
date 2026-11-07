/* ---------- courses GNet : chaque alerte e-mail de GNet devient une course dans l'Espace équipe ----------
   Copie de ce qui a été ajouté dans Code.gs (projet « Espace équipe Rafai Limousine »).
   GNet (Settings > Alerts) envoie les alertes New Trip, Cancel et Update à contact@ et à rafai.yassine@.
   Le script lit la boîte rafai.yassine@ (expéditeur noreply@grdd.net, 3 derniers jours) :
   - « New trip from <compte> for <date> » : nouvelle course « À confirmer », source « GNet »,
     paiement « Paiement par notre partenaire ». Le numéro de réservation GNet est gardé dans GNET_<n°>.
   - « Reservation Cancellation notice, res #<n°> » : la course passe en « Annulée », alerte à l'équipe.
   - alerte de modification avec un n° de réservation : date, heure, adresses, passagers et véhicule mis à jour, alerte à l'équipe.
   Les essais de GNet (« GNet Farmout Test account ») sont ignorés. Chaque e-mail n'est traité qu'une fois (GNET_SEEN).
   La cloche et la notification « Nouvelle course » partent comme pour une demande du site (teamAlertTick_).

   Autre branchement dans Code.gs :
   - veilleSuivi() : try { gnetPoll_(); } catch (e) {} juste avant teamAlertTick_() */
var GNET_FROM = 'noreply@grdd.net', GNET_SRC = 'GNet', GNET_TEST = /farmout test/i;
var GNET_AIRPORTS = { CDG: 'Aéroport Paris-Charles de Gaulle (CDG)', ORY: 'Aéroport Paris-Orly (ORY)', LBG: 'Aéroport Paris-Le Bourget (LBG)', BVA: 'Aéroport Paris-Beauvais (BVA)' };

/* Lecture d'un e-mail GNet : { kind: 'new' | 'cancel' | 'update', res, account, date, time, veh, pax, from, to, name, tel, flight } ou null */
function gnetParse_(subject, body) {
  subject = String(subject || '');
  body = String(body || '').replace(/\r/g, '').replace(/[ \t\u00a0]+/g, ' ');
  var one = function (re) { var m = body.match(re); return m ? m[1].trim() : ''; };
  var kind = /^\s*New trip from /i.test(subject) ? 'new'
    : /cancell?ation notice|reservation .*cancell?ed/i.test(subject) ? 'cancel'
    : /updat|modif|chang/i.test(subject) ? 'update' : '';
  if (!kind) return null;
  var res = (subject.match(/res(?:ervation)?\s*#\s*:?\s*(\d{6,})/i) || body.match(/Reservation\s*#\s*:?\s*(\d{6,})/i) || [])[1] || '';
  if (!res) return null;
  var account = (subject.match(/^\s*New trip from (.+?) for \d{4}-/i) || [])[1]
    || one(/reservation from:?\s*([^\n(]+?)\s*(?:\(|\n|Account #|$)/i);
  var t = body.match(/Time:\s*(\d{4}-\d{2}-\d{2})[ T](\d{1,2}:\d{2})/i) || [];
  var stop = '(?=\\s*(?:Drop ?Off:|Pickup:|Thank you|Passengers?:|Vehicle Type:|\\n|$))';
  return {
    kind: kind, res: res, account: String(account || '').trim(),
    date: t[1] || '', time: t[2] ? ('0' + t[2]).slice(-5) : '',
    veh: one(/Vehicle Type:\s*([A-Z0-9_]+)/i).toUpperCase(),
    pax: one(/Passengers:\s*(\d+)/i),
    from: one(new RegExp('Pickup:\\s*(.+?)' + stop, 'i')),
    to: one(new RegExp('Drop ?Off:\\s*(.+?)' + stop, 'i')),
    name: one(/Passenger Name:\s*([^\n]+)/i),
    tel: one(/(?:Passenger )?Phone:\s*([+\d][\d\s().-]{5,})/i),
    flight: one(/Flight(?: #| Number| No\.?)?:\s*([A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?)/i)
  };
}
function gnetPlace_(s) { s = String(s || '').trim(); return GNET_AIRPORTS[s.toUpperCase()] || s; }
function gnetCar_(veh) {
  veh = String(veh || '').toUpperCase();
  if (/VAN|SPRINTER|MINI_?BUS/.test(veh)) return CARS[2];
  if (/SUV/.test(veh)) return CARS[3];
  if (/LUX|FIRST|EXEC|PREM/.test(veh)) return CARS[1];
  return CARS[0];
}
function gnetService_(g) {
  var air = /\b(CDG|ORY|LBG|BVA)\b|a[ée]roport|airport|roissy|orly|charles de gaulle|le bourget|beauvais/i;
  if (!g.to || /as directed|hourly|à disposition/i.test(g.to)) return SERVICES[2];
  return air.test(g.from) || air.test(g.to) ? SERVICES[0] : SERVICES[1];
}
function gnetNote_(g) { return 'GNet · réservation n° ' + g.res + (g.account ? ' · ' + g.account : '') + (g.veh ? ' · ' + g.veh : ''); }

/* Nouvelle course dans la feuille (même chemin qu'une saisie, sans e-mail ni SMS au client) */
function gnetCreate_(g) {
  var b = book_(), ref = nextRef_(b), row = [];
  for (var i = 0; i < b.lc; i++) row.push('');
  var v = {
    ref: ref, received: now_(), status: 'À confirmer', src: GNET_SRC, updated: now_(),
    service: gnetService_(g), date: isoDate_(g.date), time: hhmm_(g.time),
    from: gnetPlace_(g.from), to: gnetPlace_(g.to), car: gnetCar_(g.veh), pax: g.pax,
    flight: g.flight, lname: g.name || g.account || 'Client GNet', tel: g.tel,
    booker: g.account ? g.account + ' (GNet)' : 'GNet', pay: PAYS[4], internal: gnetNote_(g)
  };
  if (v.from && v.to) v.routeUrl = mapsUrl_(v);
  Object.keys(v).forEach(function (k) { if (b.idx[k]) row[b.idx[k] - 1] = cell_(v[k]); });
  b.sh.appendRow(row);
  PropertiesService.getScriptProperties().setProperty('GNET_' + g.res, ref);
  log_(ref, 'Nouvelle course', 'GNet · n° ' + g.res + ' · ' + (g.account || '') + ' · ' + v.date + ' ' + v.time, GNET_SRC);
  return ref;
}
/* Course déjà créée pour ce n° GNet, ou null si elle n'existe pas (ou plus) dans la feuille */
function gnetFind_(res) {
  var ref = PropertiesService.getScriptProperties().getProperty('GNET_' + res), b = book_();
  if (!ref || findRow_(b, ref) < 0) return null;
  return { b: b, ref: ref, bk: getBooking_(b, ref) };
}
function gnetMissing_(title, g) {
  ntfAdd_('', title, 'Réservation n° ' + g.res + (g.date ? ' · ' + shortDate_(g.date) + (g.time ? ' à ' + g.time : '') : '') + ' (course absente de l’Espace équipe)');
  return '';
}
function gnetCancel_(g) {
  var f = gnetFind_(g.res);
  if (!f) return gnetMissing_('Annulation GNet', g);
  var b = f.b, bk = f.bk, ref = f.ref;
  if (bk.status === 'Annulée') return ref;
  setCells_(b, bk._row, { status: 'Annulée', updated: now_() });
  log_(ref, 'Annulation', 'Annulée sur GNet (n° ' + g.res + ')', GNET_SRC);
  teamAlertEvent_(getBooking_(b, ref), 'Annulation GNet');
  return ref;
}
function gnetUpdate_(g) {
  var f = gnetFind_(g.res);
  if (!f) return gnetMissing_('Modification GNet', g);
  var b = f.b, bk = f.bk, ref = f.ref, set = {}, ch = [];
  var put = function (k, val) { if (val && String(val) !== String(bk[k] || '')) { set[k] = val; ch.push(BOOK_COLS[k] || k); } };
  put('date', isoDate_(g.date)); put('time', hhmm_(g.time)); put('from', gnetPlace_(g.from)); put('to', gnetPlace_(g.to));
  put('pax', g.pax); if (g.veh) put('car', gnetCar_(g.veh));
  if (!ch.length) { teamAlertEvent_(bk, 'Modification GNet'); return ref; }
  if (set.date || set.time) { set.trkWatch = ''; set.trkAlert = ''; }
  if (set.from || set.to) { set.routeUrl = mapsUrl_({ from: set.from || bk.from, to: set.to || bk.to, stops: bk.stops }); set.route = ''; }
  set.updated = now_();
  setCells_(b, bk._row, set);
  log_(ref, 'Modification', 'Modifiée sur GNet : ' + ch.join(', '), GNET_SRC);
  teamAlertEvent_(getBooking_(b, ref), 'Modification GNet');
  return ref;
}

/* Lancé par veilleSuivi() à chaque passage (au plus une fois par minute). dry = true : lit seulement, sans rien écrire. */
function gnetPoll_(dry) {
  var P = PropertiesService.getScriptProperties(), now = Date.now();
  if (!dry && now - (Number(P.getProperty('GNET_AT')) || 0) < 50000) return 'GNet : déjà lu il y a moins d’une minute';
  if (!dry) P.setProperty('GNET_AT', String(now));
  var seen = [];
  try { seen = JSON.parse(P.getProperty('GNET_SEEN') || '[]') || []; } catch (e) { seen = []; }
  var msgs = [];
  GmailApp.search('from:' + GNET_FROM + ' newer_than:3d', 0, 50).forEach(function (th) {
    th.getMessages().forEach(function (m) { if (seen.indexOf(m.getId()) < 0) msgs.push(m); });
  });
  msgs.sort(function (a, b) { return a.getDate() - b.getDate(); });
  var done = [], out = [];
  msgs.forEach(function (m) {
    var g = gnetParse_(m.getSubject(), m.getPlainBody());
    done.push(m.getId());
    if (!g) return;
    if (GNET_TEST.test(g.account) || GNET_TEST.test(m.getSubject()) || GNET_TEST.test(m.getPlainBody())) { out.push('essai ignoré ' + g.res); return; }
    if (dry) { out.push(g.kind + ' ' + g.res + ' ' + g.date + ' ' + g.time); return; }
    try {
      var ref = locked_(function () {
        if (g.kind === 'new') return P.getProperty('GNET_' + g.res) || gnetCreate_(g);
        if (g.kind === 'cancel') return gnetCancel_(g);
        return gnetUpdate_(g);
      });
      out.push(g.kind + ' ' + g.res + ' → ' + (ref || '?'));
    } catch (e) { out.push('erreur ' + g.res + ' : ' + e.message); done.pop(); }
  });
  if (!dry && done.length) P.setProperty('GNET_SEEN', JSON.stringify(seen.concat(done).slice(-300)));
  return out.length ? out.join(' · ') : 'GNet : rien de nouveau';
}
/* À lancer depuis l'éditeur pour voir ce que le script lit, sans rien changer */
function gnetEssai() { var r = gnetPoll_(true); Logger.log(r); return r; }
