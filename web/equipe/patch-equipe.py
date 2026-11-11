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
CALL = r'''function call(action,payload){return rlTeam.ready().then(function(t){return fetch(rlTeam.api+'?app=team',{method:'POST',body:JSON.stringify({a:action,p:payload||{},t:t})}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok)return j.r;if(j&&j.err==='auth'){rlTeam.forget();return call(action,payload)}throw new Error((j&&j.err)||'Erreur réseau')})}).catch(function(e){throw (e&&e.message)?e.message:String(e)})}'''
s = pat.sub(lambda m: CALL, s)
HEAD = r'''<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#0b0b0c">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Rafai Team"><link rel="apple-touch-icon" href="/icon-192.png"><link rel="icon" href="/icon-192.png">
<style>
#rlLogin{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:24px;
  background:radial-gradient(ellipse 700px 600px at 50% 35%,rgba(201,160,99,.18),transparent 70%),#0b0b0c;color:#f6f1e7;
  font:500 16px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
#rlLogin .c{width:100%;max-width:380px;text-align:center}
#rlLogin img{width:150px}
#rlLogin .k{margin:18px 0 4px;font-size:12px;font-weight:800;letter-spacing:.24em;color:#E0BA6C}
#rlLogin h1{margin:0 0 18px;font:600 26px/1.2 Georgia,"Times New Roman",serif}
#rlLogin input{display:block;width:100%;box-sizing:border-box;margin:0 0 10px;padding:14px 15px;border-radius:13px;border:1px solid rgba(224,186,108,.35);
  background:#16161a;color:#fff;font-size:17px;outline:none;text-align:center}
#rlLogin input:focus{border-color:#E0BA6C}
#rlLogin button{display:block;width:100%;padding:15px;border:0;border-radius:14px;background:linear-gradient(135deg,#f0d394,#d9b36a 45%,#b8873f);
  color:#16110a;font-weight:800;font-size:17px;cursor:pointer}
#rlLogin button[disabled]{opacity:.65}
#rlLogin .e{min-height:20px;margin:10px 0 0;color:#ff8a8a;font-size:14px}
#rlLogin .s{margin:12px 0 0;font-size:13px;color:rgba(246,241,231,.6)}
#rlLogin a{color:#E0BA6C}
</style>
<script>
var rlTeam=(function(){
  var API='__API__',KT='rl_team_t',KE='rl_team_e',wait=null,done=null;
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(x){}return null}
  if(/[?&]logout=1/.test(location.search)){ls(KT,null);try{history.replaceState(null,'',location.pathname)}catch(x){}}
  function post(app,o){return fetch(API+'?app='+app,{method:'POST',body:JSON.stringify(o)}).then(function(r){return r.json()})}
  var ERR={email:'Adresse e-mail non valable.',acces:'Cette adresse n’a pas accès à l’Espace équipe.',quota:'Trop d’essais : réessayez plus tard.',code:'Code incorrect.',serveur:'Erreur, réessayez.'};
  function screen(){
    if(document.getElementById('rlLogin'))return;
    var d=document.createElement('div');d.id='rlLogin';
    d.innerHTML='<div class="c"><img src="/logo.png" alt="Rafai Limousine"><div class="k">ESPACE ÉQUIPE</div><h1>Connexion</h1>'+
      '<form id="rlF1"><input id="rlE" type="email" autocomplete="email" inputmode="email" placeholder="Votre e-mail" required><button id="rlB1">Recevoir un code</button></form>'+
      '<form id="rlF2" style="display:none"><input id="rlC" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="Code à 6 chiffres" required><button id="rlB2">Se connecter</button>'+
      '<div class="s">Code envoyé à <b id="rlEm"></b> · <a href="#" id="rlBack">changer</a></div></form><div class="e" id="rlErr"></div></div>';
    document.body.appendChild(d);
    var E=document.getElementById('rlE'),C=document.getElementById('rlC'),er=document.getElementById('rlErr');
    E.value=ls(KE)||'';
    document.getElementById('rlF1').onsubmit=function(ev){ev.preventDefault();var b=document.getElementById('rlB1');b.disabled=true;er.textContent='';
      post('tlogin',{e:E.value.trim()}).then(function(j){b.disabled=false;if(j&&j.ok){ls(KE,E.value.trim().toLowerCase());document.getElementById('rlF1').style.display='none';
        document.getElementById('rlF2').style.display='block';document.getElementById('rlEm').textContent=E.value.trim();C.focus()}else er.textContent=ERR[(j&&j.err)||'serveur']||ERR.serveur})
      .catch(function(){b.disabled=false;er.textContent=ERR.serveur})};
    document.getElementById('rlF2').onsubmit=function(ev){ev.preventDefault();var b=document.getElementById('rlB2');b.disabled=true;er.textContent='';
      post('tverify',{e:ls(KE),c:C.value}).then(function(j){b.disabled=false;if(j&&j.ok&&j.t){ls(KT,j.t);d.remove();var f=done;wait=null;done=null;if(f)f(j.t)}else er.textContent=ERR[(j&&j.err)||'serveur']||ERR.serveur})
      .catch(function(){b.disabled=false;er.textContent=ERR.serveur})};
    document.getElementById('rlBack').onclick=function(ev){ev.preventDefault();document.getElementById('rlF2').style.display='none';document.getElementById('rlF1').style.display='block';E.focus()};
    setTimeout(function(){(E.value?document.getElementById('rlB1'):E).focus()},50);
  }
  return{api:API,
    ready:function(){var t=ls(KT);if(t)return Promise.resolve(t);if(!wait){wait=new Promise(function(r){done=r});if(document.body)screen();else document.addEventListener('DOMContentLoaded',screen)}return wait},
    forget:function(){ls(KT,null)},
    logout:function(){ls(KT,null);location.reload()}};
})();
</script>'''.replace('__API__', api)
if re.search(r'<meta[^>]+name=.viewport', s): HEAD = HEAD.split('\n', 1)[1]
if '</head>' not in s:
    print('ARRET </head> absent'); sys.exit(1)
s = s.replace('</head>', HEAD + '\n</head>', 1)
if re.search(r'<title>', s): s = re.sub(r'<title>[^<]*</title>', '<title>Rafai Team – Espace équipe</title>', s, count=1)
else: s = s.replace('<link rel="manifest"', '<title>Rafai Team – Espace équipe</title>\n<link rel="manifest"', 1)
io.open(out, 'w', encoding='utf-8').write(s)
print('ok rlTeamWeb v1', len(s))
