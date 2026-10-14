#!/usr/bin/env bash
# Transcribe un video palabra por palabra con whisper.cpp (local, gratis) y deja palabras.json.
# Uso: bash transcribir.sh <video.mp4> <carpeta_salida> [modelo=small] [idioma=es]
# Salidas: <carpeta>/audio.wav, tokens.json (crudo de whisper), palabras.json ([{w,s,e}]), texto.txt
set -euo pipefail

VIDEO="$1"; OUT="$2"; MODELO="${3:-small}"; IDIOMA="${4:-es}"
AQUI="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$OUT"
MODEL_BIN="$HOME/.cache/whisper-cpp/ggml-${MODELO}.bin"

command -v whisper-cli >/dev/null || { echo "Falta whisper.cpp: brew install whisper-cpp"; exit 1; }
command -v ffmpeg >/dev/null || { echo "Falta ffmpeg: brew install ffmpeg"; exit 1; }

if [ ! -f "$MODEL_BIN" ]; then
  mkdir -p "$(dirname "$MODEL_BIN")"
  echo "Descargando el modelo ${MODELO} de whisper (una sola vez)..."
  curl -L --fail -o "$MODEL_BIN" "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${MODELO}.bin"
fi

ffmpeg -y -v error -i "$VIDEO" -ar 16000 -ac 1 -c:a pcm_s16le "$OUT/audio.wav"
# -ml 1 = un token por segmento: es lo que da el tiempo de cada palabra (sin esto no hay karaoke)
whisper-cli -m "$MODEL_BIN" -f "$OUT/audio.wav" -l "$IDIOMA" -ml 1 --output-json -of "$OUT/tokens" >/dev/null 2>&1
python3 "$AQUI/palabras.py" "$OUT/tokens.json" "$OUT/palabras.json" | tee "$OUT/texto.txt"
