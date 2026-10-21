import { useMemo, useRef, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { useGuest } from "@/context/GuestContext";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { EASE } from "@/lib/motion";
import { formatVenueDate, parseVenueDateTime, venueInstant, zoneLabel } from "@/lib/venueTime";
import { GaneshaMedallion } from "@/components/ui/GaneshaMedallion";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Section 02 — a sacred beginning (PRD §4).
 *
 * Ganpati's blessing comes first — he draws himself in a gold ring, with the
 * mantra — then the guest's own welcome. The couple at the
 * Shivling paints itself in like a watercolour (a bloom that spreads while
 * the colour deepens), settling into soft clouds; the names, the promise
 * and the ceremony details follow. It plays once — scrolling away and back
 * never repaints it.
 */
export function Couple() {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { threshold: 0.15 });
  const reduced = usePrefersReducedMotion();
  const at = (ms: number) => (reduced ? 0 : ms);
  const { guestName } = useGuest();

  const { hero, couple, venue, assets } = wedding;

  const details = useMemo(() => {
    const parts = parseVenueDateTime(wedding.wedding.dateTime);
    if (!parts) return null;
    const date = formatVenueDate(parts);
    const zone =
      parts.hour === null ? null : zoneLabel(venueInstant(parts, wedding.wedding.timeZone), wedding.wedding.timeZone);
    return { date, zone };
  }, []);

  const paint: CSSProperties = reduced
    ? { opacity: seen ? 1 : 0, maskSize: "320% 320%", WebkitMaskSize: "320% 320%", transition: "opacity 500ms linear" }
    : {
        opacity: seen ? 1 : 0,
        maskSize: seen ? "320% 320%" : "30% 30%",
        WebkitMaskSize: seen ? "320% 320%" : "30% 30%",
        filter: seen ? "saturate(1) brightness(1)" : "saturate(0.3) brightness(1.1)",
        transition: [
          `opacity 700ms ease-out 700ms`,
          `mask-size 2400ms ${EASE.silk} 700ms`,
          `-webkit-mask-size 2400ms ${EASE.silk} 700ms`,
          `filter 2600ms ${EASE.silk} 900ms`,
        ].join(", "),
      };

  return (
    <section
      id="couple"
      ref={ref}
      aria-labelledby="couple-heading"
      className="relative flex flex-col items-center px-[var(--gutter)] pb-12 text-center"
    >
      {/* Ganpati's blessing first, then the guest's own welcome */}
      <div className="mt-10">
        <GaneshaMedallion show={seen} still={reduced} />
      </div>
      <Reveal show={seen} delay={at(500)} as="p" className="mt-2 font-deva text-[20px] leading-snug text-gold-ink">
        <span lang="sa">{hero.mantra}</span>
      </Reveal>
      <Reveal
        show={seen}
        delay={at(650)}
        as="p"
        className="mt-1 font-sans text-[10.5px] font-medium uppercase tracking-eyebrow text-slate"
      >
        {hero.blessing}
      </Reveal>
      <Reveal show={seen} delay={at(850)} as="p" className="mt-4 font-display text-[24px] font-medium italic text-navy">
        {hero.welcome.replace("{guest}", guestName)}
      </Reveal>

      <figure className="relative mt-3 w-[min(86vw,370px)]">
        <div
          className="watercolor-reveal"
          style={{ ...paint, "--watercolor-mask": `url(${assets.watercolorMask})` } as CSSProperties}
        >
          <img
            src={assets.heroCouple}
            alt={hero.illustrationAlt}
            width={490}
            height={630}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />
        </div>
        {/* The painting settles into soft clouds */}
        <img
          src={assets.clouds}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute bottom-[-14%] left-1/2 w-[165%] max-w-none"
          style={{
            opacity: seen ? 1 : 0,
            transform: seen ? "translate(-50%, 0)" : "translate(-50%, 18px)",
            transition: reduced
              ? "opacity 500ms linear"
              : `opacity 1400ms ${EASE.silk} ${at(700)}ms, transform 1800ms ${EASE.silk} ${at(700)}ms`,
          }}
        />
      </figure>

      <h2
        id="couple-heading"
        className="relative -mt-6 font-display text-[clamp(34px,10vw,44px)] font-semibold leading-tight text-navy"
      >
        <Reveal show={seen} delay={at(1000)} as="span" className="block">
          {couple.bride.displayName} <span className="font-medium italic text-gold-ink">&amp;</span>{" "}
          {couple.groom.displayName}
        </Reveal>
      </h2>
      <Reveal
        show={seen}
        delay={at(1200)}
        as="p"
        className="relative mt-1 font-script text-[32px] leading-tight text-gold-ink"
      >
        {hero.tagline}
      </Reveal>

      {details && (
        <Reveal show={seen} delay={at(1450)} className="relative mt-7 w-full max-w-[22rem]">
          <div className="rounded-[28px] border border-gold/60 bg-ivory/70 px-4 pb-5 pt-4 shadow-[0_14px_34px_-22px_rgb(23_59_86/0.45)] backdrop-blur-[2px]">
            <p className="font-deva text-[18px] leading-none text-gold-ink" lang="hi">
              {hero.ceremonyLabel}
            </p>
            <h3 className="mt-1 text-[26px]">{hero.ceremony}</h3>
            <dl className="mt-4 grid grid-cols-3 divide-x divide-gold/50">
              <Detail
                label="Date"
                value={`${details.date.day} ${details.date.monthShort} ${details.date.year}`}
                note={details.date.weekday}
              />
              <Detail label="Time" value={details.date.time ?? "To be announced"} note={details.zone} />
              <Detail label="Venue" value={venue.name} note={venue.city} />
            </dl>
          </div>
        </Reveal>
      )}
    </section>
  );
}

function Detail({ label, value, note }: { label: string; value: string; note: string | null }) {
  return (
    <div className="flex flex-col items-center px-2">
      <dt className="font-sans text-[10px] font-medium uppercase tracking-eyebrow text-gold-ink">{label}</dt>
      <dd className="mt-1.5 text-balance font-display text-[19px] font-semibold leading-tight text-navy">{value}</dd>
      {note && <dd className="mt-0.5 font-sans text-[12px] text-slate">{note}</dd>}
    </div>
  );
}
