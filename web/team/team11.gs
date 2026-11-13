/* ---------- rlTeam11 (13 nov. 2026, demande de Yassine) ----------
 * 1) teamTrk_ : l'équipe fait une étape du suivi à la place du chauffeur (En route, Sur place, Passager à bord, Course terminée).
 *    Mêmes champs que RL Driver (trk_). p.notify = false : rien n'est envoyé au client.
 * 2) coNorm_ : type de client (Particulier / Entreprise), SIRET (14 chiffres) et n° de TVA de la saisie d'une course.
 * 3) MAIL_LOGO_URL : logo des e-mails hébergé (plus de pièce jointe « logo.jpg » à télécharger sur iPhone).
 *
 * Branchements dans Code.gs :
 * - api          : case 'teamTrk': return locked_(function () { return teamTrk_(p, me); });  (après case 'resetTrk')
 * - BOOK_COLS    : ctype: 'Type client', coName: 'Raison sociale', siret: 'SIRET', vatNo: 'N° TVA intracom.', billAddr: 'Adresse de facturation'
 * - ADMIN_KEYS et EDIT_KEYS : + 'ctype', 'coName', 'siret', 'vatNo', 'billAddr'
 * - createBooking_ : coNorm_(f) ; saveBooking_ : coNorm_(p.fields)
 * - shell_       : <img src="' + MAIL_LOGO_URL + '" … width="84" height="81">
 * - mailOpts_    : plus de o.inlineImages.logo */
function teamTrk_(p, me) {
  var b = book_(), bk = getBooking_(b, String(p.ref || '')), a = String(p.action || ''), notify = !(p.notify === false || p.notify === 'false');
  if (!bk.driverId) throw new Error('Assignez d’abord un chauffeur à cette course.');
  if (bk.status === 'Annulée') throw new Error('Cette course est annulée.');
  var st = bk.trkStatus || '', nowMs = Date.now(), set = {}, step = '', m;
  if (st === 'Terminée') throw new Error('Le suivi de cette course est déjà terminé.');
  var ord = { '': 0, 'En route': 1, 'Sur place': 2, 'En attente': 2, 'À bord': 3 }[st] || 0;
  var stopWait = function () { if (Number(bk.trkWaitStart)) { m = waitMin_(bk, nowMs); set.trkWait = (Number(bk.trkWait) || 0) + m; set.trkWaitStart = ''; } };
  if (a === 'enroute') {
    if (ord >= 1) throw new Error('Étape déjà faite (' + st + ').');
    set.trkStatus = 'En route'; set.trkEnRoute = now_(); step = 'En route';
  } else if (a === 'onsite') {
    if (ord >= 2) throw new Error('Étape déjà faite (' + st + ').');
    set.trkStatus = 'Sur place'; set.trkOnSite = now_(); step = 'Sur place';
  } else if (a === 'pob') {
    if (ord >= 3) throw new Error('Étape déjà faite (' + st + ').');
    stopWait(); if (!bk.trkOnSite) set.trkOnSite = now_();
    set.trkStatus = 'À bord'; set.trkPob = now_(); step = 'Passager à bord';
  } else if (a === 'end') {
    stopWait(); if (!bk.trkPob) set.trkPob = now_();
    set.trkStatus = 'Terminée'; set.trkEnd = now_(); set.status = 'Terminée'; step = 'Fin de course';
  } else throw new Error('Action inconnue');
  set.updated = now_();
  setCells_(b, bk._row, set);
  var nb = getBooking_(b, bk.ref);
  log_(bk.ref, 'Suivi : ' + step + ' (fait par l’équipe)', (bk.driver || '') + (notify ? '' : ' · client non prévenu'), me);
  if (notify) {
    try {
      if (a === 'enroute') {
        var r = clientEnRoute_(nb, drvFor_(nb, driverById_(nb.driverId) || { fname: String(nb.driver || '').split(' ')[0] }));
        setCells_(b, nb._row, { trkSms: r }); nb.trkSms = r;
        log_(bk.ref, 'Client prévenu (en route)', r, me);
      }
      cliPushSafe_(nb, a, drvFor_(nb, driverById_(nb.driverId)));
      if (a === 'end') reviewAfterEnd_(b, nb, me);
    } catch (e) { log_(bk.ref, 'Suivi : client non prévenu', String((e && e.message) || e), me); }
  }
  return { booking: clean_(getBooking_(b, bk.ref)) };
}
function coNorm_(f) {
  if (!f) return;
  if (f.ctype !== undefined && ['', 'Particulier', 'Entreprise'].indexOf(String(f.ctype)) < 0) f.ctype = '';
  if (f.siret !== undefined) {
    var s = String(f.siret || '').replace(/\D/g, '');
    if (s && s.length !== 14) throw new Error('SIRET : il faut 14 chiffres.');
    f.siret = s ? s.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, '$1 $2 $3 $4') : '';
  }
  if (f.vatNo !== undefined) f.vatNo = String(f.vatNo || '').replace(/[\s.\-]/g, '').toUpperCase();
}
var MAIL_LOGO_URL = 'https://equipe.rafai-limousine.com/logo.png';
