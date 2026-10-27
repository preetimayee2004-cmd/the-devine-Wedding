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
 * Fourteen photos of different sizes, the same thin ivory gap between all of them, together
 * make a heart inside a double gold heart line wreathed in eucalyptus (the couple's picture of it,
 * its white keyed away, the leaves recoloured a dusty Shiva blue): each tile is clipped to the inner
 * line's opening, traced from the picture; the frame lies behind them, so its leaves tuck behind the
 * photo heart and never hide a photo. Seen the first time, the tiles fly in from the edges (turned up to ±15°, 70ms apart, about 1.4s) and settle with a little spring;
 * then the heart beats now and then, barely (a soft double beat, 1 → 1.012, every 3.2s).
 *
 * In 3D: the heart sits in 900px of perspective, each tile lifted off it by its size (the largest
 * 0, the smallest 40px), and it tilts — up to ±8° — with the phone's gyroscope (an iPhone asks
 * on the first tap; until it is allowed, or if it is not, a sideways drag tilts it), or with the
 * mouse on a computer; the small tiles move more than the large. At rest each tile is drawn back
 * to its place, so the gaps stay even.
 *
 * A tap opens the photo in a lightbox: the whole photo, at its own shape, grows out of its tile onto
 * a night-blue veil, with its caption and ‹ 3 / 9 › — a swipe sideways (or the arrows, or the arrow
 * keys) for the next or the one before, through all the photos once each; a swipe down, ×, a tap on
 * the veil, Escape or the phone's back button closes it back into a tile, the page where it was.
 * With more photos than the heart shows, every 3s one
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

/** The heart's height to its width (the frame's opening). */
const RATIO = 0.8456;
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
  { box: [0.5, 0, 0.75, 0.14], photo: "/photos/gallery-1.webp", crop: [0.05, 0.03, 0.7] },
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
  { box: [0.26, 0.78, 0.77, 1], photo: "/photos/gallery-4.webp", crop: [0.15, 0.06, 0.75] },
];

/**
 * The frame's opening, in the heart's box (0–1 each way), 240 points round: traced from the frame
 * picture (rays out from the opening's middle to the inner gold line, 2px under it; where leaves
 * hide the line, drawn between the rays that see it, a little further in; lightly smoothed).
 */
const HEART = (
  "0.4923 0.2106,0.4976 0.2087,0.5032 0.2034,0.5092 0.1955,0.5159 0.1838,0.5234 0.1701," +
  "0.5317 0.1559,0.5407 0.1411,0.5506 0.1256,0.5612 0.1106,0.5724 0.0964,0.5842 0.0831," +
  "0.5967 0.0698,0.6097 0.0577,0.6233 0.0463,0.6374 0.0356,0.6518 0.0263,0.6663 0.0185," +
  "0.6810 0.0119,0.6957 0.0069,0.7103 0.0034,0.7248 0.0012,0.7394 0.0000,0.7535 0.0004," +
  "0.7677 0.0017,0.7816 0.0040,0.7954 0.0072,0.8088 0.0117,0.8220 0.0169,0.8349 0.0230," +
  "0.8475 0.0299,0.8591 0.0383,0.8711 0.0466,0.8827 0.0557,0.8937 0.0655,0.9044 0.0760," +
  "0.9152 0.0866,0.9245 0.0987,0.9335 0.1111,0.9418 0.1242,0.9495 0.1378,0.9568 0.1517," +
  "0.9637 0.1659,0.9700 0.1805,0.9756 0.1955,0.9809 0.2106,0.9856 0.2260,0.9893 0.2418," +
  "0.9926 0.2577,0.9956 0.2737,0.9976 0.2899,0.9989 0.3061,0.9999 0.3224,1.0000 0.3387," +
  "0.9994 0.3550,0.9983 0.3712,0.9966 0.3873,0.9941 0.4033,0.9910 0.4191,0.9870 0.4347," +
  "0.9824 0.4500,0.9771 0.4650,0.9715 0.4797,0.9650 0.4940,0.9586 0.5079,0.9506 0.5214," +
  "0.9423 0.5343,0.9334 0.5467,0.9255 0.5589,0.9159 0.5703,0.9071 0.5814,0.8983 0.5922," +
  "0.8894 0.6026,0.8795 0.6122,0.8713 0.6221,0.8622 0.6312,0.8532 0.6400,0.8442 0.6485," +
  "0.8352 0.6566,0.8263 0.6645,0.8190 0.6731,0.8123 0.6820,0.8051 0.6903,0.7982 0.6987," +
  "0.7907 0.7064,0.7828 0.7136,0.7744 0.7202,0.7667 0.7272,0.7589 0.7339,0.7516 0.7411," +
  "0.7441 0.7478,0.7369 0.7548,0.7300 0.7622,0.7234 0.7701,0.7165 0.7775,0.7100 0.7856," +
  "0.7033 0.7935,0.6964 0.8012,0.6893 0.8088,0.6820 0.8161,0.6745 0.8232,0.6668 0.8302," +
  "0.6589 0.8369,0.6513 0.8444,0.6432 0.8509,0.6351 0.8579,0.6271 0.8654,0.6190 0.8734," +
  "0.6105 0.8804,0.6023 0.8894,0.5940 0.8989,0.5854 0.9090,0.5766 0.9195,0.5676 0.9309," +
  "0.5582 0.9420,0.5483 0.9529,0.5380 0.9647,0.5274 0.9773,0.5162 0.9897,0.5044 0.9972," +
  "0.4923 1.0000,0.4802 0.9969,0.4684 0.9878,0.4573 0.9751,0.4467 0.9632,0.4364 0.9522," +
  "0.4264 0.9419,0.4167 0.9325,0.4073 0.9228,0.3981 0.9140,0.3894 0.9041,0.3810 0.8943," +
  "0.3729 0.8845,0.3651 0.8747,0.3579 0.8639,0.3504 0.8551,0.3428 0.8471,0.3356 0.8385," +
  "0.3283 0.8305,0.3211 0.8229,0.3141 0.8148,0.3076 0.8064,0.3002 0.7998,0.2926 0.7936," +
  "0.2850 0.7874,0.2774 0.7811,0.2701 0.7744,0.2631 0.7673,0.2555 0.7610,0.2482 0.7541," +
  "0.2409 0.7473,0.2329 0.7411,0.2256 0.7339,0.2190 0.7260,0.2117 0.7186,0.2042 0.7114," +
  "0.1966 0.7040,0.1876 0.6976,0.1792 0.6905,0.1708 0.6829,0.1631 0.6748,0.1550 0.6665," +
  "0.1476 0.6577,0.1392 0.6491,0.1306 0.6404,0.1211 0.6318,0.1118 0.6227,0.1027 0.6131," +
  "0.0937 0.6031,0.0849 0.5927,0.0764 0.5818,0.0680 0.5705,0.0598 0.5587,0.0519 0.5465," +
  "0.0442 0.5339,0.0367 0.5209,0.0286 0.5076,0.0219 0.4938,0.0147 0.4796,0.0095 0.4649," +
  "0.0054 0.4500,0.0034 0.4348,0.0014 0.4196,0.0012 0.4043,0.0005 0.3889,0.0001 0.3734," +
  "0.0000 0.3578,0.0003 0.3422,0.0009 0.3265,0.0019 0.3108,0.0033 0.2950,0.0050 0.2793," +
  "0.0071 0.2636,0.0096 0.2478,0.0124 0.2321,0.0156 0.2165,0.0191 0.2008,0.0221 0.1848," +
  "0.0271 0.1697,0.0332 0.1552,0.0402 0.1413,0.0482 0.1282,0.0580 0.1165,0.0672 0.1045," +
  "0.0767 0.0929,0.0863 0.0816,0.0954 0.0699,0.1063 0.0601,0.1165 0.0498,0.1273 0.0404," +
  "0.1388 0.0320,0.1517 0.0255,0.1633 0.0179,0.1771 0.0136,0.1911 0.0102,0.2053 0.0077," +
  "0.2195 0.0060,0.2335 0.0047,0.2471 0.0035,0.2608 0.0033,0.2748 0.0045,0.2889 0.0069," +
  "0.3034 0.0116,0.3181 0.0182,0.3325 0.0256,0.3466 0.0341,0.3604 0.0438,0.3741 0.0555," +
  "0.3871 0.0672,0.3996 0.0800,0.4115 0.0936,0.4228 0.1077,0.4333 0.1219,0.4432 0.1367," +
  "0.4523 0.1517,0.4607 0.1662,0.4683 0.1799,0.4751 0.1918,0.4812 0.2009,0.4869 0.2076"
)
  .split(",")
  .map((p) => p.split(" ").map(Number));
/** The frame picture round the opening: its place and size, as % of the heart's box. */
const FRAME = { left: "-11.32%", top: "-25.06%", width: "116.31%", height: "129.36%" };
/** The heart as an SVG path in a 100 × 84.56 box, for the gold mount behind the tiles. */
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
              {/* the ivory mount: the gaps between the tiles, and a rim round the heart as thin as they are */}
              <svg className="hc-mount" viewBox={`0 0 100 ${(100 * RATIO).toFixed(2)}`} preserveAspectRatio="none" aria-hidden>
                <defs>
                  {/* warm ivory, a breath deeper toward the foot */}
                  <linearGradient id="hc-ivory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fffaf0" />
                    <stop offset="1" stopColor="#f6ead3" />
                  </linearGradient>
                </defs>
                <path d={HEART_PATH} />
              </svg>
              {/* the gold heart line and its eucalyptus, behind the photos (the leaves tuck behind the heart) */}
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
          {/* until the first tap: a hand tapping gently on the big photo in the middle (on its lower
              corner, clear of the faces) — "tap a photo"; taps pass through it to the photo */}
          <span aria-hidden className="hc-hand" data-shown={phase === "done" || undefined} data-gone={tapped || undefined}>
            <span className="hc-hand-ring" />
            <svg viewBox="0 0 44 54" fill="#fffaf0" stroke="#7d5a22" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
              <path d="M17 6.5a3.5 3.5 0 0 1 7 0V21a3.2 3.2 0 0 1 6 1.4a3.2 3.2 0 0 1 5.6 2a3 3 0 0 1 4.4 2.6V36c0 7-5.6 12.6-12.6 12.6h-3c-3.6 0-7-1.7-9.2-4.6l-7.6-10.2a3.2 3.2 0 0 1 5-4L17 31Z" />
              <path d="M24 21v7M30 22.4v6.6M35.6 24.4v6" fill="none" />
            </svg>
          </span>
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
 * The lightbox, on a night-blue veil: the whole photo, at its own shape (portrait or landscape, as
 * large as the screen allows between × and the caption), grows out of its tile, with its caption and
 * ‹ 3 / 9 ›. A swipe sideways (the arrows, the arrow keys) turns to the next or the one before — one
 * turn at a time; a swipe down — or ×, a tap on the veil, Escape, the phone's back button — closes it
 * back into a tile showing it. Focus returns to the tile, and the page keeps its place.
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
  // each photo's shape (width / height), once its small copy has loaded; 3:4 until then
  const [shapes, setShapes] = useState<Record<number, number>>({});
  // the last turn, so quick taps turn one photo at a time
  const lastStep = useRef(0);
  // the phone's back button: a history entry while the photo is open, so back closes it
  const pushed = useRef(false);
  const popped = useRef(false);
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
      el.style.transition = reduced ? "opacity 250ms linear" : "transform 380ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease-out";
      el.style.transform = "none";
      el.style.opacity = "1";
      veil.style.transition = reduced ? "opacity 250ms linear" : "opacity 300ms ease-out";
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
      // closed here (not by the back button): take back the history entry made on opening
      if (!popped.current && (history.state as { hcPhoto?: boolean } | null)?.hcPhoto) history.back();
      onClosed();
    };
    if (!el || !veil) return done();
    if (reduced) {
      el.style.transition = veil.style.transition = "opacity 220ms linear";
    } else {
      el.style.transition = "transform 340ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease 120ms";
      el.style.transform = onto(target(index));
      veil.style.transition = "opacity 300ms ease";
    }
    el.style.opacity = veil.style.opacity = "0";
    window.setTimeout(done, reduced ? 230 : 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, onClosed, index]);

  // the phone's back button closes the photo, rather than leaving the page
  useEffect(() => {
    if (!pushed.current) {
      history.pushState({ ...((history.state as object | null) ?? {}), hcPhoto: true }, "");
      pushed.current = true;
    }
    const onPop = () => {
      popped.current = true;
      close();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [close]);

  const step = useCallback(
    (d: 1 | -1) => {
      // one turn at a time: quick taps don't pile up
      if (n < 2 || closing.current || Date.now() - lastStep.current < 280) return;
      lastStep.current = Date.now();
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
      <div ref={veilRef} aria-hidden className="absolute inset-0 bg-navy-deep/[0.985]" />
      {/* a tap on the veil (not the photo or its controls) closes */}
      <figure
        className="hc-lb-stage"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => (touch.current = null)}
        onClick={(e) => e.target === e.currentTarget && Date.now() - swiped.current > 450 && close()}
      >
        <div ref={frameRef} className="hc-lb-frame" style={{ "--ar": shapes[index] ?? 0.75 } as CSSProperties}>
          {/* turned to, the photo slides in from the side the swipe came from */}
          <div key={index} className="hc-lb-photo" data-dir={dir !== 0 && !reduced ? dir : undefined}>
            <img
              src={photo.thumb ?? photo.src}
              alt=""
              aria-hidden
              width={484}
              height={648}
              draggable={false}
              className="hc-lb-img"
              onLoad={(e) => {
                const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                if (w && h) setShapes((s) => (s[index] ? s : { ...s, [index]: w / h }));
              }}
            />
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
      <button type="button" onClick={close} aria-label="Close the photo" className="hc-lb-close">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </dialog>
  );
}
