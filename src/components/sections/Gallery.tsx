import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { wedding } from "@/config/wedding";
import type { Photo } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useScrollLock } from "@/hooks/useScrollLock";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 07 — "Our Gallery": the couple's photos as a heart.
 *
 * Fourteen photos of different sizes, the same thin antique-gold gap between all of them, together
 * make a heart inside a polished gold heart frame (the couple's picture of it, its white keyed away):
 * each tile is clipped to the frame's inner outline, traced from the picture, and the frame lies over
 * the photos' edge; a faint, soft shadow under it. Seen the first time, the tiles fly
 * in from the edges (turned up to ±15°, 70ms apart, about 1.4s) and settle with a little spring;
 * then the heart beats now and then, barely (a soft double beat, 1 → 1.012, every 3.2s).
 *
 * In 3D: the heart sits in 900px of perspective, each tile lifted off it by its size (the largest
 * 0, the smallest 40px), and it tilts — up to ±8° — with the phone's gyroscope (an iPhone asks
 * on the first tap; until it is allowed, or if it is not, a sideways drag tilts it), or with the
 * mouse on a computer; the small tiles move more than the large. At rest each tile is drawn back
 * to its place, so the gaps stay even.
 *
 * A tap opens the photo in a lightbox: the whole photo grows out of its tile onto a night-blue
 * veil, with its caption and ‹ 3 / 9 › — a swipe sideways (or the arrows, or the arrow keys) for
 * the next or the one before, through all the photos once each; a swipe down, ×, a tap on the
 * veil or Escape closes it back into a tile. With more photos than the heart shows, every 3s one
 * tile turns over (rotateY 180°) to show one of the others — one at a time, never while the
 * lightbox is open or the heart is being tilted.
 *
 * Transform and opacity (and a filter for the shadows). Reduced motion, or a slow phone: no tilt,
 * turning or beat; the tiles fade in where they are; the lightbox simply fades.
 */

type Shown = Photo & { src: string };
/** A crop of a 3:4 photo: its left, top and width, as fractions of the photo; the height follows the tile's shape. */
type Crop = readonly [x: number, y: number, w: number];
/** What a tile shows: a photo (its place in the list) and, for the tile's own photo, the crop of it. */
type Shot = { photo: number; crop?: Crop };
type Card = { faces: [Shot, Shot | null]; turns: number };

/** The heart's height to its width (the gold frame's opening). */
const RATIO = 0.7582;
/** The perspective, and the smallest tile's lift (px). */
const PERSPECTIVE = 900;
const LIFT = 40;
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
  { box: [0, 0, 0.25, 0.3], photo: "/photos/gallery-1.webp", crop: [0, 0.02, 1] },
  { box: [0.25, 0, 0.5, 0.3], photo: "/photos/gallery-4.webp", crop: [0, 0, 1] },
  { box: [0.5, 0, 0.75, 0.14], photo: "/photos/gallery-1.webp", crop: [0.075, 0.075, 0.7] },
  { box: [0.5, 0.14, 0.75, 0.3], photo: "/photos/gallery-2.webp", crop: [0, 0.08, 1] },
  { box: [0.75, 0, 1, 0.3], photo: "/photos/gallery-6.webp", crop: [0, 0.05, 1] },
  { box: [0, 0.3, 0.3, 0.46], photo: "/photos/gallery-9.webp", crop: [0.05, 0.12, 0.9] },
  { box: [0, 0.46, 0.3, 0.62], photo: "/photos/gallery-5.webp", crop: [0.02, 0.07, 0.8] },
  { box: [0.3, 0.3, 0.7, 0.62], photo: "/photos/gallery-3.webp", crop: [0, 0.03, 1] },
  { box: [0.7, 0.3, 1, 0.46], photo: "/photos/gallery-8.webp", crop: [0.08, 0.25, 0.85] },
  { box: [0.7, 0.46, 1, 0.62], photo: "/photos/gallery-6.webp", crop: [0, 0.1, 1] },
  { box: [0.08, 0.62, 0.36, 0.78], photo: "/photos/gallery-7.webp", crop: [0, 0.12, 1] },
  { box: [0.36, 0.62, 0.64, 0.78], photo: "/photos/gallery-5.webp", crop: [0, 0.02, 1] },
  { box: [0.64, 0.62, 0.93, 0.78], photo: "/photos/gallery-7.webp", crop: [0.3, 0.15, 0.65] },
  { box: [0.26, 0.78, 0.77, 1], photo: "/photos/gallery-4.webp", crop: [0.2, 0.14, 0.75] },
];

/**
 * The gold frame's opening, in the heart's box (0–1 each way), 240 points round: traced from the
 * frame picture (rays out from the opening's middle, 2px under the gold band, lightly smoothed).
 */
const HEART = (
  "0.5057 0.2338,0.5097 0.2268,0.5140 0.2190,0.5190 0.2071,0.5245 0.1951,0.5305 0.1830," +
  "0.5369 0.1708,0.5439 0.1574,0.5514 0.1460,0.5596 0.1339,0.5680 0.1234,0.5772 0.1114," +
  "0.5870 0.0994,0.5969 0.0896,0.6073 0.0805,0.6182 0.0712,0.6294 0.0629,0.6413 0.0544," +
  "0.6536 0.0466,0.6665 0.0387,0.6794 0.0324,0.6934 0.0253,0.7074 0.0197,0.7220 0.0143," +
  "0.7366 0.0102,0.7524 0.0054,0.7676 0.0027,0.7832 0.0007,0.7987 0.0000,0.8144 0.0001," +
  "0.8293 0.0022,0.8444 0.0051,0.8589 0.0095,0.8731 0.0150,0.8864 0.0222,0.8994 0.0303," +
  "0.9110 0.0403,0.9221 0.0512,0.9324 0.0630,0.9418 0.0760,0.9505 0.0898,0.9587 0.1041," +
  "0.9658 0.1192,0.9723 0.1349,0.9782 0.1510,0.9831 0.1676,0.9874 0.1845,0.9912 0.2016," +
  "0.9939 0.2192,0.9961 0.2368,0.9978 0.2545,0.9988 0.2722,0.9994 0.2900,1.0000 0.3076," +
  "0.9996 0.3252,0.9985 0.3428,0.9975 0.3602,0.9959 0.3775,0.9938 0.3947,0.9911 0.4117," +
  "0.9884 0.4284,0.9846 0.4449,0.9824 0.4615,0.9808 0.4780,0.9784 0.4942,0.9756 0.5102," +
  "0.9729 0.5261,0.9675 0.5413,0.9604 0.5559,0.9537 0.5702,0.9462 0.5841,0.9380 0.5973," +
  "0.9299 0.6103,0.9219 0.6228,0.9131 0.6347,0.9044 0.6463,0.8952 0.6572,0.8860 0.6677," +
  "0.8769 0.6780,0.8675 0.6876,0.8585 0.6972,0.8498 0.7068,0.8411 0.7160,0.8319 0.7244," +
  "0.8233 0.7330,0.8143 0.7410,0.8053 0.7488,0.7963 0.7562,0.7877 0.7637,0.7790 0.7709," +
  "0.7705 0.7782,0.7621 0.7853,0.7537 0.7923,0.7455 0.7994,0.7373 0.8064,0.7291 0.8131," +
  "0.7209 0.8199,0.7127 0.8265,0.7045 0.8331,0.6964 0.8398,0.6882 0.8464,0.6802 0.8534," +
  "0.6720 0.8602,0.6638 0.8669,0.6557 0.8742,0.6475 0.8816,0.6391 0.8886,0.6307 0.8961," +
  "0.6223 0.9036,0.6135 0.9107,0.6048 0.9188,0.5958 0.9267,0.5868 0.9354,0.5776 0.9454," +
  "0.5683 0.9556,0.5586 0.9655,0.5486 0.9768,0.5383 0.9889,0.5276 0.9975,0.5166 1.0000," +
  "0.5056 0.9979,0.4947 0.9915,0.4840 0.9785,0.4737 0.9658,0.4637 0.9551,0.4542 0.9445," +
  "0.4449 0.9345,0.4356 0.9269,0.4266 0.9184,0.4178 0.9107,0.4091 0.9034,0.4007 0.8956," +
  "0.3925 0.8876,0.3844 0.8797,0.3765 0.8717,0.3685 0.8648,0.3606 0.8577,0.3526 0.8512," +
  "0.3446 0.8449,0.3367 0.8384,0.3291 0.8314,0.3213 0.8249,0.3134 0.8185,0.3056 0.8120," +
  "0.2977 0.8055,0.2891 0.8002,0.2807 0.7943,0.2727 0.7878,0.2645 0.7812,0.2562 0.7747," +
  "0.2483 0.7675,0.2404 0.7601,0.2322 0.7528,0.2237 0.7457,0.2157 0.7378,0.2072 0.7301," +
  "0.1985 0.7224,0.1897 0.7145,0.1805 0.7065,0.1709 0.6986,0.1617 0.6899,0.1522 0.6812," +
  "0.1430 0.6718,0.1343 0.6617,0.1250 0.6517,0.1157 0.6411,0.1068 0.6300,0.0980 0.6185," +
  "0.0893 0.6066,0.0809 0.5941,0.0744 0.5807,0.0663 0.5673,0.0587 0.5535,0.0517 0.5392," +
  "0.0453 0.5244,0.0377 0.5096,0.0324 0.4939,0.0270 0.4780,0.0221 0.4618,0.0178 0.4452," +
  "0.0141 0.4284,0.0102 0.4113,0.0077 0.3940,0.0049 0.3765,0.0028 0.3587,0.0011 0.3409," +
  "0.0006 0.3230,0.0000 0.3049,0.0001 0.2868,0.0008 0.2687,0.0019 0.2505,0.0036 0.2325," +
  "0.0063 0.2147,0.0095 0.1970,0.0137 0.1797,0.0186 0.1627,0.0244 0.1463,0.0308 0.1303," +
  "0.0385 0.1150,0.0471 0.1007,0.0553 0.0861,0.0644 0.0724,0.0747 0.0601,0.0851 0.0479," +
  "0.0957 0.0365,0.1082 0.0271,0.1215 0.0192,0.1349 0.0121,0.1495 0.0069,0.1647 0.0033," +
  "0.1804 0.0010,0.1964 0.0003,0.2121 0.0002,0.2280 0.0015,0.2440 0.0043,0.2596 0.0076," +
  "0.2749 0.0116,0.2902 0.0173,0.3051 0.0235,0.3193 0.0297,0.3334 0.0374,0.3468 0.0451," +
  "0.3598 0.0535,0.3721 0.0619,0.3843 0.0718,0.3956 0.0810,0.4066 0.0916,0.4169 0.1015," +
  "0.4276 0.1156,0.4371 0.1277,0.4463 0.1412,0.4548 0.1540,0.4632 0.1709,0.4702 0.1837," +
  "0.4769 0.1964,0.4830 0.2099,0.4886 0.2233,0.4932 0.2311,0.4975 0.2360,0.5016 0.2381"
)
  .split(",")
  .map((p) => p.split(" ").map(Number));
/** The frame picture round the opening: its place and size, as % of the heart's box. */
const FRAME = { left: "-6.35%", top: "-7.98%", width: "112.98%", height: "121.70%" };
/** The heart as an SVG path in a 100 × 75.82 box, for the gold mount behind the tiles. */
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

/**
 * A tile's place and depth, as CSS variables. Its lift (`--z`) would carry it out from the middle
 * and enlarge it in the perspective, so at rest it is drawn back (`--dx`, `--dy`) and scaled down
 * (`--s`) to sit exactly in its place; tilted, the lift shows as parallax.
 */
function tileStyle(g: Geometry, flat: boolean): CSSProperties {
  const z = flat ? 0 : LIFT * (1 - (g.size - SMALLEST) / (LARGEST - SMALLEST));
  const k = z / PERSPECTIVE;
  return {
    left: pct(g.x0),
    top: pct(g.y0),
    width: pct(g.w),
    height: pct(g.h),
    "--dx": pct(-((g.cx - 0.5) / g.w) * k),
    "--dy": pct(-((g.cy - 0.5) / g.h) * k),
    "--z": `${z.toFixed(1)}px`,
    "--s": (1 - k).toFixed(4),
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
  const [tapped, setTapped] = useState(false);
  // the lightbox: the photo shown (its place in the list), the tile it opened from, and where that was
  const [viewing, setViewing] = useState<{ photo: number; tile: number; from: DOMRect } | null>(null);
  // an iPhone's gyroscope, once allowed
  const [motion, setMotion] = useState(false);
  const [cards, setCards] = useState<Card[]>(() =>
    TILES.map((t, i) => {
      const k = photos.findIndex((p) => p.src === t.photo);
      return { faces: [k >= 0 ? { photo: k, crop: t.crop } : { photo: i % Math.max(n, 1) }, null], turns: 0 };
    }),
  );
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const viewingRef = useRef(viewing);
  viewingRef.current = viewing;
  const visible = useRef(false);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  // when a drag ended: the click that follows it is not a tap
  const dragged = useRef(0);
  const asked = useRef(false);
  const gyro = useRef(0);
  const lastFlip = useRef(-1);

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

  // the tilt: eased toward its aim each frame, written straight to the tilting layer (level while
  // the lightbox is open)
  const tilt = useRef({ x: 0, y: 0, tx: 0, ty: 0, raf: 0, moved: 0 });
  const aim = useCallback((x: number, y: number) => {
    const t = tilt.current;
    const clamp = (v: number) => Math.max(-TILT, Math.min(TILT, v));
    const [tx, ty] = viewingRef.current == null ? [clamp(x), clamp(y)] : [0, 0];
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

  // on screen? (for the gyroscope and the turning)
  useEffect(() => {
    const el = heartRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0.3 });
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

  // every 3s, one tile turns over to show a photo not shown — not while the lightbox is open or tilting
  const flip = useCallback(async () => {
    const cs = cardsRef.current;
    const showing = new Set(cs.map((c) => face(c).photo));
    const pool = photos.map((_, k) => k).filter((k) => !showing.has(k));
    const tiles = cs.map((_, i) => i).filter((i) => i !== lastFlip.current);
    if (!pool.length || !tiles.length) return;
    const i = tiles[Math.floor(Math.random() * tiles.length)];
    const p = pool[Math.floor(Math.random() * pool.length)];
    lastFlip.current = i;
    await ready(photos[p].thumb ?? photos[p].src);
    if (viewingRef.current) return;
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
      if (!visible.current || document.hidden || viewingRef.current || drag.current) return;
      if (Date.now() - tilt.current.moved < 1500) return;
      void flip();
    }, FLIP_MS);
    return () => clearInterval(id);
  }, [plain, phase, flippable, flip]);

  // the pointer: the mouse tilts the heart toward it; a drag turns it (without a gyroscope)
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (d && (Math.abs(e.clientX - d.x) > 8 || Math.abs(e.clientY - d.y) > 8)) d.moved = true;
    if (plain || phase !== "done" || viewingRef.current) return;
    if (e.pointerType === "mouse") {
      const r = heartRef.current!.getBoundingClientRect();
      aim(((e.clientY - r.top) / r.height - 0.5) * 2 * TILT, -((e.clientX - r.left) / r.width - 0.5) * 2 * TILT);
    } else if (d && Date.now() - gyro.current > 1000) aim(-(e.clientY - d.y) * 0.1, (e.clientX - d.x) * 0.1);
  };
  const onPointerUp = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (e.pointerType !== "mouse" && Date.now() - gyro.current > 1000) aim(0, 0);
    if (d.moved) dragged.current = Date.now();
  };
  const onPointerCancel = (e: PointerEvent) => {
    drag.current = null;
    if (e.pointerType !== "mouse" && Date.now() - gyro.current > 1000) aim(0, 0);
  };

  /** A tile's photo, where it is on screen now. */
  const tileRect = (i: number) => tileRefs.current[i]?.querySelector(".hc-side")?.getBoundingClientRect() ?? null;
  // a tap: the lightbox, growing out of the tile
  const onTile = (i: number) => {
    if (Date.now() - dragged.current < 450) return;
    askMotion();
    if (phase !== "done" || viewingRef.current) return;
    const from = tileRect(i);
    if (!from) return;
    setTapped(true);
    viewingRef.current = { photo: face(cardsRef.current[i]).photo, tile: i, from };
    aim(0, 0);
    setViewing(viewingRef.current);
  };
  // closing: back into the tile it opened from, if it shows this photo, else the first that does
  const closeOnto = (photo: number) => {
    const v = viewingRef.current;
    const order = v ? [v.tile, ...TILES.map((_, i) => i)] : TILES.map((_, i) => i);
    const i = order.find((k) => face(cardsRef.current[k]).photo === photo);
    return i == null ? null : tileRect(i);
  };

  if (!n) return null;

  return (
    <section id="gallery" ref={sectionRef} aria-labelledby="gallery-heading" className="relative overflow-x-clip px-[var(--gutter)] pb-4 pt-[var(--section-gap)]">
      <SectionHeading id="gallery-heading" eyebrow={gallery.eyebrow} title={gallery.title} intro={`“${gallery.intro}”`} show={seen} />

      <div className="hc-wrap">
        <div
          ref={heartRef}
          className="hc"
          data-phase={phase}
          data-plain={plain || undefined}
          data-viewing={viewing ? "" : undefined}
          role="group"
          aria-label={`${gallery.title}: ${TILES.length} photos in a heart. Tap one to see it larger.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={(e) => e.pointerType === "mouse" && aim(0, 0)}
        >
          <div className="hc-beat">
            <div ref={tiltRef} className="hc-tilt">
              {/* the gilded mount: the gaps between the tiles, and a rim round the heart as thin as they are */}
              <svg className="hc-mount" viewBox={`0 0 100 ${(100 * RATIO).toFixed(2)}`} preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="hc-gold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#d9bd82" />
                    <stop offset="0.45" stopColor="#b89554" />
                    <stop offset="0.7" stopColor="#cdaa68" />
                    <stop offset="1" stopColor="#9c7a3e" />
                  </linearGradient>
                </defs>
                <path d={HEART_PATH} />
              </svg>
              {/* the polished gold heart frame, over the photos' edge (lifted above every tile) */}
              <img aria-hidden className="hc-frame" src={gallery.heartFrame} alt="" draggable={false} style={FRAME} />
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
                    aria-label={`Open the photo: ${p.caption ?? p.alt}`}
                    onClick={() => onTile(i)}
                  >
                    <span className="hc-clip" style={{ clipPath: g.clip }}>
                      <span className="hc-card" style={card.turns ? { transform: `rotateY(${card.turns * 180}deg)` } : undefined}>
                        {card.faces.map((shot, f) => {
                          if (!shot) return null;
                          const ph = photos[shot.photo];
                          return (
                            <span key={f} className="hc-side" data-back={f === 1 || undefined}>
                              <img
                                className="hc-img"
                                src={ph.thumb ?? ph.src}
                                alt=""
                                width={484}
                                height={648}
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                                style={shotStyle(g, shot, ph)}
                              />
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
        </div>
        <p className="hc-hint" data-shown={phase === "done" || undefined} data-gone={tapped || undefined} aria-hidden>
          {gallery.hint}
        </p>
      </div>

      {viewing && (
        <Lightbox
          photos={photos}
          index={viewing.photo}
          from={viewing.from}
          reduced={plain}
          onStep={(d) => setViewing((v) => v && { ...v, photo: (v.photo + d + n) % n })}
          target={closeOnto}
          onClosed={() => setViewing(null)}
        />
      )}
    </section>
  );
}

/**
 * The lightbox, on a night-blue veil: the whole photo grows out of its tile, with its caption and
 * ‹ 3 / 9 ›. A swipe sideways (the arrows, the arrow keys) turns to the next or the one before;
 * a swipe down — or ×, a tap on the veil, Escape — closes it back into a tile showing it. Focus
 * returns to the tile, and the page keeps its place.
 */
function Lightbox({
  photos,
  index,
  from,
  reduced,
  onStep,
  target,
  onClosed,
}: {
  photos: Shown[];
  index: number;
  from: DOMRect;
  reduced: boolean;
  onStep: (dir: 1 | -1) => void;
  target: (photo: number) => DOMRect | null;
  onClosed: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const [dir, setDir] = useState<1 | -1 | 0>(0);
  const closing = useRef(false);
  const touch = useRef<{ x: number; y: number; dy: number; mode: "" | "x" | "y" } | null>(null);
  // when a swipe ended: the click that follows it does not close
  const swiped = useRef(0);
  useScrollLock(true);
  const photo = photos[index];
  const n = photos.length;

  /** The transform that lays the photo over a tile: centred on it, as large as the tile shows it. */
  const onto = (rect: DOMRect | null) => {
    const el = frameRef.current;
    if (!el || !rect) return "scale(0.92)";
    // measured where it rests, without whatever drag or flight it is in
    const [t, tr] = [el.style.transform, el.style.transition];
    el.style.transition = "none";
    el.style.transform = "none";
    const to = el.getBoundingClientRect();
    el.style.transform = t;
    void el.offsetWidth;
    el.style.transition = tr;
    const s = Math.max(rect.width / to.width, rect.height / to.height);
    const x = rect.left + rect.width / 2 - (to.left + to.width / 2);
    const y = rect.top + rect.height / 2 - (to.top + to.height / 2);
    return `translate(${x}px, ${y}px) scale(${s})`;
  };

  // open: show the dialog, start the photo over its tile, then let it grow to full size
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const el = frameRef.current;
    const veil = veilRef.current;
    if (!dialog || !el || !veil) return;
    if (!dialog.open) dialog.showModal();
    el.style.transition = veil.style.transition = "none";
    el.style.opacity = veil.style.opacity = "0";
    if (!reduced) el.style.transform = onto(from);
    void el.offsetWidth;
    requestAnimationFrame(() => {
      el.style.transition = reduced ? "opacity 250ms linear" : "transform 480ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease-out";
      el.style.transform = "none";
      el.style.opacity = "1";
      veil.style.transition = reduced ? "opacity 250ms linear" : "opacity 360ms ease-out";
      veil.style.opacity = "1";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the next and the one before, loaded ahead
  useEffect(() => {
    if (n > 1) for (const k of [index + 1, index + n - 1]) void ready(photos[k % n].src);
  }, [index, n, photos]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const el = frameRef.current;
    const veil = veilRef.current;
    const dialog = dialogRef.current;
    const done = () => {
      const y = window.scrollY;
      dialog?.close();
      if (window.scrollY !== y) window.scrollTo({ top: y, behavior: "instant" });
      onClosed();
    };
    if (!el || !veil) return done();
    if (reduced) {
      el.style.transition = veil.style.transition = "opacity 220ms linear";
    } else {
      el.style.transition = "transform 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 260ms ease 140ms";
      el.style.transform = onto(target(index));
      veil.style.transition = "opacity 360ms ease";
    }
    el.style.opacity = veil.style.opacity = "0";
    window.setTimeout(done, reduced ? 230 : 410);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, onClosed, index]);

  const step = useCallback(
    (d: 1 | -1) => {
      if (n < 2 || closing.current) return;
      setDir(d);
      onStep(d);
    },
    [onStep, n],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  // a swipe here moves only the photo: no scroll and no fling (a tap during a fling only stops it,
  // so the ‹ › tapped just after a swipe would do nothing)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const hold = (e: TouchEvent) => e.preventDefault();
    dialog.addEventListener("touchmove", hold, { passive: false });
    return () => dialog.removeEventListener("touchmove", hold);
  }, []);

  // swipe sideways for the next, down to close (the photo follows the finger down, the veil thins)
  const down = (e: PointerEvent) => (touch.current = { x: e.clientX, y: e.clientY, dy: 0, mode: "" });
  const move = (e: PointerEvent) => {
    const t = touch.current;
    const el = frameRef.current;
    const veil = veilRef.current;
    if (!t || !el || !veil || closing.current) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (!t.mode) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      t.mode = Math.abs(dy) > Math.abs(dx) && dy > 0 ? "y" : "x";
    }
    if (t.mode === "y") t.dy = Math.max(0, dy);
    if (t.mode === "y" && !reduced) {
      el.style.transition = "none";
      el.style.transform = `translateY(${t.dy}px) scale(${1 - Math.min(0.12, t.dy / 1600)})`;
      veil.style.transition = "none";
      veil.style.opacity = String(Math.max(0.3, 1 - t.dy / 420));
    }
  };
  const up = (e: PointerEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t || !t.mode) return;
    swiped.current = Date.now();
    const dx = e.clientX - t.x;
    if (t.mode === "y") {
      if (t.dy > 90) close();
      else if (!closing.current) {
        const el = frameRef.current!;
        const veil = veilRef.current!;
        el.style.transition = "transform 260ms ease-out";
        el.style.transform = "none";
        veil.style.transition = "opacity 260ms ease-out";
        veil.style.opacity = "1";
      }
    } else if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Photo ${index + 1} of ${n}`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      className="hc-lb fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-transparent"
    >
      <div ref={veilRef} aria-hidden className="absolute inset-0 bg-navy-deep/[0.96]" />
      {/* a tap on the veil (not the photo or its controls) closes */}
      <figure
        className="hc-lb-stage"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => (touch.current = null)}
        onClick={(e) => e.target === e.currentTarget && Date.now() - swiped.current > 450 && close()}
      >
        <div ref={frameRef} className="hc-lb-frame">
          {/* turned to, the photo slides in from the side the swipe came from */}
          <div key={index} className="hc-lb-photo" data-dir={dir !== 0 && !reduced ? dir : undefined}>
            <img src={photo.thumb ?? photo.src} alt="" aria-hidden width={484} height={648} draggable={false} className="hc-lb-img" />
            <img
              src={photo.src}
              alt={photo.alt}
              width={484}
              height={648}
              draggable={false}
              className="hc-lb-img hc-lb-full"
              onLoad={(e) => (e.currentTarget.dataset.ready = "")}
            />
          </div>
        </div>
        <figcaption key={`c${index}`} className="hc-lb-caption">
          {photo.caption}
        </figcaption>
        {n > 1 && (
          <div className="hc-lb-nav">
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="hc-lb-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M14.5 5.5L8 12l6.5 6.5" />
              </svg>
            </button>
            <span aria-live="polite" className="hc-lb-count">
              {index + 1} / {n}
            </span>
            <button type="button" onClick={() => step(1)} aria-label="Next photo" className="hc-lb-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9.5 5.5L16 12l-6.5 6.5" />
              </svg>
            </button>
          </div>
        )}
      </figure>
      <button type="button" onClick={close} aria-label="Close" className="hc-lb-close" style={{ top: "calc(var(--status-bar, 0px) + 14px)" }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </dialog>
  );
}
