import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";

/**
 * "Golden Veil": the wedding date under an ornate label of champagne-gold foil, to scratch away.
 *
 * The label is a cartouche: soft parchment-gold, lighter through the middle and deeper at the ends,
 * with a faint grain; a fine gold outline whose ends sweep in ogee curves to a point, a small gold
 * flourish beyond each point, a gold bead at the middle of its top and its foot; a gold lotus inside
 * each end; and "GENTLY SCRATCH TO REVEAL" in navy between them. A gold hand points at its right
 * end, a few sparkles at the fingertip; when the card shows, it rubs at the label a few times, then
 * rests. A finger or the mouse wipes the foil away with a soft edge (the page doesn't scroll while
 * scratching); once about half of it is gone the rest lifts off and a faint gleam of gold crosses
 * the date, once.
 *
 * For anyone who can't scratch: "or tap to reveal" beneath it (a real button, so Enter or Space work
 * too) uncovers it at once; a small gold lotus rule under that. The date (the children, in the
 * hero's navy serif) is in the page all along, so a screen reader reads it; the foil is only paint.
 * Everything shares one box, so nothing around it moves. Every visit scratches afresh. Reduced
 * motion: the hand simply rests, the foil simply fades.
 */
export function ScratchReveal({
  hint,
  tapLabel,
  shown,
  delay,
  reduced,
  children,
}: {
  hint: string;
  tapLabel: string;
  /** The card is showing (the fingertip glides from then, after `delay` ms). */
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
  const checking = useRef(0);
  // the share of the canvas that is clear before any scratching (outside the label's curved ends)
  const baseClear = useRef(0);

  /** The foil: the cartouche — parchment-gold, a fine gold outline, beads, flourishes, a lotus at each end, the hint. */
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
    // the label: straight top and foot; each end sweeps in an ogee curve to a point
    const TIP = 12;
    const CORNER = 32;
    const top = 4;
    const foot = H - 4;
    const mid = H / 2;
    const end = (path: Path2D, x0: number, dir: 1 | -1, down: boolean) => {
      // from a corner (x0) out to the point, or back from the point to the other corner
      const [ya, yb] = down ? [top, foot] : [foot, top];
      path.bezierCurveTo(x0 + dir * 10, ya, x0 + dir * (CORNER - TIP - 12), mid, x0 + dir * (CORNER - TIP), mid);
      path.bezierCurveTo(x0 + dir * (CORNER - TIP - 12), mid, x0 + dir * 10, yb, x0, yb);
    };
    const shape = new Path2D();
    shape.moveTo(CORNER, top);
    shape.lineTo(W - CORNER, top);
    end(shape, W - CORNER, 1, true);
    shape.lineTo(CORNER, foot);
    end(shape, CORNER, -1, false);
    shape.closePath();

    ctx.save();
    ctx.clip(shape);
    // soft parchment-gold: lighter through the middle, deeper toward the ends
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "#dfc192");
    g.addColorStop(0.16, "#efdcb6");
    g.addColorStop(0.5, "#f9eedb");
    g.addColorStop(0.84, "#efdcb6");
    g.addColorStop(1, "#dfc192");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const v = ctx.createLinearGradient(0, 0, 0, H);
    v.addColorStop(0, "rgba(255, 252, 240, 0.35)");
    v.addColorStop(0.5, "rgba(255, 252, 240, 0)");
    v.addColorStop(1, "rgba(150, 108, 48, 0.1)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    // a faint grain (seeded, so it's the same every time)
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let k = 0; k < (W * H) / 9; k++) {
      ctx.fillStyle = rnd() < 0.5 ? `rgba(255, 250, 236, ${0.05 + rnd() * 0.08})` : `rgba(130, 92, 36, ${0.03 + rnd() * 0.05})`;
      ctx.fillRect(rnd() * W, rnd() * H, 1, 1);
    }
    ctx.restore();

    const gold = "#b38c4e";
    // the outline, in two halves: each breaks at the middle of the top and the foot for a bead
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.1;
    ctx.lineJoin = "round";
    for (const dir of [-1, 1] as const) {
      const half = new Path2D();
      const x0 = dir < 0 ? CORNER : W - CORNER;
      half.moveTo(W / 2 + dir * 6, top);
      half.lineTo(x0, top);
      end(half, x0, dir, true);
      half.lineTo(W / 2 + dir * 6, foot);
      ctx.stroke(half);
    }
    ctx.fillStyle = gold;
    for (const y of [top, foot]) {
      ctx.beginPath();
      ctx.arc(W / 2, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    // a small flourish beyond each point: a short stem and three tiny petals, a bead between
    const flourish = (x: number, dir: 1 | -1) => {
      ctx.save();
      ctx.translate(x, mid);
      ctx.scale(dir, 1);
      ctx.strokeStyle = gold;
      ctx.fillStyle = "rgba(201, 164, 92, 0.75)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-3.5, 0);
      ctx.stroke();
      for (const a of [0, -0.85, 0.85]) {
        ctx.save();
        ctx.translate(-5, 0);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(-2.6, 0, 2.6, 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(-5, 0, 1, 0, Math.PI * 2);
      ctx.fillStyle = gold;
      ctx.fill();
      ctx.restore();
    };
    flourish(TIP, 1);
    flourish(W - TIP, -1);
    // a gold lotus inside each end
    const lotus = (cx: number) => {
      ctx.save();
      ctx.translate(cx, mid + 0.5);
      ctx.scale(1.15, 1.15);
      ctx.strokeStyle = "#9c7a3e";
      ctx.fillStyle = "rgba(214, 178, 108, 0.7)";
      ctx.lineWidth = 0.8;
      ctx.lineJoin = "round";
      const petal = (path: () => void) => {
        ctx.beginPath();
        path();
        ctx.fill();
        ctx.stroke();
      };
      petal(() => {
        ctx.moveTo(0, 5.5);
        ctx.bezierCurveTo(-5, 5, -8, 1.6, -8.2, -2);
        ctx.bezierCurveTo(-4, -1.2, -1, 2, 0, 5.5);
      });
      petal(() => {
        ctx.moveTo(0, 5.5);
        ctx.bezierCurveTo(5, 5, 8, 1.6, 8.2, -2);
        ctx.bezierCurveTo(4, -1.2, 1, 2, 0, 5.5);
      });
      petal(() => {
        ctx.moveTo(0, 5.5);
        ctx.bezierCurveTo(-3.6, 3, -4.4, -2.6, -2.2, -5.4);
        ctx.bezierCurveTo(-0.6, -2.6, -0.2, 1.6, 0, 5.5);
      });
      petal(() => {
        ctx.moveTo(0, 5.5);
        ctx.bezierCurveTo(3.6, 3, 4.4, -2.6, 2.2, -5.4);
        ctx.bezierCurveTo(0.6, -2.6, 0.2, 1.6, 0, 5.5);
      });
      petal(() => {
        ctx.moveTo(0, 5.5);
        ctx.bezierCurveTo(-2.4, 2, -2.4, -3.6, 0, -7);
        ctx.bezierCurveTo(2.4, -3.6, 2.4, 2, 0, 5.5);
      });
      ctx.beginPath();
      ctx.moveTo(-6, 7.2);
      ctx.lineTo(6, 7.2);
      ctx.stroke();
      ctx.restore();
    };
    lotus(CORNER + 12);
    lotus(W - CORNER - 12);
    // the hint, between the lotuses (smaller if it must be, to fit)
    const family = getComputedStyle(s).getPropertyValue("--font-body").trim() || "sans-serif";
    const text = hint.toUpperCase();
    const spaced = !/[ऀ-ॿ]/.test(text);
    const room = W - 2 * (CORNER + 24);
    let size = 11.5;
    const ls = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    for (; size > 8; size -= 0.25) {
      ctx.font = `600 ${size}px ${family}`;
      if ("letterSpacing" in ctx) ls.letterSpacing = spaced ? `${(size * 0.19).toFixed(2)}px` : "0px";
      if (ctx.measureText(text).width <= room) break;
    }
    const nudge = spaced ? size * 0.095 : 0;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 251, 240, 0.7)";
    ctx.fillText(text, W / 2 + nudge, mid + 1.5);
    ctx.fillStyle = "rgba(18, 41, 74, 0.9)";
    ctx.fillText(text, W / 2 + nudge, mid + 0.5);

    // how much is clear already (the corners beyond the curved ends)
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let clear = 0;
    let all = 0;
    for (let i = 3; i < data.length; i += 4 * 20) {
      all++;
      if (data[i] < 60) clear++;
    }
    baseClear.current = all ? clear / all : 0;
  }, [hint]);

  useLayoutEffect(() => {
    if (revealed) return;
    paint();
    const s = stage.current;
    if (!s || !("ResizeObserver" in window)) return;
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) return void (first = false);
      if (!last.current) paint();
    });
    ro.observe(s);
    return () => ro.disconnect();
  }, [paint, revealed]);

  const reveal = useCallback(() => {
    if (lifting || revealed) return;
    setTouched(true);
    setLifting(true);
    window.setTimeout(() => setRevealed(true), reduced ? 220 : 480);
  }, [lifting, revealed, reduced]);

  // how much of the foil is gone (sampled coarsely); past half, the rest lifts off
  const check = () => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let clear = 0;
    let all = 0;
    for (let i = 3; i < data.length; i += 4 * 20) {
      all++;
      if (data[i] < 60) clear++;
    }
    // half of the label itself (not counting what was clear from the start)
    const base = baseClear.current * all;
    if (all - base > 0 && (clear - base) / (all - base) > 0.5) reveal();
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
    ctx.lineWidth = 24;
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 7;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x + 0.01, y);
    ctx.stroke();
    ctx.restore();
    last.current = { x, y };
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
    if (!lifting) check();
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
        {revealed && !reduced && <span aria-hidden className="veil-gleam" />}
        {!revealed && (
          <canvas ref={canvas} aria-hidden className="veil-foil" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
        )}
        {!revealed && (
          // a gold hand pointing at the label's right end, sparkles at its fingertip
          <span aria-hidden className="veil-hand">
            <svg viewBox="-3 -3 28 28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <g className="veil-sparks">
                <path d="M3.6 1.8 2.2 0" />
                <path d="M7 0.9V-1.6" />
                <path d="M1.8 4.8H-0.8" />
              </g>
              <g transform="rotate(-28 12 12)">
                <path d="M9 11.5V5.2a1.6 1.6 0 0 1 3.2 0v5.6m0-1.2a1.6 1.6 0 0 1 3.2 0v1.6m0-.6a1.6 1.6 0 0 1 3.2 0V15a6 6 0 0 1-6 6h-.6a5.6 5.6 0 0 1-4.4-2.2L5 15.6a1.6 1.6 0 0 1 2.5-2l1.5 1.7" />
              </g>
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
