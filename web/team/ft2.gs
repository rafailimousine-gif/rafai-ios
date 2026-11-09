/* ---------- rlFt v2 : Fast Track VIP ajouté à la main (9 nov. 2026, demande de Yassine) ----------
   Ajouté à la fin de Code.gs par apply-ft2.js, avec :
   - api() : case 'ftAdd'
   - createBooking_ : option Fast Track VIP du formulaire « Nouvelle course » (p.ft) → note en tête du commentaire + demande FT_<réf>
   Le prix n'est pas changé ici : sur « Nouvelle course », les 240 € s'ajoutent dans le champ « Prix client » à l'écran. */
function ftAdd_(p, me) {
  var ref = String(p.ref || '').trim();
  var ft = ftParse_(p.ft);
  if (!ft) throw new Error('Choisissez Arrivée ou Départ');
  var b = getBooking_(book_(), ref);
  if (!b) throw new Error('Course introuvable');
  if (b.status === 'Annulée') throw new Error('Cette course est annulée');
  if (ftGet_(ref)) throw new Error('Cette course a déjà un Fast Track VIP');
  var o = { k: ft.k, flight: ft.flight || String(b.flight || '').toUpperCase().slice(0, 20), pax: ft.pax, bags: ft.bags,
    sign: ft.sign, lang: ft.lang, msg: ft.msg, st: 'new', at: Date.now(), price: FT_PRICE, manual: 1 };
  ftPut_(ref, o);
  try { log_(ref, 'Fast Track VIP', 'Ajouté à la main dans l’espace équipe', String(me && me.email ? me.email : (me || ''))); } catch (e) {}
  o.ref = ref;
  return { ok: true, item: o };
}
