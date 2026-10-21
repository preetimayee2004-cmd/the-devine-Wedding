import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { REDUCED_MOTION_QUERY } from "@/hooks/useMediaQuery";
import { EASE, MOTION } from "@/lib/motion";
import { glideTo, USER_INPUT_EVENTS } from "@/lib/scroll";
import { readSessionFlag, writeSessionFlag } from "@/lib/session";
import { formatVenueDate, parseVenueDateTime } from "@/lib/venueTime";
import { Icon } from "@/components/art/Icons";
import { Kailash } from "@/components/art/Kailash";
import { GoldMotes } from "@/components/ui/GoldMotes";
import { PetalShower } from "@/components/ui/PetalShower";

/**
 * Sections 00 + 01 — the opening, which becomes the Save the Date. One
 * continuous, quiet moment:
 *
 *   arrive   both hands begin partly off the screen — Shiva's at the upper
 *            left, palm down; the bride's at the lower right, palm up — and
 *            glide slowly toward the centre
 *   meet     Shiva's hand settles over the bride's open hand and they rest
 *            there, a soft shadow where they touch, a warm gold glow between
 *   release  the glow widens and fades, a few gold motes drift outward, and
 *            the hands fade gently into the sky
 *   reveal   the card's words rise in one after another, then Shiv and
 *            Parvati before Kailash; a few petals fall
 *
 * The hands are the painted artwork, only moved and faded — never stretched
 * or redrawn. Never a gate: Skip is always there, a guest who already watched
 * it this visit gets a quicker version, and reduced motion shows the finished
 * card. Once read, the page glides on to the couple.
 */

const SEEN_KEY = "dw:opening-seen";

/** The beats, in order, and when each begins (ms, full version). */
const BEATS = { arrive: 0, meet: 3900, release: 5200, reveal: 6000, done: 8100 } as const;
type Beat = keyof typeof BEATS;
const ORDER = Object.keys(BEATS) as Beat[];

/** How far out along its side each hand starts (% of the board): partly off the screen. */
const START = 40;
/**
 * Where each hand comes to rest (% of the board). Together they put Shiva's
 * hand 13.6% right and 4.8% lower than in the painting, so it lies over the
 * bride's open hand instead of touching fingertips. Hers travels the most,
 * which keeps the cut end of his forearm off the screen.
 */
const REST = { shiva: { x: 2.8, y: 1 }, bride: { x: -10.8, y: -3.8 } };
const GLIDE_MS = 3800;

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
  const stage = useRef<HTMLDivElement>(null);
  const shiva = useRef<HTMLImageElement>(null);
  const parvati = useRef<HTMLImageElement>(null);

  const still = mode === "still";
  const quiet = still || skipped;
  const pace = mode === "short" ? 0.6 : 1;
  const reached = (b: Beat) => beat >= ORDER.indexOf(b);

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
      // make sure the hands' starting place (off to each side) has been painted before they move,
      // so the glide can't be skipped when the artwork is already cached
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      stage.current?.getBoundingClientRect();
      if (cancelled) return;
      writeSessionFlag(SEEN_KEY);
      if (mode === "still") {
        setBeat(ORDER.length - 1);
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

  const skip = () => {
    setSkipped(true);
    setBeat(ORDER.length - 1);
  };

  // No scrolling until the card is fully revealed.
  const locked = !reached("done");
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

  // ── styles for each beat ──
  // the card rises in piece by piece, top to bottom (opacity and transform only, so nothing shifts);
  // for reduced motion and Skip it simply fades in whole
  const card = reached("reveal");
  const rise = (step: number, travel: number = MOTION.rise, ms: number = MOTION.revealMs): CSSProperties => {
    if (quiet) return { opacity: card ? 1 : 0, transition: "opacity 450ms ease-out" };
    const timing = `${ms * pace}ms ${EASE.silk} ${step * MOTION.staggerMs * pace}ms`;
    return {
      opacity: card ? 1 : 0,
      transform: card ? "none" : `translateY(${travel}px)`,
      transition: `opacity ${timing}, transform ${timing}`,
    };
  };

  // Shiva's hand comes from the upper left, the bride's from the lower right
  const hand = (who: keyof typeof REST): CSSProperties => {
    if (quiet) return { opacity: 0 };
    const moving = reached("arrive");
    const rest = REST[who];
    return {
      opacity: moving ? 1 : 0,
      transform: moving ? `translate(${rest.x}%, ${rest.y}%)` : `translate(${who === "shiva" ? -START : START}%, 0)`,
      transition: `transform ${GLIDE_MS * pace}ms ${EASE.glide}, opacity ${700 * pace}ms ${EASE.breath}`,
    };
  };
  // ...and they fade away together, as one picture, so neither shows through the other
  const handsOut = quiet || reached("release");
  const together: CSSProperties = {
    opacity: handsOut ? 0 : 1,
    transition: `opacity ${(quiet ? 300 : 1100 * pace)}ms ${EASE.breath}`,
  };
  // where Shiva's hand rests on hers, a soft shadow (it falls only on her hand)
  const touch: CSSProperties = {
    WebkitMaskImage: `url(${assets.opening.parvatiHand})`,
    maskImage: `url(${assets.opening.parvatiHand})`,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
    opacity: reached("meet") ? 0.3 : 0,
    transition: `opacity ${900 * pace}ms ease`,
  };
  const glow: CSSProperties = reached("release")
    ? {
        transform: "scale(1.9)",
        opacity: 0,
        transition: `transform ${1600 * pace}ms ${EASE.silk}, opacity ${1500 * pace}ms ${EASE.breath}`,
      }
    : reached("meet")
      ? {
          transform: "scale(1.2)",
          opacity: 0.9,
          transition: `transform ${1400 * pace}ms ${EASE.breath}, opacity ${1100 * pace}ms ease`,
        }
      : { transform: "scale(0.25)", opacity: beat < 0 ? 0.45 : 0.4 };

  return (
    <section
      id="invitation"
      aria-labelledby="invitation-names"
      className="relative flex min-h-[100dvh] flex-col items-center overflow-x-clip px-[var(--gutter)] text-center"
      style={{ paddingTop: "calc(var(--status-bar) + 26px)" }}
    >
      {/* light gathered behind the words, so gold reads on the bright upper sky */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60%]"
        style={{
          background:
            "radial-gradient(ellipse 85% 62% at 50% 34%, rgb(var(--ivory) / 0.8) 0%, rgb(var(--ivory) / 0.45) 52%, rgb(var(--ivory) / 0) 82%)",
          ...rise(0, 0, 1400),
        }}
      />

      {/* ── the card's words ── */}
      <p className="relative font-script text-[48px] leading-none text-gold-ink" style={rise(0)}>
        {copy.title}
      </p>
      <p
        className="relative mt-3 max-w-[18rem] text-balance font-display text-[16px] font-medium italic leading-snug text-slate"
        style={rise(1)}
      >
        {copy.blessing}
      </p>
      <h1
        id="invitation-names"
        className="relative mt-3 font-display text-[clamp(34px,10.4vw,44px)] font-semibold italic leading-tight text-navy"
        style={rise(2)}
      >
        <span className="text-balance">
          {couple.bride.displayName} <span className="font-medium text-gold-ink">&amp;</span> {couple.groom.displayName}
        </span>
      </h1>
      <p
        className="relative mt-1 max-w-[18rem] text-balance font-display text-[15px] italic leading-snug text-slate"
        style={rise(3)}
      >
        {copy.request}
      </p>
      {date && (
        <div className="relative mt-4 flex flex-col items-center" style={rise(4)}>
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
          style={rise(5)}
        >
          <Icon name="pin" className="h-4 w-4 text-gold-ink" /> {venue.city}
        </p>
      )}

      {/* ── Shiv and Parvati before Kailash, at the foot of the screen — last to rise in ── */}
      <div className="relative mt-auto w-full pt-6" style={rise(6, 28, 1300)}>
        <div
          aria-hidden
          className="absolute bottom-0 h-[min(105vw,480px)] w-screen"
          style={{ left: "calc(50% - 50vw)" }}
        >
          <Kailash className="h-full w-full" />
        </div>
        <div className="relative z-[1] mx-auto w-[min(78vw,350px)] [-webkit-mask-image:linear-gradient(#000_82%,transparent)] [mask-image:linear-gradient(#000_82%,transparent)]">
          <img
            src={assets.saveTheDateArt}
            alt="Shiva and Parvati together"
            className="block h-auto w-full"
            draggable={false}
          />
        </div>
      </div>

      {/* ── the two hands: they glide in, Shiva's settles over the bride's, then both fade into the sky ── */}
      <div
        ref={stage}
        aria-hidden
        className="opening-stage"
        style={skipped ? { opacity: 0, transition: "opacity 300ms ease-out" } : undefined}
      >
        <div className="opening-layer" style={together}>
          <div className="opening-layer opening-fade-bride" style={hand("bride")}>
            <img ref={parvati} src={assets.opening.parvatiHand} alt="" className="opening-layer" />
            <div className="opening-layer" style={touch}>
              <img
                src={assets.opening.shivaHand}
                alt=""
                className="opening-layer"
                style={{
                  transform: `translate(${REST.shiva.x - REST.bride.x + 0.6}%, ${REST.shiva.y - REST.bride.y + 1.5}%)`,
                  filter: "brightness(0) blur(4px)",
                }}
              />
            </div>
          </div>
          {/* Shiva's hand lies over hers, so it comes second */}
          <div className="opening-layer opening-fade-shiva" style={hand("shiva")}>
            <img ref={shiva} src={assets.opening.shivaHand} alt="" className="opening-layer" />
          </div>
        </div>
        <div className="opening-glow" data-waiting={beat < 0 || undefined} style={glow} />
      </div>

      {/* as the hands let go: a few gold motes drift outward from where they touched */}
      {reached("release") && !quiet && <GoldMotes pace={pace} />}

      {/* a short shower of red petals once the card is revealed */}
      {card && !quiet && <PetalShower />}

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
