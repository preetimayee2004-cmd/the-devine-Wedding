import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { REDUCED_MOTION_QUERY } from "@/hooks/useMediaQuery";
import { dissolveToDust } from "@/lib/goldDust";
import { EASE } from "@/lib/motion";
import { glideTo, USER_INPUT_EVENTS } from "@/lib/scroll";
import { readSessionFlag, writeSessionFlag } from "@/lib/session";
import { formatVenueDate, parseVenueDateTime } from "@/lib/venueTime";
import { Icon } from "@/components/art/Icons";
import { Kailash } from "@/components/art/Kailash";
import { PetalShower } from "@/components/ui/PetalShower";

/**
 * Sections 00 + 01 — the opening, which becomes the Save the Date.
 *
 *   arrive  Shiva's hand comes down slowly from the top-left, Parvati's rises
 *           from the bottom-right (the board is turned 45°, as in the reference)
 *   meet    their fingertips meet and rest a moment in a soft golden light
 *   dust    the hands turn to gold and dissolve into golden dust
 *   art     Shiv and Parvati appear in close-up, painted in like watercolour;
 *           red petals begin to fall
 *   zoom    the view draws back: they settle at the foot of the screen, before
 *           Kailash and a still lake
 *   text    "Save the Date", the blessing, the names, the date and the city
 *           write themselves in at the top
 *
 * Never a gate: Skip is always there, a guest who already watched it this
 * visit gets a quicker version, and reduced motion shows the finished card.
 * Once read, the page glides on to the couple.
 */

const SEEN_KEY = "dw:opening-seen";

/** The beats, in order, and when each begins (ms, full version). */
const BEATS = { arrive: 0, meet: 3300, dust: 4700, art: 5600, zoom: 7900, text: 9100, done: 12300 } as const;
type Beat = keyof typeof BEATS;
const ORDER = Object.keys(BEATS) as Beat[];

/** Where the fingertips meet on the hands' board (fractions). */
const MEET = { x: 0.528, y: 0.466 };
/** How far the board is turned (matches .opening-stage in index.css). */
const STAGE_TURN = 45;
const ramp = (e0: number, e1: number, x: number) => Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
/** The soft ends of Shiva's arm and Parvati's sleeve (match the masks on their layers), for the dust too. */
const HAND_FADES = [(u: number) => ramp(0, 0.09, u), (_u: number, v: number) => 1 - ramp(0.72, 0.96, v)];

type Mode = "full" | "short" | "still";

function pickMode(): Mode {
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return "still";
  // ?opening=full plays the whole opening even on a reload (handy when reviewing).
  if (new URLSearchParams(window.location.search).get("opening") === "full") return "full";
  return readSessionFlag(SEEN_KEY) ? "short" : "full";
}

const MAX_ART_WAIT = 3500;

export function Invitation() {
  const [mode] = useState<Mode>(pickMode);
  const [beat, setBeat] = useState(-1); // index into ORDER; -1 = waiting for the artwork
  const [skipped, setSkipped] = useState(false);
  const [dusted, setDusted] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const shiva = useRef<HTMLImageElement>(null);
  const parvati = useRef<HTMLImageElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const [closeUp, setCloseUp] = useState("none");
  const measureRef = useRef<() => void>(() => {});

  const still = mode === "still";
  const pace = mode === "short" ? 0.6 : 1;
  const reached = (b: Beat) => beat >= ORDER.indexOf(b);
  /** Transition length: quicker on a repeat visit, brief after Skip, a plain fade for reduced motion. */
  const dur = (ms: number) => (skipped ? 350 : still ? 500 : ms * (mode === "short" ? 0.6 : 1));
  /** The words' stagger once they begin. */
  const word = (ms: number) => (still || skipped ? 0 : ms * pace);

  // ── the timeline ──
  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    (async () => {
      const hands = [shiva.current, parvati.current].filter((i): i is HTMLImageElement => i !== null);
      await Promise.race([
        Promise.all(hands.map((img) => img.decode().catch(() => undefined))),
        new Promise((r) => setTimeout(r, MAX_ART_WAIT)),
      ]);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      stage.current?.getBoundingClientRect();
      if (cancelled) return;
      writeSessionFlag(SEEN_KEY);
      if (mode === "still") {
        setBeat(ORDER.indexOf("text"));
        timers.push(window.setTimeout(() => setBeat(ORDER.length - 1), 900));
        return;
      }
      ORDER.forEach((b, i) =>
        timers.push(window.setTimeout(() => setBeat((cur) => Math.max(cur, i)), BEATS[b] * pace)),
      );
    })();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [mode, pace]);

  // The close-up: where the illustration must sit (centre of the screen, filling
  // its width) relative to its final place at the foot of the screen.
  useLayoutEffect(() => {
    const measure = (measureRef.current = () => {
      const el = art.current;
      if (!el) return;
      // measure where it rests, not where the close-up has put it
      const previous = el.style.transform;
      el.style.transform = "none";
      const r = el.getBoundingClientRect();
      el.style.transform = previous;
      const top = r.top + window.scrollY;
      const scale = Math.min(1.75, (window.innerWidth * 1.04) / r.width);
      const dx = window.innerWidth / 2 - (r.left + r.width / 2);
      const dy = window.innerHeight * 0.47 - (top + r.height / 2);
      setCloseUp(`translate(${dx}px, ${dy}px) scale(${scale})`);
    });
    measure();
    const img = art.current?.querySelector("img");
    img?.addEventListener("load", measure);
    void document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => {
      img?.removeEventListener("load", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // The hands turn to golden dust (and the close-up is lined up, now that everything has its size).
  const dustTime = reached("dust") && !skipped && !still;
  useEffect(() => {
    if (!dustTime || dusted) return;
    measureRef.current();
    const t = window.setTimeout(() => {
      const el = stage.current;
      const imgs = [shiva.current, parvati.current].filter((i): i is HTMLImageElement => i !== null);
      if (el) void dissolveToDust(el, imgs, MEET, 2200 * pace, STAGE_TURN, HAND_FADES);
      setDusted(true);
    }, 450 * pace);
    return () => clearTimeout(t);
  }, [dustTime, dusted, pace]);

  const skip = () => {
    setSkipped(true);
    setBeat(ORDER.length - 1);
  };

  // No scrolling until the view has drawn back and the words begin.
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

  // Save the Date → the couple: after reading time, glide on — unless the
  // guest has already touched, scrolled or pressed anything.
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
    return parts ? { ...formatVenueDate(parts), ordinal: ordinal(parts.day) } : null;
  }, []);

  const { invitation: copy, couple, venue, assets } = wedding;
  const text = reached("text");

  // ── styles for each beat ──
  const handsGone = still || skipped || dusted;
  const arrive = (from: string): CSSProperties =>
    !still && !skipped
      ? {
          opacity: reached("arrive") && !handsGone ? 1 : 0,
          transform: reached("arrive") ? "translateX(0)" : `translateX(${from})`,
          transition: `transform ${3600 * pace}ms ${EASE.glide}, opacity ${handsGone ? 120 : 1400 * pace}ms ease-out`,
        }
      : {
          opacity: reached("arrive") && !handsGone ? 1 : 0,
          transition: `opacity ${handsGone ? 120 : dur(600)}ms ease-out`,
        };
  // just before they dissolve, the hands turn to gold
  const gilt: CSSProperties = {
    filter: reached("dust") ? "sepia(0.85) saturate(1.6) hue-rotate(-12deg) brightness(1.12)" : "none",
    transition: `filter ${450 * pace}ms ease-in`,
  };
  const glow: CSSProperties = reached("dust")
    ? {
        transform: "scale(0.4)",
        opacity: 0,
        transition: `transform ${dur(1600)}ms ${EASE.breath}, opacity ${dur(1600)}ms ease`,
      }
    : reached("meet")
      ? {
          transform: "scale(1.4)",
          opacity: 1,
          transition: `transform ${dur(800)}ms ${EASE.breath}, opacity ${dur(600)}ms ease`,
        }
      : { transform: "scale(0.25)", opacity: beat < 0 ? 0.45 : 0.4 };

  const zoomed = reached("zoom") || still || skipped;
  const camera: CSSProperties = {
    transform: zoomed ? "none" : closeUp,
    transition: zoomed ? `transform ${dur(1800)}ms ${EASE.drift}` : "none",
  };
  const paint: CSSProperties = still
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
          `opacity ${dur(900)}ms ease-out`,
          `mask-size ${dur(2200)}ms ${EASE.silk}`,
          `-webkit-mask-size ${dur(2200)}ms ${EASE.silk}`,
          `filter ${dur(2400)}ms ${EASE.silk}`,
        ].join(", "),
      };
  const landscape: CSSProperties = {
    opacity: zoomed ? 1 : 0,
    transform: zoomed ? "none" : "translateY(24px)",
    transition: `opacity ${dur(1600)}ms ease-out ${word(300)}ms, transform ${dur(1800)}ms ${EASE.silk} ${word(300)}ms`,
  };

  /** Handwriting: the line is uncovered from left to right. */
  const write = (delay: number, ms: number): CSSProperties =>
    still
      ? { opacity: text ? 1 : 0, transition: "opacity 500ms linear" }
      : {
          opacity: text ? 1 : 0,
          clipPath: text ? "inset(-30% -8% -30% -8%)" : "inset(-30% 108% -30% -8%)",
          transition: `clip-path ${dur(ms)}ms ${EASE.drift} ${delay}ms, opacity 300ms ease-out ${delay}ms`,
        };
  const fade = (delay: number): CSSProperties => ({
    opacity: text ? 1 : 0,
    transform: text || still ? "none" : "translateY(8px)",
    transition: `opacity ${dur(900)}ms ${EASE.silk} ${delay}ms, transform ${dur(900)}ms ${EASE.silk} ${delay}ms`,
  });

  return (
    <section
      id="invitation"
      aria-labelledby="invitation-names"
      className="relative flex min-h-[100dvh] flex-col items-center overflow-x-clip px-[var(--gutter)] text-center"
      style={{ paddingTop: "calc(var(--status-bar) + 26px)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60%]"
        style={{
          background:
            "radial-gradient(ellipse 85% 62% at 50% 34%, rgb(var(--ivory) / 0.8) 0%, rgb(var(--ivory) / 0.45) 52%, rgb(var(--ivory) / 0) 82%)",
          opacity: text ? 1 : 0,
          transition: `opacity ${dur(1400)}ms ${EASE.silk}`,
        }}
      />

      {/* ── the words, written in at the top ── */}
      <p className="relative font-script text-[48px] leading-none text-gold-ink" style={write(word(0), 1500)}>
        {copy.title}
      </p>
      <p
        className="relative mt-3 max-w-[18rem] text-balance font-display text-[16px] font-medium italic leading-snug text-slate"
        style={fade(word(1000))}
      >
        {copy.blessing}
      </p>
      <h1
        id="invitation-names"
        className="relative mt-3 font-display text-[clamp(34px,10.4vw,44px)] font-semibold italic leading-tight text-navy"
        style={write(word(1500), 1500)}
      >
        <span className="text-balance">
          {couple.bride.displayName} <span className="font-medium text-gold-ink">&amp;</span> {couple.groom.displayName}
        </span>
      </h1>
      <p
        className="relative mt-1 max-w-[18rem] text-balance font-display text-[15px] italic leading-snug text-slate"
        style={fade(word(2600))}
      >
        {copy.request}
      </p>
      {date && (
        <div className="relative mt-4 flex flex-col items-center" style={fade(word(3000))}>
          <p className="font-sans text-[11px] font-medium uppercase tracking-eyebrow text-gold-ink">{date.month}</p>
          <p className="flex items-start font-display font-semibold leading-none text-navy">
            <span className="text-[58px] leading-[0.9]">{date.day}</span>
            <span className="ml-0.5 mt-1 text-[22px] font-medium italic text-gold-ink">{date.ordinal}</span>
          </p>
          <p className="mt-1 font-sans text-[12px] font-medium tracking-[0.5em] text-gold-ink">{date.year}</p>
        </div>
      )}
      {venue.city && (
        <p
          className="relative mt-2 flex items-center gap-1 font-sans text-[11px] font-medium uppercase tracking-eyebrow text-navy"
          style={fade(word(3400))}
        >
          <Icon name="pin" className="h-4 w-4 text-gold-ink" /> {venue.city}
        </p>
      )}

      {/* ── Shiv and Parvati before Kailash, at the foot of the screen ── */}
      <div className="relative mt-auto w-full pt-6">
        <div
          aria-hidden
          className="absolute bottom-0 h-[min(105vw,480px)] w-screen"
          style={{ left: "calc(50% - 50vw)", ...landscape }}
        >
          <Kailash className="h-full w-full" />
        </div>
        <div ref={art} className="relative z-[1] mx-auto w-[min(78vw,350px)]" style={camera}>
          <div className="[-webkit-mask-image:linear-gradient(#000_82%,transparent)] [mask-image:linear-gradient(#000_82%,transparent)]">
            <div
              className="watercolor-reveal"
              style={{ ...paint, "--watercolor-mask": `url(${assets.watercolorMask})` } as CSSProperties}
            >
              <img
                src={assets.saveTheDateArt}
                alt="Shiva and Parvati together"
                className="block h-auto w-full"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── the two hands, meeting, then turning to golden dust ── */}
      <div ref={stage} aria-hidden className="opening-stage">
        {/* the far ends of the arm and the sleeve melt into the sky, so no edge of the board ever shows */}
        <div
          className="opening-layer [-webkit-mask-image:linear-gradient(to_right,transparent,#000_9%)] [mask-image:linear-gradient(to_right,transparent,#000_9%)]"
          style={arrive("-46%")}
        >
          <img ref={shiva} src={assets.opening.shivaHand} alt="" className="opening-layer" style={gilt} />
        </div>
        <div
          className="opening-layer [-webkit-mask-image:linear-gradient(#000_72%,transparent_96%)] [mask-image:linear-gradient(#000_72%,transparent_96%)]"
          style={arrive("46%")}
        >
          <img ref={parvati} src={assets.opening.parvatiHand} alt="" className="opening-layer" style={gilt} />
        </div>
        <div className="opening-glow" data-waiting={beat < 0 || undefined} style={glow} />
      </div>

      {/* a short shower of red petals while the card writes itself in */}
      {reached("art") && !still && !skipped && <PetalShower />}

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

/** 1 → "st", 2 → "nd", 12 → "th", 23 → "rd". */
function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return "th";
  return ["th", "st", "nd", "rd"][n % 10] ?? "th";
}
