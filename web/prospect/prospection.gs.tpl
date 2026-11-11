/**
 * Prospection Rafai Limousine (11 nov. 2026, demande de Yassine)
 * Feuille « Sociétés » : Catégorie | Société | Site | Langue | Email | Trouvé sur | Valider (OUI) | Envoyé le | Statut
 *  1. initialiser()      : crée la feuille de suivi avec la liste des sociétés ciblées (une seule fois)
 *  2. chercherEmails()   : lit le site officiel de chaque société (accueil + pages contact / mentions légales)
 *                          et note l'adresse publiée par la société elle-même (aucune adresse devinée)
 *  3. envoyerLot()       : envoie au plus 100 emails par jour, seulement aux lignes « Valider = OUI » pas encore envoyées
 *  4. installerEnvoiQuotidien() : envoi automatique chaque jour à 9 h 40 (heure de Paris), après validation de Yassine
 * Rien ne part sans « OUI » dans la colonne Valider. Les réponses arrivent sur contact@rafai-limousine.com.
 */
var MAX_JOUR = 100;
var FEUILLE = 'Sociétés';
var TEL = '+33 6 67 09 94 94';
var REPLY = 'contact@rafai-limousine.com';
var EXCLUS = /savoya|drivania|blacklane|chabe|chabé|regency|cardel|advantage|kmv|giorizz|carey/i; /* carey : déjà un partenaire à Paris (Yassine, 11 nov.) */
var BAD = /noreply|no-reply|donotreply|rgpd|gdpr|dpo@|privacy|confidential|recrut|career|jobs|job@|cv@|candidat|^hr@|^rh@|webmaster|example|sentry|wixpress|\.(png|jpg|jpeg|gif|webp|svg)$/i;
var EM = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
var KEY = /contact|nous-contacter|contactez|contact-us|get-in-touch|mentions|legal|imprint|impressum|a-propos|about|offices|bureaux|enquir/i;
var UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'Accept-Language': 'fr,en;q=0.8' };
var LISTE = __LISTE__;

function ss_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var s = SpreadsheetApp.create('Prospection Rafai Limousine');
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', s.getId());
  return s;
}

function initialiser() {
  var s = ss_(), sh = s.getSheetByName(FEUILLE) || s.getSheets()[0].setName(FEUILLE);
  if (sh.getLastRow() > 1) return Logger.log('déjà fait : ' + s.getUrl());
  var head = [['Catégorie', 'Société', 'Site', 'Langue', 'Email', 'Trouvé sur', 'Valider (OUI)', 'Envoyé le', 'Statut']];
  sh.getRange(1, 1, 1, 9).setValues(head).setFontWeight('bold').setBackground('#111113').setFontColor('#C9A063');
  sh.getRange(2, 1, LISTE.length, 4).setValues(LISTE.map(function (r) { return [r[0], r[1], r[2], r[3]]; }));
  sh.setFrozenRows(1);
  Logger.log('feuille : ' + s.getUrl());
}

function get_(urls) {
  var reqs = urls.map(function (u) { return { url: u, muteHttpExceptions: true, followRedirects: true, headers: UA, validateHttpsCertificates: false }; });
  var out = [];
  try {
    UrlFetchApp.fetchAll(reqs).forEach(function (r, i) { out[i] = r.getResponseCode() < 400 ? r.getContentText().slice(0, 600000) : ''; });
  } catch (e) {
    reqs.forEach(function (q, i) { try { var r = UrlFetchApp.fetch(q.url, q); out[i] = r.getResponseCode() < 400 ? r.getContentText().slice(0, 600000) : ''; } catch (z) { out[i] = ''; } });
  }
  return out;
}

function emails_(h) {
  if (!h) return [];
  var t = h.replace(/&#64;|&#x40;|\[at\]|\(at\)| at /gi, '@').replace(/%40/g, '@');
  var found = t.match(EM) || [];
  (h.match(/data-cfemail="([0-9a-fA-F]+)"/g) || []).forEach(function (m) {
    var x = m.match(/"([0-9a-fA-F]+)"/)[1], k = parseInt(x.substr(0, 2), 16), s = '';
    for (var i = 2; i < x.length; i += 2) s += String.fromCharCode(parseInt(x.substr(i, 2), 16) ^ k);
    found.push(s);
  });
  return found.map(function (e) { return e.toLowerCase().replace(/\.$/, ''); }).filter(function (e) { return !BAD.test(e); });
}

function links_(h, base) {
  var host = base.replace(/^https?:\/\//, '').split('/')[0], out = [];
  (h.match(/href=["']([^"'#]+)["']/gi) || []).forEach(function (m) {
    var u = m.replace(/^href=["']/i, '').replace(/["']$/, '');
    if (/^(mailto|tel|javascript):/i.test(u)) return;
    if (/^\/\//.test(u)) u = 'https:' + u; else if (/^\//.test(u)) u = 'https://' + host + u; else if (!/^https?:/i.test(u)) u = 'https://' + host + '/' + u;
    var uh = u.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
    if (uh !== host.replace(/^www\./, '')) return;
    var path = u.replace(/^https?:\/\/[^\/]+/, '');
    if (KEY.test(path) && out.indexOf(u) < 0) out.push(u);
  });
  return out.slice(0, 4);
}

function score_(e) {
  var l = e.split('@')[0];
  if (/^(partenariat|partnership|partners?|business|commercial|sales|ventes)$/.test(l)) return 0;
  if (/^(contact|info|infos|hello|bonjour|welcome|office|paris)$/.test(l)) return 1;
  if (/^(ops|operations|charter|booking|bookings|reservation|reservations|concierge|conciergerie|events?|evenements?|crew|travel)$/.test(l)) return 2;
  if (/press|presse|media|compta|factur|invoice|account|billing|marketing|newsletter|support|sav/.test(l)) return 9;
  return 5;
}

function chercherEmails() {
  var sh = ss_().getSheetByName(FEUILLE), v = sh.getDataRange().getValues(), t0 = Date.now();
  var todo = [];
  for (var i = 1; i < v.length; i++) if (v[i][2] && !v[i][4] && !v[i][5]) todo.push(i);
  for (var k = 0; k < todo.length; k += 15) {
    if (Date.now() - t0 > 4.8 * 60 * 1000) { Logger.log('à relancer : ' + (todo.length - k) + ' restantes'); break; }
    var part = todo.slice(k, k + 15);
    var bases = part.map(function (i) { return 'https://' + String(v[i][2]).replace(/^https?:\/\//, '').replace(/\/.*$/, '') + '/'; });
    var h1 = get_(bases), found = {}, sub = [], own = [];
    part.forEach(function (i, j) {
      found[i] = emails_(h1[j]).map(function (e) { return [e, bases[j]]; });
      if (!h1[j]) found[i].dead = true;
      links_(h1[j] || '', bases[j]).forEach(function (u) { sub.push(u); own.push(i); });
    });
    get_(sub).forEach(function (h, j) { emails_(h).forEach(function (e) { found[own[j]].push([e, sub[j]]); }); });
    part.forEach(function (i) {
      var dom = String(v[i][2]).replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0], root = dom.split('.').slice(-2)[0];
      var seen = {}, best = [];
      found[i].forEach(function (p) { if (seen[p[0]]) return; seen[p[0]] = 1; if (p[0].split('@')[1].indexOf(root) >= 0 && !EXCLUS.test(p[0])) best.push(p); });
      best.sort(function (a, b) { return score_(a[0]) - score_(b[0]); });
      var row = best.length ? [best[0][0], best[0][1] + (best.length > 1 ? ' | autres : ' + best.slice(1, 4).map(function (p) { return p[0]; }).join(', ') : '')]
        : ['', found[i].dead ? 'site injoignable' : 'aucune adresse publiée (formulaire)'];
      sh.getRange(i + 1, 5, 1, 2).setValues([row]);
    });
    SpreadsheetApp.flush();
  }
  bilan();
}

function bilan() {
  var v = ss_().getSheetByName(FEUILLE).getDataRange().getValues(), n = 0, out = [];
  for (var i = 1; i < v.length; i++) if (v[i][4]) { n++; out.push(v[i][0] + ';' + v[i][1] + ';' + v[i][4]); }
  Logger.log('adresses trouvées : ' + n + ' / ' + (v.length - 1));
  for (var k = 0; k < out.length; k += 25) Logger.log(out.slice(k, k + 25).join(' || '));
}

var QUI = {
  FR: { aviation: 'votre société accueille régulièrement des passagers et des équipages à Paris', maritime: 'votre société fait régulièrement voyager des équipages et des clients par Paris',
        luxe: 'votre société reçoit régulièrement des clients et des invités à Paris', finance: 'votre société organise régulièrement des rendez-vous et des déplacements à Paris',
        hotel: 'votre établissement accueille des clients qui ont souvent besoin d’un chauffeur à Paris',
        voyage: 'votre agence envoie régulièrement des clients exigeants à Paris et en France',
        affaires: 'votre agence organise les déplacements de dirigeants et de collaborateurs à Paris',
        reseau: 'vos membres reçoivent régulièrement des dirigeants et des invités à Paris',
        limo: 'vos clients voyagent régulièrement à Paris et ont besoin d’un partenaire local de confiance',
        media: 'vos correspondants, vos équipes de tournage et vos invités se déplacent régulièrement à Paris',
        presse: 'vos membres, correspondants de la presse étrangère à Paris, ont souvent besoin d’un transport fiable pour eux, leurs équipes et leurs invités' },
  EN: { aviation: 'your company regularly flies passengers and crews into Paris', maritime: 'your company regularly sends crews and guests through Paris',
        luxe: 'your company regularly welcomes clients and guests in Paris', finance: 'your company regularly organises meetings and executive travel in Paris',
        hotel: 'your hotel welcomes guests who often need a chauffeur in Paris',
        voyage: 'your agency regularly sends discerning clients to Paris and France',
        affaires: 'your agency manages travel for executives and teams coming to Paris',
        reseau: 'your members regularly welcome executives and guests in Paris',
        limo: 'your clients regularly travel to Paris and need a trusted local affiliate there',
        media: 'your correspondents, crews and guests regularly travel to Paris',
        presse: 'your members, the foreign correspondents based in Paris, often need reliable transport for themselves, their crews and their guests' }
};

var LIGNE = {
  FR: {
    aviation: 'les transferts de vos passagers et de vos équipages entre Le Bourget, Roissy-CDG, Orly et Paris, à toute heure',
    maritime: 'les transferts de vos équipages et de vos clients entre Roissy-CDG, Orly, Le Bourget et Paris, à toute heure',
    luxe: "l'accueil et les déplacements de vos clients et invités à Paris (événements, défilés, rendez-vous, visites, shopping)",
    finance: 'les roadshows, rendez-vous investisseurs et déplacements de vos dirigeants à Paris, avec chauffeur à disposition à l’heure ou à la journée',
    hotel: 'les transferts aéroport et le chauffeur à disposition pour vos clients, en complément de votre conciergerie',
    voyage: 'l’accueil à l’aéroport, le chauffeur à disposition et les excursions privées (Versailles, Giverny…) pour vos clients à Paris',
    affaires: 'les transferts aéroport, les roadshows et le chauffeur à disposition pour vos voyageurs d’affaires à Paris',
    reseau: 'les transferts aéroport, les roadshows et le chauffeur à disposition pour les dirigeants et invités de vos membres à Paris',
    limo: 'vos courses à Paris en sous-traitance : accueil à Roissy-CDG, Orly et Le Bourget, chauffeur à disposition, roadshows et événements',
    media: 'leurs transferts aéroport (Roissy-CDG, Orly, Le Bourget) et un chauffeur à disposition pour les tournages, les directs et les interviews, avec Classe V pour les équipes et le matériel',
    presse: 'les transferts aéroport (Roissy-CDG, Orly, Le Bourget) et un chauffeur à disposition pour les tournages, les directs et les interviews, avec Classe V pour les équipes et le matériel'
  },
  EN: {
    aviation: 'transfers for your passengers and crews between Paris Le Bourget, Charles de Gaulle (CDG), Orly and central Paris, at any hour',
    maritime: 'transfers for your crews and guests between Paris Charles de Gaulle (CDG), Orly, Le Bourget and central Paris, at any hour',
    luxe: 'meet & greet and chauffeur services for your clients and guests in Paris (events, shows, appointments, viewings, shopping)',
    finance: 'roadshows, investor meetings and executive travel in Paris, with a chauffeur at your disposal by the hour or by the day',
    hotel: 'airport transfers and chauffeurs at disposal for your guests in Paris',
    voyage: 'airport meet & greet, chauffeurs at disposal and private day trips (Versailles, Giverny…) for your clients in Paris',
    affaires: 'airport transfers, roadshows and chauffeurs at disposal for your business travellers in Paris',
    reseau: 'airport transfers, roadshows and chauffeurs at disposal for your members’ executives and guests in Paris',
    limo: 'your farm-out rides in Paris: meet & greet at Charles de Gaulle (CDG), Orly and Le Bourget, hourly chauffeur service, roadshows and events',
    media: 'their airport transfers (CDG, Orly, Le Bourget) and a chauffeur at their disposal for shoots, live coverage and interviews, with V-Class vans for crews and equipment',
    presse: 'airport transfers (CDG, Orly, Le Bourget) and a chauffeur at disposal for shoots, live coverage and interviews, with V-Class vans for crews and equipment'
  }
};

function texte_(cat, societe, lang) {
  lang = lang === 'EN' ? 'EN' : 'FR';
  var l = (LIGNE[lang][cat] || LIGNE[lang].luxe), q = (QUI[lang][cat] || QUI[lang].luxe);
  if (lang === 'EN') {
    var sujet = 'Rafai Limousine × ' + societe + (cat === 'limo' ? ' – your chauffeur affiliate in Paris' : ' – private chauffeur partnership in Paris');
    var corps = ['Hello,',
      'My name is Yassine Rafaï, founder of Rafai Limousine, a premium private chauffeur company in Paris (CDG, Orly and Le Bourget airports, Paris and the Île-de-France region, 24/7).',
      'I am reaching out because ' + q + ', and we could look after ' + l + '.',
      'What we offer:',
      '• Live GPS tracking: your passengers and your team follow the chauffeur on a map, from pick-up to drop-off.',
      '• The Rafai Limousine app (iPhone and Android) and online booking in one minute.',
      '• Recent vehicles: Mercedes S-Class, E-Class, V-Class and Range Rover, chauffeurs in suits.',
      '• Fixed price agreed in advance, real-time flight tracking, name sign, 1 hour of free waiting time at the airport.',
      '• Invoicing to your company.',
      'We already work with major partners, and I would be glad to discuss a possible partnership with you.',
      'The easiest way: call me directly on ' + TEL + ', or simply reply to this email.',
      'Kind regards,'];
    var pied = 'You are receiving this email because your company works in an industry where our services can help. If you would rather not hear from us again, just reply "STOP".';
  } else {
    var sujet = 'Rafai Limousine × ' + societe + ' – partenariat chauffeur privé à Paris';
    var corps = ['Bonjour,',
      'Je suis Yassine Rafaï, fondateur de Rafai Limousine, société de chauffeurs privés haut de gamme à Paris (aéroports Roissy-CDG, Orly et Le Bourget, Paris et Île-de-France, 24 h/24 et 7 j/7).',
      'Je vous contacte car ' + q + ', et nous pourrions vous accompagner pour ' + l + '.',
      'Ce que nous proposons :',
      '• Suivi en direct : vos passagers et votre équipe suivent le chauffeur sur une carte GPS, de la prise en charge à l’arrivée.',
      '• L’application Rafai Limousine (iPhone et Android) et la réservation en ligne en 1 minute.',
      '• Des véhicules récents : Mercedes Classe S, Classe E, Classe V et Range Rover, chauffeurs en costume.',
      '• Prix fixe annoncé à l’avance, vol suivi en temps réel, pancarte au nom du passager, 1 h d’attente offerte à l’aéroport.',
      '• Facturation à votre société.',
      'Nous travaillons déjà avec de grands partenaires et je serais ravi d’échanger avec vous sur un éventuel partenariat.',
      'Le plus simple : appelez-moi directement au ' + TEL + ', ou répondez simplement à cet email.',
      'Bien cordialement,'];
    var pied = 'Vous recevez ce message car votre société travaille dans un secteur où nos services peuvent vous être utiles. Pour ne plus recevoir de message de notre part, répondez simplement « STOP ».';
  }
  var sign = ['Yassine Rafaï', lang === 'EN' ? 'Founder – Rafai Limousine' : 'Fondateur – Rafai Limousine', TEL + ' · ' + REPLY, 'www.rafai-limousine.com', '99 avenue Achille Peretti, 92200 Neuilly-sur-Seine, France'];
  var txt = corps.join('\n\n').replace('\n\n• ', '\n• ') + '\n\n' + sign.join('\n') + '\n\n—\n' + pied;
  txt = txt.replace(/\n\n•/g, '\n•');
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var html = '<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#111113;max-width:600px">';
  var prev = false;
  corps.forEach(function (p) {
    var bul = /^•/.test(p);
    html += bul ? '<div style="margin:0 0 4px 6px">' + esc(p) + '</div>'
      : '<p style="margin:' + (prev ? '12px' : '0') + ' 0 12px">' + esc(p).replace(TEL, '<a href="tel:+33667099494" style="color:#111113;font-weight:700">' + TEL + '</a>') + '</p>';
    prev = bul;
  });
  html += '<p style="margin:14px 0 0"><b>Yassine Rafaï</b><br>' + esc(sign[1]) + '<br><a href="tel:+33667099494" style="color:#B8904F">' + TEL + '</a> · <a href="mailto:' + REPLY + '" style="color:#B8904F">' + REPLY + '</a><br><a href="https://www.rafai-limousine.com" style="color:#B8904F">www.rafai-limousine.com</a><br><span style="color:#6B6B72">' + esc(sign[4]) + '</span></p>';
  html += '<p style="margin:18px 0 0;font-size:11px;color:#8A8A90">' + esc(pied) + '</p></div>';
  return { sujet: sujet, texte: txt, html: html };
}

function apercu() {
  var a = texte_('aviation', 'Valljet', 'FR'), b = texte_('maritime', 'Burgess', 'EN');
  Logger.log(a.sujet + '\n\n' + a.texte);
  Logger.log(b.sujet + '\n\n' + b.texte);
}

function envoyerLot() {
  var sh = ss_().getSheetByName(FEUILLE), v = sh.getDataRange().getValues();
  /* premier envoi le 11 nov. 2026 à 10 h (demande de Yassine : « Part aujourd'hui à 10:00 ») ; jamais plus de 100 le même jour */
  if (new Date() < new Date('2026-11-11T10:00:00+01:00')) return Logger.log('pas avant le 11 nov. 2026 à 10 h');
  var jour = Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyy-MM-dd');
  var deja = {}, n = 0, reste = MailApp.getRemainingDailyQuota();
  for (var i = 1; i < v.length; i++) if (v[i][7]) {
    deja[String(v[i][4]).toLowerCase()] = 1;
    if (v[i][7] instanceof Date && Utilities.formatDate(v[i][7], 'Europe/Paris', 'yyyy-MM-dd') === jour) n++;
  }
  var dejaJour = n;
  for (var i = 1; i < v.length; i++) {
    if (n >= MAX_JOUR || reste - (n - dejaJour) < 20) break;
    var mail = String(v[i][4] || '').trim().toLowerCase();
    if (String(v[i][6]).trim().toUpperCase() !== 'OUI' || !mail || v[i][7] || deja[mail] || EXCLUS.test(mail + ' ' + v[i][1])) continue;
    var t = texte_(v[i][0], v[i][1], v[i][3]);
    try {
      MailApp.sendEmail(mail, t.sujet, t.texte, { htmlBody: t.html, name: 'Yassine Rafaï – Rafai Limousine', replyTo: REPLY });
      sh.getRange(i + 1, 8, 1, 2).setValues([[new Date(), 'envoyé']]);
      deja[mail] = 1; n++;
    } catch (e) { sh.getRange(i + 1, 9).setValue('erreur : ' + e.message); }
    Utilities.sleep(1200);
  }
  Logger.log('envoyés aujourd’hui : ' + (n - dejaJour) + ' (total du jour : ' + n + ')');
}

function installerEnvoiQuotidien() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'envoyerLot') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('envoyerLot').timeBased().everyDays(1).atHour(9).nearMinute(40).inTimezone('Europe/Paris').create();
  Logger.log('envoi quotidien installé (9 h 40, heure de Paris)');
}

/* Premier envoi exceptionnel : aujourd'hui 11 nov. 2026 à 10 h (heure de Paris) ; l'envoi quotidien de 9 h 40 continue ensuite */
function envoiAujourdhui10h() {
  ScriptApp.newTrigger('envoyerLot').timeBased().at(new Date('2026-11-11T10:00:00+01:00')).create();
  Logger.log('premier envoi programmé : 11 nov. 2026 à 10 h');
}

function arreterEnvoiQuotidien() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'envoyerLot') ScriptApp.deleteTrigger(t); });
  Logger.log('envoi quotidien arrêté');
}

/* Relecture de la liste : une ligne par société (numéro de ligne ; catégorie ; société ; adresse retenue ; autres adresses ou motif) */
function exporter() {
  var v = ss_().getSheetByName(FEUILLE).getDataRange().getValues(), out = [];
  for (var i = 1; i < v.length; i++) {
    var f = String(v[i][5] || ''), aut = f.split('| autres : ')[1] || '';
    out.push((i + 1) + ';' + v[i][0] + ';' + v[i][1] + ';' + v[i][4] + ';' + (v[i][4] ? aut : f.slice(0, 30)));
  }
  for (var k = 0; k < out.length; k += 20) Logger.log(out.slice(k, k + 20).join(' || '));
}

/* Corrections après relecture : numéro de ligne -> adresse retenue ('' = écartée, aucun envoi) */
/* Relecture du 11 nov. 2026 : priorité Paris / Île-de-France (demande de Yassine) et adresses génériques seulement */
var CHOIX = { 160: 'concierge@majestic-hotel.com', 161: 'concierge@raphael-hotel.com', 162: 'management@regina-hotel.com', 195: 'contact@hotel-west-end.com', 98: 'info.paris@karlaotto.com', 214: 'hello@smartflyer.com', 265: 'inquiry@backroads.com' };
var ECARTEES = [3, 7, 18, 19, 21, 22, 25, 30, 33, 36, 37, 38, 39, 48, 50, 52, 54, 55, 56, 57, 61, 62, 63, 64, 66, 67, 68, 69, 71, 73, 77, 78, 79, 80, 82, 84, 85, 99, 102, 103, 104, 105, 106, 115, 118, 122, 127, 135, 137, 141, 143, 145, 147, 150, 219, 221, 232, 243, 248, 249, 254, 255, 258, 260];
var A_VALIDER = [2, 4, 5, 6, 8, 14, 91, 96, 98, 111, 112, 132, 153, 156, 160, 161, 162, 163, 168, 169, 170, 183, 184, 185, 186, 188, 191, 195, 199, 207, 208, 213, 214, 216, 217, 222, 229, 231, 233, 234, 235, 237, 238, 239, 252, 259, 262, 265];
function appliquerChoix() {
  var sh = ss_().getSheetByName(FEUILLE);
  Object.keys(CHOIX).forEach(function (r) { sh.getRange(+r, 5).setValue(CHOIX[r]); });
  ECARTEES.forEach(function (r) { sh.getRange(+r, 9).setValue('écartée : hors Paris / Île-de-France ou adresse non adaptée (presse, juridique, personnelle…)'); });
  A_VALIDER.forEach(function (r) { sh.getRange(+r, 7).setValue('OUI'); });
  Logger.log('corrections : ' + Object.keys(CHOIX).length + ' ; validées : ' + A_VALIDER.length);
}

/* Ajouts du 11 nov. 2026 (demande de Yassine) : agences de voyage d'affaires (American Express GBT…), AmCham, agences de luxe américaines */
var AJOUTS = [
  ['affaires', 'American Express Global Business Travel', 'amexglobalbusinesstravel.com', 'EN'], ['affaires', 'Amex GBT', 'amexgbt.com', 'EN'],
  ['affaires', 'BCD Travel', 'bcdtravel.com', 'EN'], ['affaires', 'CWT', 'mycwt.com', 'EN'], ['affaires', 'FCM Travel', 'fcmtravel.com', 'EN'],
  ['affaires', 'Egencia', 'egencia.com', 'EN'], ['affaires', 'Corporate Travel Management', 'travelctm.com', 'EN'], ['affaires', 'Direct Travel', 'directtravel.com', 'EN'],
  ['affaires', 'Internova Travel Group', 'internova.com', 'EN'], ['affaires', 'Navan', 'navan.com', 'EN'], ['affaires', 'Selectour', 'selectour.com', 'FR'],
  ['affaires', 'Travel Planet', 'travelplanet.fr', 'FR'], ['affaires', 'ATPI', 'atpi.com', 'EN'], ['affaires', 'Ovation DMC', 'ovationdmc.com', 'EN'],
  ['reseau', 'AmCham France', 'amchamfrance.org', 'FR'],
  ['voyage', 'Virtuoso', 'virtuoso.com', 'EN'], ['voyage', 'Signature Travel Network', 'signaturetravelnetwork.com', 'EN'], ['voyage', 'Global Travel Collection', 'globaltravelcollection.com', 'EN'],
  ['voyage', 'Classic Vacations', 'classicvacations.com', 'EN'], ['voyage', 'Zicasso', 'zicasso.com', 'EN'], ['voyage', 'Tauck', 'tauck.com', 'EN'],
  ['voyage', 'Europe Express', 'europeexpress.com', 'EN'], ['voyage', 'Avanti Destinations', 'avantidestinations.com', 'EN'], ['voyage', 'Departure Lounge', 'departurelounge.com', 'EN'],
  ['voyage', 'Coastline Travel Advisors', 'coastlinetravel.com', 'EN'], ['voyage', 'Andavo Travel', 'andavotravel.com', 'EN'], ['voyage', 'Backroads', 'backroads.com', 'EN'],
  ['voyage', 'Red Savannah', 'redsavannah.com', 'EN'], ['voyage', 'Travel + Leisure Co.', 'travelandleisureco.com', 'EN'], ['voyage', 'Jet Set World Travel', 'jetsetworldtravel.com', 'EN']
];
function ajouter() {
  var sh = ss_().getSheetByName(FEUILLE), v = sh.getDataRange().getValues(), have = {};
  for (var i = 1; i < v.length; i++) have[String(v[i][2]).toLowerCase()] = 1;
  var add = AJOUTS.filter(function (r) { return !have[r[2]]; });
  if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, 4).setValues(add);
  Logger.log('ajoutées : ' + add.length + ' (lignes ' + (v.length + 1) + ' à ' + (v.length + add.length) + ')');
}

/* Ajouts du 11 nov. 2026 (demande de Yassine : « Et aussi limousine ») : sociétés de limousine américaines qui ont besoin d'un partenaire à Paris,
   et Limo Anywhere (logiciel des limousines US relié à GroundSpan ; pas de formulaire, adresse du bouton « Email Sales » de leur page contact) */
var AJOUTS_LIMO = [
  ['limo', 'Carey International', 'carey.com', 'EN'], ['limo', 'Empire CLS', 'empirecls.com', 'EN'],
  ['limo', 'Commonwealth Worldwide Chauffeured Transportation', 'commonwealthlimo.com', 'EN'], ['limo', 'Music Express', 'musicexpress.com', 'EN'],
  ['limo', 'Bermuda Limousine International', 'bermudalimo.com', 'EN'], ['limo', 'Royal Coachman Worldwide', 'royalcoachman.com', 'EN'],
  ['limo', 'Reston Limousine', 'restonlimo.com', 'EN'], ['limo', 'Limousines of South Florida', 'limosofsouthflorida.com', 'EN'],
  ['limo', 'Wynne Transportation', 'wynnetransportation.com', 'EN'], ['limo', 'Windy City Limousine', 'windycitylimos.com', 'EN'],
  ['limo', 'GroundLink', 'groundlink.com', 'EN'], ['limo', 'KLS Worldwide Chauffeured Services', 'klsworldwide.com', 'EN'],
  ['limo', "Kevin's Worldwide", 'kevinsworldwide.com', 'EN'], ['limo', 'LimoLink', 'limolink.com', 'EN'],
  ['limo', 'Carmel Car & Limousine Service', 'carmellimo.com', 'EN'],
  ['limo', 'Limo Anywhere', 'limoanywhere.com', 'EN', 'sales@limoanywhere.com', 'https://www.limoanywhere.com/contact-us/ (bouton Email Sales)']
];
function ajouterLimo() {
  var sh = ss_().getSheetByName(FEUILLE), v = sh.getDataRange().getValues(), have = {};
  for (var i = 1; i < v.length; i++) have[String(v[i][2]).toLowerCase()] = 1;
  var add = AJOUTS_LIMO.filter(function (r) { return !have[r[2]]; }).map(function (r) { return [r[0], r[1], r[2], r[3], r[4] || '', r[5] || '']; });
  if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, 6).setValues(add);
  Logger.log('ajoutées : ' + add.length + ' (lignes ' + (v.length + 1) + ' à ' + (v.length + add.length) + ')');
}
function apercuLimo() {
  var a = texte_('limo', 'Empire CLS', 'EN');
  Logger.log(a.sujet + '\n\n' + a.texte);
}
/* Relecture : lignes limousine validées (numéros de ligne de la feuille), remplies après chercherEmails */
/* 11 nov. 2026 : 9 adresses génériques trouvées sur les sites officiels (sales, info, reservations…) ; sans adresse publiée : Carey, Music Express, Bermuda, LSF, Wynne, GroundLink, Kevin's */
var LIMO_OUI = [270, 271, 274, 275, 278, 280, 282, 283, 284];
var LIMO_CHOIX = {};
function validerLimo() {
  var sh = ss_().getSheetByName(FEUILLE);
  Object.keys(LIMO_CHOIX).forEach(function (r) { sh.getRange(+r, 5).setValue(LIMO_CHOIX[r]); });
  LIMO_OUI.forEach(function (r) { if (String(sh.getRange(+r, 1).getValue()) === 'limo' && sh.getRange(+r, 5).getValue()) sh.getRange(+r, 7).setValue('OUI'); });
  Logger.log('limousines validées : ' + LIMO_OUI.length);
}

/* Ajouts du 11 nov. 2026 (demande de Yassine) : grandes chaînes d'info quand leurs équipes viennent à Paris */
var AJOUTS_MEDIA = [
  ['media', 'CNN', 'cnn.com', 'EN'], ['media', 'Fox News', 'foxnews.com', 'EN'], ['media', 'CBS News', 'cbsnews.com', 'EN'],
  ['media', 'NBC News', 'nbcnews.com', 'EN'], ['media', 'Al Jazeera', 'aljazeera.com', 'EN'], ['media', 'Al Jazeera Network', 'aljazeera.net', 'EN'],
  ['media', 'CBC', 'cbc.ca', 'EN'], ['media', 'CNBC', 'cnbc.com', 'EN'], ['media', 'Bloomberg', 'bloomberg.com', 'EN'], ['media', 'Sky News', 'news.sky.com', 'EN'],
  /* les chaînes ne publient pas d'adresse : associations de leurs correspondants à Paris */
  ['presse', 'Anglo-American Press Association of Paris', 'aapafrance.org', 'EN'], ['presse', 'Association de la Presse Étrangère', 'apepresseetrangere.org', 'FR']
];
function ajouterMedia() {
  var sh = ss_().getSheetByName(FEUILLE), v = sh.getDataRange().getValues(), have = {};
  for (var i = 1; i < v.length; i++) have[String(v[i][2]).toLowerCase()] = 1;
  var add = AJOUTS_MEDIA.filter(function (r) { return !have[r[2]]; }).map(function (r) { return [r[0], r[1], r[2], r[3], r[4] || '', r[5] || '']; });
  if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, 6).setValues(add);
  Logger.log('ajoutées : ' + add.length + ' (lignes ' + (v.length + 1) + ' à ' + (v.length + add.length) + ')');
}
/* Lignes media : adresse trouvée + toutes les autres (pour relecture : pas d'adresse presse ni personnelle) */
function exporterMedia() {
  var v = ss_().getSheetByName(FEUILLE).getDataRange().getValues(), out = [];
  for (var i = 1; i < v.length; i++) if (v[i][0] === 'media') out.push((i + 1) + ';' + v[i][1] + ';' + v[i][4] + ';' + String(v[i][5]).slice(0, 160));
  Logger.log(out.join(' || '));
}

/* Carmel : leur réponse automatique donne seulement le service client ; demande de Yassine (« Oui c'est bon ») : mail pour le service des affiliés */
function envoyerCarmel() {
  var corps = ['Hello,',
    'Could you please forward this message to your affiliate or farm-out department?',
    'I am Yassine Rafaï, founder of Rafai Limousine, a premium private chauffeur company in Paris (CDG, Orly and Le Bourget airports, Paris and Île-de-France, 24/7). We would like to be Carmel\'s affiliate in Paris for your clients traveling to France: airport meet & greet, hourly chauffeur service, roadshows and events.',
    'Mercedes S-Class, E-Class, V-Class and Range Rover, live GPS tracking for passengers, fixed prices agreed in advance, invoicing to your company.',
    'Who would be the right person to talk to? You can reach me at ' + TEL + ' or ' + REPLY + '.',
    'Thank you,', 'Yassine Rafaï\nFounder – Rafai Limousine\nwww.rafai-limousine.com'];
  MailApp.sendEmail('customerservice@carmellimo.com', 'Paris affiliate – Rafai Limousine (please forward to your affiliate department)', corps.join('\n\n'),
    { name: 'Yassine Rafaï – Rafai Limousine', replyTo: REPLY });
  Logger.log('envoyé à Carmel (service client, pour le service des affiliés)');
}
