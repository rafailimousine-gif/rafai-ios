#!/bin/bash
# equipe.rafai-limousine.com → site Firebase rafai-equipe (demande de Yassine, 12 nov. 2026)
# Ajoute le domaine au site (une seule fois) puis affiche les enregistrements DNS à créer.
D=equipe.rafai-limousine.com
T=$(gcloud auth print-access-token)
U=https://firebasehosting.googleapis.com/v1beta1/projects/rafai-suivi/sites/rafai-equipe/customDomains
H=(-H "Authorization: Bearer $T" -H "x-goog-user-project: rafai-suivi" -H "Content-Type: application/json")
if [ -z "${VOIR:-}" ]; then
  curl -s -X POST "${H[@]}" -d '{}' "$U?customDomainId=$D" | python3 -c "import json,sys; d=json.load(sys.stdin); print('creation', d.get('error',{}).get('status') or 'ok')"
  sleep 12
fi
curl -s "${H[@]}" "$U/$D" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('etat', d.get('hostState'), d.get('ownershipState'), d.get('certState') or (d.get('cert') or {}).get('state'), (d.get('error') or {}).get('message',''))
for x in (d.get('requiredDnsUpdates') or {}).get('desired',[]):
    for r in x.get('records',[]): print('DNS', r.get('requiredAction'), r.get('type'), r.get('domainName'), r.get('rdata'))
"
echo FIN-DOM
