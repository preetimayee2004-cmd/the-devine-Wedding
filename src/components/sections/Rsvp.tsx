import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { useGuest } from "@/context/GuestContext";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useScrollLock } from "@/hooks/useScrollLock";
import { acceptInvitation, BackendError, type Acceptance } from "@/lib/backend";
import { downloadIcs, googleCalendarUrl, weddingCalendarItem } from "@/lib/calendar";
import { whatsappUrl } from "@/lib/maps";
import { Icon } from "@/components/art/Icons";

/**
 * Section 08 — a personal confirmation (PRD §4). No form, no fields: a deep night-blue box with
 * temple bells hanging alike from its top corners and a small, faint temple at its foot; a gold
 * trishul, "A Sacred Celebration" in gold, one line of invitation, and one deep-maroon button, "Join
 * the Celebration →" (the arrow steps 4px on when pointed at).
 *
 * Seen the first time (about 1.9s, one easing): the box rises in; the trishul, then the bells drop
 * in and settle with one small swing; the heading and its line; the button last; and one gleam
 * passes over the temple. Then all is still. Reduced motion: everything simply fades in.
 *
 * Tapped (once — more taps are ignored), it presses in and a thin line of gold light runs round
 * its edge (0.45s) while the acceptance is sent; only when that has succeeded does the scene open
 * (if it fails, the button stays, with the reason). The button fades away and the blue box opens
 * out to fill the screen, its blue unchanged; then, about 4s in all:
 *   a narrow gold light rises from the bottom centre toward the middle, and as it passes the
 *     temples at the foot and the bells above come faintly into view (0.5–1.4s);
 *   a temple arch draws itself in fine antique gold — both pillars rising together, then the
 *     upper arch from each side to meet at its peak, and one gleam running along it (1.4–2.4s);
 *   Mahadev and Maa Parvati appear inside it (the Save the Date painting's own figures), from 97%
 *     to full size, with a warm gold light behind them (2.4–3.2s);
 *   "Your presence means the world", the blessing and "Har Har Mahadev" rise in, one after the
 *     other (3.2–4s), then "Add to calendar" and "Return to invitation".
 * Then everything is still. Add to calendar offers Google Calendar or an .ics file, and says
 * exactly what happened (a tab opened, a file downloaded) — never that the event is saved.
 * Return to invitation (or Escape) folds the scene back into the box, which now shows the guest
 * their acceptance and can open the scene again (at once, without the journey).
 *
 * Every visit starts with the button: an acceptance isn't remembered, so a reload shows it again.
 * Honesty rule: the wording says the family received it only when the database actually saved it.
 * Without one, it asks the guest to let the family know too and (if configured) offers WhatsApp.
 * Reduced motion: no sweep, no journey; the finished scene simply fades in, and out.
 */
type Phase = "idle" | "sending" | "leaving" | "accepted";

/**
 * The temple bells (the couple arch's own), hung the same on both sides from the box's top corners on
 * fine antique-gold threads, the outermost longest: which bell, how far in from its side, how far down
 * it hangs (to its foot) and how wide it is (px).
 */
const BELLS = [
  { src: "/art/couple-bell-1.webp", ratio: 148 / 93, at: 16, drop: 58, w: 14 },
  { src: "/art/couple-bell-2.webp", ratio: 204 / 100, at: 33, drop: 40, w: 12 },
  { src: "/art/couple-bell-3.webp", ratio: 148 / 94, at: 49, drop: 24, w: 11 },
] as const;

/** The button's gold light runs round its edge this long (ms); then it fades away (ms). */
const SWEEP = 450;
const LEAVE = 220;

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** When a part of the box comes in, in its entrance (ms). */
const at = (ms: number) => ({ "--at": `${ms}ms` }) as CSSProperties;

export function Rsvp() {
  const { rsvp, couple } = wedding;
  const { guestName, isPersonalized } = useGuest();
  const ref = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const replayRef = useRef<HTMLButtonElement>(null);
  const seen = useInView(ref, { threshold: 0.25 });
  const reduced = usePrefersReducedMotion();
  const [acceptance, setAcceptance] = useState<Acceptance | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  // the scene: open (from where the box was), and whether it plays its journey or simply appears
  const [scene, setScene] = useState<{
    from: DOMRect | null;
    instant: boolean;
  } | null>(null);
  const busy = useRef(false);
  const calendar = useMemo(() => weddingCalendarItem(), []);

  const accept = async () => {
    if (busy.current || phase !== "idle") return;
    busy.current = true;
    setPhase("sending");
    setError(null);
    const t0 = performance.now();
    try {
      const a = await acceptInvitation(guestName, isPersonalized ? guestName : null);
      // let the gold light finish its round, then the button fades and the scene opens
      if (!reduced) await pause(Math.max(0, SWEEP - (performance.now() - t0)));
      setAcceptance(a);
      setPhase("leaving");
      if (!reduced) await pause(LEAVE - 40);
      setScene({
        from: cardRef.current?.getBoundingClientRect() ?? null,
        instant: reduced,
      });
      // the box shows the acceptance once the scene covers it (so it never peeks out as it opens)
      if (!reduced) await pause(560);
      setPhase("accepted");
    } catch (e) {
      setError(e instanceof BackendError ? e.message : "Something went wrong. Please try again.");
      setPhase("idle");
    } finally {
      busy.current = false;
    }
  };

  const names = `${couple.bride.displayName} & ${couple.groom.displayName}`;
  const tellFamily =
    rsvp.whatsapp && acceptance?.savedTo === "local"
      ? whatsappUrl(rsvp.whatsapp, `Namaste! ${guestName} here — I'm delighted to accept the invitation to ${names}'s wedding.`)
      : null;
  const note =
    acceptance?.savedTo === "remote"
      ? "Your acceptance has reached the family."
      : "Please also let the family know you're coming.";

  return (
    <section id="rsvp" ref={ref} aria-labelledby="rsvp-heading" className="relative px-[var(--gutter)] pt-[var(--section-gap)]">
      <div className="mx-auto max-w-[22.5rem]">
        <div
          ref={cardRef}
          className="rsvp-card px-6 pb-[72px] pt-9 text-center"
          data-shown={seen || undefined}
          data-still={reduced || undefined}
        >
          <Bells />
          <Temple className="rsvp-temple" />
          <Temple className="rsvp-temple rsvp-temple-gleam" />

          <div className="relative">
            <div className="rsvp-in" style={at(300)}>
              <Trishul />
            </div>
            <div className="rsvp-in" style={at(420)}>
              <Divider wide />
            </div>
            <h2 id="rsvp-heading" className="rsvp-title rsvp-in mt-3.5 text-balance" style={at(520)}>
              {rsvp.title}
            </h2>
            <p className="rsvp-message rsvp-in mx-auto mt-2.5 max-w-[16.5rem] text-balance" style={at(640)}>
              {rsvp.message}
            </p>
            <div className="rsvp-in" style={at(760)}>
              <Divider />
            </div>

            {phase !== "accepted" ? (
              <div className="rsvp-in mx-auto mt-6 flex items-center justify-center" style={at(900)}>
                <button
                  type="button"
                  onClick={accept}
                  aria-disabled={phase !== "idle" || undefined}
                  aria-live="polite"
                  className="rsvp-btn relative flex items-center justify-center overflow-hidden"
                  data-phase={phase}
                  style={{ width: 236, height: 46, borderRadius: 10 }}
                >
                  <span className="rsvp-btn-label">
                    {phase === "sending" && !reduced
                      ? rsvp.button
                      : phase === "sending"
                        ? "Sending your joy…"
                        : error
                          ? "Try again"
                          : rsvp.button}
                    <svg
                      aria-hidden
                      viewBox="0 0 20 10"
                      className="rsvp-arrow h-[8px] w-[16px]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 5h17M14 1.5 18 5l-4 3.5" />
                    </svg>
                  </span>
                  {/* the thin gold light running once round the edge */}
                  {phase === "sending" && !reduced && (
                    <svg aria-hidden className="rsvp-sweep" viewBox="0 0 236 46" preserveAspectRatio="none">
                      <rect x="0.75" y="0.75" width="234.5" height="44.5" rx="9.25" pathLength="1" />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              acceptance && (
                <div className="mt-5">
                  <span aria-hidden className="rsvp-seal mx-auto">
                    <Icon name="lotus" className="h-7 w-7" strokeWidth={1.4} />
                  </span>
                  <p className="mt-4 text-balance font-display text-[21px] font-semibold italic leading-snug text-[#fff9ef]">
                    {rsvp.welcome.replace("{guest}", acceptance.guestName)}
                  </p>
                  <button
                    ref={replayRef}
                    type="button"
                    className="rsvp-chip mt-4"
                    onClick={() =>
                      setScene({
                        from: cardRef.current?.getBoundingClientRect() ?? null,
                        instant: true,
                      })
                    }
                  >
                    <Icon name="lotus" className="h-4 w-4 text-[#d4b26e]" /> See the blessing again
                  </button>
                  <p className="mx-auto mt-4 max-w-[17rem] text-balance text-[12.5px] leading-relaxed text-[#fff9ef]/75">
                    {note}
                  </p>
                  {tellFamily && (
                    <a
                      href={tellFamily}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rsvp-btn mt-3 inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 font-sans text-[13px] font-medium"
                    >
                      <Icon name="chat" className="h-4 w-4" /> Tell the family on WhatsApp
                    </a>
                  )}
                </div>
              )
            )}

            {error && (
              <p role="alert" className="mt-3 text-[13.5px] leading-snug text-[#f3b8ae]">
                We couldn't send your acceptance. {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {scene && (
        <BlessingScene
          from={scene.from}
          instant={scene.instant || reduced}
          note={note}
          tellFamily={tellFamily}
          calendar={calendar}
          target={() => cardRef.current?.getBoundingClientRect() ?? null}
          onClosed={() => {
            setScene(null);
            replayRef.current?.focus({ preventScroll: true });
          }}
        />
      )}
    </section>
  );
}

type CalendarItem = NonNullable<ReturnType<typeof weddingCalendarItem>>;

/**
 * The scene, full screen on the box's own blue: the light's journey, the temple arch, Mahadev and
 * Maa Parvati, the blessing, and the two buttons. Every step is a one-time CSS animation, timed
 * from the moment it opens; `instant` shows the finished scene at once.
 */
function BlessingScene({
  from,
  instant,
  note,
  tellFamily,
  calendar,
  target,
  onClosed,
}: {
  from: DOMRect | null;
  instant: boolean;
  note: string;
  tellFamily: string | null;
  calendar: CalendarItem | null;
  target: () => DOMRect | null;
  onClosed: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const [options, setOptions] = useState(false);
  const [feedback, setFeedback] = useState("");
  useScrollLock(true);
  const { saveTheDateLayers } = wedding.assets;

  /** The screen clipped down to a box's rectangle (its rounded corners too). */
  const inset = (r: DOMRect) =>
    `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round 22px)`;
  const FULL = "inset(0px 0px 0px 0px round 0px)";

  // open: the box's blue opens out from where the box is to fill the screen
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const bg = bgRef.current;
    if (!dialog || !bg) return;
    if (!dialog.open) dialog.showModal();
    if (instant || !from || !bg.animate) {
      bg.animate?.([{ opacity: 0 }, { opacity: 1 }], {
        duration: 260,
        easing: "linear",
        fill: "both",
      });
      return;
    }
    bg.animate([{ clipPath: inset(from) }, { clipPath: FULL }], {
      duration: 520,
      easing: "cubic-bezier(0.65, 0, 0.35, 1)",
      fill: "both",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const dialog = dialogRef.current;
    const bg = bgRef.current;
    const scene = sceneRef.current;
    const done = () => {
      const y = window.scrollY;
      dialog?.close();
      if (window.scrollY !== y) window.scrollTo({ top: y, behavior: "instant" });
      onClosed();
    };
    if (!dialog || !bg || !scene || !bg.animate) return done();
    scene.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: instant ? 200 : 240,
      easing: "ease",
      fill: "both",
    });
    const to = target();
    if (instant || !to) {
      bg.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 240,
        easing: "linear",
        fill: "both",
      }).finished.then(done, done);
      return;
    }
    bg.animate([{ clipPath: FULL }, { clipPath: inset(to) }], {
      duration: 460,
      delay: 160,
      easing: "cubic-bezier(0.65, 0, 0.35, 1)",
      fill: "both",
    }).finished.then(done, done);
  };

  const google = () => {
    if (!calendar) return;
    window.open(googleCalendarUrl(calendar), "_blank", "noopener,noreferrer");
    setFeedback("Google Calendar has opened in a new tab — tap Save there to keep the date.");
  };
  const ics = () => {
    if (!calendar) return;
    downloadIcs(calendar);
    setFeedback("A calendar file (.ics) has been downloaded — open it to add the wedding to your calendar.");
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="rv-heading"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      className="rv fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-transparent"
      data-instant={instant || undefined}
    >
      <div ref={bgRef} aria-hidden className="rv-bg" />
      <div ref={sceneRef} className="rv-layer">
        {/* the light's journey, and what it brings into view (behind, never scrolling) */}
        <div aria-hidden className="rv-deco">
          <span className="rv-light" />
          <Temple className="rv-temple rv-temple-left" />
          <Temple className="rv-temple rv-temple-right" />
          <div className="rv-bells">
            <Bells />
          </div>
        </div>
        <div className="rv-scene">
          {/* the arch, and Mahadev and Maa Parvati within it */}
          <div className="rv-art">
            <span aria-hidden className="rv-glow" />
            <img
              className="rv-figures"
              src={saveTheDateLayers.figures}
              alt="Mahadev and Maa Parvati: he gently touches her forehead as she bows her head, garlanded"
              width={572}
              height={1024}
              draggable={false}
            />
            <Arch />
          </div>

          <div className="rv-words">
            <h2 id="rv-heading" className="rv-heading rv-rise" style={{ "--at": "2700ms" } as CSSProperties}>
              Your presence means the world
            </h2>
            <p className="rv-text rv-rise" style={{ "--at": "2900ms" } as CSSProperties}>
              With the blessings of Mahadev and Maa Parvati, we look forward to celebrating this special occasion with you.
            </p>
            <p className="rv-closing rv-rise" style={{ "--at": "3100ms" } as CSSProperties}>
              Har Har Mahadev
            </p>
          </div>

          <div className="rv-actions">
            {calendar && (
              <div className="rv-rise flex flex-col items-center" style={{ "--at": "3500ms" } as CSSProperties}>
                <button type="button" className="rsvp-btn rv-btn" aria-expanded={options} onClick={() => setOptions((o) => !o)}>
                  <Icon name="calendar" className="h-4 w-4" strokeWidth={1.5} /> Add to calendar
                </button>
                {options && (
                  <div className="rv-options">
                    <button type="button" className="rsvp-chip" onClick={google}>
                      Google Calendar
                    </button>
                    <button type="button" className="rsvp-chip" onClick={ics}>
                      Apple · Outlook (.ics)
                    </button>
                  </div>
                )}
                <p className="rv-feedback" aria-live="polite">
                  {feedback}
                </p>
              </div>
            )}
            <div className="rv-rise" style={{ "--at": "3620ms" } as CSSProperties}>
              <button type="button" className="rsvp-btn rv-btn" onClick={close}>
                Return to invitation
              </button>
            </div>
            <p className="rv-note rv-rise" style={{ "--at": "3740ms" } as CSSProperties}>
              {note}
            </p>
            {tellFamily && (
              <a
                href={tellFamily}
                target="_blank"
                rel="noopener noreferrer"
                className="rsvp-chip rv-rise"
                style={{ "--at": "3740ms" } as CSSProperties}
              >
                <Icon name="chat" className="h-4 w-4 text-[#d4b26e]" /> Tell the family on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}

/**
 * The temple arch, in fine antique gold (300 × 400): two pillars on their plinths, rising
 * together; the upper arch drawn from each pillar's top to meet at its peak (an outer line and a
 * finer inner one); a small kalash on the peak; and one gleam running along the arch.
 */
function Arch() {
  const draw = (at: number, dur: number) => ({ "--at": `${at}ms`, "--dur": `${dur}ms` }) as CSSProperties;
  const half = "M36 166C36 122 86 100 116 78 134 64 144 48 150 28";
  const halfIn = "M48 172C48 132 94 112 121 92 137 80 146 66 150 50";
  const mirror = (d: string) =>
    d.replace(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${300 - Number(x)} ${y}`);
  return (
    <svg aria-hidden className="rv-arch" viewBox="0 0 300 400" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {[0, 1].map((side) => {
        const x = (v: number) => (side ? 300 - v : v);
        return (
          <g key={side}>
            {/* the pillar: two lines rising from the plinth to the capital */}
            <path className="rv-stroke" pathLength={1} d={`M${x(28)} 392V172`} style={draw(900, 500)} />
            <path className="rv-stroke rv-fine" pathLength={1} d={`M${x(44)} 392V176`} style={draw(950, 480)} />
            <path
              className="rv-stroke"
              pathLength={1}
              d={`M${x(20)} 396H${x(52)}M${x(23)} 388H${x(49)}`}
              style={draw(900, 220)}
            />
            <path
              className="rv-stroke"
              pathLength={1}
              d={`M${x(22)} 172H${x(50)}M${x(25)} 178H${x(47)}`}
              style={draw(1330, 200)}
            />
            {/* the arch, from the pillar's top to the peak */}
            <path className="rv-stroke" pathLength={1} d={side ? mirror(half) : half} style={draw(1300, 480)} />
            <path className="rv-stroke rv-fine" pathLength={1} d={side ? mirror(halfIn) : halfIn} style={draw(1360, 440)} />
          </g>
        );
      })}
      {/* the kalash on the peak */}
      <g className="rv-kalash">
        <path d="M150 28V18M150 22c-4-2-7-1-8 2M150 22c4-2 7-1 8 2" stroke="#b89554" strokeWidth="1.2" />
        <circle cx="150" cy="14" r="3.2" stroke="#d4b26e" strokeWidth="1.2" fill="#d4b26e" fillOpacity="0.35" />
      </g>
      {/* one gleam running along the arch, left to right */}
      <path className="rv-shine" pathLength={1} d={`${half}C156 48 166 64 184 78 214 100 264 122 264 166`} />
    </svg>
  );
}

/** The bells from the box's top corners, the same on each side (each swings first toward the middle). */
function Bells() {
  return (
    <>
      {(["left", "right"] as const).map((side) =>
        BELLS.map((b, i) => (
          <span
            key={`${side}${i}`}
            aria-hidden
            className="rsvp-bell"
            style={{ [side]: b.at, width: b.w, height: b.drop, "--i": i, "--dir": side === "left" ? 1 : -1 } as CSSProperties}
          >
            <img src={b.src} alt="" width={b.w} height={Math.round(b.w * b.ratio)} draggable={false} />
          </span>
        )),
      )}
    </>
  );
}

/** Mahadev's trishul, in fine gold line. */
function Trishul() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 32 46"
      className="mx-auto h-[52px] w-9"
      fill="none"
      stroke="#d4b26e"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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

/** A fine gold rule with a small ornament in its middle (the wide one under the trishul). */
function Divider({ wide = false }: { wide?: boolean }) {
  return wide ? (
    <svg aria-hidden viewBox="0 0 160 10" className="mx-auto mt-1.5 h-[10px] w-40" fill="none">
      <defs>
        <linearGradient id="rsvp-rule" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="160" y2="0">
          <stop offset="0" stopColor="#b89554" stopOpacity="0" />
          <stop offset="0.5" stopColor="#b89554" />
          <stop offset="1" stopColor="#b89554" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 5h68M92 5h68" stroke="url(#rsvp-rule)" strokeWidth="0.8" />
      <circle cx="72" cy="5" r="1.1" fill="#b89554" />
      <circle cx="88" cy="5" r="1.1" fill="#b89554" />
      <path d="M80 1.2 83.8 5 80 8.8 76.2 5Z" fill="#d4b26e" fillOpacity="0.4" stroke="#d4b26e" strokeWidth="0.8" />
    </svg>
  ) : (
    <svg aria-hidden viewBox="0 0 70 8" className="mx-auto mt-5 h-2 w-[70px]" fill="none">
      <path d="M0 4h29M41 4h29" stroke="#b89554" strokeOpacity="0.8" strokeWidth="0.8" />
      <path d="M35 1.4 37.6 4 35 6.6 32.4 4Z" fill="#d4b26e" />
    </svg>
  );
}

/** A temple's silhouette, faint (the box's foot, and the scene's two corners). */
function Temple({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 90" className={className} fill="currentColor">
      {/* the plinth, the hall, the main tower with its amalaka, kalash and flag, a small shrine */}
      <path d="M8 84h112v6H8z" />
      <path d="M34 84V66q0-6 6-11 5-4 8-7 3 3 8 7 6 5 6 11v18z" />
      <path d="M60 84V52q0-11 6-21 5-9 12-17 7 8 12 17 6 10 6 21v32z" />
      <ellipse cx="78" cy="13.4" rx="4.4" ry="1.9" />
      <path d="M77.3 11.6V4h1.4v7.6z" />
      <path d="M78.6 4.2 85 6.4l-6.4 2.2z" />
      <path d="M98 84V68q0-5 4.5-9 2.5-2.4 3.5-4.4 1 2 3.5 4.4 4.5 4 4.5 9v16z" />
      {/* the doorway */}
      <path d="M74 84v-9q4-5 8 0v9z" fill="#0b2045" />
    </svg>
  );
}
