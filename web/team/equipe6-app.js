/* ---------- rlTeam6 v1 (12 nov. 2026, demande de Yassine : « c'est super long ») ----------
 * - Ouverture instantanée : la dernière liste (courses, clients, chauffeurs) s'affiche tout de suite depuis l'appareil,
 *   puis se met à jour toute seule dès que Google répond.
 * - Factures : même principe (dernière liste tout de suite, mise à jour derrière).
 * - Adresses : comme le site internet — propositions immédiates (Base Adresse Nationale + OpenStreetMap, gratuits, sans clé),
 *   Google Maps seulement si elles ne trouvent rien. */
(function(){
  var _c=call,K='rl_c_';
  function get(k){try{var v=localStorage.getItem(K+k);return v?JSON.parse(v):null}catch(e){return null}}
  function put(k,v){try{localStorage.setItem(K+k,JSON.stringify(v))}catch(e){try{localStorage.removeItem(K+k)}catch(z){}}}
  function fast(q){
    function g(u,ms){var c=('AbortController' in window)?new AbortController():null;if(c)setTimeout(function(){c.abort()},ms);return fetch(u,c?{signal:c.signal,credentials:'omit'}:{credentials:'omit'}).then(function(r){if(!r.ok)throw 0;return r.json()})}
    var ban=g('https://data.geopf.fr/geocodage/search?limit=5&autocomplete=1&lat=48.8566&lon=2.3522&q='+encodeURIComponent(q),1400).then(function(j){
      return (j.features||[]).map(function(f){var p=f.properties||{},c=(f.geometry&&f.geometry.coordinates)||[];
        return {addr:[p.name||p.label,[p.postcode,p.city].filter(Boolean).join(' '),'France'].filter(Boolean).join(', '),lat:Number(c[1]),lng:Number(c[0]),zip:p.postcode||'',city:p.city||'',types:['street_address']}})}).catch(function(){return []});
    var osm=g('https://photon.komoot.io/api/?limit=5&lang=fr&lat=48.8566&lon=2.3522&q='+encodeURIComponent(q),3500).then(function(j){
      return (j.features||[]).map(function(f){var p=f.properties||{},c=(f.geometry&&f.geometry.coordinates)||[],st=[p.housenumber,p.street].filter(Boolean).join(' '),poi=!!p.name&&p.name!==st;
        var t=poi?(/aerodrome|airport|terminal/.test(String(p.osm_value))?['airport','point_of_interest']:['point_of_interest','establishment']):['street_address'];
        return {addr:[p.name||st,poi?st:'',[p.postcode,p.city].filter(Boolean).join(' '),p.country].filter(Boolean).join(', '),lat:Number(c[1]),lng:Number(c[0]),zip:p.postcode||'',city:p.city||'',types:t}})}).catch(function(){return []});
    // réponse dès qu'OpenStreetMap a trouvé (≈0,1 s) ; la Base Adresse Nationale s'ajoute si elle répond à temps
    return new Promise(function(res){
      var R={b:null,o:null},done=false;
      function out(){if(done)return;done=true;var b=R.b||[],o=R.o||[],first=/^\s*\d/.test(q)?b.concat(o):o.concat(b),seen={},l=[];
        first.forEach(function(x){var k=String(x.addr).toLowerCase().replace(/\W+/g,'');if(!x.addr||seen[k]||!isFinite(x.lat)||!isFinite(x.lng))return;seen[k]=1;l.push(x)});l=l.filter(function(x){return /France$/.test(x.addr)}).concat(l.filter(function(x){return !/France$/.test(x.addr)}));res(l.slice(0,6))}
      ban.then(function(l){R.b=l;if(R.o)out()});
      osm.then(function(l){R.o=l;if(R.b||l.length>=2)setTimeout(out,R.b?0:150)});
      setTimeout(out,1500);
    });
  }
  call=function(a,p){
    p=p||{};
    if(a==='geo'&&p.q){
      var q=String(p.q).slice(0,160);
      return fast(q).then(function(l){if(l.length>=2)return {results:l};return _c(a,p).then(function(d){var g=(d&&d.results)||[];return {results:l.concat(g).slice(0,6)}}).catch(function(){return {results:l}})});
    }
    if(a==='valList'){
      var h2=get('valList'),f2=_c(a,p).then(function(d){put('valList',d);return d});
      if(!h2)return f2;
      f2.then(function(d){S.inv=d.list||[];try{if(S.view==='invoices')invList()}catch(e){}}).catch(function(){});
      return Promise.resolve(h2);
    }
    return _c(a,p);
  };
  // ouverture : la liste gardée sur l'appareil s'affiche tout de suite (voir call() de la page Firebase), puis la vraie arrive ici
  window.rlFresh=function(a,d){
    if(a!=='init'||!d||!d.bookings)return;
    S.me=d.me;S.isOwner=d.isOwner;S.canDel=!!d.canDel;S.bookings=d.bookings;S.drivers=d.drivers;S.clients=d.clients||[];S.settings=d.settings;S.statuses=d.statuses;
    S.cars=d.cars;S.services=d.services;S.pays=d.pays;S.langs=d.langs;S.sheetUrl=d.sheetUrl;if(d.ntf){S.ntf=d.ntf;try{bellRender()}catch(e){}}
    var fr=S.bookings.filter(function(b){return !S.seen[b.ref]});S.bookings.forEach(function(b){S.seen[b.ref]=1});
    try{render()}catch(e){}try{if(fr.length)newAlert(fr)}catch(e){}
  };
})();
