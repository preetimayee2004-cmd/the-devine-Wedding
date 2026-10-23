import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { wedding } from "@/config/wedding";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 05 — the wedding events.
 *
 * "Wedding Events" and one quote above the couple's gold temple arch, wreathed in lotus and banana
 * leaves (which sway, very gently), with the music of the celebration and a festive elephant at
 * its foot. Inside the arch, one ceremony at a time: the couple dressed for it, then its name,
 * date and time, venue and dress code.
 *
 * A tap anywhere on the arch: from its top, as from Mahadev's jata, a fine glistening stream of
 * the Ganga falls (0.5s); a soft wash sweeps down with it and the card dissolves and drifts down
 * in it, droplets and a few lotus petals carried along; the stream thins away, and the next
 * ceremony's couple rises in, its words after (1.6s in all; taps meanwhile are ignored). After the
 * last it returns to the first. Dots under the arch count the ceremonies, and "Tap to continue"
 * pulses there until the first tap. Transform, opacity and a mask only. Reduced motion: a plain
 * crossfade, nothing sways.
 */

/** The arch picture's size, and the three parts of it that sway — in its own pixels. */
const ART = { w: 1098, h: 1228 };
const SWAY = [
  // the banana plant, from its foot beside the arch
  { points: [[0, 540], [128, 540], [128, 566], [200, 566], [200, 878], [0, 878]], origin: [190, 876], angle: 0.8, secs: 6.2, delay: 0 },
  // the lotus vine climbing the arch's left side
  { points: [[128, 296], [280, 296], [280, 566], [128, 566]], origin: [205, 566], angle: 0.6, secs: 5.4, delay: -1.8 },
  // the lotus on the right, above the elephant
  { points: [[826, 466], [1082, 466], [1082, 836], [978, 846], [946, 892], [826, 892]], origin: [915, 890], angle: 0.6, secs: 7, delay: -3.1 },
] as const;
const pct = ([x, y]: readonly number[]) => `${((x / ART.w) * 100).toFixed(2)}% ${((y / ART.h) * 100).toFixed(2)}%`;
const polygon = (points: readonly (readonly number[])[]) => points.map(pct).join(", ");
/** The picture with the swaying parts cut out of it (even-odd: the rectangle, then each part as a hole). */
const BASE_CLIP = `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${SWAY.map((s) => `${polygon(s.points)}, ${pct(s.points[0])}, 0% 0%`).join(", ")})`;

/** The timeline of a tap (ms). */
const T = { swap: 700, done: 1560, reducedSwap: 220, reducedDone: 560 } as const;

/** Droplets and petals carried by the stream: [x offset (cqw), start (% of the arch), drift x, fall, delay ms, size]. */
const DROPS = [
  [-1.2, 14, -5, 16, 90, 1], [1.4, 20, 6, 18, 140, 0.8], [-0.8, 27, -7, 20, 200, 0.9], [1, 33, 5, 15, 240, 1.1],
  [-1.6, 39, -4, 22, 290, 0.7], [1.8, 44, 8, 19, 330, 0.9], [-0.6, 50, -6, 17, 380, 1], [0.8, 55, 4, 21, 420, 0.8],
  [-2, 60, -8, 15, 460, 0.9], [1.6, 64, 7, 18, 500, 1], [-1, 30, -3, 26, 260, 0.7], [1.2, 48, 3, 24, 360, 0.75],
  [-1.4, 66, -5, 12, 540, 0.85], [0.6, 22, 5, 25, 180, 0.7],
] as const;
const PETALS = [
  [-3, 24, -11, 30, 160, 40], [3.5, 34, 12, 27, 260, -55], [-2.5, 46, -9, 24, 360, 70], [2.8, 56, 10, 20, 440, -35],
] as const;

function readTapped() {
  try {
    return localStorage.getItem("dw:events-tapped") === "1";
  } catch {
    return false;
  }
}

export function Events() {
  const { events, assets } = wedding;
  const list = events.list;
  const sectionRef = useRef<HTMLElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.15 });
  const archSeen = useInView(archRef, { threshold: 0.2 });
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "wash" | "enter">("idle");
  const [run, setRun] = useState(0);
  const [hint, setHint] = useState(() => !readTapped());
  const busy = useRef(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const next = () => {
    if (busy.current || !list.length) return;
    busy.current = true;
    if (hint) {
      setHint(false);
      try {
        localStorage.setItem("dw:events-tapped", "1");
      } catch {
        /* private mode: the hint simply shows again next time */
      }
    }
    const to = (index + 1) % list.length;
    setPhase("wash");
    if (!reduced) setRun((r) => r + 1);
    later(reduced ? T.reducedSwap : T.swap, () => {
      setIndex(to);
      setPhase("enter");
    });
    later(reduced ? T.reducedDone : T.done, () => {
      setPhase("idle");
      busy.current = false;
    });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      next();
    }
  };

  const ceremony = list[index];
  const flowing = run > 0 && phase !== "idle" && !reduced;

  return (
    <section id="events" ref={sectionRef} aria-labelledby="events-heading" className="relative px-[var(--gutter)] pb-3 pt-5">
      <SectionHeading id="events-heading" title={events.title} intro={`“${events.quote}”`} show={seen} />

      <div ref={archRef} className="events-arch" data-shown={archSeen || reduced || undefined} data-still={reduced || undefined}>
        {/* the arch, its swaying leaves and lotus as their own layers over the rest */}
        <img src={assets.eventsArch} alt="" width={ART.w} height={ART.h} draggable={false} className="ea-layer" style={{ clipPath: BASE_CLIP }} />
        {SWAY.map((s, i) => (
          <img
            key={i}
            src={assets.eventsArch}
            alt=""
            aria-hidden
            draggable={false}
            className="ea-layer ea-sway"
            style={
              {
                clipPath: `polygon(${polygon(s.points)})`,
                transformOrigin: pct(s.origin),
                "--a": `${s.angle}deg`,
                animationDuration: `${s.secs}s`,
                animationDelay: `${s.delay}s`,
              } as CSSProperties
            }
          />
        ))}

        {/* the ceremony inside the arch */}
        {ceremony && (
          <div key={index} className="ev-card" data-phase={phase} data-still={reduced || undefined} aria-live="polite">
            <div className="ev-figure">
              <img src={ceremony.image.src} alt={ceremony.image.alt} width={ceremony.image.width} height={ceremony.image.height} draggable={false} />
            </div>
            <div className="ev-words">
              <h3 className="ev-name">{ceremony.name}</h3>
              <p className="ev-when">
                {ceremony.date}
                <span aria-hidden className="ev-sep">
                  {" · "}
                </span>
                <span className="whitespace-nowrap">{ceremony.time}</span>
              </p>
              <p className="ev-venue">{ceremony.venue}</p>
              <p className="ev-dress">
                <span className="ev-label">Dress code</span> {ceremony.dressCode}
              </p>
            </div>
          </div>
        )}

        {/* the Ganga, from the top of the arch, and what she carries */}
        {flowing && (
          <div key={run} aria-hidden className="ev-ganga-run">
            <span className="ev-ganga">
              <span className="ev-ganga-thin">
                <span className="ev-ganga-glow" />
                <span className="ev-ganga-core" />
                <span className="ev-ganga-shine" />
              </span>
            </span>
            {DROPS.map(([x, y, dx, dy, delay, size], i) => (
              <span
                key={`d${i}`}
                className="ev-drop"
                style={{ "--x": `${x}cqw`, top: `${y}%`, "--dx": `${dx}cqw`, "--dy": `${dy}cqw`, animationDelay: `${delay}ms`, "--s": size } as CSSProperties}
              />
            ))}
            {PETALS.map(([x, y, dx, dy, delay, turn], i) => (
              <span
                key={`p${i}`}
                className="ev-petal"
                style={{ "--x": `${x}cqw`, top: `${y}%`, "--dx": `${dx}cqw`, "--dy": `${dy}cqw`, animationDelay: `${delay}ms`, "--turn": `${turn}deg` } as CSSProperties}
              />
            ))}
          </div>
        )}

        {/* a tap anywhere on the arch moves to the next ceremony */}
        <button type="button" className="ev-tap" onClick={next} onKeyDown={onKey} aria-label={`Show the next ceremony (${(index + 1) % Math.max(1, list.length) + 1} of ${list.length})`} />
      </div>

      {/* under the arch: which ceremony this is, and the first-time hint */}
      <div className="ev-foot">
        {list.length > 1 && (
          <div aria-hidden className="ev-dots">
            {list.map((c, i) => (
              <span key={c.name} className="ev-dot" data-on={i === index || undefined} />
            ))}
          </div>
        )}
        {hint && <p className="ev-hint">Tap to continue</p>}
        {ceremony?.credit && <p className="ev-credit">{ceremony.credit}</p>}
      </div>
    </section>
  );
}
