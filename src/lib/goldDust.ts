/**
 * Turns the painted hands into golden dust (as in the reference): the
 * picture is redrawn as fine gold grains on a canvas laid over it, and the
 * grains lift away — starting where the fingertips meet and spreading out to
 * the wrists — drifting up and fading. Runs once, then removes its canvas.
 */
interface Grain {
  x: number;
  y: number;
  vx: number;
  vy: number;
  delay: number;
  life: number;
  size: number;
  color: string;
}

const GOLD = [214, 174, 104];

export function dissolveToDust(
  stage: HTMLElement,
  images: HTMLImageElement[],
  /** The point the dust spreads out from (fractions of the stage). */
  origin: { x: number; y: number },
  duration = 2200,
): Promise<void> {
  const rect = stage.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  if (!w || !h) return Promise.resolve();

  // the hands as they are now, at the stage's size
  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  const sctx = src.getContext("2d", { willReadFrequently: true });
  if (!sctx) return Promise.resolve();
  for (const img of images) if (img.complete && img.naturalWidth) sctx.drawImage(img, 0, 0, w, h);
  let pixels: Uint8ClampedArray;
  try {
    pixels = sctx.getImageData(0, 0, w, h).data;
  } catch {
    return Promise.resolve();
  }

  // grains: every few pixels of paint becomes one, tinted toward gold
  const step = w > 600 ? 4 : 3;
  const ox = origin.x * w;
  const oy = origin.y * h;
  const reach = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy));
  const grains: Grain[] = [];
  for (let y = 0; y < h; y += step)
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      if (pixels[i + 3] < 110) continue;
      const lum = (pixels[i] * 0.3 + pixels[i + 1] * 0.55 + pixels[i + 2] * 0.15) / 255;
      const tint = 0.55 + lum * 0.65;
      const r = Math.min(255, Math.round(GOLD[0] * tint * 0.7 + pixels[i] * 0.3));
      const g = Math.min(255, Math.round(GOLD[1] * tint * 0.7 + pixels[i + 1] * 0.3));
      const b = Math.min(255, Math.round(GOLD[2] * tint * 0.75 + pixels[i + 2] * 0.25));
      const dx = x - ox;
      const dy = y - oy;
      const d = Math.hypot(dx, dy) || 1;
      const away = 0.25 + Math.random() * 0.45;
      grains.push({
        x,
        y,
        // drift outward from the meeting point and upward, with a little scatter
        vx: (dx / d) * away + (Math.random() - 0.5) * 0.5,
        vy: (dy / d) * away * 0.5 - (0.35 + Math.random() * 0.55),
        delay: (d / reach) * duration * 0.5 + Math.random() * duration * 0.12,
        life: duration * (0.32 + Math.random() * 0.22),
        size: step * (0.9 + Math.random() * 0.5),
        color: `rgb(${r},${g},${b})`,
      });
    }

  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  });
  stage.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  return new Promise((resolve) => {
    const start = performance.now();
    const frame = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      for (const p of grains) {
        const age = t - p.delay;
        if (age > p.life) continue;
        alive++;
        let x = p.x;
        let y = p.y;
        let alpha = 1;
        let size = p.size;
        if (age > 0) {
          const k = age / p.life;
          const travel = age / 16;
          x += p.vx * travel + Math.sin((p.y + age) * 0.02) * 2 * k;
          y += p.vy * travel;
          alpha = 1 - k * k;
          size *= 1 - k * 0.6;
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(x, y, size, size);
      }
      if (alive && t < duration * 1.6) requestAnimationFrame(frame);
      else {
        canvas.remove();
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });
}
