/* Copie de ce qui a été ajouté dans Code.gs (version 121, 20 nov. 2026, « Publie » de Yassine).
   saveBooking_ : juste avant « return { booking: clean_(nb), changed: true, ... } »
   Interface (APP_HTML, editForm) : case #rsc « Si la date, l'heure ou une adresse change : envoyer la confirmation au client »,
   cochée par défaut, envoyée comme notifyClient dans call('saveBooking', ...). Sans la case (appels API), rien n'est envoyé. */
  var tripKeys = ['date', 'time', 'from', 'stops', 'to'];
  if (p.notifyClient === true && tripKeys.some(function (k) { return set[k] !== undefined; }) && nb.driverId && validEmail_(nb.email) &&
      nb.status !== 'Annulée' && nb.status !== 'Terminée') {
    try {
      sendClientConfirm_(nb, drvFor_(nb, driverById_(nb.driverId) || { fname: nb.driver, email: nb.driverEmail }));
      setCells_(b, nb._row, { clientConfAt: now_() });
      sent.client = true;
      log_(bk.ref, 'Confirmation client', 'Modification (' + fieldsChanged.join(', ') + ') envoyée à ' + nb.email, me);
    } catch (e) { sent.clientError = String(e && e.message || e); }
  }
