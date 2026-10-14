#!/usr/bin/env bash
# Encuentra los cortes que ya tiene tu video (donde cambia la toma) y los imprime en segundos.
# Uso: bash cortes.sh <video.mp4> [sensibilidad=0.12]
# Son los mejores lugares para cambiar el zoom: el corte disimula el salto.
set -euo pipefail
ffmpeg -v info -i "$1" -vf "select='gt(scene,${2:-0.12})',showinfo" -an -f null - 2>&1 \
  | grep -o "pts_time:[0-9.]*" | cut -d: -f2 | awk '{printf "%.2f\n", $1}'
