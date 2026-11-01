# Rafai Limousine · appli iPhone (clients)

Appli iPhone native autour de la réservation en ligne (booking.rafai-limousine.com) :
barre d'onglets native, connexion avec Apple, notifications de course, position GPS,
factures en aperçu natif, page Contact (appel, WhatsApp, e-mail, Plans) et écran hors connexion.

- `App/` : code Swift (SwiftUI + WKWebView)
- `Resources/` : icône, écran de lancement, textes des autorisations, déclaration de confidentialité
- `web/` : adaptation de la page de réservation quand elle est ouverte dans l'appli (`native.js`, appliqué par `fix8.py`)
- `project.yml` : projet Xcode (généré par XcodeGen)
- `.github/workflows/ios.yml` : compilation sur Mac (GitHub) et envoi sur TestFlight

## Compiler et envoyer sur TestFlight (sans Mac)

Chaque envoi sur `main` vérifie que l'appli compile.
Pour envoyer une version sur TestFlight : onglet **Actions** → **iPhone** → **Run workflow**.

Réglages du dépôt nécessaires (Settings → Secrets and variables → Actions), saisis par le titulaire du compte Apple :

| Nom | Type | Contenu |
| --- | --- | --- |
| `ASC_KEY_ID` | Secret | Identifiant de la clé API App Store Connect |
| `ASC_ISSUER_ID` | Secret | Issuer ID (page Clés de l'API App Store Connect) |
| `ASC_KEY_P8` | Secret | Contenu du fichier `AuthKey_XXXX.p8` |

La clé API doit avoir le rôle **Admin** (signature gérée par Apple).
