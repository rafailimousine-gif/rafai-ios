/* ---------- rlTeam4 v1 (12 nov. 2026, demandes de Yassine) ----------
 * - « Se déconnecter » et « Activer Face ID » dans Réglages (encadré « Mon compte »)
 * - Clients : un appui sur la fiche l'ouvre directement
 * - Boutons rapides : l'écran change tout de suite (supprimer, accepter, refuser, bloquer), l'envoi se fait derrière ;
 *   en cas d'erreur, tout revient comme avant et le message d'erreur s'affiche */
(function(){
  var _call=call;
  function snap(){return {b:S.bookings.slice(),c:S.clients.slice()}}
  function back(z){S.bookings=z.b;S.clients=z.c;try{renderCoursesIfOpen()}catch(e){}try{if(S.view==='clients')renderClients()}catch(e){}}
  call=function(a,p){
    p=p||{};var z=null,b,c;
    try{
      if(a==='deleteBooking'&&p.ref){z=snap();S.bookings=S.bookings.filter(function(o){return o.ref!==p.ref});renderCoursesIfOpen()}
      else if(a==='saveBooking'&&p.ref&&p.status&&(b=booking(p.ref))){z=snap();S.bookings=S.bookings.map(function(o){return o.ref===p.ref?Object.assign({},o,{status:p.status,priceOk:p.priceOk||o.priceOk}):o});renderCoursesIfOpen()}
      else if(a==='unavail'&&p.ref&&(b=booking(p.ref))){z=snap();S.bookings=S.bookings.map(function(o){return o.ref===p.ref?Object.assign({},o,{status:'Annulée'}):o});renderCoursesIfOpen()}
      else if(a==='deleteClient'&&p.id){z=snap();S.clients=S.clients.filter(function(o){return o.id!==p.id});if(S.view==='clients')renderClients()}
      else if(a==='blockClient'&&p.id&&(c=clientById(p.id))){z=snap();S.clients=S.clients.map(function(o){return o.id===p.id?Object.assign({},o,{blocked:p.on!==false?'en cours…':''}):o});if(S.view==='clients')renderClients()}
    }catch(e){z=null}
    var pr=_call(a,p);
    return z?pr.catch(function(e){back(z);throw e}):pr;
  };
  function acct(){
    var app=$('#app');if(!app||$('#rlAcct',app))return;
    var h=$('.head h1',app);if(!h||String(h.textContent).trim()!=='Réglages')return;
    var hd=$('.head',app),rt=window.rlTeam,pk=!!(rt&&rt.pk),on=!!(rt&&rt.pkOn&&rt.pkOn());
    var box=document.createElement('div');box.className='box';box.id='rlAcct';
    box.innerHTML='<h3>Mon compte</h3><p class="hint" style="margin:0 0 12px">Connecté : <b>'+esc(S.me||(rt&&rt.me&&rt.me())||'')+'</b></p>'+
      '<div class="row" style="gap:8px;flex-wrap:wrap">'+(pk?'<button type="button" class="btn'+(on?'':' gold')+'" id="rlFid">'+(on?'✓ Face ID activé sur cet appareil':'Activer Face ID')+'</button>':'')+
      '<button type="button" class="btn danger" id="rlOut"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>Se déconnecter</button></div>'+
      (pk?'':'<p class="hint" style="margin:10px 0 0">Face ID : ouvrez l’Espace équipe sur equipe.rafai-limousine.com depuis l’iPhone.</p>');
    if(hd&&hd.nextSibling)app.insertBefore(box,hd.nextSibling);else app.appendChild(box);
    var out=$('#rlOut',box);out.addEventListener('click',function(){rlArm(out,'Appuyez encore pour vous déconnecter',function(){try{if(window.rlTeam){rlTeam.logout();return}}catch(e){}location.reload()})});
    var fid=$('#rlFid',box);if(fid&&!on)fid.addEventListener('click',function(){busy(fid,true);rlTeam.pkSetup().then(function(){fid.dataset.l='✓ Face ID activé sur cet appareil';busy(fid,false);fid.classList.remove('gold');toast('Face ID activé : utilisez-le à la prochaine connexion')}).catch(function(x){busy(fid,false);toast(x==='pk'?'Face ID annulé':'Face ID n’a pas pu être activé',true)})});
  }
  try{new MutationObserver(acct).observe(document.getElementById('app'),{childList:true})}catch(e){}
  document.addEventListener('click',function(e){
    var t=e.target;if(!t||!t.closest)return;var card=t.closest('.cswr>.dcard');if(!card)return;
    if(t.closest('a,button,input,select,textarea'))return;var w=card.parentNode;if(w.dataset.sw)return;
    var bt=card.querySelector('[data-cli]');if(bt)openClient(bt.dataset.cli);
  });
})();
