#!/usr/bin/env python3
"""variantes.py — un reel, varios ganchos: pone un texto distinto en los primeros segundos de
cada copia del video. Lo demás (imagen, audio) queda igual.

  python3 variantes.py --video reel.mp4 --ganchos ganchos.txt --out variantes/ [--seg 5] [--y 0.22]

Necesita Python 3, ffmpeg y Pillow (pip install pillow). En Windows, usa `python` o `py` en vez de `python3`.
"""
import argparse
import os
import shutil
import subprocess
import sys

# Windows imprime con una codificación vieja que no acepta ✓ ni «»: sin esto se cae tras la 1ª variante.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

try:
    from PIL import ImageFont
except ImportError:
    sys.exit("✗ falta Pillow: pip install pillow")

FUENTES = [
    "/System/Library/Fonts/Supplemental/Arial Black.ttf",   # Mac
    "C:/Windows/Fonts/ariblk.ttf",                          # Windows
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # Linux
]
ANCHO_UTIL = 0.815  # del ancho del video: deja margen para que no toque los bordes
TAM_MAX, TAM_MIN = 0.07, 0.037  # del ancho del video (76 y 40 px en 1080)


def escapar(t):
    return t.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace("%", "\\%")


def lineas_y_tamano(texto, fuente, ancho):
    palabras = texto.upper().split()
    mejor = None
    for n in (1, 2, 3):
        if n > len(palabras):
            break
        # reparte en n líneas parejas
        k = -(-len(palabras) // n)
        lineas = [" ".join(palabras[i:i + k]) for i in range(0, len(palabras), k)]
        f = ImageFont.truetype(fuente, 100)
        tam = min(int(TAM_MAX * ancho), int(ANCHO_UTIL * ancho / max(f.getlength(l) for l in lineas) * 100))
        if mejor is None or tam > mejor[1]:
            mejor = (lineas, tam)
    if mejor[1] < TAM_MIN * ancho:
        sys.exit(f"✗ el gancho «{texto}» es muy largo; acórtalo a 6 palabras o menos")
    return mejor


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--ganchos", required=True, help="txt con un gancho por línea")
    ap.add_argument("--out", required=True, help="carpeta de salida")
    ap.add_argument("--seg", type=float, default=5.0)
    ap.add_argument("--y", type=float, default=0.22, help="centro vertical del texto, como fracción del alto (0.22 = arriba)")
    ap.add_argument("--fuente")
    a = ap.parse_args()

    if not shutil.which("ffmpeg"):
        sys.exit("✗ falta ffmpeg")
    fuente = a.fuente or next((f for f in FUENTES if os.path.exists(f)), None)
    if not fuente:
        sys.exit("✗ no encontré una fuente gruesa; pasa una con --fuente ruta.ttf")
    ganchos = [l.strip() for l in open(a.ganchos, encoding="utf-8") if l.strip()]
    if not ganchos:
        sys.exit("✗ ganchos.txt está vacío")
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                        "-of", "csv=p=0", a.video], capture_output=True, text=True)
    try:
        ancho, alto_v = (int(x) for x in r.stdout.strip().split(",")[:2])
    except ValueError:
        sys.exit("✗ no pude leer el tamaño del video (¿está ffprobe, que viene con ffmpeg?)")
    os.makedirs(a.out, exist_ok=True)
    ff = fuente.replace(":", "\\:")

    for n, g in enumerate(ganchos, 1):
        lineas, tam = lineas_y_tamano(g, fuente, ancho)
        alto = int(tam * 1.18)
        y0 = int(a.y * alto_v) - (len(lineas) - 1) * alto // 2
        filtros = ",".join(
            f"drawtext=fontfile='{ff}':text='{escapar(l)}':fontcolor=white:fontsize={tam}"
            f":box=1:boxcolor=black@0.72:boxborderw=18:x=(w-text_w)/2:y={y0 + i * alto}-text_h/2"
            f":enable='lt(t,{a.seg})'"
            for i, l in enumerate(lineas))
        salida = os.path.join(a.out, f"variante_{n}.mp4")
        r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", a.video,
                            "-vf", filtros, "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
                            "-c:a", "copy", "-movflags", "+faststart", salida],
                           capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit(f"✗ ffmpeg falló en la variante {n}:\n{r.stderr[-600:]}")
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", salida,
                        "-frames:v", "1", salida.replace(".mp4", "_portada.png")])
        print(f"  ✓ variante_{n}.mp4  «{g}»  ({len(lineas)} línea(s), {tam}px)")
    print(f"Listo: {len(ganchos)} versiones en {a.out}")


if __name__ == "__main__":
    main()
