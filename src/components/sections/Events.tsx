import { useRef } from "react";
import { wedding } from "@/config/wedding";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 05 — the wedding events.
 *
 * "Wedding Events" and one quote, above the couple's gold temple arch —
 * wreathed in lotus and banana leaves, with the music of the celebration
 * (tabla, veena, harmonium, a painted gramophone) and a festive elephant at
 * its foot, the site's sky showing through it. The heading and quote fade up,
 * then the arch rises in gently, once.
 */
export function Events() {
  const { events, assets } = wedding;
  const sectionRef = useRef<HTMLElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.15 });
  const archSeen = useInView(archRef, { threshold: 0.2 });
  const reduced = usePrefersReducedMotion();

  return (
    <section id="events" ref={sectionRef} aria-labelledby="events-heading" className="relative px-[var(--gutter)] pb-16 pt-16">
      <SectionHeading id="events-heading" title={events.title} intro={`“${events.quote}”`} show={seen} />

      <div ref={archRef} className="events-arch" data-shown={archSeen || reduced || undefined} data-still={reduced || undefined}>
        <img
          src={assets.eventsArch}
          alt=""
          width={assets.eventsArchSize.width}
          height={assets.eventsArchSize.height}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="block h-auto w-full select-none"
        />
      </div>
    </section>
  );
}
