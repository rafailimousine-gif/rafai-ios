/* ---------- rlTeam2 v1 (12 nov. 2026, demandes de Yassine) : ajouts à l'Espace équipe (APP_HTML) ----------
 * - Nouvelle course : « Client existant » (recherche nom / téléphone / e-mail / société) ou « Nouveau client »
 * - Bouton « Nouveau client » à côté de « Nouvelle course »
 * - Fiche client : « ⛔ Bloquer » / « 🔓 Débloquer » et « Supprimer la fiche » (confirmation en 2 clics) ; badge « Bloqué »
 * - Boutons « Accepter » / « Refuser » visibles sur les nouvelles demandes (ordinateur et mobile ; glisser marche toujours)
 * - Recherche des courses : le panneau des filtres s'ouvre tout seul dès qu'on tape
 * - Bouton « Se déconnecter » (en haut, à côté d'Actualiser) */
function dActs(b){var l=swLeft(b);return l?'<div class="dacts">'+l+'</div>':''}
function cliBlkBar(b){var c=clientOf(b);return c&&c.blocked?'<div class="blkbar">⛔ Client bloqué ('+esc(cliName(c))+') depuis le '+esc(c.blocked)+'.</div>':''}
function rlArm(btn,label,fn){
  if(btn._armed){btn._armed=0;clearTimeout(btn._armT);btn.classList.remove('armed');fn();return}
  btn._armed=1;btn._old=btn.innerHTML;btn.innerHTML=label;btn.classList.add('armed');
  btn._armT=setTimeout(function(){if(btn._armed){btn._armed=0;btn.innerHTML=btn._old;btn.classList.remove('armed')}},5000);
}
function cliPickHtml(pre){
  var n=S.clients.length;
  return '<div class="box" id="cpBox"><h3>Client</h3><div class="cpseg"><button type="button" data-cpm="old"'+(n?' class="on"':'')+'>Client existant</button><button type="button" data-cpm="new"'+(n?'':' class="on"')+'>Nouveau client</button></div>'+
    '<div id="cpOld"'+(n?'':' class="hidden"')+'><label class="search cps">'+I.search+'<input id="cpQ" type="search" autocomplete="off" placeholder="Rechercher : nom, téléphone, e-mail, société…"></label><div id="cpRes" class="cpres"></div><div id="cpSel" class="cpsel hidden"></div></div>'+
    '<p id="cpNew" class="hint'+(n?' hidden':'')+'" style="margin:8px 0 0">Remplissez ses coordonnées ci-dessous : sa fiche client est créée avec la course.</p></div>';
}
function cliPickInit(pre){
  var box=$('#cpBox');if(!box)return;
  var nb=$('#newBox'),q=$('#cpQ'),res=$('#cpRes'),sel=$('#cpSel'),lab=q.parentNode;
  function nz(t){return String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()}
  function fill(c){
    ['lname','fname','tel','email','lang'].forEach(function(k){var i=$('[data-k="'+k+'"]',nb);if(!i)return;if(c)i.value=c[k]||(k==='lang'?'Français':'');else if(k!=='lang')i.value=''});
    var bk=$('[data-k="booker"]',nb);if(bk&&c&&c.company&&!bk.value)bk.value=c.company;
  }
  function draw(){
    var v=nz(q.value).trim(),d=v.replace(/\D/g,''),ws=v.split(/\s+/).filter(Boolean);
    var L=S.clients.filter(function(c){
      if(!ws.length)return true;
      var hay=nz([c.fname,c.lname,c.company,c.email,c.id,c.city].join(' '));
      if(ws.every(function(w){return hay.indexOf(w)>=0}))return true;
      return d.length>=3&&String(c.tel||'').replace(/\D/g,'').indexOf(d)>=0;
    }).sort(function(a,b){return cliName(a).localeCompare(cliName(b))});
    var n=L.length;L=L.slice(0,8);
    res.innerHTML=(L.length?L.map(function(c){return '<button type="button" class="cpi" data-cp="'+esc(c.id)+'"><span class="av">'+esc(initials(cliName(c)))+'</span><span class="cpt"><b>'+esc(cliName(c))+(c.blocked?' <span class="blk">⛔ Bloqué</span>':'')+'</b><span>'+esc([c.tel,c.email,c.company].filter(Boolean).join(' · '))+'</span></span></button>'}).join(''):
      '<div class="hint" style="padding:8px 2px">Aucun client trouvé. <a href="#" id="cpGoNew">Créer un nouveau client</a></div>')+
      (n>L.length?'<div class="hint" style="padding:4px 2px">+ '+(n-L.length)+' autre(s) : précisez la recherche</div>':'');
    $$('[data-cp]',res).forEach(function(b){b.addEventListener('click',function(){pick(clientById(b.dataset.cp))})});
    var gn=$('#cpGoNew');if(gn)gn.addEventListener('click',function(e){e.preventDefault();mode('new')});
  }
  function pick(c){
    if(!c)return;box._c=c;fill(c);res.innerHTML='';lab.classList.add('hidden');
    sel.innerHTML='<span class="av">'+esc(initials(cliName(c)))+'</span><div class="cpt" style="flex:1"><b>'+esc(cliName(c))+(c.blocked?' <span class="blk">⛔ Bloqué</span>':'')+'</b><span>'+esc([c.tel,c.email,c.company].filter(Boolean).join(' · '))+'</span></div><button type="button" class="btn small" id="cpChg">Changer</button>';
    sel.classList.remove('hidden');
    $('#cpChg').addEventListener('click',function(){box._c=null;fill(null);sel.classList.add('hidden');lab.classList.remove('hidden');q.value='';draw();q.focus()});
  }
  function mode(m){
    $$('[data-cpm]',box).forEach(function(b){b.classList.toggle('on',b.dataset.cpm===m)});
    $('#cpOld').classList.toggle('hidden',m!=='old');$('#cpNew').classList.toggle('hidden',m!=='new');
    if(m==='new'){box._c=null;fill(null);sel.classList.add('hidden');lab.classList.remove('hidden');var ln=$('[data-k="lname"]',nb);if(ln)ln.focus()}
    else if(!box._c){q.value='';draw();setTimeout(function(){q.focus()},60)}
  }
  $$('[data-cpm]',box).forEach(function(b){b.addEventListener('click',function(){mode(b.dataset.cpm)})});
  q.addEventListener('input',draw);
  var pc=pre&&pre.id?clientById(pre.id):null;
  if(pc)pick(pc);else if(S.clients.length)draw();
}
function cliActs(c,id){
  if(!id)return;var sbs=$$('#sheet .sb'),sb=sbs[sbs.length-1];if(!sb)return;
  sb.insertAdjacentHTML('beforeend','<div class="box" id="cliAct"><h3>Bloquer ou supprimer</h3>'+
    (c.blocked?'<div class="blkbar">⛔ Client bloqué depuis le '+esc(c.blocked)+' : il ne peut plus réserver dans l’appli ni sur booking.rafai-limousine.com.</div>':
      '<p class="hint" style="margin:0 0 10px">Bloquer : il ne peut plus réserver dans l’appli ni sur booking.rafai-limousine.com (aucun e-mail ne lui est envoyé). Supprimer : sa fiche est effacée, ses courses restent.</p>')+
    '<div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn'+(c.blocked?'':' danger')+'" id="cliBlk">'+(c.blocked?'🔓 Débloquer':'⛔ Bloquer')+'</button>'+
    '<button type="button" class="btn danger" id="cliDel">'+I.trash+'Supprimer la fiche</button></div></div>');
  var fail=function(btn){return function(e){busy(btn,false);toast(e,true)}};
  $('#cliBlk').addEventListener('click',function(e){var btn=e.currentTarget,on=!c.blocked;
    var go=function(){busy(btn,true);call('blockClient',{id:id,on:on}).then(function(r){S.clients=r.clients;if(S.view==='clients')renderClients();openClient(id);toast(on?'Client bloqué':'Client débloqué')}).catch(fail(btn))};
    if(on)rlArm(btn,'Confirmer le blocage',go);else go();
  });
  $('#cliDel').addEventListener('click',function(e){var btn=e.currentTarget;
    rlArm(btn,'Confirmer : supprimer définitivement',function(){busy(btn,true);
      call('deleteClient',{id:id}).then(function(r){S.clients=r.clients;closeSheet();if(S.view==='clients')renderClients();toast('Fiche client supprimée')}).catch(fail(btn))});
  });
}
(function(){
  var lo=$('#logoutBtn');
  if(lo)lo.addEventListener('click',function(){rlArm(lo,'<span class="lotx">Se déconnecter ?</span>',function(){try{if(window.rlTeam){rlTeam.logout();return}}catch(e){}location.reload()})});
  document.addEventListener('input',function(e){var t=e.target;if(!t||t.id!=='q')return;var fb=t.closest('.fbox');if(fb&&String(t.value).trim()){fb.classList.add('open');S.fOpen=true}},true);
})();
