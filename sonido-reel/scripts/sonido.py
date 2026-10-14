#!/usr/bin/env python3
"""
sonido.py — Capa de audio profesional para un reel.

Toma un video ya editado (con tu voz) y le agrega,
AD HOC al contenido:
  - normalizacion de la VOZ (loudnorm),
  - una cama de MUSICA sin copyright (royalty-free) elegida por mood,
  - DUCKING: la musica baja automaticamente bajo la voz (sidechaincompress),
  - EFECTOS DE SONIDO (SFX) colocados en tiempos exactos (whoosh, pop, riser, impact...),
  - master final a -14 LUFS / -1 dBTP (estandar TikTok/Reels/YouTube).

Solo cambia el AUDIO: el video (-c:v copy) queda intacto.

Uso:
    python3 sonido.py config.json
    python3 sonido.py config.json --measure   # ademas mide el LUFS del resultado

Esquema de config.json (todo lo opcional tiene default sano):
{
  "video": "/ruta/in.mp4",                 # requerido
  "out":   "/ruta/out.mp4",                # requerido
  "music": "house",                         # nombre de un .mp3 de assets/music/ o ruta a un .mp3
                                            #   o {"file":"tech","gain_db":-16,"fade_in":0.8,
                                            #      "fade_out":1.6,"duck":true,"start":0.0}
  "voice": {"normalize": true, "lufs": -16},
  "ducking": {"threshold":0.08,"ratio":2.5,"attack":20,"release":350},  # ~5 dB bajo la voz
  "scene_cuts": [8.0, 12.2, 19.2],          # atajo: en cada corte -> whoosh + pop
  "sfx": [                                   # SFX explicitos (lo "ad hoc")
    {"file":"riser",  "at":28.0, "gain_db":-9},
    {"file":"impact", "at":30.0, "gain_db":-4}
  ],
  "target_lufs": -14
}
"""
import sys, os, json, subprocess, shlex

S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # carpeta de la skill
MUSIC_DIR = os.path.join(S, "assets", "music")
SFX_DIR   = os.path.join(S, "assets", "sfx")


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    return p.returncode, p.stdout, p.stderr


def ffprobe_duration(path):
    rc, out, err = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=noprint_wrappers=1:nokey=1", path])
    try:
        return float(out.strip())
    except Exception:
        raise SystemExit(f"No pude leer duracion de {path}: {err}")


def has_audio_stream(path):
    rc, out, err = run(["ffprobe", "-v", "error", "-select_streams", "a",
                        "-show_entries", "stream=codec_type", "-of", "csv=p=0", path])
    return bool(out.strip())


def resolve_music(spec):
    """Devuelve dict normalizado de musica o None."""
    if spec is None:
        return None
    if isinstance(spec, str):
        spec = {"file": spec}
    f = spec.get("file")
    if not f:
        return None
    # mood -> assets/music/<mood>.mp3
    if not os.path.sep in f and not f.lower().endswith((".mp3", ".wav", ".m4a", ".aac", ".flac")):
        f = os.path.join(MUSIC_DIR, f + ".mp3")
    elif not os.path.isabs(f) and not os.path.exists(f):
        cand = os.path.join(MUSIC_DIR, f)
        f = cand if os.path.exists(cand) else f
    if not os.path.exists(f):
        raise SystemExit(f"Pista de musica no encontrada: {spec.get('file')} (busque en {MUSIC_DIR})")
    return {
        "file": f,
        "gain_db": float(spec.get("gain_db", -14)),
        "fade_in": float(spec.get("fade_in", 0.8)),
        "fade_out": float(spec.get("fade_out", 1.6)),
        "duck": bool(spec.get("duck", True)),
        "start": float(spec.get("start", 0.0)),
    }


def resolve_sfx_path(f):
    if not os.path.sep in f and not f.lower().endswith((".wav", ".mp3", ".m4a", ".aac")):
        return os.path.join(SFX_DIR, f + ".wav")
    if not os.path.isabs(f) and not os.path.exists(f):
        cand = os.path.join(SFX_DIR, f)
        if os.path.exists(cand):
            return cand
    return f


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    cfg_path = sys.argv[1]
    measure = "--measure" in sys.argv[2:]
    with open(cfg_path) as fh:
        cfg = json.load(fh)

    video = cfg["video"]
    out = cfg["out"]
    if not os.path.exists(video):
        raise SystemExit(f"Video de entrada no existe: {video}")
    DUR = ffprobe_duration(video)
    voice_present = has_audio_stream(video)

    music = resolve_music(cfg.get("music"))
    target = float(cfg.get("target_lufs", -14))
    vcfg = cfg.get("voice", {}) or {}
    voice_norm = bool(vcfg.get("normalize", True))
    voice_lufs = float(vcfg.get("lufs", -16))
    duck = cfg.get("ducking", {}) or {}
    # defaults medidos: ~5 dB de ducking bajo la voz. Más fuerte (ratio 9-12) y la música desaparece entera
    th = float(duck.get("threshold", 0.08)); ratio = float(duck.get("ratio", 2.5))
    atk = float(duck.get("attack", 20)); rel = float(duck.get("release", 350))

    # --- construir lista de SFX (scene_cuts -> whoosh+pop) + explicitos ---
    sfx = []
    for t in cfg.get("scene_cuts", []) or []:
        t = float(t)
        if t >= 0.15:
            sfx.append({"file": "whoosh", "at": round(t - 0.12, 3), "gain_db": -10})
        sfx.append({"file": "pop", "at": t, "gain_db": -11})
    for s in cfg.get("sfx", []) or []:
        sfx.append({"file": s["file"], "at": float(s.get("at", 0.0)),
                    "gain_db": float(s.get("gain_db", -8))})
    # resolver rutas y descartar los que caen fuera del video
    sfx_clean = []
    for s in sfx:
        p = resolve_sfx_path(s["file"])
        if not os.path.exists(p):
            print(f"  ⚠ SFX no encontrado, lo salto: {s['file']}")
            continue
        if s["at"] > DUR:
            continue
        sfx_clean.append({"path": p, "at": max(0.0, s["at"]), "gain_db": s["gain_db"]})
    sfx = sfx_clean

    if not music and not sfx and not voice_norm:
        raise SystemExit("Nada que hacer: sin musica, sin SFX y sin normalizar voz.")

    # --- armar inputs de ffmpeg ---
    inputs = ["-i", video]                       # input 0 = video
    idx = 1
    music_idx = None
    if music:
        inputs += ["-stream_loop", "-1", "-i", music["file"]]   # loop infinito, se recorta luego
        music_idx = idx; idx += 1
    sfx_idx = []
    for s in sfx:
        inputs += ["-i", s["path"]]
        sfx_idx.append(idx); idx += 1

    fc = []          # cadenas del filter_complex
    mix_labels = []  # etiquetas que entran al amix final
    AF = "aformat=channel_layouts=stereo:sample_rates=48000"

    # VOZ
    voice_label = None
    sc_label = None
    if voice_present:
        chain = f"[0:a]{AF}"
        if voice_norm:
            chain += f",loudnorm=I={voice_lufs}:TP=-1.5:LRA=11"
        if music and music["duck"]:
            fc.append(chain + "[vsplit]")
            fc.append("[vsplit]asplit=2[voicemix][voicesc]")
            voice_label = "voicemix"; sc_label = "voicesc"
        else:
            fc.append(chain + "[voicemix]")
            voice_label = "voicemix"

    # MUSICA
    music_label = None
    if music:
        st_out = max(0.0, DUR - music["fade_out"])
        mchain = (f"[{music_idx}:a]{AF},atrim=duration={DUR:.3f},asetpts=N/SR/TB,"
                  f"afade=t=in:d={music['fade_in']},afade=t=out:st={st_out:.3f}:d={music['fade_out']},"
                  f"volume={music['gain_db']}dB")
        if music["start"] > 0:
            mchain += f",adelay={int(music['start']*1000)}|{int(music['start']*1000)}"
        if music["duck"] and sc_label:
            fc.append(mchain + "[musicbase]")
            fc.append(f"[musicbase][{sc_label}]sidechaincompress="
                      f"threshold={th}:ratio={ratio}:attack={atk}:release={rel}[music]")
        else:
            fc.append(mchain + "[music]")
        music_label = "music"

    # SFX
    sfx_labels = []
    for i, s in enumerate(sfx):
        ms = int(round(s["at"] * 1000))
        lbl = f"sfx{i}"
        fc.append(f"[{sfx_idx[i]}:a]{AF},adelay={ms}|{ms},volume={s['gain_db']}dB[{lbl}]")
        sfx_labels.append(lbl)

    # ORDEN del mix: voz primero (define la duracion via duration=first); si no hay voz, musica.
    if voice_label:
        mix_labels.append(voice_label)
    if music_label:
        mix_labels.append(music_label)
    mix_labels += sfx_labels

    if not mix_labels:
        raise SystemExit("No hay pistas de audio para mezclar.")

    # loudnorm primero (master a target), y atrim como ÚLTIMA op → fija la duración EXACTA al video
    if len(mix_labels) == 1:
        fc.append(f"[{mix_labels[0]}]loudnorm=I={target}:TP=-1:LRA=11,"
                  f"apad,atrim=0:{DUR:.3f}[outa]")
    else:
        joined = "".join(f"[{l}]" for l in mix_labels)
        fc.append(f"{joined}amix=inputs={len(mix_labels)}:duration=first:normalize=0:"
                  f"dropout_transition=0[mixraw]")
        fc.append(f"[mixraw]loudnorm=I={target}:TP=-1:LRA=11,apad,atrim=0:{DUR:.3f}[outa]")

    cmd = (["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"] + inputs +
           ["-filter_complex", ";".join(fc),
            "-map", "0:v", "-map", "[outa]",
            # loudnorm sube el audio a 192 kHz por dentro y sin -ar sale a 96 kHz: Meta exige 48 kHz (14-oct-2026)
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            "-movflags", "+faststart", out])

    # resumen
    print(f"▶ Masterizando audio:")
    print(f"    video   : {os.path.basename(video)}  ({DUR:.1f}s, voz={'sí' if voice_present else 'no'})")
    if music:
        print(f"    música  : {os.path.basename(music['file'])}  gain={music['gain_db']}dB "
              f"duck={'sí' if (music['duck'] and sc_label) else 'no'}")
    if sfx:
        print(f"    SFX     : " + ", ".join(f"{os.path.basename(s['path']).split('.')[0]}@{s['at']:.1f}s" for s in sfx))
    print(f"    master  : {target} LUFS / -1 dBTP  →  {out}")

    rc, so, se = run(cmd)
    if rc != 0:
        print("\n✗ ffmpeg falló:\n" + se[-2500:])
        print("\nComando:\n" + " ".join(shlex.quote(c) for c in cmd))
        sys.exit(1)
    if not os.path.exists(out) or os.path.getsize(out) < 10000:
        raise SystemExit("✗ Salida vacía/inválida.")
    print(f"✓ Listo: {out}  ({os.path.getsize(out)//1024} KB)")

    if measure:
        print("  Midiendo LUFS del resultado…")
        rc, so, se = run(["ffmpeg", "-i", out, "-af",
                          "loudnorm=I=-14:TP=-1:LRA=11:print_format=summary", "-f", "null", "-"])
        for line in se.splitlines():
            if any(k in line for k in ("Input Integrated", "Input True Peak", "Output Integrated", "Output True Peak")):
                print("    " + line.strip())


if __name__ == "__main__":
    main()
