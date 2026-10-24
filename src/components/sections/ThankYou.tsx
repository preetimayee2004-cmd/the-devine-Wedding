import { useRef, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { usePersonal } from "@/context/GuestContext";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { EASE } from "@/lib/motion";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Section 11 — blessed beginnings (PRD §4).
 *
 * The venue's route runs into a circular gold halo that draws itself slowly.
 * Within it, Shiv and Parvati paint in through the watercolour bloom; the
 * thank-you and a closing mantra follow.
 */
const HALO_DOTS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return [100 + 92 * Math.sin(a), 100 - 92 * Math.cos(a)];
});

export function ThankYou() {
  const personal = usePersonal();
  const { thankYou: copy, assets } = wedding;
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { threshold: 0.25 });
  const reduced = usePrefersReducedMotion();
  const at = (ms: number) => (reduced ? 0 : ms);

  const ring = (delay: number, duration: number): CSSProperties =>
    reduced
      ? { opacity: seen ? 1 : 0, transition: "opacity 500ms linear" }
      : {
          strokeDasharray: "1 1",
          strokeDashoffset: seen ? 0 : 1,
          transition: `stroke-dashoffset ${duration}ms ${EASE.silk} ${delay}ms`,
        };

  const paint: CSSProperties = reduced
    ? { opacity: seen ? 1 : 0, maskSize: "320% 320%", WebkitMaskSize: "320% 320%", transition: "opacity 500ms linear" }
    : {
        opacity: seen ? 1 : 0,
        maskSize: seen ? "320% 320%" : "30% 30%",
        WebkitMaskSize: seen ? "320% 320%" : "30% 30%",
        filter: seen ? "saturate(1)" : "saturate(0.3) brightness(1.1)",
        transition: [
          "opacity 700ms ease-out 400ms",
          `mask-size 2400ms ${EASE.silk} 400ms`,
          `-webkit-mask-size 2400ms ${EASE.silk} 400ms`,
          `filter 2600ms ${EASE.silk} 600ms`,
        ].join(", "),
      };

  return (
    <section
      id="thank-you"
      ref={ref}
      aria-labelledby="thanks-heading"
      className="relative px-[var(--gutter)] pt-4 text-center"
    >
      {/* the route arrives at the halo */}
      <span aria-hidden className="mx-auto block h-12 w-px bg-gradient-to-b from-gold/0 to-gold" />

      <div className="relative mx-auto aspect-square w-[min(80vw,330px)]">
        <div
          aria-hidden
          className="absolute inset-[6%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgb(var(--ivory) / 0.95) 0%, rgb(var(--ivory) / 0.55) 55%, rgb(var(--ivory) / 0) 72%)",
            opacity: seen ? 1 : 0,
            transition: "opacity 1600ms ease-out",
          }}
        />
        <svg aria-hidden viewBox="0 0 200 200" className="absolute inset-0 h-full w-full overflow-visible">
          <g fill="none" stroke="rgb(var(--gold))" strokeLinecap="round">
            <circle
              cx="100"
              cy="100"
              r="92"
              strokeWidth="1.1"
              pathLength={1}
              transform="rotate(-90 100 100)"
              style={ring(0, 2600)}
            />
            <circle
              cx="100"
              cy="100"
              r="85"
              strokeWidth="0.6"
              opacity="0.7"
              pathLength={1}
              transform="rotate(90 100 100)"
              style={ring(500, 2600)}
            />
          </g>
          <g
            fill="rgb(var(--gold))"
            style={{ opacity: seen ? 1 : 0, transition: `opacity 900ms ease-out ${at(2200)}ms` }}
          >
            {HALO_DOTS.map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" />
            ))}
          </g>
        </svg>
        {/* Shiv and Parvati, fading softly into the halo at the base */}
        <div className="absolute inset-x-[11%] bottom-[10%] top-[16%] [mask-image:linear-gradient(#000_72%,transparent)] [-webkit-mask-image:linear-gradient(#000_72%,transparent)]">
          <div
            className="watercolor-reveal flex h-full items-end justify-center"
            style={{ ...paint, "--watercolor-mask": `url(${assets.watercolorMask})` } as CSSProperties}
          >
            <img
              src={assets.divineCouple}
              alt="Shiva and Parvati seated together"
              loading="lazy"
              decoding="async"
              className="block h-auto w-full"
            />
          </div>
        </div>
      </div>

      <Reveal show={seen} delay={at(1300)} as="p" className="mt-6 font-script text-[30px] leading-tight text-gold-ink">
        {copy.eyebrow}
      </Reveal>
      <Reveal show={seen} delay={at(1450)}>
        <h2 id="thanks-heading" className="mt-1 text-[clamp(40px,12vw,50px)]">
          {copy.title}
        </h2>
      </Reveal>
      <Reveal
        show={seen}
        delay={at(1650)}
        as="p"
        className="mx-auto mt-3 max-w-[20rem] text-balance font-display text-[20px] font-medium italic leading-snug text-slate"
      >
        {personal(copy.messageFor, copy.message)}
      </Reveal>
      <Reveal show={seen} delay={at(1900)} as="p" className="mt-5 font-deva text-[21px] text-gold-ink">
        <span lang="sa">{copy.mantra}</span>
      </Reveal>
    </section>
  );
}
