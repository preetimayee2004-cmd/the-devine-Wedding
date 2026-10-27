import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";

// a fingertip with three short scratch strokes beside it (24 × 24), drawn on the foil
const FINGER = "M10.2 12.4V5.6a1.7 1.7 0 0 1 3.4 0v5.9m0-1.3a1.7 1.7 0 0 1 3.4 0v1.7m0-.7a1.7 1.7 0 0 1 3.4 0V16a6.2 6.2 0 0 1-6.2 6.2h-.7a5.8 5.8 0 0 1-4.6-2.3l-2.6-3.5a1.7 1.7 0 0 1 2.6-2.1l1.3 1.5";
const STROKES = "M2.4 4.6 5.8 3.4M1.6 8.4 5.4 7.6M2.6 12 5.6 11.6";

// where the gold dust rises from once the date shows (% across), how far (px), and when (ms)
const SPARKS = [
  [14, 18, 120],
  [27, 24, 260],
  [41, 16, 60],
  [55, 26, 200],
  [68, 18, 320],
  [80, 22, 140],
  [90, 16, 380],
] as const;

/** Is it Devanagari (no letter-spacing, which would break its joins)? */
const isDeva = (s: string) => /[ऀ-ॿ]/.test(s);

/**
 * The Save the Date's date under a small panel of champagne-gold foil, to scratch away — a keepsake
 * scratch card, not a button.
 *
 * The foil: softly irregular rounded edges (as if hand-cut), a brushed champagne gold with metallic
 * banding, fine grain and faint streaks, lit from above — a bright inner edge along its top, a little
 * shade along its foot, a thin deeper-gold border and a faint inset line, a shadow beneath, so it
 * stands slightly raised. On it, in navy: a small fingertip with scratch strokes, "SCRATCH TO REVEAL",
 * and (when it fits) "Reveal our special moment" in italic; a tiny gold diamond at each end.
 *
 * Once the card shows, a fingertip demonstrates on the foil: it rubs gently left and right, three
 * times, then goes; it goes at the first touch too. A finger or the mouse really wipes the foil away
 * (pointer events on a canvas, with a soft-edged brush; the page doesn't scroll while scratching on
 * it, and scrolls as ever everywhere else); once about 45% of it is gone the rest fades off, a faint
 * gleam crosses the date and a few gold motes rise, once.
 *
 * For anyone who'd rather not scratch: "or tap to reveal" beneath it (a real button, so Enter or Space
 * work too) uncovers it the same way; a small gold lotus rule under that. The date (the children) is
 * in the page all along, so a screen reader reads it; the foil is only paint. Everything shares one
 * box, so nothing around it moves. Every visit scratches afresh. Reduced motion: no demonstration;
 * the foil simply fades.
 */
export function ScratchReveal({
  hint,
  note,
  tapLabel,
  shown,
  delay,
  reduced,
  children,
}: {
  hint: string;
  /** A second, smaller line under the hint — only drawn when it fits. */
  note?: string;
  tapLabel: string;
  /** The card is showing (the fingertip demonstrates from then, after `delay` ms). */
  shown: boolean;
  delay: number;
  reduced: boolean;
  children: ReactNode;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [lifting, setLifting] = useState(false);
  const [touched, setTouched] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const scratched = useRef(false);
  const checking = useRef(0);
  // the share of the canvas that is clear before any scratching (round the panel's edges)
  const baseClear = useRef(0);

  /** The foil: the panel, its gold, its light and its words. */
  const paint = useCallback(() => {
    const c = canvas.current;
    const s = stage.current;
    if (!c || !s) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width: W, height: H } = s.getBoundingClientRect();
    if (!W || !H) return;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // a seeded random, so the foil is the same every time
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

    // the panel: a rounded rectangle whose edge wanders in and out by under a pixel, as if hand-cut
    const shape = foilShape(3, 3, W - 3, H - 6, 15, 0);
    const inset = foilShape(7.5, 7.5, W - 7.5, H - 10.5, 11, 0.4);

    ctx.save();
    ctx.clip(shape);
    // brushed champagne gold, in soft metallic bands
    const g = ctx.createLinearGradient(0, 0, W, H * 2.4);
    g.addColorStop(0, "#d8bb82");
    g.addColorStop(0.16, "#f2e0b8");
    g.addColorStop(0.32, "#e0c38c");
    g.addColorStop(0.5, "#f8ecd2");
    g.addColorStop(0.66, "#dcbf88");
    g.addColorStop(0.83, "#efdbb0");
    g.addColorStop(1, "#d0b078");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // light from above, a little shade toward the foot
    const v = ctx.createLinearGradient(0, 0, 0, H);
    v.addColorStop(0, "rgba(255, 253, 244, 0.5)");
    v.addColorStop(0.42, "rgba(255, 253, 244, 0)");
    v.addColorStop(0.6, "rgba(120, 84, 30, 0)");
    v.addColorStop(1, "rgba(120, 84, 30, 0.2)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    // faint brushed streaks, the way foil catches the light
    ctx.lineWidth = 0.6;
    for (let k = 0; k < W / 4; k++) {
      const x = rnd() * W;
      const y = rnd() * H;
      const len = 8 + rnd() * 26;
      ctx.strokeStyle = rnd() < 0.55 ? `rgba(255, 250, 232, ${0.12 + rnd() * 0.14})` : `rgba(140, 100, 40, ${0.05 + rnd() * 0.06})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + len * 0.12);
      ctx.stroke();
    }
    // fine grain
    for (let k = 0; k < (W * H) / 7; k++) {
      ctx.fillStyle = rnd() < 0.5 ? `rgba(255, 250, 236, ${0.06 + rnd() * 0.1})` : `rgba(120, 84, 30, ${0.03 + rnd() * 0.06})`;
      ctx.fillRect(rnd() * W, rnd() * H, 1, 1);
    }
    // a few soft flecks, the foil's small imperfections
    for (let k = 0; k < 7; k++) {
      const x = rnd() * W;
      const y = rnd() * H;
      const r = 2 + rnd() * 5;
      const f = ctx.createRadialGradient(x, y, 0, x, y, r);
      const light = rnd() < 0.6;
      f.addColorStop(0, light ? "rgba(255, 252, 238, 0.32)" : "rgba(130, 92, 36, 0.12)");
      f.addColorStop(1, "rgba(255, 252, 238, 0)");
      ctx.fillStyle = f;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // the raised edge: bright along the top inside the edge, shaded along the foot
    const rim = ctx.createLinearGradient(0, 0, 0, H);
    rim.addColorStop(0, "rgba(255, 255, 250, 0.85)");
    rim.addColorStop(0.45, "rgba(255, 255, 250, 0)");
    rim.addColorStop(0.55, "rgba(110, 74, 22, 0)");
    rim.addColorStop(1, "rgba(110, 74, 22, 0.32)");
    ctx.strokeStyle = rim;
    ctx.lineWidth = 4;
    ctx.stroke(shape);
    ctx.restore();

    // a thin deeper-gold border, and a faint line inset from it
    ctx.strokeStyle = "#a27a3a";
    ctx.lineWidth = 1.1;
    ctx.stroke(shape);
    ctx.strokeStyle = "rgba(162, 122, 58, 0.38)";
    ctx.lineWidth = 0.7;
    ctx.stroke(inset);

    // a tiny gold diamond at each end
    const mid = (H - 3) / 2;
    ctx.fillStyle = "#a27a3a";
    for (const x of [16, W - 16]) {
      ctx.beginPath();
      ctx.moveTo(x, mid - 3.2);
      ctx.lineTo(x + 2.2, mid);
      ctx.lineTo(x, mid + 3.2);
      ctx.lineTo(x - 2.2, mid);
      ctx.closePath();
      ctx.fill();
    }

    // the words: a fingertip and "SCRATCH TO REVEAL", and under them, if it fits, the note
    const css = getComputedStyle(s);
    const body = css.getPropertyValue("--font-body").trim() || "sans-serif";
    const display = css.getPropertyValue("--font-display").trim() || "serif";
    const deva = css.getPropertyValue("--font-deva").trim() || "serif";
    const text = hint.toUpperCase();
    const spaced = !isDeva(text);
    const ICON = 15;
    const GAP = 7;
    const room = W - 2 * 30 - ICON - GAP;
    const ls = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    const font = (size: number) => (spaced ? `600 ${size}px ${body}` : `600 ${size + 1.5}px ${deva}`);
    let size = 12;
    for (; size > 8.5; size -= 0.25) {
      ctx.font = font(size);
      if ("letterSpacing" in ctx) ls.letterSpacing = spaced ? `${(size * 0.2).toFixed(2)}px` : "0px";
      if (ctx.measureText(text).width <= room) break;
    }
    const tw = ctx.measureText(text).width - (spaced ? size * 0.2 : 0);
    // the note, in italic, if there's room for it and for both lines
    let noteFont = "";
    if (note && H >= 56) {
      noteFont = isDeva(note) ? `400 12px ${deva}` : `italic 500 13px ${display}`;
      ctx.font = noteFont;
      if ("letterSpacing" in ctx) ls.letterSpacing = "0px";
      if (ctx.measureText(note).width > W - 2 * 30) noteFont = "";
    }
    const lineY = noteFont ? mid - 6.5 : mid + 0.5;
    const left = (W - (ICON + GAP + tw)) / 2;
    const navy = "rgba(18, 41, 74, 0.9)";
    const lift = "rgba(255, 251, 240, 0.75)";
    // the fingertip, embossed like the words
    const finger = new Path2D(FINGER);
    const strokes = new Path2D(STROKES);
    for (const [dy, colour] of [
      [1, lift],
      [0, navy],
    ] as const) {
      ctx.save();
      ctx.translate(left, lineY - ICON / 2 + dy - 0.5);
      ctx.scale(ICON / 24, ICON / 24);
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1.7;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(finger);
      ctx.lineWidth = 1.5;
      ctx.stroke(strokes);
      ctx.restore();
    }
    ctx.font = font(size);
    if ("letterSpacing" in ctx) ls.letterSpacing = spaced ? `${(size * 0.2).toFixed(2)}px` : "0px";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const tx = left + ICON + GAP;
    ctx.fillStyle = lift;
    ctx.fillText(text, tx, lineY + 1);
    ctx.fillStyle = navy;
    ctx.fillText(text, tx, lineY);
    if (noteFont) {
      ctx.font = noteFont;
      if ("letterSpacing" in ctx) ls.letterSpacing = "0px";
      ctx.textAlign = "center";
      ctx.fillStyle = lift;
      ctx.fillText(note!, W / 2, mid + 10.5);
      ctx.fillStyle = "rgba(18, 41, 74, 0.72)";
      ctx.fillText(note!, W / 2, mid + 9.5);
    }

    baseClear.current = clearShare(ctx, c);
  }, [hint, note]);

  useLayoutEffect(() => {
    if (revealed) return;
    paint();
    // again once the web fonts have come, and if the panel's size changes — until scratching begins
    let live = true;
    document.fonts?.ready.then(() => live && !scratched.current && paint());
    const s = stage.current;
    if (!s || !("ResizeObserver" in window)) return () => void (live = false);
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) return void (first = false);
      if (!scratched.current) paint();
    });
    ro.observe(s);
    return () => {
      live = false;
      ro.disconnect();
    };
  }, [paint, revealed]);

  const reveal = useCallback(() => {
    if (lifting || revealed) return;
    setTouched(true);
    setLifting(true);
    window.setTimeout(() => setRevealed(true), reduced ? 220 : 520);
  }, [lifting, revealed, reduced]);

  // how much of the foil is gone (sampled coarsely); past 45% of the panel, the rest fades off
  const check = () => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const clear = clearShare(ctx, c);
    const base = baseClear.current;
    if (base < 1 && (clear - base) / (1 - base) > 0.45) reveal();
  };

  // a soft-edged wipe along the finger's path
  const scratchTo = (e: PointerEvent<HTMLCanvasElement>) => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const rect = c.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const from = last.current ?? { x, y };
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 26;
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x + 0.01, y);
    ctx.stroke();
    ctx.restore();
    last.current = { x, y };
    scratched.current = true;
    const now = performance.now();
    if (now - checking.current > 110) {
      checking.current = now;
      check();
    }
  };

  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    if (lifting) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setTouched(true);
    last.current = null;
    scratchTo(e);
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!last.current || lifting) return;
    scratchTo(e);
  };
  const up = () => {
    last.current = null;
    if (!lifting && scratched.current) check();
  };

  return (
    <div
      className="veil"
      data-shown={shown || undefined}
      data-touched={touched || undefined}
      data-lifting={lifting || undefined}
      data-revealed={revealed || undefined}
      data-still={reduced || undefined}
      style={{ "--veil-at": `${delay}ms` } as CSSProperties}
    >
      <div ref={stage} className="veil-stage">
        <div className="veil-date">{children}</div>
        {revealed && !reduced && (
          <>
            {/* once: a faint gleam of gold across the date, and a few gold motes rising */}
            <span aria-hidden className="veil-gleam" />
            {SPARKS.map(([left, rise, wait], i) => (
              <span
                key={i}
                aria-hidden
                className="veil-spark"
                style={{ left: `${left}%`, animationDelay: `${wait}ms`, "--rise": `${-rise}px` } as CSSProperties}
              />
            ))}
          </>
        )}
        {!revealed && (
          <canvas ref={canvas} aria-hidden className="veil-foil" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
        )}
        {!revealed && !reduced && (
          // the demonstration: a fingertip rubbing gently across the foil, three times, then gone
          <span aria-hidden className="veil-cue">
            <svg viewBox="0 0 44 54" fill="#fffaf0" stroke="#7d5a22" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
              <path d="M17 6.5a3.5 3.5 0 0 1 7 0V21a3.2 3.2 0 0 1 6 1.4a3.2 3.2 0 0 1 5.6 2a3 3 0 0 1 4.4 2.6V36c0 7-5.6 12.6-12.6 12.6h-3c-3.6 0-7-1.7-9.2-4.6l-7.6-10.2a3.2 3.2 0 0 1 5-4L17 31Z" />
              <path d="M24 21v7M30 22.4v6.6M35.6 24.4v6" fill="none" />
            </svg>
          </span>
        )}
      </div>
      <button type="button" className="veil-tap" onClick={reveal} disabled={lifting || revealed} aria-hidden={revealed || undefined}>
        {tapLabel}
      </button>
      {/* a small gold lotus rule beneath */}
      <svg aria-hidden viewBox="0 0 120 12" className="veil-rule" fill="none">
        <path d="M6 7.5h40M74 7.5h40" stroke="#b89554" strokeOpacity="0.8" strokeWidth="0.8" />
        <g fill="#e9d29a" fillOpacity="0.6" stroke="#b89554" strokeWidth="0.8" strokeLinejoin="round">
          <path d="M60 11C56.6 10.6 53.6 8.4 52.8 5.4 56.2 5.4 58.8 7.6 60 11Z" />
          <path d="M60 11C63.4 10.6 66.4 8.4 67.2 5.4 63.8 5.4 61.2 7.6 60 11Z" />
          <path d="M60 11C57.9 8 57.9 5 60 2 62.1 5 62.1 8 60 11Z" />
        </g>
      </svg>
    </div>
  );
}

/**
 * A rounded rectangle whose edge wanders in and out (by under a pixel, smoothly), as if cut by hand.
 * `phase` shifts the wander, so an inset line doesn't simply copy the outer edge.
 */
function foilShape(x0: number, y0: number, x1: number, y1: number, r: number, phase: number) {
  const w = x1 - x0 - 2 * r;
  const h = y1 - y0 - 2 * r;
  const arc = (Math.PI / 2) * r;
  const runs = [w, arc, h, arc, w, arc, h, arc];
  const total = runs.reduce((a, b) => a + b, 0);
  // the point on the outline at distance d from the top-left end of the top edge, and its outward normal
  const at = (d: number): [number, number, number, number] => {
    let k = 0;
    while (k < runs.length - 1 && d > runs[k]) d -= runs[k++];
    const corner = (cx: number, cy: number, from: number) => {
      const a = from + d / r;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.cos(a), Math.sin(a)] as [number, number, number, number];
    };
    switch (k) {
      case 0: return [x0 + r + d, y0, 0, -1];
      case 1: return corner(x1 - r, y0 + r, -Math.PI / 2);
      case 2: return [x1, y0 + r + d, 1, 0];
      case 3: return corner(x1 - r, y1 - r, 0);
      case 4: return [x1 - r - d, y1, 0, 1];
      case 5: return corner(x0 + r, y1 - r, Math.PI / 2);
      case 6: return [x0, y1 - r - d, -1, 0];
      default: return corner(x0 + r, y0 + r, Math.PI);
    }
  };
  const n = Math.max(24, Math.round(total / 5));
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const d = (i / n) * total;
    const [x, y, nx, ny] = at(d);
    const t = (d / total) * Math.PI * 2;
    const wander = 0.55 * Math.sin(t * 9 + 1.3 + phase) + 0.35 * Math.sin(t * 23 + 0.4 + phase * 2) + 0.18 * Math.sin(t * 51 + 2.1);
    pts.push([x + nx * wander, y + ny * wander]);
  }
  // smooth: a curve through the midpoints, each point its control
  const path = new Path2D();
  const midOf = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as const;
  const start = midOf(pts[n - 1], pts[0]);
  path.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const m = midOf(pts[i], pts[(i + 1) % n]);
    path.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  path.closePath();
  return path;
}

/** The share of the canvas that is clear (sampled every 20th pixel). */
function clearShare(ctx: CanvasRenderingContext2D, c: HTMLCanvasElement) {
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  let clear = 0;
  let all = 0;
  for (let i = 3; i < data.length; i += 4 * 20) {
    all++;
    if (data[i] < 60) clear++;
  }
  return all ? clear / all : 0;
}
