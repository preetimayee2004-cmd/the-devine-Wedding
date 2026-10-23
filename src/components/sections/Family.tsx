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
 * Each family in an ornate frame of gilded scrolls on deep blue: the frame appears, then the
 * family photograph inside it (shown whole, everyone in it, a soft blur of itself filling the
 * frame above and below), then the names. On a phone the two families stand one above the other,
 * a gold thread dropping from the heading; on a wider screen they stand side by side and the
 * thread parts in two, one strand to each. The two sides take turns, so the eye moves from one
 * family to the other.
 */
export function Family() {
  const { family } = wedding;
  const sectionRef = useRef<HTMLElement>(null);
  const pairRef = useRef<HTMLDivElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.1 });
  const pairSeen = useInView(pairRef, { threshold: 0.15 });
  const reduced = usePrefersReducedMotion();

  return (
    <section id="family" ref={sectionRef} aria-labelledby="family-heading" className="relative px-[var(--gutter)] pb-2 pt-4">
      <SectionHeading
        id="family-heading"
        eyebrow={family.eyebrow}
        title={family.title}
        intro={family.intro}
        show={seen}
      />

      <div ref={pairRef} className="relative mt-6">
        {/* the thread: dropping to the first family on a phone; parting in two beside each other */}
        <svg aria-hidden viewBox="0 0 100 30" preserveAspectRatio="none" className="fam-thread-two h-10 w-full">
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
        <svg aria-hidden viewBox="0 0 10 30" preserveAspectRatio="none" className="fam-thread-one mx-auto h-8 w-3">
          <path d="M5 0V30" fill="none" stroke="rgb(var(--gold))" strokeWidth="1.4" vectorEffect="non-scaling-stroke" pathLength={1} style={draw(pairSeen, reduced, 0, 700)} />
        </svg>
        <div className="fam-pair">
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

/** The frame's opening, in % of the frame picture (a hair under its inner gold edge). */
const OPENING = { left: 23.99, top: 21.7, width: 51.87, height: 57.7 };

function Side({ side, show, reduced, delay }: { side: FamilySide; show: boolean; reduced: boolean; delay: number }) {
  const { photo } = side;
  const { familyFrame, familyFrameSize } = wedding.assets;
  const photoIn = delay + (reduced ? 0 : 500);
  const appear = (ms: number, extra?: CSSProperties): CSSProperties =>
    reduced
      ? { opacity: show ? 1 : 0, transition: "opacity 500ms linear" }
      : { opacity: show ? 1 : 0, transition: `opacity 900ms ease-out ${ms}ms, transform 1100ms ${EASE.silk} ${ms}ms`, ...extra };

  return (
    <div className="flex flex-col items-center text-center">
      {/* the frame: the photograph in its opening, the gilded frame over it */}
      <div
        className="fam-frame relative"
        style={{ aspectRatio: `${familyFrameSize.width} / ${familyFrameSize.height}`, ...appear(delay, { transform: show || reduced ? "none" : "scale(0.96)" }) }}
      >
        <div
          className="absolute overflow-hidden bg-sky-pale"
          style={{ left: `${OPENING.left}%`, top: `${OPENING.top}%`, width: `${OPENING.width}%`, height: `${OPENING.height}%`, ...appear(photoIn) }}
        >
          {photo.src ? (
            <>
              {/* a soft blur of the photo fills the opening; the photo itself, whole, over it */}
              <img aria-hidden src={photo.src} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-80 blur-md" />
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-contain"
                style={{
                  transform: show || reduced ? "scale(1)" : "scale(1.06)",
                  transition: reduced ? undefined : `transform 1600ms ${EASE.silk} ${photoIn}ms`,
                }}
              />
            </>
          ) : (
            <div
              role="img"
              aria-label={`${photo.alt} (photo to come)`}
              className="flex h-full w-full items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 50% 28%, #fff 0, transparent 52%), radial-gradient(circle at 50% 85%, rgb(var(--sky) / 0.9), transparent 65%), rgb(var(--sky-pale))",
              }}
            >
              <Icon name="kalash" className="h-[30%] w-[30%] text-gold-ink/55" strokeWidth={1} />
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
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
        />
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
