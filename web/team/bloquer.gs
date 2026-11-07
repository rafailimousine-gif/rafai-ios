/* ---------- rlBlock v1 : bloquer / débloquer l'accès d'un chauffeur ----------
 * Ajouté dans Code.gs (projet Apps Script « Espace équipe Rafai Limousine ») le 07/11/2026.
 * Bloquer = « Actif : Non » (plus de connexion RL Driver, plus d'assignation) + date dans « Bloqué le » + e-mail au chauffeur.
 * Débloquer = « Actif : Oui », sans e-mail.
 *
 * Autres changements dans Code.gs :
 *  - DRV_HEAD + 'Bloqué le' ; DRV_KEYS + 'blocked' (colonne N de la feuille « Chauffeurs »)
 *  - saveDriver_ : garde « Bloqué le » tant que le chauffeur reste inactif, l'efface s'il redevient actif
 *  - api() : case 'blockDriver'
 *  - APP_HTML (espace équipe) : bouton « ⛔ Bloquer » / « 🔓 Débloquer » sur chaque carte chauffeur,
 *    encadré « Bloquer l'accès » dans la fiche (confirmation avant envoi), badge « ⛔ Bloqué ».
 * L'API RL Driver (déploiement AKfycbwrVkg7…) n'a pas besoin de changer : elle refuse déjà « Actif : Non »
 * (connexion par code e-mail et appels avec le lien personnel → « Compte chauffeur inactif »).
 */
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
        MailApp.sendEmail({ to: d.email, subject: 'Rafai Limousine Team · votre accès est bloqué', name: 'Rafai Limousine', replyTo: TEAM_EMAIL,
          body: 'Bonjour ' + (d.fname || '') + ',\n\nVous êtes bloqué par Rafai Limousine Team.\nMerci de nous envoyer un e-mail à ' + TEAM_EMAIL + ' pour connaître la raison de ce blocage.\n\nRafai Limousine',
          htmlBody: '<div style="font-family:Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111113">' +
            '<div style="color:#B8904F;letter-spacing:.2em;font-weight:800;font-size:13px">RAFAI LIMOUSINE · TEAM</div>' +
            '<h1 style="font-size:20px;margin:18px 0 8px">Bonjour ' + esc_(d.fname || '') + ',</h1>' +
            '<p style="line-height:1.5;font-size:16px"><b>Vous êtes bloqué par Rafai Limousine Team.</b></p>' +
            '<p style="line-height:1.5">Merci de nous envoyer un e-mail à <a href="mailto:' + TEAM_EMAIL + '" style="color:#B8904F">' + TEAM_EMAIL + '</a> pour connaître la raison de ce blocage.</p>' +
            '<p style="color:#8E8E93;font-size:12px;margin-top:22px">Rafai Limousine · ' + COMPANY_PHONE + '</p></div>' });
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
