import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { wedding } from "@/config/wedding";
import type { Photo } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 07 — "Our Gallery": the couple's photos as a heart.
 *
 * Fourteen photos of different sizes, a thin cream gap between them, together make a heart: its
 * outline is the classic heart curve, each tile clipped to it, so the edge is smooth. Seen the
 * first time, the tiles fly in from the edges (turned up to ±15°, 70ms apart, about 1.4s) and
 * settle with a little spring; then the heart beats, softly (1 → 1.03 → 1, every 1.6s).
 *
 * In 3D: the heart sits in 900px of perspective, each tile lifted off it by its size (the largest
 * 0, the smallest 40px), and it tilts — up to ±8° — with the phone's gyroscope (an iPhone asks
 * on the first tap; until it is allowed, or if it is not, a sideways drag tilts it), or with the
 * mouse on a computer; the small tiles move more than the large. At rest each tile is drawn back
 * to its place, so the gaps stay even.
 *
 * A tap brings a tile forward to the middle (larger, the full photo loaded for it), with a deep
 * shadow and its caption; the others dim and blur. A tap, on it or anywhere else, sends it back;
 * a swipe while it is forward brings the next or the one before. With more photos than the heart
 * shows, every 3s one tile turns over (rotateY 180°) to show one of the others — one at a time,
 * never while a photo is forward or the heart is being tilted.
 *
 * Transform and opacity (and filters for the shadows and the blur). Reduced motion, or a slow
 * phone: no tilt, turning or beat; the tiles fade in where they are; a tap is a simple zoom.
 */

type Shown = Photo & { src: string };
/** A crop of a 3:4 photo: its left, top and width, as fractions of the photo; the height follows the tile's shape. */
type Crop = readonly [x: number, y: number, w: number];
/** What a tile shows: a photo (its place in the list) and, for the tile's own photo, the crop of it. */
type Shot = { photo: number; crop?: Crop };
type Card = { faces: [Shot, Shot | null]; turns: number };

/** The heart's height to its width. */
const RATIO = 0.904;
/** The perspective, the smallest tile's lift, and how far forward a tapped photo comes (px). */
const PERSPECTIVE = 900;
const LIFT = 40;
const FORWARD = 120;
/** The tilt at most (degrees). */
const TILT = 8;
/** The fly-in: each tile this long after the one before (ms); one tile's flight. */
const STAGGER = 70;
const FLIGHT = 520;
/** A tile turns over every… (ms), when there are photos the heart does not show. */
const FLIP_MS = 3000;

/**
 * The tiles: each a box in the heart (left, top, right, bottom, as fractions of its width and
 * height), its photo (by `src`) and the crop of it. Five photos show twice, once as a close-up.
 */
const TILES: readonly { box: readonly [number, number, number, number]; photo: string; crop: Crop }[] = [
  { box: [0, 0.03, 0.25, 0.3], photo: "/photos/gallery-1.webp", crop: [0, 0.02, 1] },
  { box: [0.25, 0, 0.5, 0.3], photo: "/photos/gallery-4.webp", crop: [0, 0, 1] },
  { box: [0.5, 0, 0.75, 0.14], photo: "/photos/gallery-1.webp", crop: [0.075, 0.075, 0.7] },
  { box: [0.5, 0.14, 0.75, 0.3], photo: "/photos/gallery-2.webp", crop: [0, 0.08, 1] },
  { box: [0.75, 0.03, 1, 0.3], photo: "/photos/gallery-6.webp", crop: [0, 0.05, 1] },
  { box: [0, 0.3, 0.3, 0.46], photo: "/photos/gallery-9.webp", crop: [0.05, 0.12, 0.9] },
  { box: [0, 0.46, 0.3, 0.62], photo: "/photos/gallery-5.webp", crop: [0.02, 0.07, 0.8] },
  { box: [0.3, 0.3, 0.7, 0.62], photo: "/photos/gallery-3.webp", crop: [0, 0.03, 1] },
  { box: [0.7, 0.3, 1, 0.46], photo: "/photos/gallery-8.webp", crop: [0.08, 0.25, 0.85] },
  { box: [0.7, 0.46, 1, 0.62], photo: "/photos/gallery-6.webp", crop: [0, 0.1, 1] },
  { box: [0.19, 0.62, 0.4, 0.78], photo: "/photos/gallery-7.webp", crop: [0, 0.12, 1] },
  { box: [0.4, 0.62, 0.6, 0.78], photo: "/photos/gallery-5.webp", crop: [0, 0.02, 1] },
  { box: [0.6, 0.62, 0.81, 0.78], photo: "/photos/gallery-7.webp", crop: [0.3, 0.15, 0.65] },
  { box: [0.358, 0.78, 0.642, 1], photo: "/photos/gallery-4.webp", crop: [0.12, 0.06, 0.75] },
];

/** The classic heart curve, in the heart's box (0–1 each way), 240 points round. */
const HEART = (() => {
  const pts = Array.from({ length: 240 }, (_, i) => {
    const t = (i / 240) * 2 * Math.PI;
    return [16 * Math.sin(t) ** 3, 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)];
  });
  const ys = pts.map((p) => p[1]);
  const [lo, hi] = [Math.min(...ys), Math.max(...ys)];
  return pts.map(([x, y]) => [(x + 16) / 32, (hi - y) / (hi - lo)]);
})();
/** The heart as an SVG path in a 100 × 90.4 box, for the cream mount behind the tiles. */
const HEART_PATH = `M${HEART.map(([x, y]) => `${(x * 100).toFixed(2)} ${(y * 100 * RATIO).toFixed(2)}`).join("L")}Z`;

const area = (p: number[][]) =>
  Math.abs(p.reduce((s, a, i) => s + a[0] * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * a[1], 0)) / 2;

/** The part of the heart inside a box, as a CSS polygon in the box's own % — none if it is all inside. */
function clipTo([x0, y0, x1, y1]: readonly number[]) {
  const sides: [(p: number[]) => boolean, (a: number[], b: number[]) => number[]][] = [
    [(p) => p[0] >= x0, (a, b) => [x0, a[1] + ((x0 - a[0]) / (b[0] - a[0])) * (b[1] - a[1])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + ((x1 - a[0]) / (b[0] - a[0])) * (b[1] - a[1])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + ((y0 - a[1]) / (b[1] - a[1])) * (b[0] - a[0]), y0]],
    [(p) => p[1] <= y1, (a, b) => [a[0] + ((y1 - a[1]) / (b[1] - a[1])) * (b[0] - a[0]), y1]],
  ];
  // Sutherland–Hodgman: the heart cut by each side of the box in turn
  let poly = HEART;
  for (const [inside, cross] of sides) {
    const out: number[][] = [];
    poly.forEach((b, i) => {
      const a = poly[(i + poly.length - 1) % poly.length];
      if (inside(b)) {
        if (!inside(a)) out.push(cross(a, b));
        out.push(b);
      } else if (inside(a)) out.push(cross(a, b));
    });
    poly = out;
  }
  const [w, h] = [x1 - x0, y1 - y0];
  if (area(poly) > w * h * 0.999) return undefined;
  const local: number[][] = [];
  for (const [x, y] of poly) {
    const p = [((x - x0) / w) * 100, ((y - y0) / h) * 100];
    const q = local[local.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1) local.push(p);
  }
  return `polygon(${local.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(",")})`;
}

/** Each tile's shape and place: its size, centre, aspect (width / height) and clip. */
const GEOMETRY = TILES.map(({ box }) => {
  const [x0, y0, x1, y1] = box;
  const [w, h] = [x1 - x0, y1 - y0];
  return { x0, y0, w, h, cx: x0 + w / 2, cy: y0 + h / 2, size: w * h, aspect: w / (h * RATIO), clip: clipTo(box) };
});
type Geometry = (typeof GEOMETRY)[number];
const SIZES = GEOMETRY.map((g) => g.size);
const [SMALLEST, LARGEST] = [Math.min(...SIZES), Math.max(...SIZES)];
const pct = (v: number) => `${(v * 100).toFixed(3)}%`;
/** How large a tile shows when tapped (times its size): about 86% of the heart's width or height. */
const view = (g: Geometry) => Math.min(0.86 / g.w, 0.86 / g.h, 3.2);

/**
 * A tile's place, depth and forward pose, as CSS variables. Its lift (`--z`) would carry it out
 * from the middle and enlarge it in the perspective, so at rest it is drawn back (`--dx`, `--dy`)
 * and scaled down (`--s`) to sit exactly in its place; tilted, the lift shows as parallax.
 */
function tileStyle(g: Geometry, flat: boolean): CSSProperties {
  const z = flat ? 0 : LIFT * (1 - (g.size - SMALLEST) / (LARGEST - SMALLEST));
  const k = z / PERSPECTIVE;
  const v = view(g);
  return {
    left: pct(g.x0),
    top: pct(g.y0),
    width: pct(g.w),
    height: pct(g.h),
    "--dx": pct(-((g.cx - 0.5) / g.w) * k),
    "--dy": pct(-((g.cy - 0.5) / g.h) * k),
    "--z": `${z.toFixed(1)}px`,
    "--s": (1 - k).toFixed(4),
    "--ox": pct((0.5 - g.cx) / g.w),
    "--oy": pct((0.5 - g.cy) / g.h),
    "--pz": flat ? "0px" : `${FORWARD}px`,
    "--os": (flat ? v : v * (1 - FORWARD / PERSPECTIVE)).toFixed(4),
  } as CSSProperties;
}

/** Where a photo sits in its tile: the tile's own photo by its crop; any other, covering it. */
function shotStyle(g: Geometry, shot: Shot, photo: Shown): CSSProperties {
  if (!shot.crop) return { inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: photo.focus ?? "50% 40%" };
  const [x, y, w] = shot.crop;
  return { width: pct(1 / w), left: pct(-x / w), top: pct((-y * g.aspect) / (w * 0.75)) };
}

const face = (c: Card) => c.faces[c.turns % 2]!;

/** A phone too slow for the 3D gets the plain heart. */
const slowDevice = () => {
  const n = navigator as Navigator & { deviceMemory?: number };
  return (n.hardwareConcurrency ?? 8) <= 2 || (n.deviceMemory ?? 8) <= 1;
};

/** Load (and decode) a photo before it is shown. */
function ready(src: string) {
  const im = new Image();
  im.src = src;
  return im.decode().catch(() => undefined);
}

type Orientation = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };

export function Gallery() {
  const { gallery } = wedding;
  const photos = useMemo(() => gallery.photos.filter((p): p is Shown => Boolean(p.src)), [gallery.photos]);
  const n = photos.length;
  const sectionRef = useRef<HTMLElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const seen = useInView(sectionRef, { threshold: 0.08 });
  const heartSeen = useInView(heartRef, { threshold: 0.25 });
  const reduced = usePrefersReducedMotion();
  const [slow] = useState(slowDevice);
  const plain = reduced || slow;
  const [phase, setPhase] = useState<"before" | "in" | "done">("before");
  // the tile brought forward, and the one going back (unclipped until it is home)
  const [open, setOpen] = useState<number | null>(null);
  const [settling, setSettling] = useState<number | null>(null);
  const [tapped, setTapped] = useState(false);
  // the full photos loaded in, by "tile:photo"
  const [big, setBig] = useState<ReadonlySet<string>>(() => new Set());
  // an iPhone's gyroscope, once allowed
  const [motion, setMotion] = useState(false);
  const [cards, setCards] = useState<Card[]>(() =>
    TILES.map((t, i) => {
      const k = photos.findIndex((p) => p.src === t.photo);
      return { faces: [k >= 0 ? { photo: k, crop: t.crop } : { photo: i % Math.max(n, 1) }, null], turns: 0 };
    }),
  );
  const openRef = useRef(open);
  openRef.current = open;
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const visible = useRef(false);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  // when a swipe or a drag ended: the click that follows it is not a tap
  const swallowed = useRef(0);
  const asked = useRef(false);
  const gyro = useRef(0);
  const lastFlip = useRef(-1);
  const lastOpen = useRef(0);
  if (open != null) lastOpen.current = open;

  // the fly-in: each tile from a random edge, turned up to ±15°, in a random order
  const [fly] = useState(() => {
    const order = TILES.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return GEOMETRY.map((g, i) => {
      const edge = Math.floor(Math.random() * 4);
      const far = 22 + Math.random() * 18;
      const drift = () => (Math.random() - 0.5) * 30;
      const fx = edge === 0 ? -(g.cx * 100 + far) : edge === 1 ? (1 - g.cx) * 100 + far : drift();
      const fy = edge === 2 ? -(g.cy * 100 * RATIO + far) : edge === 3 ? (1 - g.cy) * 100 * RATIO + far : drift();
      const at = order.indexOf(i);
      return {
        "--fx": `${fx.toFixed(1)}cqw`,
        "--fy": `${fy.toFixed(1)}cqw`,
        "--fr": `${(Math.random() * 30 - 15).toFixed(1)}deg`,
        "--d": `${at * STAGGER}ms`,
        "--fd": `${at * 35}ms`,
      } as CSSProperties;
    });
  });
  const styles = useMemo(() => GEOMETRY.map((g) => tileStyle(g, plain)), [plain]);
  // more photos than the tiles show: some can turn over
  const [flippable] = useState(() => {
    const own = new Set(cards.map((c) => face(c).photo));
    return photos.some((_, k) => !own.has(k));
  });

  // seen: the tiles fly in, then the heart beats
  const started = useRef(false);
  useEffect(() => {
    if (!heartSeen || started.current) return;
    started.current = true;
    setPhase("in");
    window.setTimeout(() => setPhase("done"), plain ? 13 * 35 + 450 : 13 * STAGGER + FLIGHT + 60);
  }, [heartSeen, plain]);

  // the tilt: eased toward its aim each frame, written straight to the tilting layer
  const tilt = useRef({ x: 0, y: 0, tx: 0, ty: 0, raf: 0, moved: 0 });
  const aim = useCallback((x: number, y: number) => {
    const t = tilt.current;
    const clamp = (v: number) => Math.max(-TILT, Math.min(TILT, v));
    const [tx, ty] = openRef.current == null ? [clamp(x), clamp(y)] : [0, 0];
    if (Math.abs(tx - t.tx) + Math.abs(ty - t.ty) > 0.4) t.moved = Date.now();
    [t.tx, t.ty] = [tx, ty];
    if (t.raf) return;
    const frame = () => {
      t.x += (t.tx - t.x) * 0.12;
      t.y += (t.ty - t.y) * 0.12;
      const still = Math.abs(t.tx - t.x) < 0.02 && Math.abs(t.ty - t.y) < 0.02;
      if (still) [t.x, t.y] = [t.tx, t.ty];
      const el = tiltRef.current;
      if (el) el.style.transform = t.x || t.y ? `rotateX(${t.x.toFixed(2)}deg) rotateY(${t.y.toFixed(2)}deg)` : "";
      t.raf = still ? 0 : requestAnimationFrame(frame);
    };
    t.raf = requestAnimationFrame(frame);
  }, []);
  useEffect(() => () => cancelAnimationFrame(tilt.current.raf), []);

  // on screen? (for the gyroscope and the turning); scrolled away, a photo forward goes back
  useEffect(() => {
    const el = heartRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting;
        if (!e.isIntersecting && openRef.current != null) {
          openRef.current = null;
          setOpen(null);
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the gyroscope: the heart tilts with the phone (from how it was held, slowly re-centring)
  useEffect(() => {
    const D = window.DeviceOrientationEvent as Orientation | undefined;
    if (plain || phase !== "done" || !D) return;
    if (typeof D.requestPermission === "function" && !motion) return;
    let base: [number, number] | null = null;
    const on = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null || !visible.current) return;
      base = base ? [base[0] + (e.beta - base[0]) * 0.01, base[1] + (e.gamma - base[1]) * 0.01] : [e.beta, e.gamma];
      gyro.current = Date.now();
      aim(-(e.beta - base[0]) * 0.6, (e.gamma - base[1]) * 0.6);
    };
    window.addEventListener("deviceorientation", on);
    return () => window.removeEventListener("deviceorientation", on);
  }, [plain, phase, motion, aim]);

  // an iPhone asks for the gyroscope on the first tap; refused, the drag still tilts
  const askMotion = () => {
    const D = window.DeviceOrientationEvent as Orientation | undefined;
    if (asked.current || plain || typeof D?.requestPermission !== "function") return;
    asked.current = true;
    D.requestPermission()
      .then((r) => r === "granted" && setMotion(true))
      .catch(() => undefined);
  };

  const loadBig = (i: number) => {
    const key = `${i}:${face(cardsRef.current[i]).photo}`;
    setBig((b) => (b.has(key) ? b : new Set(b).add(key)));
  };
  const settle = (was: number) => {
    setSettling(was);
    window.setTimeout(() => setSettling((s) => (s === was ? null : s)), plain ? 260 : 650);
  };
  const show = (i: number) => {
    openRef.current = i;
    setOpen(i);
    setTapped(true);
    aim(0, 0);
    loadBig(i);
    // the neighbours' full photos, ready for a swipe
    for (const j of [i + 1, i + TILES.length - 1]) void ready(photos[face(cardsRef.current[j % TILES.length]).photo].src);
  };
  const close = useCallback(() => {
    const was = openRef.current;
    if (was == null) return;
    openRef.current = null;
    setOpen(null);
    settle(was);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plain]);
  const step = useCallback(
    (dir: 1 | -1) => {
      const was = openRef.current;
      if (was == null) return;
      const to = (was + dir + TILES.length) % TILES.length;
      openRef.current = to;
      setOpen(to);
      settle(was);
      loadBig(to);
      tileRefs.current[to]?.focus({ preventScroll: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plain],
  );

  // while a photo is forward: a tap anywhere else sends it back (and does nothing more); keys too
  useEffect(() => {
    if (open == null) return;
    const onClick = (e: MouseEvent) => {
      if (tileRefs.current[open]?.contains(e.target as Node)) return;
      e.stopPropagation();
      e.preventDefault();
      if (Date.now() - swallowed.current > 450) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        step(e.key === "ArrowRight" ? 1 : -1);
      }
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  // every 3s, one tile turns over to show a photo not shown — not while one is forward or tilting
  const flip = useCallback(async () => {
    const cs = cardsRef.current;
    const showing = new Set(cs.map((c) => face(c).photo));
    const pool = photos.map((_, k) => k).filter((k) => !showing.has(k));
    const tiles = cs.map((_, i) => i).filter((i) => i !== openRef.current && i !== lastFlip.current);
    if (!pool.length || !tiles.length) return;
    const i = tiles[Math.floor(Math.random() * tiles.length)];
    const p = pool[Math.floor(Math.random() * pool.length)];
    lastFlip.current = i;
    await ready(photos[p].thumb ?? photos[p].src);
    if (openRef.current === i) return;
    // the hidden face takes the photo, then (a frame on) the tile turns to it
    setCards((cur) =>
      cur.map((c, k) => (k !== i ? c : { ...c, faces: c.turns % 2 ? [{ photo: p }, c.faces[1]] : [c.faces[0], { photo: p }] })),
    );
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setCards((cur) => cur.map((c, k) => (k === i ? { ...c, turns: c.turns + 1 } : c)))),
    );
  }, [photos]);
  useEffect(() => {
    if (plain || phase !== "done" || !flippable) return;
    const id = window.setInterval(() => {
      if (!visible.current || document.hidden || openRef.current != null || drag.current) return;
      if (Date.now() - tilt.current.moved < 1500) return;
      void flip();
    }, FLIP_MS);
    return () => clearInterval(id);
  }, [plain, phase, flippable, flip]);

  // the pointer: the mouse tilts the heart toward it; a drag turns it (without a gyroscope);
  // while a photo is forward, a swipe brings the next or the one before
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (d && (Math.abs(e.clientX - d.x) > 8 || Math.abs(e.clientY - d.y) > 8)) d.moved = true;
    if (plain || phase !== "done" || openRef.current != null) return;
    if (e.pointerType === "mouse") {
      const r = heartRef.current!.getBoundingClientRect();
      aim(((e.clientY - r.top) / r.height - 0.5) * 2 * TILT, -((e.clientX - r.left) / r.width - 0.5) * 2 * TILT);
    } else if (d && Date.now() - gyro.current > 1000) aim(-(e.clientY - d.y) * 0.1, (e.clientX - d.x) * 0.1);
  };
  const onPointerUp = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const [dx, dy] = [e.clientX - d.x, e.clientY - d.y];
    if (e.pointerType !== "mouse" && Date.now() - gyro.current > 1000) aim(0, 0);
    if (openRef.current != null && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      swallowed.current = Date.now();
      step(dx < 0 ? 1 : -1);
    } else if (d.moved) swallowed.current = Date.now();
  };
  const onPointerCancel = (e: PointerEvent) => {
    drag.current = null;
    if (e.pointerType !== "mouse" && Date.now() - gyro.current > 1000) aim(0, 0);
  };
  const onTile = (i: number) => {
    if (Date.now() - swallowed.current < 450) return;
    askMotion();
    if (phase !== "done") return;
    if (openRef.current === i) close();
    else if (openRef.current == null) show(i);
  };

  if (!n) return null;
  const capTile = open ?? lastOpen.current;
  const capPhoto = photos[face(cards[capTile]).photo];
  const capG = GEOMETRY[capTile];

  return (
    <section id="gallery" ref={sectionRef} aria-labelledby="gallery-heading" className="relative overflow-x-clip px-[var(--gutter)] pb-4 pt-[var(--section-gap)]">
      <SectionHeading id="gallery-heading" eyebrow={gallery.eyebrow} title={gallery.title} intro={`“${gallery.intro}”`} show={seen} />

      <div className="hc-wrap">
        <div
          ref={heartRef}
          className="hc"
          data-phase={phase}
          data-plain={plain || undefined}
          data-open={open != null || undefined}
          role="group"
          aria-label={`${gallery.title}: ${TILES.length} photos in a heart. Tap one to see it larger; the arrow keys bring the next.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={(e) => e.pointerType === "mouse" && aim(0, 0)}
        >
          <div className="hc-beat">
            <div ref={tiltRef} className="hc-tilt">
              {/* the cream mount: the gaps between the tiles, and a thin rim round the heart */}
              <svg className="hc-mount" viewBox="0 0 100 90.4" preserveAspectRatio="none" aria-hidden>
                <path d={HEART_PATH} />
              </svg>
              {TILES.map((_, i) => {
                const g = GEOMETRY[i];
                const card = cards[i];
                const p = photos[face(card).photo];
                return (
                  <button
                    key={i}
                    ref={(el) => (tileRefs.current[i] = el)}
                    type="button"
                    className="hc-tile"
                    style={{ ...styles[i], ...fly[i] }}
                    data-open={open === i || undefined}
                    aria-label={p.caption ? `${p.caption}: ${p.alt}` : p.alt}
                    aria-pressed={open === i}
                    onClick={() => onTile(i)}
                  >
                    <span className="hc-clip" style={{ clipPath: open === i || settling === i ? undefined : g.clip }}>
                      <span className="hc-card" style={card.turns ? { transform: `rotateY(${card.turns * 180}deg)` } : undefined}>
                        {card.faces.map((shot, f) => {
                          if (!shot) return null;
                          const ph = photos[shot.photo];
                          const at = shotStyle(g, shot, ph);
                          return (
                            <span key={f} className="hc-side" data-back={f === 1 || undefined}>
                              <img className="hc-img" src={ph.thumb ?? ph.src} alt="" width={484} height={648} loading="lazy" decoding="async" draggable={false} style={at} />
                              {big.has(`${i}:${shot.photo}`) && (
                                <img
                                  className="hc-img hc-big"
                                  src={ph.src}
                                  alt=""
                                  width={484}
                                  height={648}
                                  decoding="async"
                                  draggable={false}
                                  style={at}
                                  onLoad={(e) => (e.currentTarget.dataset.ready = "")}
                                />
                              )}
                            </span>
                          );
                        })}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* the caption, under the photo brought forward */}
          <p
            className="hc-caption"
            data-on={open != null || undefined}
            aria-live="polite"
            style={{ top: `calc(50% + ${(view(capG) * capG.h * 50).toFixed(2)}% + 12px)` }}
          >
            {capPhoto.caption ?? capPhoto.alt}
          </p>
        </div>
        <p className="hc-hint" data-shown={phase === "done" || undefined} data-gone={tapped || undefined} aria-hidden>
          {gallery.hint}
        </p>
      </div>
    </section>
  );
}
