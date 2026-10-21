import { useRef, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import type { FamilySide } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { EASE } from "@/lib/motion";
import { Icon } from "@/components/art/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 06 — two families, one celebration (PRD §4).
 *
 * The sacred thread arrives at the centre and parts into two, leading into a
 * pair of gold arches. Each arch draws its outline first, then the family
 * photograph eases in from a slight zoom, then the names. The two sides
 * take turns, so the eye moves from one family to the other.
 */
export function Family() {
  const { family } = wedding;
  const sectionRef = useRef<HTMLElement>(null);
  const pairRef = useRef<HTMLDivElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.1 });
  const pairSeen = useInView(pairRef, { threshold: 0.25 });
  const reduced = usePrefersReducedMotion();

  return (
    <section id="family" ref={sectionRef} aria-labelledby="family-heading" className="relative px-[var(--gutter)]">
      <SectionHeading
        id="family-heading"
        eyebrow={family.eyebrow}
        title={family.title}
        intro={family.intro}
        show={seen}
      />

      <div ref={pairRef} className="relative mt-6">
        {/* the thread parts in two, one strand to each family */}
        <svg aria-hidden viewBox="0 0 100 30" preserveAspectRatio="none" className="block h-10 w-full">
          <path
            d="M50 0V8C50 20 25 14 25 30M50 8C50 20 75 14 75 30"
            fill="none"
            stroke="rgb(var(--gold))"
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            style={draw(pairSeen, reduced, 0, 900)}
          />
        </svg>
        <div className="grid grid-cols-2 gap-x-4">
          {family.sides.map((side, i) => (
            <Side key={side.title} side={side} show={pairSeen} reduced={reduced} delay={reduced ? 0 : 500 + i * 320} />
          ))}
        </div>
        <div className="mt-8 flex justify-center text-gold-ink">
          <Reveal show={pairSeen} delay={reduced ? 0 : 1800}>
            <Icon name="knot" className="h-7 w-7" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function draw(show: boolean, reduced: boolean, delay: number, duration: number): CSSProperties {
  return reduced
    ? { opacity: show ? 1 : 0, transition: "opacity 500ms linear" }
    : {
        strokeDasharray: "1 1",
        strokeDashoffset: show ? 0 : 1,
        transition: `stroke-dashoffset ${duration}ms ${EASE.silk} ${delay}ms`,
      };
}

function Side({ side, show, reduced, delay }: { side: FamilySide; show: boolean; reduced: boolean; delay: number }) {
  const { photo } = side;
  const photoIn = delay + (reduced ? 0 : 700);

  return (
    <div className="flex flex-col items-center text-center">
      {/* the arch: outline first, then the photograph inside it */}
      <div className="relative aspect-[3/4] w-full">
        <svg
          aria-hidden
          viewBox="0 0 300 400"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <g fill="none" stroke="rgb(var(--gold))" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
            <path
              pathLength={1}
              style={draw(show, reduced, delay, 1300)}
              d="M150 1A149 149 0 0 0 1 150V376Q1 399 24 399H150"
            />
            <path
              pathLength={1}
              style={draw(show, reduced, delay, 1300)}
              d="M150 1A149 149 0 0 1 299 150V376Q299 399 276 399H150"
            />
          </g>
        </svg>
        <div
          className="absolute inset-[6px] overflow-hidden rounded-b-[17px] rounded-t-full"
          style={{ opacity: show ? 1 : 0, transition: `opacity 900ms ease-out ${photoIn}ms` }}
        >
          {photo.src ? (
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              style={{
                transform: show ? "scale(1)" : "scale(1.08)",
                transition: `transform 1600ms ${EASE.silk} ${photoIn}ms`,
              }}
            />
          ) : (
            <div
              role="img"
              aria-label={`${photo.alt} (photo to come)`}
              className="flex h-full w-full items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 50% 28%, #fff 0, transparent 52%), radial-gradient(circle at 50% 85%, rgb(168 227 247 / 0.9), transparent 65%), #e9f6fc",
              }}
            >
              <Icon name="kalash" className="h-[30%] w-[30%] text-gold-ink/55" strokeWidth={1} />
            </div>
          )}
        </div>
      </div>

      <Reveal show={show} delay={photoIn + 200}>
        <h3 className="mt-4 text-balance text-[22px] leading-tight">{side.title}</h3>
      </Reveal>
      <dl className="mt-3 space-y-2.5">
        {side.members.map((m, i) => (
          <Reveal key={m.relation + m.name} show={show} delay={photoIn + 320 + i * 110}>
            <dt className="font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-gold-ink">
              {m.relation}
            </dt>
            <dd className="mt-0.5 text-balance font-display text-[17px] font-semibold leading-snug text-navy">
              {m.name}
            </dd>
          </Reveal>
        ))}
      </dl>
    </div>
  );
}
