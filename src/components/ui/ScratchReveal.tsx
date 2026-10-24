import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";

/**
 * "Golden Veil": the wedding date under a compact strip of antique-gold foil, to scratch away.
 *
 * The strip is slim and only softly rounded — a gold leaf with a faint grain, a fine ivory line set
 * just inside its edge, a small lotus and curl at each end, and "SCRATCH TO REVEAL" in navy. When the
 * card shows it, a fingertip glides across it a few times, then rests. A finger or the mouse wipes
 * the foil away with a soft edge (the page doesn't scroll while scratching); once about half of it is
 * gone the rest lifts off and a faint gleam of gold crosses the date, once.
 *
 * For anyone who can't scratch: "or tap to reveal" beneath it (a real button, so Enter or Space work
 * too) uncovers it at once. The date (the children, in the hero's navy serif) is in the page all
 * along, so a screen reader reads it; the foil is only paint. Everything shares one box, so nothing
 * around it moves. Every visit scratches afresh. Reduced motion: no fingertip, the foil simply fades.
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

  /** The foil: an antique-gold leaf with a faint grain, a fine ivory line inside its edge, a lotus at each end, the hint. */
  const paint = useCallback(() => {
    const c = canvas.current;
    const s = stage.current;
    if (!c || !s) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = s.getBoundingClientRect();
    if (!width || !height) return;
    c.width = Math.round(width * dpr);
    c.height = Math.round(height * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const radius = 4;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, radius);
    ctx.clip();
    // the leaf: muted antique gold, lighter through the middle
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#bd9757");
    g.addColorStop(0.35, "#dcc28b");
    g.addColorStop(0.55, "#e8d5a6");
    g.addColorStop(0.75, "#d3b779");
    g.addColorStop(1, "#b38a4a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    // a faint grain (seeded, so it's the same every time)
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let k = 0; k < (width * height) / 9; k++) {
      ctx.fillStyle = rnd() < 0.5 ? `rgba(255, 248, 228, ${0.05 + rnd() * 0.08})` : `rgba(110, 76, 24, ${0.04 + rnd() * 0.06})`;
      ctx.fillRect(rnd() * width, rnd() * height, 1, 1);
    }
    ctx.restore();
    // a fine ivory line just inside the edge
    ctx.strokeStyle = "rgba(255, 249, 235, 0.6)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.roundRect(3.5, 3.5, width - 7, height - 7, 2);
    ctx.stroke();
    // a small lotus and a curl at each end
    const ink = "rgba(110, 76, 24, 0.75)";
    const lotus = (cx: number, dir: 1 | -1) => {
      const cy = height / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = ink;
      ctx.fillStyle = "rgba(255, 246, 222, 0.35)";
      ctx.lineWidth = 0.9;
      ctx.lineJoin = "round";
      const petal = (path: () => void) => {
        ctx.beginPath();
        path();
        ctx.fill();
        ctx.stroke();
      };
      petal(() => {
        ctx.moveTo(0, 6);
        ctx.bezierCurveTo(-2.6, 2.4, -2.6, -2.4, 0, -6);
        ctx.bezierCurveTo(2.6, -2.4, 2.6, 2.4, 0, 6);
      });
      petal(() => {
        ctx.moveTo(0, 6);
        ctx.bezierCurveTo(-4.5, 5.4, -7, 2, -7.4, -1.6);
        ctx.bezierCurveTo(-3.6, -0.8, -1, 2.4, 0, 6);
      });
      petal(() => {
        ctx.moveTo(0, 6);
        ctx.bezierCurveTo(4.5, 5.4, 7, 2, 7.4, -1.6);
        ctx.bezierCurveTo(3.6, -0.8, 1, 2.4, 0, 6);
      });
      // the curl reaching toward the words
      ctx.beginPath();
      ctx.moveTo(dir * 10, 1);
      ctx.bezierCurveTo(dir * 15, -3, dir * 20, 3, dir * 25, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(dir * 27.5, 0, 1, 0, Math.PI * 2);
      ctx.fillStyle = ink;
      ctx.fill();
      ctx.restore();
    };
    lotus(15, 1);
    lotus(width - 15, -1);
    // the hint
    const family = getComputedStyle(s).getPropertyValue("--font-body").trim() || "sans-serif";
    ctx.font = `600 11px ${family}`;
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "2.6px";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 250, 236, 0.55)";
    ctx.fillText(hint.toUpperCase(), width / 2 + 1.3, height / 2 + 1);
    ctx.fillStyle = "rgba(18, 41, 74, 0.86)";
    ctx.fillText(hint.toUpperCase(), width / 2 + 1.3, height / 2);
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
    if (all && clear / all > 0.5) reveal();
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
        {!revealed && !reduced && (
          <span aria-hidden className="veil-finger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11.5V5.2a1.6 1.6 0 0 1 3.2 0v5.6m0-1.2a1.6 1.6 0 0 1 3.2 0v1.6m0-.6a1.6 1.6 0 0 1 3.2 0V15a6 6 0 0 1-6 6h-.6a5.6 5.6 0 0 1-4.4-2.2L5 15.6a1.6 1.6 0 0 1 2.5-2l1.5 1.7" />
            </svg>
          </span>
        )}
      </div>
      <button type="button" className="veil-tap" onClick={reveal} disabled={lifting || revealed} aria-hidden={revealed || undefined}>
        {tapLabel}
      </button>
    </div>
  );
}
