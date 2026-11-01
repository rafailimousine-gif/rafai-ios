#!/bin/bash
# Affiche la clé API Firebase des applis iOS (clé publique, intégrée aux applis) par blocs de 8, avec une empreinte de contrôle
for A in 1:1010543786852:ios:39d4ffa91db10ea9dc9871 1:1010543786852:ios:0f30d814e35118badc9871; do
  K=$(firebase apps:sdkconfig IOS "$A" --project rafai-suivi 2>/dev/null | tr -d '\n\t ' | sed -n 's/.*<key>API_KEY<\/key><string>\([^<]*\)<\/string>.*/\1/p')
  echo "== $A"
  echo "$K" | fold -w 8 | paste -sd'|' -
  echo -n "$K" | md5sum | cut -c1-8
done
