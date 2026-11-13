/* ---------- rlTeam12 (13 nov. 2026, demande de Yassine) ----------
 * Plusieurs courses pour un même client, payées en une seule fois (un seul lien Stripe pour le total).
 * - createGroup_  : « Nouvelle course » avec des courses en plus (p.more) : une réf. par course, toutes liées par la colonne « Paiement groupé » (= réf. de la 1re course).
 * - grpInfo_      : état du groupe (courses, prix, payé ou non, reste à payer).
 * - grpPayLink_   : un seul lien Stripe Checkout, une ligne par course, le total à payer. Feuille Paiements : une ligne par course (même session), Motif « Groupe <réf> · … ».
 * - grpPaid_      : appelé par payCheck_ quand la session est payée : toutes les courses du groupe passent « Payé » (chacune avec son montant).
 *
 * Branchements dans Code.gs :
 * - BOOK_COLS    : grp: 'Paiement groupé' ; ADMIN_KEYS : + 'grp'
 * - api          : case 'createBooking' → createGroup_ si p.more ; case 'grpInfo' ; case 'grpPayLink'
 * - payCheck_    : montant de la ligne (pas le total) pour une ligne « Groupe », puis grpPaid_ ; le client reçoit un seul message « payé »
 * - cliAfterPay_ : 3e paramètre quiet (pas de message « payé » pour les autres courses du groupe ; la confirmation avec chauffeur part quand même)
 * - payLink_     : ne reprend pas un lien de groupe pour le paiement d'une seule course */
var GRP_MAX = 30;
function createGroup_(p, me) {
  var more = (p.more || []).slice(0, GRP_MAX - 1);
  var base = JSON.parse(JSON.stringify(p.fields || {}));
  more.forEach(function (x, i) {
    var n = i + 2;
    if (!String(x.date || '').trim() || !String(x.time || '').trim()) throw new Error('Course ' + n + ' : la date et l’heure sont obligatoires');
    if (!String(x.from || '').trim()) throw new Error('Course ' + n + ' : l’adresse de prise en charge est obligatoire');
  });
  var r1 = createBooking_(p, me), grp = r1.booking.ref, refs = [grp];
  more.forEach(function (x) {
    var f = JSON.parse(JSON.stringify(base));
    ['date', 'time', 'from', 'to', 'flight'].forEach(function (k) { f[k] = String(x[k] == null ? '' : x[k]); });
    f.stops = ''; f.price = '';
    refs.push(createBooking_({ fields: f, status: p.status, priceOk: x.priceOk }, me).booking.ref);
  });
  var b = book_(), out = [];
  refs.forEach(function (ref) {
    var bk = getBooking_(b, ref);
    setCells_(b, bk._row, { grp: grp });
    log_(ref, 'Paiement groupé', 'Groupe ' + grp + ' · ' + refs.length + ' courses : ' + refs.join(', '), me);
    out.push(clean_(getBooking_(b, ref)));
  });
  return { booking: out[0], bookings: out, clients: listClients_() };
}
function grpList_(b, grp) {
  var n = b.sh.getLastRow() - 1, out = [];
  if (n < 1 || !b.idx.grp || !grp) return out;
  var g = b.sh.getRange(2, b.idx.grp, n, 1).getDisplayValues(), r = b.sh.getRange(2, b.idx.ref, n, 1).getDisplayValues();
  for (var i = 0; i < n; i++) if (String(g[i][0]) === grp) out.push(getBooking_(b, String(r[i][0])));
  return out;
}
function grpPrice_(x) { var v = money_(x.priceOk) === '' ? money_(x.price) : money_(x.priceOk); return v === '' || !(v > 0) ? '' : v; }
function grpInfo_(p) {
  var b = book_(), bk = getBooking_(b, String(p.ref || '')), grp = String(bk.grp || '');
  if (!grp) return { grp: '' };
  var pa = payAll_(), due = 0, n = 0, missing = 0;
  var items = grpList_(b, grp).map(function (x) {
    var pr = grpPrice_(x), pi = pa[x.ref] || {}, st = x.status === 'Annulée' ? 'annulee' : /partenaire/i.test(x.pay || '') ? 'partenaire' : pi.paid ? 'paye' : pr === '' ? 'prix' : 'du';
    if (st === 'du') { due += pr; n++; } else if (st === 'prix') missing++;
    return { ref: x.ref, date: x.date, time: x.time, from: x.from, to: x.to, price: pr === '' ? null : pr, st: st };
  });
  return { grp: grp, items: items, due: Math.round(due * 100) / 100, n: n, missing: missing, ready: !!stripeKey_() };
}
function grpPayLink_(p, me) {
  if (!stripeKey_()) throw new Error('Stripe n’est pas encore branché (clé STRIPE_SECRET manquante).');
  var b = book_(), bk = getBooking_(b, String(p.ref || '')), grp = String(bk.grp || '');
  if (!grp) throw new Error('Cette course ne fait pas partie d’un paiement groupé.');
  var items = [];
  grpList_(b, grp).forEach(function (x) {
    if (x.status === 'Annulée' || /partenaire/i.test(x.pay || '')) return;
    if (payCheck_(x.ref).paid) return;
    var pr = grpPrice_(x);
    if (pr === '') throw new Error('Prix client pas encore fixé pour la course ' + x.ref + '.');
    items.push({ b: x, cents: Math.round(pr * 100) });
  });
  if (!items.length) return { paid: true };
  var total = 0; items.forEach(function (it) { total += it.cents; });
  var key = items.map(function (it) { return it.b.ref + ':' + it.cents; }).sort().join(','), bySid = {}, reuse = '';
  payRows_().forEach(function (r) { if (r.reason.indexOf('Groupe ' + grp + ' ') === 0 && r.url) (bySid[r.sid] = bySid[r.sid] || []).push(r); });
  Object.keys(bySid).forEach(function (sid) {
    var rs = bySid[sid], t = payMs_(rs[0].created);
    if (rs.some(function (r) { return r.status !== 'En attente'; }) || (t && Date.now() - t > 20 * 3600000)) return;
    if (rs.map(function (r) { return r.ref + ':' + Math.round(r.amount * 100); }).sort().join(',') === key) reuse = rs[0].url;
  });
  if (reuse) return { paid: false, url: reuse, amount: total / 100, n: items.length };
  var L = items[0].b, en = langCode_(L.lang) === 'en';
  var back = CLI_APP_URL + '#ride=' + encodeURIComponent(L.ref) + '&c=' + docToken_(L.ref, 'client');
  var q = {
    mode: 'payment', locale: 'auto', client_reference_id: grp, 'metadata[ref]': L.ref, 'metadata[group]': grp, 'metadata[origin]': 'équipe', 'metadata[type]': 'groupe',
    'payment_intent_data[description]': ('Rafai Limousine · Groupe ' + grp + ' · ' + items.length + ' courses').slice(0, 480),
    'payment_intent_data[metadata][ref]': L.ref, 'payment_intent_data[metadata][group]': grp, 'payment_intent_data[metadata][type]': 'groupe',
    'payment_intent_data[setup_future_usage]': 'off_session', customer_creation: 'always',
    'custom_text[submit][message]': en
      ? 'Your card is saved securely by Stripe. If you request extra hours, waiting time or an additional service, the supplement will be charged to this card and you will receive a receipt by e-mail.'
      : 'Votre carte est enregistrée de façon sécurisée par Stripe. Si vous demandez des heures en plus, de l’attente ou un service supplémentaire, le supplément sera prélevé sur cette carte et vous recevrez un reçu par e-mail.',
    success_url: back + '&paid=1', cancel_url: back
  };
  items.forEach(function (it, i) {
    var x = it.b, k = 'line_items[' + i + ']';
    q[k + '[quantity]'] = '1';
    q[k + '[price_data][currency]'] = 'eur';
    q[k + '[price_data][unit_amount]'] = String(it.cents);
    q[k + '[price_data][product_data][name]'] = ((x.service || 'Course') + ' · ' + ddmmyyyy_(x.date) + (x.time ? ' ' + x.time : '')).slice(0, 250);
    q[k + '[price_data][product_data][description]'] = (String(x.from || '') + (x.to ? ' → ' + x.to : '') + ' · Réf. ' + x.ref).slice(0, 480);
  });
  if (validEmail_(L.email)) q.customer_email = String(L.email).trim();
  var s = stripe_('post', 'checkout/sessions', q), sh = paySheet_();
  var reason = 'Groupe ' + grp + ' · ' + items.length + ' courses · total ' + (total / 100).toFixed(2).replace('.', ',') + ' €';
  items.forEach(function (it) { sh.appendRow([it.b.ref, s.id, it.cents / 100, 'En attente', now_(), '', String(it.b.email || L.email || ''), s.url, 'Course', reason, '', '']); });
  log_(L.ref, 'Lien de paiement groupé', reason + ' (' + items.map(function (it) { return it.b.ref; }).join(', ') + ')', me);
  return { paid: false, url: s.url, amount: total / 100, n: items.length };
}
/* Session de groupe payée : les autres lignes de la même session passent « Payé », chacune avec son montant */
function grpPaid_(p, s, at) {
  var sh = paySheet_(), cus = String(s.customer || ''), pi = String(s.payment_intent || '');
  payRows_().forEach(function (r) {
    if (r.sid !== p.sid || r.row === p.row || r.status !== 'En attente') return;
    sh.getRange(r.row, 3, 1, 4).setValues([[r.amount, 'Payé', r.created, at]]);
    sh.getRange(r.row, 11, 1, 2).setValues([[cus, pi]]);
    try { log_(r.ref, 'Paiement en ligne reçu', r.amount.toFixed(2).replace('.', ',') + ' € · carte (Stripe) · ' + r.reason, 'client'); } catch (e) {}
    try { cliAfterPay_(r.ref, r.amount, true); } catch (e) {}
  });
}
