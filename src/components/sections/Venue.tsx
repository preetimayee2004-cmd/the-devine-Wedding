import { useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { wedding } from "@/config/wedding";
import type { Stay, TravelPoint } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { directionsUrl, mapEmbedUrl, whatsappUrl } from "@/lib/maps";
import { formatVenueDate, parseVenueDateTime, venueInstant, zoneLabel } from "@/lib/venueTime";
import { Icon } from "@/components/art/Icons";
import { LotusRule } from "@/components/art/Ornaments";
import { TempleSilhouette } from "@/components/art/Temple";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 10 — "Finding Your Way": the venue, how to get there, and where to stay, in the
 * Shiv–Parvati key — cream cards on the pale sky, navy words, gold capitals, Cormorant headings.
 *
 * The venue: a cream card, a faint Kailash range along its top edge; the map cut into a temple arch
 * with a fine gold edge, a marigold garland and two small bells across its top, a gold lotus pin on
 * the place and a small gold "Maps" pill; then the venue's name, a small gold lotus rule, its
 * address and the date in gold capitals, and "Get Directions" (navy, a gold edge, a small lotus; a
 * soft ripple where it is pressed).
 *
 * The way in: three stops on a thin wavy line of Ganga blue, a small lotus at each — by air, by
 * rail, by road — each with its distance and time on one line; a tap opens (or closes) its detail.
 * Then a small tip: pickup details come on WhatsApp.
 *
 * Blessed Stays (a small bilva leaf by the label): cards to swipe across — each with its photo in an
 * arch (or a soft painted one until there is a photo), its name, distance and a line, Call (when
 * there is a number) and Map; the first the family hosts is marked so, in a gold edge. Then the point
 * of contact, with WhatsApp when there is a number.
 *
 * As it is reached, each card rises softly in and the lotus nodes open one after another along the
 * river line. Buttons are at least 48px tall. Reduced motion: plain fades, no ripple.
 */
export function Venue() {
  const { venue, travel } = wedding;
  const sectionRef = useRef<HTMLElement>(null);
  const travelRef = useRef<HTMLDivElement>(null);
  const staysRef = useRef<HTMLDivElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.06 });
  const travelSeen = useInView(travelRef, { threshold: 0.2 });
  const staysSeen = useInView(staysRef, { threshold: 0.15 });
  const reduced = usePrefersReducedMotion();
  const t = (ms: number) => (reduced ? 0 : ms);

  const when = useMemo(() => {
    const p = parseVenueDateTime(wedding.wedding.dateTime);
    if (!p) return null;
    const d = formatVenueDate(p);
    const zone = p.hour === null ? null : zoneLabel(venueInstant(p, wedding.wedding.timeZone), wedding.wedding.timeZone);
    return `${d.weekday}, ${d.day} ${d.month} ${d.year}${d.time ? ` · ${d.time}${zone ? ` ${zone}` : ""}` : ""}`;
  }, []);
  const placeUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name}, ${venue.address}`)}`;

  return (
    <section id="venue" ref={sectionRef} aria-labelledby="venue-heading" className="relative px-[var(--gutter)] pb-8 pt-[var(--section-gap)]">
      <SectionHeading id="venue-heading" eyebrow={travel.eyebrow} title={travel.title} show={seen} />

      <div className="mx-auto mt-8 max-w-[23rem] space-y-10">
        {/* the venue */}
        <Reveal show={seen} delay={t(250)}>
          <article className="fw-card" aria-labelledby="venue-name">
            <Kailash />
            <div className="fw-map-wrap">
              {/* the arch the map is cut to (in the box's own 0–1 units) */}
              <svg aria-hidden width="0" height="0" className="absolute">
                <defs>
                  <clipPath id="fw-arch-clip" clipPathUnits="objectBoundingBox">
                    <path transform="scale(0.01 0.0086957)" d={ARCH_PATH} />
                  </clipPath>
                </defs>
              </svg>
              <div className="fw-map">
                {seen && (
                  <iframe
                    src={mapEmbedUrl(venue)}
                    title={`Map of ${venue.name}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 h-full w-full border-0"
                  />
                )}
                <LotusPin />
                <a href={placeUrl} target="_blank" rel="noopener noreferrer" className="fw-maps-pill" aria-label={`Open ${venue.name} in Google Maps`}>
                  Maps
                  <Icon name="external" className="h-3.5 w-3.5" strokeWidth={1.6} />
                </a>
              </div>
              <svg aria-hidden viewBox="0 0 100 115" preserveAspectRatio="none" className="fw-arch-line">
                <path d={ARCH_PATH} vectorEffect="non-scaling-stroke" />
              </svg>
              <Garland />
            </div>
            <h3 id="venue-name" className="mt-5 text-[28px] leading-tight">
              {venue.name}
            </h3>
            <div className="mt-2 flex justify-center">
              <LotusRule />
            </div>
            <p className="mt-2 text-[14.5px] leading-relaxed text-slate">{venue.address}</p>
            {when && <p className="mt-2 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-ink">{when}</p>}
            <a href={directionsUrl(venue)} target="_blank" rel="noopener noreferrer" className="fw-directions" onPointerDown={reduced ? undefined : ripple}>
              <SmallLotus />
              Get Directions
            </a>
          </article>
        </Reveal>

        {/* the way in */}
        <div ref={travelRef}>
          <Reveal show={travelSeen} delay={t(0)}>
            <p className="fw-label">How to Reach</p>
          </Reveal>
          <ol className="fw-stops" data-shown={travelSeen || undefined} data-still={reduced || undefined}>
            <svg aria-hidden viewBox="0 0 20 100" preserveAspectRatio="none" className="fw-river">
              <path d={RIVER_PATH} pathLength={1} />
            </svg>
            {travel.points.map((p, i) => (
              <Stop key={p.name} point={p} index={i} show={travelSeen} reduced={reduced} />
            ))}
          </ol>
          <Reveal show={travelSeen} delay={t(900)} className="mt-4 flex justify-center">
            <p className="fw-tip">
              <Icon name="chat" className="h-4 w-4 shrink-0 text-gold-ink" strokeWidth={1.5} />
              {travel.pickupTip}
            </p>
          </Reveal>
        </div>

        {/* blessed stays */}
        <div ref={staysRef}>
          <Reveal show={staysSeen} delay={t(0)}>
            <p className="fw-label">
              <Bilva />
              {travel.stayTitle}
            </p>
            {travel.stayNote && <p className="mx-auto mt-2 max-w-[19rem] text-center text-[14px] leading-relaxed text-slate">{travel.stayNote}</p>}
          </Reveal>
          <div className="fw-carousel" role="list" aria-label={travel.stayTitle}>
            {travel.stays.map((s, i) => (
              <Reveal key={s.name} show={staysSeen} delay={t(150 + i * 120)} className="fw-slide">
                <StayCard stay={s} featured={s.hosted && travel.stays.findIndex((x) => x.hosted) === i} />
              </Reveal>
            ))}
          </div>
          <Reveal show={staysSeen} delay={t(500)}>
            <div className="fw-contact">
              <div className="text-left">
                <p className="font-display text-[19px] font-semibold leading-tight text-navy">{travel.contact.name}</p>
                <p className="mt-0.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gold-ink">{travel.contact.role}</p>
              </div>
              {travel.contact.phone ? (
                <a
                  href={whatsappUrl(travel.contact.phone, "Namaste! I'd like some help with travel for the wedding.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fw-pill fw-pill-solid"
                >
                  <Icon name="chat" className="h-4 w-4" strokeWidth={1.5} /> WhatsApp
                </a>
              ) : (
                <span className="font-sans text-[12px] italic text-slate/80">number to come</span>
              )}
            </div>
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

/** One way in: a lotus node on the river, its card; a tap opens or closes its detail. */
function Stop({ point, index, show, reduced }: { point: TravelPoint; index: number; show: boolean; reduced: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <li className="fw-stop" style={{ "--i": index } as CSSProperties}>
      <span aria-hidden className="fw-node">
        <SmallLotus />
      </span>
      <Reveal show={show} delay={reduced ? 0 : 200 + index * 220}>
        <div className="fw-stop-card" data-open={open || undefined}>
          <button type="button" className="fw-stop-head" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
            <span className="fw-stop-icon">
              <Icon name={point.kind} className="h-[19px] w-[19px]" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-ink">{point.label}</span>
              <span className="block font-display text-[18.5px] font-semibold leading-snug text-navy">{point.name}</span>
              <span className="block font-sans text-[12.5px] text-slate">
                {[point.place, point.distance, point.time].map((x) => x.split(" ").join(NBSP)).join(" · ")}
              </span>
            </span>
            <svg aria-hidden viewBox="0 0 24 24" className="fw-chevron" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div id={id} className="fw-stop-body" role="region" aria-label={`${point.label}: details`}>
            <div className="overflow-hidden">
              <p className="px-4 pb-4 text-[14px] leading-relaxed text-slate">{point.detail}</p>
            </div>
          </div>
        </div>
      </Reveal>
    </li>
  );
}

/** A stay, to swipe across: its photo in an arch, name, distance, a line, Call and Map. */
function StayCard({ stay, featured }: { stay: Stay; featured: boolean }) {
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stay.name}, ${wedding.venue.city}`)}`;
  return (
    <article className="fw-stay" data-featured={featured || undefined} role="listitem">
      {featured && <span className="fw-hosted">Hosted by family</span>}
      <div className="fw-stay-photo">
        {stay.photo ? (
          <img src={stay.photo} alt={stay.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <div role="img" aria-label={`${stay.name} (photo to come)`} className="fw-stay-wash">
            <TempleSilhouette className="fw-stay-temple" />
          </div>
        )}
      </div>
      <h4 className="mt-3 font-display text-[20px] font-semibold leading-snug text-navy">{stay.name}</h4>
      <p className="mt-0.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gold-ink">{stay.distance}</p>
      <p className="mt-1.5 text-[13.5px] leading-snug text-slate">{stay.note}</p>
      <div className="mt-auto flex gap-2 pt-3">
        {stay.phone && (
          <a href={`tel:+${stay.phone.replace(/\D/g, "")}`} className="fw-pill">
            <Icon name="phone" className="h-4 w-4 text-gold-ink" strokeWidth={1.5} /> Call
          </a>
        )}
        <a href={map} target="_blank" rel="noopener noreferrer" className="fw-pill">
          <Icon name="pin" className="h-4 w-4 text-gold-ink" strokeWidth={1.5} /> Map
        </a>
      </div>
    </article>
  );
}

/** A space that never breaks: keeps "about 25 km" and "50 min" each on one line. */
const NBSP = "\u00a0";

/** The map's temple arch, in a 100 × 115 box: a pointed, gently lobed top. */
const ARCH_PATH =
  "M0.5 114.5V40C0.5 30 8 23 19 19C29 15.5 35 11 40 6.5C44 3 47.5 1.5 50 0.5C52.5 1.5 56 3 60 6.5C65 11 71 15.5 81 19C92 23 99.5 30 99.5 40V114.5Z";
/** The river: a thin wave down the stops (20 × 100, stretched to their height). */
const RIVER_PATH = "M10 0C16 6 16 10 10 16S4 26 10 32 16 42 10 48 4 58 10 64 16 74 10 80 4 90 10 100";

/** A faint Kailash range along the card's top edge: pale blue on cream. */
function Kailash() {
  return (
    <svg aria-hidden viewBox="0 0 300 60" preserveAspectRatio="none" className="fw-kailash">
      <path d="M0 60V42L22 34 40 40 62 26 82 36 104 22 124 30 138 14Q150 2 162 14L176 28 196 20 216 34 238 24 260 36 280 30 300 38V60Z" fill="rgb(168 194 222 / 0.42)" />
      <path d="M0 60V50L30 44 58 48 92 40 122 46 150 38 182 46 214 40 246 47 276 42 300 46V60Z" fill="rgb(168 194 222 / 0.32)" />
      <path d="M144 12Q150 6 156 12L152 16 150 13 148 16Z" fill="#fffaf0" opacity="0.9" />
    </svg>
  );
}

/** Marigold garland swagged across the arch's top, three short strands, a small bell at each shoulder. */
function Garland() {
  const blooms: string[] = [];
  const swag = (x: number) => 12 + 22 * Math.sin((Math.PI * (x - 14)) / 272);
  for (let x = 14; x <= 286; x += 11) blooms.push(`${x},${swag(x).toFixed(1)}`);
  const strands = [70, 150, 230];
  return (
    <svg aria-hidden viewBox="0 0 300 90" className="fw-garland">
      <defs>
        <radialGradient id="fw-marigold" cx="40%" cy="35%" r="65%">
          <stop offset="0" stopColor="#ffd36b" />
          <stop offset="0.55" stopColor="#f7a12a" />
          <stop offset="1" stopColor="#d9731a" />
        </radialGradient>
      </defs>
      <path d={`M14 ${swag(14)} ${blooms.map((b) => `L${b.replace(",", " ")}`).join(" ")}`} fill="none" stroke="#9c6b2f" strokeWidth="0.8" />
      {strands.map((sx) => {
        const y0 = swag(sx);
        return (
          <g key={sx}>
            <path d={`M${sx} ${y0}V${y0 + 30}`} stroke="#9c6b2f" strokeWidth="0.7" />
            {[10, 19, 28].map((dy) => (
              <circle key={dy} cx={sx} cy={y0 + dy} r={dy === 28 ? 3.4 : 4.2} fill="url(#fw-marigold)" stroke="#c4661a" strokeWidth="0.4" />
            ))}
          </g>
        );
      })}
      {blooms.map((b) => {
        const [x, y] = b.split(",").map(Number);
        return (
          <g key={b}>
            <circle cx={x} cy={y} r="6" fill="url(#fw-marigold)" stroke="#c4661a" strokeWidth="0.5" />
            <circle cx={x} cy={y} r="2.6" fill="none" stroke="#e08a22" strokeWidth="0.6" opacity="0.8" />
          </g>
        );
      })}
      {[22, 278].map((bx) => (
        <g key={bx}>
          <path d={`M${bx} ${swag(bx)}V${swag(bx) + 14}`} stroke="#b89554" strokeWidth="0.8" />
          <image href="/art/couple-bell-1.webp" x={bx - 6} y={swag(bx) + 12} width="12" height="19" />
        </g>
      ))}
    </svg>
  );
}

/** The gold lotus pin on the place. */
function LotusPin() {
  return (
    <svg aria-hidden viewBox="0 0 32 42" className="fw-pin">
      <defs>
        <linearGradient id="fw-pin-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9c46a" />
          <stop offset="1" stopColor="#a8741f" />
        </linearGradient>
      </defs>
      <path d="M16 1C7.7 1 1 7.6 1 15.6 1 26 16 41 16 41S31 26 31 15.6C31 7.6 24.3 1 16 1Z" fill="url(#fw-pin-gold)" stroke="#8a5e17" strokeWidth="1" />
      <g fill="#fffaf0" stroke="#fffaf0" strokeWidth="0.4" strokeLinejoin="round">
        <path d="M16 21C14 18 14 14 16 10 18 14 18 18 16 21Z" />
        <path d="M16 21C13 20.5 10.5 18.5 10 15 13 15.5 15 17.5 16 21Z" />
        <path d="M16 21C19 20.5 21.5 18.5 22 15 19 15.5 17 17.5 16 21Z" />
      </g>
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

/** A bilva leaf: three leaflets on one stalk. */
function Bilva() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="rgb(184 149 84 / 0.18)" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <path d="M12 13C9.5 9.5 9.5 5 12 2c2.5 3 2.5 7.5 0 11Z" />
      <path d="M11.5 13.5C8 13.8 4.5 11.8 3 8.5c3.6-.6 6.9 1.4 8.5 5Z" />
      <path d="M12.5 13.5c3.5.3 7-1.7 8.5-5-3.6-.6-6.9 1.4-8.5 5Z" />
      <path d="M12 13v9" fill="none" />
    </svg>
  );
}
