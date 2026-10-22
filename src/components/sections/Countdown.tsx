import { useMemo, useRef, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { useCountdown } from "@/hooks/useCountdown";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { EASE } from "@/lib/motion";
import { formatVenueDate, parseVenueDateTime, venueInstant, zoneLabel } from "@/lib/venueTime";
import { Reveal } from "@/components/ui/Reveal";
import { RollingNumber } from "@/components/ui/RollingNumber";

/**
 * Section 03 — the celestial calendar, inside the couple's wreath.
 *
 * The couple's clouds part, and the wreath appears: flowering vines threaded
 * with their little things, a watercolour mountain and the joined hands at
 * its foot, a faint dashed gold arch with Shiva's crescent behind the words.
 * Inside: the auspicious moment and a live count of days, hours, minutes and
 * seconds to the wedding at the venue's time. A small gold fleuron closes it.
 */
export function Countdown() {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { threshold: 0.3 });
  const reduced = usePrefersReducedMotion();
  const at = (ms: number) => (reduced ? 0 : ms);
  const { countdown: copy, assets } = wedding;

  const when = useMemo(() => parseVenueDateTime(wedding.wedding.dateTime), []);
  const state = useCountdown(when, wedding.wedding.timeZone);
  const dateLine = useMemo(() => {
    if (!when) return null;
    const d = formatVenueDate(when);
    const zone =
      when.hour === null ? null : zoneLabel(venueInstant(when, wedding.wedding.timeZone), wedding.wedding.timeZone);
    return [d.weekday, `${d.day} ${d.month} ${d.year}`, d.time && [d.time, zone].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(" · ");
  }, [when]);

  if (!state) return null;
  const message = state.phase === "today" ? copy.today : state.phase === "after" ? copy.after : null;

  return (
    <section
      id="countdown"
      ref={ref}
      aria-labelledby="countdown-heading"
      className="relative flex flex-col items-center px-[var(--gutter)] pt-4 text-center"
    >
      <div className="relative w-full max-w-[24rem] [container-type:inline-size]">
        <div className="relative" style={{ aspectRatio: `${assets.countdownWreathSize.width} / ${assets.countdownWreathSize.height}` }}>
          {/* the wreath, the mountain and the joined hands */}
          <img
            src={assets.countdownWreath}
            alt="A wreath of flowering vines with the couple's little things, a mountain, and two joined hands"
            width={assets.countdownWreathSize.width}
            height={assets.countdownWreathSize.height}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none"
            style={{
              opacity: seen ? 1 : 0,
              transition: reduced ? "opacity 400ms linear" : `opacity 1400ms ${EASE.silk} ${at(500)}ms`,
            }}
          />
          <ArchCrown shown={seen} reduced={reduced} />

          <div className="absolute inset-x-[9%] top-[19.5%] flex flex-col items-center">
            <Reveal show={seen} delay={at(900)} as="p" className="font-deva text-[15px] leading-none text-gold-ink">
              <span aria-hidden className="mr-1.5 text-[10px]">✦</span>
              <span lang="sa">{copy.eyebrow}</span>
              <span aria-hidden className="ml-1.5 text-[10px]">✦</span>
            </Reveal>
            <Reveal show={seen} delay={at(1050)}>
              <h2
                id="countdown-heading"
                className="mt-[2.6cqw] text-[27px] leading-tight [font-size:clamp(24px,7.6cqw,29px)]"
              >
                {message ? message.title : copy.title}
              </h2>
            </Reveal>
            {/* a fine gold line with a diamond */}
            <Reveal show={seen} delay={at(1150)} className="mt-[2.4cqw] flex w-full items-center gap-2">
              <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-gold" />
              <span aria-hidden className="h-2 w-2 rotate-45 border border-gold bg-ivory" />
              <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-gold" />
            </Reveal>
            {dateLine && (
              <Reveal
                show={seen}
                delay={at(1200)}
                as="p"
                className="mt-[2.2cqw] font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-gold-ink [font-size:clamp(9.5px,2.9cqw,11px)]"
              >
                {dateLine}
              </Reveal>
            )}
          </div>

          <div className="absolute inset-x-[9%] top-[48.5%]">
            {message ? (
              <Reveal
                show={seen}
                delay={at(1400)}
                as="p"
                className="text-balance font-display text-[22px] font-medium italic leading-snug text-slate"
              >
                {message.line}
              </Reveal>
            ) : (
              state.phase === "counting" && (
                <Reveal show={seen} delay={at(1400)}>
                  <dl role="timer" className="grid grid-cols-4">
                    {(
                      [
                        ["Days", String(state.days)],
                        ["Hours", pad(state.hours)],
                        ["Minutes", pad(state.minutes)],
                        ["Seconds", pad(state.seconds)],
                      ] as const
                    ).map(([label, value], i) => (
                      <div
                        key={label}
                        className={`flex flex-col-reverse items-center ${i ? "border-l border-gold/60" : ""}`}
                      >
                        <dt className="mt-[1.4cqw] font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-gold-ink [font-size:clamp(9px,2.7cqw,10.5px)]">
                          {label}
                        </dt>
                        <dd className="font-display text-[38px] font-semibold leading-none text-navy [font-size:clamp(30px,11cqw,42px)] [font-variant-numeric:lining-nums_tabular-nums]">
                          <RollingNumber value={value} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              )
            )}
          </div>

          {/* The couple's clouds, parting to reveal the calendar */}
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-16%] w-[150%] -translate-x-1/2">
            <img
              src={assets.clouds}
              alt=""
              loading="lazy"
              decoding="async"
              className="block w-full"
              style={part("left", seen, reduced)}
            />
            <img
              src={assets.clouds}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full"
              style={part("right", seen, reduced)}
            />
          </div>
        </div>
      </div>

      {/* a small gold fleuron closes it */}
      <Reveal show={seen} delay={at(1700)} className="mt-3 flex items-center gap-2.5">
        <span aria-hidden className="h-px w-16 bg-gradient-to-r from-transparent to-gold" />
        <span aria-hidden className="text-[17px] leading-none text-gold-ink">
          ❦
        </span>
        <span aria-hidden className="h-px w-16 bg-gradient-to-l from-transparent to-gold" />
      </Reveal>
    </section>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** One half of the cloud bank: soft-edged, it drifts aside as the frame appears. */
function part(side: "left" | "right", open: boolean, reduced: boolean): CSSProperties {
  const mask = `linear-gradient(to ${side === "left" ? "right" : "left"}, #000 38%, transparent 62%)`;
  const away = side === "left" ? "-36%" : "36%";
  return {
    WebkitMaskImage: mask,
    maskImage: mask,
    opacity: open ? 0.5 : 1,
    transform: open ? `translateX(${away})` : "none",
    transition: reduced ? "opacity 400ms linear" : `transform 2200ms ${EASE.drift}, opacity 2200ms ${EASE.drift}`,
  };
}

/**
 * The faint gold arch behind the words, as in the couple's design: a dashed
 * outer line and a fine inner one rise to a point with Shiva's crescent and
 * bindu under it, and fade away above the numbers. Drawn on the wreath's own
 * 572 × 636 grid.
 */
function ArchCrown({ shown, reduced }: { shown: boolean; reduced: boolean }) {
  const appear = (delay: number): CSSProperties => ({
    opacity: shown ? 1 : 0,
    transition: reduced ? "opacity 500ms linear" : `opacity 900ms ease-out ${delay}ms`,
  });
  const fade = "linear-gradient(#000 20%, transparent 56%)";
  return (
    <svg
      viewBox="0 0 572 636"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ WebkitMaskImage: fade, maskImage: fade }}
      aria-hidden
    >
      <g fill="none" stroke="rgb(var(--gold))" strokeLinecap="round" strokeLinejoin="round">
        {/* outer, dashed */}
        <g strokeWidth="1.5" strokeDasharray="5 6" opacity="0.8" style={appear(700)}>
          <path d="M286 42C272 68 232 96 190 120C160 138 146 168 144 208V360" />
          <path d="M286 42C300 68 340 96 382 120C412 138 426 168 428 208V360" />
        </g>
        {/* inner, fine */}
        <g strokeWidth="1" opacity="0.55" style={appear(850)}>
          <path d="M286 60C275 82 244 106 210 128C188 142 178 166 176 200V360" />
          <path d="M286 60C297 82 328 106 362 128C384 142 394 166 396 200V360" />
        </g>
        {/* Shiva's crescent with a bindu, under the point */}
        <g style={appear(1000)}>
          <path strokeWidth="1.3" fill="rgb(var(--gold) / 0.35)" d="M272 66a14 14 0 0 0 28 0a17 17 0 0 1-28 0Z" />
          <circle cx="286" cy="54" r="2.4" fill="rgb(var(--gold))" stroke="none" />
        </g>
      </g>
    </svg>
  );
}