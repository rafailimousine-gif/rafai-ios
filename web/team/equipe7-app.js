/* ---------- rlTeam7 v1 (12 nov. 2026 : « Factures et Historique mettent du temps ») ----------
 * Factures et Historique : la dernière liste gardée sur l'appareil s'affiche tout de suite, la nouvelle remplace derrière. */
(function(){
  if(!window.rlTeam||!rlTeam.cget)return;
  var _c=call,at={},last={},RO={
    valList:function(d){S.inv=d.list||[];if(S.view==='invoices')invList()},
    history:function(){if(S.view==='log')renderLog()}
  };
  call=function(a,p){
    if(!RO[a])return _c(a,p);
    if(last[a]&&Date.now()-(at[a]||0)<15000)return Promise.resolve(last[a]);
    var f=_c(a,p).then(function(d){at[a]=Date.now();last[a]=d;rlTeam.cput(a,d);return d});
    return rlTeam.cget(a).then(function(hit){
      if(!hit)return f;
      f.then(function(d){try{if(JSON.stringify(d)!==JSON.stringify(hit))RO[a](d)}catch(e){}}).catch(function(){});
      return hit;
    });
  };
})();
