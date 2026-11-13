/* rlTeam12 (13 nov. 2026) : plusieurs courses pour un client, un seul paiement du total
   v2 : chaque course a sa prestation, son véhicule et ses passagers (ex. 6 véhicules pour un client),
   adresses avec suggestions Google (smartAddr), véhicule et chauffeur de chaque course dans « Paiement groupé »
   v3 : « Dupliquer la course 1 » reprend toutes ses options ; bouton « Dupliquer la course » sur chaque course :
   nouvelle course pré-remplie (client, entreprise, options), regroupée avec l'originale (p.grpWith) */
(function(){
  FIELDS.grp='Paiement groupé';
  var DUP=null;
  function num(v){var n=Number(String(v==null?'':v).replace(',','.').replace(/[^\d.]/g,''));return isFinite(n)?n:0}
  function dd(d){var m=String(d||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[3]+'/'+m[2]:String(d||'')}
  function mv(k){var nb=$('#newBox'),i=nb&&$('[data-k="'+k+'"]',nb);return i?String(i.value||''):''}
  function sl(k,list,v,lab){return '<label class="f">'+lab+'<select data-g="'+k+'">'+opt(list||[],v||'','—')+'</select></label>'}
  function inp(k,lab,v,type,extra,ph,im){return '<label class="f'+(extra||'')+'">'+lab+'<input data-g="'+k+'" type="'+(type||'text')+'" value="'+esc(v||'')+'"'+(ph?' placeholder="'+ph+'"':'')+(im?' inputmode="'+im+'"':'')+'></label>'}
  function rowH(p){p=p||{};var more=!!(p.stops||p.duration||p.bags||p.notes);return '<div class="grpR" style="border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:10px">'+
    '<div class="row" style="justify-content:space-between;align-items:center"><b class="grpN">Course</b><button type="button" class="btn small" data-grp="del">Retirer</button></div>'+
    '<div class="fg" style="margin-top:8px">'+
    sl('service',S.services,p.service,'Prestation')+sl('car',S.cars,p.car,'Véhicule')+
    inp('date','Date',p.date,'date')+inp('time','Heure',p.time,'time')+
    inp('from','Départ',p.from,'text',' full','Adresse de prise en charge')+inp('to','Arrivée',p.to,'text',' full','Adresse d’arrivée')+
    inp('flight','Vol / train',p.flight,'text','','Facultatif')+inp('pax','Passagers',p.pax,'number')+
    inp('priceOk','Prix client (€)',p.priceOk,'text','','','decimal')+'</div>'+
    '<details style="margin-top:8px"'+(more?' open':'')+'><summary class="hint" style="cursor:pointer">Autres options : arrêts, durée, bagages, note</summary><div class="fg" style="margin-top:8px">'+
    inp('stops',FIELDS.stops||'Arrêts',p.stops,'text',' full')+inp('duration',FIELDS.duration||'Durée',p.duration)+inp('bags',FIELDS.bags||'Bagages',p.bags,'number')+
    '<label class="f full">'+(FIELDS.notes||'Note')+'<textarea data-g="notes">'+esc(p.notes||'')+'</textarea></label></div></details></div>'}
  function boxH(){return '<div class="box" id="grpBox"><h3>Plusieurs courses pour ce client</h3>'+
    '<div class="hint" style="margin:0 0 4px">Même client. « Dupliquer la course 1 » reprend toutes ses options : vous changez seulement ce qui est différent (véhicule, heure, adresse…). Chaque course a sa référence et son chauffeur (à assigner ensuite, comme d’habitude). Toutes les courses sont regroupées : le client paie le total en une seule fois.</div>'+
    '<div id="grpList"></div><div class="row" style="margin-top:10px;flex-wrap:wrap;gap:6px">'+
    '<button type="button" class="btn small dark" data-grp="dup">⧉ Dupliquer la course 1</button>'+
    '<button type="button" class="btn small" data-grp="add">'+I.plus+'Autre course</button></div>'+
    '<div class="hint hidden" id="grpTot" style="margin-top:10px"></div></div>'}
  function upd(){
    var L=document.querySelectorAll('#grpList .grpR'),t=$('#grpTot'),cb=$('#createB');if(!t)return;
    Array.prototype.forEach.call(L,function(r,i){var n=r.querySelector('.grpN');if(n)n.textContent='Course '+(i+2)});
    if(!L.length){t.classList.add('hidden');if(cb)cb.innerHTML=I.plus+'Créer la course';return}
    var tot=num(($('#npo')||{}).value),miss=num(($('#npo')||{}).value)>0?0:1,cars={};
    var c1=mv('car');if(c1)cars[c1]=(cars[c1]||0)+1;
    Array.prototype.forEach.call(L,function(r){var v=num(r.querySelector('[data-g="priceOk"]').value);tot+=v;if(!(v>0))miss++;var c=r.querySelector('[data-g="car"]').value;if(c)cars[c]=(cars[c]||0)+1});
    var cl=Object.keys(cars).map(function(k){return cars[k]+' × '+k}).join(', ');
    t.innerHTML='<b>Total pour le client : '+(L.length+1)+' courses · '+esc(eur(tot))+'</b>'+(cl?'<br>Véhicules : '+esc(cl):'')+(miss?'<br>Prix client manquant sur '+miss+' course'+(miss>1?'s':'')+' : il faudra le mettre avant de créer le lien de paiement.':'')+
      '<br>Après la création, assignez un chauffeur à chaque course, puis cliquez sur « Créer le lien du total » dans l’une d’elles.';
    t.classList.remove('hidden');if(cb)cb.innerHTML=I.plus+'Créer les '+(L.length+1)+' courses';
  }
  function addRow(p){
    var l=$('#grpList');if(!l)return;if(l.querySelectorAll('.grpR').length>=29){toast('29 courses en plus au maximum',true);return}
    l.insertAdjacentHTML('beforeend',rowH(p));var r=l.lastElementChild;
    ['from','to'].forEach(function(k){var i=r.querySelector('[data-g="'+k+'"]');try{if(i&&typeof smartAddr==='function')smartAddr(i,r)}catch(e){}});
    upd();var f=r.querySelector(p&&p.date?'[data-g="car"]':'[data-g="date"]');if(f)f.focus();
  }
  /* « Dupliquer la course » depuis une course : formulaire pré-rempli avec toutes ses options */
  var _ff=fieldsForm;
  fieldsForm=function(b,isNewB){if(isNewB&&DUP){var d={};Object.keys(DUP).forEach(function(k){d[k]=DUP[k]});b=d}return _ff(b,isNewB)};
  function dupNew(ref){
    var b=booking(ref);if(!b)return;
    var tel=String(b.tel||'').replace(/\D/g,'').slice(-9),em=String(b.email||'').trim().toLowerCase(),c=null;
    S.clients.forEach(function(x){if(c)return;var xt=String(x.tel||'').replace(/\D/g,'').slice(-9),xe=String(x.email||'').trim().toLowerCase();if((tel&&xt===tel)||(em&&xe===em))c=x});
    var d={};Object.keys(b).forEach(function(k){d[k]=b[k]});d.notes=String(b.notes||'').replace(/^✦ FAST TRACK VIP[^\n]*?( \/ |$)/,'');
    DUP=d;try{openNew(c||{lname:b.lname,fname:b.fname,tel:b.tel,email:b.email,lang:b.lang})}finally{DUP=null}
    S.dupOf=b.ref;
    var po=$('#npo');if(po&&b.priceOk)po.value=b.priceOk;
    var nb=$('#newBox');if(nb)nb.insertAdjacentHTML('afterbegin','<div class="hint" id="dupNote" style="margin:0 0 10px;padding:10px 12px;border:1px solid var(--line);border-radius:10px">⧉ <b>Copie de la course '+esc(b.ref)+'</b> : mêmes client et options. Changez ce qui est différent. Elle sera <b>regroupée avec '+esc(b.grp||b.ref)+'</b> : un seul paiement pour le total.'+(/^✦ FAST TRACK VIP/.test(String(b.notes||''))?' Le Fast Track VIP n’est pas recopié : cochez-le si besoin.':'')+'</div>');
    upd();
  }
  var _ab=assignBox;
  assignBox=function(b){var h=_ab(b);if(!b||!b.ref)return h;
    return '<div class="box" id="dupBar" style="padding:12px 14px"><div class="row" style="justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span class="hint" style="margin:0">Même client, autre véhicule ou autre heure ? Copie avec toutes les options, regroupée avec cette course.</span>'+
      '<button type="button" class="btn small dark" data-dupb="'+esc(b.ref)+'">⧉ Dupliquer la course</button></div></div>'+h};

  var _on=openNew;
  openNew=function(){if(!DUP)S.dupOf=null;var r=_on.apply(this,arguments);try{var cb=$('#createB'),rw=cb&&cb.closest('.row');if(rw&&!$('#grpBox'))rw.insertAdjacentHTML('beforebegin',boxH())}catch(e){}return r};
  document.addEventListener('input',function(e){var t=e.target;if(t&&(t.id==='npo'||(t.closest&&t.closest('#grpList'))))upd()});
  document.addEventListener('change',function(e){var t=e.target;if(t&&t.closest&&(t.closest('#grpList')||(t.matches&&t.matches('#newBox [data-k="car"]'))))upd()});

  var _c=call;
  call=function(name,p){
    var grouped=false;
    if(name==='createBooking'&&p){
      if(S.dupOf&&S.open==='new'&&!p.grpWith){p.grpWith=S.dupOf;grouped=true}
      var rs=document.querySelectorAll('#grpList .grpR');
      if(!p.more&&rs.length){p.more=Array.prototype.map.call(rs,function(r){var o={};Array.prototype.forEach.call(r.querySelectorAll('[data-g]'),function(x){o[x.dataset.g]=String(x.value||'').trim()});return o});grouped=true}
    }
    var pr=_c.apply(this,arguments);
    if(grouped&&pr&&pr.then)return pr.then(function(r){
      if(r&&r.bookings){r.bookings.forEach(function(x){upsert(x);S.seen[x.ref]=1});S.dupOf=null;
        var n=r.created||1;setTimeout(function(){toast((n>1?n+' courses créées':'Course '+r.booking.ref+' créée')+' · regroupée'+(n>1?'s':'')+' avec '+(r.grp||r.booking.ref))},60)}
      return r});
    return pr;
  };

  function grpView(d){
    var st=$('#grpSt'),ls=$('#grpLst'),mk=$('#grpMk');if(!st)return;
    if(!d||!d.grp){st.textContent='Pas de groupe.';return}
    var lab={du:'à payer',paye:'✓ payé',annulee:'annulée',partenaire:'partenaire',prix:'prix manquant'},nd=0;
    ls.innerHTML='<div style="display:grid;gap:8px;margin:0 0 10px">'+d.items.map(function(x){
      if(!x.driver&&x.st!=='annulee')nd++;
      return '<div class="row" style="justify-content:space-between;gap:8px;font-size:14px;align-items:flex-start'+(x.ref===S.open?';font-weight:600':'')+'"><span>'+
        (x.ref===S.open?esc(x.ref):'<a href="#" data-grp="open" data-ref="'+esc(x.ref)+'">'+esc(x.ref)+'</a>')+' · '+esc(dd(x.date)+' '+(x.time||''))+
        '<br><span class="hint">'+esc(String(x.from||'')+(x.to?' → '+x.to:''))+'</span>'+
        '<br><span class="hint">'+esc(x.car||'Véhicule ?')+' · '+(x.driver?esc(x.driver):'<b style="color:#B4541A">chauffeur à assigner</b>')+'</span></span>'+
        '<span style="text-align:right;white-space:nowrap">'+(x.price!=null?esc(eur(x.price)):'—')+'<br><span class="hint"'+(x.st==='paye'?' style="color:#1E7B46"':'')+'>'+lab[x.st]+'</span></span></div>'}).join('')+'</div>'+
      (nd?'<div class="hint" style="margin:0 0 10px">'+nd+' course'+(nd>1?'s':'')+' sans chauffeur : touchez la référence pour l’ouvrir et assigner.</div>':'');
    if(!d.ready){st.textContent='Stripe n’est pas encore branché.';mk.classList.add('hidden');return}
    if(!d.n&&!d.missing){st.innerHTML='<b style="color:#1E7B46">✓ Tout est payé</b> ('+d.items.length+' courses)';mk.classList.add('hidden');return}
    if(d.missing){st.textContent='Mettez le prix client sur toutes les courses du groupe avant de créer le lien ('+d.missing+' manquant'+(d.missing>1?'s':'')+').';mk.classList.add('hidden');return}
    st.innerHTML='<b>Reste à payer : '+d.n+' course'+(d.n>1?'s':'')+' · '+esc(eur(d.due))+'</b>';mk.classList.remove('hidden');
  }
  function grpLoad(ref){call('grpInfo',{ref:ref}).then(function(d){if(S.open===ref)grpView(d)}).catch(function(e){var st=$('#grpSt');if(st)st.textContent=String(e&&e.message||e)})}
  var _pb=payBox;
  payBox=function(b){
    var h=_pb(b);if(!b||!b.grp)return h;
    setTimeout(function(){grpLoad(b.ref)},0);
    return h+'<div class="box" id="grpPay"><h3>Paiement groupé · '+esc(b.grp)+'</h3><div class="hint" id="grpSt" style="margin:0 0 10px">Chargement…</div><div id="grpLst"></div>'+
      '<div class="row" style="flex-wrap:wrap;gap:6px"><button class="btn small dark hidden" type="button" id="grpMk" data-grp="link">Créer le lien du total</button>'+
      (b.tel?'<a class="btn small hidden" id="grpWa" target="_blank" href="#">'+I.wa+'Envoyer par WhatsApp</a>':'')+
      '<button class="btn small hidden" type="button" id="grpCp" data-grp="copy">Copier le lien</button></div>'+
      '<input class="hidden" id="grpUrl" readonly style="margin-top:8px;width:100%"></div>';
  };
  document.addEventListener('click',function(ev){
    var db=ev.target&&ev.target.closest&&ev.target.closest('[data-dupb]');if(db){dupNew(db.dataset.dupb);return}
    var t=ev.target&&ev.target.closest&&ev.target.closest('[data-grp]');if(!t||t.disabled)return;
    var a=t.dataset.grp;
    if(a==='add'){addRow({car:mv('car'),service:mv('service')});return}
    if(a==='dup'){var p={priceOk:($('#npo')||{}).value||''};['service','car','date','time','from','to','flight','pax','stops','duration','bags','notes'].forEach(function(k){p[k]=mv(k)});addRow(p);return}
    if(a==='del'){var r=t.closest('.grpR');if(r)r.remove();upd();return}
    if(a==='open'){ev.preventDefault();var rf0=t.dataset.ref;if(rf0)openBooking(rf0);return}
    if(a==='copy'){var u=$('#grpUrl');if(u&&u.value)copy(u.value);return}
    if(a==='link'){var rf=S.open;if(!rf)return;busy(t,true);
      call('grpPayLink',{ref:rf}).then(function(r){busy(t,false);if(r.paid){grpLoad(rf);toast('Tout est déjà payé');return}
        var u=$('#grpUrl');u.value=r.url;u.classList.remove('hidden');$('#grpCp').classList.remove('hidden');
        var b=null;S.bookings.forEach(function(x){if(x.ref===rf)b=x});
        var w=$('#grpWa');if(w&&b){w.href=waLink(b.tel,'Bonjour '+(b.fname||'')+', voici le lien pour régler vos '+r.n+' courses ('+String(eur(r.amount))+') en une seule fois, par carte ou Apple Pay : '+r.url);w.classList.remove('hidden')}
        toast('Lien du total prêt : '+eur(r.amount))}).catch(function(x){busy(t,false);toast(x,true)});
    }
  });
})();
