/* ---------- rlTeam3 v1 (12 nov. 2026, demandes de Yassine) ----------
 * - Clients : glisser une fiche vers la gauche → « Modifier » / « Supprimer » (2 appuis pour confirmer)
 * - Courses sur téléphone : lignes fines (date · client · statut / trajet · prix), CSS seulement */
function cliSwInit(el){
  $$('.dcard',el).forEach(function(card){
    var bt=card.querySelector('[data-cli]');if(!bt||(card.parentNode&&card.parentNode.classList.contains('cswr')))return;var id=bt.dataset.cli;
    var w=document.createElement('div');w.className='cswr';card.parentNode.insertBefore(w,card);
    w.innerHTML='<div class="cswa"><button type="button" class="cswb ed">'+I.edit+'<span>Modifier</span></button><button type="button" class="cswb de">'+I.trash+'<span>Supprimer</span></button></div>';
    w.appendChild(card);
    var a=w.querySelector('.cswa'),sx=0,sy=0,dx=0,base=0,W=0,drag=false,moved=false,stamp=0;
    function set(x,anim){card.style.transition=anim?'transform .2s ease':'none';card.style.transform=x?'translateX('+x+'px)':''}
    function close(){w.dataset.sw='';set(0,true);setTimeout(function(){if(!w.dataset.sw)w.classList.remove('on')},220)}
    card.addEventListener('pointerdown',function(e){if(e.button||(e.target.closest&&e.target.closest('a,button,input,select,textarea')))return;sx=e.clientX;sy=e.clientY;W=a.offsetWidth;base=w.dataset.sw==='r'?-W:0;dx=base;drag=true;moved=false});
    card.addEventListener('pointermove',function(e){if(!drag)return;var x=e.clientX-sx,y=e.clientY-sy;
      if(!moved){if(Math.abs(x)<10&&Math.abs(y)<10)return;if(Math.abs(y)>=Math.abs(x)){drag=false;return}moved=true;w.classList.add('on');
        $$('.cswr').forEach(function(o){if(o!==w&&o.dataset.sw){o.dataset.sw='';o.classList.remove('on');var c=o.querySelector('.dcard');if(c){c.style.transition='transform .2s ease';c.style.transform=''}}});
        try{card.setPointerCapture(e.pointerId)}catch(z){}}
      dx=Math.max(-W,Math.min(0,base+x));set(dx,false)});
    function up(){if(!drag)return;drag=false;if(!moved)return;stamp=Date.now();if(dx<-W/2){w.dataset.sw='r';set(-W,true)}else close()}
    card.addEventListener('pointerup',up);card.addEventListener('pointercancel',up);
    card.addEventListener('click',function(e){if(Date.now()-stamp<400){e.stopPropagation();e.preventDefault()}},true);
    a.querySelector('.ed').addEventListener('click',function(){close();openClient(id)});
    var del=a.querySelector('.de');
    del.addEventListener('click',function(){rlArm(del,'<span>Confirmer ?</span>',function(){busy(del,true);
      call('deleteClient',{id:id}).then(function(r){S.clients=r.clients;renderClients();toast('Fiche client supprimée')}).catch(function(e){busy(del,false);toast(e,true)})})});
  });
}
