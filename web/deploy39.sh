#!/bin/bash
# Appli / booking.rafai-limousine.com : propositions d'adresses tout de suite pendant la frappe (10 nov. 2026, demande de Yassine).
# Dès 2 lettres : terminaux CDG, Orly, Le Bourget, Beauvais et gares (instantané), puis adresses gratuites (Base Adresse Nationale,
# OpenStreetMap), puis Google Maps comme avant. Seuls les champs Départ / Arrivée changent. Retour arrière : ~/index-avant-ac-*.html
set -e
# APERCU=1 : copie à part, mise sur une adresse d'aperçu (2 jours), la vraie page booking ne change pas
if [ -n "${APERCU:-}" ]; then rm -rf ~/bk-apercu && cp -r ~/booking ~/bk-apercu && cd ~/bk-apercu/public; else cd ~/booking/public; cp index.html ~/index-avant-ac-$(date +%Y%m%d-%H%M).html; fi
python3 - <<'PY'
import io
f='index.html'; t=io.open(f,encoding='utf-8').read()
A="if (q.length < 3) { seq++; box.classList.add('hide'); return; }"
if t.count(A)!=1: raise SystemExit('ARRET : debut du champ adresse introuvable (%d)' % t.count(A))
i=t.index(A); j=t.index('}, 400);', i)+len('}, 400);')
old=t[i:j]
if 'geoFetch({ q: q })' not in old or j-i>600: raise SystemExit('ARRET : bloc inattendu')
new=("if (q.length < 2) { seq++; box.classList.add('hide'); return; }\n"
"var my = ++seq, rlOn = (inp.id === 'from' || inp.id === 'to'), got = { loc: rlOn ? rlLocal(q) : [], fast: [], goo: [] };\n"
"function draw() { if (my === seq && document.activeElement === inp) { var l = rlMerge(got.loc, got.fast, got.goo); if (l.length) acShow(box, l, onPick); } }\n"
"if (got.loc.length) draw();\n"
"if (rlOn) rlFast(q).then(function (f) { got.fast = f; draw(); }).catch(function () {});\n"
"tm = setTimeout(function () { if (my !== seq) return; geoFetch({ q: q }).then(function (l) { got.goo = l; draw(); }).catch(function () {}); }, 250);")
t=t[:i]+new+t[j:]
B='function acAttach(inp, onPick) {'
if t.count(B)!=1: raise SystemExit('ARRET : acAttach introuvable')
lib=r'''/* propositions rapides : terminaux et gares tout de suite, puis adresses gratuites (France et monde) */
var RL_PL = (function () {
  var en = L !== 'fr', P = [];
  function add(k, n, s) { P.push({ k: k, main: n, sub: s, label: n + ', ' + s }); }
  var CDG = en ? 'Paris-Charles de Gaulle Airport (CDG)' : 'Aéroport Paris-Charles de Gaulle (CDG)', ORY = en ? 'Paris-Orly Airport (ORY)' : 'Aéroport Paris-Orly (ORY)',
      LBG = en ? 'Paris-Le Bourget Airport (LBG)' : 'Aéroport Paris-Le Bourget (LBG)', BVA = en ? 'Paris-Beauvais Airport (BVA)' : 'Aéroport Paris-Beauvais (BVA)';
  ['1', '2A', '2B', '2C', '2D', '2E', '2F', '2G', '3'].forEach(function (x) { add('cdg roissy charles de gaulle aeroport airport terminal t' + x.toLowerCase(), 'CDG – Terminal ' + x, CDG); });
  ['1', '2', '3', '4'].forEach(function (x) { add('orly ory aeroport airport terminal', 'Orly ' + x, ORY); });
  add('bourget lbg aeroport airport jet prive private', en ? 'Le Bourget – Business aviation' : 'Le Bourget – Aviation d’affaires', LBG);
  ['Jetex', 'Dassault Falcon Service', 'Signature', 'ExecuJet', 'Jet Aviation'].forEach(function (x) { add('bourget lbg aeroport airport jet prive private fbo ' + x.toLowerCase(), 'Le Bourget – ' + x, LBG); });
  ['1', '2'].forEach(function (x) { add('beauvais bva tille aeroport airport terminal', 'Beauvais – Terminal ' + x, BVA); });
  [['Gare du Nord', '75010 Paris'], ['Gare de Lyon', '75012 Paris'], ['Gare de l’Est', '75010 Paris'], ['Gare Montparnasse', '75015 Paris'], ['Gare Saint-Lazare', '75008 Paris'], ['Gare d’Austerlitz', '75013 Paris'], ['Gare de Bercy', '75012 Paris'], ['Gare TGV Aéroport CDG 2', '95700 Roissy-en-France'], ['Gare de Marne-la-Vallée – Chessy', '77700 Chessy']].forEach(function (g) { add('gare station train tgv eurostar ' + g[0].toLowerCase(), g[0], g[1] + ', France'); });
  return P;
})();
function rlNorm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'-]/g, ' '); }
function rlLocal(q) { var w = rlNorm(q).split(/\s+/).filter(Boolean); if (!w.length) return [];
  return RL_PL.filter(function (p) { var h = rlNorm(p.k + ' ' + p.main); return w.every(function (x) { return h.indexOf(x) >= 0; }); }).slice(0, 25); }
function rlGet(u, ms) { var c = ('AbortController' in window) ? new AbortController() : null; if (c) setTimeout(function () { c.abort(); }, ms);
  return fetch(u, c ? { signal: c.signal, credentials: 'omit' } : { credentials: 'omit' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
function rlFast(q) {
  var a = rlGet('https://data.geopf.fr/geocodage/search?limit=5&autocomplete=1&lat=48.8566&lon=2.3522&q=' + encodeURIComponent(q), 4000).then(function (j) {
    return (j.features || []).map(function (f) { var p = f.properties || {}, s = [p.postcode, p.city].filter(Boolean).join(' ') + ', France'; return { main: p.name || p.label, sub: s, label: (p.name || p.label) + ', ' + s, street: p.name, zip: p.postcode, city: p.city, country: 'France' }; }); }).catch(function () { return []; });
  var b = rlGet('https://photon.komoot.io/api/?limit=5&lang=' + (L === 'fr' ? 'fr' : 'en') + '&lat=48.8566&lon=2.3522&q=' + encodeURIComponent(q), 4000).then(function (j) {
    return (j.features || []).map(function (f) { var p = f.properties || {}, st = [p.housenumber, p.street].filter(Boolean).join(' '), m = p.name || st;
      var s = [p.name && st ? st : '', [p.postcode, p.city].filter(Boolean).join(' '), p.country].filter(Boolean).join(', ');
      return { main: m, sub: s, label: [m, s].filter(Boolean).join(', ') }; }).filter(function (x) { return x.main; }); }).catch(function () { return []; });
  return Promise.all([a, b]).then(function (r) { return r[1].concat(r[0]); });
}
function rlMerge() { var seen = {}, out = []; [].forEach.call(arguments, function (l) { (l || []).forEach(function (it) { var k = rlNorm(it.label || it.main); if (!k || seen[k]) return; seen[k] = 1; out.push(it); }); }); return out.slice(0, 14); }
'''
t=t.replace(B,lib+B)
io.open(f,'w',encoding='utf-8').write(t); print('appli : propositions rapides ajoutees')
PY
if [ -n "${APERCU:-}" ]; then cd ~/bk-apercu && firebase hosting:channel:deploy apercu --expires 2d --project rafai-suivi 2>&1 | grep -E "Channel URL|http|Error" | tail -3
else cd ~/booking && firebase deploy --only hosting --project rafai-suivi 2>&1 | tail -3; fi
echo FIN
