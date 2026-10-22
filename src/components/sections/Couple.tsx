import { useMemo, useRef, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { useGuest } from "@/context/GuestContext";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { directionsUrl } from "@/lib/maps";
import { EASE } from "@/lib/motion";
import { formatVenueDate, parseVenueDateTime } from "@/lib/venueTime";
import { Icon } from "@/components/art/Icons";

// deeper, for contrast on the sky and its clouds (each line also carries a soft white glow — index.css)
const GOLD = "#a8741f";
const HASHTAG = "#8a5a10";
const NAVY = "#12294a";
const NAVY_SOFT = "#1f3a5c";

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

  // "Dear {guest}," — the name set in bold
  const [dearBefore, dearAfter = ""] = copy.dear.split("{guest}");

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
        <p className="font-display text-[30px] font-semibold italic leading-none" style={{ color: GOLD, ...appear(0) }}>
          {copy.welcome}
        </p>
        <p
          className="mt-[14px] max-w-full font-display text-[17px] font-medium leading-tight [overflow-wrap:anywhere]"
          style={{ color: NAVY, ...appear(1) }}
        >
          {dearBefore}
          <strong className="font-bold">{guestName.slice(0, 40)}</strong>
          {dearAfter}
        </p>
        <p className="mt-0.5 font-display text-[14px] font-medium italic leading-snug" style={{ color: NAVY_SOFT, ...appear(2) }}>
          {copy.invited}
        </p>

        {/* the couple, one above the other */}
        <h2
          className="mt-[20px] flex w-full flex-col items-center font-display text-[clamp(34px,10vw,44px)] font-semibold italic leading-[1.1] [overflow-wrap:anywhere]"
          style={{ color: NAVY, ...appear(3) }}
        >
          <span className="block max-w-full">{couple.bride.displayName}</span>
          <span className="block text-[0.55em] font-semibold not-italic leading-[1.1]" style={{ color: GOLD }}>
            &amp;
          </span>
          <span className="block max-w-full">{couple.groom.displayName}</span>
        </h2>

        <p className="mt-[14px] font-display text-[15px] font-bold tracking-[0.08em]" style={{ color: HASHTAG, ...appear(4) }}>
          {copy.hashtag}
        </p>

        {/* the date on one line: day | month | year */}
        {date && (
          <p
            className="mt-[22px] flex items-center justify-center gap-3 font-display text-[15px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: NAVY, ...appear(5) }}
          >
            <span>{date.day}</span>
            <span aria-hidden className="h-4 w-px" style={{ background: GOLD, boxShadow: "none" }} />
            <span>{date.month}</span>
            <span aria-hidden className="h-4 w-px" style={{ background: GOLD, boxShadow: "none" }} />
            <span>{date.year}</span>
          </p>
        )}

        {/* the full location — the pin above, then the venue, then the address; tap for directions */}
        <a
          href={directionsUrl(venue)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-[18px] flex min-h-[44px] max-w-full flex-col items-center px-2 font-display"
          style={{ color: NAVY, ...appear(6) }}
        >
          <span aria-hidden style={{ color: GOLD }}>
            <Icon name="pin" className="h-[22px] w-[22px]" strokeWidth={1.6} />
          </span>
          <span className="mt-1 text-[18px] font-bold leading-snug [overflow-wrap:anywhere]">{venue.name}</span>
          <span className="text-[14px] font-medium leading-snug [overflow-wrap:anywhere]" style={{ color: NAVY_SOFT }}>
            {venue.address}
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
