import { useRef, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { usePersonal } from "@/context/GuestContext";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useCopy } from "@/lib/lang";
import { EASE } from "@/lib/motion";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Section 11 — blessed beginnings (PRD §4).
 *
 * The venue's route runs into a circular gold halo that draws itself slowly.
 * Within it, Shiv and Parvati, seated side by side with hands folded in prayer,
 * paint in through the watercolour bloom; then the thank-you. The small footer follows.
 */
const HALO_DOTS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return [100 + 92 * Math.sin(a), 100 - 92 * Math.cos(a)];
});

export function ThankYou() {
  const personal = usePersonal();
  const { assets } = wedding;
  const copy = useCopy(wedding.thankYou);
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
        {/* Shiv and Parvati in prayer, fading softly into the halo at the base; his crescent at the ring */}
        <div className="absolute inset-x-[7%] bottom-[7%] top-[4%] [mask-image:linear-gradient(#000_80%,transparent_99%)] [-webkit-mask-image:linear-gradient(#000_80%,transparent_99%)]">
          <div
            className="watercolor-reveal flex h-full items-end justify-center"
            style={{ ...paint, "--watercolor-mask": `url(${assets.watercolorMask})` } as CSSProperties}
          >
            <img
              src={assets.thankYouArt}
              alt="Shiva and Parvati seated side by side, hands folded in prayer"
              loading="lazy"
              decoding="async"
              className="block h-full w-full object-contain object-bottom"
            />
          </div>
        </div>
      </div>

      {/* in the plain serif, upright and a good size, so a guest of any age reads it at a glance */}
      <Reveal show={seen} delay={at(1300)} as="p" className="mt-6 font-display text-[22px] font-semibold leading-snug tracking-[0.01em] text-gold-ink">
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
    </section>
  );
}
