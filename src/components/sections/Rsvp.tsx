import { useMemo, useRef, useState, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { useGuest } from "@/context/GuestContext";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { acceptInvitation, BackendError, readAcceptance, type Acceptance } from "@/lib/backend";
import { downloadIcs, googleCalendarUrl, weddingCalendarItem } from "@/lib/calendar";
import { whatsappUrl } from "@/lib/maps";
import { EASE } from "@/lib/motion";
import { formatVenueDate, parseVenueDateTime } from "@/lib/venueTime";
import { Icon } from "@/components/art/Icons";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Section 08 — a personal confirmation (PRD §4). No form, no fields: one
 * "Accept with Joy" button. Tapped, it becomes a small gold seal with a soft
 * glow and a brief scatter of gold; then a personal message, the couple's
 * words, and Add to Calendar.
 *
 * Honesty rule: the wording says the family received it only when the
 * database actually saved it. Without one, it says the confirmation is on
 * the guest's phone and (if configured) offers to tell the family on WhatsApp.
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

export function Rsvp() {
  const { rsvp, couple } = wedding;
  const { guestName, isPersonalized } = useGuest();
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { threshold: 0.25 });
  const reduced = usePrefersReducedMotion();
  const [acceptance, setAcceptance] = useState<Acceptance | null>(() => readAcceptance());
  const [phase, setPhase] = useState<Phase>(acceptance ? "sealed" : "idle");
  const [celebrate, setCelebrate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateLine = useMemo(() => {
    const p = parseVenueDateTime(wedding.wedding.dateTime);
    if (!p) return null;
    const d = formatVenueDate(p);
    return `${d.weekday} · ${d.day} ${d.month} ${d.year}`;
  }, []);
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
  // A fresh acceptance unfolds step by step; a returning guest sees it settled.
  const after = (ms: number) => (celebrate ? ms : 0);
  const tellFamily =
    rsvp.whatsapp && acceptance?.savedTo === "local"
      ? whatsappUrl(
          rsvp.whatsapp,
          `Namaste! ${guestName} here — I'm delighted to accept the invitation to ${names}'s wedding.`,
        )
      : null;

  const morph: CSSProperties = {
    width: sealed ? 68 : 236,
    height: sealed ? 68 : 54,
    transition: reduced
      ? "none"
      : `width 600ms ${EASE.silk}, height 600ms ${EASE.silk}, background-color 500ms ease, box-shadow 600ms ease`,
  };

  return (
    <section
      id="rsvp"
      ref={ref}
      aria-labelledby="rsvp-heading"
      className="relative px-[var(--gutter)] pt-[var(--section-gap)]"
    >
      <Reveal show={seen} className="mx-auto max-w-[22.5rem]">
        {/* the invitation card */}
        <div className="rounded-[30px] border border-gold/70 bg-ivory/85 p-[6px] shadow-[0_22px_50px_-30px_rgb(23_59_86/0.6)]">
          <div className="rounded-[25px] border border-gold/40 px-6 pb-8 pt-9 text-center">
            <p className="font-sans text-[11px] font-medium uppercase tracking-eyebrow text-gold-ink">{rsvp.eyebrow}</p>
            <h2 id="rsvp-heading" className="mt-3 text-balance text-[31px] leading-[1.12]">
              {rsvp.title}
            </h2>
            <p className="mx-auto mt-3 max-w-[17rem] text-balance text-[15px] leading-relaxed text-slate">
              {rsvp.message}
            </p>
            {dateLine && (
              <p className="mt-4 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-gold-ink">
                {dateLine}
              </p>
            )}

            {/* the button that becomes a seal */}
            <div className="relative mx-auto mt-7 flex h-[76px] items-center justify-center">
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
                className={`relative flex items-center justify-center overflow-hidden rounded-full font-sans text-[15px] font-medium tracking-[0.06em] ${
                  sealed
                    ? "cursor-default bg-gradient-to-b from-[#E2C690] to-[#B98F4E] text-ivory shadow-[0_0_0_4px_rgb(var(--ivory)),0_0_0_5px_rgb(var(--gold)/0.8),0_10px_26px_-10px_rgb(138_100_47/0.8)]"
                    : "bg-navy text-ivory shadow-[0_12px_26px_-14px_rgb(23_59_86/0.9)] hover:bg-navy-deep active:scale-[0.98]"
                }`}
                style={morph}
              >
                <span
                  className="absolute whitespace-nowrap"
                  style={{ opacity: sealed ? 0 : 1, transition: "opacity 250ms ease" }}
                >
                  {phase === "sending" ? "Sending your joy…" : error ? "Try again" : rsvp.button}
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
              <p role="alert" className="mt-3 text-[13.5px] leading-snug text-[#9a3b2e]">
                We couldn't send your acceptance. {error}
              </p>
            )}

            {sealed && acceptance && (
              <div className="mt-6">
                <Reveal
                  show
                  delay={after(900)}
                  as="p"
                  className="text-balance font-display text-[23px] font-semibold italic leading-snug text-navy"
                >
                  {rsvp.welcome.replace("{guest}", acceptance.guestName)}
                </Reveal>
                <Reveal
                  show
                  delay={after(1100)}
                  as="p"
                  className="mt-3 text-balance text-[15px] leading-relaxed text-slate"
                >
                  {rsvp.blessing}
                </Reveal>
                <Reveal show delay={after(1300)} as="blockquote" className="mt-4">
                  <p className="text-balance font-display text-[18px] font-medium italic leading-snug text-gold-ink">
                    “{rsvp.quote}”
                  </p>
                  <footer className="mt-1 font-script text-[28px] leading-tight text-gold-ink">— {names}</footer>
                </Reveal>

                {calendar && (
                  <Reveal show delay={after(1600)} className="mt-6">
                    <p className="font-sans text-[10.5px] font-medium uppercase tracking-[0.24em] text-slate">
                      Add to calendar
                    </p>
                    <div className="mt-2.5 flex flex-wrap justify-center gap-2.5">
                      <a
                        href={googleCalendarUrl(calendar)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-gold/80 bg-ivory px-4 py-2.5 font-sans text-[13px] font-medium text-navy hover:bg-white"
                      >
                        <Icon name="calendar" className="h-4 w-4 text-gold-ink" /> Google Calendar
                      </a>
                      <button
                        type="button"
                        onClick={() => downloadIcs(calendar)}
                        className="inline-flex items-center gap-2 rounded-full border border-gold/80 bg-ivory px-4 py-2.5 font-sans text-[13px] font-medium text-navy hover:bg-white"
                      >
                        <Icon name="calendar" className="h-4 w-4 text-gold-ink" /> Apple · Outlook
                      </button>
                    </div>
                  </Reveal>
                )}

                <Reveal
                  show
                  delay={after(1800)}
                  as="p"
                  className="mx-auto mt-5 max-w-[17rem] text-balance text-[12.5px] leading-relaxed text-slate/90"
                >
                  {acceptance.savedTo === "remote"
                    ? "Your acceptance has reached the family."
                    : "This confirmation is saved on your phone. Please also let the family know you're coming."}
                </Reveal>
                {tellFamily && (
                  <Reveal show delay={after(1900)} className="mt-3">
                    <a
                      href={tellFamily}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 font-sans text-[13px] font-medium text-ivory"
                    >
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
