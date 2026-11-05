#!/usr/bin/env python3
"""Cherche un texte à l'écran (arbre d'accessibilité) et touche son centre. Ne journalise que le libellé demandé."""
import html, re, subprocess, sys, time

def nodes():
    x = subprocess.run("adb exec-out uiautomator dump /dev/tty", shell=True, capture_output=True, text=True, timeout=40).stdout
    for m in re.finditer(r"<node [^>]*>", x):
        n = m.group(0)
        t = html.unescape((re.search(r' text="([^"]*)"', n) or [0, ""])[1])
        d = html.unescape((re.search(r' content-desc="([^"]*)"', n) or [0, ""])[1])
        b = re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', n)
        if b:
            yield t, d, tuple(map(int, b.groups()))

def main():
    pat = re.compile(sys.argv[1], re.I)
    tries = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    swipe = len(sys.argv) > 3 and sys.argv[3] == "scroll"
    for i in range(tries):
        try:
            for t, d, (a, b, c, e) in nodes():
                if (pat.fullmatch(t.strip()) or pat.fullmatch(d.strip())) and e > b and 160 < (b + e) // 2 < 2230:
                    subprocess.run(f"adb shell input tap {(a + c) // 2} {(b + e) // 2}", shell=True)
                    print(f"touché : {sys.argv[1]}", flush=True)
                    return 0
        except Exception as ex:
            print("essai :", type(ex).__name__, flush=True)
        if swipe:
            subprocess.run("adb shell input swipe 540 1700 540 1000 500", shell=True)
        time.sleep(2)
    print(f"introuvable : {sys.argv[1]}", flush=True)
    return 1

sys.exit(main())
