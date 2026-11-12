# Espace équipe sur Firebase (rlTeamWeb v1, 11 nov. 2026, demande de Yassine)
# Prend la page de l'équipe (APP_HTML, servie par ?teamapp=1) et la rend autonome :
# - call(action, payload) passe par POST ?app=team (jeton) au lieu de google.script.run
# - écran de connexion : e-mail de l'équipe → code reçu par e-mail → jeton gardé 30 jours sur l'appareil
# - installable sur le téléphone (manifeste, icônes)
# usage : python3 patch-equipe.py app.html API_URL public/index.html
import io, re, sys
src, api, out = sys.argv[1], sys.argv[2], sys.argv[3]
s = io.open(src, encoding='utf-8').read()
if not s.lower().startswith('<!doctype') or 'function call(action,payload)' not in s:
    print('ARRET page equipe non reconnue'); sys.exit(1)
pat = re.compile(r"function call\(action,payload\)\{\s*return new Promise\(function\(res,rej\)\{\s*google\.script\.run[\s\S]*?\.api\(action,payload\|\|\{\}\);\s*\}\);\s*\}")
if len(pat.findall(s)) != 1:
    print('ARRET call() introuvable', len(pat.findall(s))); sys.exit(1)
CALL = r'''function call(action,payload){var net=function(){return rlTeam.ready().then(function(t){return fetch(rlTeam.api+'?app=team',{method:'POST',body:JSON.stringify({a:action,p:payload||{},t:t})}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok)return j.r;if(j&&j.err==='auth'){rlTeam.forget();return call(action,payload)}throw new Error((j&&j.err)||'Erreur réseau')})}).catch(function(e){throw (e&&e.message)?e.message:String(e)})};if(action==='init'&&rlTeam.has()){var f=net().then(function(d){rlTeam.cput('init',d);return d});return rlTeam.cget('init').then(function(c){if(c&&c.bookings){f.then(function(d){if(window.rlFresh)window.rlFresh('init',d)}).catch(function(){});return c}return f})}if(action==='init')return net().then(function(d){rlTeam.cput('init',d);return d});return net()}'''
s = pat.sub(lambda m: CALL, s)
HEAD = r'''<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, shrink-to-fit=no">
<meta name="description" content="Espace équipe Rafai Limousine : courses, clients, chauffeurs, suivi et factures.">
<link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#0b0b0c">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Rafai Team"><link rel="apple-touch-icon" href="/icon-192.png"><link rel="icon" href="/icon-192.png">
<style>
#rlLogin{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:24px;
  background:radial-gradient(ellipse 700px 600px at 50% 35%,rgba(201,160,99,.18),transparent 70%),#0b0b0c;color:#f6f1e7;
  font:500 16px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
html,body{overflow-x:hidden;overflow-x:clip;max-width:100%}
#rlLogin .c{width:100%;max-width:380px;text-align:center}
#rlLogin img{width:150px;height:auto}
#rlLogin .k{margin:18px 0 4px;font-size:12px;font-weight:800;letter-spacing:.24em;color:#E0BA6C}
#rlLogin h1{margin:0 0 18px;font:600 26px/1.2 Georgia,"Times New Roman",serif}
#rlLogin input{display:block;width:100%;box-sizing:border-box;margin:0 0 10px;padding:14px 15px;border-radius:13px;border:1px solid rgba(224,186,108,.35);
  background:#16161a;color:#fff;font-size:17px;outline:none;text-align:center}
#rlLogin input:focus{border-color:#E0BA6C}
#rlLogin button{display:block;width:100%;padding:15px;border:0;border-radius:14px;background:linear-gradient(135deg,#f0d394,#d9b36a 45%,#b8873f);
  color:#16110a;font-weight:800;font-size:17px;cursor:pointer}
#rlLogin button[disabled]{opacity:.65}
#rlLogin button.ghost{background:transparent;color:#E0BA6C;border:1px solid rgba(224,186,108,.5);margin-top:10px}
#rlLogin .or{margin:14px 0 12px;font-size:13px;color:rgba(246,241,231,.55)}
#rlLogin .e{min-height:20px;margin:10px 0 0;color:#ff8a8a;font-size:14px}
#rlLogin .s{margin:12px 0 0;font-size:13px;color:rgba(246,241,231,.6)}
#rlLogin a{color:#E0BA6C}
</style>
<script>
var rlTeam=(function(){
  var LOGO='/logo.webp',API='__API__',KT='rl_team_t',KE='rl_team_e',KP='rl_team_pk',RP='equipe.rafai-limousine.com',wait=null,done=null;
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(x){}return null}
  if(/[?&]logout=1/.test(location.search)){ls(KT,null);try{history.replaceState(null,'',location.pathname)}catch(x){}}
  function post(app,o){return fetch(API+'?app='+app,{method:'POST',body:JSON.stringify(o)}).then(function(r){return r.json()})}
  var ERR={email:'Adresse e-mail non valable.',acces:'Cette adresse n’a pas accès à l’Espace équipe.',quota:'Trop d’essais : réessayez plus tard.',code:'Code incorrect.',serveur:'Erreur, réessayez.',
    inconnue:'Face ID n’est pas encore activé sur cet appareil : connectez-vous avec un code, puis activez Face ID.',signature:'Face ID non reconnu. Réessayez.',defi:'Délai dépassé. Réessayez.',pk:'Face ID annulé.'};
  /* Face ID / Touch ID (clé d'accès) : seulement sur equipe.rafai-limousine.com */
  var PK=location.hostname===RP&&!!(window.PublicKeyCredential&&navigator.credentials&&navigator.credentials.create);
  function b2u(buf){var b=new Uint8Array(buf),s='';for(var i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  function u2b(t){t=String(t).replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';var s=atob(t),b=new Uint8Array(s.length);for(var i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b}
  function pkLogin(){return post('tpkopt',{}).then(function(o){if(!o||!o.ok)throw o&&o.err||'serveur';
    return navigator.credentials.get({publicKey:{challenge:u2b(o.c),rpId:RP,userVerification:'required',timeout:60000}}).catch(function(){throw 'pk'})}).then(function(c){
    return post('tpkauth',{id:c.id,cd:b2u(c.response.clientDataJSON),ad:b2u(c.response.authenticatorData),sig:b2u(c.response.signature)})}).then(function(j){if(!j||!j.ok||!j.t)throw j&&j.err||'serveur';ls(KP,'1');if(j.e)ls(KE,j.e);return j.t})}
  function pkAdd(t){return post('tpkopt',{t:t}).then(function(o){if(!o||!o.ok||!o.uid)throw o&&o.err||'serveur';
    return navigator.credentials.create({publicKey:{challenge:u2b(o.c),rp:{id:RP,name:'Rafai Limousine · Équipe'},user:{id:u2b(o.uid),name:o.name,displayName:o.name},
      pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{residentKey:'required',requireResidentKey:true,userVerification:'required'},attestation:'none',timeout:60000}}).catch(function(){throw 'pk'})}).then(function(c){
    var r=c.response,pub=r.getPublicKey?r.getPublicKey():null,alg=r.getPublicKeyAlgorithm?r.getPublicKeyAlgorithm():0;if(!pub)throw 'serveur';
    return post('tpkreg',{t:t,id:c.id,alg:alg,pub:b2u(pub),cd:b2u(r.clientDataJSON)})}).then(function(j){if(!j||!j.ok)throw j&&j.err||'serveur';ls(KP,'1')})}
  function finish(d,t){ls(KT,t);d.remove();var f=done;wait=null;done=null;if(f)f(t)}
  function offer(d,t){
    if(!PK||ls(KP)==='1'){finish(d,t);return}
    d.querySelector('.c').innerHTML='<img src="'+LOGO+'" width="150" height="144" alt="Rafai Limousine"><div class="k">ESPACE ÉQUIPE</div><h1>Activer Face ID ?</h1>'+
      '<p class="s" style="font-size:15px;margin:0 0 16px">La prochaine fois, connectez-vous avec Face ID (ou Touch ID), sans code par e-mail.</p>'+
      '<button id="rlPkOn">Activer Face ID</button><button id="rlPkNo" class="ghost">Plus tard</button><div class="e" id="rlErr"></div>';
    document.getElementById('rlPkNo').onclick=function(){finish(d,t)};
    document.getElementById('rlPkOn').onclick=function(){var b=this,er=document.getElementById('rlErr');b.disabled=true;er.textContent='';
      pkAdd(t).then(function(){finish(d,t)}).catch(function(x){b.disabled=false;er.textContent=ERR[x]||ERR.serveur})};
  }
  function screen(){
    if(document.getElementById('rlLogin'))return;
    var d=document.createElement('div');d.id='rlLogin';
    d.innerHTML='<div class="c"><img src="'+LOGO+'" width="150" height="144" alt="Rafai Limousine"><div class="k">ESPACE ÉQUIPE</div><h1>Connexion</h1>'+
      (PK?'<button id="rlPk" type="button">Se connecter avec Face ID</button><div class="or">ou avec un code par e-mail</div>':'')+
      '<form id="rlF1"><input id="rlE" type="email" autocomplete="email" inputmode="email" placeholder="Votre e-mail" required><button id="rlB1"'+(PK?' class="ghost"':'')+'>Recevoir un code</button></form>'+
      '<form id="rlF2" style="display:none"><input id="rlC" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="Code à 6 chiffres" required><button id="rlB2">Se connecter</button>'+
      '<div class="s">Code envoyé à <b id="rlEm"></b> · <a href="#" id="rlBack">changer</a></div></form><div class="e" id="rlErr"></div></div>';
    document.body.appendChild(d);
    var E=document.getElementById('rlE'),C=document.getElementById('rlC'),er=document.getElementById('rlErr');
    E.value=ls(KE)||'';
    var pb=document.getElementById('rlPk');
    if(pb)pb.onclick=function(){pb.disabled=true;er.textContent='';pkLogin().then(function(t){finish(d,t)}).catch(function(x){pb.disabled=false;er.textContent=ERR[x]||ERR.serveur})};
    document.getElementById('rlF1').onsubmit=function(ev){ev.preventDefault();var b=document.getElementById('rlB1');b.disabled=true;er.textContent='';
      post('tlogin',{e:E.value.trim()}).then(function(j){b.disabled=false;if(j&&j.ok){ls(KE,E.value.trim().toLowerCase());document.getElementById('rlF1').style.display='none';if(pb){pb.style.display='none';d.querySelector('.or').style.display='none'}
        document.getElementById('rlF2').style.display='block';document.getElementById('rlEm').textContent=E.value.trim();C.focus()}else er.textContent=ERR[(j&&j.err)||'serveur']||ERR.serveur})
      .catch(function(){b.disabled=false;er.textContent=ERR.serveur})};
    document.getElementById('rlF2').onsubmit=function(ev){ev.preventDefault();var b=document.getElementById('rlB2');b.disabled=true;er.textContent='';
      post('tverify',{e:ls(KE),c:C.value}).then(function(j){b.disabled=false;if(j&&j.ok&&j.t){cclear();offer(d,j.t)}else er.textContent=ERR[(j&&j.err)||'serveur']||ERR.serveur})
      .catch(function(){b.disabled=false;er.textContent=ERR.serveur})};
    document.getElementById('rlBack').onclick=function(ev){ev.preventDefault();document.getElementById('rlF2').style.display='none';document.getElementById('rlF1').style.display='block';E.focus()};
    if(!pb)setTimeout(function(){(E.value?document.getElementById('rlB1'):E).focus()},50);
  }
  function early(){if(!ls(KT)&&!wait){wait=new Promise(function(r){done=r});screen()}}
  function later(){var d=document.createElement('div');d.id='rlLogin';d.innerHTML='<div class="c"></div>';document.body.appendChild(d);
    var t=ls(KT);offer(d,t);var no=document.getElementById('rlPkNo');if(no)no.onclick=function(){ls('rl_team_pk_later','1');d.remove()};
    var on=document.getElementById('rlPkOn');if(on){var f=on.onclick;on.onclick=function(){var b=this,er=document.getElementById('rlErr');b.disabled=true;er.textContent='';pkAdd(t).then(function(){d.remove()}).catch(function(x){b.disabled=false;er.textContent=ERR[x]||ERR.serveur})}}}
  if(PK&&ls(KT)&&ls(KP)!=='1'&&!ls('rl_team_pk_later'))window.addEventListener('load',function(){setTimeout(function(){if(!document.getElementById('rlLogin'))later()},1500)});
  /* listes gardées sur l'appareil (IndexedDB : bien plus de place que localStorage) */
  var DB=null;
  function db(){if(DB)return DB;DB=new Promise(function(res,rej){try{var r=indexedDB.open('rl_team',1);r.onupgradeneeded=function(){r.result.createObjectStore('c')};r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}}catch(x){rej(x)}});return DB}
  function cget(k){return db().then(function(d){return new Promise(function(res){try{var q=d.transaction('c').objectStore('c').get(k);q.onsuccess=function(){res(q.result||null)};q.onerror=function(){res(null)}}catch(x){res(null)}})}).catch(function(){return null})}
  function cput(k,v){return db().then(function(d){return new Promise(function(res){try{var t=d.transaction('c','readwrite');t.objectStore('c').put(v,k);t.oncomplete=function(){res(true)};t.onerror=function(){res(false)}}catch(x){res(false)}})}).catch(function(){return false})}
  function cclear(){try{DB=null;indexedDB.deleteDatabase('rl_team')}catch(x){}try{Object.keys(localStorage).forEach(function(k){if(k.indexOf('rl_c_')===0)localStorage.removeItem(k)})}catch(x){}}
  try{Object.keys(localStorage).forEach(function(k){if(k.indexOf('rl_c_')===0)localStorage.removeItem(k)})}catch(x){}
  return{api:API,pk:PK,early:early,has:function(){return !!ls(KT)},cget:cget,cput:cput,pkOn:function(){return ls(KP)==='1'},pkSetup:function(){return pkAdd(ls(KT))},me:function(){return ls(KE)||''},
    ready:function(){var t=ls(KT);if(t)return Promise.resolve(t);if(!wait){wait=new Promise(function(r){done=r});if(document.body)screen();else document.addEventListener('DOMContentLoaded',screen)}return wait},
    forget:function(){ls(KT,null)},
    logout:function(){ls(KT,null);cclear();location.reload()}};
})();
</script>'''.replace('__API__', api)
s = re.sub(r'<meta[^>]+name=.viewport[^>]*>\n?', '', s)
import base64, os
_lw = os.path.join(os.path.dirname(os.path.abspath(out)), 'logo.webp')
if os.path.exists(_lw):
    HEAD = HEAD.replace("var LOGO='/logo.webp'", "var LOGO='data:image/webp;base64," + base64.b64encode(open(_lw, 'rb').read()).decode() + "'")
if '</head>' not in s:
    print('ARRET </head> absent'); sys.exit(1)
s = s.replace('</head>', HEAD + '\n</head>', 1)
if re.search(r'<title>', s): s = re.sub(r'<title>[^<]*</title>', '<title>Rafai Team – Espace équipe</title>', s, count=1)
else: s = s.replace('<link rel="manifest"', '<title>Rafai Team – Espace équipe</title>\n<link rel="manifest"', 1)
import hashlib, os
# polices Google : chargées juste après le premier affichage (n'empêchent plus la page de s'afficher)
FONTS = []
def _font(m):
    FONTS.append(m.group(1)); return ''
s = re.sub(r'<link href="(https://fonts\.googleapis\.com/css2[^"]+)" rel="stylesheet">', _font, s)
s = re.sub(r'<link rel="preconnect" href="https://fonts\.(googleapis|gstatic)\.com"( crossorigin)?>\n?', '', s)
# écran de connexion dès l'ouverture de la page
s = re.sub(r'(<body[^>]*>)', lambda m: m.group(1) + '<script>rlTeam.early()</script>', s, count=1)
# le gros script de l'appli → fichier à part, chargé en « defer » (la page s'affiche sans l'attendre)
big = None
for m in re.finditer(r'<script>([\s\S]*?)</script>', s):
    if big is None or len(m.group(1)) > len(big.group(1)): big = m
if big is not None and len(big.group(1)) > 50000:
    code = big.group(1)
    name = 'app.' + hashlib.md5(code.encode('utf-8')).hexdigest()[:10] + '.js'
    io.open(os.path.join(os.path.dirname(os.path.abspath(out)), name), 'w', encoding='utf-8').write(code)
    s = s[:big.start()] + s[big.end():]
    import json as _j
    loader = ('<script>(function(){function go(){var d=document;' + _j.dumps(FONTS) + '.forEach(function(h){var l=d.createElement("link");l.rel="stylesheet";l.href=h;d.head.appendChild(l)});'
              'var s=d.createElement("script");s.src="/' + name + '";d.body.appendChild(s)}'
              'requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(go,0)})})})()</script>')
    i = s.rfind('</body>')
    s = s[:i] + loader + '\n' + s[i:]
    print('appli', name, len(code))
io.open(out, 'w', encoding='utf-8').write(s)
print('ok rlTeamWeb v7', len(s))
