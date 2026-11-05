#!/bin/bash
# Filme la vraie appli RL Driver sur l'émulateur, avec une mission de test fictive.
OUT=out-video; mkdir -p "$OUT"
A=com.rafailimousine.driver
L="$OUT/journal.txt"
log(){ echo "[$(date +%H:%M:%S)] $*" | tee -a "$L"; }
shot(){ adb exec-out screencap -p > "$OUT/$1.png" 2>/dev/null; log "capture $1"; }
tap(){ python3 .github/video/tap.py "$@" 2>&1 | tee -a "$L"; }
adb shell cmd location set-location-enabled true
adb shell settings put secure location_mode 3
adb shell cmd uimode night yes
adb shell settings put system screen_off_timeout 600000
adb shell svc power stayon true
adb emu geo fix 2.3295 48.8675
adb install -r android/driver/build/outputs/apk/release/driver-release.apk | tee -a "$L"
for p in android.permission.POST_NOTIFICATIONS android.permission.ACCESS_FINE_LOCATION android.permission.ACCESS_COARSE_LOCATION; do adb shell pm grant "$A" "$p"; done
( i=0; while [ $i -lt 110 ]; do adb emu geo fix "$(python3 -c "print(round(2.3295+$i*0.0007,5))")" "$(python3 -c "print(round(48.8675+$i*0.0005,5))")" >/dev/null 2>&1; i=$((i+1)); sleep 2; done ) &
adb shell screenrecord --bit-rate 6000000 --time-limit 175 /sdcard/demo.mp4 &
REC=$!
sleep 2
if [ -n "${DEMO_DRIVER_LINK:-}" ]; then
  adb shell am start -a android.intent.action.VIEW -d "'$DEMO_DRIVER_LINK'" -n "$A/.MainActivity" >/dev/null
else
  log "sans lien : ouverture simple de l'appli"
  adb shell am start -n "$A/.MainActivity" >/dev/null
fi
sleep 16; shot 1-accueil
if [ -n "${DEMO_DRIVER_LINK:-}" ]; then
  adb shell input swipe 540 1700 540 1100 500; sleep 2; shot 2-mission
  tap '.*Start trip.*' 8 scroll
  sleep 3; shot 3-apres-start
  tap '(OK|Oui|Confirmer|Autoriser.*|Lors de l.utilisation.*)' 2
  sleep 6; shot 4-suivi
  adb shell cmd statusbar expand-notifications; sleep 6; shot 5-notification
  adb shell cmd statusbar collapse; sleep 2
  adb shell input keyevent 3; sleep 2
  adb shell am start -a android.settings.SETTINGS >/dev/null; sleep 6; shot 6-autre-appli
  adb shell input keyevent 26; sleep 8
  adb shell input keyevent 224; sleep 2; adb shell wm dismiss-keyguard; sleep 2
  adb shell cmd statusbar expand-notifications; sleep 5; shot 7-retour-notification
  adb shell cmd statusbar collapse; sleep 1
  adb shell am start -n "$A/.MainActivity" >/dev/null; sleep 8; shot 8-retour-appli
else
  sleep 8; shot 2-attente
fi
adb shell pkill -INT screenrecord; sleep 4
wait $REC 2>/dev/null
adb pull /sdcard/demo.mp4 "$OUT/RL-Driver-GPS.mp4" | tee -a "$L"
adb shell dumpsys activity services "$A" 2>/dev/null | grep -cE 'GpsService' | sed 's/^/service GPS, lignes : /' | tee -a "$L"
exit 0
