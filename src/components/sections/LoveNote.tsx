import { useRef, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { usePersonal } from "@/context/GuestContext";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { EASE } from "@/lib/motion";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Section 12 — one last little note (PRD §4).
 *
 * A small envelope with a gold seal appears; its flap opens; the note rises
 * out as the envelope settles away; the words fade in. The sky behind
 * softens back to the pale blue of the very beginning. Plays once, no loops.
 */
export function LoveNote() {
  const greeting = usePersonal()(wedding.loveNote.greetingFor, "");
  const { loveNote: copy, couple, credits } = wedding;
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { threshold: 0.35 });
  const reduced = usePrefersReducedMotion();
  const at = (ms: number) => (reduced ? 0 : ms);

  const flap: CSSProperties = {
    transformOrigin: "top",
    transform: seen && !reduced ? "rotateX(180deg)" : "rotateX(0deg)",
    transition: `transform 700ms ${EASE.drift} ${at(700)}ms`,
  };
  const envelope: CSSProperties = reduced
    ? { opacity: 0 }
    : {
        opacity: seen ? 0 : 1,
        transform: seen ? "translateY(56px) scale(0.94)" : "none",
        transition: `opacity 700ms ease-in ${at(1350)}ms, transform 900ms ${EASE.drift} ${at(1300)}ms`,
      };
  const note: CSSProperties = {
    opacity: seen ? 1 : 0,
    transform: seen ? "none" : "translateY(70px) scale(0.92)",
    transition: reduced
      ? "opacity 500ms linear"
      : `opacity 800ms ease-out ${at(1250)}ms, transform 1100ms ${EASE.silk} ${at(1250)}ms`,
  };

  return (
    <section
      id="love-note"
      ref={ref}
      aria-labelledby="note-heading"
      className="relative px-[var(--gutter)] pb-14 pt-[var(--section-gap)]"
    >
      <div className="relative mx-auto w-[min(88vw,350px)]">
        {/* the envelope, centred over where the note will be */}
        <div
          aria-hidden
          className="absolute left-1/2 top-[18%] z-10 -ml-[130px] h-[168px] w-[260px] [perspective:800px]"
          style={envelope}
        >
          <div className="absolute inset-0 rounded-[12px] border border-gold/70 bg-[#fffaf0] shadow-[0_18px_40px_-24px_rgb(23_59_86/0.6)]" />
          <svg viewBox="0 0 260 168" className="absolute inset-0 h-full w-full">
            <path
              d="M6 162 112 92M254 162 148 92"
              fill="none"
              stroke="rgb(var(--gold))"
              strokeWidth="1"
              opacity="0.8"
            />
          </svg>
          <div className="absolute inset-x-0 top-0 h-[64%] [transform-style:preserve-3d]" style={flap}>
            <svg viewBox="0 0 260 108" className="absolute inset-0 h-full w-full overflow-visible">
              <path
                d="M2 2h256L130 104Z"
                fill="#fff6e6"
                stroke="rgb(var(--gold))"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute -bottom-[16px] left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#E2C690] to-[#B98F4E] font-deva text-[17px] text-ivory shadow-[0_0_0_3px_rgb(255_250_240),0_4px_10px_-4px_rgb(138_100_47/0.8)]">
              ॐ
            </span>
          </div>
        </div>

        {/* the note */}
        <article
          className="relative rounded-[22px] border border-gold/60 bg-[#fffdf8] px-6 pb-8 pt-8 text-center shadow-[0_24px_50px_-30px_rgb(23_59_86/0.6)]"
          style={note}
        >
          <div aria-hidden className="pointer-events-none absolute inset-[7px] rounded-[16px] border border-gold/30" />
          <Reveal
            show={seen}
            delay={at(1700)}
            as="p"
            className="font-sans text-[10.5px] font-medium uppercase tracking-eyebrow text-gold-ink"
          >
            {copy.eyebrow}
          </Reveal>
          <Reveal show={seen} delay={at(1850)}>
            <h2 id="note-heading" className="mt-3 text-[34px]">
              {copy.title}
            </h2>
          </Reveal>
          <Reveal
            show={seen}
            delay={at(2050)}
            as="p"
            className="mt-3 text-balance font-display text-[19.5px] font-medium italic leading-snug text-slate"
          >
            {greeting && <span className="mb-1 block not-italic text-navy">{greeting}</span>}
            {copy.message}
          </Reveal>
          <Reveal show={seen} delay={at(2300)} className="mt-6">
            <p className="font-display text-[17px] italic text-slate">{copy.signoff}</p>
            <p className="font-script text-[36px] leading-tight text-gold-ink">
              {couple.bride.displayName} &amp; {couple.groom.displayName}
            </p>
          </Reveal>
          <Reveal
            show={seen}
            delay={at(2550)}
            as="p"
            className="mt-5 font-sans text-[11px] font-medium uppercase tracking-[0.3em] text-navy"
          >
            {copy.closing}
          </Reveal>
        </article>
      </div>

      {credits.openingHands && (
        <p className="mt-10 text-center font-sans text-[10px] tracking-wide text-navy/55">{credits.openingHands}</p>
      )}
    </section>
  );
}
