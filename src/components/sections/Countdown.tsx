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
 * Section 03 — the celestial calendar (PRD §4).
 *
 * The couple's clouds part, and a gold temple-arch frame draws itself down
 * from the crescent at its apex to the lotus at its base. Inside: the
 * auspicious moment and a live count of days, hours, minutes and seconds to
 * the wedding at the venue's time. From the lotus a gold line leads on.
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
      <div className="relative w-full max-w-[23rem] [container-type:inline-size]">
        <div className="relative aspect-[360/340]">
          <CalendarFrame drawn={seen} reduced={reduced} />

          <div className="absolute inset-x-[8%] top-[25.5%] flex flex-col items-center">
            <Reveal show={seen} delay={at(900)} as="p" className="font-deva text-[15px] leading-none text-gold-ink">
              <span lang="sa">{copy.eyebrow}</span>
            </Reveal>
            <Reveal show={seen} delay={at(1050)}>
              <h2
                id="countdown-heading"
                className="mt-[2.4cqw] text-[27px] leading-tight [font-size:clamp(24px,7.6cqw,29px)]"
              >
                {message ? message.title : copy.title}
              </h2>
            </Reveal>
            {dateLine && (
              <Reveal
                show={seen}
                delay={at(1200)}
                as="p"
                className="mt-[1.6cqw] font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-gold-ink [font-size:clamp(9.5px,2.9cqw,11px)]"
              >
                {dateLine}
              </Reveal>
            )}
          </div>

          <div className="absolute inset-x-[7%] top-[62%]">
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

      {/* A gold line leads on to the story */}
      <span
        aria-hidden
        className="-mt-px block h-16 w-px bg-gradient-to-b from-gold to-gold-ink/60"
        style={{
          transformOrigin: "top",
          transform: seen ? "scaleY(1)" : "scaleY(0)",
          transition: `transform 1200ms ${EASE.silk} ${at(1900)}ms`,
        }}
      />
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
 * The gold temple arch. Its two halves draw down together from the apex
 * and meet at the lotus; the crescent, shoulders and divider then appear.
 */
function CalendarFrame({ drawn, reduced }: { drawn: boolean; reduced: boolean }) {
  const line = (delay: number, duration = 1800): CSSProperties =>
    reduced
      ? { opacity: drawn ? 1 : 0, transition: "opacity 500ms linear" }
      : {
          strokeDasharray: "1 1",
          strokeDashoffset: drawn ? 0 : 1,
          transition: `stroke-dashoffset ${duration}ms ${EASE.silk} ${delay}ms`,
        };
  const appear = (delay: number): CSSProperties => ({
    opacity: drawn ? 1 : 0,
    transition: reduced ? "opacity 500ms linear" : `opacity 700ms ease-out ${delay}ms`,
  });

  return (
    <svg viewBox="0 0 360 340" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
      <g fill="none" stroke="rgb(var(--gold))" strokeLinecap="round" strokeLinejoin="round">
        {/* outer arch, both halves from the apex down to the lotus */}
        <g strokeWidth="1.3">
          <path
            pathLength={1}
            style={line(200)}
            d="M180 14C175 24 170 31 162 38C104 82 14 100 14 160V322Q14 336 28 336H180"
          />
          <path
            pathLength={1}
            style={line(200)}
            d="M180 14C185 24 190 31 198 38C256 82 346 100 346 160V322Q346 336 332 336H180"
          />
        </g>
        {/* inner line */}
        <g strokeWidth="0.7" opacity="0.75">
          <path
            pathLength={1}
            style={line(420)}
            d="M180 30C177 37 172 43 166 48C108 90 22 106 22 162V320Q22 328 30 328H180"
          />
          <path
            pathLength={1}
            style={line(420)}
            d="M180 30C183 37 188 43 194 48C252 90 338 106 338 162V320Q338 328 330 328H180"
          />
        </g>

        {/* Shiva's crescent with a bindu, under the apex */}
        <g style={appear(700)}>
          <path strokeWidth="1" fill="rgb(var(--gold) / 0.3)" d="M169 55a11 11 0 0 0 22 0a13 13 0 0 1-22 0Z" />
          <circle cx="180" cy="46" r="1.8" fill="rgb(var(--gold))" stroke="none" />
        </g>
        {/* shoulders, and the divider above the numbers */}
        <g style={appear(1100)} strokeWidth="1">
          <path d="M14 154l-4 6 4 6 4-6ZM346 154l-4 6 4 6 4-6Z" fill="rgb(var(--ivory))" />
          <path strokeWidth="0.7" d="M70 196H162M198 196H290" />
          <path strokeWidth="0.9" d="M180 190l-5 6 5 6 5-6Z" />
        </g>
        {/* the lotus where the two halves meet */}
        <g style={appear(1700)} transform="translate(168 325)" strokeWidth="0.9" fill="rgb(var(--ivory))">
          <path d="M12 12.5C9.6 10.6 9.4 6 12 2.5c2.6 3.5 2.4 8.1 0 10Z" />
          <path d="M11.4 12.5C7.6 12.6 4.6 10.2 4 6.6c3.5.2 6.4 2.6 7.4 5.9ZM12.6 12.5c3.8.1 6.8-2.3 7.4-5.9-3.5.2-6.4 2.6-7.4 5.9Z" />
        </g>
      </g>
    </svg>
  );
}
