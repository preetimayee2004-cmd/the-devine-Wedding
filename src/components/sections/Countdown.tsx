import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { useCountdown } from "@/hooks/useCountdown";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useLang } from "@/lib/lang";
import { EASE } from "@/lib/motion";
import { formatVenueDate, parseVenueDateTime, venueInstant, zoneLabel, type VenueDateTime } from "@/lib/venueTime";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Section 03 — the auspicious moment.
 *
 * Above: शुभ मुहूर्त, "Countdown Begins", a fine gold line and the date. Then
 * the couple's wreath — flowering vines threaded with their little things, a
 * watercolour mountain and the joined hands — larger, with the wedding's month
 * drawn inside it as a small calendar, a watercolour lotus blooming (and
 * gently glowing) on the wedding day. Under it, "Hamare vivah mein baaki hain"
 * and one row: the days large, then hours, minutes and seconds, to the wedding
 * at the venue's time (whatever the guest's own time zone) — counting up from
 * zero the first time it is seen, then each digit rolling as it changes, a
 * gold bead beating with the seconds. The couple's clouds part as it appears.
 */
export function Countdown() {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { threshold: 0.2 });
  const reduced = usePrefersReducedMotion();
  const hindi = useLang() === "hi";
  const at = (ms: number) => (reduced ? 0 : ms);
  const { countdown: copy, assets } = wedding;
  const t = hindi ? { ...copy, ...copy.hindi } : copy;
  const locale = hindi ? "hi-IN" : "en-IN";

  const when = useMemo(() => parseVenueDateTime(wedding.wedding.dateTime), []);
  const state = useCountdown(when, wedding.wedding.timeZone);
  const dateLine = useMemo(() => {
    if (!when) return null;
    const d = formatVenueDate(when, locale);
    const zone =
      when.hour === null ? null : zoneLabel(venueInstant(when, wedding.wedding.timeZone), wedding.wedding.timeZone);
    return [d.weekday, `${d.day} ${d.month} ${d.year}`, d.time && [d.time, zone].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(" · ");
  }, [when, locale]);

  if (!state) return null;
  const words = hindi ? copy.hindi : copy;
  const message = state.phase === "today" ? words.today : state.phase === "after" ? words.after : null;

  return (
    <section
      id="countdown"
      ref={ref}
      aria-labelledby="countdown-heading"
      lang={hindi ? "hi" : undefined}
      className="relative flex flex-col items-center px-[var(--gutter)] pb-4 pt-5 text-center"
    >
      {/* ── the heading, above the wreath ── */}
      <Reveal show={seen} delay={at(300)} as="p" className="cd-deep-gold font-deva text-[16px] font-semibold leading-none">
        <span lang="sa">{copy.eyebrow}</span>
      </Reveal>
      <Reveal show={seen} delay={at(420)}>
        <h2
          id="countdown-heading"
          className={`mt-2.5 leading-tight [font-size:clamp(30px,8.6vw,38px)] ${hindi ? "font-deva font-semibold" : ""}`}
        >
          {message ? message.title : t.title}
        </h2>
      </Reveal>
      <Reveal show={seen} delay={at(520)} className="mt-3 flex w-[min(15rem,70%)] items-center gap-2">
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-gold" />
        <span aria-hidden className="h-1.5 w-1.5 rotate-45 border border-gold bg-ivory" />
        <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-gold" />
      </Reveal>
      {dateLine && (
        <Reveal
          show={seen}
          delay={at(600)}
          as="p"
          className={`cd-deep-gold mt-2.5 text-balance text-[14px] font-semibold ${hindi ? "font-deva" : "font-sans uppercase tracking-[0.1em]"}`}
        >
          {dateLine}
        </Reveal>
      )}

      {/* ── the wreath, larger, with the wedding's month inside it ── */}
      <div className="relative mt-4 [container-type:inline-size]" style={{ width: "min(110%, 440px)" }}>
        <div className="relative" style={{ aspectRatio: `${assets.countdownWreathSize.width} / ${assets.countdownWreathSize.height}` }}>
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
          {when && (
            <MonthCalendar
              when={when}
              locale={locale}
              weddingDay={t.weddingDay}
              lotus={assets.calendarLotus}
              lotusSize={assets.calendarLotusSize}
              shown={seen}
              reduced={reduced}
            />
          )}

          {/* The couple's clouds, parting to reveal the wreath */}
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

      {/* ── the time left: one line, then the numbers ── */}
      <div className="relative mt-6 w-full max-w-[24rem]">
        {message ? (
          <Reveal
            show={seen}
            delay={at(1400)}
            as="p"
            className={`text-balance text-[22px] font-medium leading-snug text-slate ${hindi ? "font-deva" : "font-display italic"}`}
          >
            {message.line}
          </Reveal>
        ) : (
          state.phase === "counting" && (
            <Reveal show={seen} delay={at(1400)}>
              <p className={`cd-lead ${hindi ? "font-deva" : "font-display italic"}`}>{words.lead}</p>
              <CountdownRow state={state} start={seen} reduced={reduced} after={at(1400)} />
            </Reveal>
          )
        )}
      </div>
    </section>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** The four units, each in English and Hindi. */
const UNITS = [
  { en: "Days", hi: "दिन" },
  { en: "Hours", hi: "घंटे" },
  { en: "Minutes", hi: "मिनट" },
  { en: "Seconds", hi: "सेकंड" },
] as const;

/**
 * Days, hours, minutes, seconds. The first time it comes into view the numbers count up from zero
 * (1s, easing out); after that each digit rolls on its own as it changes — the old one rising away,
 * the new one coming up from below (300ms). A small gold bead by the seconds beats once a second.
 */
function CountdownRow({
  state,
  start,
  reduced,
  after,
}: {
  state: { days: number; hours: number; minutes: number; seconds: number };
  start: boolean;
  reduced: boolean;
  after: number;
}) {
  const [progress, setProgress] = useState(reduced ? 1 : 0);
  useEffect(() => {
    if (!start || reduced) return;
    let frame = 0;
    let t0 = 0;
    const timer = window.setTimeout(() => {
      const step = (now: number) => {
        if (!t0) t0 = now;
        const p = Math.min(1, (now - t0) / 1000);
        setProgress(p);
        if (p < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, after);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [start, reduced, after]);
  const counting = progress < 1;
  const eased = 1 - (1 - progress) ** 3;
  const v = (n: number) => (counting ? Math.round(n * eased) : n);
  const values = [String(v(state.days)), pad(v(state.hours)), pad(v(state.minutes)), pad(v(state.seconds))];

  return (
    <dl role="timer" aria-live="off" className="cd-row">
      {UNITS.map((unit, i) => (
        <div key={unit.en} className={`cd-unit${i === 0 ? " cd-unit-days" : ""}`}>
          <dt className="cd-label">
            <span className="cd-label-en">
              {unit.en}
              {i === 3 && !reduced && <span key={state.seconds} aria-hidden className="cd-bead" />}
              {i === 3 && reduced && <span aria-hidden className="cd-bead cd-bead-still" />}
            </span>
            <span lang="hi" className="cd-label-hi font-deva">
              {unit.hi}
            </span>
          </dt>
          <dd className="cd-num">
            <Digits value={values[i]} roll={!counting && !reduced} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A number as separate digits, each keyed by its place from the right, so each rolls on its own. */
function Digits({ value, roll }: { value: string; roll: boolean }) {
  const chars = value.split("");
  return (
    <span className="cd-digits">
      {chars.map((c, i) => (
        <Digit key={chars.length - i} ch={c} roll={roll} />
      ))}
    </span>
  );
}

function Digit({ ch, roll }: { ch: string; roll: boolean }) {
  const [shown, setShown] = useState<{ ch: string; prev: string | null; n: number }>({ ch, prev: null, n: 0 });
  if (shown.ch !== ch) setShown({ ch, prev: roll ? shown.ch : null, n: shown.n + 1 });
  return (
    <span className="cd-digit">
      {shown.prev !== null && (
        <span key={`o${shown.n}`} aria-hidden className="cd-d cd-d-out">
          {shown.prev}
        </span>
      )}
      <span key={`i${shown.n}`} className={shown.prev !== null ? "cd-d cd-d-in" : "cd-d"}>
        {shown.ch}
      </span>
    </span>
  );
}

/**
 * The wedding's month, made from the date itself: its name, the days of the week, and its weeks
 * from the right weekday — the wedding day marked with a watercolour lotus that blooms in.
 */
function MonthCalendar({
  when,
  locale,
  weddingDay,
  lotus,
  lotusSize,
  shown,
  reduced,
}: {
  when: VenueDateTime;
  locale: string;
  weddingDay: string;
  lotus: string;
  lotusSize: { width: number; height: number };
  shown: boolean;
  reduced: boolean;
}) {
  const { title, weekdays, weeks } = useMemo(() => {
    const utc = (d: number) => new Date(Date.UTC(when.year, when.month - 1, d));
    const first = utc(1).getUTCDay(); // 0 = Sunday
    const days = new Date(Date.UTC(when.year, when.month, 0)).getUTCDate();
    const cells: Array<number | null> = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
    while (cells.length % 7) cells.push(null);
    const rows: Array<Array<number | null>> = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    // a known Sunday, for the names of the days
    const sunday = Date.UTC(2023, 0, 1);
    const names = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday + i * 86_400_000);
      const f = (weekday: "narrow" | "long") => new Intl.DateTimeFormat(locale, { weekday, timeZone: "UTC" }).format(d);
      return { short: f("narrow"), long: f("long") };
    });
    const monthName = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(utc(1));
    return { title: monthName, weekdays: names, weeks: rows };
  }, [when, locale]);

  const fade: CSSProperties = reduced
    ? { opacity: shown ? 1 : 0, transition: "opacity 400ms linear" }
    : { opacity: shown ? 1 : 0, transition: `opacity 900ms ${EASE.silk} 900ms` };
  // the lotus blooms in (0.8s); for reduced motion it is simply there
  const bloom: CSSProperties = reduced
    ? {}
    : {
        opacity: shown ? 1 : 0,
        scale: shown ? "1" : "0.6",
        transition: `opacity 800ms ${EASE.silk} 1300ms, scale 800ms ${EASE.silk} 1300ms`,
      };

  return (
    <div className="cd-month" style={fade}>
      {/* letter-spacing would break Devanagari's joins, so the Hindi month is set without it */}
      <p
        className={`cd-month-title font-semibold text-gold-ink ${locale.startsWith("hi") ? "font-deva text-[13px]" : "font-sans text-[12px] uppercase tracking-[0.26em]"}`}
        aria-hidden
      >
        {title}
      </p>
      <table aria-label={`${title} — ${when.day}: ${weddingDay}`}>
        <thead>
          <tr>
            {weekdays.map((d) => (
              <th key={d.long} scope="col" abbr={d.long} className="text-[11px] font-semibold text-gold-ink">
                {d.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((day, i) =>
                day === when.day ? (
                  <td key={i} className="font-display text-[14px] font-semibold">
                    <span aria-hidden className="cd-lotus-glow" data-still={reduced || undefined} />
                    <img
                      src={lotus}
                      alt=""
                      aria-hidden
                      width={lotusSize.width}
                      height={lotusSize.height}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="cd-lotus"
                      data-still={reduced || undefined}
                      style={bloom}
                    />
                    <span className="cd-lotus-day">{day}</span>
                    <span className="sr-only">, {weddingDay}</span>
                  </td>
                ) : (
                  <td key={i} className="font-display text-[14px] font-semibold text-navy">
                    {day ?? ""}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
