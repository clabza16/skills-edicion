---
name: trial-reels
description: Toma un reel ya editado y saca 6 versiones, cada una con un gancho escrito distinto en los primeros segundos (que también queda como portada), para subirlas como reels de prueba de Instagram y ver cuál gana. Úsala cuando digan "hazme variantes de este reel", "sácale 6 ganchos", "quiero probar ganchos distintos", "arma los trial reels", "dame versiones para probar" o después de editar un reel con editar-reel.
---

# trial-reels

Un video, seis ganchos. Lo único que cambia entre versiones es **el texto grande de los primeros
segundos**; el audio y la edición quedan iguales. Así sabes qué gancho funciona, no qué video.
El motor es `scripts/variantes.py` (ffmpeg, segundos por versión).

## Pasos

1. **Parte del video SIN gancho escrito** (si ya trae uno, el nuevo se le monta encima). **Mira el video y
   escucha la primera frase.** El gancho escrito NO repite lo que se dice: si lo
   repite, es un subtítulo. Tiene que sumar una razón para quedarse.
2. **Escribe 6 ganchos de 6 palabras o menos, uno de cada tipo:**
   - **Cifra:** "3 minutos y lo tienes listo"
   - **Negación:** "No necesitas saber editar"
   - **Confesión:** "Esto lo hice sin saber nada"
   - **Tiempo:** "Lo que me tomaba una tarde"
   - **A quién le habla:** "Si vendes por Instagram, mira"
   - **Contradicción:** "Grabar más no te hace crecer"

   Guárdalos en `ganchos.txt`, uno por línea, y muéstraselos a la persona antes de seguir.
3. **Genera las 6 versiones:**
   ```bash
   python3 <esta-skill>/scripts/variantes.py --video reel.mp4 --ganchos ganchos.txt --out variantes/
   ```
   Opcional: `--seg 4` (cuántos segundos dura el gancho, 5 por defecto), `--y 420` (altura del
   texto) y `--fuente ruta.ttf`.
4. **Revisa el primer cuadro de cada una** (`variantes/variante_N_portada.png`): que el texto se lea
   entero y no tape la cara. Si tapa, cambia `--y`.
5. **Súbelas como reels de prueba** (al compartir el reel en Instagram, activa la opción de reel de
   prueba: se muestra primero a quienes no te siguen). Una por día, a la misma hora, y anota el orden.
6. **Elige la ganadora a los 3 días**: la que retuvo a más gente en los primeros segundos (lo ves en
   las estadísticas de cada reel). Esa la compartes con tus seguidores.

## Lo que no hace

- No edita el video: para eso está `editar-reel`.
- No sube nada por ti: las versiones las subes tú desde la app de Instagram.
