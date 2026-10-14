// Plantilla de edición de un reel hablado (1080×1920): zoom por toma, gancho, títulos, chat que se
// escribe solo, lista tipo Finder, pantallazos en abanico, pantalla dividida con otro video,
// subtítulos karaoke y botón de seguir. Todo sale de public/plan.json + public/palabras.json.
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as manrope } from "@remotion/google-fonts/Manrope";
import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { SPRING_SNAPPY, enter, exit, springAt } from "./kit/motion";
import { ACENTO, CORTES, FPS, PALABRAS, PLAN, RESALTE, TOTAL, ZOOM, f } from "./plan";

const { fontFamily: TITULO } = manrope("normal", { weights: ["700", "800"], subsets: ["latin", "latin-ext"] });
const { fontFamily: TEXTO } = inter("normal", { weights: ["600", "700"], subsets: ["latin", "latin-ext"] });
const MONO = "Menlo, Consolas, monospace";

// Zona segura de Instagram/TikTok: fuera de esto lo tapan los botones, el nombre y el caption.
const Z = { x0: 110, x1: 900, y0: 250, y1: 1290 };
const CARA_Y = PLAN.cara_y ?? 800;
const PANEL_H = 760; // alto del video de arriba cuando la pantalla se divide
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const STROKE: React.CSSProperties = { WebkitTextStroke: "10px #000", paintOrder: "stroke fill", textShadow: "0 4px 18px rgba(0,0,0,.55)" };
const SOMBRA = "0 26px 60px rgba(0,8,32,.55)";

const toma = (fr: number) => {
  let k = 0;
  while (k < CORTES.length - 2 && fr >= CORTES[k + 1]) k++;
  return k;
};

// --- Pantalla dividida: 0 = tú a pantalla completa, 1 = otro video arriba y tú abajo -------------
const splitP = (fr: number) => {
  let p = 0;
  for (const s of PLAN.split ?? []) {
    const a = f(s.desde_s), b = f(s.hasta_s);
    if (fr < a - 12 || fr > b + 14) continue;
    const entra = a <= 2 ? 1 : springAt(fr, a - 6, SPRING_SNAPPY); // si parte en 0, ya está dividida
    const sale = 1 - springAt(fr, b - 6, SPRING_SNAPPY);
    p = Math.max(p, Math.min(entra, sale));
  }
  return Math.max(0, Math.min(1, p));
};

const Persona: React.FC = () => {
  const fr = useCurrentFrame();
  const k = toma(fr);
  const z = ZOOM(k) * interpolate(fr, [CORTES[k], CORTES[k + 1]], [1, 1.035], clamp); // empuje lento dentro de la toma
  const p = splitP(fr);
  return (
    <AbsoluteFill style={{ top: PANEL_H * p, height: 1920 - PANEL_H * p, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: -(CARA_Y - 380) * p, width: 1080, height: 1920, transform: `scale(${z})`, transformOrigin: `540px ${CARA_Y}px` }}>
        <OffthreadVideo src={staticFile(PLAN.video)} style={{ width: 1080, height: 1920 }} />
      </div>
    </AbsoluteFill>
  );
};

// El video de arriba en el split (va dentro de una Sequence; `off` = frame global donde empieza).
const Panel: React.FC<{ video: string; off: number; desde: number; recorteY: number }> = ({ video, off, desde, recorteY }) => {
  const fr = useCurrentFrame() + off;
  const p = splitP(fr);
  if (p < 0.01) return null;
  return (
    <AbsoluteFill style={{ height: PANEL_H, overflow: "hidden", transform: `translateY(${-(1 - p) * PANEL_H}px)` }}>
      <OffthreadVideo muted src={staticFile(video)} startFrom={f(desde)} style={{ width: 1080, height: 1920, objectFit: "cover", marginTop: -recorteY }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,8,18,.5) 0%, rgba(4,8,18,.25) 55%, rgba(4,8,18,0) 80%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: ACENTO }} />
    </AbsoluteFill>
  );
};

// --- Piezas de texto -------------------------------------------------------------------------
const Centro: React.FC<{ top: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, children, style }) => (
  <div style={{ position: "absolute", left: Z.x0, width: Z.x1 - Z.x0, top, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", ...style }}>{children}</div>
);

// "Las *skills*" → la palabra entre asteriscos va en el color de resalte.
const conResalte = (t: string) => t.split(/(\*[^*]+\*)/).map((x, i) =>
  x.startsWith("*") ? <span key={i} style={{ color: RESALTE }}>{x.slice(1, -1)}</span> : <React.Fragment key={i}>{x}</React.Fragment>);

const Kicker: React.FC<{ text: string; start: number }> = ({ text, start }) => {
  const fr = useCurrentFrame();
  const w = enter(fr, start, 10), t = enter(fr, start + 5, 10);
  return (
    <div style={{ clipPath: `inset(0 ${(1 - w) * 100}% 0 0 round 10px)`, background: ACENTO, borderRadius: 10, padding: "10px 20px", fontFamily: TEXTO, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: "#fff" }}>
      <span style={{ display: "inline-block", opacity: t, transform: `translateX(${(1 - t) * -12}px)` }}>{text}</span>
    </div>
  );
};

// El gancho se lee desde el cuadro 1, sin animación de entrada: es también la portada del reel.
const Gancho: React.FC = () => {
  const fr = useCurrentFrame();
  const g = PLAN.gancho;
  if (!g || fr >= f(g.hasta_s)) return null;
  return (
    <Centro top={270} style={{ opacity: exit(fr, f(g.hasta_s), 6) }}>
      <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 104, color: "#fff", lineHeight: 1, ...STROKE }}>{conResalte(g.linea)}</div>
      {g.sub && <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 58, color: RESALTE, marginTop: 14, ...STROKE, WebkitTextStroke: "8px #000" }}>{g.sub}</div>}
    </Centro>
  );
};

const Titulo: React.FC<{ kicker?: string; texto: string; a: number; b: number }> = ({ kicker, texto, a, b }) => {
  const fr = useCurrentFrame();
  if (fr < a || fr >= b) return null;
  const p = enter(fr, a + 4, 14);
  const size = texto.replace(/\*/g, "").length > 14 ? 78 : 104;
  return (
    <Centro top={262} style={{ opacity: exit(fr, b, 6) }}>
      {kicker && <Kicker text={kicker} start={a} />}
      <div style={{ overflow: "hidden", marginTop: 10, paddingBottom: 12 }}>
        <div style={{ fontFamily: TITULO, fontWeight: 800, fontSize: size, color: "#fff", lineHeight: 1.05, whiteSpace: "nowrap", transform: `translateY(${(1 - p) * 105}%)`, ...STROKE }}>{conResalte(texto)}</div>
      </div>
    </Centro>
  );
};

// --- Superficies tipo macOS -------------------------------------------------------------------
const Ventana: React.FC<{ titulo: string; a: number; b: number; top: number; mono?: boolean; children: React.ReactNode }> = ({ titulo, a, b, top, mono, children }) => {
  const fr = useCurrentFrame();
  const p = springAt(fr, a, SPRING_SNAPPY);
  const o = exit(fr, b, 7);
  return (
    <div style={{
      position: "absolute", left: Z.x0, width: Z.x1 - Z.x0, top, background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: SOMBRA,
      opacity: Math.min(p * 1.5, 1) * o, transform: `translateY(${(1 - p) * 60 + (1 - o) * 30}px) scale(${0.94 + 0.06 * p})`,
    }}>
      <div style={{ height: 58, background: "#F3F4F6", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", padding: "0 22px", position: "relative" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c, marginRight: 10 }} />)}
        <div style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontFamily: mono ? MONO : TEXTO, fontWeight: 600, fontSize: 26, color: "#6B7280" }}>{titulo}</div>
      </div>
      <div style={{ padding: "30px 34px" }}>{children}</div>
    </div>
  );
};

const Atenuar: React.FC<{ a: number; b: number; max: number }> = ({ a, b, max }) => {
  const fr = useCurrentFrame();
  const o = Math.min(enter(fr, a, 10), exit(fr, b, 8)) * max;
  return o > 0 ? <AbsoluteFill style={{ background: `rgba(4,8,18,${o})` }} /> : null;
};

// Un mensaje que se escribe solo y se envía; abajo, la respuesta "pensando".
const Chat: React.FC<{ c: NonNullable<typeof PLAN.chat>[number] }> = ({ c }) => {
  const fr = useCurrentFrame();
  const a = f(c.desde_s), b = f(c.hasta_s);
  if (fr < a - 2 || fr >= b) return null;
  const finEscritura = a + Math.round((b - a) * 0.6);
  const n = Math.round(interpolate(fr, [a + 6, finEscritura], [0, c.mensaje.length], clamp));
  const enviado = fr >= finEscritura + 4;
  const r = enter(fr, finEscritura + 12, 12);
  return (
    <>
      <Atenuar a={a} b={b} max={0.3} />
      {/* va arriba de la cabeza: no tapa la cara */}
      <Ventana titulo={c.app ?? "Claude"} a={a} b={b} top={255}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ maxWidth: 640, background: enviado ? ACENTO : "#F3F4F6", color: enviado ? "#fff" : "#111827", borderRadius: 22, padding: "20px 26px", fontFamily: TITULO, fontWeight: 700, fontSize: 36, lineHeight: 1.3 }}>
            {c.mensaje.slice(0, n)}
            {!enviado && <span style={{ display: "inline-block", width: 3, height: 36, background: ACENTO, marginLeft: 3, verticalAlign: "middle", opacity: Math.floor(fr / 8) % 2 ? 1 : 0.2 }} />}
          </div>
        </div>
        {c.respuesta && (
          <div style={{ marginTop: 26, height: 44, display: "flex", alignItems: "center", gap: 14, opacity: r }}>
            <div style={{ width: 30, height: 30, borderRadius: 15, border: `3px solid ${ACENTO}`, borderTopColor: "transparent", transform: `rotate(${fr * 14}deg)` }} />
            <span style={{ fontFamily: TEXTO, fontWeight: 600, fontSize: 34, color: "#6B7280" }}>{c.respuesta}</span>
          </div>
        )}
      </Ventana>
    </>
  );
};

// Lista tipo Finder: cada fila se marca en el segundo que la nombras (marcar_s).
const Lista: React.FC<{ l: NonNullable<typeof PLAN.lista>[number] }> = ({ l }) => {
  const fr = useCurrentFrame();
  const a = f(l.desde_s), b = f(l.hasta_s);
  if (fr < a - 2 || fr >= b) return null;
  return (
    <>
      <Atenuar a={a} b={b} max={0.62} />
      <Ventana titulo={l.titulo} a={a} b={b} top={400} mono>
        {l.filas.slice(0, 7).map((r, i) => {
          const p = enter(fr, a + 6 + i * 4, 12);
          const on = r.marcar_s !== undefined && fr >= f(r.marcar_s) - 4;
          return (
            <div key={r.nombre} style={{ display: "flex", alignItems: "center", height: 70, borderRadius: 14, padding: "0 16px", gap: 18, background: on ? "rgba(0,81,255,.07)" : "transparent", opacity: p, transform: `translateX(${(1 - p) * -24}px)` }}>
              <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke={on ? ACENTO : "#6B7280"} strokeWidth={1.8} strokeLinejoin="round">
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              <span style={{ fontFamily: MONO, fontSize: 36, fontWeight: 700, color: on ? ACENTO : "#111827", flex: 1 }}>{r.nombre}</span>
              {r.nota && <span style={{ fontFamily: TEXTO, fontWeight: 600, fontSize: 30, color: on ? ACENTO : "#9CA3AF" }}>{r.nota}</span>}
            </div>
          );
        })}
      </Ventana>
    </>
  );
};

// Hasta 3 capturas que entran en abanico.
const Abanico: React.FC<{ p: NonNullable<typeof PLAN.pantallazos>[number] }> = ({ p: pz }) => {
  const fr = useCurrentFrame();
  const a = f(pz.desde_s), b = f(pz.hasta_s);
  if (fr < a || fr >= b) return null;
  const imgs = pz.imagenes.slice(0, 3);
  const W = 300, H = 533, cx = (Z.x0 + Z.x1) / 2;
  return (
    <>
      <Atenuar a={a} b={b} max={0.62} />
      {imgs.map((src, i) => {
        const p = springAt(fr, a + i * 4, SPRING_SNAPPY);
        const d = i - (imgs.length - 1) / 2;
        return (
          <div key={src} style={{
            position: "absolute", left: cx - W / 2 + d * 232 * p, top: 450, width: W, height: H, borderRadius: 22, overflow: "hidden",
            border: "4px solid #fff", boxShadow: SOMBRA, opacity: Math.min(p * 1.6, 1) * exit(fr, b, 6), zIndex: d === 0 ? 2 : 1,
            transform: `translateY(${(1 - p) * 220}px) rotate(${d * 7 * p}deg) scale(${0.85 + 0.15 * p})`,
          }}>
            <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}
    </>
  );
};

// Cierre: tu usuario con un botón Seguir que se aprieta solo.
const Seguir: React.FC = () => {
  const fr = useCurrentFrame();
  const c = PLAN.cierre;
  if (!c || fr < f(c.desde_s)) return null;
  const a = f(c.desde_s);
  const p = springAt(fr, a, SPRING_SNAPPY);
  const tap = a + 20;
  const listo = fr >= tap;
  return (
    <Centro top={266}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, background: "rgba(10,14,20,0.84)", borderRadius: 26, padding: "14px 16px 14px 18px", border: "1px solid rgba(255,255,255,.14)", opacity: Math.min(p * 1.5, 1), transform: `translateY(${(1 - p) * 40}px)` }}>
        <div style={{ width: 60, height: 60, borderRadius: 30, background: `linear-gradient(135deg, ${ACENTO}, ${RESALTE})` }} />
        <span style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 40, color: "#fff" }}>{c.usuario}</span>
        <div style={{ height: 64, padding: "0 28px", borderRadius: 16, display: "flex", alignItems: "center", fontFamily: TEXTO, fontWeight: 700, fontSize: 32, color: "#fff", background: listo ? "rgba(255,255,255,.16)" : ACENTO, transform: `scale(${fr >= tap - 3 && fr < tap + 3 ? 0.92 : 1})` }}>
          {listo ? "Siguiendo" : "Seguir"}
        </div>
      </div>
    </Centro>
  );
};

// --- Subtítulos karaoke: la palabra ya dicha cambia de color ------------------------------------
type Grupo = { ws: typeof PALABRAS; a: number; b: number };
const GRUPOS: Grupo[] = (() => {
  const out: (typeof PALABRAS)[] = [];
  let cur: typeof PALABRAS = [];
  for (const w of PALABRAS) {
    cur.push(w);
    if (/[.,?!]$/.test(w.w) || cur.map((x) => x.w).join(" ").length >= 18) { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  return out.map((ws, i) => {
    const sig = out[i + 1]?.[0].s;
    const fin = ws[ws.length - 1].e + 0.25;
    return { ws, a: ws[0].s - 0.04, b: sig !== undefined && sig - fin < 0.5 ? sig - 0.04 : fin };
  });
})();

const Subtitulos: React.FC = () => {
  const fr = useCurrentFrame();
  const t = fr / FPS;
  const g = GRUPOS.find((x) => t >= x.a && t < x.b);
  if (!g) return null;
  const arriba = splitP(fr) > 0.5; // con la pantalla dividida suben, para no tapar la cara
  const pop = springAt(fr, Math.round(g.a * FPS), SPRING_SNAPPY);
  return (
    <div style={{
      position: "absolute", left: Z.x0, width: Z.x1 - Z.x0, ...(arriba ? { top: 610 } : { bottom: 1920 - Z.y1 }),
      textAlign: "center", fontFamily: TITULO, fontWeight: 800, fontSize: 60, lineHeight: 1.15, color: "#fff", ...STROKE, transform: `scale(${0.94 + 0.06 * pop})`,
    }}>
      {g.ws.map((w, i) => (
        // inline-block + margen: un espacio suelto entre <span> puede perderse en el render
        <span key={i} style={{ display: "inline-block", marginRight: i < g.ws.length - 1 ? "0.26em" : 0, color: t >= w.s - 0.02 ? RESALTE : "#fff" }}>{w.w.replace(/[.,]$/, "")}</span>
      ))}
    </div>
  );
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Persona />
    {(PLAN.split ?? []).map((s, i) => {
      const from = Math.max(0, f(s.desde_s) - 12);
      return (
        <Sequence key={i} from={from} durationInFrames={Math.min(TOTAL, f(s.hasta_s) + 16) - from}>
          <Panel video={s.video} off={from} desde={s.broll_desde_s ?? 0} recorteY={s.recorte_y ?? (1920 - PANEL_H) / 2} />
        </Sequence>
      );
    })}
    <Gancho />
    {(PLAN.titulos ?? []).map((t, i) => <Titulo key={i} kicker={t.kicker} texto={t.texto} a={f(t.desde_s)} b={f(t.hasta_s)} />)}
    {(PLAN.chat ?? []).map((c, i) => <Chat key={i} c={c} />)}
    {(PLAN.lista ?? []).map((l, i) => <Lista key={i} l={l} />)}
    {(PLAN.pantallazos ?? []).map((p, i) => <Abanico key={i} p={p} />)}
    <Seguir />
    <Subtitulos />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.22) 100%)" }} />
  </AbsoluteFill>
);

