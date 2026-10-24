import { Fragment, useRef, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import type { FamilySide } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { EASE } from "@/lib/motion";
import { TempleBells, TempleSilhouette } from "@/components/art/Temple";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 06 — two families, one celebration (PRD §4).
 *
 * Temple bells hang from the section's top corners; under the heading and its line, a small gold
 * lotus rule. Each family stands in a temple-arch frame — a pointed, lobed arch in fine gold with a
 * lotus on its peak, an ivory mat, a small flourish at each side and corner — its photograph filling
 * the arch; then the family's name and its members (relation in gold capitals, names beneath). On a
 * phone the two families stand one above the other with a lotus rule between; on a wider screen,
 * side by side. A faint temple stands at the foot. Seen, the bells drop in and settle, the frame
 * appears, then the photograph within it, then the names; the two sides take turns.
 */
export function Family() {
  const { family } = wedding;
  const sectionRef = useRef<HTMLElement>(null);
  const pairRef = useRef<HTMLDivElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.1 });
  const pairSeen = useInView(pairRef, { threshold: 0.15 });
  const reduced = usePrefersReducedMotion();

  return (
    <section
      id="family"
      ref={sectionRef}
      aria-labelledby="family-heading"
      className="relative px-[var(--gutter)] pb-10 pt-10"
      data-bells={seen ? (reduced ? "still" : "in") : "hidden"}
    >
      <TempleBells />
      <TempleSilhouette className="fam-temple" />

      <SectionHeading id="family-heading" eyebrow={family.eyebrow} title={family.title} intro={family.intro} show={seen} />
      <Reveal show={seen} delay={reduced ? 0 : 380} className="mt-3 flex justify-center">
        <LotusRule />
      </Reveal>

      <div ref={pairRef} className="fam-pair">
        {family.sides.map((side, i) => (
          <Fragment key={side.title}>
            {i > 0 && (
              <Reveal show={pairSeen} delay={reduced ? 0 : 900} className="fam-between">
                <LotusRule />
              </Reveal>
            )}
            <Side side={side} index={i} show={pairSeen} reduced={reduced} delay={reduced ? 0 : i * 320} />
          </Fragment>
        ))}
      </div>
    </section>
  );
}

function Side({ side, index, show, reduced, delay }: { side: FamilySide; index: number; show: boolean; reduced: boolean; delay: number }) {
  const photoIn = delay + (reduced ? 0 : 450);
  const appear = (ms: number, extra?: CSSProperties): CSSProperties =>
    reduced
      ? { opacity: show ? 1 : 0, transition: "opacity 500ms linear" }
      : { opacity: show ? 1 : 0, transition: `opacity 900ms ease-out ${ms}ms, transform 1100ms ${EASE.silk} ${ms}ms`, ...extra };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="fam-frame" style={appear(delay, { transform: show || reduced ? "none" : "translateY(10px) scale(0.97)" })}>
        <ArchFrame
          id={`fam-window-${index}`}
          photo={side.photo}
          photoStyle={
            reduced
              ? undefined
              : {
                  opacity: show ? 1 : 0,
                  transform: show ? "none" : "scale(1.06)",
                  transition: `opacity 900ms ease-out ${photoIn}ms, transform 1600ms ${EASE.silk} ${photoIn}ms`,
                }
          }
        />
      </div>

      <Reveal show={show} delay={photoIn + 200}>
        <h3 className="mt-5 text-balance text-[24px] leading-tight">{side.title}</h3>
      </Reveal>
      <dl className="mt-3 space-y-3">
        {side.members.map((m, i) => (
          <Reveal key={m.relation + m.name} show={show} delay={photoIn + 320 + i * 110}>
            <dt className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-ink">{m.relation}</dt>
            <dd className="mt-1 text-balance font-display text-[18px] font-medium leading-snug text-navy">{m.name}</dd>
          </Reveal>
        ))}
      </dl>
    </div>
  );
}

/** The arch's outer edge and its inner one (the photograph's window), in a 200 × 270 frame. */
const OUTER =
  "M6 262V70C6 56 16 48 30 44C40 41 46 34 52 28C60 20 70 18 80 18C88 18 94 14 100 8C106 14 112 18 120 18C130 18 140 20 148 28C154 34 160 41 170 44C184 48 194 56 194 70V262Z";
const INNER =
  "M13 255V72C13 61 21 55 33 51C44 48 51 41 57 34C64 27 72 25 81 25C89 25 95 21 100 16C105 21 111 25 119 25C128 25 136 27 143 34C149 41 156 48 167 51C179 55 187 61 187 72V255Z";
/** A flourish at the left side's middle and at its foot (the right side's are its mirror). */
const SIDE_FLOURISH = "M6 140C0 142-3 146-3 150S0 158 6 160M-3 150H-7";
const FOOT_FLOURISH = "M6 262C1 262-2 265-2 269M6 262C6 267 9 270 13 270";

/**
 * The temple-arch frame: an ivory mat between two fine gold lines, a lotus on the peak, small
 * flourishes; the photograph fills the inner arch (cropped to it, centred), or — before it comes — a
 * pale wash with a small lotus.
 */
function ArchFrame({ id, photo, photoStyle }: { id: string; photo: FamilySide["photo"]; photoStyle?: CSSProperties }) {
  return (
    <svg role="img" aria-label={photo.src ? photo.alt : `${photo.alt} (photo to come)`} viewBox="-10 -10 220 290" className="fam-arch">
      <defs>
        <clipPath id={id}>
          <path d={INNER} />
        </clipPath>
        <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "rgb(var(--sky-pale))" }} />
          <stop offset="1" style={{ stopColor: "rgb(var(--sky))" }} />
        </linearGradient>
      </defs>
      {/* the mat, edged in gold */}
      <path d={OUTER} fill="#fffbf2" stroke="#c9a45c" strokeWidth="1.3" />
      {photo.src ? (
        <image
          href={photo.src}
          x="13"
          y="16"
          width="174"
          height="239"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${id})`}
          className="fam-photo"
          style={photoStyle}
        />
      ) : (
        <g clipPath={`url(#${id})`}>
          <rect x="13" y="16" width="174" height="239" fill={`url(#${id}-wash)`} />
          <path d="M100 150c-6-8-6-16 0-24 6 8 6 16 0 24Zm0 0c-9-2-15-7-17-15 8 0 14 6 17 15Zm0 0c9-2 15-7 17-15-8 0-14 6-17 15Z" fill="none" stroke="#b89554" strokeWidth="1.2" />
        </g>
      )}
      <path d={INNER} fill="none" stroke="#b89554" strokeWidth="1" />
      {/* the lotus on the peak */}
      <g fill="#ecd69f" stroke="#b89554" strokeWidth="0.8" strokeLinejoin="round">
        <path d="M100 7C95 6 92 3 91-1C95-1 98 2 100 7Z" />
        <path d="M100 7C105 6 108 3 109-1C105-1 102 2 100 7Z" />
        <path d="M100 7C97 3 97-1 100-4C103-1 103 3 100 7Z" />
      </g>
      {/* the flourishes at each side and foot */}
      <g fill="none" stroke="#b89554" strokeWidth="1" strokeLinecap="round">
        <path d={SIDE_FLOURISH} />
        <path d={FOOT_FLOURISH} />
        <g transform="translate(200 0) scale(-1 1)">
          <path d={SIDE_FLOURISH} />
          <path d={FOOT_FLOURISH} />
        </g>
      </g>
      <g fill="#b89554">
        <circle cx="-9" cy="150" r="1.4" />
        <circle cx="209" cy="150" r="1.4" />
      </g>
    </svg>
  );
}

/** A small gold lotus between two fine lines. */
function LotusRule() {
  return (
    <svg aria-hidden viewBox="0 0 140 14" className="h-[14px] w-[140px]" fill="none">
      <path d="M0 8h56M84 8h56" stroke="#b89554" strokeOpacity="0.85" strokeWidth="0.8" />
      <g fill="#e9d29a" fillOpacity="0.6" stroke="#b89554" strokeWidth="0.8" strokeLinejoin="round">
        <path d="M70 12C66 11.5 62.5 9 61.5 5.5 65.5 5.5 68.5 8 70 12Z" />
        <path d="M70 12C74 11.5 77.5 9 78.5 5.5 74.5 5.5 71.5 8 70 12Z" />
        <path d="M70 12C67.5 8.5 67.5 5 70 1.5 72.5 5 72.5 8.5 70 12Z" />
      </g>
    </svg>
  );
}
