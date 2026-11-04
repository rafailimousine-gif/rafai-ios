# Page Confidentialité de booking.rafai-limousine.com : section « Application RL Driver (chauffeurs) », FR + EN
import io, os, sys
H = os.path.expanduser('~')
f = os.path.join(H, 'booking/public/confidentialite/index.html')
if not os.path.exists(f):
    print('ARRET pas de page confidentialite'); sys.exit(1)
s = io.open(f, encoding='utf-8').read()
if 'id="rl-driver"' in s:
    print('deja section rl driver'); sys.exit(0)
FR = ('<h3 id="rl-driver">Application RL Driver (chauffeurs)</h3>'
      '<p>Cette partie concerne les chauffeurs qui utilisent RL Driver pour les missions confiées par Rafai Limousine SAS, responsable du traitement.</p>'
      '<p><strong>Données utilisées :</strong> nom, prénom, e-mail, téléphone, société, véhicule et plaque, photos du chauffeur et du véhicule, missions et étapes de course, messages avec l’équipe, factures déposées et identifiant technique de notification.</p>'
      '<p><strong>Position GPS :</strong> la position précise du véhicule est collectée uniquement pendant une mission, y compris quand Waze est ouvert ou que l’écran est verrouillé. La collecte s’arrête à la fin de la course.</p>'
      '<p><strong>Pourquoi :</strong> organiser les missions, informer le client de l’arrivée de son chauffeur, permettre le suivi par l’équipe et traiter la facturation. Ces traitements reposent sur notre relation contractuelle et sur notre intérêt légitime à suivre les courses. Aucune donnée n’est vendue ni utilisée pour de la publicité.</p>'
      '<p><strong>Qui y a accès :</strong> l’équipe Rafai Limousine, le client pendant sa course (prénom, photo, véhicule, plaque et position), ainsi que nos prestataires techniques : Google pour l’hébergement et les notifications, Brevo pour les SMS.</p>'
      '<p><strong>Durée :</strong> les positions sont conservées 30 jours après la course. Les autres données sont conservées pendant la collaboration, puis pendant la durée légale.</p>'
      '<p><strong>Vos droits :</strong> accès, rectification, effacement et opposition à contact@rafai-limousine.com. Vous pouvez aussi saisir la CNIL.</p>')
EN = ('<h3 id="rl-driver-en">RL Driver app (chauffeurs)</h3>'
      '<p>This part concerns chauffeurs who use RL Driver for assignments given by Rafai Limousine SAS, the data controller.</p>'
      '<p><strong>Data used:</strong> first and last name, e-mail, phone, company, vehicle and number plate, photos of the chauffeur and the vehicle, assignments and ride steps, messages with the team, uploaded invoices and a technical notification identifier.</p>'
      '<p><strong>GPS location:</strong> the vehicle’s precise location is collected only during an assignment, including when Waze is open or the screen is locked. Collection stops at the end of the ride.</p>'
      '<p><strong>Why:</strong> to organise assignments, tell customers when their chauffeur is arriving, allow the team to follow rides and handle invoicing. This processing is based on our contractual relationship and our legitimate interest in following rides. No data is sold or used for advertising.</p>'
      '<p><strong>Who has access:</strong> the Rafai Limousine team, the customer during their ride (first name, photo, vehicle, number plate and location), and our technical providers: Google for hosting and notifications, Brevo for text messages.</p>'
      '<p><strong>Retention:</strong> locations are kept for 30 days after the ride. Other data is kept during the working relationship, then for the legally required period.</p>'
      '<p><strong>Your rights:</strong> access, correction, erasure and objection at contact@rafai-limousine.com. You can also complain to the CNIL, the French data protection authority.</p>')
n = 0
for title, blk in (('Vos droits', FR), ('Your rights', EN)):
    for tag in ('h3', 'h2'):
        mark = '<%s>%s</%s>' % (tag, title, tag)
        i = s.find(mark)
        if i >= 0:
            s = s[:i] + blk.replace('<h3', '<%s' % tag).replace('</h3>', '</%s>' % tag) + '\n\n' + s[i:]; n += 1
            break
    else:
        print('introuvable : ' + title)
if n != 2:
    print('ARRET emplacements trouves : %d' % n); sys.exit(1)
s = s.replace('mise à jour le 2 novembre 2026', 'mise à jour le 4 novembre 2026').replace('updated 2 November 2026', 'updated 4 November 2026')
io.open(f, 'w', encoding='utf-8').write(s)
print('ok confidentialite rl driver', n)
