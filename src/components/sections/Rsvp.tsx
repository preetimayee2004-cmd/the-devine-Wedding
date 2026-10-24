import { useMemo, useRef, useState, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { downloadIcs, googleCalendarUrl, weddingCalendarItem } from "@/lib/calendar";
import { Icon } from "@/components/art/Icons";
import { TempleBells, TempleSilhouette } from "@/components/art/Temple";

/**
 * Section 08 — "The Sacred Union": a divine wedding scene, drawn straight onto the deep night-blue
 * of the section (no card, no box: the blue runs edge to edge, softening into the page above and
 * below).
 *
 * At the top a gold trishul with a fine rule beneath it, temple bells hanging alike from the upper
 * corners. In the middle a temple arch in thin antique-gold lines, Mahadev and Maa Parvati within it
 * (the Save the Date painting's own figures), the pillars and the figures melting into the blue at
 * their foot, faint temples at the corners. Beneath: "A Sacred Celebration", the blessing and "Har
 * Har Mahadev"; then one maroon button, "Add to calendar" (Google Calendar or an .ics file of the
 * wedding as configured — and it says exactly what happened, never that the date is saved), and a
 * plain "Return to invitation" link back to the top. Nothing here claims an RSVP was recorded.
 *
 * Seen the first time (about 3.6s): the trishul and the bells; the arch draws itself (both pillars
 * rising, the upper arch from each side to its peak, a kalash, one gleam along it); Mahadev and Maa
 * Parvati appear from 97%; the heading, blessing and closing rise in; the button last. The page stays
 * usable throughout, and then all is still. Reduced motion: everything simply fades in.
 */

/** When each part comes in (ms from the section being seen). */
const AT = { trishul: 0, rule: 320, pillars: 600, arch: 1000, kalash: 1450, gleam: 1500, figures: 1700, heading: 2400, blessing: 2600, closing: 2800, button: 3150, link: 3300 };
const at = (ms: number) => ({ "--at": `${ms}ms` }) as CSSProperties;

type CalendarItem = NonNullable<ReturnType<typeof weddingCalendarItem>>;

export function Rsvp() {
  const { rsvp } = wedding;
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { threshold: 0.15 });
  const reduced = usePrefersReducedMotion();
  const calendar = useMemo(() => weddingCalendarItem(), []);

  return (
    <section
      id="rsvp"
      ref={ref}
      aria-labelledby="rsvp-heading"
      className="rs relative px-[var(--gutter)] pb-20 pt-16 text-center"
      data-shown={seen || undefined}
      data-still={reduced || undefined}
      data-bells={seen ? (reduced ? "still" : "in") : "hidden"}
    >
      {/* the blue, edge to edge, softening into the page above and below */}
      <div aria-hidden className="rs-bg" />
      <TempleBells />
      <TempleSilhouette className="rs-temple rs-temple-left" />
      <TempleSilhouette className="rs-temple rs-temple-right" />

      <div className="relative mx-auto flex max-w-[22.5rem] flex-col items-center">
        <div className="rs-in" style={at(AT.trishul)}>
          <Trishul />
        </div>
        <div className="rs-in" style={at(AT.rule)}>
          <Rule />
        </div>

        {/* the temple arch, and Mahadev and Maa Parvati within it */}
        <div className="rs-art">
          <span aria-hidden className="rs-glow" style={at(AT.figures)} />
          <img
            className="rs-figures"
            style={at(AT.figures)}
            src={wedding.assets.saveTheDateLayers.figures}
            alt="Mahadev and Maa Parvati: he gently touches her forehead as she bows her head, garlanded"
            width={572}
            height={1024}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
          <Arch />
        </div>

        <h2 id="rsvp-heading" className="rs-heading rs-in" style={at(AT.heading)}>
          {rsvp.title}
        </h2>
        <p className="rs-blessing rs-in" style={at(AT.blessing)}>
          {rsvp.blessing}
        </p>
        <p className="rs-closing rs-in" style={at(AT.closing)}>
          {rsvp.closing}
        </p>

        {calendar && (
          <div className="rs-in mt-8 flex flex-col items-center" style={at(AT.button)}>
            <AddToCalendar calendar={calendar} label={rsvp.calendarButton} />
          </div>
        )}
        <a href="#invitation" className="rs-return rs-in" style={at(AT.link)}>
          {rsvp.returnLink}
        </a>
      </div>
    </section>
  );
}

/** "Add to calendar": opens two choices, and says exactly what each one did. */
function AddToCalendar({ calendar, label }: { calendar: CalendarItem; label: string }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const google = () => {
    window.open(googleCalendarUrl(calendar), "_blank", "noopener,noreferrer");
    setFeedback("Google Calendar has opened in a new tab — tap Save there to keep the date.");
  };
  const ics = () => {
    downloadIcs(calendar);
    setFeedback("A calendar file (.ics) has been downloaded — open it to add the wedding to your calendar.");
  };
  return (
    <>
      <button type="button" className="rs-btn" aria-expanded={open} aria-controls="rs-calendar" onClick={() => setOpen((o) => !o)}>
        <Icon name="calendar" className="h-4 w-4" strokeWidth={1.5} />
        {label}
      </button>
      {open && (
        <div id="rs-calendar" className="rs-options">
          <button type="button" className="rs-chip" onClick={google}>
            Google Calendar
          </button>
          <button type="button" className="rs-chip" onClick={ics}>
            Apple · Outlook (.ics)
          </button>
        </div>
      )}
      <p className="rs-feedback" aria-live="polite">
        {feedback}
      </p>
    </>
  );
}

/**
 * The temple arch, in fine antique gold (300 × 400): two pillars rising together, their feet melting
 * into the blue; the upper arch drawn from each pillar's top to meet at its peak (an outer line and a
 * finer inner one); a small kalash on the peak; and one gleam running along the arch.
 */
function Arch() {
  const draw = (start: number, dur: number) => ({ "--at": `${start}ms`, "--dur": `${dur}ms` }) as CSSProperties;
  const half = "M36 166C36 122 86 100 116 78 134 64 144 48 150 28";
  const halfIn = "M48 172C48 132 94 112 121 92 137 80 146 66 150 50";
  const mirror = (d: string) => d.replace(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${300 - Number(x)} ${y}`);
  return (
    <svg aria-hidden className="rs-arch" viewBox="0 0 300 400" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {[0, 1].map((side) => {
        const x = (v: number) => (side ? 300 - v : v);
        return (
          <g key={side}>
            {/* the pillar: two lines rising (from below, where they melt into the blue) to the capital */}
            <path className="rs-stroke" pathLength={1} d={`M${x(28)} 400V172`} style={draw(AT.pillars, 520)} />
            <path className="rs-stroke rs-fine" pathLength={1} d={`M${x(44)} 400V176`} style={draw(AT.pillars + 50, 500)} />
            <path className="rs-stroke" pathLength={1} d={`M${x(22)} 172H${x(50)}M${x(25)} 178H${x(47)}`} style={draw(AT.arch - 70, 200)} />
            {/* the arch, from the pillar's top to the peak */}
            <path className="rs-stroke" pathLength={1} d={side ? mirror(half) : half} style={draw(AT.arch, 480)} />
            <path className="rs-stroke rs-fine" pathLength={1} d={side ? mirror(halfIn) : halfIn} style={draw(AT.arch + 60, 440)} />
          </g>
        );
      })}
      {/* the kalash on the peak */}
      <g className="rs-kalash" style={{ "--at": `${AT.kalash}ms` } as CSSProperties}>
        <path d="M150 28V18M150 22c-4-2-7-1-8 2M150 22c4-2 7-1 8 2" stroke="#b89554" strokeWidth="1.2" />
        <circle cx="150" cy="14" r="3.2" stroke="#d4b26e" strokeWidth="1.2" fill="#d4b26e" fillOpacity="0.35" />
      </g>
      {/* one gleam running along the arch, left to right */}
      <path className="rs-gleam" pathLength={1} style={{ "--at": `${AT.gleam}ms` } as CSSProperties} d={`${half}C156 48 166 64 184 78 214 100 264 122 264 166`} />
    </svg>
  );
}

/** Mahadev's trishul, in fine gold line. */
function Trishul() {
  return (
    <svg aria-hidden viewBox="0 0 32 46" className="mx-auto h-[52px] w-9" fill="none" stroke="#d4b26e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* the middle blade, the two curving side prongs, the shaft */}
      <path d="M16 2.5 13.6 9 16 15l2.4-6Z" fill="#d4b26e" fillOpacity="0.35" />
      <path d="M16 15v29" />
      <path d="M16 17.5c-6.2 0-9-4.2-8.6-11.5M16 17.5c6.2 0 9-4.2 8.6-11.5" />
      <path d="M7.4 6 6 2.5 5.2 7.4M24.6 6 26 2.5l.8 4.9" />
      {/* the binding where the prongs meet the shaft */}
      <path d="M13.2 21h5.6M13.6 23.4h4.8" strokeWidth="1.1" />
      <circle cx="16" cy="44" r="1" fill="#d4b26e" stroke="none" />
    </svg>
  );
}

/** The fine gold rule under the trishul, a small ornament in its middle. */
function Rule() {
  return (
    <svg aria-hidden viewBox="0 0 160 10" className="mx-auto mt-2 h-[10px] w-40" fill="none">
      <defs>
        <linearGradient id="rs-rule" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="160" y2="0">
          <stop offset="0" stopColor="#b89554" stopOpacity="0" />
          <stop offset="0.5" stopColor="#b89554" />
          <stop offset="1" stopColor="#b89554" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 5h68M92 5h68" stroke="url(#rs-rule)" strokeWidth="0.8" />
      <circle cx="72" cy="5" r="1.1" fill="#b89554" />
      <circle cx="88" cy="5" r="1.1" fill="#b89554" />
      <path d="M80 1.2 83.8 5 80 8.8 76.2 5Z" fill="#d4b26e" fillOpacity="0.4" stroke="#d4b26e" strokeWidth="0.8" />
    </svg>
  );
}
