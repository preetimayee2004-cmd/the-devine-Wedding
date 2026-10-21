import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { wedding } from "@/config/wedding";
import { useGuest } from "@/context/GuestContext";
import { REDUCED_MOTION_QUERY } from "@/hooks/useMediaQuery";
import { EASE } from "@/lib/motion";
import { glideTo, USER_INPUT_EVENTS } from "@/lib/scroll";
import { readSessionFlag, writeSessionFlag } from "@/lib/session";
import { formatVenueDate, parseVenueDateTime } from "@/lib/venueTime";
import { Ganpati } from "@/components/art/Ganpati";
import { HAND_OUTLINES } from "@/components/art/handLineArt";
import { OrnamentDivider } from "@/components/ui/OrnamentDivider";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Sections 00 + 01 — the opening, which becomes the invitation.
 *
 *   arrive  Shiva's hand glides in slowly from the left, Parvati's from the right
 *   glow    their fingertips meet in a soft golden light
 *   line    a gold line draws around both hands
 *   names   the couple's names are written beneath them
 *   fade    the painted hands fade slowly, leaving gold line art on the sky
 *   art     Shiv and Parvati paint in at the foot of the screen, like watercolour
 *   text    the invitation's words arrive from above
 *
 * Never a gate: Skip is always there, a guest who already watched it this
 * visit gets a quicker version, and reduced motion shows it all at once.
 * Once read, the page glides on to the couple.
 */

const SEEN_KEY = "dw:opening-seen";

/** The beats, in order, and when each begins (ms, full version). */
const BEATS = {
  arrive: 0,
  glow: 2200,
  line: 2600,
  names: 3400,
  fade: 4300,
  art: 5400,
  text: 6200,
  done: 7600,
} as const;
type Beat = keyof typeof BEATS;
const ORDER = Object.keys(BEATS) as Beat[];

type Mode = "full" | "short" | "still";

function pickMode(): Mode {
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return "still";
  // ?opening=full plays the whole opening even on a reload (handy when reviewing).
  if (new URLSearchParams(window.location.search).get("opening") === "full") return "full";
  return readSessionFlag(SEEN_KEY) ? "short" : "full";
}

/** Longest wait for the hands' artwork before starting anyway. */
const MAX_ART_WAIT = 3500;

export function Invitation() {
  const { guestName } = useGuest();
  const [mode] = useState<Mode>(pickMode);
  const [beat, setBeat] = useState(-1); // index into ORDER; -1 = waiting for the artwork
  const [skipped, setSkipped] = useState(false);
  const shiva = useRef<HTMLImageElement>(null);
  const parvati = useRef<HTMLImageElement>(null);

  const reached = (b: Beat) => beat >= ORDER.indexOf(b);
  /** Transition length for a beat: quicker on a repeat visit, brief after Skip, a plain fade for reduced motion. */
  const dur = (ms: number) => (skipped ? 350 : mode === "still" ? 500 : mode === "short" ? ms * 0.6 : ms);
  const still = mode === "still";

  // ── the timeline ──
  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    (async () => {
      const art = [shiva.current, parvati.current].filter((i): i is HTMLImageElement => i !== null);
      await Promise.race([
        Promise.all(art.map((img) => img.decode().catch(() => undefined))),
        new Promise((r) => setTimeout(r, MAX_ART_WAIT)),
      ]);
      if (cancelled) return;
      writeSessionFlag(SEEN_KEY);
      if (mode === "still") {
        setBeat(ORDER.indexOf("text"));
        timers.push(window.setTimeout(() => setBeat(ORDER.length - 1), 900));
        return;
      }
      const pace = mode === "short" ? 0.45 : 1;
      ORDER.forEach((b, i) =>
        timers.push(window.setTimeout(() => setBeat((cur) => Math.max(cur, i)), BEATS[b] * pace)),
      );
    })();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [mode]);

  const skip = () => {
    setSkipped(true);
    setBeat(ORDER.length - 1);
  };

  // No scrolling until the invitation's words have arrived.
  const locked = !reached("text");
  useEffect(() => {
    if (!locked) return;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, [locked]);

  // Invitation → Hero (PRD §5): after reading time, glide up to the couple —
  // unless the guest has already touched, scrolled or pressed anything.
  const done = reached("done");
  useEffect(() => {
    const readingMs = wedding.invitation.autoAdvanceMs;
    if (!done || still || !readingMs) return;
    let touched = false;
    const onInput = () => {
      touched = true;
    };
    USER_INPUT_EVENTS.forEach((type) => window.addEventListener(type, onInput, { passive: true }));
    let stopGlide = () => {};
    const timer = window.setTimeout(() => {
      const next = document.getElementById("couple");
      if (touched || !next || window.scrollY > 40) return;
      stopGlide = glideTo(next.getBoundingClientRect().top + window.scrollY, 1600);
    }, readingMs);
    return () => {
      clearTimeout(timer);
      stopGlide();
      USER_INPUT_EVENTS.forEach((type) => window.removeEventListener(type, onInput));
    };
  }, [done, still]);

  const date = useMemo(() => {
    const parts = parseVenueDateTime(wedding.wedding.dateTime);
    return parts ? formatVenueDate(parts) : null;
  }, []);

  const { invitation: copy, couple, assets } = wedding;
  const greeting = copy.greeting.replace("{guest}", guestName);
  const text = reached("text");
  /** The words' stagger after they begin (all together for reduced motion or after Skip). */
  const word = (ms: number) => (still || skipped ? 0 : mode === "short" ? ms * 0.6 : ms);

  // ── styles for each beat ──
  const arrive = (from: string): CSSProperties =>
    mode === "full" && !skipped
      ? {
          opacity: reached("arrive") ? 1 : 0,
          transform: reached("arrive") ? "translateX(0)" : `translateX(${from})`,
          transition: `transform 2600ms ${EASE.glide}, opacity 1000ms ease-out`,
        }
      : { opacity: reached("arrive") ? 1 : 0, transition: `opacity ${dur(600)}ms ease-out` };
  // with reduced motion the painted hands never show: just their gold line art
  const paint: CSSProperties = {
    opacity: still || reached("fade") ? 0 : 1,
    transition: `opacity ${dur(1500)}ms ease-in-out`,
  };
  const sketch: CSSProperties = {
    opacity: reached("fade") ? 1 : 0,
    transition: `opacity ${dur(1300)}ms ease-out`,
  };
  const outline: CSSProperties = still
    ? { opacity: reached("line") ? 1 : 0, transition: "opacity 500ms linear" }
    : {
        strokeDasharray: "1 1",
        strokeDashoffset: reached("line") ? 0 : 1,
        transition: `stroke-dashoffset ${dur(1700)}ms ${EASE.silk}`,
      };
  const drawing = reached("line") && !reached("fade") && !still;
  const lineGlow: CSSProperties = {
    stroke: drawing ? "#F6D78F" : "#B48C4E",
    strokeWidth: drawing ? 2.4 : 1.3,
    filter: drawing ? "drop-shadow(0 0 3px rgb(255 228 160 / 0.95))" : "none",
    transition: `stroke ${dur(1400)}ms ease, stroke-width ${dur(1400)}ms ease`,
  };
  const glow: CSSProperties = reached("fade")
    ? {
        transform: "scale(0.55)",
        opacity: 0.55,
        transition: `transform ${dur(1400)}ms ${EASE.breath}, opacity ${dur(1400)}ms ease`,
      }
    : reached("line")
      ? {
          transform: "scale(0.95)",
          opacity: 0.75,
          transition: `transform ${dur(900)}ms ${EASE.breath}, opacity ${dur(900)}ms ease`,
        }
      : reached("glow")
        ? {
            transform: "scale(1.45)",
            opacity: 1,
            transition: `transform ${dur(700)}ms ${EASE.breath}, opacity ${dur(500)}ms ease`,
          }
        : { transform: "scale(0.25)", opacity: beat < 0 ? 0.45 : 0.4 };
  const names: CSSProperties = still
    ? { opacity: reached("names") ? 1 : 0, transition: "opacity 500ms linear" }
    : {
        opacity: reached("names") ? 1 : 0,
        clipPath: reached("names") ? "inset(-20% -5% -20% -5%)" : "inset(-20% 105% -20% -5%)",
        transition: `clip-path ${dur(1300)}ms ${EASE.drift}, opacity ${dur(500)}ms ease-out`,
      };
  const watercolour: CSSProperties = still
    ? {
        opacity: reached("art") ? 1 : 0,
        maskSize: "320% 320%",
        WebkitMaskSize: "320% 320%",
        transition: "opacity 500ms linear",
      }
    : {
        opacity: reached("art") ? 1 : 0,
        maskSize: reached("art") ? "320% 320%" : "30% 30%",
        WebkitMaskSize: reached("art") ? "320% 320%" : "30% 30%",
        filter: reached("art") ? "saturate(1)" : "saturate(0.3) brightness(1.1)",
        transition: [
          `opacity ${dur(800)}ms ease-out`,
          `mask-size ${dur(2200)}ms ${EASE.silk}`,
          `-webkit-mask-size ${dur(2200)}ms ${EASE.silk}`,
          `filter ${dur(2400)}ms ${EASE.silk}`,
        ].join(", "),
      };

  return (
    <section
      id="invitation"
      aria-labelledby="invitation-names"
      className="relative flex min-h-[100dvh] flex-col items-center px-[var(--gutter)] text-center"
      style={{ paddingTop: "calc(var(--status-bar) + 14px)" }}
    >
      {/* light gathered behind the words above the hands, so gold reads on the bright upper sky */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[46%]"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 30%, rgb(var(--ivory) / 0.75) 0%, rgb(var(--ivory) / 0.4) 50%, rgb(var(--ivory) / 0) 82%)",
          opacity: text ? 1 : 0,
          transition: `opacity ${dur(1400)}ms ${EASE.silk}`,
        }}
      />

      {/* ── the invitation's words, arriving from above ── */}
      <FromAbove show={text} delay={word(0)}>
        <Medallion show={text} still={still || skipped} />
      </FromAbove>
      <FromAbove show={text} delay={word(450)} className="mt-2 font-deva text-[20px] leading-snug text-gold-ink">
        <span lang="sa">{copy.mantra}</span>
      </FromAbove>
      <FromAbove
        show={text}
        delay={word(600)}
        className="mt-1 font-sans text-[10.5px] font-medium uppercase tracking-eyebrow text-slate"
      >
        {copy.blessing}
      </FromAbove>
      <FromAbove show={text} delay={word(800)} className="mt-3 font-display text-[23px] font-medium italic text-navy">
        {greeting}
      </FromAbove>

      {/* ── the two hands: painted, then gold line art that stays ── */}
      <div aria-hidden className="opening-stage">
        <div className="opening-layer" style={arrive("-46%")}>
          <img ref={shiva} src={assets.opening.shivaHand} alt="" className="opening-layer" style={paint} />
          <img src={assets.opening.shivaSketch} alt="" className="opening-layer" style={sketch} />
        </div>
        <div className="opening-layer" style={arrive("46%")}>
          <img ref={parvati} src={assets.opening.parvatiHand} alt="" className="opening-layer" style={paint} />
          <img src={assets.opening.parvatiSketch} alt="" className="opening-layer" style={sketch} />
        </div>
        <svg viewBox={HAND_OUTLINES.viewBox} className="opening-layer overflow-visible">
          <g fill="none" strokeLinecap="round" strokeLinejoin="round" style={lineGlow}>
            {[...HAND_OUTLINES.shiva, ...HAND_OUTLINES.parvati].map((d) => (
              <path key={d.slice(0, 24)} d={d} pathLength={1} vectorEffect="non-scaling-stroke" style={outline} />
            ))}
          </g>
        </svg>
        <div className="opening-glow" data-waiting={beat < 0 || undefined} style={glow} />
      </div>

      {/* ── the names, written beneath the hands ── */}
      <h1
        id="invitation-names"
        className="relative font-display text-[clamp(36px,11vw,46px)] font-semibold leading-tight text-navy"
        style={names}
      >
        <span className="text-balance">
          {couple.bride.displayName} <span className="font-medium italic text-gold-ink">&amp;</span>{" "}
          {couple.groom.displayName}
        </span>
      </h1>

      <Reveal
        show={text}
        delay={word(1000)}
        as="p"
        className="mt-2 max-w-[17rem] text-balance font-sans text-[14.5px] leading-relaxed text-slate"
      >
        {copy.request}
      </Reveal>
      <OrnamentDivider show={text} delay={word(1150)} className="mt-4" />
      {date && (
        <Reveal show={text} delay={word(1300)} className="mt-2">
          <p className="font-sans text-[10.5px] font-medium uppercase tracking-eyebrow text-gold-ink">{date.weekday}</p>
          <p className="font-display text-[25px] font-semibold leading-tight text-gold-ink">
            {date.day} {date.month} {date.year}
          </p>
        </Reveal>
      )}

      {/* ── Shiv and Parvati, painted in at the foot of the screen ── */}
      <div className="mt-auto w-[min(60vw,270px)] pt-4 [mask-image:linear-gradient(#000_80%,transparent)] [-webkit-mask-image:linear-gradient(#000_80%,transparent)]">
        <div
          className="watercolor-reveal"
          style={{ ...watercolour, "--watercolor-mask": `url(${assets.watercolorMask})` } as CSSProperties}
        >
          <img
            src={assets.divineCouple}
            alt="Shiva and Parvati seated together"
            className="block h-auto w-full"
            draggable={false}
          />
        </div>
      </div>

      {/* Skip: always there while the opening plays */}
      {locked && (
        <button
          type="button"
          onClick={skip}
          className={`fixed right-4 z-40 rounded-full border border-gold/70 bg-ivory/75 px-4 py-2 font-sans text-[13px] font-medium tracking-[0.12em] text-navy backdrop-blur-sm transition-opacity duration-500 hover:bg-ivory/90 ${beat >= 0 ? "opacity-100" : "pointer-events-none opacity-0"}`}
          style={{ top: "calc(var(--status-bar) + 12px)" }}
        >
          Skip <span aria-hidden>›</span>
        </button>
      )}
    </section>
  );
}

/** The invitation's words come in gently from above. */
function FromAbove({
  show,
  delay,
  className = "",
  children,
}: {
  show: boolean;
  delay: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "none" : "translateY(-16px)",
        transition: `opacity 900ms ${EASE.silk} ${delay}ms, transform 1000ms ${EASE.silk} ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Ganpati inside a fine gold double ring; the ring opens, then he draws himself. */
function Medallion({ show, still }: { show: boolean; still: boolean }) {
  const dots = [0, 90, 180, 270].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return [50 + 46 * Math.sin(rad), 50 - 46 * Math.cos(rad)];
  });
  return (
    <div className="relative h-[92px] w-[92px] shrink-0">
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        style={{
          transform: show || still ? "scale(1)" : "scale(0.6)",
          transition: `transform 1000ms ${EASE.silk}`,
        }}
      >
        <circle cx="50" cy="50" r="40" fill="rgb(var(--ivory) / 0.7)" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgb(var(--gold))" strokeWidth="0.9" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgb(var(--gold))" strokeWidth="0.5" opacity="0.7" />
        {dots.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="rgb(var(--gold))" />
        ))}
      </svg>
      <Ganpati
        drawn={show}
        still={still}
        delay={still ? 0 : 250}
        className="absolute left-1/2 top-1/2 w-[64px] -translate-x-1/2 -translate-y-[52%]"
      />
    </div>
  );
}
