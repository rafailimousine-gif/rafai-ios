/* ---------- rlLang v1 : RL Driver en anglais par défaut, français au choix (« Mon compte » ou page de connexion) ----------
   - Le choix est gardé sur le téléphone (localStorage rl_lang) et envoyé au serveur avec chaque appel (&ul=en|fr),
     pour que les e-mails et notifications du chauffeur partent dans la même langue.
   - En anglais : les textes de la page sont traduits à l'affichage (dictionnaire + quelques modèles), les dates et
     les montants passent au format anglais. La logique de la page ne change pas (les statuts restent en français en interne).
   - Rien n'est traduit dans les zones marquées data-notr, les messages écrits, les notes et les champs de saisie. */
(function rlLang() {
  if (window.RLLang) return;
  var KEY = 'rl_lang', L = 'en';
  try { L = localStorage.getItem(KEY) === 'fr' ? 'fr' : 'en'; } catch (e) {}

  /* chaque appel au serveur (Apps Script) porte la langue choisie */
  try {
    var _f = window.fetch;
    if (_f) window.fetch = function (u, o) {
      try {
        if (typeof u === 'string' && u.indexOf('/macros/s/') > 0 && u.indexOf('ul=') < 0) u += (u.indexOf('?') < 0 ? '?' : '&') + 'ul=' + L;
      } catch (e) {}
      return _f.call(this, u, o);
    };
  } catch (e) {}

  function N(s) { return String(s == null ? '' : s).replace(/[   ]/g, ' ').replace(/'/g, '’').replace(/\s+/g, ' ').trim(); }

  var D = {}, P = [];
  function T(s) {
    var n = N(s); if (!n) return null;
    if (Object.prototype.hasOwnProperty.call(D, n)) return D[n];
    for (var i = 0; i < P.length; i++) { var m = n.match(P[i][0]); if (m) { var r = P[i][1](m); if (r != null) return r; } }
    return null;
  }

  window.RLLang = {
    lang: L,
    t: function (s) { if (L !== 'en') return s; var r = T(s); return r == null ? s : r; },
    set: function (v) {
      v = v === 'fr' ? 'fr' : 'en';
      try { localStorage.setItem(KEY, v); } catch (e) {}
      if (v !== L) { try { location.reload(); } catch (e) {} }
    }
  };
  if (L !== 'en') return;

  /* ---------- dates, heures et montants au format anglais ---------- */
  var EN = 'en-GB';
  function loc(l) { return typeof l === 'string' && /^fr(-FR)?$/i.test(l) ? EN : (Object.prototype.toString.call(l) === '[object Array]' ? l.map(loc) : l); }
  try {
    var DTF = Intl.DateTimeFormat;
    var DTF2 = function (l, o) { return new DTF(loc(l), o); };
    DTF2.prototype = DTF.prototype; DTF2.supportedLocalesOf = DTF.supportedLocalesOf;
    Intl.DateTimeFormat = DTF2;
  } catch (e) {}
  ['toLocaleDateString', 'toLocaleTimeString', 'toLocaleString'].forEach(function (k) {
    try { var o = Date.prototype[k]; Date.prototype[k] = function (l, opt) { return o.call(this, loc(l), opt); }; } catch (e) {}
  });
  try { var nl = Number.prototype.toLocaleString; Number.prototype.toLocaleString = function (l, opt) { return nl.call(this, loc(l), opt); }; } catch (e) {}
  ['confirm', 'alert'].forEach(function (k) {
    try { var o = window[k]; window[k] = function (m) { var r = T(m); return o.call(window, r == null ? m : r); }; } catch (e) {}
  });
  try { var op = window.prompt; window.prompt = function (m, d) { var r = T(m); return op.call(window, r == null ? m : r, d); }; } catch (e) {}

  /* ---------- dictionnaire (texte français exact → anglais) ---------- */
  var W = {
    /* statuts et jours */
    'En route': 'On the way', 'Sur place': 'On site', 'En attente': 'Waiting', 'À bord': 'On board',
    'Terminée': 'Completed', 'Terminées': 'Completed', 'terminée': 'completed', 'À confirmer': 'To be confirmed', 'À faire': 'To do',
    'Confirmée': 'Confirmed', 'Chauffeur assigné': 'Driver assigned', 'Annulée': 'Cancelled', 'Nouvelle': 'New', 'Modifiée': 'Updated',
    'En cours': 'In progress', 'À valider': 'To validate', 'À venir': 'Upcoming',
    'Aujourd’hui': 'Today', 'Demain': 'Tomorrow', 'Hier': 'Yesterday', 'Date à confirmer': 'Date to be confirmed', 'Sans date': 'No date',
    /* arrêts */
    'Arrêt ajouté': 'Stop added', 'Confirmer ?': 'Confirm?', 'Supprimer': 'Delete',
    '✓ Adresse vérifiée sur Google Maps': '✓ Address verified on Google Maps', 'Recherche sur Google Maps…': 'Searching Google Maps…',
    'Pas dans la liste ? Touchez encore « Ajouter » pour garder votre texte.': 'Not in the list? Tap “Add” again to keep your text.',
    'Suggestions Google Maps : touchez la bonne adresse.': 'Google Maps suggestions: tap the right address.',
    'Google Maps ne répond pas pour le moment.': 'Google Maps is not responding right now.',
    'Adresse introuvable sur Google Maps : vérifiez l’orthographe.': 'Address not found on Google Maps: check the spelling.',
    'Touchez encore « Ajouter » pour l’enregistrer telle quelle.': 'Tap “Add” again to save it as typed.',
    'Rechercher l’adresse (Google Maps)': 'Search for the address (Google Maps)',
    'Ajouter': 'Add', 'Annuler': 'Cancel', '＋ Ajouter un arrêt / une adresse': '＋ Add a stop / an address',
    'Indiquez l’adresse de l’arrêt.': 'Enter the stop address.', 'Choisissez l’adresse exacte dans la liste Google Maps.': 'Choose the exact address from the Google Maps list.',
    'Adresse introuvable sur Google Maps.': 'Address not found on Google Maps.', 'Google Maps ne répond pas.': 'Google Maps is not responding.',
    'Cet arrêt est déjà ajouté.': 'This stop has already been added.', 'Arrêt enregistré.': 'Stop saved.', 'Arrêt supprimé.': 'Stop removed.',
    /* fiche de course */
    'Prise en charge': 'Pick-up', 'Arrêt': 'Stop', 'Destination': 'Destination', 'Destination :': 'Destination:', 'Vol': 'Flight', 'Client :': 'Client:',
    'Infos client': 'Client info', 'Note de Rafai Limousine': 'Note from Rafai Limousine', 'Votre prix :': 'Your price:',
    'Bon de mission': 'Mission order', 'Pancarte': 'Name sign', 'Message client': 'Message client',
    '✓ Valider ma course': '✓ Validate my trip', '📎 Ajouter ma facture': '📎 Add my invoice', '✓ Course validée': '✓ Trip validated',
    '✓ Course validée · facture payée': '✓ Trip validated · invoice paid', '✓ Course validée · validée par Rafai Limousine': '✓ Trip validated · approved by Rafai Limousine',
    '✓ Course validée · facture envoyée': '✓ Trip validated · invoice sent',
    'Chauffeur': 'Driver', 'Véhicule de la course': 'Vehicle for this trip', 'Véhicule': 'Vehicle',
    'Écrire à l’équipe': 'Message the team', 'Appeler l’équipe': 'Call the team',
    /* liste des missions */
    'Lien personnel requis': 'Personal link required', 'Bienvenue': 'Welcome',
    'Ouvrez le lien personnel envoyé par Rafai Limousine pour voir vos missions.': 'Open the personal link sent by Rafai Limousine to see your missions.',
    'Chargement de vos missions…': 'Loading your missions…', 'Aucune mission prévue': 'No missions scheduled',
    'Dès qu’une course vous est confiée, elle apparaît ici.': 'As soon as a trip is assigned to you, it will appear here.',
    'Compte inactif': 'Inactive account', 'Lien non valide': 'Invalid link', 'Compte chauffeur inactif': 'Driver account inactive',
    'Ce lien n’est plus valide': 'This link is no longer valid', 'Contactez Rafai Limousine pour recevoir votre lien personnel.': 'Contact Rafai Limousine to receive your personal link.',
    'Appeler Rafai Limousine': 'Call Rafai Limousine', 'Hors connexion': 'Offline', 'Pas de connexion': 'No connection',
    'Vérifiez le réseau, puis touchez la flèche en haut à droite.': 'Check your network, then tap the arrow at the top right.',
    'Impossible de joindre le serveur pour le moment. Réessayez dans un instant.': 'Cannot reach the server right now. Try again in a moment.',
    'Mise à jour…': 'Updating…',
    /* documents */
    'Ouverture du bon de mission…': 'Opening the mission order…', 'Partager le PDF': 'Share the PDF', 'Ouvrir le PDF': 'Open the PDF',
    'PDF à imprimer': 'Printable PDF', 'Préparation…': 'Preparing…', 'PDF indisponible pour le moment (connexion ?). Réessayez.': 'PDF unavailable right now (connection?). Try again.',
    'Fond noir': 'Black background', 'Fond blanc': 'White background', 'Tournez le téléphone pour agrandir': 'Turn your phone to enlarge',
    /* messagerie */
    'Votre équipe · messages et alertes': 'Your team · messages and alerts', 'Chargement des messages…': 'Loading messages…',
    'Connexion lente… nouvel essai automatique dans quelques secondes.': 'Slow connection… retrying automatically in a few seconds.',
    'Cette course ne vous est plus confiée.': 'This trip is no longer assigned to you.', 'Messagerie fermée pour cette course.': 'Messaging closed for this trip.',
    'Écrivez à l’équipe Rafai Limousine : réponse rapide.': 'Write to the Rafai Limousine team: quick reply.',
    'Aucun message du client pour l’instant. Vous pouvez lui écrire ici.': 'No message from the client yet. You can write to them here.',
    'Message non envoyé (connexion ?). Réessayez.': 'Message not sent (connection?). Try again.',
    'Nouveau message de Rafai Limousine.': 'New message from Rafai Limousine.', 'Lire le message': 'Read the message',
    'Messages Rafai Limousine': 'Rafai Limousine messages', 'Votre message…': 'Your message…',
    'Alerte Rafai Limousine': 'Rafai Limousine alert', 'Répondre': 'Reply', 'J’ai compris': 'Got it',
    /* installation */
    'Installez l’appli': 'Install the app', 'Une icône Rafai Limousine Driver sur votre écran d’accueil.': 'A Rafai Limousine Driver icon on your home screen.',
    'Touchez': 'Tap', 'Partager': 'Share', 'puis': 'then', ', puis': ', then', 'Sur l’écran d’accueil': 'Add to Home Screen',
    ': vous recevrez aussi les notifications de mission.': ': you will also receive mission notifications.', 'Fermer': 'Close', 'Installer': 'Install',
    'Pas encore installée ?': 'Not installed yet?', 'Pas encore installée ? (10 secondes)': 'Not installed yet? (10 seconds)',
    'Une icône sur votre écran d’accueil, et vos missions en notification.': 'An icon on your home screen, and your missions as notifications.',
    'Installer l’application': 'Install the app', 'Dans Safari, touchez': 'In Safari, tap', '(sur les iPhone récents : touchez d’abord': '(on recent iPhones: first tap',
    'à côté de l’adresse).': 'next to the address).', 'Faites défiler et choisissez': 'Scroll down and choose', 'Ouvrez l’icône': 'Open the icon',
    ': votre course s’y trouve.': ': your trip is there.',
    'Vous ne voyez pas « Sur l’écran d’accueil » ? Ouvrez d’abord ce lien dans Safari :': 'Can’t see “Add to Home Screen”? First open this link in Safari:',
    'copier le lien': 'copy the link', ', puis collez-le dans Safari.': ', then paste it into Safari.', 'Touchez le menu': 'Tap the menu',
    'de Chrome, en haut à droite.': 'in Chrome, at the top right.', 'Choisissez': 'Choose', '(ou « Ajouter à l’écran d’accueil »).': '(or “Add to Home screen”).',
    'Sur ordinateur ?': 'On a computer?', 'Ouvrez ce lien sur votre téléphone pour installer l’appli.': 'Open this link on your phone to install the app.',
    'lien copié ✓': 'link copied ✓', 'Copiez ce lien :': 'Copy this link:', 'Appli installée': 'App installed',
    'Ouvrez maintenant l’icône Rafai Limousine Driver sur votre écran d’accueil.': 'Now open the Rafai Limousine Driver icon on your home screen.',
    'Ouvrez l’appli Rafai Limousine Driver': 'Open the Rafai Limousine Driver app',
    'Votre course et son suivi se trouvent dans l’application installée sur votre téléphone.': 'Your trip and its tracking are in the app installed on your phone.',
    'Déjà installée ?': 'Already installed?', 'sur votre écran d’accueil.': 'on your home screen.', 'continuer dans le navigateur': 'continue in the browser',
    /* notifications */
    'Notifications de mission activées sur ce téléphone.': 'Mission notifications are on for this phone.',
    'Notifications bloquées : autorisez-les dans les réglages du téléphone pour être prévenu de chaque mission.': 'Notifications blocked: allow them in your phone settings to be notified of every mission.',
    'Soyez prévenu de chaque mission': 'Get notified of every mission',
    'Une notification dès qu’une course vous est confiée, modifiée ou annulée, même appli fermée.': 'A notification as soon as a trip is assigned, changed or cancelled, even with the app closed.',
    'Activer les notifications': 'Turn on notifications', 'Activation…': 'Turning on…',
    'Les notifications n’ont pas pu être enregistrées. Réessayez plus tard.': 'Notifications could not be saved. Try again later.',
    'Les notifications n’ont pas pu être activées sur ce téléphone.': 'Notifications could not be turned on for this phone.',
    'Notifications bloquées : autorisez-les dans Réglages › RL Driver › Notifications pour être prévenu de chaque mission.': 'Notifications blocked: allow them in Settings › RL Driver › Notifications to be notified of every mission.',
    'Ouvrir les réglages': 'Open Settings',
    /* suivi de la course */
    'Mission à venir': 'Upcoming mission', 'En route vers le client': 'On the way to the client',
    'Touchez « On site » dès que vous êtes arrivé.': 'Tap “On site” as soon as you arrive.',
    'Touchez « On board » dès que le client est dans la voiture.': 'Tap “On board” as soon as the client is in the car.',
    'Attente à un arrêt': 'Waiting at a stop', 'Client à bord': 'Client on board', 'Disponible à partir de': 'Available from',
    '(1 h avant la prise en charge).': '(1 hour before pick-up).',
    'Touchez « Start trip » en partant : le client est prévenu et suit votre voiture en direct.': 'Tap “Start trip” when you leave: the client is notified and follows your car live.',
    'Confirmer « Final stop »': 'Confirm “Final stop”', '📍 Ouvrir Overland (GPS sur Waze)': '📍 Open Overland (GPS on Waze)',
    '● GPS actif': '● GPS on',
    'Gardez l’appli ouverte pendant la course : votre position est envoyée au client et à l’équipe.': 'Keep the app open during the trip: your location is shared with the client and the team.',
    'Gardez l’appli ouverte pendant la course : votre position est envoyée au client et à l’équipe (Overland prend le relais sur Waze).': 'Keep the app open during the trip: your location is shared with the client and the team (Overland takes over on Waze).',
    'Mission introuvable': 'Mission not found', 'Suivi indisponible pour le moment : réessayez.': 'Tracking unavailable right now: try again.',
    'Envoi… (étape suivante enregistrée)': 'Sending… (next step saved)',
    'Overland ne s’est pas ouvert ? Installez l’appli gratuite Overland GPS Tracker, puis touchez « Ouvrir Overland ».': 'Overland didn’t open? Install the free Overland GPS Tracker app, then tap “Open Overland”.',
    'Start trip : le client est prévenu et suit votre voiture.': 'Start trip: the client is notified and follows your car.',
    'Course terminée, merci ! Pensez à valider votre course.': 'Trip completed, thank you! Remember to validate your trip.',
    'Bandeau masqué.': 'Banner hidden.', 'GPS pendant que vous roulez sur Waze': 'GPS while you drive with Waze',
    'Reliez une fois l’appli gratuite Overland : votre position continue de partir quand Waze est ouvert.': 'Link the free Overland app once: your location keeps being sent while Waze is open.',
    'Installez': 'Install', 'Relier Overland': 'Link Overland', ': il s’ouvre déjà réglé.': ': it opens already set up.',
    'Dans Overland, autorisez la localisation': 'In Overland, allow location', 'Toujours': 'Always', 'et activez': 'and turn on',
    '📍 GPS de l’appli actif pendant la course, même sur Waze ou écran verrouillé.': '📍 App GPS active during the trip, even with Waze open or the screen locked.',
    /* validation de la course et facture */
    'Ajouter ma facture': 'Add my invoice', 'Valider ma course': 'Validate my trip', 'Envoyer ma facture': 'Send my invoice', 'Valider la course': 'Validate the trip',
    'PDF trop lourd (8 Mo maximum).': 'PDF too large (8 MB maximum).', 'Choisissez un PDF ou une photo.': 'Choose a PDF or a photo.',
    'Préparation de la photo…': 'Preparing the photo…', '✓ Photo de la facture prête': '✓ Invoice photo ready',
    'Photo illisible : essayez un PDF ou une autre photo.': 'Unreadable photo: try a PDF or another photo.', 'Ajoutez votre facture (PDF ou photo).': 'Add your invoice (PDF or photo).',
    'Envoi…': 'Sending…', 'Lien non valide : contactez Rafai Limousine.': 'Invalid link: contact Rafai Limousine.',
    'Facture envoyée, merci !': 'Invoice sent, thank you!', 'Course validée et facture envoyée, merci !': 'Trip validated and invoice sent, thank you!',
    'Course validée, merci ! Pensez à ajouter votre facture.': 'Trip validated, thank you! Remember to add your invoice.',
    'Pas de connexion : réessayez dans un instant.': 'No connection: try again in a moment.',
    'Attente (min)': 'Waiting (min)', 'Heures en plus': 'Extra hours', 'Frais (péage, parking…) en €': 'Expenses (tolls, parking…) in €',
    'Remarque (facultatif)': 'Comment (optional)', 'Ma facture (PDF ou photo)': 'My invoice (PDF or photo)', 'Vous pouvez aussi l’ajouter plus tard.': 'You can also add it later.',
    'Montant de ma facture en € (facultatif)': 'My invoice amount in € (optional)', 'Envoyer': 'Send',
    'Ex. client arrivé avec 40 min de retard, arrêt en plus à Neuilly…': 'E.g. client arrived 40 min late, extra stop in Neuilly…', 'Ex. 120': 'E.g. 120',
    /* lien personnel et connexion */
    'Ce n’est pas un lien Rafai Limousine valide. Copiez le lien complet reçu par SMS, puis réessayez.': 'This is not a valid Rafai Limousine link. Copy the full link received by SMS, then try again.',
    'Collez le lien personnel envoyé par Rafai Limousine (SMS, WhatsApp ou e-mail) pour voir vos missions.': 'Paste the personal link sent by Rafai Limousine (SMS, WhatsApp or email) to see your missions.',
    'Coller mon lien': 'Paste my link', 'Ouvrir mes missions': 'Open my missions',
    'Connectez-vous avec le code reçu par e-mail.': 'Sign in with the code received by email.', 'Connexion chauffeur': 'Driver sign-in', 'Connexion': 'Sign in',
    'Entrez l’adresse e-mail enregistrée chez Rafai Limousine. Vous recevrez un code à 6 chiffres.': 'Enter the email address registered with Rafai Limousine. You will receive a 6-digit code.',
    'E-mail': 'Email', 'prenom@exemple.fr': 'name@example.com', 'Recevoir mon code': 'Get my code', 'J’ai reçu un lien personnel': 'I received a personal link',
    'Lien personnel': 'Personal link', 'Collez le lien reçu de Rafai Limousine par SMS, WhatsApp ou e-mail.': 'Paste the link received from Rafai Limousine by SMS, WhatsApp or email.',
    'Lien': 'Link', 'Recevoir un code par e-mail': 'Get a code by email', 'Votre code': 'Your code', 'Si': 'If',
    'est enregistrée chez Rafai Limousine, un code vient d’y être envoyé. Il est valable 15 minutes.': 'is registered with Rafai Limousine, a code has just been sent to it. It is valid for 15 minutes.',
    'Code à 6 chiffres': '6-digit code', 'Valider': 'Confirm', 'Renvoyer le code': 'Resend the code', 'Changer d’adresse': 'Change address',
    'Un souci ? Appelez Rafai Limousine au +33 6 67 09 94 94.': 'Any problem? Call Rafai Limousine on +33 6 67 09 94 94.',
    'Ce n’est pas un lien Rafai Limousine valide. Copiez le lien complet, puis réessayez.': 'This is not a valid Rafai Limousine link. Copy the full link, then try again.',
    'Vérifiez l’adresse e-mail.': 'Check the email address.', 'Nouveau code envoyé si l’adresse est enregistrée.': 'New code sent if the address is registered.',
    'Trop de demandes. Réessayez dans une heure ou appelez Rafai Limousine.': 'Too many requests. Try again in an hour or call Rafai Limousine.',
    'Pas de connexion internet. Réessayez.': 'No internet connection. Try again.', 'Le code fait 6 chiffres.': 'The code has 6 digits.',
    'Vérification…': 'Checking…', 'Connexion réussie.': 'Signed in.', 'Code expiré ou trop d’essais. Demandez un nouveau code.': 'Code expired or too many attempts. Request a new code.',
    'Code incorrect. Vérifiez et réessayez.': 'Incorrect code. Check it and try again.',
    /* téléphone : localisation et notifications */
    'Localisation refusée : ouvrez Réglages › RL Driver › Position et choisissez « Toujours ».': 'Location denied: open Settings › RL Driver › Location and choose “Always”.',
    'Position introuvable pour l’instant. Réessayez dehors ou près d’une fenêtre.': 'Location not found yet. Try again outside or near a window.',
    'Préparez votre téléphone': 'Get your phone ready', 'Pour recevoir vos missions et partager la position de la voiture pendant les courses.': 'To receive your missions and share the car’s location during trips.',
    '✓ Localisation activée': '✓ Location on', '📍 Activer la localisation': '📍 Turn on location', '✓ Notifications activées': '✓ Notifications on',
    '🔔 Autoriser les notifications dans Réglages': '🔔 Allow notifications in Settings', '🔔 Activer les notifications': '🔔 Turn on notifications',
    /* historique, calendrier, menu, compte */
    'Chargement…': 'Loading…', 'Historique indisponible pour l’instant. Refermez et rouvrez la rubrique pour réessayer.': 'History unavailable right now. Close and reopen this section to try again.',
    'Aucune course terminée sur les 12 derniers mois.': 'No completed trips in the last 12 months.', '🗂️ Historique des courses': '🗂️ Trip history',
    'Se déconnecter': 'Sign out', 'Se déconnecter de RL Driver ? Vous pourrez revenir avec un code reçu par e-mail.': 'Sign out of RL Driver? You can come back with a code received by email.',
    'Mois précédent': 'Previous month', 'Aucune course': 'No trips', 'Mois suivant': 'Next month', 'Réduire le calendrier': 'Collapse calendar', 'Mois': 'Month',
    'Tout voir ✕': 'See all ✕', 'Aucune course ce jour-là.': 'No trips that day.', 'Chargement de l’historique…': 'Loading history…', 'Réessayer': 'Try again',
    'Historique complet indisponible pour l’instant : seules les dernières courses s’affichent.': 'Full history unavailable right now: only recent trips are shown.',
    'Aucune course en cours': 'No trips in progress', 'Mes courses': 'My trips', 'Notifications': 'Notifications', 'Activées ✓': 'On ✓', 'Activée ✓': 'On ✓', 'Activé ✓': 'On ✓',
    'Réglages': 'Settings', 'Activer': 'Turn on', 'Localisation': 'Location', 'Apparence': 'Appearance', 'Sombre': 'Dark', 'Clair': 'Light', 'Langue': 'Language',
    'Auto : clair le jour (7 h – 19 h 30), sombre la nuit.': 'Auto: light during the day (7:00 – 19:30), dark at night.',
    'Auto : suit le réglage de votre téléphone.': 'Auto: follows your phone’s setting.',
    'Calendrier du mois': 'Monthly calendar', 'Historique des courses': 'Trip history', 'Menu RL Driver': 'RL Driver menu', 'Mon compte': 'My account',
    'Retour': 'Back', 'Les nouvelles missions arrivent aussi par e-mail.': 'New missions also arrive by email.', 'Un souci ?': 'Any problem?',
    'Appelez Rafai Limousine': 'Call Rafai Limousine', 'Ouverture de la mission…': 'Opening the mission…', 'Actualiser': 'Refresh',
    'Recharger la mission': 'Reload the mission', 'Appeler': 'Call',
    /* valeurs venant de l'Espace équipe */
    'Transfert aéroport': 'Airport transfer', 'Aller simple': 'One way', 'Mise à disposition': 'Hourly / As directed', 'Mariage': 'Wedding',
    'Transfert gare': 'Station transfer', 'Transfert': 'Transfer', 'Course': 'Trip',
    'Berline · Mercedes Classe E': 'Sedan · Mercedes E-Class', 'Première classe · Mercedes Classe S': 'First class · Mercedes S-Class',
    'Van · Mercedes Classe V': 'Van · Mercedes V-Class', 'Grand Tourisme · Range Rover Autobiography': 'Grand Touring · Range Rover Autobiography',
    'Berline': 'Sedan', 'Première classe': 'First class', 'Grand Tourisme': 'Grand Touring',
    'Mercedes Classe E': 'Mercedes E-Class', 'Mercedes Classe S': 'Mercedes S-Class', 'Mercedes Classe V': 'Mercedes V-Class',
    'Classe E': 'E-Class', 'Classe S': 'S-Class', 'Classe V': 'V-Class',
    'Carte bancaire': 'Card', 'Espèces': 'Cash', 'Virement': 'Bank transfer', 'Lien de paiement': 'Payment link', 'Paiement par notre partenaire': 'Paid via our partner',
    'Français': 'French', 'Anglais': 'English', 'Arabe': 'Arabic', 'Chinois': 'Chinese', 'Espagnol': 'Spanish', 'Italien': 'Italian', 'Allemand': 'German',
    'Russe': 'Russian', 'Portugais': 'Portuguese', 'Japonais': 'Japanese', 'Coréen': 'Korean', 'Néerlandais': 'Dutch', 'Turc': 'Turkish', 'Hébreu': 'Hebrew'
  };
  Object.keys(W).forEach(function (k) { D[N(k)] = W[k]; });

  /* ---------- modèles (textes avec une heure, un nombre ou un nom) ---------- */
  var MO = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var ME = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function pl(n, one, many) { return n + ' ' + (Number(n) > 1 ? many : one); }
  function ago(s) {
    var m;
    if (s === 'à l’instant') return 'just now';
    if ((m = s.match(/^il y a (\d+) (min|h|j)$/))) return m[1] + (m[2] === 'j' ? (m[1] > 1 ? ' days' : ' day') : ' ' + m[2]) + ' ago';
    return s;
  }
  function tr(s) { var r = T(s); return r == null ? s : r; }
  P = [
    [/^Bonjour (.+)$/, function (m) { return 'Hello ' + m[1]; }],
    [/^À jour à (.+)$/, function (m) { return 'Updated at ' + m[1]; }],
    [/^Hors connexion · dernière mise à jour (.+)$/, function (m) { return 'Offline · last updated ' + m[1]; }],
    [/^Envoyée à (.+)$/, function (m) { return 'Sent at ' + m[1]; }],
    [/^⏱ Waiting at stop · depuis (.+)$/, function (m) { return '⏱ Waiting at stop · since ' + m[1]; }],
    [/^Mesurée par l’appli : (\d+) min$/, function (m) { return 'Measured by the app: ' + m[1] + ' min'; }],
    [/^(\d+) courses? terminées?$/, function (m) { return pl(m[1], 'completed trip', 'completed trips'); }],
    [/^(\d+) · récentes$/, function (m) { return m[1] + ' · recent'; }],
    [/^(\d+) courses?( · .+)?$/, function (m) { return pl(m[1], 'trip', 'trips') + (m[2] || ''); }],
    [/^(?:(\d+) nouvelles? missions?)?(?: · )?(?:(\d+) missions? modifiées?)? : vérifiez les détails ci-dessous\.$/, function (m) {
      var a = [];
      if (m[1]) a.push(pl(m[1], 'new mission', 'new missions'));
      if (m[2]) a.push(pl(m[2], 'updated mission', 'updated missions'));
      return a.length ? a.join(' · ') + ': check the details below.' : null;
    }],
    [/^📍 GPS sur Waze relié \(Overland\) · dernière position (.+?)\. Laissez Overland installé : il se met en mode précis tout seul pendant vos courses\.$/, function (m) {
      return '📍 GPS on Waze linked (Overland) · last position ' + ago(m[1]) + '. Keep Overland installed: it switches to precise mode by itself during your trips.';
    }],
    [/^(à l’instant|il y a \d+ (?:min|h|j))$/, function (m) { return ago(m[1]); }],
    [/^Envoi impossible(?: : (.+?))?\. Réessayez\.$/, function (m) { return 'Sending failed' + (m[1] ? ': ' + m[1] : '') + '. Try again.'; }],
    [/^PDF prêt : touchez « (.+) »\.$/, function (m) { return 'PDF ready: tap “' + tr(m[1]) + '”.'; }],
    [/^(.+) · le client voit vos réponses$/, function (m) { return m[1] + ' · the client sees your replies'; }],
    [/^Chauffeur · (.+)$/, function (m) { return 'Driver · ' + m[1]; }],
    [/^Client : (.+)$/, function (m) { return 'Client: ' + tr(m[1]); }],
    [/^(\d+) pass\.$/, function (m) { return m[1] + ' pax'; }],
    [/^(\d+) bag\.$/, function (m) { return pl(m[1], 'bag', 'bags'); }],
    [/^(.*) · Lu$/, function (m) { return m[1] + ' · Read'; }],
    [/^Entrer avec (.+)$/, function (m) { return 'Sign in with ' + m[1]; }],
    [/^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)( \d{4})?$/i, function (m) {
      var i = MO.indexOf(m[1].toLowerCase()); return i < 0 ? null : ME[i] + (m[2] || '');
    }],
    [/^(.+) · (Transfert aéroport|Aller simple|Mise à disposition|Mariage|Transfert gare|Course)$/, function (m) { return m[1] + ' · ' + tr(m[2]); }],
    [/^(Transfert aéroport|Aller simple|Mise à disposition|Mariage|Transfert gare|Course) · (.+)$/, function (m) { return tr(m[1]) + ' · ' + tr(m[2]); }]
  ];

  /* ---------- traduction de la page ---------- */
  var JR_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], ATTR = ['placeholder', 'title', 'aria-label'];
  var TEAMQ = { 'Bien reçu 👍': 'Got it 👍', 'Je suis en route': 'I’m on my way', 'Je suis sur place': 'I’m on site', 'Je vous rappelle dans 5 min': 'I’ll call you back in 5 min' };
  function skip(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) {
      var t = e.tagName;
      if (t === 'SCRIPT' || t === 'STYLE' || t === 'TEXTAREA' || t === 'CODE') return true;
      if (e.hasAttribute('data-notr') || e.isContentEditable || e.id === 'alt') return true;
    }
    return false;
  }
  /* messages écrits (bulles) et notes : le texte posé directement dans la bulle ou la note n'est jamais traduit
     (les petites étiquettes à l'intérieur, elles, le sont) */
  function userText(p) {
    var c = p.className && typeof p.className === 'string' ? p.className : '';
    return /(^|\s)(cm|msg)(\s|$)/.test(c);
  }
  function quick(node) {
    var b = node.parentNode, q = b && b.closest ? b.closest('#cq') : null;
    if (!q) return undefined;
    var team = /Bien reçu 👍|Got it 👍/.test(q.textContent || '');
    if (!team) return null;
    var k = N(node.nodeValue);
    return Object.prototype.hasOwnProperty.call(TEAMQ, k) ? TEAMQ[k] : null;
  }
  function doText(node) {
    var v = node.nodeValue; if (!v || !/[A-Za-zÀ-ÿ]/.test(v)) return;
    var p = node.parentNode; if (!p || p.nodeType !== 1) return;
    if (skip(p)) return;
    var r;
    if (p.tagName === 'SMALL' && p.parentNode && p.parentNode.classList && p.parentNode.classList.contains('rlgr') && /^\s*[LMJVSD]\s*$/.test(v)) {
      var i = 0; for (var s = p.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === 'SMALL') i++;
      if (i < 7) node.nodeValue = JR_EN[i];
      return;
    }
    var q = quick(node);
    if (q === null) return;
    if (q !== undefined) r = q;
    else {
      if (userText(p)) return;
      r = T(v);
    }
    if (r == null) return;
    var lead = v.match(/^\s*/)[0], tail = v.match(/\s*$/)[0];
    var nv = lead + r + tail;
    if (nv !== v) node.nodeValue = nv;
  }
  function doAttrs(el) {
    if (skip(el)) return;
    for (var i = 0; i < ATTR.length; i++) {
      var a = el.getAttribute(ATTR[i]); if (!a) continue;
      var r = T(a); if (r != null && r !== a) el.setAttribute(ATTR[i], r);
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (skip(root)) return; doAttrs(root); }
    var tw = document.createTreeWalker(root, 5 /* éléments + textes */, null), n;
    while ((n = tw.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  var busy = false;
  var mo = new MutationObserver(function (list) {
    if (busy) return;
    busy = true;
    try {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === 'childList') { for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]); }
        else if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doAttrs(m.target);
      }
    } catch (e) {}
    mo.takeRecords();
    busy = false;
  });
  mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR });
  document.documentElement.setAttribute('lang', 'en');
  function full() { try { walk(document.body || document.documentElement); } catch (e) {} }
  if (document.readyState !== 'loading') full(); else document.addEventListener('DOMContentLoaded', full);
  window.addEventListener('load', full);
  window.RLLang.retranslate = full;
})();
