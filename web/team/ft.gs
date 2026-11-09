/* ---------- rlFt v1 : Fast Track VIP (accueil à l'aéroport par Global VIP Exclusive Services) ----------
   Ajouté dans Code.gs (projet Apps Script « Espace équipe Rafai Limousine ») par apply-ft.js.
   - Réservation client (cliBook_) : le client choisit l'option sur booking.rafai-limousine.com (Arrivée ou Départ,
     vol, passagers, bagages, pancarte, langue, message). Si le trajet passe par un aéroport, 240 € s'ajoutent au prix,
     une ligne « ✦ FAST TRACK VIP » est mise en tête du commentaire et la demande est gardée dans FT_<réf>.
   - Espace équipe : onglet « Fast Track VIP » (ft-tab.js). Bouton « Envoyer à Global VIP » (e-mail),
     puis nom et numéro de l'agent : ils s'affichent dans la réservation du client (Mes courses).
   Autres branchements dans Code.gs :
   - cliBook_ : bloc rlFt avant l'envoi à CLI_BOOKING_URL, FT_<réf> gardé après, prix renvoyé avec l'option
   - cliRide_ : o.ft (ce que le client voit)
   - api() : case 'ftList', 'ftSend', 'ftAgent' */
var FT_PRICE = 240, FT_TO = 'contact@global-vip-exclusive-services.com', FT_PARTNER = 'Global VIP Exclusive Services';
var FT_AIR = /a[ée]roport|airport|\bcdg\b|\bory\b|\borly\b|roissy|bourget/i;
function ftParse_(raw) {
  var x = raw;
  if (typeof x === 'string') { try { x = JSON.parse(x); } catch (e) { return null; } }
  if (!x || typeof x !== 'object') return null;
  function s(v, n) { return String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n || 80); }
  var k = x.k === 'dep' ? 'dep' : (x.k === 'arr' ? 'arr' : '');
  if (!k) return null;
  return {
    k: k, flight: s(x.flight, 20).toUpperCase(), pax: Math.max(1, Math.min(20, Math.round(Number(x.pax) || 1))),
    bags: Math.max(0, Math.min(30, Math.round(Number(x.bags) || 0))), sign: s(x.sign, 60), lang: s(x.lang, 20), msg: s(x.msg, 300)
  };
}
function ftKind_(ft) { return ft && ft.k === 'dep' ? 'Départ' : 'Arrivée'; }
function ftNote_(ft) {
  return '✦ FAST TRACK VIP (' + FT_PRICE + ' €) · ' + ftKind_(ft) + (ft.flight ? ' · vol ' + ft.flight : '') +
    ' · ' + ft.pax + ' pax · ' + ft.bags + ' bagages' + (ft.sign ? ' · pancarte « ' + ft.sign + ' »' : '') +
    (ft.lang ? ' · agent ' + ft.lang : '') + (ft.msg ? ' · message : ' + ft.msg : '');
}
function ftGet_(ref, props) {
  var raw = props ? props['FT_' + ref] : PropertiesService.getScriptProperties().getProperty('FT_' + ref);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}
function ftPut_(ref, o) { PropertiesService.getScriptProperties().setProperty('FT_' + ref, JSON.stringify(o)); }
/* Ce que le client voit dans « Mes courses » */
function ftCli_(ref, props) {
  var o = ftGet_(ref, props);
  if (!o) return null;
  return { k: o.k, flight: o.flight || '', sign: o.sign || '', pax: o.pax, bags: o.bags,
    agent: o.agent && o.agent.name ? { name: o.agent.name, tel: o.agent.tel || '' } : null };
}
/* Onglet de l'espace équipe : toutes les demandes, les plus récentes d'abord */
function ftList_() {
  var P = PropertiesService.getScriptProperties().getProperties() || {}, out = [];
  Object.keys(P).forEach(function (k) {
    if (k.indexOf('FT_') !== 0) return;
    try { var o = JSON.parse(P[k]); o.ref = k.slice(3); out.push(o); } catch (e) {}
  });
  out.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
  return { ft: out };
}
function ftHtml_(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
/* E-mail à Global VIP : la mission complète, réponse attendue avec le nom et le numéro de l'agent */
function ftSend_(p, me) {
  var ref = String(p.ref || ''), o = ftGet_(ref);
  if (!o) throw new Error('Demande Fast Track VIP introuvable');
  var b = getBooking_(book_(), ref);
  if (!b) throw new Error('Course introuvable');
  if (b.status === 'Annulée') throw new Error('Cette course est annulée');
  var drv = null; try { drv = b.driverId ? driverById_(b.driverId) : null; } catch (e) { drv = null; }
  var dep = o.k === 'dep', place = dep ? b.to : b.from, day = b.date;
  try { day = frDate_(b.date); } catch (e) {}
  var rows = [
    ['Mission', 'Fast Track VIP · ' + ftKind_(o)],
    ['Référence', ref],
    ['Date', day + ' · ' + (b.time || '') + (dep ? ' (prise en charge à Paris)' : ' (heure d’arrivée prévue)')],
    ['Aéroport', place || ''],
    ['Vol', o.flight || b.flight || 'à confirmer'],
    ['Client', ((b.fname || '') + ' ' + (b.lname || '')).trim()],
    ['Passagers', String(o.pax || b.pax || '')],
    ['Bagages', String(o.bags === 0 ? 0 : (o.bags || b.bags || ''))],
    ['Pancarte', o.sign || ((b.lname || '') ? 'M. / Mme ' + String(b.lname).toUpperCase() : '')],
    ['Langue de l’agent', o.lang || 'Français'],
    ['Message du client', o.msg || '—'],
    ['Chauffeur', b.driver ? b.driver + (drv && drv.tel ? ' · ' + drv.tel : '') + (b.vehType || b.car ? ' · ' + String(b.vehType || b.car) : '') : 'en cours d’assignation'],
    ['Trajet', (b.from || '') + ' → ' + (b.to || '')]
  ];
  var subj = 'Fast Track VIP · ' + ftKind_(o) + ' · ' + day + ' ' + (b.time || '') + ' · ' + ref;
  var html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">' +
    '<p>Bonjour,</p><p>Voici une nouvelle mission <b>Fast Track VIP</b> pour un client de Rafai Limousine.</p>' +
    '<table cellpadding="6" style="border-collapse:collapse;border:1px solid #E4DCCB">' +
    rows.map(function (r) { return '<tr><td style="background:#FBF7EF;border:1px solid #E4DCCB;font-weight:bold">' + ftHtml_(r[0]) + '</td><td style="border:1px solid #E4DCCB">' + ftHtml_(r[1]) + '</td></tr>'; }).join('') +
    '</table><p>Merci de confirmer en répondant à ce mail avec <b>le prénom et le numéro de téléphone de l’agent</b>.</p>' +
    '<p>Bien cordialement,<br>L’équipe Rafai Limousine<br>+33 6 67 09 94 94 · contact@rafai-limousine.com</p></div>';
  var text = rows.map(function (r) { return r[0] + ' : ' + r[1]; }).join('\n');
  MailApp.sendEmail({ to: FT_TO, cc: TEAM_EMAIL, subject: subj, body: 'Bonjour,\n\nNouvelle mission Fast Track VIP :\n\n' + text + '\n\nMerci de confirmer avec le prénom et le numéro de l’agent.\n\nL’équipe Rafai Limousine\n+33 6 67 09 94 94', htmlBody: html, name: 'Rafai Limousine', replyTo: TEAM_EMAIL });
  o.st = o.agent && o.agent.name ? 'agent' : 'sent'; o.sentAt = Date.now(); o.sentBy = String(me && me.email ? me.email : (me || ''));
  ftPut_(ref, o);
  try { log_(ref, 'Fast Track VIP', 'Demande envoyée à ' + FT_PARTNER, o.sentBy); } catch (e) {}
  o.ref = ref;
  return { ok: true, item: o };
}
/* Nom et numéro de l'agent : visibles par le client dans « Mes courses », e-mail au client si demandé */
function ftAgent_(p, me) {
  var ref = String(p.ref || ''), o = ftGet_(ref);
  if (!o) throw new Error('Demande Fast Track VIP introuvable');
  var name = String(p.name || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 60), tel = String(p.tel || '').replace(/[^\d+ ]/g, '').trim().slice(0, 30);
  if (!name) { o.agent = null; o.st = o.sentAt ? 'sent' : 'new'; ftPut_(ref, o); o.ref = ref; return { ok: true, item: o }; }
  o.agent = { name: name, tel: tel, at: Date.now() }; o.st = 'agent';
  ftPut_(ref, o);
  try { log_(ref, 'Fast Track VIP', 'Agent : ' + name + (tel ? ' · ' + tel : ''), String(me && me.email ? me.email : (me || ''))); } catch (e) {}
  var mailed = false;
  if (p.notify) {
    try {
      var b = getBooking_(book_(), ref), fr = !b || !b.lang || /fran/i.test(String(b.lang));
      if (b && validEmail_(b.email)) {
        var day = b.date; try { day = frDate_(b.date); } catch (e) {}
        var meet = o.k === 'dep' ? (fr ? 'à votre arrivée à l’aéroport' : 'when you arrive at the airport') : (fr ? 'à la sortie de l’avion, avec une pancarte à votre nom' : 'as you leave the plane, with a sign showing your name');
        MailApp.sendEmail({ to: b.email, name: 'Rafai Limousine', replyTo: TEAM_EMAIL,
          subject: fr ? 'Votre agent Fast Track VIP · ' + ref : 'Your Fast Track VIP agent · ' + ref,
          htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">' +
            (fr ? '<p>Bonjour ' + ftHtml_(b.fname || '') + ',</p><p>Votre accueil <b>Fast Track VIP</b> du ' + ftHtml_(day) + ' est confirmé.</p><p>Votre agent : <b>' + ftHtml_(name) + '</b>' + (tel ? ' · <a href="tel:' + ftHtml_(tel.replace(/\s/g, '')) + '">' + ftHtml_(tel) + '</a>' : '') + '<br>Il vous attend ' + meet + '.</p><p>Vous retrouvez ces informations dans « Mes courses ».</p><p>Bien cordialement,<br>Rafai Limousine</p>'
              : '<p>Hello ' + ftHtml_(b.fname || '') + ',</p><p>Your <b>Fast Track VIP</b> welcome on ' + ftHtml_(b.date) + ' is confirmed.</p><p>Your agent: <b>' + ftHtml_(name) + '</b>' + (tel ? ' · <a href="tel:' + ftHtml_(tel.replace(/\s/g, '')) + '">' + ftHtml_(tel) + '</a>' : '') + '<br>They will meet you ' + meet + '.</p><p>You can also find these details in “My rides”.</p><p>Kind regards,<br>Rafai Limousine</p>') + '</div>' });
        mailed = true;
      }
    } catch (e) {}
  }
  o.ref = ref;
  return { ok: true, item: o, mailed: mailed };
}
