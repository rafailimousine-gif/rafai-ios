/* ---------- « Envoyer la configuration » (fiche chauffeur, Espace équipe) ----------
   Remplace l'ancien e-mail Overland (Yassine, 20 nov. 2026) : le chauffeur reçoit les étapes de l'appli RL Driver
   (installation, connexion e-mail puis Face ID, notifications, localisation « Toujours », vérification par le petit bonhomme).
   Langue : français si le chauffeur utilise l'appli en français, anglais s'il l'utilise en anglais, sinon les deux. */
function gpsSend_(p, me) {
  var d = driverById_(String(p.id || ''));
  if (!d) throw new Error('Chauffeur introuvable');
  if (!validEmail_(d.email)) throw new Error('L’e-mail de ' + d.fname + ' est invalide');
  var store = 'https://apps.apple.com/fr/app/rl-driver/id6829409890';
  var pl = ''; try { pl = PropertiesService.getScriptProperties().getProperty('DRV_LANG_' + d.id) || ''; } catch (e) {}
  var langs = pl === 'fr' ? ['fr'] : pl === 'en' ? ['en'] : ['fr', 'en'];
  var T = {
    fr: { k: 'Appli RL Driver', hi: 'Bonjour ', btn: 'Installer RL Driver',
      intro: 'Vos missions, les statuts de course et le GPS passent par l’appli <b>RL Driver</b>. Voici comment la configurer :',
      steps: [
        'Installez l’appli <b>RL Driver</b> sur votre iPhone (bouton ci-dessous).',
        'Ouvrez-la et connectez-vous avec votre adresse e-mail <b>' + esc_(d.email) + '</b>. La première fois, saisissez le code à 6 chiffres reçu par e-mail.',
        'Activez <b>Face ID</b> quand l’appli vous le propose : ensuite, plus besoin de code, Face ID suffit.',
        'Autorisez les <b>notifications</b> : vous êtes prévenu de chaque course confiée, modifiée ou annulée.',
        'Autorisez la <b>localisation</b> et choisissez <b>« Toujours »</b> : votre position est partagée avec le client et l’équipe pendant vos courses, même quand vous êtes sur Waze.',
        'Vérifiez : touchez le <b>petit bonhomme</b> dans l’appli, puis <b>Réglages</b>. Les notifications et la localisation doivent être activées.'
      ] },
    en: { k: 'RL Driver app', hi: 'Hello ', btn: 'Install RL Driver',
      intro: 'Your missions, trip statuses and GPS go through the <b>RL Driver</b> app. Here is how to set it up:',
      steps: [
        'Install the <b>RL Driver</b> app on your iPhone (button below).',
        'Open it and sign in with your email address <b>' + esc_(d.email) + '</b>. The first time, enter the 6-digit code you receive by email.',
        'Turn on <b>Face ID</b> when the app offers it: after that, no code needed, Face ID is enough.',
        'Allow <b>notifications</b>: you are told about every trip assigned, changed or cancelled.',
        'Allow <b>location</b> and choose <b>“Always”</b>: your position is shared with the client and the team during your trips, even while you use Waze.',
        'Check it: tap the <b>little person icon</b> in the app, then <b>Settings</b>. Notifications and location must be turned on.'
      ] }
  };
  function block(L, first) {
    var x = T[L];
    var list = x.steps.map(function (s, i) {
      return '<tr><td style="padding:6px 10px 6px 0;vertical-align:top;width:26px"><div style="width:24px;height:24px;border-radius:12px;background:' + C.gold +
        ';color:#ffffff;font-size:13px;font-weight:800;text-align:center;line-height:24px">' + (i + 1) + '</div></td>' +
        '<td style="padding:6px 0;font-size:15px;color:#2A2A2E;line-height:1.55">' + s + '</td></tr>';
    }).join('');
    return '<tr><td style="padding:' + (first ? '26' : '30') + 'px 28px 6px"><div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:' + C.gold + ';font-weight:800">' + x.k + '</div>' +
      '<div style="font-size:15px;color:#2A2A2E;line-height:1.6;margin-top:10px">' + x.hi + esc_(d.fname || '') + ',<br>' + x.intro + '</div></td></tr>' +
      '<tr><td style="padding:10px 28px 0"><table role="presentation" cellpadding="0" cellspacing="0" width="100%">' + list + '</table></td></tr>' +
      '<tr><td style="padding:16px 28px 0">' + btn_(store, x.btn, true) + '</td></tr>';
  }
  var body = langs.map(function (L, i) { return block(L, i === 0); }).join('');
  var m = mailOpts_(shell_('RL Driver', body, 'Rafai Limousine · ' + COMPANY_PHONE));
  var text = langs.map(function (L) {
    var x = T[L];
    return x.hi + (d.fname || '') + ',\n' + x.intro.replace(/<[^>]+>/g, '') + '\n' +
      x.steps.map(function (s, i) { return (i + 1) + '. ' + s.replace(/<[^>]+>/g, ''); }).join('\n') + '\n' + store;
  }).join('\n\n');
  var subj = langs.length === 1 && langs[0] === 'en' ? 'RL Driver app setup' : 'Configuration de l’appli RL Driver';
  sendMail_(d.email, subj, text, m.o);
  log_('', 'Configuration RL Driver', 'Étapes de l’appli envoyées à ' + drvName_(d) + ' (' + d.email + ')', me);
  return gpsInfo_(p);
}
