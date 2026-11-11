/* ---------- rlPromo v1 : -10 % sur la première course (11 nov. 2026, demande de Yassine) ----------
 * Ajouté à la fin de Code.gs (projet Apps Script « Espace équipe Rafai Limousine »).
 * 1. Fenêtre du site (rl-site.js) : prénom, nom, e-mail, téléphone → POST ?app=cpjoin
 *    → ligne dans la feuille « Codes promo » + e-mail « Validez votre adresse » (lien vers le site avec ?rlpromo=jeton).
 * 2. Le client clique sur le lien → le site appelle ?app=cpok&t=jeton → adresse validée, code unique RL10-XXXXX créé,
 *    affiché sur le site et envoyé par e-mail (bouton « Réserver avec -10 % » : réservation avec le code déjà rempli).
 * 3. Devis (cquote) : cliPromo_ accepte les codes RL10-XXXXX validés et pas encore utilisés → -10 %.
 *    Réservation (cbook) : le code est marqué utilisé (date + référence de la course). Un code ne sert qu'une fois.
 * Offre réservée aux nouveaux clients : refusée si l'e-mail ou le téléphone a déjà une course (hors annulées).
 * Adresse validée : le client est ajouté à la liste « Clients » de l'espace équipe (son espace client retrouve la fiche par l'e-mail).
 * Autres changements dans Code.gs : routes cpjoin (POST) et cpok (GET), pourcentage renvoyé dans out.promo.pct,
 * note de la course « Code … : -10 % (prix normal …) », promoUse_ après la réservation. */
var PROMO_SH = 'Codes promo', PROMO_PCT = 0.10, PROMO_SITE = 'https://www.rafai-limousine.com/', PROMO_BOOK = 'https://booking.rafai-limousine.com/';
var PROMO_HEAD = ['Inscrit le', 'Prénom', 'Nom', 'E-mail', 'Téléphone', 'Langue', 'Offres par e-mail', 'E-mail validé le', 'Code', 'Utilisé le', 'Réf. course', 'Page', 'Jeton'];
var PROMO_TX = {
  fr: {
    vs: 'Validez votre adresse pour recevoir votre code -10 %', vh: 'Plus qu’une étape',
    vp: 'Merci pour votre inscription. Cliquez sur le bouton pour valider votre adresse e-mail : votre code de réduction de 10 % sur votre première course s’affichera aussitôt.',
    vb: 'Valider mon adresse e-mail', vn: 'Si vous n’êtes pas à l’origine de cette demande, ignorez simplement cet e-mail.',
    cs: 'Votre code -10 % Rafai Limousine : ', ch: 'Votre adresse est validée',
    cp: 'Voici votre code personnel de réduction de 10 % sur votre première course :',
    ci: 'Saisissez-le à la première étape de la réservation (« J’ai un code promo »), ou cliquez sur le bouton : il est déjà rempli.',
    cb: 'Réserver avec -10 %', cn: 'Code valable une seule fois, réservé aux nouveaux clients.',
    hi: 'Bonjour', sig: 'Yassine Rafaï – Rafai Limousine'
  },
  en: {
    vs: 'Confirm your e-mail to get your 10% off code', vh: 'One last step',
    vp: 'Thank you for signing up. Click the button to confirm your e-mail address: your 10% off code for your first ride will appear right away.',
    vb: 'Confirm my e-mail address', vn: 'If you did not request this, you can simply ignore this e-mail.',
    cs: 'Your Rafai Limousine 10% off code: ', ch: 'Your e-mail is confirmed',
    cp: 'Here is your personal code for 10% off your first ride:',
    ci: 'Enter it on the first step of the booking (“I have a promo code”), or click the button: it is already filled in.',
    cb: 'Book with 10% off', cn: 'Single-use code, for new customers only.',
    hi: 'Hello', sig: 'Yassine Rafaï – Rafai Limousine'
  }
};
function promoSheet_() {
  var s = ss_(), sh = s.getSheetByName(PROMO_SH);
  if (!sh) {
    sh = s.insertSheet(PROMO_SH);
    sh.getRange(1, 1, 1, PROMO_HEAD.length).setValues([PROMO_HEAD]);
    styleHead_(sh.getRange(1, 1, 1, PROMO_HEAD.length));
    sh.setFrozenRows(1);
    sh.hideColumns(PROMO_HEAD.length);
  }
  return sh;
}
function promoRows_() {
  var sh = promoSheet_(), n = sh.getLastRow() - 1;
  return { sh: sh, v: n > 0 ? sh.getRange(2, 1, n, PROMO_HEAD.length).getDisplayValues() : [] };
}
function promoTel_(t) { var d = String(t || '').replace(/\D/g, ''); return d.length >= 9 ? d.slice(-9) : ''; }
function promoMailBox_(lg, inner) {
  return '<div style="font-family:Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111113">' +
    '<div style="text-align:center;margin-bottom:18px"><img src="' + PROMO_SITE + 'img/logo.png" alt="Rafai Limousine" width="64" height="64" style="border-radius:14px"></div>' +
    inner + '<p style="margin:26px 0 0;font-size:13px;color:#6B6B72">' + esc_(PROMO_TX[lg].sig) + '<br><a href="' + PROMO_SITE + '" style="color:#B8904F">www.rafai-limousine.com</a> · +33 6 67 09 94 94</p></div>';
}
function promoBtn_(href, label) {
  return '<p style="margin:22px 0;text-align:center"><a href="' + esc_(href) + '" style="display:inline-block;padding:14px 26px;border-radius:12px;background:#C9A063;color:#111113;font-weight:800;text-decoration:none">' + esc_(label) + '</a></p>';
}
function promoMailVerify_(e, fn, lg, tok) {
  var t = PROMO_TX[lg], link = PROMO_SITE + (lg === 'fr' ? 'fr' : '') + '?rlpromo=' + tok;
  MailApp.sendEmail({ to: e, subject: t.vs, name: 'Rafai Limousine', replyTo: TEAM_EMAIL,
    body: t.hi + ' ' + fn + ',\n\n' + t.vp + '\n\n' + t.vb + ' : ' + link + '\n\n' + t.vn + '\n\n' + t.sig,
    htmlBody: promoMailBox_(lg, '<h1 style="font-size:20px;margin:0 0 10px">' + esc_(t.hi + ' ' + fn) + ',</h1>' +
      '<p style="margin:0 0 6px;font-size:15px;line-height:1.5"><b>' + esc_(t.vh) + '.</b> ' + esc_(t.vp) + '</p>' + promoBtn_(link, t.vb) +
      '<p style="margin:0;font-size:12px;color:#8A8A90">' + esc_(t.vn) + '</p>') });
}
function promoMailCode_(e, fn, lg, code) {
  var t = PROMO_TX[lg], link = PROMO_BOOK + '?promo=' + code;
  MailApp.sendEmail({ to: e, subject: t.cs + code, name: 'Rafai Limousine', replyTo: TEAM_EMAIL,
    body: t.hi + ' ' + fn + ',\n\n' + t.ch + '. ' + t.cp + '\n\n' + code + '\n\n' + t.ci + '\n' + link + '\n\n' + t.cn + '\n\n' + t.sig,
    htmlBody: promoMailBox_(lg, '<h1 style="font-size:20px;margin:0 0 10px">' + esc_(t.hi + ' ' + fn) + ',</h1>' +
      '<p style="margin:0 0 14px;font-size:15px;line-height:1.5"><b>' + esc_(t.ch) + '.</b> ' + esc_(t.cp) + '</p>' +
      '<div style="margin:0 auto;max-width:300px;padding:16px;border:2px dashed #C9A063;border-radius:14px;text-align:center;font-size:28px;font-weight:800;letter-spacing:.12em">' + esc_(code) + '</div>' +
      '<p style="margin:16px 0 0;font-size:14px;line-height:1.5">' + esc_(t.ci) + '</p>' + promoBtn_(link, t.cb) +
      '<p style="margin:0;font-size:12px;color:#8A8A90">' + esc_(t.cn) + '</p>') });
}
/* nouveaux clients seulement : aucune course (hors annulées et messages) avec cet e-mail ou ce téléphone */
function promoOld_(e, t9) {
  return listBookings_(book_()).some(function (b) {
    if (b.status === 'Message' || /annul/i.test(String(b.status || ''))) return false;
    return String(b.email || '').trim().toLowerCase() === e || (t9 && promoTel_(b.tel) === t9);
  });
}
function cliPromoJoin_(body) {
  var x = {}; try { x = JSON.parse(body || '{}') || {}; } catch (z) { x = {}; }
  function s(k, n) { return String(x[k] == null ? '' : x[k]).replace(/[\r\n<>]+/g, ' ').trim().slice(0, n || 80); }
  if (s('hp')) return { ok: true };
  var e = cliMail_(x.e), fn = s('fn'), ln = s('ln'), tel = s('tel', 30).replace(/[^\d+ ().-]/g, ''), t9 = promoTel_(tel), lg = x.lang === 'fr' ? 'fr' : 'en';
  var miss = [];
  if (!fn) miss.push('fn'); if (!ln) miss.push('ln'); if (!e) miss.push('e'); if (!t9) miss.push('tel');
  if (miss.length) return { ok: false, err: 'champs', fields: miss };
  var c = CacheService.getScriptCache(), h = cliHash_(e), n = Number(c.get('pj:' + h)) || 0;
  if (n >= 3 || !cliQuota_('pjoin', 300) || !cliQuota_('mail', 300)) return { ok: false, err: 'quota' };
  c.put('pj:' + h, String(n + 1), 3600);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (promoOld_(e, t9)) return { ok: false, err: 'client' };
    var P = promoRows_(), row = -1;
    for (var i = 0; i < P.v.length; i++) {
      if (String(P.v[i][3]).toLowerCase() === e) { row = i; break; }
    }
    if (row < 0) for (var j = 0; j < P.v.length; j++) {
      if (t9 && promoTel_(P.v[j][4]) === t9 && P.v[j][8]) return { ok: false, err: 'deja' };
    }
    if (row >= 0 && P.v[row][8]) {
      /* déjà validé : on renvoie le code (s'il n'est pas utilisé) */
      if (P.v[row][9]) return { ok: false, err: 'utilise' };
      promoMailCode_(e, P.v[row][1] || fn, lg, P.v[row][8]);
      return { ok: true, sent: 'code' };
    }
    var tok = row >= 0 ? P.v[row][12] : Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
    if (row < 0) P.sh.appendRow([cell_(now_()), cell_(fn), cell_(ln), e, cell_(tel), lg === 'fr' ? 'Français' : 'Anglais', x.opt ? 'Oui' : 'Non', '', '', '', '', cell_(s('src', 120)), tok]);
    promoMailVerify_(e, fn, lg, tok);
    return { ok: true, sent: 'verify' };
  } finally { lock.releaseLock(); }
}
function cliPromoOk_(q) {
  var tok = String(q.t || '').replace(/[^a-f0-9]/gi, '').slice(0, 40);
  if (tok.length < 32) return { ok: false, err: 'jeton' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var P = promoRows_(), row = -1, used = {};
    for (var i = 0; i < P.v.length; i++) { if (P.v[i][8]) used[P.v[i][8]] = 1; if (P.v[i][12] === tok) row = i; }
    if (row < 0) return { ok: false, err: 'jeton' };
    var r = P.v[row], lg = r[5] === 'Français' ? 'fr' : 'en', code = r[8];
    if (!code) {
      var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      do { code = 'RL10-'; for (var k = 0; k < 5; k++) code += A.charAt(Math.floor(Math.random() * A.length)); } while (used[code]);
      P.sh.getRange(row + 2, 8, 1, 2).setValues([[cell_(now_()), code]]);
      try { promoMailCode_(r[3], r[1], lg, code); } catch (z) {}
      try { promoClient_(r, lg, code); } catch (z) {}
    }
    return { ok: true, code: code, fn: r[1], used: !!r[9], pct: Math.round(PROMO_PCT * 100) };
  } finally { lock.releaseLock(); }
}
/* adresse validée : le client est ajouté à la liste « Clients » de l'espace équipe (comme syncClients_) ;
   s'il y est déjà (même e-mail ou téléphone), son code est noté dans ses remarques. Son espace client (appli, réservation)
   retrouve la fiche par l'e-mail : prénom, nom et téléphone déjà remplis. */
function promoClient_(r, lg, code) {
  var sh = cliSheet_(), list = listClients_(), c = { fname: r[1], lname: r[2], tel: r[4], email: String(r[3]).toLowerCase() }, keys = cliKeys_(c);
  var note = 'Code -10 % première course : ' + code + ' (inscrit sur le site, e-mail validé le ' + now_() + ')';
  for (var i = 0; i < list.length; i++) {
    if (cliKeys_(list[i]).some(function (k) { return keys.indexOf(k) >= 0; })) {
      var col = CLI_KEYS.indexOf('notes') + 1, old = String(list[i].notes || '');
      if (old.indexOf(code) < 0) sh.getRange(i + 2, col).setValue(cell_((old ? old + ' / ' : '') + note));
      return list[i].id;
    }
  }
  c.id = nextCliId_(list); c.company = ''; c.lang = lg === 'fr' ? 'Français' : 'Anglais'; c.notes = note; c.created = now_(); c.src = 'Site – code promo -10 %';
  sh.appendRow(CLI_KEYS.map(function (k) { return cell_(c[k] == null ? '' : c[k]); }));
  try { log_('', 'Client ajouté', (c.fname + ' ' + c.lname).trim() + ' · ' + (c.tel || c.email) + ' · code promo -10 %', 'Site'); } catch (z) {}
  return c.id;
}
/* devis : code RL10-XXXXX validé et pas encore utilisé → -10 % */
function promoCheck_(c) {
  var P = promoRows_();
  for (var i = 0; i < P.v.length; i++) if (P.v[i][8] === c) {
    if (P.v[i][9]) return { ok: false, code: c, why: 'used' };
    return { ok: true, code: c, pct: PROMO_PCT };
  }
  return { ok: false, code: c, why: 'code' };
}
/* réservation faite : le code est marqué utilisé (date + référence) */
function promoUse_(c, ref, email) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var P = promoRows_();
    for (var i = 0; i < P.v.length; i++) if (P.v[i][8] === c && !P.v[i][9]) {
      P.sh.getRange(i + 2, 10, 1, 2).setValues([[cell_(now_()), cell_(ref + (email && email !== String(P.v[i][3]).toLowerCase() ? ' (' + email + ')' : ''))]]);
      return true;
    }
    return false;
  } finally { lock.releaseLock(); }
}
