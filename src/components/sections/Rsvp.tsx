import { useMemo, useRef, useState, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { useGuest } from "@/context/GuestContext";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { acceptInvitation, BackendError, type Acceptance } from "@/lib/backend";
import { downloadIcs, googleCalendarUrl, weddingCalendarItem } from "@/lib/calendar";
import { whatsappUrl } from "@/lib/maps";
import { EASE } from "@/lib/motion";
import { Icon } from "@/components/art/Icons";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Section 08 — a personal confirmation (PRD §4). No form, no fields: a deep night-blue box with
 * temple bells hanging from its top corners and a faint temple at its foot; a gold trishul, "A
 * Sacred Celebration" in gold, one line of invitation, and one deep-maroon button, "Join the
 * Celebration". Tapped, it becomes a small gold seal with a soft glow and a brief scatter of gold;
 * then a personal message, the couple's words, and Add to Calendar. Every visit starts with the
 * button: an acceptance isn't remembered, so a reload shows it again.
 *
 * Honesty rule: the wording says the family received it only when the
 * database actually saved it. Without one, it asks the guest to let the
 * family know too and (if configured) offers to do it on WhatsApp.
 */
type Phase = "idle" | "sending" | "sealed";

/** Where the gold scatters to (px from the seal), and what shape each piece is. */
const SPARKS = [
  [-70, -54, "dot"],
  [64, -60, "petal"],
  [-92, 6, "petal"],
  [96, -4, "dot"],
  [-54, 58, "dot"],
  [58, 56, "petal"],
  [-18, -86, "petal"],
  [22, 84, "dot"],
  [-104, -38, "dot"],
  [104, 36, "petal"],
] as const;

/**
 * The temple bells (the couple arch's own) hanging from the box's top corners: which bell, how far
 * in from its side, how far down it hangs (to its foot) and how wide it is (px).
 */
const BELLS = {
  left: [
    { src: "/art/couple-bell-1.webp", ratio: 148 / 93, at: 13, drop: 62, w: 15 },
    { src: "/art/couple-bell-2.webp", ratio: 204 / 100, at: 31, drop: 44, w: 13 },
    { src: "/art/couple-bell-3.webp", ratio: 148 / 94, at: 47, drop: 24, w: 11 },
  ],
  right: [
    { src: "/art/couple-bell-3.webp", ratio: 148 / 94, at: 13, drop: 40, w: 14 },
    { src: "/art/couple-bell-1.webp", ratio: 148 / 93, at: 30, drop: 64, w: 13 },
    { src: "/art/couple-bell-2.webp", ratio: 204 / 100, at: 46, drop: 26, w: 11 },
  ],
} as const;

export function Rsvp() {
  const { rsvp, couple } = wedding;
  const { guestName, isPersonalized } = useGuest();
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { threshold: 0.25 });
  const reduced = usePrefersReducedMotion();
  const [acceptance, setAcceptance] = useState<Acceptance | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [celebrate, setCelebrate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const calendar = useMemo(() => weddingCalendarItem(), []);

  const accept = async () => {
    if (phase !== "idle") return;
    setPhase("sending");
    setError(null);
    try {
      const a = await acceptInvitation(guestName, isPersonalized ? guestName : null);
      setAcceptance(a);
      setCelebrate(!reduced);
      setPhase("sealed");
    } catch (e) {
      setError(e instanceof BackendError ? e.message : "Something went wrong. Please try again.");
      setPhase("idle");
    }
  };

  const sealed = phase === "sealed";
  const names = `${couple.bride.displayName} & ${couple.groom.displayName}`;
  // The acceptance unfolds step by step (with reduced motion, all at once).
  const after = (ms: number) => (celebrate ? ms : 0);
  const tellFamily =
    rsvp.whatsapp && acceptance?.savedTo === "local"
      ? whatsappUrl(
          rsvp.whatsapp,
          `Namaste! ${guestName} here — I'm delighted to accept the invitation to ${names}'s wedding.`,
        )
      : null;

  // the button: a maroon bar with rounded corners, which draws itself into a round gold seal
  const morph: CSSProperties = {
    width: sealed ? 68 : 236,
    height: sealed ? 68 : 46,
    borderRadius: sealed ? 34 : 10,
    transition: reduced
      ? "background-color 200ms ease, border-color 200ms ease"
      : `width 600ms ${EASE.silk}, height 600ms ${EASE.silk}, border-radius 600ms ${EASE.silk}, background-color 300ms ease, border-color 300ms ease, box-shadow 400ms ease, transform 150ms ease`,
  };

  return (
    <section
      id="rsvp"
      ref={ref}
      aria-labelledby="rsvp-heading"
      className="relative px-[var(--gutter)] pt-[var(--section-gap)]"
    >
      <Reveal show={seen} className="mx-auto max-w-[22.5rem]">
        <div className="rsvp-card px-6 pb-12 pt-8 text-center">
          {/* the bells from the top corners, and a temple, faint, at the foot */}
          {(["left", "right"] as const).map((side) =>
            BELLS[side].map((b, i) => (
              <span key={`${side}${i}`} aria-hidden className="rsvp-bell" style={{ [side]: b.at, width: b.w, height: b.drop }}>
                <img src={b.src} alt="" width={b.w} height={Math.round(b.w * b.ratio)} draggable={false} />
              </span>
            )),
          )}
          <Temple />

          <div className="relative">
            <Trishul />
            <Divider wide />
            <h2 id="rsvp-heading" className="rsvp-title mt-3 text-balance">
              {rsvp.title}
            </h2>
            <p className="rsvp-message mx-auto mt-2 max-w-[16.5rem] text-balance">{rsvp.message}</p>
            <Divider />

            {/* the button that becomes a seal */}
            <div className="relative mx-auto mt-4 flex h-[76px] items-center justify-center">
              {celebrate && (
                <>
                  <span aria-hidden className="rsvp-ring absolute h-[68px] w-[68px] rounded-full border border-gold" />
                  <span aria-hidden className="rsvp-glow absolute h-[68px] w-[68px] rounded-full" />
                  {SPARKS.map(([dx, dy, kind], i) => (
                    <span
                      key={i}
                      aria-hidden
                      className={`rsvp-spark ${kind === "petal" ? "rsvp-petal" : ""}`}
                      style={
                        {
                          "--dx": `${dx}px`,
                          "--dy": `${dy}px`,
                          animationDelay: `${120 + (i % 4) * 40}ms`,
                        } as CSSProperties
                      }
                    />
                  ))}
                </>
              )}
              <button
                type="button"
                onClick={accept}
                disabled={phase !== "idle"}
                aria-live="polite"
                className="rsvp-btn relative flex max-w-full items-center justify-center overflow-hidden"
                data-sealed={sealed || undefined}
                style={morph}
              >
                <span className="rsvp-btn-label absolute whitespace-nowrap" style={{ opacity: sealed ? 0 : 1, transition: "opacity 250ms ease" }}>
                  {phase === "sending" ? "Sending your joy…" : error ? "Try again" : rsvp.button}
                  {phase === "idle" && (
                    <svg aria-hidden viewBox="0 0 20 10" className="h-[8px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 5h17M14 1.5 18 5l-4 3.5" />
                    </svg>
                  )}
                </span>
                <span
                  className="absolute"
                  style={{ opacity: sealed ? 1 : 0, transition: `opacity 400ms ease ${after(350)}ms` }}
                  aria-hidden={!sealed}
                >
                  <Icon name="lotus" className="h-8 w-8" strokeWidth={1.4} />
                  <span className="sr-only">Invitation accepted</span>
                </span>
              </button>
            </div>

            {error && (
              <p role="alert" className="mt-3 text-[13.5px] leading-snug text-[#f3b8ae]">
                We couldn't send your acceptance. {error}
              </p>
            )}

            {sealed && acceptance && (
              <div className="mt-6">
                <Reveal
                  show
                  delay={after(900)}
                  as="p"
                  className="text-balance font-display text-[23px] font-semibold italic leading-snug text-[#fff9ef]"
                >
                  {rsvp.welcome.replace("{guest}", acceptance.guestName)}
                </Reveal>
                <Reveal show delay={after(1100)} as="p" className="mt-3 text-balance text-[15px] leading-relaxed text-[#fff9ef]/80">
                  {rsvp.blessing}
                </Reveal>
                <Reveal show delay={after(1300)} as="blockquote" className="mt-4">
                  <p className="text-balance font-display text-[18px] font-medium italic leading-snug text-[#e3c27e]">“{rsvp.quote}”</p>
                  <footer className="mt-1 font-script text-[28px] leading-tight text-[#e3c27e]">— {names}</footer>
                </Reveal>

                {calendar && (
                  <Reveal show delay={after(1600)} className="mt-6">
                    <p className="font-sans text-[10.5px] font-medium uppercase tracking-[0.24em] text-[#fff9ef]/65">Add to calendar</p>
                    <div className="mt-2.5 flex flex-wrap justify-center gap-2.5">
                      <a href={googleCalendarUrl(calendar)} target="_blank" rel="noopener noreferrer" className="rsvp-chip">
                        <Icon name="calendar" className="h-4 w-4 text-[#d4b26e]" /> Google Calendar
                      </a>
                      <button type="button" onClick={() => downloadIcs(calendar)} className="rsvp-chip">
                        <Icon name="calendar" className="h-4 w-4 text-[#d4b26e]" /> Apple · Outlook
                      </button>
                    </div>
                  </Reveal>
                )}

                <Reveal
                  show
                  delay={after(1800)}
                  as="p"
                  className="mx-auto mt-5 max-w-[17rem] text-balance text-[12.5px] leading-relaxed text-[#fff9ef]/75"
                >
                  {acceptance.savedTo === "remote" ? "Your acceptance has reached the family." : "Please also let the family know you're coming."}
                </Reveal>
                {tellFamily && (
                  <Reveal show delay={after(1900)} className="mt-3">
                    <a href={tellFamily} target="_blank" rel="noopener noreferrer" className="rsvp-btn inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 font-sans text-[13px] font-medium">
                      <Icon name="chat" className="h-4 w-4" /> Tell the family on WhatsApp
                    </a>
                  </Reveal>
                )}
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </section>
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

/** A fine gold rule with a small ornament in its middle (the wide one under the trishul). */
function Divider({ wide = false }: { wide?: boolean }) {
  return wide ? (
    <svg aria-hidden viewBox="0 0 160 10" className="mx-auto mt-2 h-[10px] w-40" fill="none">
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
    <svg aria-hidden viewBox="0 0 70 8" className="mx-auto mt-4 h-2 w-[70px]" fill="none">
      <path d="M0 4h29M41 4h29" stroke="#b89554" strokeOpacity="0.8" strokeWidth="0.8" />
      <path d="M35 1.4 37.6 4 35 6.6 32.4 4Z" fill="#d4b26e" />
    </svg>
  );
}

/** A temple's silhouette, faint, at the box's foot (bottom right). */
function Temple() {
  return (
    <svg aria-hidden viewBox="0 0 120 90" className="rsvp-temple" fill="currentColor">
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
