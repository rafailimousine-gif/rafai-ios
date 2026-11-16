#!/usr/bin/env python3
# rlBdx v1 (v2 : popup du site, fond RL Driver ; v3 : menu ≡ blanc, logo du haut blanc, RL Driver clair / sombre) — Lifting « bordeaux & blanc » (16 nov. 2026, demande de Yassine). VERSION TEST.
# Ajoute une couche de couleurs bordeaux / blanc dans les pages (site, réservation, RL Driver, suivi, espace équipe).
# Elle ne s'allume QUE sur les adresses d'aperçu Firebase « --bordeaux » (ou avec ?bdx=1) : sans effet sur les vraies adresses.
# usage : python3 theme-bdx.py APP fichier1.html [fichier2.html ...]   (APP = www | bk | suivi | team)
import io, sys
LIVE = '--live' in sys.argv
args = [a for a in sys.argv[1:] if a != '--live']
APP = args[0]
ICON = 'data:image/png;base64,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'
CSS = r'''
html.bdx{--bdxB:#7A1F33;--bdxW:#fff;--bdxR:#F1D9DE;--bdxD:#6E1A2B;--bdxDD:#5A1426}
html.bdx.bdx-www{--bg:#fff!important;--bg-alt:#f7f1ef!important;--surface:#fff!important;--ink:#2b0c14!important;--text:#4b3a3f!important;--muted:#7f6b70!important;--line:rgba(122,31,51,.16)!important;--brand:#7A1F33!important;--brand-2:#fff!important;--gold:#6E1A2B!important;--gold-2:#8E2A3F!important;--gold-ink:#fff!important;--kicker:#8E2A3F!important;color-scheme:light!important}
html.bdx-www header.hdr .appbar{background:#3A0B16!important}
html.bdx-www header.hdr.solid{background:rgba(74,15,28,.96)!important;border-color:rgba(255,255,255,.12)!important}
html.bdx-www header.hdr.solid *{color:#fff!important}
html.bdx-www header.hdr .logo img,html.bdx-www header.hdr img.logo-dark{filter:brightness(0) invert(1)!important}
html.bdx-www header.hdr .btn.book{background:#7A1F33!important;background-image:none!important;color:#fff!important;border-color:#7A1F33!important}
html.bdx-www header.hdr.solid .btn.book{background:#fff!important;color:#6E1A2B!important}
html.bdx-www footer{background:#4A0F1C!important;border-color:rgba(255,255,255,.1)!important}
html.bdx-www footer *{color:#EAD3D8!important;border-color:rgba(255,255,255,.14)!important}
html.bdx-www footer img{filter:brightness(0) invert(1)!important}
html.bdx-www .hl.dark{background:linear-gradient(135deg,#7A1F33,#4A0F1C)!important;border-color:#7A1F33!important}
html.bdx-www .hl.dark :is(a,.btn){background:#fff!important;background-image:none!important;color:#6E1A2B!important}
html.bdx-www .team .tv{background:radial-gradient(ellipse at 50% 30%,#7A1F33,#4A0F1C 75%)!important;border-color:#7A1F33!important}
html.bdx-www .team .tv :is(b,span,.n){color:#F6E9EC!important}
html.bdx-www .team .tv .who b{color:#fff!important}
html.bdx-www body:not(.rllift){background:#fff!important}
html.bdx-www body:not(.rllift)>header{background:rgba(74,15,28,.97)!important;border-color:rgba(255,255,255,.12)!important}
html.bdx-www body:not(.rllift)>header :is(a,span,button,b,div){color:#fff!important}
html.bdx-www body:not(.rllift)>div:first-child{background:#3A0B16!important}
html.bdx-www .ftw-box{background:linear-gradient(180deg,#5A1426,#4A0F1C)!important;border-color:rgba(255,255,255,.25)!important}
html.bdx-www .ftw :is(input,select,.sg){background:rgba(255,255,255,.08)!important;border-color:rgba(255,255,255,.3)!important;color:#fff!important}
html.bdx-www .ftw .sg button.on{background:#fff!important;color:#6E1A2B!important}
html.bdx-www .ftw .bk{background:#fff!important;background-image:none!important;color:#6E1A2B!important;box-shadow:none!important}
html.bdx-www .ftw .wa{background:transparent!important;color:#fff!important;border-color:#fff!important}
html.bdx-www .ftw-x{background:#4A0F1C!important;border-color:rgba(255,255,255,.35)!important}
html.bdx.bdx-bk,html.bdx.bdx-bk[data-th]{--gold:#7A1F33!important;--gold2:#5E1426!important;--goldbg:#F7EDEF!important;--bg:#FBF7F6!important;--line:#EBDDE0!important;--ink:#1E0E12!important;--card:#fff!important;--mut:#4A3940!important;--dim:#8A767C!important}
html.bdx-bk li::before{background:#F1D9DE!important}
html.bdx.bdx-bk .seg{background:#F4E4E8!important;border:1px solid #E8CBD2!important}
html.bdx.bdx-bk .seg button{color:#7A1F33!important;font-weight:700!important;font-size:16px!important;padding:12px 10px!important;transition:background .2s,color .2s}
html.bdx.bdx-bk .seg button.on{background:#7A1F33!important;color:#fff!important;box-shadow:0 4px 12px rgba(122,31,51,.3)!important}
html.bdx.bdx-bk label.f>span{color:#5A1426!important;font-size:13px!important;letter-spacing:.02em!important}
html.bdx.bdx-bk .chip.g{border-color:#E3C3CB!important}
html.bdx.bdx-bk input::placeholder,html.bdx.bdx-bk textarea::placeholder{color:#8A767C!important;opacity:1!important}
html.bdx #rlBv{background:#FFFFFF!important}
html.bdx #rlBv .lg{width:210px!important;height:210px!important;border-radius:46px!important;box-shadow:0 24px 60px -18px rgba(122,31,51,.5)!important}
html.bdx #rlBv .lg img{content:url(https://equipe.rafai-limousine.com/icon-512.png)}
html.bdx #rlBv .tx{margin-top:34px!important;font-size:28px!important;color:#2B0C14!important}
html.bdx #rlBv .tx b{background:none!important;color:#7A1F33!important;-webkit-text-fill-color:#7A1F33!important}
html.bdx #rlBv .ln{width:96px!important;background:linear-gradient(90deg,transparent,#7A1F33,transparent)!important}
html.bdx.bdx-drv:not(.rllight){--bg:#5A1426!important;--card:#FFFFFF!important;--line:#84304A!important;--txt:#fff!important;--mut:#E6C7CF!important;--dim:#BC96A0!important;--gold:#fff!important;--gold2:#F1D9DE!important;--bdxS1:#3A0B16;--bdxS2:#4A0F1C;--bdxS3:#5A1426;--bdxS4:#6B1A2E;--bdxS5:#7A2438}
html.bdx-drv:not(.rllight),html.bdx-drv:not(.rllight) body{background:#5A1426!important}
html.bdx-drv:not(.rllight) #rlgbg{background-color:#5A1426!important}
html.bdx.bdx-drv.rllight{--bg:#FFFFFF!important;--card:#7A1F33!important;--line:#EBDDE0!important;--txt:#4A0F1C!important;--mut:#7F5E66!important;--dim:#9A868B!important;--gold:#7A1F33!important;--gold2:#5E1426!important;--bdxS1:#EDE3E5;--bdxS2:#F0E8EA;--bdxS3:#F4EEEF;--bdxS4:#F7F2F3;--bdxS5:#FAF7F7}
html.bdx.bdx-drv.rllight,html.bdx.bdx-drv.rllight body{background:#FFFFFF!important}
html.bdx.bdx-drv.rllight #rlgbg{background-color:#FFFFFF!important}
html.bdx.bdx-drv.rllight .top{background:var(--bdxW)!important}
html.bdx.bdx-drv .msg{font-size:16px!important;font-weight:600!important;line-height:1.5!important;letter-spacing:.01em!important;color:var(--txt)!important}
html.bdx.bdx-drv .msg small{color:var(--gold)!important;font-weight:700!important;font-size:12px!important;opacity:1!important}
html.bdx.bdx-drv.rllight #rlsb{background:var(--bdxDD)!important}
html.bdx.bdx-drv.rllight .rlac-lo{background:var(--bdxB)!important;color:var(--bdxW)!important}
html.bdx.bdx-drv:not(.rllight) .rlac-lo{background:var(--bdxW)!important;color:var(--bdxDD)!important}
html.bdx-www #rlch,html.bdx-www #rlch .ph{background-color:#4A0F1C!important}
html.bdx-www .menu{background:#fff!important;box-shadow:0 18px 40px rgba(74,15,28,.18)!important;border-top:1px solid #EBDDE0!important}
html.bdx-www .menu a{color:#2B0C14!important;border-color:rgba(122,31,51,.14)!important}
html.bdx-www .menu a:hover{color:#7A1F33!important}
html.bdx-www .menu .msub{color:#7A1F33!important}
html.bdx-www .langmenu{background:#fff!important;border-color:#EBDDE0!important;box-shadow:0 18px 40px rgba(74,15,28,.18)!important}
html.bdx-www .langmenu a{color:#2B0C14!important}
html.bdx-www .langmenu a:hover,html.bdx-www .langmenu a[aria-current]{background:#F7EDEF!important;color:#7A1F33!important}
html.bdx-www #rlch :is(input,select,textarea){background:rgba(255,255,255,.08)!important;border-color:rgba(255,255,255,.3)!important;color:#fff!important}
html.bdx-team #rlLogin{background:radial-gradient(ellipse 700px 600px at 50% 35%,rgba(255,255,255,.12),transparent 70%),#5A1426!important}
html.bdx-team #rlLogin .k{color:#F1D9DE!important}
html.bdx-team #rlLogin img{filter:brightness(0) invert(1)!important}
html.bdx-team #rlLogin input{background:rgba(255,255,255,.08)!important;border-color:rgba(255,255,255,.35)!important}
html.bdx-team #rlLogin button{background:#fff!important;background-image:none!important;color:#6E1A2B!important}
html.bdx-team #nwb{background:#5A1426!important;border:1px solid rgba(255,255,255,.35)!important;box-shadow:0 18px 44px rgba(74,15,28,.38)!important;color:#fff!important}
html.bdx-team #nwb .nwh b{color:#fff!important}
html.bdx-team #nwb .nwh button{background:rgba(255,255,255,.16)!important;color:#fff!important}
html.bdx-team #nwb .nwi{background:#6B1A2E!important;color:#fff!important}
html.bdx-team #nwb .nwi span{color:#EAD3D9!important}
html.bdx-team #nwb .nwi em{background:#fff!important;color:#5A1426!important}
html.bdx-team .brand img{border-radius:22%!important}
html.bdx-team #rlLogin button.ghost{background:transparent!important;color:#fff!important;border:1px solid rgba(255,255,255,.6)!important}
'''
JS = r'''(function(){try{
var on=%LIVE%||/--bordeaux/.test(location.hostname)||/[?&]bdx=1/.test(location.search);if(/[?&]bdx=0/.test(location.search))on=false;if(!on)return;
var APP='%APP%';if(APP==='suivi')APP=/^\/chauffeur/.test(location.pathname)?'drv':'trk';
var H=document.documentElement;H.classList.add('bdx','bdx-'+APP);
if(APP==='bk'){var nt=function(){if(H.getAttribute('data-th')==='d')H.removeAttribute('data-th')};nt();new MutationObserver(nt).observe(H,{attributes:true,attributeFilter:['data-th']})}
var B='var(--bdxB)',ROSE='var(--bdxR)',BD='var(--bdxD)',W='var(--bdxW)',ICON='%ICON%';
function LT(){return APP==='drv'?H.classList.contains('rllight'):APP==='bk'?H.getAttribute('data-th')!=='d':true}
var T=new Map();
function rgb(s){var m=String(s).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);return m?{r:+m[1],g:+m[2],b:+m[3],a:m[4]===undefined?1:+m[4]}:null}
function hsl(c){var r=c.r/255,g=c.g/255,b=c.b/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,s=0,h=0,d=mx-mn;if(d){s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return{h:h,s:s,l:l}}
function gold(c){if(!c||c.a<=0.05)return false;if(c.r>150&&c.g>100&&c.b<150&&c.r-c.b>55&&c.g-c.b>25)return true;var k=hsl(c);return k.h>=25&&k.h<=60&&k.s>.28&&k.l>.2&&k.l<.88&&c.r-c.b>40}
function neu(c){return Math.max(c.r,c.g,c.b)-Math.min(c.r,c.g,c.b)<24}
function sv(c){var L=.3*c.r+.59*c.g+.11*c.b;return 'var(--bdxS'+(L<12?1:L<22?2:L<32?3:L<46?4:5)+')'}
function bord(c){var L=.3*c.r+.59*c.g+.11*c.b,t=L<12?'58,11,22':L<22?'74,15,28':L<32?'90,20,38':L<46?'107,26,46':'122,36,56';return 'rgba('+t+','+c.a+')'}
function isB(c){return c&&c.a>.5&&c.r>85&&c.r<150&&c.g<60&&c.b<80&&c.r-c.g>45}
function lum(c){return .3*c.r+.59*c.g+.11*c.b}
function dark(el){if((APP==='drv'||APP==='bk')&&!LT())return true;if(el.closest&&el.closest('.menu,.langmenu'))return false;if(el.closest&&el.closest(APP==='team'?'#rlLogin,#nwb':'header.hdr,.hero,[class*=hero],footer,.hl.dark,.team .tv,#rlLogin,.ftw-box,#rlch,body:not(.rllift)>header'))return true;var p=el.parentElement;while(p&&p!==H){var cs=getComputedStyle(p),b=rgb(cs.backgroundColor);if(b&&b.a>.5)return lum(b)<110;p=p.parentElement}return false}
function set(el,k,v){var o=T.get(el);if(!o){o={};T.set(el,o)}if(!(k in o))o[k]=[el.style.getPropertyValue(k),el.style.getPropertyPriority(k)];el.style.setProperty(k,v,'important')}
function reset(){T.forEach(function(o,el){for(var k in o){if(o[k][0])el.style.setProperty(k,o[k][0],o[k][1]);else el.style.removeProperty(k)}});T=new Map()}
function one(el){var cs=getComputedStyle(el),c=rgb(cs.color),bg=rgb(cs.backgroundColor),bi=cs.backgroundImage,d=null;function D(){if(d===null)d=dark(el);return d}
 if((APP==='drv'||APP==='bk')&&!LT()){if(bg&&bg.a>.03&&lum(bg)<75&&neu(bg)){set(el,'background-color',bg.a>=.99?sv(bg):bord(bg));bg=null}if(c&&c.a>.3&&neu(c)&&lum(c)>85&&lum(c)<200)set(el,'color','var(--mut)');else if(c&&c.a>.5&&neu(c)&&lum(c)>=200&&!effDk(el))set(el,'color','var(--txt)')}
 if(APP==='drv'&&c&&c.a>.3&&lum(c)<80&&(!bg||bg.a<.3)&&effDk(el))set(el,'color',W);
 if((APP==='drv'||(APP==='bk'&&LT()))&&(isB(bg)||(bi&&bi.indexOf('122, 31, 51')>=0))&&c&&lum(c)<90)set(el,'color',W);
 if(gold(c))set(el,'color',D()?ROSE:B);
 if(gold(bg)){if(D()){set(el,'background-color',W);set(el,'color',BD)}else{set(el,'background-color',B);set(el,'color',W);if(el.getBoundingClientRect().width<700)el.querySelectorAll('*').forEach(function(x){if(!x.closest('svg'))set(x,'color',W)})}}
 if(bi&&bi!=='none'&&bi.indexOf('gradient')>=0&&bi.indexOf('url(')<0){var cols=(bi.match(/rgba?\([^)]+\)/g)||[]).map(rgb);if(cols.some(gold)){
  if(cs.webkitBackgroundClip==='text'||cs.backgroundClip==='text')set(el,'background-image',D()?'linear-gradient(100deg,#fff,#F1D9DE,#fff)':'linear-gradient(100deg,#5E1426,#9B3049,#5E1426)');
  else if(D()&&el.tagName!=='SPAN'){set(el,'background-image','none');set(el,'background-color',W);set(el,'color',BD)}
  else{set(el,'background-image','linear-gradient(135deg,#9B3049,#6E1A2B 55%,#4A0F1C)');if(el.tagName!=='SPAN'){set(el,'color',W);if(el.getBoundingClientRect().width<700)el.querySelectorAll('*').forEach(function(x){if(!x.closest('svg'))set(x,'color',W)})}}}}
 ['Top','Right','Bottom','Left'].forEach(function(s){var w=parseFloat(cs['border'+s+'Width']);if(w>0&&gold(rgb(cs['border'+s+'Color'])))set(el,'border-'+s.toLowerCase()+'-color',D()?'rgba(255,255,255,.6)':B)});
 var sh=cs.boxShadow;if(sh&&sh!=='none'&&(sh.match(/rgba?\([^)]+\)/g)||[]).map(rgb).some(gold))set(el,'box-shadow','0 6px 22px rgba(122,31,51,.22)');
 if(el.tagName==='IMG'&&/\/img\/logo\.png/.test(el.getAttribute('src')||'')){if(el.src!==ICON){el.src=ICON;set(el,'filter','none');set(el,'border-radius','22%')}return}
 if(el.tagName==='IMG'&&el.closest('#rlBv')){var U5='https://equipe.rafai-limousine.com/icon-512.png';if(el.src!==U5){el.src=U5;set(el,'filter','none')}return}
 if(APP==='team'&&el.tagName==='IMG'&&el.closest('.brand')){if(el.src!==ICON){el.src=ICON;set(el,'filter','none')}return}
 if((APP==='bk'||APP==='drv'||APP==='trk')&&el.tagName==='IMG'&&/logo|icon/i.test(el.getAttribute('src')||'')){if(el.src!==ICON){el.src=ICON;set(el,'filter','none');set(el,'border-radius','22%')}return}
 if(el.tagName==='IMG'&&/logo/i.test((el.getAttribute('src')||'')+' '+el.className+' '+el.alt)&&!/App Store|Google Play/i.test(el.alt))set(el,'filter',D()?'brightness(0) invert(1)':'brightness(0) saturate(100%) invert(14%) sepia(60%) saturate(3500%) hue-rotate(325deg) brightness(85%) contrast(98%)');
 if(el.closest('svg')){var f=rgb(cs.fill),s2=rgb(cs.stroke);if(gold(f))set(el,'fill',D()?W:B);if(gold(s2))set(el,'stroke',D()?W:B)}
 if(APP==='bk'&&LT()&&bg&&bg.a>.6&&lum(bg)<40&&el.getBoundingClientRect().width<1000&&!el.querySelector('input,select,textarea')){var lightIn=false;el.querySelectorAll('*').forEach(function(x){var b2=rgb(getComputedStyle(x).backgroundColor);if(b2&&b2.a>.6&&lum(b2)>200)lightIn=true});if(!lightIn&&el.children.length){set(el,'background-color',B);el.querySelectorAll('*').forEach(function(x){if(!x.closest('svg'))set(x,'color','#F6E9EC')})}}
}
function topbar(){if(APP!=='bk'&&APP!=='drv')return;if(APP==='drv'&&LT())return;var els=document.body.querySelectorAll('header,nav,div');for(var i=0;i<els.length;i++){var e=els[i],r=e.getBoundingClientRect(),cs=getComputedStyle(e);if(r.top<=1&&r.width>innerWidth*.8&&r.height>30&&r.height<90&&(cs.position==='fixed'||cs.position==='sticky')){set(e,'background',APP==='drv'?'#4A0F1C':'#5A1426');set(e,'border-color','rgba(255,255,255,.1)');var im=e.querySelector('img');if(im&&im.getBoundingClientRect().width<=72){im.src=ICON;set(im,'filter','none')}break}}}
function drvbg(){if(APP!=='drv')return;var g=document.getElementById('rlgbg');if(!g||document.getElementById('rlBdxG'))return;var css='';['::before','::after'].forEach(function(p){var bi=getComputedStyle(g,p).backgroundImage;if(bi&&bi!=='none'&&bi.indexOf('17, 17, 19')>=0)css+='html.bdx-drv:not(.rllight) #rlgbg'+p+'{background-image:'+bi.split('17, 17, 19').join('90, 20, 38')+'!important}'});if(css){var st=document.createElement('style');st.id='rlBdxG';st.textContent=css;document.head.appendChild(st)}}

function rw(){if(APP!=='drv')return;var DS='html.bdx.bdx-drv:not(.rllight)',LS='html.bdx.bdx-drv.rllight',out=[],CD='--bg:#F7EDEF;--card:#FFFFFF;--txt:#4A0F1C;--mut:#7F5E66;--dim:#9A868B;--gold:#7A1F33;--gold2:#5E1426;--line:#EBDDE0;--bdxS1:#F1E3E6;--bdxS2:#F4E8EB;--bdxS3:#F7EDEF;--bdxS4:#F9F1F3;--bdxS5:#FBF5F6;color:var(--txt)',CL='--bg:#5A1426;--card:#7A1F33;--txt:#FFFFFF;--mut:#F1D9DE;--dim:#E6C2CB;--gold:#FFFFFF;--gold2:#F1D9DE;--line:rgba(255,255,255,.22);--bdxS1:#3A0B16;--bdxS2:#4A0F1C;--bdxS3:#5A1426;--bdxS4:#64182C;--bdxS5:#6E1C31;color:var(--txt)',RE=/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,\/]\s*([\d.]+%?))?\s*\)|#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi;
 function tok(m,r,g,b,a,hx){if(hx){if(hx.length<6)hx=hx.split('').map(function(x){return x+x}).join('');r=parseInt(hx.slice(0,2),16);g=parseInt(hx.slice(2,4),16);b=parseInt(hx.slice(4,6),16);a=hx.length===8?parseInt(hx.slice(6),16)/255:1}else a=a==null?1:(/%$/.test(a)?parseFloat(a)/100:parseFloat(a));return{r:+r,g:+g,b:+b,a:a}}
 function kind(p){return /^(color|caret-color|-webkit-text-fill-color)$/.test(p)?'tx':/^(background|border|outline|fill|stroke)/.test(p)?'bg':''}
 function sel(pre,s){var o=[],d=0,cur='';for(var i=0;i<s.length;i++){var ch=s.charAt(i);if(ch==='(')d++;else if(ch===')')d--;if(ch===','&&!d){o.push(cur);cur=''}else cur+=ch}o.push(cur);return o.map(function(x){x=x.trim();if(/^:root/.test(x))return pre+x.slice(5);if(/^html(?![\w-])/.test(x))return pre+x.slice(4);return pre+' '+x}).join(',')}
 function walk(rs,media){for(var i=0;i<rs.length;i++){var r=rs[i];if(!r.selectorText&&r.cssRules){var cond=r.conditionText||(r.media&&r.media.mediaText)||'';if(cond)walk(r.cssRules,cond);continue}
  if(!r.selectorText||!r.style||/rllight|data-th|bdx/.test(r.selectorText))continue;var dk=[],lt=[],goldBg=false,darkTx=false,isCard=false,bsh=(r.style.getPropertyValue('background')||'')+' '+(r.style.getPropertyValue('background-color')||'')+' '+(r.style.getPropertyValue('background-image')||'');if(/var\(--card\)/.test(bsh))isCard=true;if(/var\(--gold/.test(bsh))goldBg=true;
  for(var j=0;j<r.style.length;j++){var p=r.style[j],k=kind(p);if(!k)continue;var v=r.style.getPropertyValue(p);if(!v)continue;
   if(/^background/.test(p)&&/var\(--gold/.test(v))goldBg=true;if(/^background/.test(p)&&/var\(--card\)/.test(v))isCard=true;if(p==='color'&&(/var\(--ink\)/.test(v)||/#11111[0-9]|#000\b/i.test(v)))darkTx=true;
   var vd=v.replace(RE,function(m,r1,g1,b1,a1,h1){var c=tok(m,r1,g1,b1,a1,h1);if(gold(c)){if(/^background/.test(p))goldBg=true;return k==='tx'?ROSE:(/^border|^outline/.test(p)?'rgba(255,255,255,.55)':'#ffffff')}if(neu(c)&&lum(c)<75&&k==='bg')return c.a>=.99?sv(c):bord(c);if(neu(c)&&k==='tx'&&lum(c)>85&&lum(c)<200)return 'var(--mut)';if(neu(c)&&k==='tx'&&lum(c)>=200&&c.a>.5)return 'var(--txt)';return m});
   var vl=v.replace(RE,function(m,r1,g1,b1,a1,h1){var c=tok(m,r1,g1,b1,a1,h1);if(gold(c))return B;if(neu(c)&&k==='bg'&&lum(c)<75&&c.a>=.99)return sv(c);if(neu(c)&&k==='tx'&&lum(c)>85&&lum(c)<200)return 'var(--mut)';if(neu(c)&&k==='tx'&&lum(c)>=200&&c.a>.5)return 'var(--txt)';return m});
   if(vd!==v)dk.push(p+':'+vd+' !important');if(vl!==v)lt.push(p+':'+vl+' !important')}
  if(goldBg&&(darkTx||lt.length))lt.push('color:var(--bdxW) !important');
  if(goldBg&&dk.length&&!/color:/.test(dk.join(';')))dk.push('color:#5A1426 !important');
  function add(pre,d){if(!d.length)return;var line=sel(pre,r.selectorText)+'{'+d.join(';')+'}';out.push(media?'@media '+media+'{'+line+'}':line)}
  if(isCard){dk.push(CD);lt.push(CL)}
  add(DS,dk);add(LS,lt)}}
 for(var i=0;i<document.styleSheets.length;i++){var sh=document.styleSheets[i],n=sh.ownerNode;if(n&&/^(rlBdxCss|rlBdxRW|rlBdxG|rlthcss|rlThG)$/.test(n.id))continue;try{walk(sh.cssRules,'')}catch(e){}}
 var st=document.getElementById('rlBdxRW');if(!st){st=document.createElement('style');st.id='rlBdxRW'}st.textContent=out.join('\n');document.head.appendChild(st)}
function effDk(el){var p=el;while(p&&p!==H){var cs=getComputedStyle(p);if(cs.backgroundImage&&cs.backgroundImage!=='none')return false;var b=rgb(cs.backgroundColor);if(b&&b.a>.5)return lum(b)<110;p=p.parentElement}return !LT()}
function swapTh(){if(APP!=='drv')return;document.querySelectorAll('.rlseg').forEach(function(g){if(g.getAttribute('data-bdxsw'))return;var d=g.querySelector('[data-rlth=dark]'),l=g.querySelector('[data-rlth=light]');if(!d||!l)return;var t=d.innerHTML;d.innerHTML=l.innerHTML;l.innerHTML=t;g.insertBefore(l,d);g.setAttribute('data-bdxsw','1')})}
function onDk(el){var p=el;while(p&&p!==document.body){var cs=getComputedStyle(p),b=rgb(cs.backgroundColor);if(cs.backgroundImage&&cs.backgroundImage!=='none')return true;if(b&&b.a>.5)return lum(b)<150;p=p.parentElement}return false}
function conv(root){if(APP!=='www'||document.body.classList.contains('rllift'))return;(root||document.body).querySelectorAll('*').forEach(function(el){if(el.closest('body>header,footer,.hero,[class*=hero],.ftw,#rlch,svg,.hl.dark'))return;var cs=getComputedStyle(el),bg=rgb(cs.backgroundColor);
 if(bg&&bg.a>.5&&lum(bg)<60&&cs.backgroundImage.indexOf('url(')<0){var L0=lum(bg);set(el,'background-color',L0<22?'#FFFFFF':'#F7F1EF');if(L0>=22)set(el,'border-color','rgba(122,31,51,.16)')}
 var c=rgb(cs.color);if(c&&!gold(c)&&!onDk(el)){var L=lum(c);if(L>165)set(el,'color',/^H[1-4]$/.test(el.tagName)?'#2B0C14':'#4B3A3F');else if(L>100&&Math.abs(c.r-c.b)<45)set(el,'color','#7F6B70')}
 ['Top','Right','Bottom','Left'].forEach(function(s){var w=parseFloat(cs['border'+s+'Width']),b=rgb(cs['border'+s+'Color']);if(w>0&&b&&lum(b)>150&&!gold(b))set(el,'border-'+s.toLowerCase()+'-color','rgba(122,31,51,.18)')})})}
function all(root){swapTh();conv(root);try{(root||document.body).querySelectorAll('*').forEach(one)}catch(e){}}
var q=[],t=0;function flush(){var l=q;q=[];t=0;l.forEach(function(n){if(n.nodeType===1&&n.isConnected){one(n);all(n)}})}
var LK=null;function mode(){var k=LT();if(LK===null){LK=k;return}if(k!==LK){LK=k;reset();rw();topbar();all()}}
function fav(){document.querySelectorAll('link[rel~=icon],link[rel=apple-touch-icon]').forEach(function(l){if(l.getAttribute('href')!==ICON){l.setAttribute('href',ICON);l.removeAttribute('type')}})}
function go(){fav();rw();drvbg();LK=LT();new MutationObserver(mode).observe(H,{attributes:true,attributeFilter:['class','data-th']});var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content','#4A0F1C');topbar();all();new MutationObserver(function(ms){ms.forEach(function(x){x.addedNodes.forEach(function(n){q.push(n)})});if(!t)t=setTimeout(flush,250)}).observe(document.body,{childList:true,subtree:true});setTimeout(function(){rw();drvbg();topbar();all()},1200);setTimeout(all,3500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
}catch(e){}})();'''
TAG = '<style id="rlBdxCss">' + CSS + '</style><script id="rlBdx">/* rlBdx v1 */' + JS.replace('%APP%', APP).replace('%LIVE%', 'true' if LIVE else 'false').replace('%ICON%', ICON) + '</script>'
n = 0
for p in args[1:]:
    s = io.open(p, encoding='utf-8').read()
    if 'id="rlBdx"' in s:
        import re
        s = re.sub(r'<style id="rlBdxCss">.*?</style><script id="rlBdx">.*?</script>', '', s, count=1, flags=re.S)
    i = s.lower().find('</head>')
    if i < 0:
        continue
    s = s[:i] + TAG + s[i:]
    io.open(p, 'w', encoding='utf-8').write(s)
    n += 1
print('rlBdx v1', APP, 'LIVE' if LIVE else 'test', n, 'page(s)')
