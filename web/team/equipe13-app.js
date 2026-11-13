/* rlTeam13 (13 nov. 2026) : entreprises déjà saisies (suggestions et remplissage automatique)
   + suggestions d'adresses Google (smartAddr) sur l'adresse de facturation des courses et des fiches clients */
(function(){
  var CO=null,loading=false;
  function k(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')}
  function all(){
    var m={};
    function put(c){var kk=k(c.name);if(!kk)return;var o=m[kk]||(m[kk]={name:String(c.name).trim(),siret:'',vat:'',addr:''});['siret','vat','addr'].forEach(function(x){if(c[x]&&!o[x])o[x]=String(c[x])})}
    (CO||[]).forEach(put);
    S.bookings.slice().sort(function(a,b){return String(b.updated||b.date||'').localeCompare(String(a.updated||a.date||''))})
      .forEach(function(b){if(b.ctype==='Entreprise'&&b.coName)put({name:b.coName,siret:b.siret,vat:b.vatNo,addr:b.billAddr})});
    S.clients.forEach(function(c){if(c.company&&c.ctype==='Société')put({name:c.company,vat:c.vat,addr:[c.addr,[c.zip,c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')})});
    return m;
  }
  function fillList(){var dl=document.getElementById('rlcoList');if(!dl)return;var m=all();
    dl.innerHTML=Object.keys(m).map(function(x){var c=m[x];return '<option value="'+esc(c.name)+'">'+esc([c.siret,c.addr].filter(Boolean).join(' · '))+'</option>'}).join('')}
  function load(){fillList();if(CO||loading)return;loading=true;call('companies',{}).then(function(r){CO=(r&&r.companies)||[];fillList()}).catch(function(){CO=[]})}
  function apply(root,c,force){
    if(!root||!c)return false;
    var sel=$('select[data-k="ctype"]',root);if(sel&&sel.value!=='Entreprise'){sel.value='Entreprise';sel.dispatchEvent(new Event('change',{bubbles:true}))}
    var n=0,set=function(kk,v){var i=$('[data-k="'+kk+'"]',root);if(i&&v&&(force||!i.value)&&i.value!==v){i.value=v;n++}};
    set('coName',c.name);set('siret',c.siret);set('vatNo',c.vat);set('billAddr',c.addr);
    return n>0;
  }
  function fromClient(c){
    if(!c)return null;var m=all(),tel=String(c.tel||'').replace(/\D/g,'').slice(-9),em=String(c.email||'').trim().toLowerCase(),best=null;
    S.bookings.forEach(function(b){if(b.ctype!=='Entreprise'||!b.coName)return;
      var bt=String(b.tel||'').replace(/\D/g,'').slice(-9),be=String(b.email||'').trim().toLowerCase();
      if((tel&&bt===tel)||(em&&be===em))if(!best||String(b.date||'')>String(best.date||''))best=b});
    if(best)return m[k(best.coName)]||{name:best.coName,siret:best.siret,vat:best.vatNo,addr:best.billAddr};
    if(c.company&&c.ctype==='Société')return m[k(c.company)]||null;
    return null;
  }
  var _ff=fieldsForm;
  fieldsForm=function(b,isNewB){
    var h=_ff(b,isNewB);if(h.indexOf('data-k="coName"')<0)return h;
    setTimeout(load,0);
    return h.replace('data-k="coName"','data-k="coName" list="rlcoList" autocomplete="off"')+'<datalist id="rlcoList"></datalist>';
  };
  document.addEventListener('input',function(e){var t=e.target;if(!t||!t.matches||!t.matches('input[data-k="coName"]'))return;
    var c=all()[k(t.value)];if(c&&apply(t.closest('.rlco'),c,true))toast('Entreprise retrouvée : SIRET, TVA et adresse remplis')});
  function pickFill(c){setTimeout(function(){var nb=$('#newBox'),co=fromClient(c);if(nb&&co&&apply($('.rlco',nb),co,false))toast('Entreprise du client remplie : '+co.name)},40)}
  document.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('[data-cp]');if(t)pickFill(clientById(t.dataset.cp))});
  var _on=openNew;
  openNew=function(pre){var r=_on.apply(this,arguments);try{if(pre&&pre.id)pickFill(pre)}catch(e){}return r};
  /* suggestions d'adresses Google + carte sur les adresses de facturation */
  function geo(i,root){try{var l=i&&i.closest('label');if(l&&!l.classList.contains('addr')&&typeof smartAddr==='function')smartAddr(i,root)}catch(e){}}
  var _ef=enhanceForm;
  enhanceForm=function(root){var r=_ef.apply(this,arguments);if(root)geo($('[data-k="billAddr"]',root),root);return r};
  var _oc=openClient;
  openClient=function(){var r=_oc.apply(this,arguments);setTimeout(function(){var bx=$('#cliBox');if(bx)geo($('[data-c="addr"]',bx),bx)},0);return r};
})();
