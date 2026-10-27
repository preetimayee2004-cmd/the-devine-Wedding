import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { wedding } from "@/config/wedding";
import { usePersonal } from "@/context/GuestContext";
import type { Ceremony } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 05 — the wedding events.
 *
 * "Wedding Events" and one quote above the couple's gold temple arch, wreathed in lotus and banana
 * leaves, with the music of the celebration and a festive elephant at its foot — all of it still.
 * Inside the arch, one ceremony at a time: its illustration (the couple dressed for it, Ganesha for
 * the Ganesh Pujan, the doli for the Vidaai…), then its name, date and time,
 * venue (a small ivory button with a gold edge: a tap opens it in Google Maps) and dress code.
 *
 * To the next: a tap on the arch, a swipe left, the › under it (‹ or a swipe right for the one
 * before), or a gold progress mark; after the last, the first. The change (0.8s; taps meanwhile
 * are ignored): the ceremony shown fades out, its picture easing down a little (0.3s); a small
 * gold ornament glimmers where it stood; the next picture fades in, growing from 96% to 100%
 * (0.45s), and its words rise softly in just after. The progress marks move at once. The arch and
 * its flowers never move; only the ceremony does. Reduced motion: a short crossfade, no ornament.
 */

/** The arch picture's size, in its own pixels. */
const ART = { w: 1098, h: 1228 };

/** The change (ms): out by 300, the ornament between, in by ~780; reduced motion, a crossfade. */
const DONE = { full: 800, reduced: 420 } as const;

/** Where a venue is on Google Maps (the wedding's own link for the main venue, when it has one). */
function mapsHref(venue: string) {
  const main = wedding.venue;
  if (main.mapsUrl && venue.includes(main.name)) return main.mapsUrl;
  const q = venue.includes(main.city) ? venue : `${venue}, ${main.city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function Events() {
  const { events, assets } = wedding;
  const personal = usePersonal();
  const list = events.list;
  const n = list.length;
  const sectionRef = useRef<HTMLElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.15 });
  const archSeen = useInView(archRef, { threshold: 0.2 });
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  // a change under way: from which ceremony, and a count so each change plays afresh
  const [turn, setTurn] = useState<{ from: number; n: number } | null>(null);
  const turns = useRef(0);
  const busy = useRef(false);
  const indexRef = useRef(index);
  indexRef.current = index;
  const touch = useRef<{ x: number; y: number } | null>(null);
  // when a swipe ended: the click that may follow it is not a tap
  const swiped = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const go = (to: number) => {
    const from = indexRef.current;
    if (busy.current || n < 2 || to === from) return;
    busy.current = true;
    turns.current += 1;
    setTurn({ from, n: turns.current });
    setIndex(to);
    timers.current.push(
      window.setTimeout(
        () => {
          setTurn(null);
          busy.current = false;
        },
        reduced ? DONE.reduced : DONE.full,
      ),
    );
  };
  const next = () => go((indexRef.current + 1) % n);
  const prev = () => go((indexRef.current - 1 + n) % n);

  // a swipe on the arch: left for the next, right for the one before
  const onPointerDown = (e: PointerEvent) => (touch.current = { x: e.clientX, y: e.clientY });
  const onPointerUp = (e: PointerEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const [dx, dy] = [e.clientX - t.x, e.clientY - t.y];
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      swiped.current = Date.now();
      if (dx < 0) next();
      else prev();
    }
  };
  const onTap = () => {
    if (Date.now() - swiped.current > 450) next();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      if (e.key === "ArrowRight") next();
      else prev();
    }
  };

  const ceremony = list[index];
  const still = reduced || undefined;

  return (
    <section id="events" ref={sectionRef} aria-labelledby="events-heading" className="relative px-[var(--gutter)] pb-3 pt-5">
      <SectionHeading id="events-heading" title={events.title} intro={`“${personal(events.quoteFor, events.quote)}”`} show={seen} />

      <div
        ref={archRef}
        className="events-arch"
        data-shown={archSeen || reduced || undefined}
        data-still={still}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (touch.current = null)}
      >
        {/* the arch with its flowers: still */}
        <img src={assets.eventsArch} alt="" width={ART.w} height={ART.h} draggable={false} className="ea-layer" />

        {/* a tap anywhere on the arch moves to the next ceremony (the arrow keys go either way) */}
        <button
          type="button"
          className="ev-tap"
          onClick={onTap}
          onKeyDown={onKey}
          aria-label={`Show the next ceremony (${((index + 1) % Math.max(1, n)) + 1} of ${n})`}
        />

        {/* the ceremony that was, fading out; the one that is (the same element once it has come in) */}
        {turn && list[turn.from] && <Card key={`old-${turn.n}`} ceremony={list[turn.from]} role="old" />}
        {ceremony && <Card key={`at-${index}`} ceremony={ceremony} role={turn ? "new" : "rest"} />}

        {/* between them, a small gold ornament glimmers where the couple stood */}
        {turn && !reduced && <Ornament key={`orn-${turn.n}`} />}
      </div>

      {/* under the arch: ‹ the gold progress marks › — and how to see the others */}
      <div className="ev-foot">
        {n > 1 && (
          <div className="ev-nav">
            <button type="button" className="ev-arrow" onClick={prev} aria-label="Previous ceremony">
              <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 6 8.5 12l6 6" />
              </svg>
            </button>
            <div className="ev-marks">
              {list.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  className="ev-mark"
                  data-on={i === index || undefined}
                  aria-label={`${c.name} (${i + 1} of ${n})`}
                  aria-current={i === index ? "step" : undefined}
                  onClick={() => go(i)}
                >
                  <span />
                </button>
              ))}
            </div>
            <button type="button" className="ev-arrow" onClick={next} aria-label="Next ceremony">
              <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9.5 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        )}
        <p className="ev-hint">{events.hint}</p>
        {ceremony?.credit && (
          <p key={index} className="ev-credit" data-new={turn ? "" : undefined}>
            {ceremony.credit}
          </p>
        )}
      </div>
    </section>
  );
}

/** One ceremony's card: the couple in the arch's upper part, its words below them. */
function Card({ ceremony, role }: { ceremony: Ceremony; role: "rest" | "old" | "new" }) {
  const gone = role === "old";
  return (
    <div className="ev-card" data-role={role} aria-hidden={gone || undefined} aria-live={gone ? undefined : "polite"}>
      <div className="ev-figure">
        {ceremony.image ? (
          <img src={ceremony.image.src} alt={gone ? "" : ceremony.image.alt} width={ceremony.image.width} height={ceremony.image.height} draggable={false} />
        ) : (
          <Jhoomar />
        )}
      </div>
      <div className="ev-words">
        <h3 className="ev-name">{ceremony.name}</h3>
        <p className="ev-when">
          {ceremony.date}
          <span aria-hidden className="ev-sep">
            {" · "}
          </span>
          <span className="whitespace-nowrap">{ceremony.time}</span>
        </p>
        <p className="ev-venue">
          <a
            href={mapsHref(ceremony.venue)}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={gone ? -1 : undefined}
            className="ev-venue-link"
            aria-label={`${ceremony.venue} — open in Google Maps`}
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
              <circle cx="12" cy="10" r="2.4" />
            </svg>
            <span>{ceremony.venue}</span>
            <svg aria-hidden viewBox="0 0 24 24" className="ev-venue-out" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 16 16 8M10 8h6v6" />
            </svg>
          </a>
        </p>
        <p className="ev-dress">
          <span className="ev-label">Dress code</span> {ceremony.dressCode}
        </p>
      </div>
    </div>
  );
}

/** The ornament: a fine gold flourish — a small lotus bud between two curling tendrils. */
function Ornament() {
  return (
    <svg aria-hidden className="ev-ornament" viewBox="0 0 120 36" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g stroke="#b8893a" strokeWidth="1.1">
        <path d="M50 18c-8 0-12-6-19-6-6 0-9 4-7 8 2 3 6 2 6-1" />
        <path d="M70 18c8 0 12-6 19-6 6 0 9 4 7 8-2 3-6 2-6-1" />
        <path d="M46 20c-9 2-16 6-27 4" opacity="0.7" />
        <path d="M74 20c9 2 16 6 27 4" opacity="0.7" />
        <path d="M60 7c-5 5-6 10 0 15 6-5 5-10 0-15z" fill="#e9cf8e" />
        <path d="M60 22c-4-1-8-4-9-8 4 0 7 3 9 8zM60 22c4-1 8-4 9-8-4 0-7 3-9 8z" fill="#f3e2b4" />
      </g>
      <g fill="#b8893a">
        <circle cx="60" cy="27.5" r="1.3" />
        <circle cx="16" cy="24" r="1" />
        <circle cx="104" cy="24" r="1" />
      </g>
    </svg>
  );
}

/**
 * For a ceremony without its illustration yet: a small gold jhoomar — a crown, three tiers of fine
 * gold strands hung with drops, a lotus at its foot — as festive as an evening reception.
 */
function Jhoomar() {
  const drops = (y: number, xs: number[], r: number) =>
    xs.map((x) => (
      <g key={`${x}-${y}`}>
        <path d={`M${x} ${y - 7}V${y - 2.2}`} stroke="#c9a45c" strokeWidth="0.6" />
        <path
          d={`M${x} ${y - 2.4}C${x - r} ${y + r * 0.6} ${x - r * 0.5} ${y + r * 1.6} ${x} ${y + r * 1.9} ${x + r * 0.5} ${y + r * 1.6} ${x + r} ${y + r * 0.6} ${x} ${y - 2.4}Z`}
          fill="#f6e8c4"
          stroke="#a8741f"
          strokeWidth="0.7"
        />
      </g>
    ));
  return (
    <svg aria-hidden viewBox="0 0 140 120" className="ev-jhoomar" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* the chain and the crown */}
      <path d="M70 0V12" stroke="#a8741f" strokeWidth="0.9" />
      <path d="M58 22C58 15 63 12 70 12 77 12 82 15 82 22Z" fill="#efdcae" stroke="#a8741f" strokeWidth="0.9" />
      <circle cx="70" cy="10" r="2" fill="#e2c27a" stroke="#a8741f" strokeWidth="0.7" />
      {/* three tiers, each a gold band with festoons and drops */}
      <path d="M44 30C52 26 88 26 96 30" stroke="#a8741f" strokeWidth="1" />
      <path d="M44 30Q57 40 70 30 83 40 96 30" stroke="#c9a45c" strokeWidth="0.7" />
      <path d="M30 52C42 46 98 46 110 52" stroke="#a8741f" strokeWidth="1" />
      <path d="M30 52Q44 64 58 53Q70 62 82 53Q96 64 110 52" stroke="#c9a45c" strokeWidth="0.7" />
      <path d="M40 76C50 71 90 71 100 76" stroke="#a8741f" strokeWidth="1" />
      <path d="M40 76Q55 87 70 77 85 87 100 76" stroke="#c9a45c" strokeWidth="0.7" />
      <path d="M58 22 44 30M82 22 96 30M44 30 30 52M96 30 110 52M30 52 40 76M110 52 100 76" stroke="#c9a45c" strokeWidth="0.6" opacity="0.8" />
      {drops(42, [50, 70, 90], 2.6)}
      {drops(65, [36, 58, 82, 104], 2.8)}
      {drops(89, [50, 70, 90], 3)}
      {/* the lotus at its foot */}
      <g fill="#ecd49c" fillOpacity="0.75" stroke="#a8741f" strokeWidth="0.75">
        <path d="M70 115C67.6 111.6 67.6 107.6 70 103.6 72.4 107.6 72.4 111.6 70 115Z" />
        <path d="M70 115C65.8 114.5 62.6 112 61.8 108.2 65.8 108.6 68.8 111.2 70 115Z" />
        <path d="M70 115C74.2 114.5 77.4 112 78.2 108.2 74.2 108.6 71.2 111.2 70 115Z" />
      </g>
      <path d="M70 96.5V103" stroke="#a8741f" strokeWidth="0.8" />
    </svg>
  );
}
