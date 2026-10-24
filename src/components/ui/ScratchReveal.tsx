import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

/**
 * A scratch card: its children (the date) lie under a pill of gold foil that reads "✦ hint ✦". A
 * finger or the mouse scratches the foil away; once about half of it is gone the rest lifts off by
 * itself and a soft gleam of gold crosses what was hidden, once. Enter or Space (for a keyboard or
 * switch user) reveals it at once. The children are in the page all along,
 * so a screen reader reads the date; the foil is only paint. Nothing is remembered: every visit
 * scratches afresh.
 */
export function ScratchReveal({ hint, label, reduced, children }: { hint: string; label: string; reduced: boolean; children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [lifting, setLifting] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const scratched = useRef(0);
  const checking = useRef(0);

  /** Paint the foil: a gold gradient, a fine diagonal sheen, a few glints, the hint. */
  const paint = useCallback(() => {
    const c = canvas.current;
    const w = wrap.current;
    if (!c || !w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = w.getBoundingClientRect();
    if (!width || !height) return;
    c.width = Math.round(width * dpr);
    c.height = Math.round(height * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = height / 2;
    ctx.beginPath();
    ctx.roundRect(0.5, 0.5, width - 1, height - 1, r);
    ctx.save();
    ctx.clip();
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#b8893a");
    g.addColorStop(0.28, "#e9cf8e");
    g.addColorStop(0.46, "#fff1c9");
    g.addColorStop(0.62, "#d6b36a");
    g.addColorStop(1, "#a8741f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    // a fine diagonal sheen
    ctx.strokeStyle = "rgba(255, 250, 235, 0.16)";
    ctx.lineWidth = 1;
    for (let x = -height; x < width + height; x += 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }
    // a few glints
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    for (const [fx, fy, s] of [[0.12, 0.3, 1.4], [0.3, 0.72, 1], [0.7, 0.25, 1.2], [0.88, 0.68, 1.5], [0.52, 0.18, 0.9]]) {
      ctx.beginPath();
      ctx.arc(fx * width, fy * height, s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // the edge, and the hint
    ctx.strokeStyle = "rgba(122, 86, 28, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(0.5, 0.5, width - 1, height - 1, r);
    ctx.stroke();
    const family = getComputedStyle(w).getPropertyValue("--font-body").trim() || "sans-serif";
    ctx.font = `600 12px ${family}`;
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "2px";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 252, 240, 0.55)";
    ctx.fillText(`✦  ${hint}  ✦`, width / 2, height / 2 + 1);
    ctx.fillStyle = "#3d2c0c";
    ctx.fillText(`✦  ${hint}  ✦`, width / 2, height / 2);
    scratched.current = 0;
  }, [hint]);

  useLayoutEffect(() => {
    if (revealed) return;
    paint();
    const w = wrap.current;
    if (!w || !("ResizeObserver" in window)) return;
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) return void (first = false);
      paint();
    });
    ro.observe(w);
    return () => ro.disconnect();
  }, [paint, revealed]);

  const reveal = useCallback(() => {
    if (lifting || revealed) return;
    setLifting(true);
    window.setTimeout(() => setRevealed(true), reduced ? 200 : 520);
  }, [lifting, revealed, reduced]);

  // how much of the foil is gone (sampled coarsely); past about half, the rest lifts off
  const check = () => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let clear = 0;
    let all = 0;
    for (let i = 3; i < data.length; i += 4 * 24) {
      all++;
      if (data[i] < 40) clear++;
    }
    // the pill's corners are clear from the start: count against the pill's own area (~0.9)
    if (all && clear / all > 0.52) reveal();
  };

  const scratchTo = (e: PointerEvent<HTMLCanvasElement>) => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const rect = c.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 34;
    ctx.beginPath();
    const from = last.current ?? { x, y };
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x + 0.01, y);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    scratched.current += Math.hypot(x - from.x, y - from.y) + 1;
    last.current = { x, y };
    const now = performance.now();
    if (now - checking.current > 120) {
      checking.current = now;
      check();
    }
  };

  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    if (lifting) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = null;
    scratched.current = 0;
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
  const onKey = (e: KeyboardEvent) => {
    if (revealed || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    reveal();
  };

  return (
    <div
      ref={wrap}
      className="scratch"
      data-revealed={revealed || undefined}
      data-lifting={lifting || undefined}
      data-still={reduced || undefined}
      {...(revealed ? {} : { role: "button", tabIndex: 0, "aria-label": label, onKeyDown: onKey })}
    >
      <div className="scratch-under">{children}</div>
      {revealed && !reduced && <span aria-hidden className="scratch-gleam" />}
      {!revealed && (
        <canvas
          ref={canvas}
          aria-hidden
          className="scratch-foil"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        />
      )}
    </div>
  );
}
