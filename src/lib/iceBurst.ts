/**
 * The ice burst (as in the reference). From the point where the hands met:
 * a white flash and a ring of cold light, ice shards shooting outward, and
 * frost crystallising across the screen with cracks branching through it;
 * sparkles glint on the ice. Then the ice breaks up in blotches — the centre
 * first — and its flakes drift down, uncovering what lies beneath.
 *
 * Two canvases, both fixed over the screen and placed inside `host`: the
 * frost below the hands (so they can still dissolve over the ice) and the
 * flash and shards above them.
 *
 * `onCovered` fires once the screen is fully frosted (change the scene then).
 * Resolves when the ice is gone; abort the signal to remove it at once.
 */
interface Options {
  host: HTMLElement;
  /** Where the burst starts, in viewport px. */
  origin: { x: number; y: number };
  /** The frost texture (its bright centre at 46% of its height). */
  frost: string;
  /** z-index of the frost and of the flash; the hands sit between them. */
  layers?: [number, number];
  /** 1 = the full burst (about 3.4 s); smaller is quicker. */
  pace?: number;
  onCovered?: () => void;
  signal?: AbortSignal;
}

interface Cell {
  x: number;
  y: number;
  appear: number;
  vanish: number;
  fade: number;
  /** Some cells break off as a flake. */
  flake: null | { vx: number; vy: number; r: number };
}

interface Crack {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Distance along the crack from the burst, at each end. */
  s0: number;
  s1: number;
  w: number;
  vanish: number;
}

interface Shard {
  angle: number;
  start: number;
  length: number;
  width: number;
  travel: number;
}

interface Spark {
  x: number;
  y: number;
  size: number;
  at: number;
  life: number;
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

// smooth value noise, so the ice freezes and breaks in ragged blotches rather than circles
const hash = (i: number, j: number) => {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function noise(x: number, y: number) {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const u = (x - i) * (x - i) * (3 - 2 * (x - i));
  const v = (y - j) * (y - j) * (3 - 2 * (y - j));
  const a = hash(i, j) + (hash(i + 1, j) - hash(i, j)) * u;
  const b = hash(i, j + 1) + (hash(i + 1, j + 1) - hash(i, j + 1)) * u;
  return a + (b - a) * v;
}

function makeCanvas(host: HTMLElement, W: number, H: number, dpr: number, z: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    zIndex: String(z),
    pointerEvents: "none",
  });
  host.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  return { canvas, ctx };
}

export function iceBurst({ host, origin, frost, layers = [4, 6], pace = 1, onCovered, signal }: Options): Promise<void> {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const T = (ms: number) => ms * pace;
  const rnd = Math.random;
  const { x: ox, y: oy } = origin;
  const maxD = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy));

  const below = makeCanvas(host, W, H, dpr, layers[0]);
  const above = makeCanvas(host, W, H, dpr, layers[1]);
  // where the ice is: one pixel per cell, smoothed as it is scaled up, then used to cut the frost texture
  const SIZE = 8;
  const cols = Math.ceil(W / SIZE);
  const rows = Math.ceil(H / SIZE);
  const mask = document.createElement("canvas");
  mask.width = cols;
  mask.height = rows;
  const mctx = mask.getContext("2d")!;
  const maskData = mctx.createImageData(cols, rows);

  const img = new Image();
  img.src = frost;

  // when the ice at (x, y) freezes, and when it breaks up
  const distance = (x: number, y: number) => Math.hypot(x - ox, y - oy) / maxD;
  const freezeAt = (x: number, y: number) =>
    T(Math.max(0, distance(x, y) + (noise(x / 26, y / 26) - 0.5) * 0.14) * 720);
  const breakAt = (x: number, y: number) =>
    T(1600 + (distance(x, y) * 0.55 + (noise(x / 64, y / 64) * 0.65 + noise(x / 20, y / 20) * 0.35) * 0.45) * 1100);

  const cells: Cell[] = [];
  for (let y = 0; y < rows * SIZE; y += SIZE)
    for (let x = 0; x < cols * SIZE; x += SIZE) {
      const cx = x + SIZE / 2;
      const cy = y + SIZE / 2;
      cells.push({
        x,
        y,
        appear: freezeAt(cx, cy) + T(rnd() * 90),
        vanish: breakAt(cx, cy) + T(rnd() * 160),
        fade: T(180 + rnd() * 200),
        flake: rnd() < 0.1 ? { vx: (rnd() - 0.5) * 0.06, vy: 0.03 + rnd() * 0.07, r: 0.8 + rnd() * 2.2 } : null,
      });
    }

  // cracks branching out through the ice
  const cracks: Crack[] = [];
  const branch = (x: number, y: number, angle: number, length: number, width: number, s: number, depth: number) => {
    let a = angle;
    let travelled = 0;
    while (travelled < length) {
      // mostly straight, with now and then a sharp kink — ice, not roots
      a += (rnd() - 0.5) * (rnd() < 0.15 ? 0.9 : 0.22);
      const step = 12 + rnd() * 18;
      const nx = x + Math.cos(a) * step;
      const ny = y + Math.sin(a) * step;
      const w = width * (1 - (travelled / length) * 0.7);
      cracks.push({ x1: x, y1: y, x2: nx, y2: ny, s0: s + travelled, s1: s + travelled + step, w, vanish: breakAt(nx, ny) });
      x = nx;
      y = ny;
      travelled += step;
      if (depth < 2 && rnd() < 0.16)
        branch(x, y, a + (rnd() < 0.5 ? -1 : 1) * (0.45 + rnd() * 0.6), length * (0.2 + rnd() * 0.3), w * 0.7, s + travelled, depth + 1);
    }
  };
  const MAIN = 13;
  for (let i = 0; i < MAIN; i++) {
    const a = (i / MAIN) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
    branch(ox + Math.cos(a) * 10, oy + Math.sin(a) * 10, a, maxD * (0.55 + rnd() * 0.6), 1.4 + rnd() * 1.1, 10, 0);
  }

  const shards: Shard[] = Array.from({ length: 64 }, () => ({
    angle: rnd() * Math.PI * 2,
    start: 4 + rnd() * 24,
    length: maxD * (0.22 + rnd() * 0.55),
    width: 1.5 + rnd() * 4.5,
    travel: T(380 + rnd() * 360),
  }));

  const sparks: Spark[] = Array.from({ length: 60 }, () => {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * maxD;
    const x = ox + Math.cos(a) * r;
    const y = oy + Math.sin(a) * r;
    const at = freezeAt(x, y) + T(150 + rnd() * 500);
    return { x, y, size: 3 + rnd() * 6, at, life: Math.max(T(300), Math.min(T(600 + rnd() * 700), breakAt(x, y) - at)) };
  });

  const covered = Math.max(...cells.map((c) => c.appear)) + T(160);
  const end = Math.max(...cells.map((c) => c.vanish + c.fade)) + T(1000);

  return new Promise((resolve) => {
    let fired = false;
    let frame = 0;
    const finish = () => {
      cancelAnimationFrame(frame);
      below.canvas.remove();
      above.canvas.remove();
      resolve();
    };
    if (signal?.aborted) return finish();
    signal?.addEventListener("abort", finish, { once: true });
    const start = performance.now();

    const draw = (now: number) => {
      const t = now - start;
      if (!fired && t >= covered) {
        fired = true;
        onCovered?.();
      }
      const ctx = below.ctx;
      ctx.clearRect(0, 0, W, H);

      // ── below the hands: the frost, cut to where the ice is right now ──
      const px = maskData.data;
      cells.forEach((c, i) => {
        let a = ease((t - c.appear) / T(160));
        if (t > c.vanish) a *= 1 - clamp01((t - c.vanish) / c.fade);
        px[i * 4 + 3] = Math.round(a * 255);
      });
      mctx.putImageData(maskData, 0, 0);

      if (img.complete && img.naturalWidth) {
        const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
        const iw = img.naturalWidth * s;
        const ih = img.naturalHeight * s;
        ctx.drawImage(img, (W - iw) / 2, oy - ih * 0.46, iw, ih);
      } else {
        ctx.fillStyle = "#eaf6fd";
        ctx.fillRect(0, 0, W, H);
      }
      // icier toward the edges
      const tint = ctx.createRadialGradient(ox, oy, maxD * 0.1, ox, oy, maxD);
      tint.addColorStop(0, "rgba(255,255,255,0.35)");
      tint.addColorStop(0.55, "rgba(196,228,246,0.25)");
      tint.addColorStop(1, "rgba(150,204,236,0.55)");
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, W, H);

      // cracks, growing out from the burst and breaking up with the ice
      const front = maxD * 1.25 * ease(t / T(820));
      ctx.lineCap = "round";
      for (const k of cracks) {
        if (k.s0 >= front) continue;
        const a = 1 - clamp01((t - k.vanish) / T(260));
        if (a <= 0) continue;
        const f = Math.min(1, (front - k.s0) / (k.s1 - k.s0));
        const x2 = k.x1 + (k.x2 - k.x1) * f;
        const y2 = k.y1 + (k.y2 - k.y1) * f;
        ctx.strokeStyle = `rgba(110,166,206,${0.7 * a})`;
        ctx.lineWidth = k.w + 0.6;
        ctx.beginPath();
        ctx.moveTo(k.x1, k.y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${0.95 * a})`;
        ctx.lineWidth = Math.max(0.6, k.w * 0.45);
        ctx.beginPath();
        ctx.moveTo(k.x1 + 0.8, k.y1 - 0.8);
        ctx.lineTo(x2 + 0.8, y2 - 0.8);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "destination-in";
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(mask, 0, 0, cols * SIZE, rows * SIZE);
      ctx.globalCompositeOperation = "source-over";

      // sparkles glinting on the ice
      for (const s of sparks) {
        const k = (t - s.at) / s.life;
        if (k <= 0 || k >= 1) continue;
        const a = Math.sin(k * Math.PI);
        const r = s.size * (0.5 + a * 0.7);
        ctx.strokeStyle = `rgba(255,255,255,${a})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(s.x - r, s.y);
        ctx.lineTo(s.x + r, s.y);
        ctx.moveTo(s.x, s.y - r);
        ctx.lineTo(s.x, s.y + r);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // as the ice breaks up, flakes come away and drift down
      for (const c of cells) {
        if (!c.flake || t < c.vanish) continue;
        const age = t - c.vanish;
        const life = T(1000);
        if (age > life) continue;
        const f = c.flake;
        ctx.fillStyle = `rgba(250,253,255,${(1 - age / life) * 0.95})`;
        ctx.beginPath();
        ctx.arc(c.x + f.vx * age, c.y + f.vy * age + age * age * 0.00006, f.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── above the hands: the flash, its ring of light, and the shards ──
      const top = above.ctx;
      top.clearRect(0, 0, W, H);
      if (t < T(1000)) {
        const k = t / T(1000);
        const r = maxD * (0.08 + ease(k * 3) * 0.42);
        const a = k < 0.18 ? 1 : 1 - (k - 0.18) / 0.82;
        const g = top.createRadialGradient(ox, oy, 0, ox, oy, r);
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(0.3, `rgba(240,250,255,${a * 0.75})`);
        g.addColorStop(1, "rgba(214,240,255,0)");
        top.fillStyle = g;
        top.fillRect(0, 0, W, H);
      }
      if (t < T(650)) {
        const k = t / T(650);
        const r = maxD * 1.1 * ease(k);
        const a = (1 - k) * 0.45;
        const g = top.createRadialGradient(ox, oy, Math.max(0, r - 22), ox, oy, r + 2);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.8, `rgba(255,255,255,${a})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        top.fillStyle = g;
        top.fillRect(0, 0, W, H);
      }
      for (const s of shards) {
        const p = ease(t / s.travel);
        const a = t < T(600) ? 1 : 1 - clamp01((t - T(600)) / T(450));
        if (a <= 0 || p <= 0) continue;
        const cos = Math.cos(s.angle);
        const sin = Math.sin(s.angle);
        const r0 = s.start + s.length * p * 0.4;
        const r1 = s.start + s.length * p;
        const bx = ox + cos * r0;
        const by = oy + sin * r0;
        const tx = ox + cos * r1;
        const ty = oy + sin * r1;
        const g = top.createLinearGradient(bx, by, tx, ty);
        g.addColorStop(0, `rgba(255,255,255,${0.95 * a})`);
        g.addColorStop(1, "rgba(200,236,255,0)");
        top.fillStyle = g;
        top.beginPath();
        top.moveTo(bx - sin * s.width, by + cos * s.width);
        top.lineTo(tx, ty);
        top.lineTo(bx + sin * s.width, by - cos * s.width);
        top.closePath();
        top.fill();
      }

      if (t < end && !signal?.aborted) frame = requestAnimationFrame(draw);
      else finish();
    };
    frame = requestAnimationFrame(draw);
  });
}
