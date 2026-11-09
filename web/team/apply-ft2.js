/* À exécuter dans l'éditeur Apps Script (projet « Espace équipe Rafai Limousine ») : Fast Track VIP ajouté à la main (rlFt v2).
   - ft2.gs à la fin de Code.gs (ftAdd_)
   - api() : case 'ftAdd'
   - createBooking_ : option p.ft (note en tête du commentaire + demande FT_<réf>)
   - APP_HTML : ft2-tab.js juste après l'onglet rlFt v1 (bouton + et case sur « Nouvelle course »)
   Vérifie la syntaxe avant d'écrire. Ne sauvegarde pas. */
(async function (RAW) {
  var model = monaco.editor.getModels().filter(function (m) { return /\.js$/.test(m.uri.path); })[0];
  var src = model.getValue();
  if (src.indexOf('rlFt v2') >= 0) return 'ARRET deja applique';
  if (src.indexOf('rlFt v1') < 0) return 'ARRET rlFt v1 absent';
  var gs = await fetch(RAW + 'web/team/ft2.gs', { cache: 'no-store' }).then(function (r) { return r.text(); });
  var tab = await fetch(RAW + 'web/team/ft2-tab.js', { cache: 'no-store' }).then(function (r) { return r.text(); });
  if (gs.indexOf('rlFt v2') < 0 || tab.indexOf('rlFt v2') < 0) return 'ARRET fichiers non lus';
  if (tab.indexOf('</script') >= 0) return 'ARRET balise script dans l onglet';
  window.__gsBackupFt2 = src;
  function rep(a, b, label) {
    var n = src.split(a).length - 1;
    if (n !== 1) throw new Error('ancre ' + label + ' trouvee ' + n + ' fois');
    src = src.replace(a, function () { return b; });
  }
  try {
    /* createBooking_ : on travaille dans la fonction seulement */
    var f0 = src.indexOf('function createBooking_(p, me) {'), f1 = src.indexOf('\nfunction ', f0 + 10);
    if (f0 < 0 || f1 < 0) throw new Error('createBooking_ introuvable');
    var cb = src.slice(f0, f1), cb2 = cb;
    var S1 = "  var status = STATUSES.indexOf(p.status) >= 0 ? p.status : 'Confirmée';";
    var S2 = '  var nb = getBooking_(b, ref);';
    if (cb2.split(S1).length !== 2 || cb2.split(S2).length !== 2) throw new Error('ancres createBooking_');
    cb2 = cb2.replace(S1, function () {
      return '  /* rlFt v2 : option Fast Track VIP du formulaire « Nouvelle course » */\n' +
        '  var ftm = null;\n' +
        "  try { ftm = ftParse_(p.ft); if (ftm) f.notes = ftNote_(ftm) + (f.notes ? ' / ' + f.notes : ''); } catch (z) { ftm = null; }\n" + S1;
    });
    cb2 = cb2.replace(S2, function () {
      return S2 + "\n  if (ftm) try { ftPut_(ref, { k: ftm.k, flight: ftm.flight, pax: ftm.pax, bags: ftm.bags, sign: ftm.sign, lang: ftm.lang, msg: ftm.msg, st: 'new', at: Date.now(), price: FT_PRICE, manual: 1 }); log_(ref, 'Fast Track VIP', 'Ajouté à la saisie de la course', me); } catch (z) {}";
    });
    rep(cb, cb2, 'createBooking_');
    var E = "    case 'ftAgent': return locked_(function () { return ftAgent_(p, me); });";
    rep(E, E + "\n    case 'ftAdd': return locked_(function () { return ftAdd_(p, me); });", 'api');
    var F = 'setTimeout(ftNav, 400); setInterval(ftNav, 3000);\\n})();';
    var esc = JSON.stringify('\n\n' + tab.replace(/\s*$/, '\n')).slice(1, -1);
    rep(F, F + esc, 'onglet');
  } catch (e) { return 'ARRET ' + e.message; }
  src = src.replace(/\s*$/, '\n') + '\n' + gs.replace(/\s*$/, '\n');
  try { new Function(src); } catch (e) { return 'ARRET syntaxe : ' + e.message; }
  try { new Function(tab); } catch (e) { return 'ARRET syntaxe onglet : ' + e.message; }
  model.pushEditOperations([], [{ range: model.getFullModelRange(), text: src }], function () { return null; });
  return 'ok rlFt v2 · taille ' + src.length + ' · ftAdd_ ' + (src.indexOf('function ftAdd_(') > 0);
})
