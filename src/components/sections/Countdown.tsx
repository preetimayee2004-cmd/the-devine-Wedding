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
 * with their little things, and a watercolour mountain and the joined hands
 * at its foot. Inside: the auspicious moment, a fine gold line, the date, and
 * a live count of days, hours, minutes and seconds to the wedding at the
 * venue's time.
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
          <div className="absolute inset-x-[11%] top-[20.6%] flex flex-col items-center">
            <Reveal show={seen} delay={at(900)} as="p" className="font-deva text-[16px] leading-none text-gold-ink">
              <span lang="sa">{copy.eyebrow}</span>
            </Reveal>
            <Reveal show={seen} delay={at(1050)}>
              <h2
                id="countdown-heading"
                className="mt-[2.2cqw] text-[25px] font-medium leading-tight [font-size:clamp(22px,7.2cqw,28px)]"
              >
                {message ? message.title : copy.title}
              </h2>
            </Reveal>
            {/* a fine gold line with a diamond */}
            <Reveal show={seen} delay={at(1150)} className="mt-[1.6cqw] flex w-[88%] items-center gap-2">
              <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-gold" />
              <span aria-hidden className="h-2 w-2 rotate-45 border border-gold bg-ivory" />
              <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-gold" />
            </Reveal>
            {dateLine && (
              <Reveal
                show={seen}
                delay={at(1200)}
                as="p"
                className="mt-[1.6cqw] font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-ink [font-size:clamp(9px,2.75cqw,10.5px)]"
              >
                {dateLine}
              </Reveal>
            )}
          </div>

          <div className="absolute inset-x-[14%] top-[49.2%]">
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
                        className={`flex flex-col-reverse items-center ${i ? "border-l border-gold/30" : ""}`}
                      >
                        <dt className="mt-[0.4cqw] font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-gold-ink [font-size:clamp(8.5px,2.45cqw,9.5px)]">
                          {label}
                        </dt>
                        <dd className="font-display text-[34px] font-medium leading-none text-navy [font-size:clamp(28px,9.8cqw,37px)] [font-variant-numeric:oldstyle-nums_tabular-nums]">
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