/* Coller dans la console de l'éditeur Apps Script (projet « Espace équipe ») : Espace équipe sur Firebase (rlTeamWeb v1).
   - me_() : l'e-mail vient du jeton (TEAM_ME_) quand l'appel arrive de la page Firebase
   - routes POST ?app=team / tlogin / tverify (drvChatPost_) et GET ?teamapp=1 (HTML de la page)
   - equipe-firebase.gs ajouté à la fin. Ne sauvegarde pas. */
(async function (RAW) {
  var model = monaco.editor.getModels().filter(function (m) { return m.getValue().length > 700000; })[0];
  var src = model.getValue();
  if (src.indexOf('rlTeamWeb v1') >= 0) return 'ARRET deja applique';
  var gs = await fetch(RAW + 'web/team/equipe-firebase.gs', { cache: 'no-store' }).then(function (r) { return r.text(); });
  if (gs.indexOf('rlTeamWeb v1') < 0) return 'ARRET fichier non lu';
  function rep(a, b) { if (src.split(a).length !== 2) throw new Error('ancre ' + a.slice(0, 40)); src = src.replace(a, function () { return b; }); }
  function after(a, add) { var i = src.indexOf(a); var ind = src.slice(src.lastIndexOf('\n', i) + 1, i); rep(a, a + add.split('\n').map(function (l) { return '\n' + ind + l; }).join('')); }
  function before(a, add) { var i = src.indexOf(a); var ind = src.slice(src.lastIndexOf('\n', i) + 1, i); rep(a, add.split('\n').map(function (l) { return l + '\n' + ind; }).join('') + a); }
  try {
    window.__gsBackupEquipe = src;
    rep("function me_() { return String(Session.getActiveUser()", "function me_() { return TEAM_ME_ || String(Session.getActiveUser()");
    after("if (q.app === 'drvdone') return drvDone_(body);", "if (q.app === 'team') return teamHttp_(body);\nif (q.app === 'tlogin' || q.app === 'tverify') return cliOut_(q.app === 'tlogin' ? teamLogin_(body) : teamVerify_(body));");
    before("if (q.app) return drvAppRoute_(q);", "/* rlTeamWeb v1 : HTML de l'Espace équipe pour Firebase */\nif (q.teamapp === '1') return ContentService.createTextOutput(APP_HTML);");
  } catch (e) { return 'ARRET ' + e.message; }
  src = src.replace(/\s*$/, '\n') + '\n' + gs.replace(/\s*$/, '\n');
  model.pushEditOperations([], [{ range: model.getFullModelRange(), text: src }], function () { return null; });
  return 'ok rlTeamWeb v1 · ' + src.length;
})
