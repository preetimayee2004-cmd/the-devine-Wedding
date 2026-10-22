import { useMemo, useRef, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { useGuest } from "@/context/GuestContext";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { directionsUrl } from "@/lib/maps";
import { EASE } from "@/lib/motion";
import { formatVenueDate, parseVenueDateTime } from "@/lib/venueTime";
import { Icon } from "@/components/art/Icons";

const GOLD = "#b8893a";
const NAVY = "#1b3556";

/**
 * Section 02 — one screen, in the style of the couple's chosen painting, on
 * the site's own sky: a carved golden arch with temple bells and jasmine
 * strings across the top; on the sky below the bells, the guest's welcome —
 * their name from the link, the couple's names, the hashtag, the date and
 * the venue (a map link); and at the foot the couple offering water to the
 * Shivling, by the river with a temple, a diya and lotuses — always with
 * clear sky above their heads. The words rise in one by one as the section
 * comes into view. It keeps its id because "View the Invitation" and the
 * Save the Date's auto-glide land here.
 */
export function Couple() {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { threshold: 0.25 });
  const reduced = usePrefersReducedMotion();
  const { guestName } = useGuest();
  const { coupleWelcome: copy, couple, venue, assets } = wedding;
  const { coupleArch, coupleArchSize, coupleScene, coupleSceneSize } = assets;

  const date = useMemo(() => {
    const parts = parseVenueDateTime(wedding.wedding.dateTime);
    return parts ? formatVenueDate(parts) : null;
  }, []);

  // one by one: fade in and rise 10px (700ms, 150ms apart); nothing moves for reduced motion
  const appear = (step: number): CSSProperties =>
    reduced
      ? {}
      : {
          opacity: seen ? 1 : 0,
          transform: seen ? "none" : "translateY(10px)",
          transition: `opacity 700ms ${EASE.silk} ${step * 150}ms, transform 700ms ${EASE.silk} ${step * 150}ms`,
        };

  return (
    // it starts right where the Save the Date ends — no gap
    <section ref={ref} id="couple" aria-label="Welcome" className="couple-scene relative flex flex-col items-center">
      <img
        src={coupleArch}
        alt=""
        aria-hidden
        width={coupleArchSize.width}
        height={coupleArchSize.height}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="pointer-events-none absolute inset-x-0 top-0 block h-auto w-full select-none"
      />

      {/* ── the welcome, on the sky just below the bells ── */}
      <div className="couple-welcome relative z-[1] flex w-full flex-col items-center px-[var(--gutter)] text-center">
        <p className="font-display text-[length:var(--cw-welcome)] font-medium italic leading-none" style={{ color: GOLD, ...appear(0) }}>
          {copy.welcome}
        </p>
        <p
          className="mt-[var(--cw-gap)] max-w-full font-display text-[length:var(--cw-dear)] font-semibold leading-tight [overflow-wrap:anywhere]"
          style={{ color: NAVY, ...appear(1) }}
        >
          {copy.dear.replace("{guest}", guestName.slice(0, 40))}
        </p>
        <p className="mt-0.5 font-display text-[15px] italic leading-snug" style={{ color: NAVY, opacity: 0.85, ...appear(2) }}>
          {copy.invited}
        </p>

        {/* the couple, one above the other */}
        <h2
          className="mt-[var(--cw-gap-lg)] flex w-full flex-col items-center font-display text-[clamp(28px,8.5vw,38px)] font-semibold italic leading-[1.1] [overflow-wrap:anywhere]"
          style={{ color: NAVY, ...appear(3) }}
        >
          <span className="block max-w-full">{couple.bride.displayName}</span>
          <span className="block text-[0.55em] font-medium not-italic leading-[1.1]" style={{ color: GOLD }}>
            &amp;
          </span>
          <span className="block max-w-full">{couple.groom.displayName}</span>
        </h2>

        <p
          className="mt-[var(--cw-gap)] font-display text-[14px] font-semibold tracking-[0.08em]"
          style={{ color: GOLD, ...appear(4) }}
        >
          {copy.hashtag}
        </p>

        {/* the date on one line: day | month | year */}
        {date && (
          <p
            className="mt-[var(--cw-gap-lg)] flex items-center justify-center gap-3 font-display text-[13px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: NAVY, ...appear(5) }}
          >
            <span>{date.day}</span>
            <span aria-hidden className="h-3.5 w-px" style={{ background: GOLD }} />
            <span>{date.month}</span>
            <span aria-hidden className="h-3.5 w-px" style={{ background: GOLD }} />
            <span>{date.year}</span>
          </p>
        )}

        {/* the full location: tap for directions */}
        <a
          href={directionsUrl(venue)}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-[var(--cw-gap)] inline-flex min-h-[44px] max-w-full items-start justify-center gap-1.5 px-2 py-1 font-display"
          style={{ color: NAVY, ...appear(6) }}
        >
          <span className="mt-[3px] shrink-0" style={{ color: GOLD }}>
            <Icon name="pin" className="h-[18px] w-[18px]" />
          </span>
          <span className="flex min-w-0 flex-col items-center">
            <span className="text-[16px] font-bold leading-snug underline decoration-dotted decoration-1 underline-offset-4 [overflow-wrap:anywhere] group-hover:decoration-solid" style={{ textDecorationColor: GOLD }}>
              {venue.name}
            </span>
            <span className="text-[13px] font-medium leading-snug opacity-90 [overflow-wrap:anywhere]">{venue.address}</span>
          </span>
        </a>
      </div>

      {/* whatever height is left goes here, as sky above the couple */}
      <div aria-hidden className="flex-1" />

      {/* the couple at the Shivling: its clear top may sit beside the words, but their heads always
          keep at least 40px of sky below the last line */}
      <img
        src={coupleScene}
        alt="The couple offering water to the Shivling by the river, a temple behind them"
        width={coupleSceneSize.width}
        height={coupleSceneSize.height}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="couple-scene-foot pointer-events-none block h-auto w-full select-none"
      />
    </section>
  );
}
