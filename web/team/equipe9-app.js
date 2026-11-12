/* ---------- rlTeam9 v1 (12 nov. 2026, demande de Yassine) : onglet « Fournisseurs » ----------
 * Fiches fournisseurs : affiliés GNet + sociétés qui nous ont écrit avec leurs coordonnées (feuille « Fournisseurs », voir fournisseurs.gs).
 * Liste avec recherche et filtres (Tous / GNet / E-mail / Ajoutés), fiche modifiable, ajout et suppression (confirmation en 2 clics).
 * Boutons rapides sur la fiche : Écrire, Appeler, WhatsApp. La dernière liste est gardée sur l'appareil (ouverture instantanée). */
var SPI='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></svg>';
var SP={q:'',f:'all',list:null,busy:0};
function spName(s){return [s.fn,s.ln].filter(Boolean).join(' ')}
function spTitle(s){return s.co||spName(s)||s.id}
function spById(id){return (SP.list||[]).filter(function(s){return s.id===id})[0]}
function spNz(t){return String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()}
function spKind(s){var x=String(s.src||'');return /gnet/i.test(x)&&!/e-mail/i.test(x)?'gnet':/e-mail/i.test(x)?'mail':'hand'}
function spTel(t){var d=String(t||'').split(/[·\/,;]/)[0].replace(/[^\d+]/g,'');if(!d)return'';if(d[0]==='+')return d.slice(1);if(d.slice(0,2)==='00')return d.slice(2);if(d[0]==='0'&&d.length===10)return '33'+d.slice(1);return d}
function spNav(){
  var t=document.getElementById('tabs');
  if(t&&!t.querySelector('[data-v="sup"]')){
    var b=document.createElement('button');b.dataset.v='sup';b.type='button';b.innerHTML=SPI+'Fournisseurs';
    var c1=t.querySelector('[data-v="clients"]');t.insertBefore(b,c1?c1.nextSibling:null);
    b.addEventListener('click',function(){go('sup')});
  }
  var n=document.getElementById('bnav');
  if(n&&n.children.length&&!n.querySelector('[data-v="sup"]')){
    var c=document.createElement('button');c.dataset.v='sup';c.type='button';c.innerHTML=SPI+'Fournisseurs';
    var c2=n.querySelector('[data-v="clients"]');n.insertBefore(c,c2?c2.nextSibling:null);
    c.addEventListener('click',function(){go('sup')});
  }
  if(S.view==='sup')$$('#tabs button,#bnav button').forEach(function(x){x.classList.toggle('on',x.dataset.v==='sup')});
}
function spSet(list){SP.list=list||[];try{if(window.rlTeam&&rlTeam.cput)rlTeam.cput('sup',SP.list)}catch(e){}}
function spLoad(){
  if(SP.busy)return;SP.busy=1;
  call('suppliers',{}).then(function(r){SP.busy=0;spSet(r.suppliers);if(S.view==='sup'&&!document.querySelector('#sheet.on'))renderSup()})
    .catch(function(e){SP.busy=0;if(!SP.list){var el=$('#spList');if(el)el.innerHTML='<div class="empty"><b>Liste indisponible</b>'+esc(String(e&&e.message||e))+'</div>'}});
}
function renderSup(){
  var L=SP.list||[],cnt={all:L.length,gnet:0,mail:0,hand:0};L.forEach(function(s){cnt[spKind(s)]++});
  var seg=[['all','Tous'],['gnet','GNet'],['mail','Nous ont écrit'],['hand','Ajoutés']];
  $('#app').innerHTML='<div class="head"><div><div class="eyb">Partenaires</div><h1>Fournisseurs</h1><p>'+(SP.list?L.length+' fournisseur(s) · affiliés GNet et sociétés qui nous ont écrit':'Chargement…')+'</p></div>'+
    '<button class="btn dark" id="addSup">'+I.plus+'Ajouter un fournisseur</button></div>'+
    '<div class="filters"><label class="search">'+I.search+'<input id="spq" type="search" autocomplete="off" placeholder="Société, nom, ville, pays, e-mail…" value="'+esc(SP.q)+'"></label></div>'+
    '<div class="cpseg spseg">'+seg.map(function(x){return '<button type="button" data-spf="'+x[0]+'"'+(SP.f===x[0]?' class="on"':'')+'>'+x[1]+' <span>'+cnt[x[0]]+'</span></button>'}).join('')+'</div>'+
    '<div id="spList"></div>';
  $('#addSup').addEventListener('click',function(){openSupplier()});
  $('#spq').addEventListener('input',function(e){SP.q=e.target.value;renderSupList()});
  $$('[data-spf]').forEach(function(b){b.addEventListener('click',function(){SP.f=b.dataset.spf;renderSup()})});
  if(SP.list)renderSupList();
  else{
    $('#spList').innerHTML='<div class="empty"><b>Chargement…</b></div>';
    try{if(window.rlTeam&&rlTeam.cget)rlTeam.cget('sup').then(function(c){if(c&&c.length&&!SP.list){SP.list=c;if(S.view==='sup')renderSup()}}).catch(function(){})}catch(e){}
  }
  spLoad();
}
function renderSupList(){
  var el=$('#spList');if(!el)return;
  var ws=spNz(SP.q).trim().split(/\s+/).filter(Boolean),d=SP.q.replace(/\D/g,'');
  var L=(SP.list||[]).filter(function(s){
    if(SP.f!=='all'&&spKind(s)!==SP.f)return false;if(!ws.length)return true;
    var hay=spNz([s.co,s.fn,s.ln,s.email,s.city,s.country,s.gnet,s.svc,s.notes,s.id].join(' '));
    if(ws.every(function(w){return hay.indexOf(w)>=0}))return true;
    return d.length>=4&&String(s.tel||'').replace(/\D/g,'').indexOf(d)>=0;
  }).sort(function(a,b){var ka=spKind(a)==='gnet'?1:0,kb=spKind(b)==='gnet'?1:0;return ka-kb||spTitle(a).localeCompare(spTitle(b))});
  if(!L.length){el.innerHTML='<div class="empty"><b>'+(SP.q?'Aucun résultat':'Aucun fournisseur ici')+'</b>'+(SP.q?'Essayez un autre mot.':'Ajoutez-en un avec le bouton « Ajouter un fournisseur ».')+'</div>';return}
  el.innerHTML='<div class="grid">'+L.map(function(s){
    var place=[s.city,s.country].filter(Boolean).join(', '),k=spKind(s);
    return '<div class="dcard spc" data-sp="'+esc(s.id)+'"><div class="dtop"><span class="av">'+esc(initials(spTitle(s)))+'</span><div style="min-width:0"><div class="dname">'+esc(spTitle(s))+'</div>'+
      '<div class="dsub">'+esc([spName(s)&&s.co?spName(s):'',place].filter(Boolean).join(' · ')||s.id)+'</div></div></div>'+
      '<div class="spm">'+(s.email?'<span>'+esc(s.email)+'</span>':'')+(s.tel?'<span>'+esc(s.tel)+'</span>':'')+'</div>'+
      '<span class="sptag sp-'+k+'">'+esc(s.src||'Ajouté à la main')+'</span></div>';
  }).join('')+'</div>';
  $$('[data-sp]',el).forEach(function(c){c.addEventListener('click',function(){openSupplier(c.dataset.sp)})});
}
function openSupplier(id){
  var s=id?spById(id):{};if(id&&!s)return;
  var f=function(k,label,type,extra,ph){return '<label class="f'+(extra||'')+'">'+label+'<input data-s="'+k+'" type="'+(type||'text')+'" value="'+esc(s[k]||'')+'"'+(ph?' placeholder="'+esc(ph)+'"':'')+'></label>'};
  var w=spTel(s.tel),links='';
  if(id){
    links=(s.email?'<a class="btn" href="mailto:'+esc(s.email)+'">'+I.mail+'Écrire</a>':'')+
      (w?'<a class="btn" href="tel:+'+esc(w)+'">'+I.phone+'Appeler</a><a class="btn" href="https://wa.me/'+esc(w)+'" target="_blank" rel="noopener">WhatsApp</a>':'')+
      (s.site?'<a class="btn" href="https://'+esc(String(s.site).replace(/^https?:\/\//,''))+'" target="_blank" rel="noopener">Site ↗</a>':'');
  }
  var h=head(id?esc(id)+' · '+esc(s.src||''):'NOUVEAU FOURNISSEUR',id?esc(spTitle(s)):'Ajouter un fournisseur',id?esc([s.co?spName(s):'',[s.city,s.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ')):'')+
    '<div class="sb">'+(links?'<div class="row splinks">'+links+'</div>':'')+
    '<div class="box" id="spBox"><h3>Coordonnées</h3><div class="fg">'+
    f('co','Société *','text',' full')+f('fn','Prénom')+f('ln','Nom')+f('email','E-mail','email')+f('tel','Téléphone','tel','','+33 6 …')+
    f('city','Ville')+f('country','Pays')+f('site','Site web','text','','exemple.com')+f('gnet','GNet ID')+
    '<label class="f full">Services<textarea data-s="svc" placeholder="Zones, aéroports, véhicules…">'+esc(s.svc||'')+'</textarea></label>'+
    '<label class="f full">Notes<textarea data-s="notes" placeholder="Contact, tarifs, échanges…">'+esc(s.notes||'')+'</textarea></label></div>'+
    '<div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap"><button class="btn dark" id="saveSup">'+(id?'Enregistrer':I.plus+'Ajouter le fournisseur')+'</button>'+
    (id?'<button class="btn danger" id="delSup">'+I.trash+'Supprimer la fiche</button>':'')+'</div></div></div>';
  openSheet(h);
  $('#saveSup').addEventListener('click',function(e){var btn=e.currentTarget,o={id:id||''};
    $$('[data-s]',$('#spBox')).forEach(function(i){o[i.dataset.s]=i.value});
    if(!String(o.co||'').trim()&&!String(o.ln||'').trim()){toast('Indiquez la société ou le nom',true);return}
    busy(btn,true);
    call('saveSupplier',{supplier:o}).then(function(r){spSet(r.suppliers);closeSheet();if(S.view==='sup')renderSup();toast(id?'Fiche fournisseur enregistrée':'Fournisseur ajouté')})
      .catch(function(err){busy(btn,false);toast(err,true)});
  });
  var del=$('#delSup');
  if(del)del.addEventListener('click',function(){rlArm(del,'Confirmer : supprimer la fiche',function(){busy(del,true);
    call('deleteSupplier',{id:id}).then(function(r){spSet(r.suppliers);closeSheet();if(S.view==='sup')renderSup();toast('Fiche fournisseur supprimée')})
      .catch(function(err){busy(del,false);toast(err,true)})})});
}
(function(){
  if(!I.mail)I.mail='';if(!I.phone)I.phone='';
  var _render=render;
  render=function(){if(S.view==='sup'){try{navIcons();updateTitle()}catch(e){}return renderSup()}return _render.apply(this,arguments)};
  setTimeout(spNav,300);setInterval(spNav,3000);
})();
