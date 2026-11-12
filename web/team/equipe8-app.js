/* ---------- rlTeam8 v1 (12 nov. 2026, demande de Yassine) ----------
 * Nouvelle course : un seul prix (le « Prix estimé » en double est caché) → Prix HT + TVA 10 % ou 20 % + Total TTC.
 * Le prix client enregistré (et le prix estimé) = Total TTC. */
function priceBoxInit(){
  var nb=$('#newBox'),po=$('#npo');if(!nb||!po||po.dataset.rl)return;
  var est=$('[data-k="price"]',nb);if(est){var lb=est.closest('label');if(lb)lb.style.display='none'}
  var lab=po.closest('label');if(!lab)return;
  po.id='npoHT';po.dataset.rl='1';po.setAttribute('inputmode','decimal');po.placeholder='Montant hors taxes';
  var first=lab.firstChild;if(first&&first.nodeType===3)first.nodeValue='Prix HT (€)';
  var hid=document.createElement('input');hid.type='hidden';hid.id='npo';lab.appendChild(hid);
  lab.insertAdjacentHTML('afterend','<label class="f">TVA<select id="npoVat"><option value="10">10 % (transport de personnes)</option><option value="20">20 %</option></select></label>'+
    '<div class="ttcbox" id="npoTtc"><span>TVA <b id="npoTva">—</b></span><span>Total TTC <b id="npoTot">—</b></span></div>');
  function num(v){v=String(v||'').replace(/\s/g,'').replace(',','.').replace(/[^0-9.]/g,'');return v===''?NaN:Number(v)}
  function f2(n){return (Math.round(n*100)/100).toFixed(2).replace('.',',')+' €'}
  function upd(){var ht=num(po.value),r=Number($('#npoVat').value)||10;
    if(!(ht>=0)){hid.value='';$('#npoTva').textContent='—';$('#npoTot').textContent='—';if(est)est.value='';return}
    var tva=Math.round(ht*r)/100,ttc=Math.round((ht+tva)*100)/100;hid.value=String(ttc);if(est)est.value=String(ttc);
    $('#npoTva').textContent=f2(tva);$('#npoTot').textContent=f2(ttc)}
  po.addEventListener('input',upd);$('#npoVat').addEventListener('change',upd);upd();
}
