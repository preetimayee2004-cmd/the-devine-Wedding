import { useEffect, useMemo, useRef } from "react";
import { wedding } from "@/config/wedding";
import type { WeddingEvent } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useWidth } from "@/hooks/useWidth";
import { EASE } from "@/lib/motion";
import { dateKey, formatVenueDate, parseVenueDateTime } from "@/lib/venueTime";
import { Icon } from "@/components/art/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 05 — the wedding ceremonies (PRD §4).
 *
 * A sacred thread — two golds twisted like a kalava — runs down the left
 * and draws itself as the ceremonies scroll into view. Each ceremony hangs from it as a gold medallion (its symbol
 * appears first) with its card beside it. Days are marked along the thread.
 * At the end the thread curves to the centre, toward the two families.
 */

/** Centre of the thread, from the column's left edge (matches the medallions). */
const THREAD_X = 22.5;

interface Day {
  key: string;
  label: string;
  events: Array<WeddingEvent & { time: string | null }>;
}

export function Events() {
  const { events } = wedding;
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const threadRef = useRef<HTMLSpanElement>(null);
  const curveRef = useRef<SVGSVGElement>(null);
  const width = useWidth(curveRef);
  const seen = useInView(sectionRef, { threshold: 0.05 });
  const reduced = usePrefersReducedMotion();

  const days = useMemo<Day[]>(() => {
    const out: Day[] = [];
    for (const e of events.list) {
      const p = parseVenueDateTime(e.when);
      if (!p) continue;
      const f = formatVenueDate(p);
      const key = dateKey(p);
      let day = out.find((d) => d.key === key);
      if (!day) {
        day = { key, label: `${f.weekday}, ${f.day} ${f.month}`, events: [] };
        out.push(day);
      }
      day.events.push({ ...e, time: f.time });
    }
    return out;
  }, [events.list]);

  // The thread grows with the scroll.
  useEffect(() => {
    const thread = threadRef.current;
    const list = listRef.current;
    if (!thread || !list) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = list.getBoundingClientRect();
      const p = reduced ? 1 : Math.min(1, Math.max(0, (window.innerHeight * 0.7 - r.top) / r.height));
      thread.style.transform = `scaleY(${p})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  return (
    <section id="events" ref={sectionRef} aria-labelledby="events-heading" className="relative px-[var(--gutter)] pt-12">
      {/* where the thread begins */}
      <span aria-hidden className="sacred-thread mx-auto block h-10 w-[3px]" />
      <div className="mt-5">
        <SectionHeading
          id="events-heading"
          eyebrow={events.eyebrow}
          title={events.title}
          intro={events.intro}
          show={seen}
        />
      </div>

      <div className="relative mt-10">
        <span
          ref={threadRef}
          aria-hidden
          className="sacred-thread absolute bottom-0 left-[21px] top-2 w-[3px] origin-top"
          style={{ transform: "scaleY(0)" }}
        />
        <ol ref={listRef} className="relative space-y-5">
          {days.map((day) => (
            <DayGroup key={day.key} day={day} />
          ))}
        </ol>
      </div>

      {/* …and curves to the centre, toward the two families */}
      <svg ref={curveRef} aria-hidden viewBox={`0 0 ${width || 1} 64`} className="block h-16 w-full">
        <path
          d={`M${THREAD_X} 0C${THREAD_X} 42 ${width / 2} 22 ${width / 2} 64`}
          fill="none"
          stroke="rgb(var(--gold))"
          strokeWidth="1.5"
          pathLength={1}
          style={{
            strokeDasharray: "1 1",
            strokeDashoffset: seen ? 0 : 1,
            transition: `stroke-dashoffset 1200ms ${EASE.silk}`,
          }}
        />
      </svg>
    </section>
  );
}

function DayGroup({ day }: { day: Day }) {
  const ref = useRef<HTMLLIElement>(null);
  const seen = useInView(ref, { threshold: 0.3 });
  return (
    <>
      <li ref={ref} className="relative flex items-center pl-[58px] pt-3">
        <span aria-hidden className="absolute left-[15px] h-[15px] w-[15px] rotate-45 border border-gold bg-ivory" />
        <Reveal show={seen} as="p" className="font-display text-[21px] font-semibold italic text-navy">
          {day.label}
        </Reveal>
      </li>
      {day.events.map((e) => (
        <EventItem key={e.id} event={e} />
      ))}
    </>
  );
}

function EventItem({ event }: { event: WeddingEvent & { time: string | null } }) {
  const ref = useRef<HTMLLIElement>(null);
  const seen = useInView(ref, { threshold: 0.35 });
  const reduced = usePrefersReducedMotion();

  return (
    <li ref={ref} className="relative pl-[58px]">
      {/* the symbol appears first… */}
      <span
        aria-hidden
        className="absolute left-0 top-3 flex h-[45px] w-[45px] items-center justify-center rounded-full border border-gold bg-ivory text-gold-ink shadow-[0_6px_16px_-10px_rgb(23_59_86/0.6)]"
        style={{
          opacity: seen ? 1 : 0,
          transform: seen || reduced ? "scale(1)" : "scale(0.6)",
          transition: `opacity 500ms ease-out, transform 700ms ${EASE.silk}`,
        }}
      >
        <Icon name={event.icon} className="h-[26px] w-[26px]" />
      </span>
      {/* …then its card */}
      <Reveal show={seen} delay={reduced ? 0 : 180}>
        <div className="rounded-[22px] border border-gold/50 bg-ivory/75 px-5 py-4 shadow-[0_12px_28px_-22px_rgb(23_59_86/0.55)]">
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-gold-ink">
            {[event.time, event.venue].filter(Boolean).join(" · ")}
          </p>
          <h3 className="mt-1 text-[26px]">{event.name}</h3>
          <p className="mt-1 text-[14.5px] leading-relaxed text-slate">{event.about}</p>
        </div>
      </Reveal>
    </li>
  );
}
