import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { wedding } from "@/config/wedding";
import { useGuest, usePersonal } from "@/context/GuestContext";
import { useElementSize } from "@/hooks/useElementSize";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { acceptInvitation, BackendError, type Acceptance } from "@/lib/backend";
import { downloadIcs, googleCalendarUrl, weddingCalendarItem } from "@/lib/calendar";
import { Icon } from "@/components/art/Icons";
import { TempleBells, TempleSilhouette } from "@/components/art/Temple";

/**
 * Section 08 — "The Sacred Union": a divine wedding scene, drawn straight onto the page's own sky
 * (mist-blue warming into ivory, as every section) — no card, no box.
 *
 * At the top a gold trishul with a fine rule beneath it, temple bells hanging alike from the upper
 * corners. Beneath them, first, the invitation: "A Sacred Celebration", one line, and one maroon
 * button, "Join the Celebration →". Tapped (once; more taps are ignored), the acceptance is sent —
 * saved to the family's database when there is one — and only when that has succeeded does the
 * invitation give way to the scene (if it fails, the button stays, with the reason). Nothing is
 * remembered on the phone: every visit, a reload too, starts with the button.
 *
 * The scene: a temple arch in thin antique-gold lines, Mahadev and Maa Parvati within it
 * (the couple's chosen painting of Mahadev holding Maa Parvati close), the pillars and the figures melting into the sky at
 * their foot, faint temples at the corners. Beneath: "A Sacred Celebration", the blessing and "Har
 * Har Mahadev"; then one maroon button, "Add to calendar" (Google Calendar or an .ics file of the
 * wedding as configured — and it says exactly what happened, never that the date is saved), and a
 * an honest note — the family has it (with a
 * database) or the guest should tell them too (without one).
 *
 * Seen the first time: the trishul and the bells, the heading and its line, the button last. Opened
 * (about 3s): the arch draws itself (both pillars rising, the upper arch from each side to its peak, a
 * kalash, one gleam along it); Mahadev and Maa Parvati appear from 97%; the heading, blessing and
 * closing rise in; the calendar button last. Then all is still. Reduced motion: plain fades.
 */

/** When each part comes in (ms): the invitation from the section being seen, the scene from its opening. */
const AT = {
  trishul: 0,
  rule: 320,
  shivling: 260,
  title: 620,
  message: 760,
  divider: 900,
  label: 1040,
  nandi: 1400,
  pillars: 200,
  arch: 600,
  kalash: 1050,
  gleam: 1100,
  figures: 1300,
  heading: 2000,
  blessing: 2200,
  closing: 2400,
  button: 2750,
  link: 2900,
};
/** The invitation fades away this long (ms) before the scene opens in its place. */
const LEAVE = 320;
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const at = (ms: number) => ({ "--at": `${ms}ms` }) as CSSProperties;

type CalendarItem = NonNullable<ReturnType<typeof weddingCalendarItem>>;

type Phase = "idle" | "sending" | "leaving" | "open";

export function Rsvp() {
  const { rsvp } = wedding;
  const { guestName, fromLink } = useGuest();
  const personal = usePersonal();
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { threshold: 0.15 });
  const reduced = usePrefersReducedMotion();
  const calendar = useMemo(() => weddingCalendarItem(), []);
  const [phase, setPhase] = useState<Phase>("idle");
  const [acceptance, setAcceptance] = useState<Acceptance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const accept = async () => {
    if (busy.current || phase !== "idle") return;
    busy.current = true;
    setPhase("sending");
    setError(null);
    try {
      // tied to the name from the link only (never the sample name)
      const a = await acceptInvitation(guestName, fromLink ? guestName : null);
      // saved: only now the invitation fades and the scene opens in its place
      setAcceptance(a);
      setPhase("leaving");
      if (!reduced) await pause(LEAVE);
      setPhase("open");
    } catch (e) {
      setError(e instanceof BackendError ? e.message : "Something went wrong. Please try again.");
      setPhase("idle");
    } finally {
      busy.current = false;
    }
  };
  const open = phase === "open";

  return (
    <section
      id="rsvp"
      ref={ref}
      aria-labelledby="rsvp-heading"
      className="rs relative px-[var(--gutter)] pb-14 pt-16 text-center"
      data-shown={seen || undefined}
      data-still={reduced || undefined}
      data-bells={seen ? (reduced ? "still" : "in") : "hidden"}
      data-open={open || undefined}
    >
      <TempleBells />
      <Garland />
      <GarlandFlower />
      <BelLeaves />
      <TempleSilhouette className="rs-temple rs-temple-left" />
      <TempleSilhouette className="rs-temple rs-temple-right" />

      <div className="relative mx-auto flex max-w-[22.5rem] flex-col items-center">
        {open ? (
          <>
            <div className="rs-in" style={at(AT.trishul)}>
              <img className="rs-trishul" src={wedding.assets.rsvpTrishul} alt="" aria-hidden draggable={false} width={188} height={328} />
            </div>
            <div className="rs-in" style={at(AT.rule)}>
              <Rule />
            </div>
          </>
        ) : (
          /* the pot on its chain, hung from the garland's flower, a drop falling now and then onto the Shivling */
          <div className="rs-in rs-pot-wrap" style={at(AT.trishul)} data-leaving={phase === "leaving" || undefined}>
            <img className="rs-pot" src={wedding.assets.rsvpPot} alt="" aria-hidden draggable={false} width={180} height={299} />
            <span aria-hidden className="rs-drop" />
          </div>
        )}

        {!open ? (
          /* the invitation */
          <div className="rs-invite flex w-full flex-col items-center" data-leaving={phase === "leaving" || undefined}>
            <img
              className="rs-shivling rs-in"
              style={at(AT.shivling)}
              src={wedding.assets.rsvpShivling}
              alt="A Shivling with a bel leaf on top and the tripundra, water flowing from its spout"
              draggable={false}
              width={310}
              height={345}
            />
            <h2 id="rsvp-heading" className="rs-title rs-in" style={at(AT.title)}>
              {rsvp.title}
            </h2>
            <p className="rs-message rs-in" style={at(AT.message)}>
              {personal(rsvp.messageFor, rsvp.message)}
            </p>
            <div className="rs-in" style={at(AT.divider)}>
              <LotusDivider />
            </div>

            {/* the label: "Your presence is our blessing" and the button, in a fine gold frame */}
            <div className="rs-in w-full" style={at(AT.label)}>
              <Label>
                <p className="rs-presence">
                  <Spark />
                  {rsvp.presence}
                  <Spark />
                </p>
                <div className="rs-join">
                  <Sprig />
                  <button
                    type="button"
                    className="rs-btn"
                    onClick={accept}
                    aria-disabled={phase !== "idle" || undefined}
                    data-phase={phase}
                  >
                    {phase === "sending" ? "Sending your joy…" : error ? "Try again" : rsvp.button}
                    <svg
                      aria-hidden
                      viewBox="0 0 20 10"
                      className="rs-btn-arrow"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 5h17M14 1.5 18 5l-4 3.5" />
                    </svg>
                  </button>
                  <Sprig flip />
                </div>
                {error && (
                  <p role="alert" className="mx-auto mt-3 max-w-[18rem] text-[13.5px] leading-snug text-[#9a3b2e]">
                    We couldn't send your acceptance. {error}
                  </p>
                )}
              </Label>
            </div>
          </div>
        ) : (
          <Scene
            calendar={calendar}
            note={
              acceptance?.savedTo === "remote"
                ? personal(rsvp.reachedFor, rsvp.reached)
                : personal(rsvp.tellFamilyFor, rsvp.tellFamily)
            }
          />
        )}

        {/* Nandi, just beneath the panel, facing straight forward */}
        <div className="rs-in" style={at(open ? AT.link + 300 : AT.nandi)}>
          <img className="rs-nandi" src={wedding.assets.rsvpNandi} alt="Nandi seated facing forward in fine gold line, adorned with jewels and a drape, on a base of gold curls, flowers and a lotus" draggable={false} width={780} height={504} />
        </div>
      </div>
    </section>
  );
}

/** The scene that opens once the acceptance is saved (its parts timed from the moment it opens). */
function Scene({ calendar, note }: { calendar: CalendarItem | null; note: string }) {
  const { rsvp } = wedding;
  const personal = usePersonal();
  return (
    <div className="rs-scene flex flex-col items-center" aria-live="polite">
      {/* the temple arch, and Mahadev and Maa Parvati within it */}
      <div className="rs-art">
        <span aria-hidden className="rs-glow" style={at(AT.figures)} />
        <img
          className="rs-figures"
          style={at(AT.figures)}
          src={wedding.assets.rsvpCouple}
          alt="Mahadev holding Maa Parvati close, both with eyes closed, jasmine in her hair and the crescent moon in his"
          width={wedding.assets.rsvpCoupleSize.width}
          height={wedding.assets.rsvpCoupleSize.height}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <Arch />
      </div>

      <p className="rs-thanks rs-in" style={at(AT.heading - 150)}>
        {personal(rsvp.thanksFor, rsvp.thanks)}
      </p>
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
      <p className="rs-note rs-in" style={at(AT.link)}>
        {note}
      </p>
    </div>
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
      <button
        type="button"
        className="rs-btn"
        aria-expanded={open}
        aria-controls="rs-calendar"
        onClick={() => setOpen((o) => !o)}
      >
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
  const mirror = (d: string) =>
    d.replace(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${300 - Number(x)} ${y}`);
  return (
    <svg aria-hidden className="rs-arch" viewBox="0 0 300 400" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {[0, 1].map((side) => {
        const x = (v: number) => (side ? 300 - v : v);
        return (
          <g key={side}>
            {/* the pillar: two lines rising (from below, where they melt into the blue) to the capital */}
            <path className="rs-stroke" pathLength={1} d={`M${x(28)} 400V172`} style={draw(AT.pillars, 520)} />
            <path className="rs-stroke rs-fine" pathLength={1} d={`M${x(44)} 400V176`} style={draw(AT.pillars + 50, 500)} />
            <path
              className="rs-stroke"
              pathLength={1}
              d={`M${x(22)} 172H${x(50)}M${x(25)} 178H${x(47)}`}
              style={draw(AT.arch - 70, 200)}
            />
            {/* the arch, from the pillar's top to the peak */}
            <path className="rs-stroke" pathLength={1} d={side ? mirror(half) : half} style={draw(AT.arch, 480)} />
            <path
              className="rs-stroke rs-fine"
              pathLength={1}
              d={side ? mirror(halfIn) : halfIn}
              style={draw(AT.arch + 60, 440)}
            />
          </g>
        );
      })}
      {/* the kalash on the peak */}
      <g className="rs-kalash" style={{ "--at": `${AT.kalash}ms` } as CSSProperties}>
        <path d="M150 28V18M150 22c-4-2-7-1-8 2M150 22c4-2 7-1 8 2" stroke="#b89554" strokeWidth="1.2" />
        <circle cx="150" cy="14" r="3.2" stroke="#a8741f" strokeWidth="1.2" fill="#c9a45c" fillOpacity="0.45" />
      </g>
      {/* one gleam running along the arch, left to right */}
      <path
        className="rs-gleam"
        pathLength={1}
        style={{ "--at": `${AT.gleam}ms` } as CSSProperties}
        d={`${half}C156 48 166 64 184 78 214 100 264 122 264 166`}
      />
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
      <path d="M80 1.2 83.8 5 80 8.8 76.2 5Z" fill="#c9a45c" fillOpacity="0.45" stroke="#a8741f" strokeWidth="0.8" />
    </svg>
  );
}

/** A fine gold rule with a lotus in its middle and a bead either side. */
function LotusDivider() {
  return (
    <svg aria-hidden viewBox="0 0 220 22" className="rs-divider" fill="none">
      <path d="M8 13h82M130 13h82" stroke="#b89554" strokeOpacity="0.8" strokeWidth="0.8" />
      <circle cx="96" cy="13" r="1.3" fill="#b89554" />
      <circle cx="124" cy="13" r="1.3" fill="#b89554" />
      <g fill="#e9d29a" fillOpacity="0.55" stroke="#a8741f" strokeWidth="0.8" strokeLinejoin="round">
        <path d="M110 19C105.4 18.4 101.8 15.4 100.8 11 105.2 11.4 108.4 14.4 110 19Z" />
        <path d="M110 19C114.6 18.4 118.2 15.4 119.2 11 114.8 11.4 111.6 14.4 110 19Z" />
        <path d="M110 19C107.6 15.8 106.6 11.6 107.4 7.2 109.4 10.4 110.2 14.6 110 19Z" />
        <path d="M110 19C112.4 15.8 113.4 11.6 112.6 7.2 110.6 10.4 109.8 14.6 110 19Z" />
        <path d="M110 19C108.4 14.4 108.6 8.6 110 3 111.4 8.6 111.6 14.4 110 19Z" />
      </g>
      <path d="M104 20.6h12" stroke="#a8741f" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The label round "Your presence is our blessing" and the button: a fine double gold line with
 * notched corners (each a quarter circle cut in), a small gold flower breaking the top line in its
 * middle, a faint cream ground — drawn to the label's own size, so its corners never stretch.
 */
function Label({ children }: { children: ReactNode }) {
  const [ref, box] = useElementSize<HTMLDivElement>();
  const frame = (w: number, h: number, i: number, r: number) => {
    const f = (n: number) => n.toFixed(2);
    const [x0, y0, x1, y1] = [i, i, w - i, h - i];
    return (
      `M${f(x0 + r)} ${f(y0)}H${f(x1 - r)}A${r} ${r} 0 0 0 ${f(x1)} ${f(y0 + r)}` +
      `V${f(y1 - r)}A${r} ${r} 0 0 0 ${f(x1 - r)} ${f(y1)}H${f(x0 + r)}A${r} ${r} 0 0 0 ${f(x0)} ${f(y1 - r)}` +
      `V${f(y0 + r)}A${r} ${r} 0 0 0 ${f(x0 + r)} ${f(y0)}Z`
    );
  };
  return (
    <div ref={ref} className="rs-label">
      {box && (
        <svg aria-hidden className="rs-label-art" width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} fill="none">
          <path d={frame(box.w, box.h, 0.75, 12)} className="rs-label-ground" />
          <path d={frame(box.w, box.h, 0.75, 12)} className="rs-label-line" />
          <path d={frame(box.w, box.h, 6, 9.5)} className="rs-label-line rs-label-fine" />
          {/* the flower breaking the top line */}
          <g transform={`translate(${box.w / 2} 0.75)`}>
            <rect x="-12" y="-3" width="24" height="6" className="rs-label-gap" />
            <circle cx="-9" cy="0" r="0.8" fill="#b89554" />
            <circle cx="9" cy="0" r="0.8" fill="#b89554" />
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="0" cy="-2.7" rx="1.2" ry="2.3" fill="#ecd49c" stroke="#b08a46" strokeWidth="0.5" transform={`rotate(${a})`} />
            ))}
            <circle r="1.1" fill="#b08a46" />
          </g>
        </svg>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

/** A small four-pointed gold spark, beside "Your presence is our blessing". */
function Spark() {
  return (
    <svg aria-hidden viewBox="0 0 16 10" className="rs-spark" fill="#b08a46">
      <path d="M8 1.2 9 4 11.8 5 9 6 8 8.8 7 6 4.2 5 7 4Z" />
      <path d="M0.5 5H3.6M12.4 5H15.5" stroke="#b08a46" strokeWidth="0.7" />
    </svg>
  );
}

/** A small gold sprig beside the button: three petals on a curl, reaching away from it. */
function Sprig({ flip = false }: { flip?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 26 28" className={`rs-sprig${flip ? " rs-sprig-flip" : ""}`} fill="none">
      <path d="M26 14C21 14 18 12 16 9" stroke="#b08a46" strokeWidth="0.8" strokeLinecap="round" />
      <g fill="#e9d29a" fillOpacity="0.6" stroke="#a8741f" strokeWidth="0.7" strokeLinejoin="round">
        <path d="M10 15C6.6 14.6 4 12.4 3.4 9.2 6.6 9.6 8.8 11.8 10 15Z" />
        <path d="M10 15C10.2 11.6 12.4 9 15.6 8.4 15.2 11.6 13 13.8 10 15Z" />
        <path d="M10 15C7.4 13.2 6.4 9.8 7.6 6.8 9.6 8.8 10.4 12 10 15Z" />
        <path d="M10 15C6.6 15.4 4 17.6 3.4 20.8 6.6 20.4 8.8 18.2 10 15Z" />
        <path d="M10 15C10.2 18.4 12.4 21 15.6 21.6 15.2 18.4 13 16.2 10 15Z" />
      </g>
      <circle cx="10" cy="15" r="1.2" fill="#a8741f" />
    </svg>
  );
}

/** A fine gold garland across the top, dipping gently to a small flower in the middle. */
function Garland() {
  return (
    <svg aria-hidden viewBox="0 0 400 40" preserveAspectRatio="none" className="rs-garland" fill="none">
      <path d="M40 2Q120 22 200 23Q280 22 360 2" stroke="#b89554" strokeOpacity="0.75" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** The small gold flower at the garland's middle. */
function GarlandFlower() {
  return (
    <svg aria-hidden viewBox="-12 -12 24 24" className="rs-garland-flower">
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx="0" cy="-5.6" rx="2.6" ry="4.8" fill="#e2c27a" stroke="#a8741f" strokeWidth="0.7" transform={`rotate(${a})`} />
      ))}
      <circle r="2.4" fill="#a8741f" />
    </svg>
  );
}

/**
 * Bel leaves — Mahadev's own — kept near the edges and corners, clear of the words and the button:
 * each a trifoliate leaf in soft sage, faint (15–25%). Where each sits (% of the section), its size
 * (px), its turn (deg) and its opacity.
 */
const BEL = [
  [3, 8, 30, -20, 0.2],
  [12, 17, 22, 40, 0.15],
  [88, 9, 26, 30, 0.18],
  [80, 17, 32, -10, 0.24],
  [2, 32, 26, 10, 0.22],
  [91, 31, 30, 60, 0.2],
  [6, 47, 22, -30, 0.16],
  [90, 49, 26, 20, 0.18],
  [1, 64, 30, 50, 0.25],
  [91, 66, 24, -40, 0.2],
  [5, 80, 24, 15, 0.17],
  [88, 82, 30, -25, 0.22],
] as const;

function BelLeaves() {
  return (
    <div aria-hidden className="rs-bel-field">
      {BEL.map(([x, y, size, turn, o], i) => (
        <svg
          key={i}
          viewBox="0 0 40 40"
          className="rs-bel"
          style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, "--turn": `${turn}deg`, "--o": o, "--at": `${300 + i * 60}ms` } as CSSProperties}
        >
          <path d="M20 22V38" stroke="#8aa88a" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M20 22C11.5 18 11 7 20 1 29 7 28.5 18 20 22Z" />
          <path d="M20 22C14 28.5 3 27.5 0.8 19 7 12 17 13.5 20 22Z" />
          <path d="M20 22C26 28.5 37 27.5 39.2 19 33 12 23 13.5 20 22Z" />
          <path d="M20 21V5M19 22 5 19.5M21 22 35 19.5" stroke="#f2f6ef" strokeWidth="0.6" fill="none" />
        </svg>
      ))}
    </div>
  );
}
