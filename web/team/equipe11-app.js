/* rlTeam11 (13 nov. 2026) : étapes du suivi faites par l'équipe + client entreprise (raison sociale, SIRET, TVA, adresse de facturation) */
(function(){
  FIELDS.ctype='Client';FIELDS.coName='Raison sociale';FIELDS.siret='SIRET';FIELDS.vatNo='N° TVA intracom.';FIELDS.billAddr='Adresse de facturation';
  var _ff=fieldsForm;
  fieldsForm=function(b,isNewB){
    var h=_ff(b,isNewB),v=function(k){return b&&b[k]!=null?String(b[k]):''},ct=v('ctype')||(isNewB?'Particulier':''),hid=ct==='Entreprise'?'':' hidden';
    var opts=(isNewB?[]:[['','—']]).concat([['Particulier','Particulier'],['Entreprise','Entreprise']]);
    var inp=function(k,ph,extra,im){return '<label class="f rlco-e'+(extra||'')+hid+'">'+FIELDS[k]+'<input data-k="'+k+'" type="text"'+(im?' inputmode="'+im+'"':'')+' value="'+esc(v(k))+'"'+(ph?' placeholder="'+ph+'"':'')+'></label>'};
    return h+'<div class="fg rlco" style="margin-top:12px">'+
      '<label class="f">'+FIELDS.ctype+'<select data-k="ctype">'+opts.map(function(o){return '<option value="'+o[0]+'"'+(o[0]===ct?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></label>'+
      inp('coName','Nom de la société')+inp('siret','14 chiffres','','numeric')+inp('vatNo','FR + 11 chiffres')+inp('billAddr','Adresse complète',' full')+
      '</div>';
  };
  document.addEventListener('change',function(e){var t=e.target;if(!t||!t.matches||!t.matches('select[data-k="ctype"]'))return;var g=t.closest('.rlco');if(!g)return;
    Array.prototype.forEach.call(g.querySelectorAll('.rlco-e'),function(x){x.classList.toggle('hidden',t.value!=='Entreprise')})});

  var _ti=trkInner;
  trkInner=function(b){
    var h=_ti(b);if(!b||!b.driver||isClosed(b)||b.trkStatus==='Terminée')return h;
    var st=b.trkStatus||'',ord={'':0,'En route':1,'Sur place':2,'En attente':2,'À bord':3}[st]||0;
    var steps=[['enroute','En route',1],['onsite','Sur place',2],['pob','Passager à bord',3],['end','Course terminée',4]],nx=0;
    steps.forEach(function(s){if(!nx&&s[2]>ord)nx=s[2]});
    return h+'<div class="tsk" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)"><div class="hint" style="margin-bottom:8px">Le chauffeur a oublié une étape ? Faites-la à sa place :</div>'+
      '<div class="row" style="flex-wrap:wrap;gap:6px">'+steps.map(function(s){var done=s[2]<=ord;return '<button type="button" class="btn small'+(s[2]===nx?' dark':'')+'" data-tsk="'+s[0]+'"'+(done?' disabled':'')+'>'+(done?'✓ ':'')+s[1]+'</button>'}).join('')+'</div>'+
      '<label class="hint" style="display:flex;gap:8px;align-items:center;margin-top:10px;cursor:pointer"><input type="checkbox" id="tskNotify" checked> Prévenir le client, comme quand c’est le chauffeur</label>'+
      '<div class="confirm hidden" id="tskEnd" style="margin-top:10px"><b>Terminer la course '+esc(b.ref)+' ?</b><div class="hint" style="margin-top:4px">La course passe en « Terminée ». Si la case est cochée, le client reçoit le message de fin et la demande d’avis.</div>'+
      '<div class="row" style="margin-top:10px"><button class="btn dark" type="button" data-tsk="end2">Oui, terminer</button><button class="btn" type="button" data-tsk="x">Annuler</button></div></div></div>';
  };
  var TSK={enroute:'En route',onsite:'Sur place',pob:'Passager à bord',end:'Course terminée'};
  document.addEventListener('click',function(ev){
    var t=ev.target&&ev.target.closest&&ev.target.closest('[data-tsk]');if(!t||!S.open||t.disabled)return;
    var a=t.dataset.tsk,bx=$('#tskEnd');
    if(a==='end'){if(bx)bx.classList.remove('hidden');return}
    if(a==='x'){if(bx)bx.classList.add('hidden');return}
    if(a==='end2')a='end';
    var rf=S.open,nt=$('#tskNotify'),notify=!nt||nt.checked;
    busy(t,true);
    call('teamTrk',{ref:rf,action:a,notify:notify}).then(function(d){upsert(d.booking);renderCoursesIfOpen();openBooking(rf,true);toast(TSK[a]+' : enregistré'+(notify?'':' (client non prévenu)'))}).catch(function(er){busy(t,false);toast(er,true)});
  });
})();
