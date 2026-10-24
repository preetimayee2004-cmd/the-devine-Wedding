import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { wedding } from "@/config/wedding";
import type { TravelPoint } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { directionsUrl, mapEmbedUrl } from "@/lib/maps";
import { formatVenueDate, parseVenueDateTime, venueInstant, zoneLabel } from "@/lib/venueTime";
import { Icon } from "@/components/art/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 10 — "Finding Your Way": the venue and how to get there, on the page's own
 * sky — navy words, gold capitals, Cormorant headings, and no more boxes than needed.
 *
 * The Wedding Destination: the real map (Google's, its roads, labels and pin left clear) set in a
 * temple arch with a fine antique-gold edge and a finer line just outside it, a small lotus above its
 * peak and a faint Himalayan range behind; then "The Wedding Destination", the venue's name in navy
 * serif, its address, the date and time in gold capitals, and "Find your way" (navy, a gold edge, a
 * small compass; a soft ripple where it is pressed) to the directions.
 *
 * A Sacred Journey: by air, by rail, by road — editorial rows, each with a small line icon in a fine
 * gold ring, its gold label, the place, and its distance and time on one line; a fine gold line
 * between rows; a tap (or Enter) opens a row's detail, the chevron turning. A curved gold route runs
 * behind the icons from the first to the last, never under the words. Then a small tip: pickup
 * details come on WhatsApp.
 *
 * As it is reached: the map fades in, the route draws itself, the icons follow a beat apart, the rows
 * rise in. Buttons are at least 48px tall. Reduced motion: plain fades, no ripple.
 */
export function Venue() {
  const { venue, travel } = wedding;
  const sectionRef = useRef<HTMLElement>(null);
  const travelRef = useRef<HTMLDivElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.06 });
  const travelSeen = useInView(travelRef, { threshold: 0.2 });
  const reduced = usePrefersReducedMotion();
  const t = (ms: number) => (reduced ? 0 : ms);

  const when = useMemo(() => {
    const p = parseVenueDateTime(wedding.wedding.dateTime);
    if (!p) return null;
    const d = formatVenueDate(p);
    const zone = p.hour === null ? null : zoneLabel(venueInstant(p, wedding.wedding.timeZone), wedding.wedding.timeZone);
    return `${d.weekday}, ${d.day} ${d.month} ${d.year}${d.time ? ` · ${d.time}${zone ? ` ${zone}` : ""}` : ""}`;
  }, []);
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <section id="venue" ref={sectionRef} aria-labelledby="venue-heading" className="relative px-[var(--gutter)] pb-8 pt-[var(--section-gap)]">
      <SectionHeading id="venue-heading" eyebrow={travel.eyebrow} title={travel.title} show={seen} />

      <div className="mx-auto mt-8 max-w-[23rem] space-y-12">
        {/* the wedding destination */}
        <Reveal show={seen} delay={t(250)}>
          <article className="fw-venue" aria-labelledby="venue-name">
            <div className="fw-frame" data-shown={seen || undefined}>
              <Himalaya />
              {/* the arch the map is cut to (in the box's own 0–1 units) */}
              <svg aria-hidden width="0" height="0" className="absolute">
                <defs>
                  <clipPath id="fw-arch-clip" clipPathUnits="objectBoundingBox">
                    <path transform="scale(0.01 0.0108696)" d={ARCH_PATH} />
                  </clipPath>
                </defs>
              </svg>
              <div className="fw-map" data-loaded={mapLoaded || undefined}>
                {seen && (
                  <iframe
                    src={mapEmbedUrl(venue)}
                    title={`Map of ${venue.name}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="fw-map-frame absolute left-0 w-full border-0"
                    onLoad={() => setMapLoaded(true)}
                  />
                )}
              </div>
              {/* its gold edge, and a finer line just outside — the frame only, nothing over the map */}
              <svg aria-hidden viewBox="0 0 100 92" preserveAspectRatio="none" className="fw-arch-line">
                <path d={ARCH_PATH} vectorEffect="non-scaling-stroke" />
              </svg>
              <svg aria-hidden viewBox="0 0 100 92" preserveAspectRatio="none" className="fw-arch-line fw-arch-outer">
                <path d={ARCH_PATH} vectorEffect="non-scaling-stroke" />
              </svg>
              <span aria-hidden className="fw-finial">
                <SmallLotus />
              </span>
            </div>
            <p className="fw-kicker">The Wedding Destination</p>
            <h3 id="venue-name" className="fw-venue-name">
              {venue.name}
            </h3>
            <p className="fw-address">{venue.address}</p>
            {when && <p className="fw-when">{when}</p>}
            <a href={directionsUrl(venue)} target="_blank" rel="noopener noreferrer" className="fw-directions" onPointerDown={reduced ? undefined : ripple}>
              <Compass />
              Find your way
            </a>
          </article>
        </Reveal>

        {/* a sacred journey */}
        <div ref={travelRef} className="fw-journey" data-shown={travelSeen || undefined} data-still={reduced || undefined}>
          <Reveal show={travelSeen} delay={t(0)}>
            <p className="fw-label">How to Reach</p>
            <h3 className="fw-journey-title">A Sacred Journey</h3>
          </Reveal>
          <Journey points={travel.points} show={travelSeen} reduced={reduced} />
          <Reveal show={travelSeen} delay={t(1200)} className="mt-5 flex justify-center">
            <p className="fw-tip">
              <Icon name="chat" className="h-4 w-4 shrink-0 text-gold-ink" strokeWidth={1.5} />
              {travel.pickupTip}
            </p>
          </Reveal>
        </div>

      </div>
    </section>
  );
}

/** A soft ripple from where the button is pressed. */
function ripple(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 1.3;
  const s = document.createElement("span");
  s.className = "fw-ripple";
  s.style.width = s.style.height = `${size}px`;
  s.style.left = `${e.clientX - r.left - size / 2}px`;
  s.style.top = `${e.clientY - r.top - size / 2}px`;
  el.appendChild(s);
  s.addEventListener("animationend", () => s.remove());
}

/**
 * The ways in, as rows on a curved gold route: the route is drawn (in pixels, so its line stays fine)
 * from the first icon's centre to the last, behind the icons and never under the words; it is redrawn
 * when a row opens or the width changes.
 */
function Journey({ points, show, reduced }: { points: readonly TravelPoint[]; show: boolean; reduced: boolean }) {
  const list = useRef<HTMLOListElement>(null);
  const [route, setRoute] = useState<{ top: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => {
      const icons = el.querySelectorAll<HTMLElement>(".fw-row-icon");
      if (icons.length < 2) return setRoute(null);
      const base = el.getBoundingClientRect().top;
      const first = icons[0].getBoundingClientRect();
      const lastIcon = icons[icons.length - 1].getBoundingClientRect();
      const top = first.top + first.height / 2 - base;
      setRoute({ top, height: lastIcon.top + lastIcon.height / 2 - base - top });
    };
    measure();
    if (!("ResizeObserver" in window)) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [points.length]);
  const h = route?.height ?? 0;
  // a gentle S between the icons' centre line (x = 22), swinging 9px either side
  const d = h ? `M22 0C9 ${h * 0.16} 9 ${h * 0.34} 22 ${h * 0.5}S35 ${h * 0.84} 22 ${h}` : "";
  return (
    <ol ref={list} className="fw-rows">
      {route && (
        <svg aria-hidden className="fw-route" viewBox={`0 0 44 ${h}`} style={{ top: route.top, height: h }}>
          <path d={d} pathLength={1} />
        </svg>
      )}
      {points.map((p, i) => (
        <Row key={p.name} point={p} index={i} show={show} reduced={reduced} />
      ))}
    </ol>
  );
}

/** One way in: its icon in a fine gold ring, label, place, distance and time; a tap opens its detail. */
function Row({ point, index, show, reduced }: { point: TravelPoint; index: number; show: boolean; reduced: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <li className="fw-row" data-open={open || undefined} style={{ "--i": index } as CSSProperties}>
      <button type="button" className="fw-row-head" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span className="fw-row-icon">
          <Icon name={point.kind} className="h-[18px] w-[18px]" strokeWidth={1.4} />
        </span>
        <Reveal as="span" show={show} delay={reduced ? 0 : 450 + index * 220} className="block min-w-0 flex-1 text-left">
          <span className="block font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-ink">{point.label}</span>
          <span className="block font-display text-[19px] font-semibold leading-snug text-navy">{point.name}</span>
          <span className="block font-sans text-[12.5px] text-slate">
            {[point.place, point.distance, point.time].map((x) => x.split(" ").join(NBSP)).join(" · ")}
          </span>
        </Reveal>
        <svg aria-hidden viewBox="0 0 24 24" className="fw-chevron" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div id={id} className="fw-row-body" role="region" aria-label={`${point.label}: details`}>
        <div className="overflow-hidden">
          <p className="fw-row-detail">{point.detail}</p>
        </div>
      </div>
    </li>
  );
}

/** A space that never breaks: keeps "about 25 km" and "50 min" each on one line. */
const NBSP = "\u00a0";

/** The map's temple arch, in a 100 × 92 box: a rounded top rising to a soft point. */
const ARCH_PATH = "M0.5 91.5V28C0.5 12.5 22 3 50 0.6C78 3 99.5 12.5 99.5 28V91.5Z";

/** A faint Himalayan range behind the arch's top — outside the map, never over it. */
function Himalaya() {
  return (
    <svg aria-hidden viewBox="0 0 300 70" preserveAspectRatio="none" className="fw-himalaya">
      <path d="M0 70V50L24 40 42 46 66 30 86 40 108 24 128 34 142 16Q150 6 158 16L172 32 194 22 214 38 236 28 258 40 280 34 300 42V70Z" fill="rgb(150 180 214 / 0.32)" />
      <path d="M0 70V58L30 52 60 56 94 47 124 54 150 45 182 54 214 47 246 55 276 50 300 54V70Z" fill="rgb(150 180 214 / 0.22)" />
      <path d="M146 14Q150 9 154 14L151.5 17 150 15 148.5 17Z" fill="#fffaf0" />
    </svg>
  );
}

/** A small compass: a fine ring and a needle (for "Find your way"). */
function Compass() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="fw-compass" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5 13.2 13.2 8.5 15.5 10.8 10.8Z" fill="currentColor" fillOpacity="0.35" />
      <path d="M12 2.6V4.2M12 19.8V21.4M2.6 12H4.2M19.8 12H21.4" strokeLinecap="round" />
    </svg>
  );
}

/** A small lotus, in fine line (for nodes and buttons). */
function SmallLotus() {
  return (
    <svg aria-hidden viewBox="0 0 24 16" className="fw-small-lotus" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
      <path d="M12 14C10 11 10 6.5 12 2.5 14 6.5 14 11 12 14Z" />
      <path d="M12 14C9 13.5 6.5 11 6 7.5 9 8 11 10.5 12 14Z" />
      <path d="M12 14C15 13.5 17.5 11 18 7.5 15 8 13 10.5 12 14Z" />
      <path d="M6.5 15H17.5" />
    </svg>
  );
}
