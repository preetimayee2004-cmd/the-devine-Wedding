import { Fragment, useId, useRef, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { usePersonal } from "@/context/GuestContext";
import type { FamilySide } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { inLang, useCopy, useLang } from "@/lib/lang";
import { EASE } from "@/lib/motion";
import { LotusRule } from "@/components/art/Ornaments";
import { TempleBells, TempleSilhouette } from "@/components/art/Temple";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 06 — two families, one celebration (PRD §4).
 *
 * Temple bells hang from the section's top corners; under the heading and its line, a small gold
 * lotus rule. Each family stands in the peacock frame — gold pillars crowned with gold scrolls, a
 * peacock on each pillar — its photograph between them (an arched top, a fine gold edge), the
 * peacocks just in front of it; then, together in one fine gold frame laid on its side (a little
 * flower and gold curls at each corner), the family's name and its members (relation in gold
 * capitals, names beneath). The two families stand one above the other, a lotus rule between, at
 * every width. A faint temple stands at the foot. Seen, the bells drop in and settle, the frame
 * appears, then the photograph within it, then the names; the two sides take turns.
 */
export function Family() {
  const family = useCopy(wedding.family);
  const personal = usePersonal();
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

      <SectionHeading id="family-heading" eyebrow={family.eyebrow} title={family.title} intro={personal(family.introFor, family.intro)} show={seen} />
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

function Side({ side: own, show, reduced, delay }: { side: FamilySide; show: boolean; reduced: boolean; delay: number }) {
  // its title and its people, in the card's language
  const hindi = useLang() === "hi";
  const side = { ...inLang(own, hindi), members: own.members.map((m) => inLang(m, hindi)) };
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

      {/* the family's name and all its members, together in one gold frame laid on its side */}
      <Reveal show={show} delay={photoIn + 120} className="fam-names">
        <NamesFrame />
        <Reveal show={show} delay={photoIn + 260}>
          <h3 className="text-balance text-[24px] leading-tight">{side.title}</h3>
        </Reveal>
        <dl className="mt-3 space-y-3">
          {side.members.map((m, i) => (
            <Reveal key={m.relation + m.name} show={show} delay={photoIn + 380 + i * 110}>
              <dt className="fam-relation font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-ink">{m.relation}</dt>
              <dd className="mt-1 text-balance font-display text-[18px] font-medium leading-snug text-navy">{m.name}</dd>
            </Reveal>
          ))}
        </dl>
      </Reveal>
    </div>
  );
}

/**
 * The names' frame: one fine gold line around them, and at each corner a little gold flower with a
 * curl along either edge (a loop, then a bead). Drawn once for the top-left corner — the line's corner
 * at (10, 10) — and mirrored for the others; it stretches to the names, the corners keep their size.
 */
function NamesFrame() {
  const id = useId().replace(/:/g, "");
  return (
    <span aria-hidden className="fam-names-frame">
      <span className="fam-names-line" />
      {/* (whole class names, so the stylesheet keeps them) */}
      {["fam-corner-tl", "fam-corner-tr", "fam-corner-bl", "fam-corner-br"].map((c) => (
        <svg key={c} className={`fam-corner ${c}`} viewBox="0 0 48 48" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {c === "fam-corner-tl" && (
            <defs>
              <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#9c6b1e" />
                <stop offset="0.5" stopColor="#d9b25e" />
                <stop offset="1" stopColor="#a8741f" />
              </linearGradient>
            </defs>
          )}
          {/* a curl along the top edge, and the same along the left (mirrored across the diagonal) */}
          {[undefined, "matrix(0 1 1 0 0 0)"].map((t) => (
            <g key={t ?? "top"} transform={t}>
              <path
                d="M13.5 8.6C17 6 20.6 5.2 23.6 6.4c2.6 1 2.6 4.4 0.2 4.9-2 0.4-2.9-1.6-1.6-3.1 2.2-2.6 7-3.4 11.3-2"
                stroke={`url(#${id}-g)`}
                strokeWidth="1.1"
              />
              <circle cx="36.4" cy="6.6" r="1.7" fill="#a8741f" />
              <circle cx="31.6" cy="3.4" r="0.8" fill="#b89554" />
              <path d="M14.4 12.6c1.6 2.4 4.4 3 6.2 1.6" stroke={`url(#${id}-g)`} strokeWidth="0.9" />
            </g>
          ))}
          {/* the little flower where the lines meet */}
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="9.6" cy="6.9" rx="1.9" ry="2.7" fill="#dcb562" stroke="#a8741f" strokeWidth="0.5" transform={`rotate(${a} 9.6 9.6)`} />
          ))}
          <circle cx="9.6" cy="9.6" r="1.5" fill="#9c6b1e" />
        </svg>
      ))}
    </span>
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
