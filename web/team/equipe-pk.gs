/* ---------- rlTeamPk v1 (12 nov. 2026, demande de Yassine) : connexion à l'Espace équipe avec Face ID / Touch ID (clé d'accès) ----------
 * Seulement sur https://equipe.rafai-limousine.com (une clé d'accès est liée à son adresse).
 * 1re fois : connexion par code e-mail, puis « Activer Face ID » (POST ?app=tpkopt {t} → défi ; ?app=tpkreg {t,id,alg,pub,cd}).
 * Ensuite : « Se connecter avec Face ID » (?app=tpkopt {} → défi ; ?app=tpkauth {id,cd,ad,sig} → jeton 30 jours).
 * Même vérification que les clés d'accès de l'appli client (cliSpki_, pkEcVerify_, pkRsaVerify_), autre adresse et autres clés
 * (TEAM_PK_…). L'e-mail doit toujours être dans l'équipe (Réglages) : sinon la clé est refusée. */
var TEAM_RP = 'equipe.rafai-limousine.com', TEAM_ORIGIN = 'https://equipe.rafai-limousine.com';
function teamPkKey_(id) { return 'TEAM_PK_' + cliB64e_(cliSha_(cliUtf8_(String(id)))).slice(0, 24); }
function teamPkChk_(cd, type) {
  var j = {}; try { j = JSON.parse(cliTxt_(cd)); } catch (e) { return false; }
  if (j.type !== type || j.origin !== TEAM_ORIGIN || !j.challenge) return false;
  var c = CacheService.getScriptCache(), k = 'pkc:' + String(j.challenge).replace(/=+$/, '');
  if (!c.get(k)) return false;
  c.remove(k);
  return true;
}
function teamPk_(a, body) {
  var x = cliJson_(body), pr = PropertiesService.getScriptProperties(), e;
  if (a === 'tpkopt') {
    if (!cliQuota_('tpkopt', 2000)) return { ok: false, err: 'quota' };
    var o = { ok: true, c: pkChallenge_(), rp: TEAM_RP };
    e = teamTok_(x.t);
    if (e) { o.uid = cliB64e_(cliUtf8_(cliHash_(e))); o.name = e; }
    return o;
  }
  if (a === 'tpkreg') {
    e = teamTok_(x.t);
    if (!e) return { ok: false, err: 'auth' };
    var id = String(x.id || ''), alg = Number(x.alg), pub = String(x.pub || ''), key;
    if (!/^[A-Za-z0-9\-_]{16,1400}$/.test(id) || pub.length > 1200) return { ok: false, err: 'cle' };
    if (!teamPkChk_(cliB64d_(x.cd), 'webauthn.create')) return { ok: false, err: 'defi' };
    try { key = cliSpki_(cliB64d_(pub)); } catch (z) { return { ok: false, err: 'cle' }; }
    if (!((alg === -7 && key.kty === 'EC') || (alg === -257 && key.kty === 'RSA'))) return { ok: false, err: 'cle' };
    var uk = 'TEAM_PKU_' + cliHash_(e), k = teamPkKey_(id), list = [];
    try { list = JSON.parse(pr.getProperty(uk) || '[]') || []; } catch (z) { list = []; }
    list = list.filter(function (y) { return y !== k; }); list.push(k);
    while (list.length > 8) pr.deleteProperty(list.shift());
    pr.setProperty(k, JSON.stringify({ e: e, a: alg, p: pub, t: now_() }));
    pr.setProperty(uk, JSON.stringify(list));
    try { log_('', 'Face ID activé (Espace équipe)', e, e); } catch (z) {}
    return { ok: true };
  }
  if (a === 'tpkauth') {
    if (!cliQuota_('tpkauth', 1500)) return { ok: false, err: 'quota' };
    var rec = null;
    try { rec = JSON.parse(pr.getProperty(teamPkKey_(String(x.id || ''))) || 'null'); } catch (z) { rec = null; }
    if (!rec || !rec.e) return { ok: false, err: 'inconnue' };
    var cd = cliB64d_(x.cd), ad = cliB64d_(x.ad), sig = cliB64d_(x.sig);
    if (ad.length < 37 || cliHex_(ad.slice(0, 32)) !== cliHex_(cliSha_(cliUtf8_(TEAM_RP))) || (ad[32] & 5) !== 5) return { ok: false, err: 'signature' };
    if (!teamPkChk_(cd, 'webauthn.get')) return { ok: false, err: 'defi' };
    var ok = false;
    try { var pk = cliSpki_(cliB64d_(rec.p)), h = cliSha_(ad.concat(cliSha_(cd))); ok = pk.kty === 'EC' ? pkEcVerify_(pk, h, sig) : pkRsaVerify_(pk, h, sig); } catch (z) { ok = false; }
    if (!ok) return { ok: false, err: 'signature' };
    if (!teamAllowed_(rec.e)) return { ok: false, err: 'acces' };
    var payload = rec.e + '|' + (Date.now() + TEAM_TOK_DAYS * 864e5);
    try { log_('', 'Connexion Espace équipe (Face ID)', rec.e, rec.e); } catch (z) {}
    return { ok: true, e: rec.e, t: teamB64_(payload) + '.' + teamSig_(payload) };
  }
  return { ok: false, err: 'action' };
}
