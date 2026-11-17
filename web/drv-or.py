# RL Driver noir et or : bouton Start trip doré animé, barres d'étapes qui se remplissent en or
# (Yassine, 17 nov. 2026 08:15 : « Start trip en doré ; quand il passe les étapes on site, passager à bord, ça doit valider là-haut sur la ligne »).
# Usage : python3 drv-or.py page.html [...] (remplace l'ancien bloc s'il existe)
import io, re, sys
CSS = r'''@keyframes rlOrShine{0%{background-position:200% 50%}100%{background-position:-200% 50%}}
@keyframes rlOrPulse{0%,100%{box-shadow:0 6px 18px -6px rgba(217,178,95,.55),0 0 0 0 rgba(217,178,95,.45)}50%{box-shadow:0 10px 26px -6px rgba(217,178,95,.8),0 0 0 7px rgba(217,178,95,0)}}
.tk .btn.gold,.tk a.btn.gold{background:linear-gradient(110deg,#B68F3E 0%,#E9CF8E 28%,#F7E7B4 44%,#D9B25F 60%,#B68F3E 80%,#E9CF8E 100%)!important;background-size:250% 100%!important;color:#111113!important;-webkit-text-fill-color:#111113!important;border:1px solid #D9B25F!important;font-weight:800!important;letter-spacing:.02em;animation:rlOrShine 3.6s linear infinite,rlOrPulse 2.4s ease-in-out infinite!important}
.tk .btn[disabled]{background:linear-gradient(110deg,rgba(217,178,95,.12) 0%,rgba(243,223,162,.30) 45%,rgba(217,178,95,.12) 100%)!important;background-size:250% 100%!important;color:#E8C77E!important;-webkit-text-fill-color:#E8C77E!important;border:1px dashed rgba(217,178,95,.65)!important;opacity:1!important;animation:rlOrShine 6s linear infinite!important}
html.rllight .tk .btn[disabled]{background:linear-gradient(110deg,#EFE3C6 0%,#FAF3E2 45%,#E8D8B0 100%)!important;background-size:250% 100%!important;color:#8a6620!important;-webkit-text-fill-color:#8a6620!important}
.tkstp i{background:rgba(217,178,95,.16)!important;box-shadow:inset 0 0 0 1px rgba(217,178,95,.25)!important;transition:background .4s,box-shadow .4s}
.tkstp .on i{background:linear-gradient(90deg,#B68F3E,#F3DFA2 40%,#D9B25F 60%,#B68F3E)!important;background-size:250% 100%!important;animation:rlOrShine 2.8s linear infinite;box-shadow:0 0 10px rgba(217,178,95,.6)!important}
.tkstp .on{color:#E8C77E!important}html.rllight .tkstp .on{color:#8a6620!important}
html.rllight .tkstp i{background:rgba(166,125,44,.18)!important}
@media (prefers-reduced-motion:reduce){.tk .btn,.tkstp .on i{animation:none!important}}'''
TAG = '<style id="rlOr">/* rlOr v1 */' + CSS + '</style>'
n = 0
for p in sys.argv[1:]:
    s = io.open(p, encoding='utf-8').read()
    s = re.sub(r'<style id="rlOr">.*?</style>', '', s, flags=re.S)
    i = s.lower().find('</head>')
    if i < 0 or 'tkstp' not in s: continue
    io.open(p, 'w', encoding='utf-8').write(s[:i] + TAG + s[i:]); n += 1
print('rlOr v1', n, 'page(s)')
