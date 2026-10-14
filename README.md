# skills-edicion

Tres skills para que Claude edite tus reels por ti: **investiga** el tema, **edita** el video
(zooms, subtítulos, títulos, efectos tipo motion, pantallazos) y le pone **el sonido**.

Son las que uso para mis videos en Instagram ([@calbornoz.ia](https://www.instagram.com/calbornoz.ia/)),
adaptadas para que funcionen con las tuyas: sin mi marca, sin mis llaves, sin nada pegado a mi
computador.

| Skill | Qué hace |
|---|---|
| [`editar-reel`](editar-reel/SKILL.md) | Toma tu video vertical hablando a cámara y le agrega zoom en cada corte, un gancho que se lee desde el primer segundo, títulos, subtítulos karaoke, un chat que se escribe solo, una lista tipo Finder, capturas en abanico, pantalla dividida con otro video y un botón de seguir. Con Remotion. |
| [`sonido-reel`](sonido-reel/SKILL.md) | Música sin copyright que baja sola cuando hablas, efectos en los momentos justos y el volumen al estándar de Instagram (-14 LUFS, 48 kHz). |
| [`investigar-noticia`](investigar-noticia/SKILL.md) | Antes de explicar algo en video: lee varias fuentes y arma una ficha con cada dato y su fuente, para no publicar nada falso. |

## Qué necesitas

- **Claude Code** (la app de escritorio de Claude, pestaña Code, o la terminal).
- Mac o Windows. Lo necesario (ffmpeg, whisper-cpp y Node) te lo instala el mismo Claude con el texto de abajo.
  A mano: en Mac `brew install ffmpeg whisper-cpp node`; en Windows `winget install Gyan.FFmpeg OpenJS.NodeJS`
  y whisper.cpp desde sus [releases](https://github.com/ggml-org/whisper.cpp/releases). Google Chrome instalado.
- Tu video ya cortado (sin silencios ni tomas malas), vertical.

## Instalación (la forma fácil)

Pégale esto a Claude Code:

> Instala las skills de https://github.com/clabza16/skills-edicion en ~/.claude/skills (una
> carpeta por skill: editar-reel, sonido-reel e investigar-noticia) y revisa que tenga ffmpeg,
> whisper-cpp y node instalados. Si falta algo, instálalo.

Después, para usarlas:

> Edita el video ~/Downloads/mi-video.mp4 con la skill editar-reel y después ponle sonido con
> sonido-reel.

Claude transcribe tu video, te pregunta lo que no sabe (por ejemplo, el mensaje exacto que le
escribiste a la IA), arma la edición, revisa los cuadros y te entrega el MP4.

## Instalación a mano

```bash
git clone https://github.com/clabza16/skills-edicion /tmp/skills-edicion
mkdir -p ~/.claude/skills
cp -R /tmp/skills-edicion/{editar-reel,sonido-reel,investigar-noticia} ~/.claude/skills/
```

## Lo que no trae

- **Música ni efectos de sonido**: las licencias no permiten redistribuirlos. `sonido-reel` te dice
  de dónde bajarlos gratis y sin copyright, y dónde dejarlos.
- **Tu estilo**: los colores vienen en azul; cámbialos en `plan.json` (`colores`). Lo demás
  (tamaños, zonas seguras, tiempos de animación) ya está medido para Reels.

## Licencia

MIT. Úsalas, cámbialas, compártelas.
