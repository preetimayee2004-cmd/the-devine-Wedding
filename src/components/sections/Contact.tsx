import { useRef, useState } from "react";
import { wedding } from "@/config/wedding";
import type { Coordinator, FamilyContact } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { Icon } from "@/components/art/Icons";
import { Lotus, LotusRule } from "@/components/art/Ornaments";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 10½ — "Contact & Assistance": a small wedding directory, between the venue and the
 * thank-you.
 *
 * "Here for You", the heading, one line and a small gold lotus rule. Then the two families, side by
 * side on a wider screen and one above the other on a phone: each under a fine gold temple arch on a
 * soft cream ground (no box) — the side in gold capitals, the person's name in navy serif, their
 * relationship in small gold capitals, and a deep-maroon "Call" in place of the number. Below a gold
 * rule that draws itself through a lotus, "Wedding Coordination": two compact rows — the role in gold
 * capitals, the name, a round maroon call button — a fine gold line between them.
 *
 * A call button dials its number (a tel: link, labelled with it for screen readers); until a number
 * is given it only says, quietly, that the number is coming (see `contact` in the config). Seen the
 * first time: the heading, the lotus, the two families a beat apart, the rule drawing, the rows.
 * Reduced motion: plain fades.
 */
export function Contact() {
  const { contact } = wedding;
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { threshold: 0.12 });
  const reduced = usePrefersReducedMotion();
  const t = (ms: number) => (reduced ? 0 : ms);

  return (
    <section
      id="contact"
      ref={ref}
      aria-labelledby="contact-heading"
      className="relative px-[var(--gutter)] pb-8 pt-[var(--section-gap)]"
      data-shown={seen || undefined}
      data-still={reduced || undefined}
    >
      <SectionHeading id="contact-heading" eyebrow={contact.eyebrow} title={contact.title} intro={contact.intro} show={seen} />
      <Reveal show={seen} delay={t(380)} className="mt-4 flex justify-center">
        <LotusRule />
      </Reveal>

      <div className="ct-family">
        {contact.family.map((person, i) => (
          <Reveal key={person.side} show={seen} delay={t(520 + i * 160)}>
            <FamilyCard person={person} />
          </Reveal>
        ))}
      </div>

      {/* the gold rule, drawing itself out from a lotus */}
      <div aria-hidden className="ct-rule">
        <span className="ct-rule-line ct-rule-left" />
        <Lotus className="ct-rule-lotus" />
        <span className="ct-rule-line ct-rule-right" />
      </div>

      <div className="mx-auto max-w-[24rem]">
        <Reveal show={seen} delay={t(1150)}>
          <h3 className="ct-coord-title">{contact.coordinationTitle}</h3>
          <p className="mt-1.5 text-center text-[14px] leading-relaxed text-slate">{contact.coordinationNote}</p>
        </Reveal>
        <ul className="ct-rows">
          {contact.coordinators.map((c, i) => (
            <Reveal key={c.role} as="li" show={seen} delay={t(1300 + i * 140)} className="ct-row">
              <CoordinatorRow person={c} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
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

/** One family's contact, under a fine gold temple arch. */
function FamilyCard({ person }: { person: FamilyContact }) {
  return (
    <article className="ct-person" aria-label={person.side}>
      <svg aria-hidden viewBox="0 0 200 60" preserveAspectRatio="none" className="ct-arch">
        <path d="M6 60V40C6 30 16 24 34 21C54 17.5 74 13 88 6C93 3.5 97 1.5 100 1C103 1.5 107 3.5 112 6C126 13 146 17.5 166 21C184 24 194 30 194 40V60" />
        <path d="M14 60V42C14 34 22 29 38 26C57 22.5 76 18 90 11C94.5 9 98 7.5 100 7C102 7.5 105.5 9 110 11C124 18 143 22.5 162 26C178 29 186 34 186 42V60" className="ct-arch-fine" />
      </svg>
      <div className="ct-person-body">
        <p className="ct-side">{person.side}</p>
        {person.name ? (
          <>
            <p className="ct-name">{person.name}</p>
            {person.relation && <p className="ct-relation">{person.relation}</p>}
          </>
        ) : (
          <p className="ct-name ct-tbc">Details to come</p>
        )}
        <CallButton phone={person.phone} who={person.name ?? person.side} />
      </div>
    </article>
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
