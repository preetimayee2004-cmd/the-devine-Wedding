import { useEffect, useMemo, useState } from "react";
import { wedding } from "@/config/wedding";
import { useGuest } from "@/context/GuestContext";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { EASE } from "@/lib/motion";
import { glideTo, USER_INPUT_EVENTS } from "@/lib/scroll";
import { formatVenueDate, parseVenueDateTime } from "@/lib/venueTime";
import { Ganpati } from "@/components/art/Ganpati";
import { Emblem } from "@/components/ui/Emblem";
import { OrnamentDivider } from "@/components/ui/OrnamentDivider";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Section 01 — an auspicious beginning (PRD §4).
 *
 * The opening's gold emblem lands in the medallion at the top, opens into
 * a ring, and Ganpati draws himself inside it. Then the mantra, the
 * blessing, the quote, the guest's greeting and the couple's names arrive
 * in a gentle stagger, closed by the date and a gold thread leading down.
 * Once it has been read, it glides up and the couple's section rises in.
 */

type Phase = "hidden" | "emblem" | "open";

/** The emblem's rings (60px) as a fraction of the medallion's rings (124px). */
const RING_SCALE = 0.469;
/** How long the landed emblem rests before opening. */
const EMBLEM_REST_MS = 560;
/** From the medallion opening until the whole invitation is on screen. */
const STAGGER_MS = 2800;

export function Invitation({ revealed }: { revealed: boolean }) {
  const { guestName } = useGuest();
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("hidden");

  useEffect(() => {
    if (!revealed) {
      setPhase("hidden");
      return;
    }
    if (reduced) {
      setPhase("open");
      return;
    }
    setPhase("emblem");
    const t = window.setTimeout(() => setPhase("open"), EMBLEM_REST_MS);
    return () => clearTimeout(t);
  }, [revealed, reduced]);

  const open = phase === "open";

  // Invitation → Hero (PRD §5): after reading time, glide up to the couple —
  // unless the guest has already touched, scrolled or pressed anything.
  useEffect(() => {
    const readingMs = wedding.invitation.autoAdvanceMs;
    if (!open || reduced || !readingMs) return;
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
    }, STAGGER_MS + readingMs);
    return () => {
      clearTimeout(timer);
      stopGlide();
      USER_INPUT_EVENTS.forEach((type) => window.removeEventListener(type, onInput));
    };
  }, [open, reduced]);

  // The stagger, in ms after the medallion opens (all at once with reduced motion).
  const at = (ms: number) => (reduced ? 0 : ms);

  const date = useMemo(() => {
    const parts = parseVenueDateTime(wedding.wedding.dateTime);
    return parts ? formatVenueDate(parts) : null;
  }, []);

  const { invitation: copy, couple } = wedding;
  const greeting = copy.greeting.replace("{guest}", guestName);

  return (
    <section
      aria-labelledby="invitation-names"
      className="relative flex min-h-[100dvh] flex-col items-center px-[var(--gutter)] text-center"
      style={{ paddingTop: "calc(var(--status-bar) + 24px)" }}
    >
      {/* The invitation sits in the middle of the screen; the gold thread below leads on */}
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <div className="relative flex w-full flex-col items-center">
          {/* Light gathered behind the invitation, so gold reads on the bright upper sky */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 bottom-[-4rem] left-1/2 w-screen -translate-x-1/2"
            style={{
              background:
                "radial-gradient(ellipse 80% 42% at 50% 30%, rgb(var(--ivory) / 0.78) 0%, rgb(var(--ivory) / 0.5) 45%, rgb(var(--ivory) / 0) 82%)",
              opacity: revealed ? 1 : 0,
              transition: `opacity 1400ms ${EASE.silk}`,
            }}
          />

          <Medallion phase={phase} reduced={reduced} />

          <Reveal
            show={open}
            delay={at(700)}
            as="p"
            className="relative mt-3 font-deva text-[21px] leading-snug text-gold-ink"
          >
            <span lang="sa">{copy.mantra}</span>
          </Reveal>
          <Reveal
            show={open}
            delay={at(850)}
            as="p"
            className="relative mt-1 font-sans text-[11px] font-medium uppercase tracking-eyebrow text-slate"
          >
            {copy.blessing}
          </Reveal>

          <Reveal
            show={open}
            delay={at(1050)}
            as="blockquote"
            className="relative mt-6 max-w-[19rem] whitespace-pre-line text-balance font-display text-[21px] font-medium italic leading-snug text-slate short:mt-4"
          >
            “{copy.quote}”
          </Reveal>

          <Reveal
            show={open}
            delay={at(1300)}
            as="p"
            className="relative mt-7 font-display text-[25px] font-medium italic text-navy short:mt-5"
          >
            {greeting}
          </Reveal>

          <h1 id="invitation-names" className="relative mt-1 flex flex-col items-center">
            <Reveal show={open} delay={at(1450)} as="span" className="names-display">
              {couple.bride.displayName}
            </Reveal>
            <Reveal
              show={open}
              delay={at(1570)}
              as="span"
              className="-my-0.5 block font-display text-[38px] font-medium italic leading-none text-gold-ink"
            >
              &amp;
            </Reveal>
            <Reveal show={open} delay={at(1690)} as="span" className="names-display">
              {couple.groom.displayName}
            </Reveal>
          </h1>

          <Reveal
            show={open}
            delay={at(1900)}
            as="p"
            className="relative mt-3 max-w-[17rem] text-balance font-sans text-[15px] leading-relaxed text-slate"
          >
            {copy.request}
          </Reveal>

          <OrnamentDivider show={open} delay={at(2050)} className="relative mt-6 short:mt-4" />

          {date && (
            <Reveal show={open} delay={at(2200)} className="relative mt-3">
              <p className="font-sans text-[11px] font-medium uppercase tracking-eyebrow text-gold-ink">
                {date.weekday}
              </p>
              <p className="mt-0.5 font-display text-[28px] font-semibold leading-tight text-gold-ink">
                {date.day} {date.month} {date.year}
              </p>
            </Reveal>
          )}
        </div>
      </div>

      {/* The gold thread continues down into the couple's section */}
      <div className="relative mt-auto flex flex-col items-center pt-8">
        <Reveal
          show={open}
          delay={at(2500)}
          as="p"
          className="font-sans text-[10px] font-medium uppercase tracking-eyebrow text-slate"
        >
          Scroll
        </Reveal>
        <span
          aria-hidden
          className="mt-2 block h-16 w-px bg-gradient-to-b from-gold-ink/70 to-gold"
          style={{
            transformOrigin: "top",
            transform: open ? "scaleY(1)" : "scaleY(0)",
            transition: `transform 1400ms ${EASE.silk} ${at(2650)}ms`,
          }}
        />
      </div>
    </section>
  );
}

/**
 * Where the opening's emblem lands (`data-emblem-target`). It rests a moment,
 * then grows into the medallion's rings while Ganpati draws in.
 */
function Medallion({ phase, reduced }: { phase: Phase; reduced: boolean }) {
  const open = phase === "open";
  const grow = `transform 900ms ${EASE.silk}`;

  return (
    <div className="relative h-[124px] w-[124px] shrink-0">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "scale(1)" : `scale(${RING_SCALE})`,
          transition: `${grow}, opacity 600ms ease-out`,
        }}
      >
        <MedallionRings />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          data-emblem-target
          aria-hidden
          style={{
            opacity: phase === "emblem" ? 1 : 0,
            transform: open ? `scale(${1 / RING_SCALE})` : "scale(1)",
            transition: `${grow}, opacity 450ms ease-out`,
          }}
        >
          <Emblem />
        </div>
      </div>

      <Ganpati
        drawn={open}
        still={reduced}
        delay={reduced ? 0 : 150}
        className="absolute left-1/2 top-1/2 w-[86px] -translate-x-1/2 -translate-y-[52%]"
      />
    </div>
  );
}

function MedallionRings() {
  const dots = [0, 90, 180, 270].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return [62 + 58 * Math.sin(rad), 62 - 58 * Math.cos(rad)];
  });
  return (
    <svg viewBox="0 0 124 124" className="h-full w-full">
      <defs>
        <radialGradient id="medallion-light">
          <stop offset="0" stopColor="rgb(var(--ivory))" stopOpacity="0.85" />
          <stop offset="1" stopColor="rgb(var(--ivory))" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <circle cx="62" cy="62" r="50" fill="url(#medallion-light)" />
      <circle cx="62" cy="62" r="58" fill="none" stroke="rgb(var(--gold))" strokeWidth="1" />
      <circle cx="62" cy="62" r="50" fill="none" stroke="rgb(var(--gold))" strokeWidth="0.6" opacity="0.7" />
      {dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="rgb(var(--gold))" />
      ))}
    </svg>
  );
}
