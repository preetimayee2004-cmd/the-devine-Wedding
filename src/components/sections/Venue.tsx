import { useMemo, useRef, type ReactNode } from "react";
import { wedding } from "@/config/wedding";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { directionsUrl, mapEmbedUrl, whatsappUrl } from "@/lib/maps";
import { EASE } from "@/lib/motion";
import { formatVenueDate, parseVenueDateTime, venueInstant, zoneLabel } from "@/lib/venueTime";
import { Icon, type IconName } from "@/components/art/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 10 — venue, travel and accommodation (PRD §4). Practical first,
 * decorative second.
 *
 * The blessing wall's lotus becomes a location marker; a thin gold route
 * draws down from it to three connected panels: the venue (map preview and
 * directions) first, then travel, then where to stay. Call, WhatsApp and
 * booking buttons appear only for details that are actually filled in.
 */
export function Venue() {
  const { venue, travel } = wedding;
  const sectionRef = useRef<HTMLElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.06 });
  const reduced = usePrefersReducedMotion();

  const when = useMemo(() => {
    const p = parseVenueDateTime(wedding.wedding.dateTime);
    if (!p) return null;
    const d = formatVenueDate(p);
    const zone =
      p.hour === null ? null : zoneLabel(venueInstant(p, wedding.wedding.timeZone), wedding.wedding.timeZone);
    return `${d.weekday}, ${d.day} ${d.month} ${d.year}${d.time ? ` · ${d.time}${zone ? ` ${zone}` : ""}` : ""}`;
  }, []);

  const contacts = travel.contacts.filter((c) => c.phone);

  return (
    <section
      id="venue"
      ref={sectionRef}
      aria-labelledby="venue-heading"
      className="relative px-[var(--gutter)] pt-[var(--section-gap)]"
    >
      {/* the lotus, now a location marker, and the route it draws */}
      <div className="flex flex-col items-center text-gold-ink">
        <Reveal show={seen}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold bg-ivory/85">
            <Icon name="pin" className="h-6 w-6" />
          </span>
        </Reveal>
        <Route show={seen} reduced={reduced} delay={300} />
      </div>
      <SectionHeading id="venue-heading" eyebrow={travel.eyebrow} title={travel.title} show={seen} delay={200} />

      <div className="mx-auto mt-8 max-w-[23rem]">
        <Panel icon="pin" label="The Venue" show={seen} delay={reduced ? 0 : 500}>
          <div className="overflow-hidden rounded-[18px] border border-gold/50 bg-sky-pale/40">
            {seen && (
              <iframe
                src={mapEmbedUrl(venue)}
                title={`Map of ${venue.name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block aspect-[16/10] w-full border-0"
              />
            )}
          </div>
          <h3 className="mt-4 text-[27px] leading-tight">{venue.name}</h3>
          <p className="mt-1 text-[14.5px] leading-relaxed text-slate">{venue.address}</p>
          {when && (
            <p className="mt-2 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-gold-ink">{when}</p>
          )}
          <a
            href={directionsUrl(venue)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-6 py-3.5 font-sans text-[15px] font-medium tracking-[0.05em] text-ivory shadow-[0_12px_26px_-14px_rgb(23_59_86/0.9)] hover:bg-navy-deep"
          >
            <Icon name="route" className="h-5 w-5" /> Get Directions
          </a>
        </Panel>

        <Route show={seen} reduced={reduced} delay={1100} />

        <Panel icon="air" label="Travel" show={seen} delay={reduced ? 0 : 1300}>
          <ul className="space-y-4">
            {travel.points.map((p) => (
              <li key={p.name} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/60 text-gold-ink">
                  <Icon name={p.kind} className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="font-sans text-[10.5px] font-medium uppercase tracking-[0.2em] text-gold-ink">
                    {p.label}
                  </p>
                  <p className="font-display text-[18px] font-semibold leading-snug text-navy">{p.name}</p>
                  <p className="text-[13.5px] leading-snug text-slate">{p.note}</p>
                </div>
              </li>
            ))}
          </ul>
          {travel.pickup && (
            <p className="mt-5 rounded-[16px] bg-sky-pale/35 px-4 py-3 text-[14px] leading-relaxed text-slate">
              {travel.pickup}
            </p>
          )}
          {contacts.map((c) => (
            <ContactRow key={c.name} name={c.name} role={c.role} phone={c.phone!} />
          ))}
        </Panel>

        <Route show={seen} reduced={reduced} delay={1800} />

        <Panel icon="bed" label="Stay" show={seen} delay={reduced ? 0 : 2000}>
          {travel.stayNote && <p className="text-[14.5px] leading-relaxed text-slate">{travel.stayNote}</p>}
          <ul className="mt-4 space-y-3">
            {travel.stays.map((s) => (
              <li key={s.name} className="rounded-[18px] border border-gold/45 bg-white/50 px-4 py-3">
                <p className="font-display text-[19px] font-semibold leading-snug text-navy">{s.name}</p>
                <p className="font-sans text-[10.5px] font-medium uppercase tracking-[0.18em] text-gold-ink">
                  {s.distance}
                </p>
                <p className="mt-1 text-[13.5px] leading-snug text-slate">{s.note}</p>
                {(s.phone || s.bookingUrl) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.phone && <LinkButton href={`tel:+${s.phone.replace(/\D/g, "")}`} icon="phone" label="Call" />}
                    {s.bookingUrl && <LinkButton href={s.bookingUrl} icon="external" label="Book" external />}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </section>
  );
}

function Panel({
  icon,
  label,
  show,
  delay,
  children,
}: {
  icon: IconName;
  label: string;
  show: boolean;
  delay: number;
  children: ReactNode;
}) {
  return (
    <Reveal show={show} delay={delay}>
      <div className="rounded-[26px] border border-gold/60 bg-ivory/85 px-5 pb-6 pt-5 shadow-[0_18px_40px_-28px_rgb(23_59_86/0.55)]">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold-ink">
            <Icon name={icon} className="h-[18px] w-[18px]" />
          </span>
          <p className="font-sans text-[11px] font-medium uppercase tracking-eyebrow text-gold-ink">{label}</p>
        </div>
        {children}
      </div>
    </Reveal>
  );
}

/** A thin dashed gold route that draws itself downward. */
function Route({ show, reduced, delay }: { show: boolean; reduced: boolean; delay: number }) {
  return (
    <span
      aria-hidden
      className="mx-auto block h-10 w-px"
      style={{
        backgroundImage: "linear-gradient(rgb(var(--gold)) 55%, transparent 55%)",
        backgroundSize: "1px 7px",
        transformOrigin: "top",
        transform: show || reduced ? "scaleY(1)" : "scaleY(0)",
        transition: reduced ? "none" : `transform 700ms ${EASE.silk} ${delay}ms`,
      }}
    />
  );
}

function ContactRow({ name, role, phone }: { name: string; role: string; phone: string }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-gold/40 pt-4">
      <div>
        <p className="font-display text-[18px] font-semibold text-navy">{name}</p>
        <p className="font-sans text-[10.5px] font-medium uppercase tracking-[0.18em] text-gold-ink">{role}</p>
      </div>
      <div className="flex gap-2">
        <LinkButton href={`tel:+${phone.replace(/\D/g, "")}`} icon="phone" label="Call" />
        <LinkButton
          href={whatsappUrl(phone, "Namaste! I'd like some help with travel for the wedding.")}
          icon="chat"
          label="WhatsApp"
          external
        />
      </div>
    </div>
  );
}

function LinkButton({
  href,
  icon,
  label,
  external = false,
}: {
  href: string;
  icon: IconName;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex items-center gap-1.5 rounded-full border border-gold/80 bg-ivory px-3.5 py-2 font-sans text-[12.5px] font-medium text-navy hover:bg-white"
    >
      <Icon name={icon} className="h-4 w-4 text-gold-ink" /> {label}
    </a>
  );
}
