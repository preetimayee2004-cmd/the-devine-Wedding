import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { REDUCED_MOTION_QUERY } from "@/hooks/useMediaQuery";
import { useLang } from "@/lib/lang";
import { directionsUrl } from "@/lib/maps";
import { EASE, MOTION } from "@/lib/motion";
import { glideTo, USER_INPUT_EVENTS } from "@/lib/scroll";
import { readSessionFlag, writeSessionFlag } from "@/lib/session";
import { formatVenueDate, parseVenueDateTime } from "@/lib/venueTime";
import { Icon } from "@/components/art/Icons";
import { GoldMotes } from "@/components/ui/GoldMotes";
import { LangToggle } from "@/components/ui/LangToggle";
import { MusicToggle } from "@/components/ui/MusicToggle";
import { OnwardLink } from "@/components/ui/OnwardLink";
import { OpeningGate } from "@/components/ui/OpeningGate";
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
 *   reveal   the card rises in, top to bottom: the names, the date and the
 *            venue (a map link); then the painting of Mahadev blessing Maa
 *            Parvati before the Himalaya, down to the very foot of the
 *            screen, with the blessing line and "View the Invitation" over
 *            its lower edge; a few petals fall
 *
 * The card reads in English or Hindi (the EN / हिं switch), clouds part
 * gently as the guest scrolls, the moon in Mahadev's hair glows softly, and
 * the bell in the corner plays a soft temple dhun — only when tapped.
 *
 * The hands are the painted artwork, only moved and faded — never stretched
 * or redrawn. Never a gate: Skip is always there, a guest who already watched
 * it this visit gets a quicker version, and reduced motion shows the finished
 * card. Once read, the page glides on to the next section.
 */

const SEEN_KEY = "dw:opening-seen";
const GATE_KEY = "dw:gate-seen";

/** The gate shows once per browser session (always with ?opening=full, for reviewing). */
function showGate(): boolean {
  if (new URLSearchParams(window.location.search).get("opening") === "full") return true;
  return !readSessionFlag(GATE_KEY);
}

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

  // ── the gate: the ॐ seal and "Touch to begin" come first, once a session; its tap starts the opening ──
  const [gate, setGate] = useState<"show" | "leaving" | "gone">(() => (showGate() ? "show" : "gone"));
  const started = gate !== "show";
  const leaveGate = () => {
    writeSessionFlag(GATE_KEY);
    setGate("leaving");
  };

  // ── the timeline ──
  useEffect(() => {
    if (!started) return;
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
  }, [mode, pace, started]);

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

  // Save the Date → the next section: after reading time, glide on — unless the
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

  // ── the card's language: English or Hindi, remembered on this phone ──
  const hindi = useLang() === "hi";

  const date = useMemo(() => {
    const parts = parseVenueDateTime(wedding.wedding.dateTime);
    return parts ? formatVenueDate(parts, hindi ? "hi-IN" : "en-IN") : null;
  }, [hindi]);

  // the gate's date, "12 · 02 · 2027"
  const gateDate = useMemo(() => {
    const p = parseVenueDateTime(wedding.wedding.dateTime);
    const two = (n: number) => String(n).padStart(2, "0");
    return p ? `${two(p.day)} · ${two(p.month)} · ${p.year}` : null;
  }, []);

  const { invitation: copy, couple, venue, assets } = wedding;
  const t = hindi
    ? { ...copy.hindi, bride: copy.hindi.names.bride, groom: copy.hindi.names.groom }
    : {
        ...copy,
        bride: couple.bride.displayName,
        groom: couple.groom.displayName,
        venue: [venue.name, venue.city].filter(Boolean).join(", "),
      };
  // Hindi lines are set in the Devanagari face; English in the serif (the script is only for the title)
  const serif = hindi ? "font-deva" : "font-display";

  // ── as the guest scrolls on, the clouds part ──
  const cloudLeft = useRef<HTMLImageElement>(null);
  const cloudRight = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!done || still) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = Math.min(window.scrollY, window.innerHeight);
        if (cloudLeft.current) cloudLeft.current.style.transform = `translate3d(${-y * 0.14}px, ${-y * 0.3}px, 0)`;
        if (cloudRight.current) cloudRight.current.style.transform = `translate3d(${y * 0.14}px, ${-y * 0.22}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [done, still]);

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
      lang={hindi ? "hi" : undefined}
      aria-labelledby="invitation-names"
      className="save-the-date relative flex flex-col items-center overflow-x-clip px-[var(--gutter)] text-center"
      style={{ paddingTop: "max(var(--std-top), calc(var(--status-bar) + 24px))" }}
    >
      {/* light gathered behind the words, so they read clearly on the bright upper sky */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60%]"
        style={{
          background:
            "radial-gradient(ellipse 85% 62% at 50% 34%, rgb(var(--ivory) / 0.88) 0%, rgb(var(--ivory) / 0.56) 52%, rgb(var(--ivory) / 0) 82%)",
          ...rise(0, 0, 1400),
        }}
      />

      {/* EN / हिं — the card in English or Hindi */}
      <LangToggle
        className="absolute left-4 transition-opacity duration-500"
        style={{ top: "calc(var(--status-bar) + 12px)", opacity: card ? 1 : 0, pointerEvents: card ? undefined : "none" }}
      />

      {/* ── the card's words, above the painting: names first, then the date, then the place ── */}
      <div
        className="std-words relative z-[2] flex w-full flex-col items-center"
        style={{ pointerEvents: card ? undefined : "none" }}
      >
        <p
          className={`relative leading-none text-gold-ink ${hindi ? "font-deva text-[length:var(--std-title-deva)]" : "font-script text-[length:var(--std-title)]"}`}
          style={rise(0)}
        >
          {t.title}
        </p>
        {/* the names, one above the other — never cut or pushed off the screen, however long */}
        <h1
          id="invitation-names"
          className={`relative mt-[var(--std-gap)] flex w-full flex-col items-center text-[length:var(--std-names)] font-semibold leading-[1.05] text-navy [overflow-wrap:anywhere] ${hindi ? "font-deva" : "font-display italic"}`}
          style={rise(1)}
        >
          <span className="block max-w-full">{t.bride}</span>
          <span className="block font-display text-[0.55em] font-medium not-italic leading-[1.05] text-gold-ink">
            &amp;
          </span>
          <span className="block max-w-full">{t.groom}</span>
        </h1>
        <p
          className={`relative mt-[var(--std-gap)] max-w-[19rem] text-balance text-[15px] font-medium leading-snug text-slate ${serif} ${hindi ? "" : "italic"}`}
          style={rise(2)}
        >
          {t.request}
        </p>

        {/* the date on one line: month | day | year */}
        {date && (
          <p
            className={`relative mt-[var(--std-gap)] flex items-center justify-center gap-3.5 font-semibold text-navy ${serif}`}
            style={rise(3)}
          >
            <span className={`text-[15px] ${hindi ? "" : "uppercase tracking-[0.24em]"}`}>{date.month}</span>
            <span aria-hidden className="h-7 w-px bg-gold" />
            <span className="font-display text-[24px] leading-none">{date.day}</span>
            <span aria-hidden className="h-7 w-px bg-gold" />
            <span className="font-display text-[15px] tracking-[0.24em]">{date.year}</span>
          </p>
        )}

        {/* the venue: tap for directions (the tap area is taller than the line, so its top margin is less) */}
        {t.venue && (
          <a
            href={directionsUrl(venue)}
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative mt-[calc(var(--std-gap)-10px)] inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-[15px] font-semibold text-navy transition-colors duration-300 hover:bg-ivory/60 ${serif}`}
            style={rise(4)}
          >
            <Icon name="pin" className="h-[18px] w-[18px] shrink-0 text-gold-ink" />
            <span className="underline decoration-gold/70 decoration-dotted decoration-1 underline-offset-[5px] group-hover:decoration-solid">
              {t.venue}
            </span>
            <Icon name="external" className="h-3.5 w-3.5 shrink-0 text-gold-ink" />
          </a>
        )}
      </div>

      {/* ── Mahadev blessing Maa Parvati before the Himalaya: edge to edge across the foot of the screen,
          from just under the words (and at least 58% of the screen), its top melting into the sky ── */}
      <div className="relative min-h-0 w-full flex-1">
        <div className="std-painting absolute bottom-0" style={rise(6, 28, 1300)}>
          <img
            src={assets.saveTheDateArt}
            alt="Mahadev gently blessing Maa Parvati, before the snowy Himalaya and a lotus lake"
            width={assets.saveTheDateArtSize.width}
            height={assets.saveTheDateArtSize.height}
            className="block h-full w-full object-cover"
            draggable={false}
          />
          {/* the crescent moon in Mahadev's hair, softly aglow */}
          <span aria-hidden className="std-moon" />
          {/* light clouds drifting over the peaks; they part as the guest scrolls */}
          <img
            ref={cloudLeft}
            src={assets.clouds}
            alt=""
            aria-hidden
            className="std-cloud left-[-22%] top-[3%] w-[70%]"
            draggable={false}
          />
          <img
            ref={cloudRight}
            src={assets.clouds}
            alt=""
            aria-hidden
            className="std-cloud right-[-22%] top-[9%] w-[60%]"
            style={{ scale: "-1 1" }}
            draggable={false}
          />
        </div>
      </div>

      {/* ── at the foot, on a dark-navy panel over the painting: the blessing, and the way on ── */}
      <div
        className="std-foot pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex flex-col items-center px-6 pb-[calc(env(safe-area-inset-bottom,0px)+18px)] pt-12"
        style={rise(7, 12)}
      >
        <p className={`max-w-[21rem] text-balance text-[15px] leading-snug text-white ${serif} ${hindi ? "" : "italic"}`}>
          {t.blessing}
        </p>
        <OnwardLink
          to="couple"
          label={t.viewInvitation}
          devanagari={hindi}
          style={{ marginTop: 8, pointerEvents: card ? undefined : "none" }}
        />
      </div>

      {/* before it all, on a first visit: "Touch to begin" */}
      {gate !== "gone" && (
        <OpeningGate
          seal={assets.omSeal}
          clouds={assets.clouds}
          invited={t.youreInvited}
          names={{ bride: t.bride, groom: t.groom }}
          date={gateDate}
          label={t.touchToBegin}
          devanagari={hindi}
          reduced={still}
          onBegin={leaveGate}
          onSkip={() => {
            skip();
            leaveGate();
          }}
          onGone={() => setGate("gone")}
        />
      )}

      {/* soft temple bells, off until tapped — in the corner once the opening is over */}
      <MusicToggle visible={!locked} />

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
          className={`fixed right-4 z-40 rounded-full border border-gold/70 bg-ivory/75 px-4 py-1.5 font-display text-[15px] font-semibold tracking-[0.08em] text-navy backdrop-blur-sm transition-opacity duration-500 hover:bg-ivory/90 ${beat >= 0 ? "opacity-100" : "pointer-events-none opacity-0"}`}
          style={{ top: "calc(var(--status-bar) + 12px)" }}
        >
          Skip <span aria-hidden>›</span>
        </button>
      )}
    </section>
  );
}
