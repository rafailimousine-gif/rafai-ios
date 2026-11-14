/* ---------- rlTeam16 (14 nov. 2026, demande de Yassine) ----------
 * Photos des chauffeurs dans un cadre « arche » doré comme sur le site (haut arrondi, photo cadrée en haut : la tête n'est plus coupée).
 * Nouvelle photo chauffeur : gardée en portrait 3:4 (avant : carré découpé au centre, qui coupait le haut de la tête). */
(function(){
  var css=document.createElement('style');css.id='rlArch';
  var A='border-radius:50% 50% 14% 14%/40% 40% 10% 10% !important;object-fit:cover;object-position:50% 18%;border:2px solid #D9B46A;box-shadow:0 0 0 1px rgba(111,81,32,.45),0 3px 12px rgba(224,186,108,.28);background:#141312';
  css.textContent='img.av{'+A+';height:42px}'+
    '.dtop img.av,.assigned img.av{width:44px;height:58px}'+
    '.avup img.av{width:64px;height:84px}'+
    '.dl-who img.av{width:38px;height:50px;flex:0 0 38px}'+
    '.lvc img.av{width:54px;height:71px}'+
    '.c-x img.av{width:26px;height:34px}'+
    '.avup{border-radius:50% 50% 14% 14%/40% 40% 10% 10%}';
  document.head.appendChild(css);
  if(typeof shrinkImg!=='function')return;
  var _si=shrinkImg;
  shrinkImg=function(file,max,square,cb){
    if(!square)return _si(file,max,square,cb);
    var rd=new FileReader();rd.onerror=function(){cb('Lecture de la photo impossible')};
    rd.onload=function(){var im=new Image();im.onerror=function(){cb('Format de photo non reconnu (essayez JPEG ou PNG)')};
      im.onload=function(){
        var w=im.naturalWidth,h=im.naturalHeight,sx=0,sy=0,sw=w,sh=h,R=0.75;
        if(w/h>R){sw=Math.round(h*R);sx=Math.round((w-sw)/2)}
        else if(w/h<R){sh=Math.round(w/R);sy=Math.round((h-sh)*0.2)}
        var size=Math.max(max,400),data='';
        for(var tries=0;tries<8;tries++){
          var sc=Math.min(1,size/sh),cw=Math.round(sw*sc),ch=Math.round(sh*sc),cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
          var cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cw,ch);cx.drawImage(im,sx,sy,sw,sh,0,0,cw,ch);
          data=cv.toDataURL('image/jpeg',tries<4?0.82-tries*0.1:0.5);if(data.length<=45000)return cb(null,data);size=Math.round(size*0.82);
        }
        cb('Photo trop lourde, essayez-en une autre');
      };
      im.src=rd.result};
    rd.readAsDataURL(file);
  };
})();
