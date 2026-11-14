/* ---------- rlTeam15 (14 nov. 2026, demande de Yassine) ----------
 * Facture client Qonto sur chaque course (boîte « Facture client (Qonto) ») et sur la fiche client (boîte « Factures Qonto ») :
 * déposer le PDF Qonto, le voir, l'envoyer au client par e-mail. Le client la retrouve dans son appli (Mes courses → Factures).
 * Serveur inchangé : invUpload, invSend, valList (mêmes actions que l'onglet Factures). */
(function(){
  var QI={},loading=null;
  function dd(d){var m=String(d||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[3]+'/'+m[2]:String(d||'')}
  function nowTxt(){var d=new Date();return ('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)}
  function bk(ref){var b=null;(S.bookings||[]).forEach(function(x){if(x.ref===ref)b=x});return b}
  function invOf(ref){return (S.inv||[]).filter(function(y){return y.ref===ref})[0]||null}
  function vOf(ref){var x=invOf(ref),v={};var a=(x&&x.v)||{},q=QI[ref]||{};Object.keys(a).forEach(function(k){v[k]=a[k]});Object.keys(q).forEach(function(k){v[k]=q[k]});return v}
  function loadInv(){
    if(S.inv&&S.inv.length&&!loading)return Promise.resolve(S.inv);
    if(loading)return loading;
    loading=call('valList',{}).then(function(d){if(d&&d.list)S.inv=d.list;loading=null;return S.inv}).catch(function(e){loading=null;throw e});
    return loading;
  }
  function refresh(ref){setTimeout(function(){S.inv=null;loadInv().then(function(){fill(ref);cliDraw()}).catch(function(){})},16000)}
  function boxH(b){return '<div class="box" id="qInv" data-ref="'+esc(b.ref)+'"><h3>Facture client (Qonto)</h3><div id="qInvB" class="hint" style="margin:0">Chargement…</div></div>'}
  function fill(ref){
    var bx=$('#qInv');if(!bx||bx.dataset.ref!==ref)return;
    var el=$('#qInvB'),x=invOf(ref),v=vOf(ref),b=bk(ref)||{},h='';
    if(v.cliFile){
      h='<p style="margin:0 0 10px"><b style="color:#1E7B46">✓ Facture'+(v.cliNum?' n° '+esc(v.cliNum):'')+'</b> ajoutée le '+esc(v.cliAt||'')+(v.cliSentAt?' · envoyée le '+esc(v.cliSentAt):'')+'.<br>Le client la voit dans son appli : Mes courses → Factures.</p>'+
        '<div class="row" style="flex-wrap:wrap;gap:6px">'+(x&&x.cliUrl?'<a class="btn small" target="_blank" href="'+esc(x.cliUrl)+'">'+I.doc+'Voir le PDF</a>':'')+
        (b.email?'<button class="btn small dark" type="button" data-qinv="send">'+(v.cliSentAt?'Renvoyer':'Envoyer')+' par e-mail</button>':'')+
        '<button class="btn small" type="button" data-qinv="rep">Remplacer</button></div>';
    }
    h+='<div id="qInvUp"'+(v.cliFile?' class="hidden" style="margin-top:12px"':'')+'><p class="hint" style="margin:0 0 8px">Créez la facture dans Qonto, téléchargez le PDF et déposez-le ici : elle apparaît tout de suite dans l’appli du client (Mes courses → Factures).</p>'+
      '<div class="fg"><label class="f">N° de facture Qonto<input id="qInvNum" type="text" placeholder="Ex. F-2026-0123" value="'+esc(v.cliNum||'')+'"></label>'+
      '<label class="f">PDF de la facture<input id="qInvFile" type="file" accept="application/pdf,.pdf"></label></div>'+
      '<div class="row" style="margin-top:8px"><button class="btn small dark" type="button" data-qinv="up">Ajouter la facture</button></div></div>';
    el.className='';el.innerHTML=h;
  }
  var _pb=payBox;
  payBox=function(b){
    var h=_pb(b);if(!b||!b.ref)return h;
    setTimeout(function(){loadInv().then(function(){fill(b.ref)}).catch(function(e){var el=$('#qInvB');if(el)el.textContent='Factures indisponibles : '+String(e&&e.message||e)})},0);
    return h+boxH(b);
  };
  /* ---- fiche client ---- */
  var CLI=null;
  function cliDraw(){
    var d=$('#qCli');if(!d||!CLI)return;
    var list=(clientBookings(CLI)||[]).filter(function(b){return b&&b.ref&&b.status!=='Annulée'&&b.status!=='Message'});
    if(!list.length){d.remove();return}
    var n=0,h=list.map(function(b){var v=vOf(b.ref);if(v.cliFile)n++;
      return '<div class="row" style="justify-content:space-between;align-items:center;gap:8px;padding:9px 0;border-top:1px solid var(--line)">'+
        '<a href="#" data-qopen="'+esc(b.ref)+'" style="min-width:0;flex:1;text-decoration:none"><b>'+esc(b.ref)+'</b> · '+esc(dd(b.date))+(b.time?' '+esc(b.time):'')+'<br><span class="hint">'+esc(b.from||'')+(b.to?' → '+esc(b.to):'')+'</span></a>'+
        (v.cliFile?'<span style="color:#1E7B46;font-weight:700;white-space:nowrap">✓ '+(v.cliNum?esc(v.cliNum):'Facture')+(v.cliSentAt?' · envoyée':'')+'</span>':'<button class="btn small" type="button" data-qopen="'+esc(b.ref)+'">Déposer la facture</button>')+'</div>'}).join('');
    d.innerHTML='<h3>Factures Qonto ('+n+'/'+list.length+')</h3><p class="hint" style="margin:0 0 4px">Chaque facture déposée apparaît dans l’appli du client.</p>'+h;
  }
  var _oc=openClient;
  openClient=function(id){
    var r=_oc.apply(this,arguments);CLI=id?clientById(id):null;
    if(CLI)setTimeout(function(){
      var cb=$('#cliBox');if(!cb||$('#qCli'))return;
      var d=document.createElement('div');d.className='box';d.id='qCli';d.innerHTML='<h3>Factures Qonto</h3><p class="hint" style="margin:0">Chargement…</p>';
      cb.parentNode.insertBefore(d,cb.nextSibling);
      loadInv().then(cliDraw).catch(function(){cliDraw()});
    },0);
    return r;
  };
  document.addEventListener('click',function(ev){
    var o=ev.target&&ev.target.closest&&ev.target.closest('[data-qopen]');
    if(o){ev.preventDefault();var rf=o.dataset.qopen;openBooking(rf);setTimeout(function(){var q=$('#qInv');if(q&&q.scrollIntoView)q.scrollIntoView({block:'center',behavior:'smooth'})},350);return}
    var t=ev.target&&ev.target.closest&&ev.target.closest('[data-qinv]');if(!t||t.disabled)return;
    var bx=$('#qInv');if(!bx)return;var ref=bx.dataset.ref,b=bk(ref)||{},a=t.dataset.qinv;
    if(a==='rep'){var u=$('#qInvUp');if(u)u.classList.remove('hidden');return}
    if(a==='send'){
      if(t.dataset.arm!=='1'){t.dataset.arm='1';t.dataset.h=t.textContent;t.classList.add('danger');t.textContent='Confirmer : envoyer à '+(b.email||'')+' ?';
        setTimeout(function(){if(t.dataset.arm==='1'){t.dataset.arm='';t.classList.remove('danger');t.textContent=t.dataset.h}},5000);return}
      t.dataset.arm='';busy(t,true);
      call('invSend',{ref:ref}).then(function(){QI[ref]=QI[ref]||{};QI[ref].cliSentAt=nowTxt();toast('Facture envoyée à '+(b.email||'le client'));fill(ref);cliDraw()}).catch(function(e){busy(t,false);toast(e,true)});
      return;
    }
    if(a==='up'){
      var fi=($('#qInvFile')||{}).files;fi=fi&&fi[0];
      if(!fi){toast('Choisissez le PDF de la facture Qonto',true);return}
      if(!/pdf$/i.test(fi.type||fi.name)){toast('La facture doit être un PDF',true);return}
      if(fi.size>8*1024*1024){toast('PDF trop lourd (8 Mo maximum)',true);return}
      var num=String(($('#qInvNum')||{}).value||'').trim();
      busy(t,true);var rd=new FileReader();
      rd.onload=function(){call('invUpload',{ref:ref,num:num,type:'application/pdf',b64:String(rd.result).split(',')[1]||''}).then(function(){
        QI[ref]={cliFile:'1',cliNum:num,cliAt:nowTxt(),cliSentAt:''};toast('Facture ajoutée : visible dans l’appli du client');fill(ref);cliDraw();refresh(ref);
      }).catch(function(e){busy(t,false);toast(e,true)})};
      rd.onerror=function(){busy(t,false);toast('Lecture du fichier impossible',true)};rd.readAsDataURL(fi);
    }
  });
})();
