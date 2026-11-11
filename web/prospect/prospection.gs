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
var EXCLUS = /savoya|drivania|blacklane|chabe|chabé|regency|cardel|advantage|kmv|giorizz/i;
var BAD = /noreply|no-reply|donotreply|rgpd|gdpr|dpo@|privacy|confidential|recrut|career|jobs|job@|cv@|candidat|^hr@|^rh@|webmaster|example|sentry|wixpress|\.(png|jpg|jpeg|gif|webp|svg)$/i;
var EM = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
var KEY = /contact|nous-contacter|contactez|contact-us|get-in-touch|mentions|legal|imprint|impressum|a-propos|about|offices|bureaux|enquir/i;
var UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'Accept-Language': 'fr,en;q=0.8' };
var LISTE = [["aviation", "Valljet", "valljet.com", "FR"], ["aviation", "Oyonnair", "oyonnair.com", "FR"], ["aviation", "Wijet", "wijet.com", "FR"], ["aviation", "Aéroaffaires", "aeroaffaires.fr", "FR"], ["aviation", "Astonjet", "astonjet.com", "FR"], ["aviation", "Luxaviation", "luxaviation.com", "EN"], ["aviation", "IXAIR", "ixair.com", "FR"], ["aviation", "Airlec Air Espace", "airlec.fr", "FR"], ["aviation", "Twin Jet", "twinjet.fr", "FR"], ["aviation", "Jetex", "jetex.com", "EN"], ["aviation", "Signature Aviation", "signatureaviation.com", "EN"], ["aviation", "Universal Aviation", "universalweather.com", "EN"], ["aviation", "AASI Le Bourget", "geh.aero", "EN"], ["aviation", "Jet Aviation", "jetaviation.com", "EN"], ["aviation", "Air Charter Service France", "aircharterservice.fr", "FR"], ["aviation", "Air Partner", "airpartner.com", "EN"], ["aviation", "LunaJets", "lunajets.com", "EN"], ["aviation", "PrivateFly", "privatefly.com", "EN"], ["aviation", "Victor", "flyvictor.com", "EN"], ["aviation", "VistaJet", "vistajet.com", "EN"], ["aviation", "Elysium Jet", "elysiumjet.com", "EN"], ["aviation", "Pan Européenne Air Service", "pan-europeenne.com", "FR"], ["aviation", "Priv'Air", "privair.ch", "EN"], ["aviation", "GlobeAir", "globeair.com", "EN"], ["aviation", "Air Hamburg", "airhamburg.de", "EN"], ["aviation", "Jetfly", "jetfly.com", "EN"], ["aviation", "Sky Valet", "skyvalet.com", "EN"], ["aviation", "Abelag", "abelag.be", "EN"], ["aviation", "TAG Aviation", "tagaviation.com", "EN"], ["aviation", "NetJets", "netjets.com", "EN"], ["aviation", "Flexjet", "flexjet.com", "EN"], ["aviation", "Paramount Business Jets", "paramountbusinessjets.com", "EN"], ["aviation", "Jettly", "jettly.com", "EN"], ["aviation", "Stratos Jets", "stratosjets.com", "EN"], ["aviation", "XO", "flyxo.com", "EN"], ["aviation", "Chapman Freeborn", "chapmanfreeborn.aero", "EN"], ["aviation", "Aviapartner", "aviapartner.aero", "EN"], ["aviation", "Exxaero", "exxaero.com", "FR"], ["aviation", "Amalthea", "amalthea-aviation.com", "FR"], ["aviation", "Let's Fly", "letsfly.fr", "FR"], ["aviation", "Dassault Falcon Service", "dassaultfalcon.com", "FR"], ["aviation", "Comlux", "comlux.com", "EN"], ["aviation", "Albinati Aeronautics", "albinati.com", "EN"], ["aviation", "Executive Jets", "executivejetsparis.com", "FR"], ["aviation", "Aeolus", "fly-aeolus.com", "EN"], ["aviation", "Clay Lacy", "clay-lacy.com", "EN"], ["aviation", "Evojets", "evojets.com", "EN"], ["aviation", "Air Charter Europe", "airchartereurope.com", "EN"], ["aviation", "Private Jet Charter France", "privatejetcharter.fr", "FR"], ["maritime", "ATPI", "atpi.com", "EN"], ["maritime", "Blue Marine Travel", "bluemarinetravel.com", "EN"], ["maritime", "Global Marine Travel", "globalmarinetravel.com", "EN"], ["maritime", "Fraser", "fraseryachts.com", "EN"], ["maritime", "Burgess", "burgessyachts.com", "EN"], ["maritime", "Y.CO", "y.co", "EN"], ["maritime", "Camper & Nicholsons", "camperandnicholsons.com", "EN"], ["maritime", "Northrop & Johnson", "northropandjohnson.com", "EN"], ["maritime", "Edmiston", "edmiston.com", "EN"], ["maritime", "Ocean Independence", "oceanindependence.com", "EN"], ["maritime", "Hill Robinson", "hillrobinson.com", "EN"], ["maritime", "YPI Crew", "ypicrew.com", "EN"], ["maritime", "Wilsonhalligan", "wilsonhalligan.com", "EN"], ["maritime", "Bluewater", "bluewateryachting.com", "EN"], ["maritime", "Ponant", "ponant.com", "EN"], ["maritime", "Louis Dreyfus Armateurs", "lda.fr", "EN"], ["maritime", "CroisiEurope", "croisieurope.com", "EN"], ["maritime", "Monaco Marine", "monacomarine.com", "EN"], ["maritime", "MB92", "mb92.com", "EN"], ["maritime", "IYC", "iyc.com", "EN"], ["maritime", "Cecil Wright", "cecilwright.com", "EN"], ["maritime", "Imperial Yachts", "imperial-yachts.com", "EN"], ["maritime", "Moran Yacht & Ship", "moranyachts.com", "EN"], ["maritime", "TWW Yachts", "twwyachts.com", "EN"], ["maritime", "Quay Crew", "quaycrew.com", "EN"], ["maritime", "Viking Recruitment", "viking-recruitment.com", "EN"], ["maritime", "V.Group", "vgrouplimited.com", "EN"], ["maritime", "Explora Journeys", "explorajourneys.com", "EN"], ["maritime", "Silversea", "silversea.com", "EN"], ["maritime", "Seabourn", "seabourn.com", "EN"], ["maritime", "Merle Wood", "merle-wood.com", "EN"], ["maritime", "Superyachts Monaco", "superyachtsmonaco.com", "EN"], ["maritime", "Rudders", "ruddersmaritime.com", "EN"], ["maritime", "Lürssen", "lurssen.com", "EN"], ["maritime", "Feadship", "feadship.nl", "EN"], ["maritime", "Amels", "amels-holland.com", "EN"], ["maritime", "Riva", "riva-yacht.com", "EN"], ["maritime", "Wally", "wallyyachts.com", "EN"], ["maritime", "Yacht Crew Register", "yachtcrewregister.com", "EN"], ["maritime", "Crewseekers", "crewseekers.net", "EN"], ["luxe", "L'Exceptionnel France", "lexceptionnel-france.com", "FR"], ["luxe", "Pacific World", "pacificworld.com", "EN"], ["luxe", "Kuoni Tumlare", "kuoni-tumlare.com", "EN"], ["luxe", "Quintessentially", "quintessentially.com", "EN"], ["luxe", "Ten Lifestyle Group", "tengroup.com", "EN"], ["luxe", "John Paul", "johnpaul.com", "FR"], ["luxe", "Bureau Betak", "bureaubetak.com", "FR"], ["luxe", "Karla Otto", "karlaotto.com", "EN"], ["luxe", "KCD", "kcdworldwide.com", "EN"], ["luxe", "Hopscotch", "hopscotchgroupe.com", "FR"], ["luxe", "MCI", "mci-group.com", "EN"], ["luxe", "Fédération de la Haute Couture et de la Mode", "fhcm.paris", "FR"], ["luxe", "Viparis", "viparis.com", "FR"], ["luxe", "Comexposium", "comexposium.com", "FR"], ["luxe", "RX France", "rxglobal.com", "EN"], ["luxe", "GL events", "gl-events.com", "FR"], ["luxe", "Barnes", "barnes-international.com", "FR"], ["luxe", "Emile Garcin", "emile-garcin.fr", "FR"], ["luxe", "Daniel Féau", "daniel-feau.com", "FR"], ["luxe", "Kretz", "kretzrealestate.com", "FR"], ["luxe", "Artcurial", "artcurial.com", "FR"], ["luxe", "Drouot", "drouot.com", "FR"], ["luxe", "Paris Jet Set", "parisjetset.com", "FR"], ["luxe", "Elegant Paris", "elegantparis.com", "FR"], ["luxe", "French Escapade", "frenchescapade.com", "FR"], ["luxe", "The French DMC", "thefrenchdmc.com", "FR"], ["luxe", "Deluxe France", "deluxe-france.com", "FR"], ["luxe", "Le Connoisseur", "le-connoisseur.com", "FR"], ["luxe", "Nacara DMC", "nacara-dmc.com", "FR"], ["luxe", "Century Incoming", "centuryincoming.com", "FR"], ["luxe", "Lafayette Group", "lafayette-group.com", "FR"], ["luxe", "French Events", "french-events.com", "FR"], ["luxe", "Amirantes Events", "amirantes-events.com", "FR"], ["luxe", "The Real France", "thereal-france.com", "FR"], ["luxe", "Les Clefs d'Or France", "clefsdorfrance.org", "FR"], ["luxe", "Les Clefs d'Or", "lesclefsdor.com", "EN"], ["luxe", "Bespoke Concierge", "bespokeconcierge.com", "EN"], ["luxe", "Lifestyle Concierge", "lifestyleconcierge.fr", "FR"], ["luxe", "Conciergerie Privée", "conciergerie-privee.com", "FR"], ["finance", "Actus Finance", "actus-finance.com", "FR"], ["finance", "Ulysse Communication", "ulysse-communication.com", "FR"], ["finance", "Shan", "shan.fr", "FR"], ["finance", "Image 7", "image7.fr", "FR"], ["finance", "Citigate Dewe Rogerson", "citigatedewerogerson.com", "FR"], ["finance", "Brunswick", "brunswickgroup.com", "EN"], ["finance", "Kepler Cheuvreux", "keplercheuvreux.com", "FR"], ["finance", "Oddo BHF", "oddo-bhf.com", "FR"], ["finance", "Portzamparc", "portzamparc.fr", "FR"], ["finance", "Invest Securities", "invest-securities.com", "FR"], ["finance", "Edmond de Rothschild", "edmond-de-rothschild.com", "FR"], ["finance", "Rothschild & Co", "rothschildandco.com", "FR"], ["finance", "Lazard", "lazard.com", "FR"], ["finance", "Mirabaud", "mirabaud.com", "FR"], ["finance", "Lombard Odier", "lombardodier.com", "FR"], ["finance", "Banque Transatlantique", "banquetransatlantique.com", "FR"], ["finance", "Indosuez", "ca-indosuez.com", "FR"], ["finance", "La Financière de l'Échiquier", "lfde.com", "FR"], ["finance", "Carmignac", "carmignac.com", "FR"], ["finance", "Tikehau Capital", "tikehaucapital.com", "FR"], ["finance", "Ardian", "ardian.com", "FR"], ["finance", "Eurazeo", "eurazeo.com", "FR"], ["finance", "Wendel", "wendelgroup.com", "FR"], ["finance", "Association Française du Family Office", "affo.fr", "FR"], ["finance", "Degroof Petercam", "degroofpetercam.com", "FR"], ["finance", "Montpensier Finance", "montpensier.com", "FR"], ["finance", "Sycomore AM", "sycomore-am.com", "FR"], ["finance", "OFI Invest", "ofi-invest-am.com", "FR"], ["finance", "Rivage Investment", "rivage-investment.com", "FR"], ["hotel", "Saint James Paris", "lesaintjamesparis.com", "FR"], ["hotel", "Hôtel Majestic", "majestic-hotel.com", "FR"], ["hotel", "Hôtel Raphael", "raphael-hotel.com", "FR"], ["hotel", "Hôtel Regina Louvre", "regina-hotel.com", "FR"], ["hotel", "Hôtel Lancaster", "hotel-lancaster.fr", "FR"], ["hotel", "Maison Albar Hotels", "maisonalbarhotels.com", "FR"], ["hotel", "Hôtel de Berri", "hoteldeberri.com", "FR"], ["hotel", "Les Jardins du Faubourg", "lesjardinsdufaubourg.com", "FR"], ["hotel", "Hôtel Napoléon", "hotelnapoleonparis.com", "FR"], ["hotel", "Monsieur George", "monsieurgeorge.com", "FR"], ["hotel", "Hôtel d'Aubusson", "hoteldaubusson.com", "FR"], ["hotel", "Hôtel de Sers", "hoteldesers.com", "FR"], ["hotel", "Pavillon de la Reine", "pavillon-de-la-reine.com", "FR"], ["hotel", "Le Cinq Codet", "lecinqcodet.com", "FR"], ["hotel", "Pavillon des Lettres", "pavillondesletres.com", "FR"], ["hotel", "Sinner", "sinnerparis.com", "FR"], ["hotel", "La Maison Champs-Élysées", "lamaisonchampselysees.com", "FR"], ["hotel", "La Trémoille", "hotel-tremoille.com", "FR"], ["hotel", "Hôtel Balzac", "hotelbalzac.com", "FR"], ["hotel", "Champs-Élysées Plaza", "champselyseesplaza.com", "FR"], ["hotel", "Hôtel Vernet", "hotelvernet-paris.com", "FR"], ["hotel", "Hôtel Keppler", "hotelkeppler.com", "FR"], ["hotel", "Hôtel Barrière Le Fouquet's", "hotelsbarriere.com", "FR"], ["hotel", "Hôtel Montalembert", "montalembert.com", "FR"], ["hotel", "Hôtel Bachaumont", "hotelbachaumont.com", "FR"], ["hotel", "Maison Souquet", "maisonsouquet.com", "FR"], ["hotel", "Maison Breguet", "maisonbreguet.com", "FR"], ["hotel", "Le Narcisse Blanc", "lenarcisseblanc.com", "FR"], ["hotel", "Nolinski", "nolinski.com", "FR"], ["hotel", "Hôtel Marignan", "hotel-marignan.com", "FR"], ["hotel", "Hôtel Powers", "hotelpowers.com", "FR"], ["hotel", "Hôtel du Ministère", "hotelduminister.com", "FR"], ["hotel", "La Maison Favart", "lamaisonfavart.com", "FR"], ["hotel", "Splendide Royal", "hotelsplendideroyal.com", "FR"], ["hotel", "Hôtel de l'Avenue", "hoteldelavenue.com", "FR"], ["hotel", "Hôtel François 1er", "hotelfrancoispremier.com", "FR"], ["hotel", "Hôtel West End", "hotel-west-end.com", "FR"], ["hotel", "Hôtel Chateaubriand", "hotelchateaubriand.com", "FR"], ["hotel", "Le Mathurin", "lemathurin.com", "FR"], ["hotel", "Le Bellechasse", "hotel-le-bellechasse.com", "FR"], ["hotel", "Le Roch", "leroch-hotel.com", "FR"], ["hotel", "Hôtel Particulier", "hotelparticulier-paris.com", "FR"], ["hotel", "Hôtel Galileo", "hotel-galileo.com", "FR"], ["hotel", "Prince de Galles", "leprincedegalles.com", "FR"], ["hotel", "Le Damantin", "le-damantin.com", "FR"], ["hotel", "Élysia", "hotelelysia.com", "FR"], ["hotel", "Parister", "parister.com", "FR"], ["hotel", "Hôtel Baume", "hotelbaume-paris.com", "FR"], ["hotel", "Hôtel du Petit Moulin", "hoteldupetitmoulin.com", "FR"], ["hotel", "Hôtel Fabric", "hotelfabric.com", "FR"], ["hotel", "Hôtel de Nell", "hotel-de-nell.com", "FR"], ["hotel", "Villa Madame", "hotelvillamadame.com", "FR"], ["hotel", "Les Bains", "lesbainsparis.com", "FR"], ["hotel", "Hôtel Amastan", "hotelamastan.com", "FR"], ["voyage", "Artisans of Leisure", "artisansofleisure.com", "EN"], ["voyage", "Smartflyer", "smartflyer.com", "EN"], ["voyage", "Fora Travel", "foratravel.com", "EN"], ["voyage", "Scott Dunn", "scottdunn.com", "EN"], ["voyage", "Butterfield & Robinson", "butterfield.com", "EN"], ["voyage", "Gifted Travel Network", "giftedtravelnetwork.com", "EN"], ["voyage", "Indagare", "indagare.com", "EN"], ["voyage", "Black Tomato", "blacktomato.com", "EN"], ["voyage", "Abercrombie & Kent", "abercrombiekent.com", "EN"], ["voyage", "Embark Beyond", "embarkbeyond.com", "EN"], ["voyage", "Valerie Wilson Travel", "vwti.com", "EN"], ["voyage", "Brownell Travel", "brownelltravel.com", "EN"], ["voyage", "Protravel International", "protravelinc.com", "EN"], ["voyage", "Tzell Travel Group", "tzell.com", "EN"], ["voyage", "Travel Edge", "traveledge.com", "EN"], ["voyage", "Exeter International", "exeterinternational.com", "EN"], ["voyage", "Altour", "altour.com", "EN"], ["voyage", "Ovation Travel Group", "ovationtravel.com", "EN"], ["voyage", "Frosch", "frosch.com", "EN"], ["voyage", "Andrew Harper", "andrewharper.com", "EN"], ["voyage", "Ker & Downey", "kerdowney.com", "EN"], ["voyage", "French Side Travel", "frenchsidetravel.com", "EN"], ["voyage", "Exclusive France Tours", "exclusive-france-tours.com", "EN"], ["voyage", "G. Hardy Tours", "ghardytours.com", "EN"], ["voyage", "Context Travel", "contexttravel.com", "EN"], ["voyage", "Paris Perfect", "parisperfect.com", "EN"], ["voyage", "Paris Property Group", "parispropertygroup.com", "EN"]];

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
        voyage: 'votre agence envoie régulièrement des clients exigeants à Paris et en France' },
  EN: { aviation: 'your company regularly flies passengers and crews into Paris', maritime: 'your company regularly sends crews and guests through Paris',
        luxe: 'your company regularly welcomes clients and guests in Paris', finance: 'your company regularly organises meetings and executive travel in Paris',
        hotel: 'your hotel welcomes guests who often need a chauffeur in Paris',
        voyage: 'your agency regularly sends discerning clients to Paris and France' }
};

var LIGNE = {
  FR: {
    aviation: 'les transferts de vos passagers et de vos équipages entre Le Bourget, Roissy-CDG, Orly et Paris, à toute heure',
    maritime: 'les transferts de vos équipages et de vos clients entre Roissy-CDG, Orly, Le Bourget et Paris, à toute heure',
    luxe: "l'accueil et les déplacements de vos clients et invités à Paris (événements, défilés, rendez-vous, visites, shopping)",
    finance: 'les roadshows, rendez-vous investisseurs et déplacements de vos dirigeants à Paris, avec chauffeur à disposition à l’heure ou à la journée',
    hotel: 'les transferts aéroport et le chauffeur à disposition pour vos clients, en complément de votre conciergerie',
    voyage: 'l’accueil à l’aéroport, le chauffeur à disposition et les excursions privées (Versailles, Giverny…) pour vos clients à Paris'
  },
  EN: {
    aviation: 'transfers for your passengers and crews between Paris Le Bourget, Charles de Gaulle (CDG), Orly and central Paris, at any hour',
    maritime: 'transfers for your crews and guests between Paris Charles de Gaulle (CDG), Orly, Le Bourget and central Paris, at any hour',
    luxe: 'meet & greet and chauffeur services for your clients and guests in Paris (events, shows, appointments, viewings, shopping)',
    finance: 'roadshows, investor meetings and executive travel in Paris, with a chauffeur at your disposal by the hour or by the day',
    hotel: 'airport transfers and chauffeurs at disposal for your guests in Paris',
    voyage: 'airport meet & greet, chauffeurs at disposal and private day trips (Versailles, Giverny…) for your clients in Paris'
  }
};

function texte_(cat, societe, lang) {
  lang = lang === 'EN' ? 'EN' : 'FR';
  var l = (LIGNE[lang][cat] || LIGNE[lang].luxe), q = (QUI[lang][cat] || QUI[lang].luxe);
  if (lang === 'EN') {
    var sujet = 'Rafai Limousine × ' + societe + ' – private chauffeur partnership in Paris';
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
  var deja = {}, n = 0, reste = MailApp.getRemainingDailyQuota();
  for (var i = 1; i < v.length; i++) if (v[i][7]) deja[String(v[i][4]).toLowerCase()] = 1;
  for (var i = 1; i < v.length; i++) {
    if (n >= MAX_JOUR || reste - n < 20) break;
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
  Logger.log('envoyés aujourd’hui : ' + n);
}

function installerEnvoiQuotidien() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'envoyerLot') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('envoyerLot').timeBased().everyDays(1).atHour(9).nearMinute(40).inTimezone('Europe/Paris').create();
  Logger.log('envoi quotidien installé (9 h 40, heure de Paris)');
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
var CHOIX = {};
var A_VALIDER = [];
function appliquerChoix() {
  var sh = ss_().getSheetByName(FEUILLE);
  Object.keys(CHOIX).forEach(function (r) {
    if (CHOIX[r]) sh.getRange(+r, 5).setValue(CHOIX[r]);
    else { sh.getRange(+r, 5).setValue(''); sh.getRange(+r, 9).setValue('écartée (adresse non adaptée)'); }
  });
  A_VALIDER.forEach(function (r) { sh.getRange(+r, 7).setValue('OUI'); });
  Logger.log('corrections : ' + Object.keys(CHOIX).length + ' ; validées : ' + A_VALIDER.length);
}
