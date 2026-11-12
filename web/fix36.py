# fix36 (12 nov. 2026) : suivi.rafai-limousine.com transmet aussi « in » au script.
# Sans ça, le bouton « Ordre de mission » de l'Espace équipe (…&in=web) et le lien « continuer sur le web »
# retombaient sur la page « Ouvrez l'appli Rafai Limousine Driver » au lieu d'ouvrir le bon de mission.
import os, re, shutil, sys

p = os.path.expanduser('~/suivi/public/index.html')
s = open(p, encoding='utf-8').read()
old = "if (q.get('m') && k) return go(APP + '?m=' + e(q.get('m')) + '&k=' + e(k), "
new = "if (q.get('m') && k) return go(APP + '?m=' + e(q.get('m')) + '&k=' + e(k) + (/^(web|app)$/.test(q.get('in') || '') ? '&in=' + q.get('in') : ''), "
if new in s:
    print('fix36 : déjà en place'); sys.exit(0)
if s.count(old) != 1:
    print('fix36 : ligne introuvable, rien changé'); sys.exit(1)
bak = os.path.expanduser('~/suivi-index-avant-fix36.html')
if not os.path.exists(bak):
    shutil.copy(p, bak)
open(p, 'w', encoding='utf-8').write(s.replace(old, new))
print('fix36 : OK')
