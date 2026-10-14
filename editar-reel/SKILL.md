---
name: editar-reel
description: Edita un video vertical donde una persona habla a cámara (reel de Instagram o TikTok) y le agrega zoom en cada corte, un gancho legible desde el primer cuadro, títulos, subtítulos karaoke, un chat que se escribe solo, una lista tipo Finder, capturas en abanico, pantalla dividida con otro video y un botón de seguir al cierre. Úsala cuando digan "edita este video", "hazlo más dinámico", "ponle subtítulos", "agrégale zooms y efectos", "que se vea profesional", "edítalo para reels" o pasen un video vertical hablado. Renderiza con Remotion desde public/plan.json.
---

# editar-reel

Toma un video vertical donde alguien habla a cámara (ya cortado: sin silencios ni tomas malas) y
lo deja listo para subir. **No toca lo que dice la persona**: agrega la capa de edición encima.

La plantilla está en `plantilla/` (Remotion). Todo lo que pasa en pantalla se describe en
`plantilla/public/plan.json`; tu trabajo es escribir ese plan con criterio, no programar.

## Requisitos (revísalos antes de empezar)

- `ffmpeg` y `whisper-cli` (whisper.cpp). Mac: `brew install ffmpeg whisper-cpp`. Windows: `winget install Gyan.FFmpeg`
  y el zip de whisper.cpp de https://github.com/ggml-org/whisper.cpp/releases (deja `whisper-cli.exe` en el PATH).
- Node 18 o más nuevo (Windows: `winget install OpenJS.NodeJS`), y Google Chrome instalado.
- Si falta algo, instálalo tú con permiso de la persona; si el instalador pide su clave, que la escriba ella. No sigas a medias.
- En Windows los scripts `.sh` corren en Git Bash (Claude Code en Windows lo usa). Si `bash` no está, usa sus comandos equivalentes.

## Pasos

### 1. Prepara la carpeta del reel

```bash
cp -R <esta-skill>/plantilla ~/reels/<nombre-del-reel>
cd ~/reels/<nombre-del-reel> && npm install
cp <su-video> public/video.mp4
```

El video tiene que ser **vertical 1080×1920** (si viene en 4K vertical, bájalo con
`ffmpeg -i in.mov -vf scale=1080:1920 -c:a copy public/video.mp4`; nunca lo recortes para agrandar
la cara: la gente prefiere verse con aire).

### 2. Transcribe y busca los cortes

```bash
bash <esta-skill>/scripts/transcribir.sh public/video.mp4 public
bash <esta-skill>/scripts/cortes.sh public/video.mp4
```

- `transcribir.sh` deja `public/palabras.json` (cada palabra con su segundo) e imprime el texto.
  **Léelo entero.** whisper se equivoca con nombres propios ("Cloud" por "Claude"): arréglalo con
  un `correcciones.json` y `python3 <esta-skill>/scripts/palabras.py public/tokens.json public/palabras.json correcciones.json`.
  Si una palabra no se entiende, pregúntale a la persona; no la adivines.
- `cortes.sh` imprime los segundos donde cambia la toma. Van a `cortes_s` del plan.

### 3. Ubica la cara

Saca 6-8 cuadros repartidos y mira a qué altura está la cara (en píxeles, sobre 1920):

```bash
for t in 1 5 10 15 20 25; do ffmpeg -y -v error -ss $t -i public/video.mp4 -frames:v 1 /tmp/cara_$t.jpg; done
```

`cara_y` = la altura de los ojos o la nariz (típico: 700-900). Los zooms se centran ahí, y los
títulos van **arriba de la cabeza**: anota también dónde queda la coronilla en el cuadro donde
está más arriba. Si queda sobre y=450, los títulos no caben arriba: usa menos títulos.

### 4. Escribe el plan

Copia la forma de `plantilla/public/plan.json` (es un ejemplo completo). **Si no hay otro video ni capturas, borra `split` y `pantallazos`**: apuntan a archivos de ejemplo que no vienen en el repo. Los `cortes_s` van en orden y sin repetir. Reglas:

**Ritmo**
- **Un zoom por toma** (`zooms`, uno por tramo entre cortes), alternando planos: 1.0 → 1.16 → 1.0
  → 1.26… El cambio de escala en el corte disimula el salto. Nunca más de 1.3: se ve pixelado.
- Algo nuevo en pantalla cada 3-5 segundos, pero **una idea a la vez**: nunca un título y un chat juntos.

**El gancho (los primeros 2 segundos deciden todo)**
- `gancho.linea` se ve **desde el primer cuadro**, sin animación de entrada: es también la portada.
- **No repite lo que dice la voz.** Si la voz dice "3 millones vieron esto", el texto dice otra
  cosa que choque ("Lo hizo mi IA"). Si repite, es un subtítulo y se desperdició.
- Lo mejor para el cuadro 1 es movimiento: un `split` con el resultado (el video viral, el antes y
  después) arriba y la persona abajo, que se cierra cuando termina la primera frase.

**Cada elemento llega en su palabra**
- Busca en `palabras.json` el segundo exacto de la palabra que nombra la cosa, y haz que el
  elemento empiece 0,15-0,3 s antes. Un título que aparece después de la palabra se siente tarde.
- `lista[].filas[].marcar_s` = el segundo en que la persona nombra esa fila.

**Qué usar para qué**
| Lo que dice | Elemento |
|---|---|
| Una idea en pocas palabras ("el secreto: las skills") | `titulos` (kicker corto en mayúsculas + texto; `*palabra*` se resalta) |
| Le pidió algo a una IA | `chat` con el mensaje **literal** que escribió (pregúntaselo si no lo tienes) |
| Nombres concretos: carpetas, archivos, herramientas, pasos | `lista` (máximo 7 filas) |
| "Mira el resultado" | `pantallazos` (hasta 3 capturas del resultado real) o `split` con el video |
| Cierre "sígueme" | `cierre` con su usuario |

**Honestidad (no negociable):** en pantalla solo va lo que es verdad. Un chat muestra el mensaje
que de verdad se escribió; una cifra, la cifra real. Si no lo sabes, pregunta o no lo pongas.

**Zona segura:** la plantilla ya pone todo entre x 110-900 e y 250-1290, lejos de los botones y el
caption de Instagram. No muevas elementos fuera de eso.

### 5. Mira cuadros sueltos antes del render completo

```bash
npx remotion still Reel out/f0.png --frame=0
```

Saca un cuadro por cada elemento (en el segundo × 30) y **míralos**. Revisa: la cara nunca queda
tapada (salvo la lista y los pantallazos, que oscurecen el fondo a propósito), los textos no se
cortan, el gancho se lee en el cuadro 0.

Si el render se queda pegado en "Waiting for root component to load", usa el Chrome del sistema:
`--browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"` (Mac) o
`--browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"` (Windows).

### 6. Render y revisión final

```bash
npx remotion render Reel out/reel.mp4
ffmpeg -v error -i out/reel.mp4 -f null - && echo "el archivo está sano"
ffmpeg -y -v error -i out/reel.mp4 -vf "fps=1,scale=216:384,tile=10x3" -frames:v 1 out/hoja.jpg
```

Mira `out/hoja.jpg` (un cuadro por segundo). Si un cuadro sale "en mosaico" o negro (pasa a
veces con videos dentro de Remotion), renderiza ese cuadro solo con `remotion still` y pégalo:
`ffmpeg -i out/reel.mp4 -i fix.png -filter_complex "[0:v][1:v]overlay=enable='eq(n,N)'" -c:a copy out/reel_ok.mp4`.

Después pasa el video por la skill **sonido-reel** para la música, los efectos y el volumen final.

## Errores conocidos

- **Subtítulos con palabras pegadas ("Yesto")**: un espacio suelto entre `<span>` se pierde en el
  render. La plantilla ya separa con margen; si agregas texto palabra por palabra, haz lo mismo.
- **Nada de `filter: blur()` ni `backdropFilter` sobre el video**: dan cuadros en negro o en mosaico.
  Para oscurecer, una capa de color semitransparente encima.
- **El video de arriba en el split trae su propio texto**: ajusta `recorte_y` para mostrar la franja
  limpia, o elige otro segundo con `broll_desde_s`.
