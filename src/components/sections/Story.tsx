import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type MutableRefObject } from "react";
import { wedding } from "@/config/wedding";
import type { StoryMoment } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useLang } from "@/lib/lang";
import { Icon } from "@/components/art/Icons";

/**
 * Section 04 — Our Story: "Two Paths, One Union".
 *
 * Two fine strokes — Mahadev's in muted Himalayan blue, Maa Parvati's in
 * antique gold — begin apart under the heading. Down the story they weave
 * around each other in a narrow lane between the chapters, which alternate
 * either side of it (each photograph in a pointed temple arch, its chapter
 * number, year, title and line beneath), drawing ever closer. Above the last
 * chapter — the wedding — they part, embrace its larger arch from either
 * side, and meet beneath it in a small infinity: one loop blue, one gold.
 *
 * The strokes draw with the scroll. Each chapter, once, as it arrives: the
 * photograph opens upward within its arch as the arch's gold edge draws
 * itself, then the chapter's words rise in. The infinity draws when the paths
 * have met. Transform, opacity and stroke-dashoffset only; reduced motion
 * shows it all, finished.
 */

/** The temple arch: gently pointed at the top, a straight base (on a 100 × 140 box). */
const ARCH = "M4 136V56C4 38 18 28 50 4C82 28 96 38 96 56V136Z";
/** How far the strands swing either side of the lane's middle (px), once they have come together. */
const SWING = 11;

const BLUE = "#536F89";
const GOLD = "#B69A67";

interface Geometry {
  w: number;
  h: number;
  blue: string;
  gold: string;
  /** the infinity, where the two paths meet */
  knot: { x: number; y: number };
}

export function Story() {
  const { story } = wedding;
  const hindi = useLang() === "hi";
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const finalArch = useRef<HTMLDivElement | null>(null);
  const blueRef = useRef<SVGPathElement>(null);
  const goldRef = useRef<SVGPathElement>(null);
  const headSeen = useInView(headRef, { threshold: 0.25 });
  const sectionSeen = useInView(sectionRef, { threshold: 0 });
  const [geo, setGeo] = useState<Geometry | null>(null);
  const [joined, setJoined] = useState(false);

  const t = hindi ? story.hindi : story;
  const chapters = story.moments.slice(0, -1);
  const finale = story.moments[story.moments.length - 1];

  // ── the two paths, laid out from the chapters' real places (again whenever they reflow) ──
  useLayoutEffect(() => {
    const list = listRef.current;
    const arch = finalArch.current;
    if (!list || !arch) return;
    const measure = () => {
      const w = list.offsetWidth;
      const h = list.offsetHeight;
      const cx = w / 2;
      // the final arch, in the list's coordinates
      let ax = 0;
      let ay = 0;
      for (let e: HTMLElement | null = arch; e && e !== list; e = e.offsetParent as HTMLElement | null) {
        ax += e.offsetLeft;
        ay += e.offsetTop;
      }
      const aw = arch.offsetWidth;
      const ah = arch.offsetHeight;
      const bottom = ay + ah;
      const laneEnd = ay - 30;

      // down the lane: apart at first (±44px), then weaving, the swing narrowing toward the end;
      // a whole number of turns, so they arrive with blue on the left and gold on the right
      const turns = Math.max(2, Math.round(laneEnd / 170));
      const k = (Math.PI * 2 * turns) / laneEnd;
      const lane = (side: -1 | 1) => {
        const pts: Array<[number, number]> = [];
        for (let y = 0; y <= laneEnd; y += 5) {
          const settle = Math.min(1, y / 70);
          const ease = settle * settle * (3 - 2 * settle);
          const amp = 44 + (SWING - 44) * ease - (SWING - 5) * (y / laneEnd) * ease;
          pts.push([cx + side * amp * Math.cos(k * y), y]);
        }
        return pts;
      };
      // around the final arch, 12px outside its outline, then under it to the knot
      const knot = { x: cx, y: bottom + 26 };
      const around = (side: -1 | 1) => {
        const X = (u: number) => ax + (u / 100) * aw; // arch units → px
        const Y = (v: number) => ay + (v / 140) * ah;
        const o = 12;
        const sx = (u: number) => (side < 0 ? X(u) : X(100 - u));
        const out = side * o; // outward: left for blue, right for gold
        const apexX = sx(50) + side * 6;
        const apexY = Y(4) - o;
        return (
          `C${(cx + side * 6).toFixed(1)} ${(laneEnd + 14).toFixed(1)} ${apexX.toFixed(1)} ${(apexY - 10).toFixed(1)} ${apexX.toFixed(1)} ${apexY.toFixed(1)}` +
          `C${(sx(18) + out).toFixed(1)} ${(Y(28) - o).toFixed(1)} ${(sx(4) + out).toFixed(1)} ${(Y(38) - o * 0.5).toFixed(1)} ${(sx(4) + out).toFixed(1)} ${Y(56).toFixed(1)}` +
          `L${(sx(4) + out).toFixed(1)} ${(bottom - 10).toFixed(1)}` +
          `C${(sx(4) + out).toFixed(1)} ${(bottom + 22).toFixed(1)} ${(knot.x + side * 34).toFixed(1)} ${knot.y.toFixed(1)} ${(knot.x + side * 22).toFixed(1)} ${knot.y.toFixed(1)}`
        );
      };
      const toD = (pts: Array<[number, number]>) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
      setGeo({ w, h, blue: toD(lane(-1)) + around(-1), gold: toD(lane(1)) + around(1), knot });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, []);

  // ── the paths draw with the scroll; the infinity once they have met ──
  useEffect(() => {
    const list = listRef.current;
    const strokes = [blueRef.current, goldRef.current];
    if (!list || !geo || strokes.some((s) => !s)) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = list.getBoundingClientRect();
      const p = reduced ? 1 : Math.min(1, Math.max(0, (window.innerHeight * 0.72 - r.top) / r.height));
      for (const s of strokes) if (s) s.style.strokeDashoffset = String(1 - p);
      if (p >= 0.985) setJoined(true);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [geo, reduced]);

  const headShown = reduced ? sectionSeen : headSeen;
  const fade = (show: boolean, delay: number): CSSProperties =>
    reduced
      ? { opacity: show ? 1 : 0, transition: "opacity 200ms linear" }
      : {
          opacity: show ? 1 : 0,
          transform: show ? "none" : "translateY(10px)",
          transition: `opacity 800ms ease-out ${delay}ms, transform 800ms ease-out ${delay}ms`,
        };

  return (
    <section
      id="story"
      ref={sectionRef}
      aria-labelledby="story-heading"
      lang={hindi ? "hi" : undefined}
      className="story relative px-[clamp(16px,5vw,24px)]"
      style={{ paddingTop: "calc(var(--status-bar) + 48px)" }}
      data-still={reduced || undefined}
    >
      <Backdrop />
      <ArchDefs />

      <div className="relative z-[1]">
        {/* ── the heading ── */}
        <header ref={headRef} className="story-head flex flex-col items-center text-center">
          <p
            className={`story-blue ${hindi ? "font-deva text-[14px]" : "font-sans text-[12px] font-medium uppercase tracking-[0.32em]"}`}
            style={fade(headShown, 0)}
          >
            {t.eyebrow}
          </p>
          <h2
            id="story-heading"
            className={`story-ink mt-3 max-w-full text-balance leading-[1.18] [font-size:clamp(26px,7.2vw,34px)] ${hindi ? "font-deva font-semibold" : "font-display font-semibold"}`}
            style={fade(headShown, 140)}
          >
            {t.title}
          </h2>
          <p
            className={`story-brown mt-2 max-w-[20rem] text-balance text-[16.5px] leading-snug ${hindi ? "font-deva" : "font-display font-medium italic"}`}
            style={fade(headShown, 280)}
          >
            {t.subtitle}
          </p>
          {/* a small divider in the two paths' colours, meeting at a lotus */}
          <span aria-hidden className="mt-4 flex items-center gap-2" style={fade(headShown, 420)}>
            <span className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${BLUE})` }} />
            <svg width="16" height="10" viewBox="0 0 24 14" fill="none" stroke={GOLD} strokeWidth="1.2" strokeLinejoin="round">
              <path d="M12 1.5c2 2 2.6 5 0 9c-2.6-4-2-7 0-9ZM12 10.5c-2-3-5-4.6-8.5-4.2c.6 3.4 4 5.4 8.5 4.2ZM12 10.5c2-3 5-4.6 8.5-4.2c-.6 3.4-4 5.4-8.5 4.2Z" />
            </svg>
            <span className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </span>
        </header>

        {/* ── the story: the two paths, the chapters either side of them, and the finale ── */}
        <div ref={listRef} className="story-list relative mt-6">
          {geo && (
            <svg
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-0 overflow-visible"
              width={geo.w}
              height={geo.h}
              viewBox={`0 0 ${geo.w} ${geo.h}`}
            >
              <path ref={blueRef} d={geo.blue} className="story-path" stroke={BLUE} pathLength={1} />
              <path ref={goldRef} d={geo.gold} className="story-path" stroke={GOLD} pathLength={1} />
              {/* where they begin, apart */}
              <circle cx={geo.w / 2 - 44} cy={0} r={2.4} fill={BLUE} />
              <circle cx={geo.w / 2 + 44} cy={0} r={2.4} fill={GOLD} />
              {/* where they meet: an infinity, one loop each */}
              <g className="story-knot" data-joined={joined || reduced || undefined} fill="none" strokeWidth="1.5" strokeLinecap="round">
                <path
                  pathLength={1}
                  stroke={BLUE}
                  d={`M${geo.knot.x - 22} ${geo.knot.y}C${geo.knot.x - 22} ${geo.knot.y - 12} ${geo.knot.x - 8} ${geo.knot.y - 12} ${geo.knot.x} ${geo.knot.y}C${geo.knot.x + 8} ${geo.knot.y + 12} ${geo.knot.x - 22} ${geo.knot.y + 12} ${geo.knot.x - 22} ${geo.knot.y}`}
                />
                <path
                  pathLength={1}
                  stroke={GOLD}
                  d={`M${geo.knot.x + 22} ${geo.knot.y}C${geo.knot.x + 22} ${geo.knot.y + 12} ${geo.knot.x + 8} ${geo.knot.y + 12} ${geo.knot.x} ${geo.knot.y}C${geo.knot.x - 8} ${geo.knot.y - 12} ${geo.knot.x + 22} ${geo.knot.y - 12} ${geo.knot.x + 22} ${geo.knot.y}`}
                />
                <circle className="story-knot-dot" cx={geo.knot.x} cy={geo.knot.y} r={2.2} fill={GOLD} stroke="none" />
              </g>
            </svg>
          )}

          <ol className="story-chapters relative z-[1]">
            {chapters.map((m, i) => (
              <Chapter key={m.title} moment={m} index={i} hindi={hindi} reduced={reduced} />
            ))}
          </ol>
          <Chapter moment={finale} index={chapters.length} hindi={hindi} reduced={reduced} finale archRef={finalArch} />
        </div>

        {/* ── on to the ceremonies ── */}
        <Onward />
      </div>
    </section>
  );
}

function Chapter({
  moment,
  index,
  hindi,
  reduced,
  finale = false,
  archRef,
}: {
  moment: StoryMoment;
  index: number;
  hindi: boolean;
  reduced: boolean;
  finale?: boolean;
  archRef?: MutableRefObject<HTMLDivElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { threshold: 0.3 });
  const show = seen || reduced;
  const title = hindi ? moment.hindi.title : moment.title;
  const line = hindi ? moment.hindi.line : moment.line;
  const word = (step: number): CSSProperties =>
    reduced
      ? {}
      : {
          opacity: show ? 1 : 0,
          transform: show ? "none" : "translateY(12px)",
          transition: `opacity 700ms cubic-bezier(.22,.61,.36,1) ${650 + step * 120}ms, transform 700ms cubic-bezier(.22,.61,.36,1) ${650 + step * 120}ms`,
        };
  const body = (
    <div ref={ref} className="story-chapter-body" data-shown={show || undefined}>
      {/* the photograph in its temple arch: it opens upward as the arch's gold edge draws itself */}
      <div ref={archRef} className="story-arch">
        <div className="story-arch-photo">
          {moment.photo.src ? (
            <img
              src={moment.photo.src}
              alt={moment.photo.alt}
              width={400}
              height={560}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="story-arch-img h-full w-full object-cover"
              style={{ objectPosition: moment.photo.focus ?? "50% 30%" }}
            />
          ) : (
            <div
              role="img"
              aria-label={`${moment.photo.alt} (photo to come)`}
              className="story-arch-img flex h-full w-full items-center justify-center"
              style={{ background: "radial-gradient(circle at 50% 70%, rgb(var(--sky) / 0.9), transparent 62%), rgb(var(--sky-pale))" }}
            >
              <Icon name="lotus" className="h-[24%] w-[24%] text-gold-ink/55" strokeWidth={1} />
            </div>
          )}
          <span aria-hidden className="story-arch-veil" />
        </div>
        <svg aria-hidden className="story-arch-line" viewBox="0 0 100 140" preserveAspectRatio="none">
          <path d={ARCH} fill="none" stroke="url(#story-arch-gold)" strokeWidth="1.3" vectorEffect="non-scaling-stroke" pathLength={1} />
        </svg>
      </div>

      {/* the chapter: its number and year, title, and one line */}
      <div className={finale ? "story-words mt-[50px]" : "story-words mt-3"}>
        <p className="story-label" style={word(0)}>
          <span className="story-blue">{String(index + 1).padStart(2, "0")}</span>
          <span aria-hidden className="story-label-rule" />
          <span className="story-gold">{moment.year}</span>
        </p>
        <h3
          className={`story-ink text-balance leading-tight ${finale ? "mt-1.5 text-[21px]" : "mt-1 text-[17px]"} ${hindi ? "font-deva font-semibold" : "font-display font-semibold"}`}
          style={word(1)}
        >
          {title}
        </h3>
        <p
          className={`story-brown mt-1.5 text-[13.5px] leading-snug ${finale ? "mx-auto max-w-[17rem]" : ""} ${hindi ? "font-deva" : "font-display font-medium italic"}`}
          style={word(2)}
        >
          {line}
        </p>
      </div>
    </div>
  );
  return finale ? <div className="story-finale">{body}</div> : <li className="story-chapter">{body}</li>;
}

/** The arch's clip (in the photo's own box, 0–1) and its antique-gold edge, defined once. */
function ArchDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <defs>
        <clipPath id="story-arch-clip" clipPathUnits="objectBoundingBox">
          <path d={ARCH} transform="scale(0.01 0.0071428571)" />
        </clipPath>
        <linearGradient id="story-arch-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9c08c" />
          <stop offset="0.5" stopColor={GOLD} />
          <stop offset="1" stopColor="#d9c08c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** The way on: a fine gold line and a double arrow, gliding to the ceremonies. */
function Onward() {
  const go = (e: MouseEvent) => {
    const next = document.getElementById("events");
    if (!next) return;
    e.preventDefault();
    next.scrollIntoView();
  };
  return (
    <div className="story-gold relative flex flex-col items-center pt-12">
      <span aria-hidden className="h-px w-16 bg-gradient-to-r from-transparent via-current to-transparent opacity-70" />
      <a href="#events" onClick={go} aria-label="On to the ceremonies" className="mt-2 flex h-11 w-11 items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7 6.5l5 5 5-5M7 12.5l5 5 5-5" />
        </svg>
      </a>
    </div>
  );
}

/** Behind it, on the site's Himalayan mist: only the faintest line of peaks at the foot. */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <svg className="story-peaks" viewBox="0 0 560 56" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path d="M0 55L46 38L70 44L104 24L124 32L150 18L176 32L214 16L240 26L266 8C272 4 276 2 280 2C284 2 288 4 294 8L320 26L346 16L384 32L410 18L436 32L456 24L490 44L514 38L560 55" />
        <path d="M280 10v10M272 14l-4 10M288 14l4 10M150 24l-3 8M410 24l3 8" opacity="0.7" />
      </svg>
    </div>
  );
}
