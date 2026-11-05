#!/usr/bin/env python3
"""Touche le grand bouton doré (Start trip) de la première mission affichée, repéré sur la capture d'écran."""
import io, subprocess, sys
from PIL import Image

png = subprocess.run("adb exec-out screencap -p", shell=True, capture_output=True).stdout
im = Image.open(io.BytesIO(png)).convert("RGB")
W, H = im.size
px = im.load()
rows = []
for y in range(220, H - 140, 4):
    n = sum(1 for x in range(0, W, 6)
            if 170 < px[x, y][0] < 245 and 130 < px[x, y][1] < 205 and 50 < px[x, y][2] < 130 and px[x, y][0] > px[x, y][2] + 70)
    if n * 6 > W * 0.7:
        rows.append(y)
if not rows:
    print("bouton doré introuvable", flush=True)
    sys.exit(1)
band = [rows[0]]
for y in rows[1:]:
    if y - band[-1] > 8:
        break
    band.append(y)
y = (band[0] + band[-1]) // 2
subprocess.run(f"adb shell input tap {W // 2} {y}", shell=True)
print(f"bouton doré touché à y={y}", flush=True)
