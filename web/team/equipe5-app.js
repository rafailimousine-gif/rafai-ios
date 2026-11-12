/* ---------- rlTeam5 v1 (12 nov. 2026, demandes de Yassine) ----------
 * - Adresses saisies à la main : mêmes suggestions Google Maps que le site (lieux, aéroports, FBO, code postal) — route ?app=cgeo
 * - Assignation : la catégorie du véhicule doit être celle de la course (ex. Classe E → véhicule Classe E), sinon blocage + rappel */
function vcls(t){t=String(t||'');var m=t.match(/classe\s*([a-z])\b/i);if(m)return 'Classe '+m[1].toUpperCase();if(/range\s*rover/i.test(t))return 'Range Rover';return t.trim()}
function vehOk(b,d,s){
  if(!b||!d||!b.car)return true;
  var l=allVeh(d),vr=$('input[name="veh"]:checked',s),v=l[vr?Number(vr.value):autoVeh(d,b)]||l[0],want=vcls(b.car),got=vcls((v&&(v.carType||v.car))||'');
  var old=$('#vehWarn',s);if(old)old.remove();
  if(got&&got===want)return true;
  var bx=$('#asgBtn',s),w=document.createElement('div');w.id='vehWarn';w.className='blkbar';
  w.innerHTML='⚠ Course réservée en <b>'+esc(want)+'</b>'+(got?' : le véhicule choisi est <b>'+esc(got)+'</b>.':' : le véhicule de ce chauffeur n’a pas de catégorie.')+' Choisissez un chauffeur avec une <b>'+esc(want)+'</b>, ou changez d’abord la catégorie de la course (Modifier).';
  if(bx&&bx.parentNode)bx.parentNode.insertBefore(w,bx);else toast('Catégorie du véhicule différente de la course',true);
  toast('Il faut une '+want+' pour cette course',true);
  try{w.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){}
  return false;
}
(function(){
  var _c=call;
  call=function(a,p){
    if(a==='geo'&&window.rlTeam&&rlTeam.api&&p&&p.q){
      return fetch(rlTeam.api+'?app=cgeo&lang=fr&q='+encodeURIComponent(String(p.q).slice(0,160))).then(function(r){return r.json()}).then(function(j){
        if(!j||!j.ok)throw 0;
        return {results:(j.list||[]).map(function(x){var poi=!!(x.main&&x.street&&x.main!==x.street);
          return {addr:String(x.label||''),lat:Number(x.lat),lng:Number(x.lng),zip:x.zip||'',city:x.city||'',types:poi?['point_of_interest','establishment']:['street_address']}})
          .filter(function(x){return x.addr&&isFinite(x.lat)&&isFinite(x.lng)})};
      }).catch(function(){return _c(a,p)});
    }
    return _c(a,p);
  };
})();
