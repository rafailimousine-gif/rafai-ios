/* ---------- rlTeamWeb v1 : l'Espace équipe hors de Google (Firebase), 11 nov. 2026, demande de Yassine ----------
 * La page de l'équipe (APP_HTML) est servie par Firebase Hosting ; elle appelle ici la même fonction api(action, p)
 * qu'avant (google.script.run), mais par POST ?app=team avec un jeton de connexion.
 * Connexion : e-mail de l'équipe (propriétaire ou liste TEAM) → code à 6 chiffres par e-mail (10 min) → jeton signé 30 jours.
 * Chaque appel vérifie le jeton ET que l'e-mail est toujours dans l'équipe. Rien ne change pour l'ancien espace (Google).
 * Routes : POST ?app=tlogin {e} · POST ?app=tverify {e,c} · POST ?app=team {a,p,t} · GET ?teamapp=1 (le HTML de la page, pour Firebase). */
var TEAM_ME_ = '';
var TEAM_TOK_DAYS = 30;
function teamB64_(s) { return Utilities.base64EncodeWebSafe(s).replace(/=+$/, ''); }
function teamSig_(payload) { return teamB64_(Utilities.computeHmacSha256Signature('team-web|' + payload, docSecret_())); }
function teamAllowed_(e) { e = String(e || '').trim().toLowerCase(); return !!e && (e === owner_() || team_().indexOf(e) >= 0); }
function teamTok_(t) {
  t = String(t || ''); var i = t.indexOf('.'); if (i < 1) return '';
  var payload = '';
  try { payload = Utilities.newBlob(Utilities.base64DecodeWebSafe(t.slice(0, i))).getDataAsString(); } catch (x) { return ''; }
  if (teamSig_(payload) !== t.slice(i + 1)) return '';
  var p = payload.split('|'), e = p[0], exp = Number(p[1]) || 0;
  if (!exp || Date.now() > exp) return '';
  return teamAllowed_(e) ? e : '';
}
function teamLogin_(body) {
  var x = {}; try { x = JSON.parse(body || '{}') || {}; } catch (z) { x = {}; }
  var e = cliMail_(x.e);
  if (!e) return { ok: false, err: 'email' };
  if (!teamAllowed_(e)) return { ok: false, err: 'acces' };
  var c = CacheService.getScriptCache(), h = cliHash_(e), n = Number(c.get('tln:' + h)) || 0;
  if (n >= 6 || !cliQuota_('mail', 300)) return { ok: false, err: 'quota' };
  c.put('tln:' + h, String(n + 1), 3600);
  var code = String(Math.floor(100000 + Math.random() * 900000));
  c.put('tlc:' + h, code, 600); c.remove('tla:' + h);
  MailApp.sendEmail({ to: e, subject: 'Espace équipe Rafai Limousine : code ' + code, name: 'Rafai Limousine', replyTo: TEAM_EMAIL,
    body: 'Votre code de connexion à l’Espace équipe : ' + code + '\nIl est valable 10 minutes.\n\nSi vous n’avez rien demandé, ignorez cet e-mail.',
    htmlBody: '<div style="font-family:Helvetica,Arial,sans-serif;max-width:460px;margin:0 auto;padding:24px;color:#111113">' +
      '<div style="color:#B8904F;letter-spacing:.2em;font-weight:800;font-size:13px">RAFAI LIMOUSINE · ÉQUIPE</div>' +
      '<h1 style="font-size:20px;margin:16px 0 8px">Votre code de connexion</h1>' +
      '<div style="font-size:34px;font-weight:800;letter-spacing:.2em;margin:14px 0">' + code + '</div>' +
      '<p style="color:#555;font-size:14px;line-height:1.5">Saisissez-le dans l’Espace équipe. Il est valable 10 minutes.<br>Si vous n’avez rien demandé, ignorez cet e-mail.</p></div>' });
  return { ok: true };
}
function teamVerify_(body) {
  var x = {}; try { x = JSON.parse(body || '{}') || {}; } catch (z) { x = {}; }
  var e = cliMail_(x.e), code = String(x.c || '').replace(/\D/g, '');
  if (!e || !teamAllowed_(e)) return { ok: false, err: 'acces' };
  var c = CacheService.getScriptCache(), h = cliHash_(e), a = Number(c.get('tla:' + h)) || 0, good = c.get('tlc:' + h);
  if (a >= 5) return { ok: false, err: 'quota' };
  if (!good || code !== good) { c.put('tla:' + h, String(a + 1), 600); return { ok: false, err: 'code' }; }
  c.remove('tlc:' + h); c.remove('tla:' + h);
  var payload = e + '|' + (Date.now() + TEAM_TOK_DAYS * 864e5);
  try { log_('', 'Connexion Espace équipe (web)', e, e); } catch (z) {}
  return { ok: true, e: e, t: teamB64_(payload) + '.' + teamSig_(payload) };
}
function teamHttp_(body) {
  var x = {}; try { x = JSON.parse(body || '{}') || {}; } catch (z) { x = {}; }
  var e = teamTok_(x.t);
  if (!e) return cliOut_({ ok: false, err: 'auth' });
  TEAM_ME_ = e;
  try { return cliOut_({ ok: true, r: api(String(x.a || ''), x.p || {}) }); }
  catch (err) { return cliOut_({ ok: false, err: String((err && err.message) || err).slice(0, 300) }); }
  finally { TEAM_ME_ = ''; }
}
/* Ancienne adresse Google de l'Espace équipe : fermée le 12 nov. 2026 (demande de Yassine) → page « nouvelle adresse ».
 * Pour la rouvrir : TEAM_OLD_CLOSED = false, puis nouvelle version du déploiement de l'équipe. */
var TEAM_OLD_CLOSED = true;
var TEAM_NEW_URL = 'https://rafai-equipe.web.app';
function teamMovedHtml_() {
  return '<!doctype html><html><head><meta charset="utf-8"><base target="_top"></head><body style="margin:0;font-family:Helvetica,Arial,sans-serif;background:#0b0b0c;color:#f6f1e7;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center">' +
    '<div style="padding:28px;max-width:420px"><div style="color:#E0BA6C;letter-spacing:.24em;font-weight:800;font-size:12px">RAFAI LIMOUSINE · ÉQUIPE</div>' +
    '<h1 style="font-family:Georgia,serif;font-weight:600;font-size:26px;margin:16px 0 10px">L’Espace équipe a changé d’adresse</h1>' +
    '<p style="color:rgba(246,241,231,.7);font-size:15px;line-height:1.5;margin:0 0 22px">Il est plus rapide. Connectez-vous avec votre e-mail : vous recevrez un code.</p>' +
    '<a href="' + TEAM_NEW_URL + '" target="_top" style="display:inline-block;padding:15px 26px;border-radius:14px;background:linear-gradient(135deg,#f0d394,#d9b36a 45%,#b8873f);color:#16110a;font-weight:800;text-decoration:none">Ouvrir le nouvel Espace équipe</a>' +
    '<p style="margin:18px 0 0;font-size:13px;color:rgba(246,241,231,.5)">' + TEAM_NEW_URL.replace('https://', '') + '</p></div></body></html>';
}
