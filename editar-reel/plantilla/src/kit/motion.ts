// Constantes de motion: curvas, springs y tiempos medidos (30 fps).
// Regla: ningún interpolate de posición/escala/opacidad sin easing (salvo el push-in).
import { Easing, interpolate, spring } from "remotion";

export const FPS = 30;

// --- Curvas (cubic-bezier) -------------------------------------------------
// Entrar: llega rápido y se posa (easeOutExpo / Penner).
export const EASE_IN_SCREEN = Easing.bezier(0.16, 1, 0.3, 1);
// Salir: acelera al irse (M3 emphasized accelerate).
export const EASE_OUT_SCREEN = Easing.bezier(0.3, 0, 0.8, 0.15);
// Moverse dentro del cuadro de A a B: asimétrico (M3 emphasized).
export const EASE_MOVE = Easing.bezier(0.2, 0, 0, 1);

// --- Springs (medidos con measureSpring en 4.0.534) ------------------------
// Sin rebote, se asienta en ~23 f.
export const SPRING_SMOOTH = { damping: 200 } as const;
// "Apple move" (ratio 1.0, response 0.4 s): se asienta en ~15 f, 0 % overshoot.
export const SPRING_SNAPPY = { stiffness: 247, damping: 31.4, mass: 1 } as const;
// Impacto puntual: ~4 % overshoot. Tope duro: 5 %. Nunca el spring por defecto (16 %).
export const SPRING_POP = { damping: 20, stiffness: 200, mass: 1 } as const;

// --- Tiempos en frames a 30 fps -------------------------------------------
export const DUR = {
  in: 14, // entrada de texto/elemento en video (UI usa 7 f; video tolera más)
  out: 8, // la salida es más corta que la entrada
  move: 18,
  transition: 12,
} as const;
export const STAGGER = 4; // entre elementos hermanos (3-5 f)

// --- Helpers ---------------------------------------------------------------
const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 con la curva de entrada, empezando en `start` y durando `dur` frames. */
export const enter = (frame: number, start: number, dur: number = DUR.in) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clampOpts, easing: EASE_IN_SCREEN });

/** 1→0 con la curva de salida, terminando en `end`. */
export const exit = (frame: number, end: number, dur: number = DUR.out) =>
  interpolate(frame, [end - dur, end], [1, 0], { ...clampOpts, easing: EASE_OUT_SCREEN });

export const springAt = (
  frame: number,
  start: number,
  config: { damping?: number; stiffness?: number; mass?: number } = SPRING_SNAPPY,
) => spring({ frame: frame - start, fps: FPS, config });

/**
 * Sincronía con la voz: el elemento debe LLEGAR en la palabra, no arrancar en ella.
 * Devuelve el frame de inicio para que la entrada alcance ~90 % en `wordFrame`.
 */
export const arriveAt = (wordFrame: number, framesTo90 = 8) => wordFrame - framesTo90;

/** Push-in lento y constante (lineal a propósito): 1 → 1.06 en la toma. */
export const pushIn = (frame: number, dur: number, amount = 0.06) =>
  interpolate(frame, [0, dur], [1, 1 + amount], clampOpts);
