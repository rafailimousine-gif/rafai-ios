/* ---------- rlDrvLogin v1 : RL Driver, connexion par code e-mail ----------
 * Le chauffeur tape son e-mail. S'il est dans la feuille « Chauffeurs » (et pas « Actif : Non »),
 * il reçoit un code à 6 chiffres valable 15 minutes. La réponse est la même dans tous les cas,
 * pour ne pas révéler quelles adresses sont enregistrées.
 * Le code validé renvoie le lien personnel habituel (ID.clé) : rien ne change pour le reste de l'appli.
 * Compte de démonstration Apple : même code fixe que l'appli client (propriété DEMO_CODE), aucun e-mail.
 * Routes (dans drvAppRoute_) : ?app=drvlogin&e=… et ?app=drvverify&e=…&code=…
 */
function drvMail_(s) {
  s = String(s || '').trim().toLowerCase();
  return s.length < 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? s : '';
}
function drvByMail_(e) {
  var l = listDrivers_();
  for (var i = 0; i < l.length; i++) {
    if (String(l[i].email || '').trim().toLowerCase() === e && l[i].active !== 'Non') return l[i];
  }
  return null;
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
    MailApp.sendEmail({ to: e, subject: 'RL Driver · votre code de connexion : ' + code, name: 'Rafai Limousine', replyTo: TEAM_EMAIL,
      htmlBody: '<div style="font-family:Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111113">' +
        '<div style="color:#B8904F;letter-spacing:.2em;font-weight:800;font-size:13px">RAFAI LIMOUSINE · RL DRIVER</div>' +
        '<h1 style="font-size:20px;margin:18px 0 8px">Bonjour ' + esc_(d.fname || '') + ', voici votre code</h1>' +
        '<div style="font-size:34px;font-weight:800;letter-spacing:.3em;background:#FBF7EF;border:1px solid #EADCC2;border-radius:12px;padding:14px 18px;text-align:center;margin:14px 0">' + code + '</div>' +
        '<p style="color:#55555C;line-height:1.5">Tapez ce code dans l’appli RL Driver pour voir vos missions. Il est valable 15 minutes.</p>' +
        '<p style="color:#8E8E93;font-size:12px">Vous n’avez rien demandé ? Ignorez cet e-mail et prévenez Rafai Limousine au ' + COMPANY_PHONE + '.</p></div>' });
  }
  return drvAppOut_({ ok: true });
}
function drvVerify_(q) {
  var e = drvMail_(q.e), code = String(q.code || '').replace(/\D/g, '');
  if (!e || code.length !== 6) return drvAppOut_({ ok: false, err: 'code' });
  var c = CacheService.getScriptCache(), h = cliHash_('drv|' + e);
  if (e === DEMO_MAIL && demoCode_()) {
    var dn = Number(c.get('ddemo:try')) || 0;
    if (dn >= 20 || code !== demoCode_()) { c.put('ddemo:try', String(dn + 1), 900); return drvAppOut_({ ok: false, err: 'code' }); }
  } else {
    var a = Number(c.get('dla:' + h)) || 0, want = c.get('dlc:' + h);
    if (!want || a >= 5) return drvAppOut_({ ok: false, err: 'expire' });
    if (code !== want) { c.put('dla:' + h, String(a + 1), 900); return drvAppOut_({ ok: false, err: 'code' }); }
    c.remove('dlc:' + h); c.remove('dla:' + h);
  }
  var d = drvByMail_(e);
  if (!d) return drvAppOut_({ ok: false, err: 'expire' });
  return drvAppOut_({ ok: true, auth: d.id + '.' + drvAppKey_(d.id), fname: d.fname || '' });
}

/* ---------- rlDrvHist v1 : RL Driver, historique des courses terminées du chauffeur (12 derniers mois) ----------
 * Route (dans drvAppRoute_) : ?app=drvhist&id=…&k=… (même clé que le lien personnel)
 */
function drvHist_(id, k) {
  try {
    if (!id || !k || k !== drvAppKey_(id)) return drvAppOut_({ ok: false, err: 'lien' });
    var drv = driverById_(id);
    if (!drv || drv.active === 'Non') return drvAppOut_({ ok: false, err: 'lien' });
    var now = Date.now(), out = [];
    listBookings_(book_()).forEach(function (b) {
      if (b.driverId !== id) return;
      if (!(b.status === 'Terminée' || b.trkStatus === 'Terminée')) return;
      var s = startDate_(b), t = s ? s.getTime() : 0;
      if (t && t < now - 366 * 864e5) return;
      out.push({ ref: b.ref, t: t, date: b.date, time: b.time, service: b.service, from: b.from, to: b.to,
        car: b.car, price: String(b.drvPrice || '') });
    });
    out.sort(function (a, b) { return b.t - a.t; });
    return drvAppOut_({ ok: true, list: out.slice(0, 300) });
  } catch (e) {
    return drvAppOut_({ ok: false, err: 'serveur' });
  }
}
