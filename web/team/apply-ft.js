/* À exécuter dans l'éditeur Apps Script (onglet du projet « Espace équipe Rafai Limousine ») : ajoute le Fast Track VIP (rlFt v1).
   - fonctions de ft.gs à la fin de Code.gs
   - cliBook_ : option Fast Track VIP (+240 €, note, demande FT_<réf>) ; prix renvoyé avec l'option
   - cliRide_ : o.ft pour « Mes courses »
   - api() : ftList, ftSend, ftAgent
   - APP_HTML : onglet « Fast Track VIP » (ft-tab.js) après l'onglet GNet
   Vérifie la syntaxe avant d'écrire. Ne sauvegarde pas. */
(async function (RAW) {
  var model = monaco.editor.getModels().filter(function (m) { return /\.js$/.test(m.uri.path); })[0];
  var src = model.getValue();
  if (src.indexOf('rlFt v1') >= 0) return 'ARRET deja applique';
  var gs = await fetch(RAW + 'web/team/ft.gs', { cache: 'no-store' }).then(function (r) { return r.text(); });
  var tab = await fetch(RAW + 'web/team/ft-tab.js', { cache: 'no-store' }).then(function (r) { return r.text(); });
  if (gs.indexOf('rlFt v1') < 0 || tab.indexOf('rlFt v1') < 0) return 'ARRET fichiers non lus';
  if (tab.indexOf('</script') >= 0) return 'ARRET balise script dans l onglet';
  window.__gsBackupFt = src;
  function rep(a, b, label) {
    var n = src.split(a).length - 1;
    if (n !== 1) throw new Error('ancre ' + label + ' trouvee ' + n + ' fois');
    src = src.replace(a, function () { return b; });
  }
  try {
    var A = '    var res = UrlFetchApp.fetch(CLI_BOOKING_URL, {';
    rep(A,
      '    /* rlFt v1 : option Fast Track VIP (240 €) si le trajet passe par un aéroport */\n' +
      '    var ft = null;\n' +
      '    try {\n' +
      '      ft = ftParse_(x.ft);\n' +
      '      if (ft && d.price && type !== \'hourly\' && FT_AIR.test(s(\'from\') + \' \' + s(\'to\'))) {\n' +
      '        var ftWas = d.price.was;\n' +
      '        d.price = { v: Number(d.price.v) + FT_PRICE, from: false };\n' +
      '        if (ftWas) d.price.was = Number(ftWas) + FT_PRICE;\n' +
      '        d.notes = ftNote_(ft) + (d.notes ? \' / \' + d.notes : \'\');\n' +
      '      } else ft = null;\n' +
      '    } catch (z) { ft = null; }\n' + A, 'A');
    var B = "if (!j.ok || !j.ref) return cliOut_({ ok: false, err: 'envoi' });";
    rep(B, B + "\n    if (ft) try { ftPut_(j.ref, { k: ft.k, flight: ft.flight, pax: ft.pax, bags: ft.bags, sign: ft.sign, lang: ft.lang, msg: ft.msg, st: 'new', at: Date.now(), price: FT_PRICE }); } catch (z) {}", 'B');
    rep("price: pr ? pr.v : '', stripe: !!stripeKey_() })", "price: d && d.price ? d.price.v : (pr ? pr.v : ''), stripe: !!stripeKey_() })", 'C');
    var D = 'var P = props || cliProps_(), can = cliCan_(b, p);';
    rep(D, D + ' try { o.ft = ftCli_(b.ref, P); } catch (e) {}', 'D');
    var E = "    case 'blockDriver': return locked_(function () { return blockDriver_(p, me); });";
    rep(E, E + "\n    case 'ftList': return ftList_();\n    case 'ftSend': return locked_(function () { return ftSend_(p, me); });\n    case 'ftAgent': return locked_(function () { return ftAgent_(p, me); });", 'E');
    var F = 'setInterval(gnNav, 3000);\\n})();';
    var esc = JSON.stringify('\n\n' + tab.replace(/\s*$/, '\n')).slice(1, -1);
    rep(F, F + esc, 'F');
  } catch (e) { return 'ARRET ' + e.message; }
  src = src.replace(/\s*$/, '\n') + '\n' + gs.replace(/\s*$/, '\n');
  try { new Function(src); } catch (e) { return 'ARRET syntaxe : ' + e.message; }
  /* l'onglet ajouté dans APP_HTML doit lui aussi être du JavaScript valide */
  try { new Function(tab); } catch (e) { return 'ARRET syntaxe onglet : ' + e.message; }
  model.pushEditOperations([], [{ range: model.getFullModelRange(), text: src }], function () { return null; });
  return 'ok rlFt v1 · taille ' + src.length + ' · fonctions ft ' + (src.match(/\nfunction ft[A-Za-z]*_\(/g) || []).length;
})
