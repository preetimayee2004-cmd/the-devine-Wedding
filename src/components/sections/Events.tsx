import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { wedding } from "@/config/wedding";
import type { Ceremony } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 05 — the wedding events.
 *
 * "Wedding Events" and one quote above the couple's gold temple arch, wreathed in lotus and banana
 * leaves (which sway, very gently), with the music of the celebration and a festive elephant at
 * its foot. Inside the arch, one ceremony at a time: the couple dressed for it, then its name,
 * date and time, venue (a tap opens it in Google Maps) and dress code.
 *
 * A tap anywhere else on the arch: a red chunri — gold zari borders on wavy edges, bandhani dots —
 * flies across it from one bottom corner to the opposite top corner (0.85s), rippling as it goes.
 * It works as a wipe: behind it the ceremony that was there is gone, ahead of it the next one
 * shows; a few gold sparkles fly off its edge and fade, and once it has passed the new words rise
 * in (1.2s in all; taps meanwhile are ignored). It comes from the left one time, the right the
 * next; after the last ceremony, the first. The dots under the arch follow, a glow moving to the
 * new one; "Tap the arch frame to see the events" pulses gently until the first tap. Transform,
 * opacity and a moving mask only. Reduced motion: a plain crossfade, nothing sways.
 */

/** The arch picture's size, and the three parts of it that sway — in its own pixels. */
const ART = { w: 1098, h: 1228 };
const SWAY = [
  // the banana plant, from its foot beside the arch
  { points: [[0, 540], [128, 540], [128, 566], [200, 566], [200, 878], [0, 878]], origin: [190, 876], angle: 0.8, secs: 6.2, delay: 0 },
  // the lotus vine climbing the arch's left side
  { points: [[128, 296], [280, 296], [280, 566], [128, 566]], origin: [205, 566], angle: 0.6, secs: 5.4, delay: -1.8 },
  // the lotus on the right, above the elephant
  { points: [[826, 466], [1082, 466], [1082, 836], [978, 846], [946, 892], [826, 892]], origin: [915, 890], angle: 0.6, secs: 7, delay: -3.1 },
] as const;
const pct = ([x, y]: readonly number[]) => `${((x / ART.w) * 100).toFixed(2)}% ${((y / ART.h) * 100).toFixed(2)}%`;
const polygon = (points: readonly (readonly number[])[]) => points.map(pct).join(", ");
/** The picture with the swaying parts cut out of it (even-odd: the rectangle, then each part as a hole). */
const BASE_CLIP = `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${SWAY.map((s) => `${polygon(s.points)}, ${pct(s.points[0])}, 0% 0%`).join(", ")})`;

/** The timeline of a tap (ms): the chunri's flight, then the words, then rest. */
const T = { flight: 850, done: 1200, reducedDone: 520 } as const;

/**
 * The chunri's flight, in the arch's width units (cqw; the arch is 111.84 tall). Its middle runs
 * along the arch's diagonal from beyond one bottom corner to beyond the opposite top corner; the
 * moving mask's edge is always under it (both run c = -1.45 … 1.45 along the diagonal, with the same
 * easing: cubic-bezier(.42,0,.45,1)).
 */
const TALL = (ART.h / ART.w) * 100;
const EASE = [0.42, 0, 0.45, 1] as const;
/** The eased progress at time fraction x (a cubic-bezier solved by bisection). */
function eased(x: number) {
  const [x1, y1, x2, y2] = EASE;
  const b = (t: number, a: number, c: number) => 3 * a * t * (1 - t) ** 2 + 3 * c * t * t * (1 - t) + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (b(mid, x1, x2) < x) lo = mid;
    else hi = mid;
  }
  return b((lo + hi) / 2, y1, y2);
}
/** Gold sparkles off the chunri's leading edge: where (cqw) and when (ms), for a flight from the left. */
const SPARKS = [
  [150, -18], [240, 16], [320, -6], [400, 22], [470, -24], [540, 8], [610, -12], [680, 28],
].map(([ms, along], i) => {
  const c = -1.45 + 2.9 * eased(ms / T.flight);
  const diag = Math.hypot(100, TALL);
  const b = [100 / diag, TALL / diag]; // along the chunri
  const n = [TALL / diag, -100 / diag]; // the way it flies
  const x = ((1 + c) / 2) * 100 + along * b[0] + 14 * n[0];
  const y = ((1 - c) / 2) * TALL + along * b[1] + 14 * n[1];
  return { ms, x, y, dx: n[0] * 6 + (i % 2 ? 2 : -2), dy: n[1] * 6 - 2 };
});

/** Where a venue is on Google Maps (the wedding's own link for the main venue, when it has one). */
function mapsHref(venue: string) {
  const main = wedding.venue;
  if (main.mapsUrl && venue.includes(main.name)) return main.mapsUrl;
  const q = venue.includes(main.city) ? venue : `${venue}, ${main.city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function Events() {
  const { events, assets } = wedding;
  const list = events.list;
  const sectionRef = useRef<HTMLElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.15 });
  const archSeen = useInView(archRef, { threshold: 0.2 });
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  // a turn under way: from which ceremony, which way the chunri flies, and a count to restart it
  const [turn, setTurn] = useState<{ from: number; dir: "ltr" | "rtl"; n: number } | null>(null);
  const flights = useRef(0);
  // the line under the arch pulses gently until the first tap
  const [tapped, setTapped] = useState(false);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const next = () => {
    if (busy.current || list.length < 2) return;
    busy.current = true;
    setTapped(true);
    flights.current += 1;
    setTurn({ from: index, dir: flights.current % 2 ? "ltr" : "rtl", n: flights.current });
    setIndex((index + 1) % list.length);
    later(reduced ? T.reducedDone : T.done, () => {
      setTurn(null);
      busy.current = false;
    });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      next();
    }
  };

  const ceremony = list[index];
  const still = reduced || undefined;

  return (
    <section id="events" ref={sectionRef} aria-labelledby="events-heading" className="relative px-[var(--gutter)] pb-3 pt-5">
      <SectionHeading id="events-heading" title={events.title} intro={`“${events.quote}”`} show={seen} />

      <div ref={archRef} className="events-arch" data-shown={archSeen || reduced || undefined} data-still={still}>
        {/* the arch, its swaying leaves and lotus as their own layers over the rest */}
        <img src={assets.eventsArch} alt="" width={ART.w} height={ART.h} draggable={false} className="ea-layer" style={{ clipPath: BASE_CLIP }} />
        {SWAY.map((s, i) => (
          <img
            key={i}
            src={assets.eventsArch}
            alt=""
            aria-hidden
            draggable={false}
            className="ea-layer ea-sway"
            style={
              {
                clipPath: `polygon(${polygon(s.points)})`,
                transformOrigin: pct(s.origin),
                "--a": `${s.angle}deg`,
                animationDuration: `${s.secs}s`,
                animationDelay: `${s.delay}s`,
              } as CSSProperties
            }
          />
        ))}

        {/* a tap anywhere on the arch moves to the next ceremony */}
        <button type="button" className="ev-tap" onClick={next} onKeyDown={onKey} aria-label={`Show the next ceremony (${((index + 1) % Math.max(1, list.length)) + 1} of ${list.length})`} />

        {/* the ceremony that was, going behind the chunri; the one that is, showing ahead of it */}
        {turn && list[turn.from] && <Card key={`old-${turn.n}`} ceremony={list[turn.from]} role="old" dir={turn.dir} still={still} />}
        {ceremony && <Card key={turn ? `new-${turn.n}` : `rest-${index}`} ceremony={ceremony} role={turn ? "new" : "rest"} dir={turn?.dir ?? "ltr"} still={still} />}

        {/* the red chunri, and the sparkles off its edge */}
        {turn && !reduced && (
          <div key={`fly-${turn.n}`} aria-hidden className="ev-chunri-sky" data-dir={turn.dir}>
            <div className="ev-chunri">
              <Chunri />
            </div>
            {SPARKS.map((s, i) => (
              <span
                key={i}
                className="ev-spark"
                style={
                  {
                    left: `${turn.dir === "ltr" ? s.x : 100 - s.x}cqw`,
                    top: `${s.y}cqw`,
                    animationDelay: `${s.ms}ms`,
                    "--dx": `${turn.dir === "ltr" ? s.dx : -s.dx}cqw`,
                    "--dy": `${s.dy}cqw`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* under the arch: which ceremony this is (a glow moving to it), and how to see the others */}
      <div className="ev-foot">
        {list.length > 1 && (
          <div aria-hidden className="ev-dots" style={{ "--at": index } as CSSProperties}>
            <span className="ev-dot-glow" />
            {list.map((c, i) => (
              <span key={c.name} className="ev-dot" data-on={i === index || undefined} />
            ))}
          </div>
        )}
        <p className="ev-hint" data-pulse={(!tapped && !reduced) || undefined}>
          {events.hint}
        </p>
        {ceremony?.credit && <p className="ev-credit">{ceremony.credit}</p>}
      </div>
    </section>
  );
}

/** One ceremony's card: the couple in the arch's upper part, its words below them. */
function Card({ ceremony, role, dir, still }: { ceremony: Ceremony; role: "rest" | "old" | "new"; dir: "ltr" | "rtl"; still?: boolean }) {
  const gone = role === "old";
  return (
    <div className="ev-card" data-role={role} data-dir={dir} data-still={still} aria-hidden={gone || undefined} aria-live={gone ? undefined : "polite"}>
      <div className="ev-figure">
        <img src={ceremony.image.src} alt={gone ? "" : ceremony.image.alt} width={ceremony.image.width} height={ceremony.image.height} draggable={false} />
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
          </a>
        </p>
        <p className="ev-dress">
          <span className="ev-label">Dress code</span> {ceremony.dressCode}
        </p>
      </div>
    </div>
  );
}

/**
 * The chunri: a long band of red silk (shaded as if in folds), dotted with bandhani, gold zari
 * along both wavy edges. It is drawn longer than it shows and slides along itself as it flies,
 * so its edges ripple. 1700 x 260 units = 170 x 26 cqw.
 */
const WAVE = 220;
function edge(y: number, amp: number, phase: number) {
  const pts: string[] = [];
  for (let x = -WAVE * 2; x <= 1700 + WAVE * 2; x += 20) pts.push(`${x} ${(y + amp * Math.sin((x / WAVE) * Math.PI * 2 + phase)).toFixed(1)}`);
  return pts;
}
const TOP = edge(26, 12, 0);
const BOTTOM = edge(234, 12, 0.9);
const BAND = `M${TOP.join("L")}L${[...BOTTOM].reverse().join("L")}Z`;
const TOP_LINE = `M${TOP.join("L")}`;
const BOTTOM_LINE = `M${BOTTOM.join("L")}`;
const TOP_INNER = `M${edge(44, 11, 0.15).join("L")}`;
const BOTTOM_INNER = `M${edge(216, 11, 1.05).join("L")}`;

function Chunri() {
  return (
    <svg viewBox="0 0 1700 260" preserveAspectRatio="none" className="ev-chunri-svg">
      <defs>
        <linearGradient id="ev-silk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d0c1d" />
          <stop offset="0.18" stopColor="#b51429" />
          <stop offset="0.5" stopColor="#df3341" />
          <stop offset="0.8" stopColor="#b51429" />
          <stop offset="1" stopColor="#7a0b1b" />
        </linearGradient>
        <linearGradient id="ev-folds" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="190" y2="0" spreadMethod="repeat">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="0.45" stopColor="#3a0008" stopOpacity="0.22" />
          <stop offset="0.6" stopColor="#ffe0e0" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <pattern id="ev-bandhani" width="34" height="34" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="2.6" fill="#ffe2b0" opacity="0.85" />
          <circle cx="25" cy="25" r="2.6" fill="#ffe2b0" opacity="0.85" />
          <circle cx="25" cy="8" r="1.2" fill="#fff4d8" opacity="0.7" />
          <circle cx="8" cy="25" r="1.2" fill="#fff4d8" opacity="0.7" />
        </pattern>
        <linearGradient id="ev-zari" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c99a4b" />
          <stop offset="0.5" stopColor="#f6dd9a" />
          <stop offset="1" stopColor="#c99a4b" />
        </linearGradient>
        <clipPath id="ev-band-clip">
          <path d={BAND} />
        </clipPath>
      </defs>
      <g className="ev-chunri-ripple">
        <g clipPath="url(#ev-band-clip)">
          <rect x={-WAVE * 2} y="0" width={1700 + WAVE * 4} height="260" fill="url(#ev-silk)" />
          <rect x={-WAVE * 2} y="0" width={1700 + WAVE * 4} height="260" fill="url(#ev-bandhani)" />
          <rect x={-WAVE * 2} y="0" width={1700 + WAVE * 4} height="260" fill="url(#ev-folds)" />
        </g>
        {/* the zari: a broad gold border on each edge, a fine bright line inside it, a dotted thread */}
        <path d={TOP_LINE} fill="none" stroke="url(#ev-zari)" strokeWidth="22" />
        <path d={BOTTOM_LINE} fill="none" stroke="url(#ev-zari)" strokeWidth="22" />
        <path d={TOP_LINE} fill="none" stroke="#fff3c8" strokeWidth="3" opacity="0.9" />
        <path d={BOTTOM_LINE} fill="none" stroke="#fff3c8" strokeWidth="3" opacity="0.9" />
        <path d={TOP_INNER} fill="none" stroke="#f3d68c" strokeWidth="3" strokeDasharray="3 9" strokeLinecap="round" />
        <path d={BOTTOM_INNER} fill="none" stroke="#f3d68c" strokeWidth="3" strokeDasharray="3 9" strokeLinecap="round" />
      </g>
    </svg>
  );
}
