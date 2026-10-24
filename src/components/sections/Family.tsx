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
 * lotus rule. Each family stands in the peacock frame — gold pillars crowned with gold scrolls, a
 * peacock on each pillar — its photograph between them (an arched top, a fine gold edge), the
 * peacocks just in front of it; then the family's name and its members (relation in gold capitals,
 * names beneath). On a
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
            <Side side={side} show={pairSeen} reduced={reduced} delay={reduced ? 0 : i * 320} />
          </Fragment>
        ))}
      </div>
    </section>
  );
}

function Side({ side, show, reduced, delay }: { side: FamilySide; show: boolean; reduced: boolean; delay: number }) {
  const photoIn = delay + (reduced ? 0 : 450);
  const appear = (ms: number, extra?: CSSProperties): CSSProperties =>
    reduced
      ? { opacity: show ? 1 : 0, transition: "opacity 500ms linear" }
      : { opacity: show ? 1 : 0, transition: `opacity 900ms ease-out ${ms}ms, transform 1100ms ${EASE.silk} ${ms}ms`, ...extra };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="fam-frame" style={appear(delay, { transform: show || reduced ? "none" : "translateY(10px) scale(0.97)" })}>
        <PeacockFrame
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

/** The photograph's window in the frame picture (%): between the peacocks, under the gold scrolls. */
const WINDOW = { left: 22, top: 14, width: 56, height: 81 };

/**
 * The peacock frame: the photograph in its window (an arched top, a fine gold edge), the frame
 * picture over it — gold pillars and scrolls, a peacock on each pillar — so the peacocks stand just
 * in front of the photograph's edges. Before a photo comes: a pale wash with a small lotus.
 */
function PeacockFrame({ photo, photoStyle }: { photo: FamilySide["photo"]; photoStyle?: CSSProperties }) {
  const { familyFrame, familyFrameSize } = wedding.assets;
  return (
    <div className="fam-peacock" style={{ aspectRatio: `${familyFrameSize.width} / ${familyFrameSize.height}` }}>
      <div
        className="fam-window"
        style={{ left: `${WINDOW.left}%`, top: `${WINDOW.top}%`, width: `${WINDOW.width}%`, height: `${WINDOW.height}%` }}
      >
        {photo.src ? (
          <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" draggable={false} className="fam-window-photo" style={photoStyle} />
        ) : (
          <div role="img" aria-label={`${photo.alt} (photo to come)`} className="flex h-full w-full items-center justify-center">
            <svg aria-hidden viewBox="0 0 40 40" className="h-1/4 w-1/4" fill="none" stroke="#b89554" strokeWidth="1.2">
              <path d="M20 30c-5-6-5-13 0-19 5 6 5 13 0 19Zm0 0c-7-1-12-6-13-12 7 0 12 5 13 12Zm0 0c7-1 12-6 13-12-7 0-12 5-13 12Z" />
            </svg>
          </div>
        )}
      </div>
      <img
        aria-hidden
        src={familyFrame}
        alt=""
        width={familyFrameSize.width}
        height={familyFrameSize.height}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="fam-peacock-art"
      />
    </div>
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
