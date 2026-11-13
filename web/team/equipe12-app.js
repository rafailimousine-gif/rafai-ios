/* rlTeam12 (13 nov. 2026) : plusieurs courses pour un client, un seul paiement du total */
(function(){
  FIELDS.grp='Paiement groupé';
  function num(v){var n=Number(String(v==null?'':v).replace(',','.').replace(/[^\d.]/g,''));return isFinite(n)?n:0}
  function dd(d){var m=String(d||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[3]+'/'+m[2]:String(d||'')}
  function rowH(){return '<div class="grpR" style="border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:10px">'+
    '<div class="row" style="justify-content:space-between;align-items:center"><b class="grpN">Course</b><button type="button" class="btn small" data-grp="del">Retirer</button></div>'+
    '<div class="fg" style="margin-top:8px">'+
    '<label class="f">Date<input type="date" data-g="date"></label><label class="f">Heure<input type="time" data-g="time"></label>'+
    '<label class="f full">Départ<input type="text" data-g="from" placeholder="Adresse de prise en charge"></label>'+
    '<label class="f full">Arrivée<input type="text" data-g="to" placeholder="Adresse d’arrivée"></label>'+
    '<label class="f">Vol / train<input type="text" data-g="flight" placeholder="Facultatif"></label>'+
    '<label class="f">Prix client (€)<input type="text" inputmode="decimal" data-g="priceOk"></label></div></div>'}
  function boxH(){return '<div class="box" id="grpBox"><h3>Plusieurs courses pour ce client</h3>'+
    '<div class="hint" style="margin:0 0 4px">Même client et même véhicule. Chaque course garde sa référence et son chauffeur, et le client paie le total en une seule fois avec un seul lien.</div>'+
    '<div id="grpList"></div><div class="row" style="margin-top:10px"><button type="button" class="btn small" data-grp="add">'+I.plus+'Ajouter une course</button></div>'+
    '<div class="hint hidden" id="grpTot" style="margin-top:10px"></div></div>'}
  function upd(){
    var L=document.querySelectorAll('#grpList .grpR'),t=$('#grpTot'),cb=$('#createB');if(!t)return;
    Array.prototype.forEach.call(L,function(r,i){var n=r.querySelector('.grpN');if(n)n.textContent='Course '+(i+2)});
    if(!L.length){t.classList.add('hidden');if(cb)cb.innerHTML=I.plus+'Créer la course';return}
    var tot=num(($('#npo')||{}).value),miss=num(($('#npo')||{}).value)>0?0:1;
    Array.prototype.forEach.call(L,function(r){var v=num(r.querySelector('[data-g="priceOk"]').value);tot+=v;if(!(v>0))miss++});
    t.innerHTML='<b>Total pour le client : '+(L.length+1)+' courses · '+esc(eur(tot))+'</b>'+(miss?'<br>Prix client manquant sur '+miss+' course'+(miss>1?'s':'')+' : il faudra le mettre avant de créer le lien de paiement.':'')+
      '<br>Après la création, ouvrez une des courses et cliquez sur « Créer le lien du total ».';
    t.classList.remove('hidden');if(cb)cb.innerHTML=I.plus+'Créer les '+(L.length+1)+' courses';
  }
  var _on=openNew;
  openNew=function(){var r=_on.apply(this,arguments);try{var cb=$('#createB'),rw=cb&&cb.closest('.row');if(rw&&!$('#grpBox'))rw.insertAdjacentHTML('beforebegin',boxH())}catch(e){}return r};
  document.addEventListener('input',function(e){var t=e.target;if(t&&(t.id==='npo'||(t.closest&&t.closest('#grpList'))))upd()});

  var _c=call;
  call=function(name,p){
    if(name==='createBooking'&&p&&!p.more){var rs=document.querySelectorAll('#grpList .grpR');
      if(rs.length)p.more=Array.prototype.map.call(rs,function(r){var o={};Array.prototype.forEach.call(r.querySelectorAll('[data-g]'),function(x){o[x.dataset.g]=String(x.value||'').trim()});return o})}
    var pr=_c.apply(this,arguments);
    if(name==='createBooking'&&p&&p.more&&pr&&pr.then)return pr.then(function(r){
      if(r&&r.bookings){r.bookings.forEach(function(x){upsert(x);S.seen[x.ref]=1});setTimeout(function(){toast(r.bookings.length+' courses créées · paiement groupé '+r.booking.ref)},60)}
      return r});
    return pr;
  };

  function grpView(d){
    var st=$('#grpSt'),ls=$('#grpLst'),mk=$('#grpMk');if(!st)return;
    if(!d||!d.grp){st.textContent='Pas de groupe.';return}
    var lab={du:'à payer',paye:'✓ payé',annulee:'annulée',partenaire:'partenaire',prix:'prix manquant'};
    ls.innerHTML='<div style="display:grid;gap:6px;margin:0 0 10px">'+d.items.map(function(x){
      return '<div class="row" style="justify-content:space-between;gap:8px;font-size:14px'+(x.ref===S.open?';font-weight:600':'')+'"><span>'+esc(x.ref)+' · '+esc(dd(x.date)+' '+(x.time||''))+'<br><span class="hint">'+esc(String(x.from||'')+(x.to?' → '+x.to:''))+'</span></span>'+
        '<span style="text-align:right;white-space:nowrap">'+(x.price!=null?esc(eur(x.price)):'—')+'<br><span class="hint"'+(x.st==='paye'?' style="color:#1E7B46"':'')+'>'+lab[x.st]+'</span></span></div>'}).join('')+'</div>';
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
    var t=ev.target&&ev.target.closest&&ev.target.closest('[data-grp]');if(!t||t.disabled)return;
    var a=t.dataset.grp;
    if(a==='add'){var l=$('#grpList');if(!l)return;if(l.querySelectorAll('.grpR').length>=29){toast('29 courses en plus au maximum',true);return}l.insertAdjacentHTML('beforeend',rowH());upd();var n=l.lastElementChild&&l.lastElementChild.querySelector('[data-g="date"]');if(n)n.focus();return}
    if(a==='del'){var r=t.closest('.grpR');if(r)r.remove();upd();return}
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
