import { Fragment, useRef, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { usePersonal } from "@/context/GuestContext";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { LotusRule } from "@/components/art/Ornaments";

/**
 * Section 12 — the last page: a sacred envelope, opened.
 *
 * An ivory envelope drawn in fine antique gold: its flap gently curved to a soft point, a small round
 * gold seal with a lotus at the tip; its front pocket rising in a low temple arch. As it is reached
 * (once): the envelope fades in, the seal appears, the flap opens back, and the letter rises out of
 * the envelope — "With love, blessed by Mahadev", "Two Souls. One Sacred Journey.", a small gold
 * lotus rule and the blessing — its foot tucked in the pocket; then, on the pocket, the couple's names
 * and "Jai Mahadev". A faint Himalayan range rests below. For a guest named in the link the letter
 * opens "Dear …,". Reduced motion: the envelope is shown open, everything simply fades in.
 */
export function LoveNote() {
  const greeting = usePersonal()(wedding.loveNote.greetingFor, "");
  const { loveNote: copy, couple, credits } = wedding;
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { threshold: 0.3 });
  const reduced = usePrefersReducedMotion();

  return (
    <section
      id="love-note"
      ref={ref}
      aria-labelledby="note-heading"
      className="ln relative overflow-x-clip px-[var(--gutter)] pb-12 pt-10"
      data-shown={seen || undefined}
      data-still={reduced || undefined}
    >
      <div className="ln-stage">
        {/* the envelope's back, inside */}
        <svg aria-hidden className="ln-back" viewBox="0 0 340 211" preserveAspectRatio="none">
          <rect x="0.5" y="0.5" width="339" height="210" rx="8" />
        </svg>

        {/* the flap: in front while closed; opened back, behind the letter */}
        <div aria-hidden className="ln-flap">
          <svg viewBox="0 0 340 127" preserveAspectRatio="none" className="ln-flap-shape">
            <path d={FLAP} />
            <path d={FLAP_INNER} className="ln-flap-fine" />
          </svg>
          <span className="ln-seal">
            <svg viewBox="0 0 36 36" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="18" r="13.2" stroke="#fff6dc" strokeWidth="0.7" opacity="0.8" />
              <path d="M18 24.5C16.2 22 16.2 18.4 18 15 19.8 18.4 19.8 22 18 24.5Z" stroke="#fffaf0" strokeWidth="0.9" fill="rgb(255 248 228 / 0.25)" />
              <path d="M18 24.5C15.2 24 13.2 22 12.7 19.2 15.4 19.6 17.3 21.6 18 24.5ZM18 24.5C20.8 24 22.8 22 23.3 19.2 20.6 19.6 18.7 21.6 18 24.5Z" stroke="#fffaf0" strokeWidth="0.9" />
              <path d="M14.6 26.2H21.4" stroke="#fffaf0" strokeWidth="0.9" />
            </svg>
          </span>
        </div>

        {/* the letter, rising out of the envelope; its foot stays in the pocket */}
        <div className="ln-letter-wrap">
          <article className="ln-letter">
            <p className="ln-eyebrow ln-in" style={{ "--at": "1750ms" } as CSSProperties}>
              {/* on a narrow screen it breaks only after its comma */}
              {copy.eyebrow.split(", ").map((part, i, all) => (
                <Fragment key={i}>
                  {i > 0 && " "}
                  <span className="whitespace-nowrap">{i < all.length - 1 ? `${part},` : part}</span>
                </Fragment>
              ))}
            </p>
            {greeting && (
              <p className="ln-greeting ln-in" style={{ "--at": "1850ms" } as CSSProperties}>
                {greeting}
              </p>
            )}
            <h2 id="note-heading" className="ln-title ln-in" style={{ "--at": "1900ms" } as CSSProperties}>
              {copy.title}
            </h2>
            <div className="ln-in mt-3 flex justify-center" style={{ "--at": "2050ms" } as CSSProperties}>
              <LotusRule />
            </div>
            <p className="ln-message ln-in" style={{ "--at": "2150ms" } as CSSProperties}>
              {copy.message}
            </p>
          </article>
        </div>

        {/* the pocket, in front: a low temple arch along its top; the names and the sign-off on it */}
        <div className="ln-pocket">
          <svg aria-hidden viewBox="0 0 340 211" preserveAspectRatio="none" className="ln-pocket-shape">
            <path d={POCKET} />
            <path d={POCKET_EDGE} className="ln-pocket-fine" />
          </svg>
          <div className="ln-pocket-words">
            <p className="ln-names ln-in" style={{ "--at": "2450ms" } as CSSProperties}>
              {couple.bride.displayName}
              <span aria-label="and" className="ln-heart">
                ♡
              </span>
              {couple.groom.displayName}
            </p>
            <p className="ln-closing ln-in" style={{ "--at": "2700ms" } as CSSProperties}>
              {copy.closing}
            </p>
          </div>
        </div>
      </div>

      {/* the very last line: the mantra */}
      <p className="ln-in relative mt-8 text-center font-deva text-[22px] text-gold-ink" style={{ "--at": "3000ms" } as CSSProperties}>
        <span lang="sa">{copy.mantra}</span>
      </p>

      {/* a faint Himalayan range, resting below */}
      <svg aria-hidden viewBox="0 0 400 60" preserveAspectRatio="none" className="ln-himalaya">
        <path d="M0 60V44L30 34 52 40 80 24 102 36 128 20 150 30 168 12Q178 2 188 12L206 30 232 20 256 36 282 26 308 38 336 30 362 40 400 32V60Z" />
        <path d="M0 60V52L40 46 76 50 116 42 152 49 186 41 224 49 262 43 302 50 340 45 400 49V60Z" className="ln-himalaya-near" />
      </svg>

      {credits.openingHands && <p className="relative mt-6 text-center font-sans text-[10px] tracking-wide text-navy/55">{credits.openingHands}</p>}
    </section>
  );
}

/** The flap (340 × 127): from the envelope's top edge, its sides curving in to a soft point. */
const FLAP = "M0.5 0.5H339.5C339.5 26 238 92 178 120Q170 125 162 120C102 92 0.5 26 0.5 0.5Z";
const FLAP_INNER = "M9 4H331C318 30 232 86 176 111Q170 115 164 111C108 86 22 30 9 4Z";
/** The pocket (340 × 211, the envelope's own box): its top a low temple arch, peaking at the middle. */
const POCKET = "M0.5 112C60 104 120 84 162 66Q170 62 178 66C220 84 280 104 339.5 112V202.5Q339.5 210.5 331.5 210.5H8.5Q0.5 210.5 0.5 202.5Z";
const POCKET_EDGE = "M10 116C68 108 126 90 164 74Q170 71 176 74C214 90 272 108 330 116";
