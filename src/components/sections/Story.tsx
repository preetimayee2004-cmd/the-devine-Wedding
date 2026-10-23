import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { wedding } from "@/config/wedding";
import type { StoryMoment } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useLang } from "@/lib/lang";
import { Icon } from "@/components/art/Icons";

/**
 * Section 04 — "A Love Written in the Stars".
 *
 * A soft Himalayan mist that warms into ivory, the faintest line of peaks at
 * the foot, and four milestones: each a warm ivory card with a fine gold
 * edge, its photo in a gently pointed temple arch, then the year, the title
 * and one line. On a phone the cards are staggered left and right on either
 * side of one continuous, gently curving gold line, a small gold lotus on it
 * beside each card; from 768px they stand in a row with the line curving
 * beneath them through the four lotuses. The line never crosses a photo or a
 * word.
 *
 * As the guest scrolls, the line draws itself and each lotus turns gold as it
 * is reached; each card fades up with its photo easing back from a slight
 * zoom, then its year, title and line follow. Only transform and opacity move
 * (and the line's dash). Reduced motion: everything as finished, in a 200ms
 * fade.
 */

const N = 4;
const EASE_CARD = "cubic-bezier(.22,.61,.36,1)";

interface Point {
  x: number;
  y: number;
}
interface Geometry {
  w: number;
  h: number;
  d: string;
  marks: Point[];
  /** how far along the line (0–1) each lotus sits */
  at: number[];
  row: boolean;
}

export function Story() {
  const { story } = wedding;
  const hindi = useLang() === "hi";
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cards = useRef<Array<HTMLElement | null>>([]);
  const lineRef = useRef<SVGPathElement>(null);
  const markRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const headSeen = useInView(headRef, { threshold: 0.25 });
  const sectionSeen = useInView(sectionRef, { threshold: 0 });
  const [geo, setGeo] = useState<Geometry | null>(null);
  const [shown, setShown] = useState<boolean[]>(() => Array(N).fill(false));

  const t = hindi ? story.hindi : story;

  // ── the line is laid out from the cards' real places, and again whenever they reflow ──
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const w = list.offsetWidth;
      const h = list.offsetHeight;
      const boxes = cards.current.filter((c): c is HTMLElement => c !== null);
      if (boxes.length !== N) return;
      const row = window.matchMedia("(min-width: 768px)").matches;
      // the photo's middle in each card (its arch is 100:140, inside 8px of card)
      const photoMid = (b: HTMLElement) => b.offsetTop + 8 + ((b.offsetWidth - 16) * 1.4) / 2;
      let marks: Point[];
      let pts: Point[];
      let d: string;
      if (row) {
        // under the row: a gentle curve through a lotus under each card
        const below = Math.max(...boxes.map((b) => b.offsetTop + b.offsetHeight)) + 30;
        marks = boxes.map((b, i) => ({ x: b.offsetLeft + b.offsetWidth / 2, y: below + (i === 1 || i === 2 ? 12 : 0) }));
        pts = marks;
        d = `M${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i], k = (b.x - a.x) / 2;
          d += `C${a.x + k} ${a.y} ${b.x - k} ${b.y} ${b.x} ${b.y}`;
        }
      } else {
        // down the middle, in the lane between the left and right cards: one continuous line,
        // swaying very gently from side to side, a lotus on it beside each card's photo
        const cx = w / 2;
        marks = boxes.map((b) => ({ x: cx, y: photoMid(b) }));
        pts = [{ x: cx, y: 0 }, ...marks, { x: cx, y: h + 36 }];
        d = `M${cx} 0`;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i];
          d += `Q${cx + (i % 2 ? 7 : -7)} ${(a.y + b.y) / 2} ${b.x} ${b.y}`;
        }
      }
      // where each lotus falls along the line (the line is nearly straight between them)
      const lengths = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
      const total = lengths.reduce((s, l) => s + l, 0) || 1;
      let run = 0;
      const along = [0, ...lengths.map((l) => (run += l) / total)];
      setGeo({ w, h, d, marks, at: marks.map((m) => along[pts.indexOf(m)]), row });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, []);

  // ── the line draws with the scroll; each lotus turns gold as the line reaches it ──
  useEffect(() => {
    const line = lineRef.current;
    const list = listRef.current;
    if (!line || !list || !geo) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = list.getBoundingClientRect();
      const vh = window.innerHeight;
      let p: number;
      if (reduced) p = 1;
      else if (geo.row) {
        // the row's line draws as it rises from the lower part of the screen to the middle
        const y = r.top + geo.marks[0].y;
        p = (vh * 0.9 - y) / (vh * 0.4);
      } else {
        // down the cards, a little ahead of the reader
        p = (vh * 0.72 - r.top) / (r.height + 36);
      }
      p = Math.min(1, Math.max(0, p));
      line.style.strokeDashoffset = String(1 - p);
      geo.at.forEach((a, i) => {
        const el = markRefs.current[i];
        if (el) el.toggleAttribute("data-lit", p >= a - 0.005);
      });
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

  // ── each card reveals as it comes into view, once ──
  useEffect(() => {
    const els = cards.current.filter((c): c is HTMLElement => c !== null);
    if (!("IntersectionObserver" in window)) {
      setShown(Array(N).fill(true));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const now = entries.filter((e) => e.isIntersecting).map((e) => els.indexOf(e.target as HTMLElement));
        if (!now.length) return;
        now.forEach((i) => io.unobserve(els[i]));
        setShown((s) => s.map((v, i) => v || now.includes(i)));
      },
      { threshold: 0.25 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const headShown = reduced ? sectionSeen : headSeen;
  const fade = (show: boolean, delay: number): CSSProperties =>
    reduced
      ? { opacity: show ? 1 : 0, transition: "opacity 200ms linear" }
      : {
          opacity: show ? 1 : 0,
          transform: show ? "none" : "translateY(10px)",
          transition: `opacity 800ms ${EASE_CARD} ${delay}ms, transform 800ms ${EASE_CARD} ${delay}ms`,
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
            className={`story-gold ${hindi ? "font-deva text-[14px]" : "font-sans text-[12px] font-medium uppercase tracking-[0.3em]"}`}
            style={fade(headShown, 0)}
          >
            <span aria-hidden className="mr-2 text-[10px]">✦</span>
            {t.eyebrow}
            <span aria-hidden className="ml-2 text-[10px]">✦</span>
          </p>
          <h2
            id="story-heading"
            className={`story-blue mt-3 max-w-full text-balance leading-[1.18] [font-size:clamp(26px,7.2vw,34px)] ${hindi ? "font-deva font-semibold" : "font-display font-semibold"}`}
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
          <span aria-hidden className="story-gold mt-3.5 block" style={fade(headShown, 420)}>
            <Flourish />
          </span>
        </header>

        {/* ── the four milestones and their line ── */}
        <div ref={listRef} className="relative mt-9">
          {geo && (
            <svg
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-0 overflow-visible"
              width={geo.w}
              height={geo.h}
              viewBox={`0 0 ${geo.w} ${geo.h}`}
            >
              <defs>
                <mask id="story-draw" maskUnits="userSpaceOnUse" x={-20} y={-20} width={geo.w + 40} height={geo.h + 100}>
                  <path
                    ref={lineRef}
                    d={geo.d}
                    fill="none"
                    stroke="#fff"
                    strokeWidth="10"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="1 1"
                    strokeDashoffset="1"
                  />
                </mask>
                <linearGradient id="story-line-gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#c9a25a" />
                  <stop offset="1" stopColor="#a8741f" />
                </linearGradient>
              </defs>
              <path d={geo.d} mask="url(#story-draw)" className={geo.row ? "story-line story-line-dots" : "story-line"} />
            </svg>
          )}

          {/* a small gold lotus on the line beside each card */}
          {geo?.marks.map((m, i) => (
            <span
              key={i}
              ref={(el) => {
                markRefs.current[i] = el;
              }}
              aria-hidden
              className="story-mark"
              style={{ left: m.x, top: m.y }}
            >
              <svg viewBox="0 0 24 18" width="20" height="15">
                <path
                  fill="currentColor"
                  d="M12 1c2.3 2.4 3.2 5.2 2.6 8.3c-.4 2-1.3 3.6-2.6 5c-1.3-1.4-2.2-3-2.6-5C8.8 6.2 9.7 3.4 12 1Zm-6.6 5.2c2.6.4 4.4 2 5.3 4.6c.5 1.4.6 2.8.3 4.1c-2.3-.3-4-1.6-5-3.6c-.7-1.6-.9-3.3-.6-5.1Zm13.2 0c.3 1.8.1 3.5-.6 5.1c-1 2-2.7 3.3-5 3.6c-.3-1.3-.2-2.7.3-4.1c.9-2.6 2.7-4.2 5.3-4.6ZM2 12.6c2.2-.4 4.2.1 5.8 1.6c-1.7 1.2-3.7 1.6-5.8 1Zm20 0c0 .9 0 1.7 0 2.6c-2.1.6-4.1.2-5.8-1c1.6-1.5 3.6-2 5.8-1.6Z"
                />
              </svg>
            </span>
          ))}

          <ol className="story-cards relative z-[1]">
            {story.moments.map((m, i) => (
              <Milestone
                key={m.title}
                moment={m}
                index={i}
                hindi={hindi}
                show={reduced ? sectionSeen : shown[i]}
                reduced={reduced}
                cardRef={(el) => {
                  cards.current[i] = el;
                }}
              />
            ))}
          </ol>
        </div>

        {/* ── on to the ceremonies ── */}
        <Onward />
      </div>
    </section>
  );
}

function Milestone({
  moment,
  index,
  hindi,
  show,
  reduced,
  cardRef,
}: {
  moment: StoryMoment;
  index: number;
  hindi: boolean;
  show: boolean;
  reduced: boolean;
  cardRef: (el: HTMLElement | null) => void;
}) {
  // will-change only while it moves
  const [settled, setSettled] = useState(false);
  const title = hindi ? moment.hindi.title : moment.title;
  const line = hindi ? moment.hindi.line : moment.line;

  const card: CSSProperties = reduced
    ? { opacity: show ? 1 : 0, transition: "opacity 200ms linear" }
    : {
        opacity: show ? 1 : 0,
        transform: show ? "none" : "translateY(18px)",
        transition: `opacity 800ms ${EASE_CARD}, transform 800ms ${EASE_CARD}`,
        willChange: settled ? "auto" : "transform, opacity",
      };
  // the photo eases back from a slight zoom as the card arrives
  const photo: CSSProperties = reduced
    ? {}
    : {
        transform: show ? "none" : "scale(1.07)",
        transition: `transform 1400ms ${EASE_CARD} 80ms`,
        willChange: settled ? "auto" : "transform",
      };
  // then its year, title and line, one after another
  const word = (step: number): CSSProperties =>
    reduced
      ? {}
      : {
          opacity: show ? 1 : 0,
          transform: show ? "none" : "translateY(6px)",
          transition: `opacity 600ms ${EASE_CARD} ${250 + step * 110}ms, transform 600ms ${EASE_CARD} ${250 + step * 110}ms`,
        };

  return (
    <li
      ref={cardRef}
      className="story-card"
      style={card}
      onTransitionEnd={(e) => {
        if (show && e.target === e.currentTarget && e.propertyName === "transform") setSettled(true);
      }}
    >
      <article className="story-card-body">
        {/* the photo in a temple arch, edged in fine gold */}
        <div className="story-arch">
          {/* the clip holds still while the photo inside it eases back from its zoom */}
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
                className="h-full w-full object-cover"
                style={{ objectPosition: moment.photo.focus ?? "50% 30%", ...photo }}
              />
            ) : (
              <div
                role="img"
                aria-label={`${moment.photo.alt} (photo to come)`}
                className="flex h-full w-full items-center justify-center"
                style={{ background: WASHES[index % WASHES.length], ...photo }}
              >
                <Icon name="lotus" className="h-[24%] w-[24%] text-gold-ink/55" strokeWidth={1} />
              </div>
            )}
          </div>
          <svg aria-hidden className="story-arch-line" viewBox="0 0 100 140" preserveAspectRatio="none">
            <path d={ARCH} fill="none" stroke="url(#story-arch-gold)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        {/* the year, the title, one line */}
        <p className="story-gold mt-2.5 font-sans text-[11px] font-semibold tracking-[0.22em]" style={word(0)}>
          {moment.year}
        </p>
        <h3
          className={`story-blue mt-1 text-balance text-[17px] leading-tight ${hindi ? "font-deva font-semibold" : "font-display font-semibold"}`}
          style={word(1)}
        >
          {title}
        </h3>
        <p
          className={`story-brown mx-auto mt-1.5 line-clamp-3 text-[13.5px] leading-snug ${hindi ? "font-deva" : "font-display font-medium italic"}`}
          style={word(2)}
        >
          {line}
        </p>
      </article>
    </li>
  );
}

/** The temple arch: gently pointed at the top, a straight base (on a 100 × 140 box). */
const ARCH = "M4 136V56C4 38 18 28 50 4C82 28 96 38 96 56V136Z";

/** The arch's clip (in the photo's own box, 0–1) and its antique-gold edge, defined once. */
function ArchDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <defs>
        <clipPath id="story-arch-clip" clipPathUnits="objectBoundingBox">
          <path d={ARCH} transform="scale(0.01 0.0071428571)" />
        </clipPath>
        <linearGradient id="story-arch-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e8c97a" />
          <stop offset="0.5" stopColor="#b8893a" />
          <stop offset="1" stopColor="#e8c97a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Soft watercolour washes for photos still to come. */
const WASHES = [
  "radial-gradient(circle at 28% 24%, #fff 0, transparent 55%), radial-gradient(circle at 72% 78%, rgb(var(--sky) / 0.95), transparent 62%), rgb(var(--sky-pale))",
  "radial-gradient(circle at 70% 26%, #fff 0, transparent 52%), radial-gradient(circle at 28% 76%, rgb(246 205 196 / 0.9), transparent 62%), #fbefe9",
  "radial-gradient(circle at 30% 70%, #fff 0, transparent 50%), radial-gradient(circle at 72% 30%, rgb(240 214 160 / 0.85), transparent 62%), #fbf3e3",
  "radial-gradient(circle at 66% 70%, #fff 0, transparent 52%), radial-gradient(circle at 30% 30%, rgb(196 222 200 / 0.9), transparent 62%), #edf5ec",
];

/** A small, understated gold flourish under the heading. */
function Flourish() {
  return (
    <svg width="120" height="14" viewBox="0 0 120 14" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round">
      <path d="M6 7h36c5 0 6-4 10-4s4 3 2 4.5" opacity="0.75" />
      <path d="M114 7H78c-5 0-6-4-10-4s-4 3-2 4.5" opacity="0.75" />
      <circle cx="60" cy="7" r="1.6" fill="currentColor" stroke="none" />
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
    <div className="story-gold relative flex flex-col items-center pt-10">
      <span aria-hidden className="h-px w-16 bg-gradient-to-r from-transparent via-current to-transparent opacity-70" />
      <a href="#events" onClick={go} aria-label="On to the ceremonies" className="mt-2 flex h-11 w-11 items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7 6.5l5 5 5-5M7 12.5l5 5 5-5" />
        </svg>
      </a>
    </div>
  );
}

/**
 * Around the section, on the site's Himalayan mist: Mahadev's crescent, two still wisps of
 * cloud, and at the foot the faintest line of peaks — all well clear of the cards and words.
 * SVG and CSS only.
 */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      {/* the crescent, 76px down in the right corner (below the bell button, beyond the heading's end) */}
      <svg className="absolute right-[2px] top-[76px] h-8 w-8 text-gold-ink" viewBox="0 0 40 40">
        <path d="M27 5a15 15 0 1 0 8 25A13 13 0 0 1 27 5Z" fill="rgb(var(--gold) / 0.16)" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
      </svg>
      <span className="story-cloud left-[-16%] top-[3%] h-24 w-[64%]" />
      <span className="story-cloud right-[-18%] top-[40%] h-20 w-[56%]" />
      {/* the Himalaya, drawn in the finest line at the foot */}
      <svg className="story-peaks" viewBox="0 0 560 56" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path d="M0 55L46 38L70 44L104 24L124 32L150 18L176 32L214 16L240 26L266 8C272 4 276 2 280 2C284 2 288 4 294 8L320 26L346 16L384 32L410 18L436 32L456 24L490 44L514 38L560 55" />
        <path d="M280 10v10M272 14l-4 10M288 14l4 10M150 24l-3 8M410 24l3 8" opacity="0.7" />
      </svg>
    </div>
  );
}
