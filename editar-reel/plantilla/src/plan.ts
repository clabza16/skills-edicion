// El reel se arma desde dos archivos de public/:
//  - palabras.json: lo que dices, palabra por palabra con su tiempo (scripts/transcribir.sh)
//  - plan.json:     qué pasa en pantalla y cuándo (lo escribe Claude siguiendo el SKILL.md)
import planJson from "../public/plan.json";
import palabrasJson from "../public/palabras.json";

export const FPS = 30;

export type Palabra = { w: string; s: number; e: number };
type Tramo = { desde_s: number; hasta_s: number };
export type Plan = {
  video: string;
  duracion_s: number;
  cortes_s?: number[];
  zooms?: number[];
  cara_y?: number;
  colores?: { acento?: string; resalte?: string };
  gancho?: { linea: string; sub?: string; hasta_s: number };
  titulos?: (Tramo & { kicker?: string; texto: string })[];
  chat?: (Tramo & { app?: string; mensaje: string; respuesta?: string })[];
  lista?: (Tramo & { titulo: string; filas: { nombre: string; nota?: string; marcar_s?: number }[] })[];
  pantallazos?: (Tramo & { imagenes: string[] })[];
  // recorte_y: desde qué altura del otro video (vertical 1080×1920) se muestra la franja de 760 px
  split?: (Tramo & { video: string; broll_desde_s?: number; recorte_y?: number })[];
  cierre?: { usuario: string; desde_s: number };
};

export const PLAN = planJson as Plan;
export const PALABRAS = palabrasJson as Palabra[];
export const TOTAL = Math.round(PLAN.duracion_s * FPS);
export const f = (s: number) => Math.round(s * FPS);

export const ACENTO = PLAN.colores?.acento ?? "#0051FF";
export const RESALTE = PLAN.colores?.resalte ?? "#9FC5FF";

// Cortes en frames, con el inicio y el final incluidos: [0, c1, c2, ..., TOTAL]
export const CORTES = [0, ...(PLAN.cortes_s ?? []).map(f), TOTAL];
// Un zoom por toma. Si no lo defines, alterna 1.0 / 1.15 para disimular los saltos de corte.
export const ZOOM = (k: number) => PLAN.zooms?.[k] ?? (k % 2 ? 1.15 : 1);
