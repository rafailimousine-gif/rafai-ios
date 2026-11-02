# Page Confidentialité de booking.rafai-limousine.com : paragraphe « Mesure publicitaire » (balise Google Ads), FR + EN
import io, os, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/confidentialite/index.html')
if not os.path.exists(f):
    print('ARRET pas de page confidentialite'); sys.exit(1)
s = io.open(f, encoding='utf-8').read()
if 'Mesure publicitaire' in s:
    print('deja mesure publicitaire'); sys.exit(0)
FR = ('<h3>Mesure publicitaire</h3><p>Sur la page de réservation (booking.rafai-limousine.com), nous utilisons la balise Google Ads (Google) '
      'uniquement pour savoir si une réservation payée fait suite à un clic sur l’une de nos annonces : nous transmettons le montant et la '
      'référence de la course, jamais votre nom ni vos coordonnées. Pour les visiteurs situés dans l’Espace économique européen, au Royaume-Uni '
      'et en Suisse, cette mesure est désactivée par défaut et aucun cookie publicitaire n’est déposé. Nous ne faisons pas de publicité personnalisée.</p>')
EN = ('<h3>Advertising measurement</h3><p>On the booking page (booking.rafai-limousine.com), we use the Google Ads tag (Google) only to know '
      'whether a paid booking follows a click on one of our ads: we send the amount and the ride reference, never your name or contact details. '
      'For visitors located in the European Economic Area, the United Kingdom and Switzerland, this measurement is turned off by default and no '
      'advertising cookie is set. We do not use personalised advertising.</p>')
n = 0
for mark, blk in (('<h3>Vos droits</h3>', FR), ('<h3>Your rights</h3>', EN)):
    i = s.find(mark)
    if i < 0:
        print('introuvable : ' + mark); continue
    s = s[:i] + blk + s[i:]; n += 1
s = s.replace('mise à jour le 31 octobre 2026', 'mise à jour le 2 novembre 2026').replace('updated 31 October 2026', 'updated 2 November 2026')
if not n:
    print('ARRET aucun emplacement'); sys.exit(1)
io.open(f, 'w', encoding='utf-8').write(s)
print('ok confidentialite', n)
