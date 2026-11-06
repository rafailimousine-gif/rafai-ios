/* ---------- cloche de l'Espace équipe et alertes : nouvelles demandes, modifications et annulations des clients ----------
   Copie de ce qui a été ajouté dans Code.gs (projet « Espace équipe Rafai Limousine »).
   Feuille « Notifications » : une ligne par événement. Le « lu » est gardé par compte (NTF_SEEN_<e-mail>).

   Autres branchements dans Code.gs :
   - cliTeamMail_ : appelle teamAlertEvent_(b, title), donc modification et annulation par le client
   - teamAlertPush_ : ajoute chaque nouvelle demande à la cloche, même sans téléphone abonné
   - api() : case 'ntfRead', et ntf: ntfFeed_(me) dans 'bookings'
   - init_() : ntf: ntfFeed_(me)
   - stamp_() : tient compte du nombre de notifications pour rafraîchir la page
   - APP_HTML : bouton cloche, compteur et liste */
var SH_NTF = 'Notifications', NTF_MAX = 40, NTF_KEEP = 300;
function ntfSheet_() {
  var s = ss_(), sh = s.getSheetByName(SH_NTF);
  if (!sh) { sh = s.insertSheet(SH_NTF); sh.appendRow(['Horodatage', 'Référence', 'Titre', 'Détail']); sh.setFrozenRows(1); }
  return sh;
}
function ntfAdd_(ref, title, body) {
  try {
    var sh = ntfSheet_();
    sh.appendRow([Date.now(), cell_(ref), cell_(title), cell_(body)]);
    if (sh.getLastRow() > NTF_KEEP + 50) sh.deleteRows(2, 50);
  } catch (e) {}
}
function ntfSeenKey_(me) { return 'NTF_SEEN_' + String(me || '').toLowerCase(); }
function ntfFeed_(me) {
  try {
    var sh = ntfSheet_(), last = sh.getLastRow(), n = Math.min(NTF_MAX, last - 1), un = 0;
    if (n <= 0) return { n: 0, items: [] };
    var seen = Number(PropertiesService.getScriptProperties().getProperty(ntfSeenKey_(me))) || 0;
    var items = sh.getRange(last - n + 1, 1, n, 4).getValues().reverse().map(function (r) {
      var ms = Number(r[0]) || 0, isNew = ms > seen;
      if (isNew) un++;
      return { at: ms ? Utilities.formatDate(new Date(ms), TZ, 'dd/MM HH:mm') : '', ref: String(r[1]), title: String(r[2]), body: String(r[3]), un: isNew };
    });
    return { n: un, items: items };
  } catch (e) { return { n: 0, items: [] }; }
}
function ntfRead_(me) {
  PropertiesService.getScriptProperties().setProperty(ntfSeenKey_(me), String(Date.now()));
  return ntfFeed_(me);
}
/* Modification ou annulation par le client : cloche et notification sur le téléphone */
function teamAlertEvent_(bk, title) {
  try {
    var name = ((bk.fname || '') + ' ' + (bk.lname || '')).trim() || 'Client', when = (bk.date ? shortDate_(bk.date) : '') + (bk.time ? ' à ' + bk.time : '');
    var body = name + (when ? ' · ' + when : '');
    ntfAdd_(bk.ref, title, body);
    drvPush_('TEAM', { title: '🔔 ' + title + ' · ' + bk.ref, body: body, kind: 'team', url: TEAM_ALERT_OPEN }, { ref: bk.ref });
  } catch (e) {}
}
