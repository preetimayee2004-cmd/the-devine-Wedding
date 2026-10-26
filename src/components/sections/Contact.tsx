import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { usePersonal } from "@/context/GuestContext";
import type { Coordinator, FamilyContact } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { Icon } from "@/components/art/Icons";
import { Lotus, LotusRule } from "@/components/art/Ornaments";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 10½ — "Contact & Assistance": a royal wedding concierge, between the venue and the
 * thank-you.
 *
 * "Here for You", the heading and its line sit in a faint palace arch (a soft cream glow, a fine
 * double gold line, a small kalash at its peak, fading out below), a small gold lotus rule beneath.
 * Then the two families side by side (on a phone too), each in a miniature palace window: a pointed
 * arch on straight sides, a fine double antique-gold outline, a cream parchment ground with a faint
 * grain, a tiny gold lotus on its peak — the side in small gold capitals, the person's name in navy
 * serif, their relationship in small gold capitals, and a navy "Call" pill with a phone.
 *
 * Then "Wedding Coordination" and its line, over a connected directory: a fine gold line down the
 * left (a bead at each end), each coordinator a row — the role in gold capitals and the name in navy
 * serif on the left, a round navy call button on the right — a fine gold line between rows, a tiny
 * lotus where it meets the line down the side. Last, "We're just a call away." over a small lotus; a
 * faint palace skyline rests at the foot of the section.
 *
 * A call button dials its number (a tel: link, labelled with it for screen readers); until a number
 * is given it only says, quietly, that the number is coming (see `contact` in the config).
 *
 * As it is reached: the heading rises in and the arch behind it fades up; each window's gold outline
 * draws itself (the second a beat after the first), the ground and the lotus follow, then its words
 * and its button one by one; the line down the directory draws, the rows rise in one after another,
 * their lotuses with them; then the closing line. Reduced motion: plain fades.
 */
export function Contact() {
  const { contact } = wedding;
  const personal = usePersonal();
  const ref = useRef<HTMLElement>(null);
  const familyRef = useRef<HTMLDivElement>(null);
  const dirRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { threshold: 0.12 });
  const familySeen = useInView(familyRef, { threshold: 0.25 });
  const dirSeen = useInView(dirRef, { threshold: 0.3 });
  const closingSeen = useInView(closingRef, { threshold: 0.5 });
  const reduced = usePrefersReducedMotion();
  const t = (ms: number) => (reduced ? 0 : ms);

  return (
    <section
      id="contact"
      ref={ref}
      aria-labelledby="contact-heading"
      className="ct relative overflow-x-clip px-[var(--gutter)] pb-16 pt-[calc(var(--section-gap)+44px)]"
      data-shown={seen || undefined}
      data-still={reduced || undefined}
    >
      {/* the parchment's colour and grain, shared by the windows */}
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="ct-parch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffcf5" />
            <stop offset="1" stopColor="#f8eedb" />
          </linearGradient>
          <pattern id="ct-grain" width="160" height="160" patternUnits="userSpaceOnUse">
            <image href={GRAIN} width="160" height="160" />
          </pattern>
        </defs>
      </svg>

      <PalaceSkyline />

      {/* the heading, in a faint palace arch */}
      <div className="ct-head">
        <HeadArch />
        <SectionHeading id="contact-heading" eyebrow={contact.eyebrow} title={contact.title} intro={personal(contact.introFor, contact.intro)} show={seen} />
        <Reveal show={seen} delay={t(380)} className="mt-4 flex justify-center">
          <LotusRule />
        </Reveal>
      </div>

      {/* the two families, each in a palace window */}
      <div ref={familyRef} className="ct-family" data-shown={familySeen || undefined}>
        {contact.family.map((person, i) => (
          <FamilyWindow key={person.side} person={person} show={familySeen} at={t(i * 200)} reduced={reduced} />
        ))}
      </div>

      {/* wedding coordination: a connected directory */}
      <div ref={dirRef} className="mx-auto mt-12 max-w-[24rem]" data-shown={dirSeen || undefined}>
        <Reveal show={dirSeen} delay={t(0)}>
          <h3 className="ct-coord-title">{contact.coordinationTitle}</h3>
          <p className="mt-1 text-center text-[13px] leading-snug text-slate">{contact.coordinationNote}</p>
        </Reveal>
        <div className="ct-dir">
          <span aria-hidden className="ct-dir-line" />
          <ul>
            {contact.coordinators.map((c, i) => (
              <Reveal key={c.role} as="li" show={dirSeen} delay={t(500 + i * 260)} className="ct-dir-row">
                {i > 0 && <TinyLotus className="ct-dir-lotus" />}
                <CoordinatorRow person={c} />
              </Reveal>
            ))}
          </ul>
        </div>
      </div>

      {/* the closing line */}
      <div ref={closingRef} className="mt-10 text-center">
        <Reveal show={closingSeen} delay={t(100)} as="p" className="ct-closing">
          {contact.closing}
        </Reveal>
        <Reveal show={closingSeen} delay={t(260)} className="mt-2 flex justify-center">
          <Lotus className="h-5 w-[30px]" />
        </Reveal>
      </div>
    </section>
  );
}

/** A faint grain for the parchment (the same as the love note's letter). */
const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.55 0 0 0 0 0.42 0 0 0 0 0.22 0 0 0 0.08 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/**
 * A palace window's outline in a w × h box, inset by `i`: straight sides rising to a pointed arch
 * (each half a curve from the upright to the peak, the two meeting in a point), a straight sill.
 * `open` leaves the sill off.
 */
function windowPath(w: number, h: number, i: number, open = false) {
  const [x0, x1, y0, y1] = [i, w - i, i, h - i];
  const cx = w / 2;
  const span = x1 - x0;
  const spring = y0 + span * 0.4;
  const rise = spring - y0;
  const f = (n: number) => n.toFixed(2);
  const left = `C${f(x0)} ${f(spring - rise * 0.55)} ${f(cx - span * 0.2)} ${f(y0 + rise * 0.16)} ${f(cx)} ${f(y0)}`;
  const right = `C${f(cx + span * 0.2)} ${f(y0 + rise * 0.16)} ${f(x1)} ${f(spring - rise * 0.55)} ${f(x1)} ${f(spring)}`;
  return `M${f(x0)} ${f(y1)}L${f(x0)} ${f(spring)}${left}${right}L${f(x1)} ${f(y1)}${open ? "" : "Z"}`;
}

/** The size of an element, kept up to date. */
function useBox<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const { width: w, height: h } = el.getBoundingClientRect();
      setBox((b) => (b && Math.abs(b.w - w) < 0.5 && Math.abs(b.h - h) < 0.5 ? b : { w, h }));
    };
    measure();
    if (!("ResizeObserver" in window)) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box] as const;
}

/**
 * One family's contact in a miniature palace window: the outline drawn to the window's own size (so
 * the arch never stretches), a parchment ground, a tiny lotus on the peak; the words and the button.
 */
function FamilyWindow({ person, show, at, reduced }: { person: FamilyContact; show: boolean; at: number; reduced: boolean }) {
  const [ref, box] = useBox<HTMLElement>();
  const words = (ms: number) => at + (reduced ? 0 : ms);
  return (
    <article ref={ref} className="ct-window" aria-label={person.side} style={{ "--at": `${at}ms` } as CSSProperties}>
      {box && (
        <svg aria-hidden className="ct-window-art" width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`}>
          <path d={windowPath(box.w, box.h, 0.75)} className="ct-window-ground" />
          <path d={windowPath(box.w, box.h, 0.75)} className="ct-window-grain" />
          <path d={windowPath(box.w, box.h, 0.75)} className="ct-window-line" pathLength={1} />
          <path d={windowPath(box.w, box.h, 5.5)} className="ct-window-line ct-window-fine" pathLength={1} />
        </svg>
      )}
      <TinyLotus className="ct-window-lotus" />
      <div className="ct-window-body">
        <Reveal show={show} delay={words(650)}>
          <p className="ct-side">{person.side}</p>
        </Reveal>
        {person.name ? (
          <>
            <Reveal show={show} delay={words(760)}>
              <p className="ct-name">{person.name}</p>
            </Reveal>
            {person.relation && (
              <Reveal show={show} delay={words(860)}>
                <p className="ct-relation">{person.relation}</p>
              </Reveal>
            )}
          </>
        ) : (
          <Reveal show={show} delay={words(760)}>
            <p className="ct-name ct-tbc">Details to come</p>
          </Reveal>
        )}
        <Reveal show={show} delay={words(980)}>
          <CallButton phone={person.phone} who={person.name ?? person.side} />
        </Reveal>
      </div>
    </article>
  );
}

/** The faint palace arch behind the heading: a cream glow, a fine double gold line, a kalash on top. */
function HeadArch() {
  return (
    <svg aria-hidden viewBox="0 0 300 250" className="ct-head-arch">
      <path d={windowPath(300, 262, 12, true)} className="ct-head-glow" />
      <path d={windowPath(300, 262, 12, true)} className="ct-head-line" />
      <path d={windowPath(300, 262, 19, true)} className="ct-head-line ct-head-fine" />
      {/* the kalash on the peak */}
      <g className="ct-head-kalash">
        <path d="M150 12.5C146.2 12.5 143.6 10.4 143.6 7.6C143.6 5.2 145.6 3.6 148 3.2L148.4 1.6H151.6L152 3.2C154.4 3.6 156.4 5.2 156.4 7.6C156.4 10.4 153.8 12.5 150 12.5Z" />
        <path d="M150 1.6C149 -0.6 149.4 -2.6 150 -4C150.6 -2.6 151 -0.6 150 1.6Z" />
      </g>
    </svg>
  );
}

/** A faint palace skyline along the section's foot: a domed hall between two chhatris and minarets. */
function PalaceSkyline() {
  return (
    <svg aria-hidden viewBox="0 0 400 72" preserveAspectRatio="xMidYMax meet" className="ct-skyline">
      <path d="M0 72V60H44V40H48V30C48 27 50 25 52 25C54 25 56 27 56 30V40H60V60H96V48C96 42 102 38 110 37C118 38 124 42 124 48V60H140V36H152C152 22 168 12 200 6C232 12 248 22 248 36H260V60H276V48C276 42 282 38 290 37C298 38 304 42 304 48V60H340V40H344V30C344 27 346 25 348 25C350 25 352 27 352 30V40H356V60H400V72Z" />
      <path d="M200 6V0M110 37V32M290 37V32M52 25V21M348 25V21" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

/** A tiny gold lotus: three petals on a short base. */
function TinyLotus({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 16" className={className} fill="none">
      <g fill="#e9d29a" fillOpacity="0.7" stroke="#b08a46" strokeWidth="0.8" strokeLinejoin="round">
        <path d="M12 13.5C8.8 13.1 6.2 11 5.5 7.8 8.7 8.1 10.9 10.3 12 13.5Z" />
        <path d="M12 13.5C15.2 13.1 17.8 11 18.5 7.8 15.3 8.1 13.1 10.3 12 13.5Z" />
        <path d="M12 13.5C9.8 10.3 9.8 6.3 12 2.5 14.2 6.3 14.2 10.3 12 13.5Z" />
      </g>
      <path d="M7.5 15H16.5" stroke="#b08a46" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

/** "919876543210" → "+91 98765 43210" (other numbers: "+" and the digits) — for the call's label. */
function showPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.length === 12 && d.startsWith("91") ? `+91 ${d.slice(2, 7)} ${d.slice(7)}` : `+${d}`;
}
const telHref = (phone: string) => `tel:+${phone.replace(/\D/g, "")}`;

/**
 * "Call": a tel: link when there is a number (labelled with it for screen readers); without one, the
 * same button, which only says that the number is coming.
 */
function CallButton({ phone, who, round = false }: { phone: string | null; who: string; round?: boolean }) {
  const [asked, setAsked] = useState(false);
  const cls = round ? "ct-call-round" : "ct-call";
  const inner = round ? (
    <Icon name="phone" className="h-5 w-5" strokeWidth={1.6} />
  ) : (
    <>
      <Icon name="phone" className="h-4 w-4" strokeWidth={1.6} /> Call
    </>
  );
  if (phone)
    return (
      <a href={telHref(phone)} className={cls} aria-label={`Call ${who}, ${showPhone(phone)}`}>
        {inner}
      </a>
    );
  return (
    <span className={round ? "ct-call-wrap ct-call-wrap-round" : "ct-call-wrap"}>
      <button type="button" className={cls} aria-label={`Call ${who} (number coming soon)`} onClick={() => setAsked(true)}>
        {inner}
      </button>
      <span className="ct-soon" role="status" data-on={asked || undefined}>
        {asked ? "Number coming soon" : ""}
      </span>
    </span>
  );
}

/** A coordinator: role and name on the left, a round call button on the right. */
function CoordinatorRow({ person }: { person: Coordinator }) {
  return (
    <>
      <div className="min-w-0 flex-1 text-left">
        <p className="ct-role">{person.role}</p>
        <p className={`ct-row-name${person.name ? "" : " ct-tbc"}`}>{person.name ?? "Details to come"}</p>
      </div>
      <CallButton phone={person.phone} who={person.name ? `${person.name}, ${person.role}` : `the ${person.role}`} round />
    </>
  );
}
