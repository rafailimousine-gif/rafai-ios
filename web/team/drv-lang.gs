/* ---------- rlLang v1 : RL Driver, e-mails et notifications du chauffeur en anglais par défaut ----------
 * L'appli envoie la langue choisie (&ul=en|fr) avec chaque appel. Elle est gardée par chauffeur
 * (propriété DRV_LANG_<id> = 'fr' ; sans propriété : anglais).
 * L'ordre de mission (PDF) reste en français : c'est le document présenté en cas de contrôle en France.
 * Ce fichier remplace, dans Code.gs, les fonctions du même nom ; les fonctions nouvelles sont ajoutées à la fin.
 */
function drvLang_(id) {
  if (!id || id === 'TEAM') return 'fr';
  try { return PropertiesService.getScriptProperties().getProperty('DRV_LANG_' + id) === 'fr' ? 'fr' : 'en'; } catch (e) { return 'en'; }
}
function drvLangSet_(id, ul) {
  if (!id || id === 'TEAM' || (ul !== 'en' && ul !== 'fr')) return;
  var c = CacheService.getScriptCache(), ck = 'dlang:' + id;
  if (c.get(ck) === ul) return;
  var p = PropertiesService.getScriptProperties(), k = 'DRV_LANG_' + id;
  if (ul === 'fr') { if (p.getProperty(k) !== 'fr') p.setProperty(k, 'fr'); }
  else if (p.getProperty(k) !== null) p.deleteProperty(k);
  c.put(ck, ul, 21600);
}
function rlEnDate_(iso) { var d = dObj_(iso); return d ? J_EN[d.getDay()] + ' ' + d.getDate() + ' ' + M_EN[d.getMonth()] + ' ' + d.getFullYear() : String(iso || ''); }
function rlEnShort_(b) { var d = dObj_(b.date); return (d ? J_EN[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + M_EN[d.getMonth()].slice(0, 3) : '') + (b.time ? ' at ' + b.time : ''); }
function rlTrEn_(s) {
  s = String(s == null ? '' : s);
  var M = { 'Transfert aéroport': 'Airport transfer', 'Aller simple': 'One way', 'Mise à disposition': 'Hourly / As directed', 'Mariage': 'Wedding', 'Course': 'Trip',
    'Berline · Mercedes Classe E': 'Sedan · Mercedes E-Class', 'Première classe · Mercedes Classe S': 'First class · Mercedes S-Class',
    'Van · Mercedes Classe V': 'Van · Mercedes V-Class', 'Grand Tourisme · Range Rover Autobiography': 'Grand Touring · Range Rover Autobiography',
    'Français': 'French', 'Anglais': 'English', 'Arabe': 'Arabic', 'Chinois': 'Chinese',
    'Carte bancaire': 'Card', 'Espèces': 'Cash', 'Virement': 'Bank transfer', 'Lien de paiement': 'Payment link', 'Paiement par notre partenaire': 'Paid via our partner' };
  return Object.prototype.hasOwnProperty.call(M, s) ? M[s] : s.replace(/Mercedes Classe ([ESV])\b/g, 'Mercedes $1-Class');
}
function rlPrice_(b, en) {
  if (!en) return drvPriceTxt_(b);
  var ht = money_(b.drvPrice), v = vat_(b.drvVat);
  if (ht === '') return '';
  return v ? eur_(drvTtc_(b)) + ' incl. VAT (' + eur_(ht) + ' excl. VAT + VAT ' + v + ' %)' : eur_(ht);
}
function rlTripRows_(b, en) {
  if (!en) return tripRows_(b);
  var stops = stopsArr_(b).map(function (s, i) { return row_('Stop ' + (i + 1), esc_(s)); }).join('');
  return row_('Date', '<b>' + esc_(rlEnDate_(b.date)) + (b.time ? ' · ' + esc_(b.time) : '') + '</b>') +
    row_('Pick-up', esc_(b.from)) + stops +
    (b.to ? row_('Destination', esc_(b.to)) : '') + row_('Duration', esc_(b.duration)) +
    row_('Route', esc_(b.route)) + row_('Flight / train', esc_(b.flight));
}
function drvAppRoute_(q) {
  var id = String(q.id || ''), k = String(q.k || '');
  /* rlLang v1 : langue choisie dans l'appli, gardée pour les e-mails et notifications du chauffeur */
  if (q.ul && id && k && id !== 'TEAM') { try { if (k === drvAppKey_(id)) drvLangSet_(id, String(q.ul)); } catch (e) {} }
  if (q.app === 'drvhist') return drvHist_(id, k);
  if (q.app === 'drvlogin') return drvLogin_(q);
  if (q.app === 'drvverify') return drvVerify_(q);
  if (q.app === 'drv') return drvAppApi_(id, k);
  if (q.app === 'drvsub') return drvPushSub_(id, k, String(q.ep || ''), q.off === '1');
  if (q.app === 'drvnpush') return drvNPushSub_(id, k, String(q.t || ''));
  if (q.app === 'cnpush') return cliOut_(cliNPushSub_(q));
  if (q.app === 'drvmsg') return drvPushMsgOut_(id, k);
  if (q.app === 'drvph') return drvPhotosOut_(id, k, String(q.cat || ''));
  if (q.app === 'drvodm') return drvOdmPage_(String(q.ref || ''), k);
  if (q.app === 'drvdoc') return drvDocOut_(String(q.ref || ''), k, String(q.t || ''));
  if (q.app === 'drvtrk') return drvTrkOut_(q);
  if (q.app === 'tmcfg') return drvAppOut_(k && k === drvAppKey_('TEAM') ? { ok: true, vapid: drvVapidPub_(), n: drvSubs_('TEAM').length } : { ok: false, err: 'lien' });
  if (q.app === 'tmsub') return teamAlertSub_(k, String(q.ep || ''), q.off === '1');
  if (q.app === 'chat') return drvChatGet_(id, k, String(q.c || ''), String(q.ref || ''));
  if (/^c(quote|login|verify|mine|one|fleet|ph|pay|sub|msg|inv|del|cfg|pkopt|geo|fn)$/.test(q.app)) return cliRoute_(q);
  return drvAppOut_({ ok: false, err: 'action' });
}
function drvLogin_(q) {
  var e = drvMail_(q.e);
  if (!e) return drvAppOut_({ ok: false, err: 'email' });
  if (e === DEMO_MAIL && demoCode_()) return drvAppOut_({ ok: true });
  var c = CacheService.getScriptCache(), h = cliHash_('drv|' + e), n = Number(c.get('dlg:' + h)) || 0;
  if (n >= 5) return drvAppOut_({ ok: false, err: 'quota' });
  c.put('dlg:' + h, String(n + 1), 3600);
  var d = drvByMail_(e);
  if (d && cliQuota_('mail', 300)) {
    var code = String(Math.floor(100000 + Math.random() * 900000));
    c.put('dlc:' + h, code, 900); c.remove('dla:' + h);
    /* rlLang v1 : code envoyé dans la langue de l'appli (anglais par défaut) */
    if (q.ul) { try { drvLangSet_(d.id, String(q.ul)); } catch (x) {} }
    var en = q.ul === 'en' || q.ul === 'fr' ? q.ul === 'en' : drvLang_(d.id) === 'en';
    MailApp.sendEmail({ to: e, subject: en ? 'RL Driver · your sign-in code: ' + code : 'RL Driver · votre code de connexion : ' + code, name: 'Rafai Limousine', replyTo: TEAM_EMAIL,
      htmlBody: '<div style="font-family:Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111113">' +
        '<div style="color:#B8904F;letter-spacing:.2em;font-weight:800;font-size:13px">RAFAI LIMOUSINE · RL DRIVER</div>' +
        '<h1 style="font-size:20px;margin:18px 0 8px">' + (en ? 'Hello ' + esc_(d.fname || '') + ', here is your code' : 'Bonjour ' + esc_(d.fname || '') + ', voici votre code') + '</h1>' +
        '<div style="font-size:34px;font-weight:800;letter-spacing:.3em;background:#FBF7EF;border:1px solid #EADCC2;border-radius:12px;padding:14px 18px;text-align:center;margin:14px 0">' + code + '</div>' +
        '<p style="color:#55555C;line-height:1.5">' + (en ? 'Enter this code in the RL Driver app to see your missions. It is valid for 15 minutes.' : 'Tapez ce code dans l’appli RL Driver pour voir vos missions. Il est valable 15 minutes.') + '</p>' +
        '<p style="color:#8E8E93;font-size:12px">' + (en ? 'Didn’t ask for this? Ignore this email and let Rafai Limousine know on ' : 'Vous n’avez rien demandé ? Ignorez cet e-mail et prévenez Rafai Limousine au ') + COMPANY_PHONE + '.</p></div>' });
  }
  return drvAppOut_({ ok: true });
}
function drvPush_(id, kind, b) {
  if (!id) return 0;
  var subs = drvSubs_(id), nat = npush_(id);
  if (!subs.length && !nat.length) return 0;
  var tx = drvPushText_(kind, b || {}, drvLang_(id)), v = drvVapid_();
  PropertiesService.getScriptProperties().setProperty('PUSH_MSG_' + id, JSON.stringify({ t: Date.now(), title: tx.title, body: tx.body, ref: (b && b.ref) || '', kind: tx.kind || '', url: tx.url || '' }));
  var ok = 0, keep = [];
  subs.forEach(function (s) {
    var aud = (String(s.e).match(/^https:\/\/[^\/]+/) || [''])[0], code = 0;
    try {
      code = UrlFetchApp.fetch(s.e, { method: 'post', payload: '', muteHttpExceptions: true,
        headers: { Authorization: 'vapid t=' + drvVapidJwt_(aud, v) + ', k=' + v.pub, TTL: '86400', Urgency: 'high' } }).getResponseCode();
    } catch (e) { code = 0; }
    if (code >= 200 && code < 300) ok++;
    if (code !== 404 && code !== 410) keep.push(s);
  });
  if (keep.length !== subs.length) drvSubsSave_(id, keep);
  if (nat.length) { try { ok += fcmSend_(id, tx, b || {}); } catch (e) {} }
  return ok;
}
function drvPushText_(kind, b, lg) {
  if (kind && typeof kind === 'object') return kind;
  var cut = function (s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  var en = lg === 'en';
  var when = en ? rlEnShort_(b) : (b.date ? shortDate_(b.date) : '') + (b.time ? ' à ' + b.time : '');
  var route = cut(b.from, 38) + (b.to ? ' → ' + cut(b.to, 38) : '');
  if (/^(cancel|reassign|unassign|delete)$/.test(kind)) return en ? { title: 'Mission cancelled', body: b.ref + ' on ' + when + ': you do not need to go.' } : { title: 'Mission annulée', body: b.ref + ' du ' + when + ' : vous n’avez pas à vous déplacer.' };
  var title = en ? (kind === 'update' ? 'Mission updated' : (kind === 'resend' ? 'Mission reminder' : 'New mission')) : (kind === 'update' ? 'Mission modifiée' : (kind === 'resend' ? 'Rappel de mission' : 'Nouvelle mission'));
  return { title: title, body: when + ' · ' + route + (kind === 'update' ? (en ? ' (check the details)' : ' (vérifiez les détails)') : '') };
}
function chatPush_(drvId, title, body, ref, kind, url) {
  try {
    if (drvLang_(drvId) === 'en') title = String(title || '').replace('🚨 ALERTE · ', '🚨 ALERT · ').replace(/^Message de Rafai Limousine$/, 'Message from Rafai Limousine')
      .replace(/^Rafai Limousine · course /, 'Rafai Limousine · trip ').replace(/^Message du client · /, 'Message from the client · ');
    return drvPush_(drvId, { title: title, body: chatClean_(body, 160).replace(/\s+/g, ' '), kind: kind, url: url }, { ref: ref || '' });
  } catch (e) { return 0; }
}
function sendMission_(b, drv, note, kind) {
  drvPushSafe_(drv && drv.id, kind, b);
  note = note || b.driverNote || '';
  /* rlLang v1 : anglais par défaut, français si le chauffeur a choisi Français dans RL Driver */
  var en = drvLang_(drv && drv.id) === 'en', t = function (f, g) { return en ? g : f; };
  var dTxt = en ? rlEnDate_(b.date) : frDate_(b.date), price = rlPrice_(b, en);
  var docs = docsUrl_(b.ref, drv.id), app = drv.id ? drvAppUrl_(drv.id) + '#m=' + encodeURIComponent(b.ref) : '';
  var client = esc_(((b.fname || '') + ' ' + (b.lname || '')).trim());
  var title = kind === 'update' ? t('Course mise à jour', 'Trip updated') : (kind === 'resend' ? t('Rappel de course', 'Trip reminder') : t('Vous êtes assigné(e)', 'You are assigned'));
  var refB = '<b>' + esc_(b.ref) + '</b>';
  var intro = kind === 'update' ? t('La course ' + refB + ' qui vous est assignée a été modifiée. Merci de vérifier les nouvelles informations ci-dessous.', 'Trip ' + refB + ', assigned to you, has been changed. Please check the new details below.')
    : (en ? (kind === 'resend' ? 'Reminder: you are assigned to trip ' : 'You are assigned to trip ') + refB +
      ' on <b>' + esc_(dTxt) + (b.time ? ' at ' + esc_(b.time) : '') + '</b>' +
      (price ? ', for <b>' + esc_(price) + '</b>' : '') +
      '.<br>All the details are below and in the attached mission order. Please confirm receipt by replying to this email.'
    : (kind === 'resend' ? 'Rappel : vous êtes assigné(e) à la course ' : 'Vous êtes assigné(e) à la course ') + refB +
      ' du <b>' + esc_(dTxt) + (b.time ? ' à ' + esc_(b.time) : '') + '</b>' +
      (price ? ', au prix de <b>' + esc_(price) + '</b>' : '') +
      '.<br>Tous les détails sont ci-dessous et dans l’ordre de mission joint. Merci de confirmer la bonne réception en répondant à cet e-mail.');
  var btns = btn_(mapsUrl_(b), t('Itinéraire Google Maps', 'Google Maps route'), true) +
    (b.from ? btn_('https://waze.com/ul?navigate=yes&q=' + encodeURIComponent(b.from), t('Waze vers la prise en charge', 'Waze to pick-up'), true) : '') +
    (b.tel ? btn_(telHref_(b.tel), t('Appeler le client', 'Call the client'), false) + btn_('https://wa.me/' + waNum_(b.tel), t('WhatsApp client', 'WhatsApp the client'), false) : '');
  var cash = /esp[eè]ce|cash/i.test(b.pay || ''), paidElsewhere = /lien de paiement|partenaire/i.test(b.pay || '');
  var clientRows = row_(t('Nom', 'Name'), client) +
    row_(t('Téléphone', 'Phone'), b.tel ? '<a href="' + esc_(telHref_(b.tel)) + '" style="color:' + C.ink + '">' + esc_(b.tel) + '</a>' : '') +
    row_(t('Réservé par', 'Booked by'), esc_(b.booker)) + row_(t('Langue', 'Language'), esc_(en ? rlTrEn_(b.lang) : b.lang)) +
    row_(t('Passagers', 'Passengers'), esc_(b.pax)) + row_(t('Bagages', 'Luggage'), esc_(b.bags)) + row_(t('Véhicule', 'Vehicle'), esc_(en ? rlTrEn_(b.car || drv.car) : (b.car || drv.car))) +
    row_(t('Paiement', 'Payment'), esc_(en ? rlTrEn_(b.pay) : b.pay) + (cash && b.priceOk ? ' · <b>' + t('à encaisser : ', 'to collect: ') + esc_(b.priceOk) + ' €</b>' : '') + (paidElsewhere ? ' · <b>' + t('rien à encaisser auprès du client', 'nothing to collect from the client') + '</b>' : ''));
  var body =
    '<tr><td style="padding:26px 28px 6px"><div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:' + C.gold + ';font-weight:800">' + title + ' · ' + esc_(en ? rlTrEn_(b.service || 'Course') : (b.service || 'Course')) + '</div>' +
    '<div style="font-size:26px;line-height:1.2;font-weight:800;color:' + C.ink + ';margin:8px 0 4px">' + esc_(dTxt) + (b.time ? ' · ' + esc_(b.time) : '') + '</div>' +
    '<div style="font-size:15px;color:#2A2A2E;line-height:1.5">' + t('Bonjour ', 'Hello ') + esc_(drv.fname || '') + ',<br>' + intro + '</div></td></tr>' +
    (note ? '<tr><td style="padding:16px 28px 0"><div style="background:#FBF7EF;border:1px solid #EADCC2;border-radius:12px;padding:14px 16px;font-size:15px;color:' + C.ink + ';line-height:1.5"><b>' + t('Note de l’équipe :', 'Note from the team:') + '</b><br>' + esc_(note).replace(/\n/g, '<br>') + '</div></td></tr>' : '') +
    (app ? '<tr><td style="padding:18px 28px 0"><a href="' + esc_('https://apps.apple.com/fr/app/rl-driver/id6829409890') + '" style="display:block;text-align:center;padding:15px 16px;border-radius:12px;background:' + C.gold + ';color:#111113;font-size:16px;font-weight:800;text-decoration:none">' + t('Télécharger l’appli RL Driver (App Store)', 'Download the RL Driver app (App Store)') + '</a><div style="text-align:center;font-size:13px;line-height:1.5;color:#55555C;margin-top:8px">' + t('Déjà installée ? Ouvrez <b>RL Driver</b> et connectez-vous avec votre adresse e-mail.', 'Already installed? Open <b>RL Driver</b> and sign in with your email address.') + '</div></td></tr>' : '') +
    '<tr><td style="padding:18px 28px 0">' + btns + '</td></tr>' +
    '<tr><td style="padding:10px 28px 0"><div style="border:1px solid ' + C.line + ';border-radius:12px;padding:14px 16px;font-size:14px;line-height:1.55;color:' + C.ink + '">' +
    '<b>' + esc_(b.ref) + ' · ' + (isWelcome_(b) ? t('Ordre de mission et pancarte d’accueil</b> au nom du client sont en pièces jointes (PDF).', 'Mission order and welcome name sign</b> for the client are attached (PDF).') : t('Ordre de mission</b> en pièce jointe (PDF).', 'Mission order</b> attached (PDF).')) +
    t(' Gardez l’ordre de mission sur vous : il est à présenter en cas de contrôle.', ' Keep the mission order with you: you must show it in case of a roadside check.') +
    (app ? '<br>' + t('Statuts de la course et suivi GPS : dans l’appli <b>RL Driver</b>. Pas encore installée ? Téléchargez-la sur l’App Store (bouton doré ci-dessus), puis connectez-vous avec votre adresse e-mail : vous recevez un code à 6 chiffres.', 'Trip statuses and GPS tracking: in the <b>RL Driver</b> app. Not installed yet? Download it from the App Store (gold button above), then sign in with your email address: you will receive a 6-digit code.') : '') +
    '</div></td></tr>' +
    section_(t('Votre course', 'Your trip'), row_(t('Référence', 'Reference'), '<b>' + esc_(b.ref) + '</b>') +
      (price ? row_(t('Prix chauffeur', 'Driver price'), '<b style="color:' + C.gold + ';font-size:17px">' + esc_(price) + '</b>') : '') + rlTripRows_(b, en)) +
    section_('Client', clientRows) +
    (b.notes ? section_(t('Demandes du client', 'Client requests'), '<tr><td style="padding:10px 0;font-size:15px;color:' + C.ink + ';line-height:1.5">' + esc_(b.notes).replace(/ \/ /g, '<br>') + '</td></tr>') : '');
  var foot = t('Le fichier joint ajoute la course à votre agenda (rappel 1 h 30 avant).', 'The attached file adds the trip to your calendar (reminder 1 h 30 before).') + '<br>Rafai Limousine · ' + COMPANY_PHONE + ' · ' + TEAM_EMAIL;
  var html = shell_(esc_(b.ref) + '<br><span style="color:#9A9AA0;font-weight:600;letter-spacing:0">' + t('Chauffeur : ', 'Driver: ') + esc_(drvName_(drv)) + '</span>', body, foot);
  var ics = icsBlob_(b, drv);
  var welcome = isWelcome_(b), att = [ordrePdf_(b, drv, note)];
  if (welcome) att.push(pancartePdf_(b));
  if (ics) att.push(ics);
  var m = mailOpts_(html, att);
  if (m.copy && m.copy.toLowerCase() !== String(drv.email).toLowerCase()) m.o.bcc = m.copy;
  var subj = (kind === 'update' ? 'Updated – ' : kind === 'resend' ? 'Reminder – ' : 'Assigned – ') + enWhen_(b);
  var text = en ?
    (kind === 'update' ? 'Trip updated: ' + b.ref : 'Hello ' + (drv.fname || '') + ', you are assigned to trip ' + b.ref + '.') +
    '\nDate: ' + dTxt + ' ' + (b.time || '') + '\nPick-up: ' + (b.from || '') +
    (b.to ? '\nDestination: ' + b.to : '') + (b.flight ? '\nFlight / train: ' + b.flight : '') + '\nClient: ' + ((b.fname || '') + ' ' + (b.lname || '')).trim() + ' ' + (b.tel || '') +
    (b.pax ? '\nPassengers: ' + b.pax : '') + (b.car ? '\nVehicle: ' + rlTrEn_(b.car) : '') +
    (price ? '\nDriver price: ' + price : '') + (note ? '\nNote: ' + note : '') + '\nRoute: ' + mapsUrl_(b) + (app ? '\nRL Driver app on the App Store (sign in with your email): https://apps.apple.com/fr/app/rl-driver/id6829409890' : '')
    : (kind === 'update' ? 'Course mise à jour : ' + b.ref : 'Bonjour ' + (drv.fname || '') + ', vous êtes assigné(e) à la course ' + b.ref + '.') +
    '\nDate : ' + dTxt + ' ' + (b.time || '') + '\nPrise en charge : ' + (b.from || '') +
    (b.to ? '\nDestination : ' + b.to : '') + (b.flight ? '\nVol / train : ' + b.flight : '') + '\nClient : ' + ((b.fname || '') + ' ' + (b.lname || '')).trim() + ' ' + (b.tel || '') +
    (b.pax ? '\nPassagers : ' + b.pax : '') + (b.car ? '\nVéhicule : ' + b.car : '') +
    (price ? '\nPrix chauffeur : ' + price : '') + (note ? '\nNote : ' + note : '') + '\nItinéraire : ' + mapsUrl_(b) + (app ? '\nAppli RL Driver sur l’App Store (connectez-vous avec votre e-mail) : https://apps.apple.com/fr/app/rl-driver/id6829409890' : '');
  sendMail_(drv.email, subj, text, m.o);
}
function sendCancel_(b, drv, why) {
  drvPushSafe_((drv && drv.id) || b.driverId, why || 'cancel', b);
  var en = drvLang_((drv && drv.id) || b.driverId) === 'en', t = function (f, g) { return en ? g : f; };
  var msg = t('La course ci-dessous est <b>annulée</b>. Vous n’avez pas à vous déplacer. Ne tenez plus compte de l’ordre de mission reçu.', 'The trip below has been <b>cancelled</b>. You do not need to go. Please disregard the mission order you received.');
  var body = '<tr><td style="padding:26px 28px 6px"><div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#B42318;font-weight:800">' +
    t('Course annulée', 'Trip cancelled') + '</div>' +
    '<div style="font-size:24px;line-height:1.25;font-weight:800;color:' + C.ink + ';margin:8px 0 6px">' + esc_(en ? rlEnDate_(b.date) : frDate_(b.date)) + (b.time ? ' · ' + esc_(b.time) : '') + '</div>' +
    '<div style="font-size:15px;color:#2A2A2E;line-height:1.5">' + t('Bonjour ', 'Hello ') + esc_(drv.fname || '') + ',<br>' + msg + '</div></td></tr>' +
    section_(t('Course', 'Trip'), row_(t('Référence', 'Reference'), esc_(b.ref)) + row_(t('Prise en charge', 'Pick-up'), esc_(b.from)) + (b.to ? row_('Destination', esc_(b.to)) : ''));
  var m = mailOpts_(shell_(esc_(b.ref), body, t('Merci, et à bientôt.', 'Thank you, see you soon.') + '<br>Rafai Limousine · ' + COMPANY_PHONE));
  if (m.copy && m.copy.toLowerCase() !== String(drv.email).toLowerCase()) m.o.bcc = m.copy;
  sendMail_(drv.email, 'Cancelled – ' + enWhen_(b), t('Course annulée : ' + b.ref + '. Vous n’avez pas à vous déplacer.', 'Trip cancelled: ' + b.ref + '. You do not need to go.'), m.o);
}
function icsBlob_(b, drv) {
  var start = startDate_(b);
  if (!start) return null;
  var end = new Date(start.getTime() + durationMin_(b) * 60000);
  function f(d) { return Utilities.formatDate(d, 'UTC', "yyyyMMdd'T'HHmmss'Z'"); }
  var client = ((b.fname || '') + ' ' + (b.lname || '')).trim();
  var en = drvLang_(drv && drv.id) === 'en';
  var desc = (en ?
    ['Trip ' + b.ref + ' – ' + rlTrEn_(b.service || ''), 'Client: ' + client + (b.tel ? ' · ' + b.tel : ''),
      'Pick-up: ' + (b.from || '')].concat(stopsArr_(b).map(function (s, i) { return 'Stop ' + (i + 1) + ': ' + s; }))
      .concat([b.to ? 'Destination: ' + b.to : (b.duration ? 'Duration: ' + b.duration : ''), b.flight ? 'Flight / train: ' + b.flight : '',
        b.pax ? 'Passengers: ' + b.pax : '', b.notes ? 'Requests: ' + b.notes : '', 'Route: ' + mapsUrl_(b)])
    : ['Course ' + b.ref + ' – ' + (b.service || ''), 'Client : ' + client + (b.tel ? ' · ' + b.tel : ''),
      'Prise en charge : ' + (b.from || '')].concat(stopsArr_(b).map(function (s, i) { return 'Arrêt ' + (i + 1) + ' : ' + s; }))
      .concat([b.to ? 'Destination : ' + b.to : (b.duration ? 'Durée : ' + b.duration : ''), b.flight ? 'Vol / train : ' + b.flight : '',
        b.pax ? 'Passagers : ' + b.pax : '', b.notes ? 'Demandes : ' + b.notes : '', 'Itinéraire : ' + mapsUrl_(b)])).filter(Boolean).join('\n');
  var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rafai Limousine//Espace equipe//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', 'UID:' + b.ref + '-' + (drv.id || 'drv') + '@rafai-limousine.com', 'DTSTAMP:' + f(new Date()),
    'DTSTART:' + f(start), 'DTEND:' + f(end), 'SUMMARY:' + icsEsc_(b.ref + ' · ' + client),
    'LOCATION:' + icsEsc_(b.from || ''), 'DESCRIPTION:' + icsEsc_(desc),
    'BEGIN:VALARM', 'TRIGGER:-PT90M', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc_(en ? 'Trip ' + b.ref + ' in 1 h 30' : 'Course ' + b.ref + ' dans 1 h 30'), 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'];
  return Utilities.newBlob(lines.join('\r\n'), 'text/calendar', 'course-' + b.ref + '.ics');
}
function blockDriver_(p, me) {
  var id = String(p.id || ''), on = p.on !== false, d = driverById_(id);
  if (!d) throw new Error('Chauffeur introuvable');
  var sh = drvSheet_(), ids = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getDisplayValues(), row = -1;
  for (var j = 0; j < ids.length; j++) if (ids[j][0] === id) { row = j + 2; break; }
  if (row < 0) throw new Error('Chauffeur introuvable');
  var cA = DRV_KEYS.indexOf('active') + 1, cB = DRV_KEYS.indexOf('blocked') + 1, mailed = false, up = [];
  if (on) {
    sh.getRange(row, cA).setValue('Non'); sh.getRange(row, cB).setValue(cell_(now_()));
    if (validEmail_(d.email)) {
      try {
        if (drvLang_(id) === 'en') {
          MailApp.sendEmail({ to: d.email, subject: 'Rafai Limousine Team · your access is blocked', name: 'Rafai Limousine', replyTo: TEAM_EMAIL,
            body: 'Hello ' + (d.fname || '') + ',\n\nYou have been blocked by Rafai Limousine Team. You no longer have access to the RL Driver app.\n\nPlease email us at ' + TEAM_EMAIL + ' to find out the reason for this block.\n\nFor your trip history, email us: we will send it back to you as a PDF.\n\nRegarding the length of the block, Rafai Limousine will let you know whether it is temporary or permanent.\n\nRafai Limousine',
            htmlBody: '<div style="font-family:Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111113">' +
              '<div style="color:#B8904F;letter-spacing:.2em;font-weight:800;font-size:13px">RAFAI LIMOUSINE · TEAM</div>' +
              '<h1 style="font-size:20px;margin:18px 0 8px">Hello ' + esc_(d.fname || '') + ',</h1>' +
              '<p style="line-height:1.5;font-size:16px"><b>You have been blocked by Rafai Limousine Team.</b><br>You no longer have access to the RL Driver app.</p>' +
              '<p style="line-height:1.5">Please email us at <a href="mailto:' + TEAM_EMAIL + '" style="color:#B8904F">' + TEAM_EMAIL + '</a> to find out the reason for this block.</p>' +
              '<p style="line-height:1.5">For your trip history, email us: we will send it back to you as a PDF.</p>' +
              '<p style="line-height:1.5">Regarding the length of the block, Rafai Limousine will let you know whether it is temporary or permanent.</p>' +
              '<p style="color:#8E8E93;font-size:12px;margin-top:22px">Rafai Limousine · ' + COMPANY_PHONE + '</p></div>' });
        } else {
          MailApp.sendEmail({ to: d.email, subject: 'Rafai Limousine Team · votre accès est bloqué', name: 'Rafai Limousine', replyTo: TEAM_EMAIL,
            body: 'Bonjour ' + (d.fname || '') + ',\n\nVous êtes bloqué par Rafai Limousine Team. Vous n’avez plus accès à l’application RL Driver.\n\nMerci de nous envoyer un e-mail à ' + TEAM_EMAIL + ' pour connaître la raison de ce blocage.\n\nPour votre historique de courses, envoyez-nous un e-mail : nous vous le renverrons en PDF.\n\nConcernant la durée du blocage, Rafai Limousine vous informera s’il est temporaire ou définitif.\n\nRafai Limousine',
            htmlBody: '<div style="font-family:Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111113">' +
              '<div style="color:#B8904F;letter-spacing:.2em;font-weight:800;font-size:13px">RAFAI LIMOUSINE · TEAM</div>' +
              '<h1 style="font-size:20px;margin:18px 0 8px">Bonjour ' + esc_(d.fname || '') + ',</h1>' +
              '<p style="line-height:1.5;font-size:16px"><b>Vous êtes bloqué par Rafai Limousine Team.</b><br>Vous n’avez plus accès à l’application RL Driver.</p>' +
              '<p style="line-height:1.5">Merci de nous envoyer un e-mail à <a href="mailto:' + TEAM_EMAIL + '" style="color:#B8904F">' + TEAM_EMAIL + '</a> pour connaître la raison de ce blocage.</p>' +
              '<p style="line-height:1.5">Pour votre historique de courses, envoyez-nous un e-mail : nous vous le renverrons en PDF.</p>' +
              '<p style="line-height:1.5">Concernant la durée du blocage, Rafai Limousine vous informera s’il est temporaire ou définitif.</p>' +
              '<p style="color:#8E8E93;font-size:12px;margin-top:22px">Rafai Limousine · ' + COMPANY_PHONE + '</p></div>' });
        }
        mailed = true;
      } catch (e) {}
    }
    var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
    up = listBookings_(book_()).filter(function (x) { return x.driverId === id && x.status !== 'Annulée' && x.status !== 'Terminée' && (!x.date || x.date >= today); }).map(function (x) { return x.ref; });
  } else {
    sh.getRange(row, cA).setValue('Oui'); sh.getRange(row, cB).setValue('');
  }
  log_('', on ? 'Chauffeur bloqué' : 'Chauffeur débloqué', drvName_(d) + ' · ' + d.email + (on ? (mailed ? ' · e-mail envoyé' : ' · e-mail non envoyé') + (up.length ? ' · courses à venir : ' + up.join(', ') : '') : ''), me);
  return { drivers: listDrivers_(), mailed: mailed, up: up };
}
function watchMailDriver_(bk, drv, iss, n, nowMs) {
  var docs = bk.driverId ? drvAppUrl_(bk.driverId) + '#m=' + encodeURIComponent(bk.ref) : '', hm = Utilities.formatDate(new Date(nowMs), TZ, 'HH:mm');
  var en = drvLang_(bk.driverId || (drv && drv.id)) === 'en', t = function (f, g) { return en ? g : f; };
  var lines = iss.map(function (x) {
    if (x.k === 'enroute') return en ? 'Tap <b>“Start trip”</b> now: pick-up at <b>' + esc_(bk.time) + '</b>.' : 'Appuyez maintenant sur <b>« Start trip »</b> : prise en charge à <b>' + esc_(bk.time) + '</b>.';
    if (x.k === 'onsite') return en ? 'It is ' + hm + ', pick-up is at <b>' + esc_(bk.time) + '</b> and you have not tapped <b>“On site”</b>.' : 'Il est ' + hm + ', la prise en charge est à <b>' + esc_(bk.time) + '</b> et vous n’avez pas appuyé sur <b>« On site »</b>.';
    if (x.k === 'gps') return en ? 'Your location has not been sent for <b>' + x.min + ' min</b>: the mission page is closed or the screen is off.' : 'Votre position n’est plus transmise depuis <b>' + x.min + ' min</b> : la page de mission est fermée ou l’écran est éteint.';
    return en ? 'The trip should be over: tap <b>“Final stop”</b>.' : 'La course devrait être terminée : appuyez sur <b>« Final stop »</b>.';
  });
  var client = ((bk.fname || '') + ' ' + (bk.lname || '')).trim();
  var body =
    '<tr><td style="padding:26px 28px 6px"><div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#B42318;font-weight:800">' + t('Suivi non respecté · relance ', 'Tracking not followed · reminder ') + n + '</div>' +
    '<div style="font-size:24px;line-height:1.25;font-weight:800;color:' + C.ink + ';margin:8px 0 6px">' + esc_(bk.ref) + (bk.time ? ' · ' + esc_(bk.time) : '') + '</div>' +
    '<div style="font-size:15px;color:#2A2A2E;line-height:1.6">' + t('Bonjour ', 'Hello ') + esc_(drv.fname || '') + ',<br>' + lines.join('<br>') + '</div></td></tr>' +
    '<tr><td style="padding:14px 28px 0"><div style="background:#FFF8F7;border:1px solid #F1C9C4;border-radius:12px;padding:14px 16px;font-size:15px;color:' + C.ink + ';line-height:1.55">' +
    t('<b>Ouvrez votre mission maintenant</b> et faites les étapes : Start trip → On site → On board → Final stop. Gardez la page ouverte, écran allumé.<br><br>', '<b>Open your mission now</b> and do the steps: Start trip → On site → On board → Final stop. Keep the page open and the screen on.<br><br>') +
    '<b style="color:#B42318">' + t('Tant que ce n’est pas fait, vous recevez une relance toutes les ' + WATCH.every + ' minutes et l’équipe Rafai Limousine est prévenue.', 'Until this is done, you will get a reminder every ' + WATCH.every + ' minutes and the Rafai Limousine team is notified.') + '</b></div></td></tr>' +
    '<tr><td style="padding:16px 28px 0">' + (docs ? btn_(docs, t('Ouvrir ma mission dans l’appli', 'Open my mission in the app'), true) : '') + btn_('tel:+33667099494', t('Appeler le référent', 'Call the supervisor'), false) + '</td></tr>' +
    section_(t('Course', 'Trip'), row_(t('Prise en charge', 'Pick-up'), '<b>' + esc_(en ? rlEnDate_(bk.date) : frDate_(bk.date)) + (bk.time ? ' · ' + esc_(bk.time) : '') + '</b>') + row_(t('Lieu', 'Place'), esc_(bk.from)) + row_('Client', esc_(client)));
  var m = mailOpts_(shell_(esc_(bk.ref), body, 'Rafai Limousine · ' + COMPANY_PHONE + ' · ' + TEAM_EMAIL));
  var text = en ?
    'Hello ' + (drv.fname || '') + ',\n' + lines.join('\n').replace(/<[^>]+>/g, '') +
    '\nOpen your mission now and do the steps. Reminder every ' + WATCH.every + ' minutes, the team is notified.' + (docs ? '\nOpen my mission in the Rafai Limousine Driver app: ' + docs : '')
    : 'Bonjour ' + (drv.fname || '') + ',\n' + lines.join('\n').replace(/<[^>]+>/g, '') +
    '\nOuvrez votre mission maintenant et faites les étapes. Relance toutes les ' + WATCH.every + ' minutes, l’équipe est prévenue.' + (docs ? '\nOuvrir ma mission dans l’appli Rafai Limousine Driver : ' + docs : '');
  sendMail_(drv.email, 'Action required – ' + enWhen_(bk), text, m.o);
}
function gpsSend_(p, me) {
  var d = driverById_(String(p.id || ''));
  if (!d) throw new Error('Chauffeur introuvable');
  if (!validEmail_(d.email)) throw new Error('L’e-mail de ' + d.fname + ' est invalide');
  var url = gpsSetupUrl_(d.id);
  var en = drvLang_(d.id) === 'en', t = function (f, g) { return en ? g : f; };
  var body = '<tr><td style="padding:26px 28px 6px"><div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:' + C.gold + ';font-weight:800">' + t('GPS en arrière-plan', 'Background GPS') + '</div>' +
    '<div style="font-size:15px;color:#2A2A2E;line-height:1.6;margin-top:10px">' + t('Bonjour ', 'Hello ') + esc_(d.fname || '') + ',<br>' +
    t('Pour que votre position continue d’être transmise quand vous utilisez Waze, installez l’application gratuite <b>Overland GPS Tracker</b> sur votre iPhone, puis ouvrez le lien ci-dessous <b>depuis votre iPhone</b> : il configure l’application en une touche.',
      'To keep sending your location while you use Waze, install the free <b>Overland GPS Tracker</b> app on your iPhone, then open the link below <b>from your iPhone</b>: it sets up the app in one tap.') + '</div></td></tr>' +
    '<tr><td style="padding:16px 28px 0">' + btn_(OVERLAND_STORE, t('Installer Overland', 'Install Overland'), false) + btn_(url, t('Configurer mon GPS', 'Set up my GPS'), true) + '</td></tr>' +
    '<tr><td style="padding:8px 28px 0;font-size:14px;color:#2A2A2E;line-height:1.6">' +
    t('Ensuite : autorisez la localisation <b>« Toujours »</b>, allumez le suivi dans Overland et laissez-le allumé. Il passe tout seul en mode précis pendant vos courses et en économie de batterie le reste du temps. Gardez votre page de mission pour les boutons Start trip, On site, On board et Final stop.',
      'Then: allow location <b>“Always”</b>, turn on tracking in Overland and leave it on. It switches to precise mode by itself during your trips and to battery saving the rest of the time. Keep your mission page for the Start trip, On site, On board and Final stop buttons.') + '</td></tr>' +
    '<tr><td style="padding:12px 28px 0;font-size:13px;color:' + C.muted + ';line-height:1.6">' +
    t('Votre position n’est utilisée que pendant vos courses en cours, de Start trip à Final stop. En dehors, rien n’est enregistré.', 'Your location is only used during your trips in progress, from Start trip to Final stop. Nothing is recorded outside of that.') + '</td></tr>';
  var m = mailOpts_(shell_('GPS', body, 'Rafai Limousine · ' + COMPANY_PHONE));
  sendMail_(d.email, 'GPS setup – Overland', en ? 'Hello ' + (d.fname || '') + ', install Overland GPS Tracker (' + OVERLAND_STORE + ') then open this link from your iPhone: ' + url
    : 'Bonjour ' + (d.fname || '') + ', installez Overland GPS Tracker (' + OVERLAND_STORE + ') puis ouvrez ce lien depuis votre iPhone : ' + url, m.o);
  log_('', 'GPS Overland', 'Configuration envoyée à ' + drvName_(d) + ' (' + d.email + ')', me);
  return gpsInfo_(p);
}
