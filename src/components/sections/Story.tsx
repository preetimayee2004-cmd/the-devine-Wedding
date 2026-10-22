import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { wedding } from "@/config/wedding";
import type { StoryMoment } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useLang } from "@/lib/lang";
import { Icon } from "@/components/art/Icons";

/**
 * Section 04 — "A Love Written in the Stars", on the site's own sky.
 *
 * Four milestones, each a photo in a cream polaroid frame with its title, year
 * and one line, joined by a fine gold constellation: on a phone the cards
 * alternate left and right and the line runs down behind them through a star
 * beside each one; from 768px they stand in a row over a dotted line through
 * four stars. Around them, faintly: Mahadev's crescent, soft clouds, thin
 * constellations at the edges and Kailash drawn in gold at the foot.
 *
 * Once only: the heading fades in; the line draws itself (on a phone, on to
 * each card as it scrolls into view) and each star glows as the line reaches
 * it; the cards fade in and rise 18px, 140ms apart. Afterwards just a rare
 * twinkle and very slow clouds. Only transform and opacity move (and the
 * line's dash). Reduced motion: everything as finished, in a 200ms fade.
 */

const DRAW_MS = 2200; // the whole line
const STAGGER_MS = 140;
const N = 4;

interface Star {
  x: number;
  y: number;
}
interface Geometry {
  w: number;
  h: number;
  /** the line's points, start to end (the stars among them) */
  points: Star[];
  stars: Star[];
  /** how far along the line (0–1) each star sits */
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
  const headSeen = useInView(headRef, { threshold: 0.25 });
  const sectionSeen = useInView(sectionRef, { threshold: 0 });
  const [geo, setGeo] = useState<Geometry | null>(null);
  // how many cards have been revealed, and how many had been before the latest reveal
  const [shown, setShown] = useState({ count: 0, from: 0 });

  const t = hindi ? story.hindi : story;

  // ── the constellation is laid out from the cards' real places, and again whenever they reflow ──
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const w = list.offsetWidth;
      const h = list.offsetHeight;
      const boxes = cards.current.filter((c): c is HTMLElement => c !== null);
      if (boxes.length !== N) return;
      const row = window.matchMedia("(min-width: 768px)").matches;
      let stars: Star[];
      let points: Star[];
      if (row) {
        // a gentle arc of stars under the row, joined end to end
        const below = Math.max(...boxes.map((b) => b.offsetTop + b.offsetHeight)) + 34;
        stars = boxes.map((b, i) => ({ x: b.offsetLeft + b.offsetWidth / 2, y: below + (i === 1 || i === 2 ? 14 : 0) }));
        points = stars;
      } else {
        // a star in the free strip beside each card (right of a left card, left of a right one),
        // the line coming down from the heading and going on to the foot
        stars = boxes.map((b, i) => ({ x: i % 2 === 0 ? w * 0.89 : w * 0.11, y: b.offsetTop + b.offsetHeight * 0.38 }));
        points = [{ x: w / 2, y: 0 }, ...stars, { x: w / 2, y: h }];
      }
      const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
      const total = lengths.reduce((a, b) => a + b, 0) || 1;
      let run = 0;
      const along = [0, ...lengths.map((l) => (run += l) / total)];
      const at = stars.map((s) => along[points.indexOf(s)]);
      setGeo({ w, h, points, stars, at, row });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, []);

  // ── the cards reveal as they come into view (all at once in the row), once each ──
  useEffect(() => {
    const els = cards.current.filter((c): c is HTMLElement => c !== null);
    if (!("IntersectionObserver" in window)) {
      setShown({ count: N, from: 0 });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        let furthest = -1;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          furthest = Math.max(furthest, els.indexOf(e.target as HTMLElement));
          io.unobserve(e.target);
        }
        if (furthest < 0) return;
        // a card further down brings the ones above it with it
        setShown((s) => (furthest + 1 > s.count ? { count: furthest + 1, from: s.count } : s));
      },
      { threshold: 0.25 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // reduced motion: everything as finished, once the section is reached
  const count = reduced ? (sectionSeen ? N : 0) : shown.count;
  const from = reduced ? 0 : shown.from;

  // how far the line is drawn: to the furthest revealed star — or, with all four, to its end
  const reach = (n: number) => (!geo || n === 0 ? 0 : n >= N ? 1 : geo.at[n - 1]);
  const drawn = reach(count);
  const drawMs = reduced ? 0 : Math.round((drawn - reach(from)) * DRAW_MS);

  const lineD = geo ? geo.points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("") : "";

  const fade = (show: boolean, delay: number, rise: number): CSSProperties =>
    reduced
      ? { opacity: show ? 1 : 0, transition: "opacity 200ms linear" }
      : {
          opacity: show ? 1 : 0,
          transform: show ? "none" : `translateY(${rise}px)`,
          transition: `opacity 700ms ease-out ${delay}ms, transform 700ms ease-out ${delay}ms`,
        };
  const headShown = reduced ? sectionSeen : headSeen;

  return (
    <section
      id="story"
      ref={sectionRef}
      aria-labelledby="story-heading"
      lang={hindi ? "hi" : undefined}
      className="story relative px-[var(--gutter)] pt-12"
      data-seen={sectionSeen || undefined}
      data-still={reduced || undefined}
    >
      <Backdrop />

      <div className="relative">
        {/* ── the heading ── */}
        <header ref={headRef} className="story-head relative z-[2] flex flex-col items-center text-center">
          <p
            className={`text-gold-ink ${hindi ? "font-deva text-[14px]" : "font-sans text-[12px] font-medium uppercase tracking-[0.3em]"}`}
            style={fade(headShown, 0, 8)}
          >
            <span aria-hidden className="mr-2 text-[10px]">✦</span>
            {t.eyebrow}
            <span aria-hidden className="ml-2 text-[10px]">✦</span>
          </p>
          <h2
            id="story-heading"
            className={`mt-3 text-balance leading-[1.15] text-navy [font-size:clamp(28px,8vw,38px)] ${hindi ? "font-deva font-semibold" : "font-display font-semibold"}`}
            style={fade(headShown, 120, 8)}
          >
            {t.title}
          </h2>
          <p
            className={`mt-2 max-w-[21rem] text-balance text-[17px] leading-snug text-slate ${hindi ? "font-deva" : "font-display font-medium italic"}`}
            style={fade(headShown, 240, 8)}
          >
            {t.subtitle}
          </p>
          <span aria-hidden className="mt-4 block text-gold-ink" style={fade(headShown, 360, 0)}>
            <Flourish />
          </span>
        </header>

        {/* ── the four milestones on their constellation ── */}
        <div ref={listRef} className="story-list relative mt-8">
          {geo && (
            <svg
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-0 overflow-visible"
              width={geo.w}
              height={geo.h}
              viewBox={`0 0 ${geo.w} ${geo.h}`}
            >
              <defs>
                <mask id="story-draw" maskUnits="userSpaceOnUse" x={-20} y={-20} width={geo.w + 40} height={geo.h + 80}>
                  <path
                    d={lineD}
                    fill="none"
                    stroke="#fff"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    strokeDasharray="1 1"
                    style={{
                      strokeDashoffset: 1 - drawn,
                      transition: drawMs ? `stroke-dashoffset ${drawMs}ms ease-in-out` : "none",
                    }}
                  />
                </mask>
              </defs>
              <path
                d={lineD}
                mask="url(#story-draw)"
                className={geo.row ? "story-line story-line-dots" : "story-line"}
                strokeLinejoin="round"
              />
            </svg>
          )}

          {/* the stars on the line: each glows as the line reaches it, then now and then twinkles */}
          {geo?.stars.map((s, i) => {
            const lit = i < count;
            const delay = reduced || i < from ? 0 : Math.max(0, Math.round((geo.at[i] - reach(from)) * DRAW_MS));
            return (
              <span
                key={i}
                aria-hidden
                className="story-star"
                data-lit={lit || undefined}
                style={{ left: s.x, top: s.y, "--glow-delay": `${delay}ms`, "--twinkle": `${TWINKLE[i][0]}s`, "--twinkle-delay": `${delay / 1000 + TWINKLE[i][1]}s` } as CSSProperties}
              >
                <span className="story-star-glow" />
                <svg className="story-star-core" viewBox="0 0 20 20" width="18" height="18">
                  <path d="M10 1c.6 4.6 2.4 7.4 9 9c-6.6 1.6-8.4 4.4-9 9c-.6-4.6-2.4-7.4-9-9c6.6-1.6 8.4-4.4 9-9Z" fill="currentColor" />
                </svg>
              </span>
            );
          })}

          <ol className="story-cards relative z-[1] flex flex-col gap-12 md:grid md:grid-cols-4 md:gap-4 md:pb-16">
            {story.moments.map((m, i) => (
              <Milestone
                key={m.title}
                moment={m}
                index={i}
                hindi={hindi}
                show={i < count}
                delay={reduced ? 0 : Math.max(0, i - from) * STAGGER_MS}
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

/** Each milestone star's twinkle: [cycle s, extra delay s] — a different, unhurried rhythm for each. */
const TWINKLE: Array<[number, number]> = [
  [7.2, 6.4],
  [8.6, 8.1],
  [6.4, 7.3],
  [9, 6.9],
];

function Milestone({
  moment,
  index,
  hindi,
  show,
  delay,
  reduced,
  cardRef,
}: {
  moment: StoryMoment;
  index: number;
  hindi: boolean;
  show: boolean;
  delay: number;
  reduced: boolean;
  cardRef: (el: HTMLElement | null) => void;
}) {
  // will-change only while it moves
  const [settled, setSettled] = useState(false);
  const title = hindi ? moment.hindi.title : moment.title;
  const line = hindi ? moment.hindi.line : moment.line;
  const style: CSSProperties = reduced
    ? { opacity: show ? 1 : 0, transition: "opacity 200ms linear" }
    : {
        opacity: show ? 1 : 0,
        transform: show ? "none" : "translateY(18px)",
        transition: `opacity 700ms cubic-bezier(.22,.61,.36,1) ${delay}ms, transform 700ms cubic-bezier(.22,.61,.36,1) ${delay}ms`,
        willChange: settled ? "auto" : "transform, opacity",
      };
  return (
    <li
      ref={cardRef}
      className={`story-card w-[78%] md:w-auto md:self-auto ${index % 2 ? "self-end" : "self-start"} ${index === 1 || index === 2 ? "md:mt-5" : ""}`}
      style={style}
      onTransitionEnd={(e) => {
        if (show && e.target === e.currentTarget && e.propertyName === "transform") setSettled(true);
      }}
    >
      <article className="story-polaroid">
        <div className="story-photo">
          {moment.photo.src ? (
            <img
              src={moment.photo.src}
              alt={moment.photo.alt}
              width={600}
              height={600}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              role="img"
              aria-label={`${moment.photo.alt} (photo to come)`}
              className="flex h-full w-full items-center justify-center"
              style={{ background: WASHES[index % WASHES.length] }}
            >
              <Icon name="lotus" className="h-[24%] w-[24%] text-gold-ink/55" strokeWidth={1} />
            </div>
          )}
        </div>
        <h3 className={`mt-3 text-[21px] leading-tight text-navy md:text-[18px] ${hindi ? "font-deva font-semibold" : "font-display font-semibold"}`}>
          {title}
        </h3>
        <p className="mt-1 font-sans text-[14px] font-medium tracking-[0.14em] text-gold-ink">{moment.year}</p>
        <p className={`mt-1.5 text-[15px] leading-snug text-slate md:text-[14px] ${hindi ? "font-deva" : "font-display font-medium italic"}`}>
          {line}
        </p>
      </article>
    </li>
  );
}

/** Soft watercolour washes for photos still to come. */
const WASHES = [
  "radial-gradient(circle at 28% 24%, #fff 0, transparent 55%), radial-gradient(circle at 72% 78%, rgb(168 227 247 / 0.95), transparent 62%), #e6f5fc",
  "radial-gradient(circle at 70% 26%, #fff 0, transparent 52%), radial-gradient(circle at 28% 76%, rgb(246 205 196 / 0.9), transparent 62%), #fbefe9",
  "radial-gradient(circle at 30% 70%, #fff 0, transparent 50%), radial-gradient(circle at 72% 30%, rgb(240 214 160 / 0.85), transparent 62%), #fbf3e3",
  "radial-gradient(circle at 66% 70%, #fff 0, transparent 52%), radial-gradient(circle at 30% 30%, rgb(196 222 200 / 0.9), transparent 62%), #edf5ec",
];

/** A small gold flourish under the heading: two fine scrolls and a star. */
function Flourish() {
  return (
    <svg width="148" height="18" viewBox="0 0 148 18" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round">
      <path d="M4 9h44c6 0 8-5 12-5s5 4 2 5.5" opacity="0.8" />
      <path d="M144 9h-44c-6 0-8-5-12-5s-5 4-2 5.5" opacity="0.8" />
      <path d="M74 2.5c.5 3.6 1.8 5.4 6.5 6.5c-4.7 1.1-6 2.9-6.5 6.5c-.5-3.6-1.8-5.4-6.5-6.5c4.7-1.1 6-2.9 6.5-6.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** The way on: a fine gold line and a double arrow, gliding to the ceremonies — then Kailash, drawn in fine gold. */
function Onward() {
  const go = (e: MouseEvent) => {
    const next = document.getElementById("events");
    if (!next) return;
    e.preventDefault();
    next.scrollIntoView();
  };
  return (
    <div className="relative z-[2] flex flex-col items-center pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-10 text-gold-ink">
      <span aria-hidden className="h-px w-16 bg-gradient-to-r from-transparent via-gold-ink/70 to-transparent" />
      <a href="#events" onClick={go} aria-label="On to the ceremonies" className="mt-2 flex h-11 w-11 items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7 6.5l5 5 5-5M7 12.5l5 5 5-5" />
        </svg>
      </a>
      <svg aria-hidden className="mt-3 w-[min(78%,380px)]" viewBox="0 0 300 92" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" opacity="0.45">
        <path d="M0 90l40-26 22 10 30-26 18 10 22-30c4-8 8-14 18-16c10 2 14 8 18 16l22 30 18-10 30 26 22-10 40 26" />
        <path d="M150 4v18M140 12l-6 20M160 12l6 20M144 38l-10 18M156 38l10 18" opacity="0.6" />
      </svg>
    </div>
  );
}

/**
 * Faint, around the section: Mahadev's crescent, soft clouds drifting very slowly and thin
 * constellations at the edges (Kailash is drawn at the foot, under the way on). SVG and CSS only.
 */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      {/* the crescent (top left, clear of the bell button in the corner) */}
      <svg className="absolute left-[6%] top-5 h-11 w-11 text-gold-ink" viewBox="0 0 40 40">
        <path d="M27 5a15 15 0 1 0 8 25A13 13 0 0 1 27 5Z" fill="rgb(var(--gold) / 0.18)" stroke="currentColor" strokeWidth="0.9" opacity="0.75" />
      </svg>
      {/* soft clouds */}
      <span className="story-cloud left-[-14%] top-[2%] h-24 w-[62%]" />
      <span className="story-cloud right-[-18%] top-[42%] h-20 w-[56%] [animation-delay:-30s]" />
      <span className="story-cloud bottom-[7%] left-[-10%] h-24 w-[60%] [animation-delay:-55s]" />
      {/* constellations at the edges */}
      <svg className="absolute left-2 top-[150px] h-24 w-20 text-gold-ink" viewBox="0 0 80 96" opacity="0.5">
        <path d="M6 10L28 24L22 50L48 62L70 88" fill="none" stroke="currentColor" strokeWidth="0.6" />
        {[[6, 10], [28, 24], [22, 50], [48, 62], [70, 88]].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="currentColor" />
        ))}
      </svg>
      <svg className="absolute right-1 top-[56%] h-24 w-16 text-gold-ink" viewBox="0 0 64 96" opacity="0.45">
        <path d="M56 6L40 30L52 52L22 72L34 92" fill="none" stroke="currentColor" strokeWidth="0.6" />
        {[[56, 6], [40, 30], [52, 52], [22, 72], [34, 92]].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="1.5" fill="currentColor" />
        ))}
      </svg>
    </div>
  );
}
