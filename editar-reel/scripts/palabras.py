#!/usr/bin/env python3
"""Une los tokens de whisper.cpp en palabras con su tiempo, y aplica correcciones.

Uso: python3 palabras.py tokens.json palabras.json [correcciones.json]

whisper entrega pedazos ("comput", "ador"); esto los junta en palabras reales y pega la
puntuación a la palabra anterior. Salida: [{"w": "palabra", "s": inicio_s, "e": fin_s}, ...]

correcciones.json (opcional) arregla lo que whisper oye mal, sobre todo nombres de marca:
  {"Cloud": "Claude", "clod": "Claude"}
Revisa SIEMPRE el texto que imprime: whisper se equivoca con nombres propios.
"""
import json
import sys

src, dst = sys.argv[1], sys.argv[2]
corr = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
PUNT = set(",.?!;:%¿¡)…\"")

palabras = []
for tk in json.load(open(src))["transcription"]:
    crudo = tk["text"]
    t = crudo.strip()
    if not t or t.startswith("["):  # [Música], [Risas]: no es voz
        continue
    s, e = tk["offsets"]["from"] / 1000, tk["offsets"]["to"] / 1000
    if all(c in PUNT for c in t):
        if palabras:
            palabras[-1]["w"] += t
            palabras[-1]["e"] = e
        continue
    if crudo.startswith(" ") or not palabras:
        palabras.append({"w": t, "s": s, "e": e})
    else:
        palabras[-1]["w"] += t
        palabras[-1]["e"] = e

for p in palabras:
    limpia = p["w"].rstrip(",.?!;:")
    if limpia in corr:
        p["w"] = corr[limpia] + p["w"][len(limpia):]

json.dump(palabras, open(dst, "w"), ensure_ascii=False, indent=0)
print(f"{len(palabras)} palabras -> {dst}\n")
print(" ".join(f"{p['w']}" for p in palabras))
