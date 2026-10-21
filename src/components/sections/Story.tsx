import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { wedding } from "@/config/wedding";
import type { StoryMoment } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { EASE } from "@/lib/motion";
import { Icon } from "@/components/art/Icons";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 04 — a journey written in the stars (PRD §4).
 *
 * A fine golden path winds down the section, swinging from side to side so
 * each moment sits beside it, and draws itself as the guest scrolls. Each
 * moment fades a few pixels into place, its photo easing back from a slight
 * zoom. The path ends in a small kalash, which crowns the ceremonies below.
 */

/** Where the path runs, measured in from the column's edge. */
const SIDE = 14;

interface Geometry {
  w: number;
  h: number;
  d: string;
  nodes: Array<{ x: number; y: number }>;
}

export function Story() {
  const { story } = wedding;
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const rows = useRef<Array<HTMLDivElement | null>>([]);
  const pathRef = useRef<SVGPathElement>(null);
  const nodeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const seen = useInView(sectionRef, { threshold: 0.05 });
  const reduced = usePrefersReducedMotion();
  const [geo, setGeo] = useState<Geometry | null>(null);

  // The path is laid out from the moments' real positions, and again whenever they reflow.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const w = list.offsetWidth;
      const h = list.offsetHeight;
      const boxes = rows.current.filter((r): r is HTMLDivElement => r !== null);
      if (!boxes.length) return;
      const pts = boxes.map((row, i) => ({
        x: i % 2 === 0 ? SIDE : w - SIDE,
        y: row.offsetTop + 30,
        bottom: row.offsetTop + row.offsetHeight,
      }));
      const mid = w / 2;
      let d = `M${mid} 0C${mid} ${pts[0].y * 0.55} ${pts[0].x} ${pts[0].y * 0.35} ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const leave = Math.max(a.y, a.bottom - 40);
        const turn = (leave + b.y) / 2;
        d += `L${a.x} ${leave}C${a.x} ${turn} ${b.x} ${turn} ${b.x} ${b.y}`;
      }
      const last = pts[pts.length - 1];
      const leave = Math.max(last.y, last.bottom - 30);
      d += `L${last.x} ${leave}C${last.x} ${h - 10} ${mid} ${leave + (h - leave) * 0.35} ${mid} ${h}`;
      setGeo({ w, h, d, nodes: pts.map(({ x, y }) => ({ x, y })) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, []);

  // The path draws with the scroll; each milestone lights up as the path reaches it.
  useEffect(() => {
    const path = pathRef.current;
    const list = listRef.current;
    if (!path || !list || !geo) return;
    const update = () => {
      frame = 0;
      const r = list.getBoundingClientRect();
      const progress = reduced ? 1 : Math.min(1, Math.max(0, (window.innerHeight * 0.66 - r.top) / r.height));
      path.style.strokeDashoffset = String(1 - progress);
      geo.nodes.forEach((n, i) => {
        const el = nodeRefs.current[i];
        if (el) el.dataset.lit = String(progress * geo.h >= n.y - 4);
      });
    };
    let frame = 0;
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
  }, [geo, reduced]);

  return (
    <section id="story" ref={sectionRef} aria-labelledby="story-heading" className="relative px-[var(--gutter)] pt-2">
      <SectionHeading id="story-heading" eyebrow={story.eyebrow} title={story.title} show={seen} />

      <div ref={listRef} className="relative mt-10 space-y-16 pb-20">
        {geo && (
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-visible"
            width={geo.w}
            height={geo.h}
            viewBox={`0 0 ${geo.w} ${geo.h}`}
          >
            <path
              d={geo.d}
              fill="none"
              stroke="rgb(var(--gold))"
              strokeWidth="1.3"
              strokeLinecap="round"
              opacity="0.3"
              strokeDasharray="2 6"
            />
            <path
              ref={pathRef}
              d={geo.d}
              pathLength={1}
              fill="none"
              stroke="url(#story-gold)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="1 1"
              strokeDashoffset="1"
            />
            <defs>
              <linearGradient id="story-gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgb(var(--gold))" />
                <stop offset="1" stopColor="rgb(var(--gold-ink))" />
              </linearGradient>
            </defs>
          </svg>
        )}
        {geo?.nodes.map((n, i) => {
          const motif = story.moments[i]?.motif;
          return (
            <span
              key={i}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              aria-hidden
              className="story-node absolute flex items-center justify-center rounded-full border border-gold bg-ivory text-gold-ink"
              style={{
                left: n.x,
                top: n.y,
                width: motif ? 36 : 13,
                height: motif ? 36 : 13,
                transition: `opacity 600ms ease-out, transform 700ms ${EASE.silk}`,
              }}
            >
              {motif ? (
                <Icon name={motif} className="h-5 w-5" />
              ) : (
                <span className="h-1 w-1 rounded-full bg-gold-ink" />
              )}
            </span>
          );
        })}

        {story.moments.map((m, i) => (
          <Moment
            key={m.title}
            moment={m}
            index={i}
            rowRef={(el) => {
              rows.current[i] = el;
            }}
          />
        ))}
      </div>

      {/* The path ends in a kalash, which crowns the ceremonies */}
      <div className="flex justify-center">
        <span
          aria-hidden
          className="-mt-1 flex h-12 w-12 items-center justify-center rounded-full border border-gold bg-ivory/85 text-gold-ink"
        >
          <Icon name="kalash" className="h-7 w-7" />
        </span>
      </div>
    </section>
  );
}

function Moment({
  moment,
  index,
  rowRef,
}: {
  moment: StoryMoment;
  index: number;
  rowRef: (el: HTMLDivElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const seen = useInView(ref, { threshold: 0.2 });
  // The path runs on the left of even moments and the right of odd ones.
  const onRight = index % 2 === 0;

  return (
    <div
      ref={(el) => {
        ref.current = el;
        rowRef(el);
      }}
      className={`relative ${onRight ? "ml-12 text-left" : "mr-12 text-right"}`}
    >
      {moment.photo && (
        <PhotoFrame
          photo={moment.photo}
          show={seen}
          tint={index}
          motif={moment.motif ?? "lotus"}
          className="aspect-[4/3] w-full"
        />
      )}
      <Reveal
        show={seen}
        delay={moment.photo ? 250 : 0}
        as="p"
        className="mt-4 font-sans text-[11px] font-medium uppercase tracking-eyebrow text-gold-ink"
      >
        {moment.when}
      </Reveal>
      <Reveal show={seen} delay={moment.photo ? 350 : 100}>
        <h3 className="mt-1 text-[27px]">{moment.title}</h3>
      </Reveal>
      <Reveal
        show={seen}
        delay={moment.photo ? 470 : 220}
        as="p"
        className="mt-2 text-[15px] leading-relaxed text-slate"
      >
        {moment.text}
      </Reveal>
    </div>
  );
}
