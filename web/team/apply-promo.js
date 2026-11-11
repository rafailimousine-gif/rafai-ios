/* À exécuter dans l'éditeur Apps Script (projet « Espace équipe Rafai Limousine ») : code promo -10 % première course (rlPromo v1).
   - promo.gs à la fin de Code.gs
   - routeur POST : cpjoin (inscription) ; routeur GET : cpok (validation de l'adresse par le lien de l'e-mail)
   - cliPromo_ : codes RL10-XXXXX (promoCheck_) ; cliQuote_ : pourcentage dans out.promo.pct
   - cliBook_ : note « Code … : -10 % (prix normal …) » et code marqué utilisé après la réservation
   Vérifie la syntaxe avant d'écrire. Ne sauvegarde pas. */
(async function (RAW) {
  var model = monaco.editor.getModels().filter(function (m) { return /\.js$/.test(m.uri.path); })[0];
  var src = model.getValue();
  if (src.indexOf('rlPromo v1') >= 0) return 'ARRET deja applique';
  var gs = await fetch(RAW + 'web/team/promo.gs', { cache: 'no-store' }).then(function (r) { return r.text(); });
  if (gs.indexOf('rlPromo v1') < 0) return 'ARRET promo.gs non lu';
  window.__gsBackupPromo = src;
  function rep(a, b, label, within) {
    var hay = within ? within.text : src, n = hay.split(a).length - 1;
    if (n !== 1) throw new Error('ancre ' + label + ' trouvee ' + n + ' fois');
    if (within) within.text = hay.replace(a, function () { return b; });
    else src = src.replace(a, function () { return b; });
  }
  function fn(name) {
    var f0 = src.indexOf('function ' + name + '('), f1 = src.indexOf('\nfunction ', f0 + 10);
    if (f0 < 0 || f1 < 0) throw new Error(name + ' introuvable');
    return { a: f0, b: f1, text: src.slice(f0, f1), old: src.slice(f0, f1) };
  }
  function put(w, label) { rep(w.old, w.text, label); }
  try {
    rep('if (/^c(prof|google|apple|pkreg|pkauth|cancel|edit)$/.test(q.app)) return cliPost_(q.app, body);',
      'if (/^c(prof|google|apple|pkreg|pkauth|cancel|edit|pjoin)$/.test(q.app)) return cliPost_(q.app, body);', 'POST');
    rep(": app === 'cedit' ? cliEdit_(body) : { ok: false, err: 'action' };",
      ": app === 'cedit' ? cliEdit_(body) : app === 'cpjoin' ? cliPromoJoin_(body) : { ok: false, err: 'action' };", 'cliPost_');
    var R = "case 'cfn': return cliOut_(cliFunnel_(q));";
    var ri = src.indexOf(R); if (ri < 0) throw new Error('cfn introuvable');
    var ind = src.slice(src.lastIndexOf('\n', ri) + 1, ri);
    rep(R, R + '\n' + ind + "case 'cpok': return cliOut_(cliPromoOk_(q));", 'GET');
    var P = fn('cliPromo_');
    rep('if (!c) return null;', 'if (!c) return null;\n  /* rlPromo v1 : codes personnels -10 % */\n  if (/^RL10-[A-Z0-9]{5}$/.test(c)) return promoCheck_(c);', 'cliPromo_', P);
    put(P, 'cliPromo_ (ecriture)');
    var Q = fn('cliQuote_');
    rep("out.promo = { ok: pc.ok, code: pc.code, why: pc.why || '' };",
      "out.promo = { ok: pc.ok, code: pc.code, why: pc.why || '', pct: pc.ok ? Math.round(pc.pct * 100) : 0 };", 'cliQuote_', Q);
    put(Q, 'cliQuote_ (ecriture)');
    var B = fn('cliBook_');
    rep("'Code ' + qt.promo.code + ' : -30 % (prix normal '", "'Code ' + qt.promo.code + ' : -' + (qt.promo.pct || 30) + ' % (prix normal '", 'note', B);
    var E = "if (!j.ok || !j.ref) return cliOut_({ ok: false, err: 'envoi' });";
    rep(E, E + "\n    if (qt.promo && qt.promo.ok && /^RL10-/.test(qt.promo.code)) try { promoUse_(qt.promo.code, j.ref, email); } catch (z) {}", 'cliBook_', B);
    put(B, 'cliBook_ (ecriture)');
  } catch (e) { return 'ARRET ' + e.message; }
  src = src.replace(/\s*$/, '\n') + '\n' + gs.replace(/\s*$/, '\n');
  try { new Function(src); } catch (e) { return 'ARRET syntaxe : ' + e.message; }
  model.pushEditOperations([], [{ range: model.getFullModelRange(), text: src }], function () { return null; });
  return 'ok rlPromo v1 · taille ' + src.length + ' · cpjoin ' + (src.indexOf("app === 'cpjoin'") > 0) + ' · cpok ' + (src.indexOf("case 'cpok'") > 0) + ' · promoCheck_ ' + (src.indexOf('return promoCheck_(c)') > 0) + ' · promoUse_ ' + (src.indexOf('promoUse_(qt.promo.code') > 0);
})
