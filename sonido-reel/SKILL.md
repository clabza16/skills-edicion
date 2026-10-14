---
name: sonido-reel
description: Le pone el sonido profesional a un reel ya editado — música sin copyright que baja sola cuando la persona habla, efectos de sonido en los momentos justos (whoosh en las transiciones, pop cuando aparece un texto, impacto cuando cae una cifra) y el volumen final al estándar de Instagram y TikTok (-14 LUFS, 48 kHz). Úsala cuando digan "ponle música", "agrégale efectos de sonido", "que suene profesional", "masteriza el audio", "quítale la música" o después de editar un reel con editar-reel.
---

# sonido-reel

Solo toca el audio: la imagen queda intacta. El motor es `scripts/sonido.py` (ffmpeg).

## Antes de empezar: la música y los efectos los pones tú

Esta skill **no trae audio** (las licencias no permiten redistribuirlo). Una vez:

- **Música** → `assets/music/<nombre>.mp3`. Gratis y sin copyright: Pixabay Music (sin atribución)
  o Incompetech (gratis, pide crédito en el caption). **Nunca** una canción comercial: Instagram
  silencia o baja el video.
- **Efectos** → `assets/sfx/<nombre>.wav`. Los que usa el ejemplo: `whoosh`, `whoosh_soft`, `swish`,
  `pop`, `click`, `impact`, `shimmer`. Pixabay Sound Effects los tiene todos.

Si las carpetas están vacías, dile a la persona qué bajar y dónde dejarlo. Sin música, la skill
igual sirve para los efectos y el volumen.

## Pasos

### 1. Mira el video y anota los momentos

Los efectos se eligen por lo que pasa en **ese** video, no por plantilla. Recorre el video (o el
`plan.json` de editar-reel, que ya tiene los segundos) y anota:

| Momento | Efecto | Volumen sugerido |
|---|---|---|
| Transición grande (se divide la pantalla, entra un abanico) | `whoosh` / `whoosh_soft` / `swish` | -12 |
| Aparece una ventana o un título | `pop` | -13 |
| Se envía un mensaje, se aprieta un botón | `click` | -10 |
| Cae una cifra grande | `impact` | -11 |
| La idea clave ("el secreto es…") | `shimmer` | -17 |

**Con moderación:** entre 6 y 12 efectos en un reel de 30 s. Un efecto en cada corte cansa.
Varía: no uses el mismo whoosh tres veces seguidas.

### 2. Escribe el config.json

```json
{
  "video": "out/reel.mp4",
  "out": "out/reel_sonido.mp4",
  "music": {"file": "house", "gain_db": -17, "fade_in": 0.2, "fade_out": 1.0, "duck": true},
  "voice": {"normalize": true, "lufs": -16},
  "sfx": [
    {"file": "whoosh_soft", "at": 1.95, "gain_db": -12},
    {"file": "pop", "at": 5.25, "gain_db": -13},
    {"file": "impact", "at": 22.1, "gain_db": -11}
  ],
  "target_lufs": -14
}
```

- `at` = segundo exacto. El whoosh va ~0,1 s **antes** del movimiento; el impacto, justo en la llegada.
- **Sin música**: borra la línea `"music"`. Quedan la voz y los efectos.
- `gain_db` de la música: -15 a -18. La música baja sola ~5 dB cuando hay voz (ducking); si
  igual tapa la voz, baja la música, no subas el ducking (con ducking fuerte desaparece entera).

### 3. Corre y mide

```bash
python3 <esta-skill>/scripts/sonido.py config.json --measure
ffprobe -v error -show_entries stream=sample_rate -of csv=p=0 out/reel_sonido.mp4
```

Debe quedar en **-14 LUFS (±1)**, pico ≤ -1 dBTP y **48000 Hz**. Instagram rechaza o recodifica
audio de 96 kHz.

### 4. Que lo escuche la persona

La medición no reemplaza el oído. Entrega y pregunta: ¿música más fuerte o más suave? ¿más o
menos efectos? Ajustar es cambiar números en el config y volver a correr (segundos).
