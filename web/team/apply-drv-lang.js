/* À exécuter dans l'éditeur Apps Script (onglet du projet « Espace équipe ») : remplace les fonctions de drv-lang.gs
   dans Code.gs (même nom) et ajoute les nouvelles à la fin. Vérifie la syntaxe avant d'écrire. Ne sauvegarde pas. */
(async function (RAW) {
  var model = monaco.editor.getModels().filter(function (m) { return /\.js$/.test(m.uri.path); })[0];
  var src = model.getValue(), gs = await fetch(RAW + 'web/team/drv-lang.gs', { cache: 'no-store' }).then(function (r) { return r.text(); });
  window.__gsBackup = src;
  var head = gs.slice(0, gs.indexOf('\nfunction ') + 1), fns = [], re = /^function (\w+)\(/gm, m;
  while ((m = re.exec(gs))) { var j = gs.indexOf('\n}\n', m.index); fns.push({ n: m[1], t: gs.slice(m.index, j + 2) }); }
  var NEW = ['drvLang_', 'drvLangSet_', 'rlEnDate_', 'rlEnShort_', 'rlTrEn_', 'rlPrice_', 'rlTripRows_'], add = [], rep = [];
  for (var i = 0; i < fns.length; i++) {
    var f = fns[i], key = '\nfunction ' + f.n + '(', a = src.indexOf(key), n = src.split(key).length - 1;
    if (NEW.indexOf(f.n) >= 0) { if (n) return 'ARRET existe deja ' + f.n; add.push(f.t); continue; }
    if (n !== 1) return 'ARRET ' + f.n + ' trouve ' + n + ' fois';
    var b = src.indexOf('\n}\n', a + 1);
    var old = src.slice(a + 1, b + 2);
    if ((old.match(/\nfunction /g) || []).length) return 'ARRET fin de ' + f.n + ' incertaine';
    src = src.slice(0, a + 1) + f.t + src.slice(b + 2);
    rep.push(f.n);
  }
  src = src.replace(/\s*$/, '\n') + '\n' + head + add.join('\n') + '\n';
  try { new Function(src); } catch (e) { return 'ARRET syntaxe : ' + e.message; }
  model.pushEditOperations([], [{ range: model.getFullModelRange(), text: src }], function () { return null; });
  return 'ok remplacees ' + rep.length + ' (' + rep.join(',') + ') ajoutees ' + add.length + ' taille ' + src.length;
})
