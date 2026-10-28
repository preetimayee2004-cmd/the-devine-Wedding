/**
 * Wedding times are written in the venue's local time ("2027-02-14T19:30").
 * Display formatting must not shift them into the guest's own time zone,
 * so we format the wall-clock parts directly (via UTC) rather than parsing
 * the string as a local Date.
 */
export interface VenueDateTime {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number | null;
  minute: number | null;
}

const ISO_LOCAL = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/;

export function parseVenueDateTime(iso: string | null): VenueDateTime | null {
  const m = iso ? ISO_LOCAL.exec(iso) : null;
  if (!m) return null;
  return {
    year: +m[1],
    month: +m[2],
    day: +m[3],
    hour: m[4] ? +m[4] : null,
    minute: m[5] ? +m[5] : null,
  };
}

export interface FormattedVenueDate {
  weekday: string; // "Sunday"
  day: string; // "14"
  month: string; // "February"
  monthShort: string; // "Feb"
  year: string; // "2027"
  time: string | null; // "7:30 PM"
}

/** "शाम 7:30 बजे": the time as said in Hindi — the part of the day, the hour on the clock, "बजे". */
function hindiTime(hour: number, minute: number) {
  const part = hour >= 4 && hour < 12 ? "सुबह" : hour >= 12 && hour < 16 ? "दोपहर" : hour >= 16 && hour < 20 ? "शाम" : "रात";
  return `${part} ${hour % 12 || 12}:${String(minute).padStart(2, "0")} बजे`;
}

export function formatVenueDate(p: VenueDateTime, locale = "en-IN"): FormattedVenueDate {
  const asUtc = new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour ?? 0, p.minute ?? 0));
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...o, timeZone: "UTC" }).format(asUtc);

  return {
    weekday: fmt({ weekday: "long" }),
    day: String(p.day),
    month: fmt({ month: "long" }),
    monthShort: fmt({ month: "short" }),
    year: String(p.year),
    time:
      p.hour === null
        ? null
        : locale.startsWith("hi")
          ? hindiTime(p.hour, p.minute ?? 0)
          : fmt({ hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase(),
  };
}

/** Offset of `timeZone` from UTC (ms) at the instant `utcMs`. */
function zoneOffset(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return wall - Math.floor(utcMs / 1000) * 1000;
}

/** The real instant (UTC ms) of a venue wall-clock time — DST-safe. */
export function venueInstant(p: VenueDateTime, timeZone: string): number {
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour ?? 0, p.minute ?? 0);
  const firstGuess = wall - zoneOffset(wall, timeZone);
  return wall - zoneOffset(firstGuess, timeZone);
}

/** "YYYY-MM-DD" of an instant, as seen at the venue. */
export function venueDateKey(utcMs: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(utcMs),
  );
}

export function dateKey(p: VenueDateTime): string {
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Short zone label for guests abroad, e.g. "IST" / "GMT+5:30". */
export function zoneLabel(utcMs: number, timeZone: string, locale = "en-IN"): string {
  const parts = new Intl.DateTimeFormat("en-IN", { timeZone, timeZoneName: "short" }).formatToParts(new Date(utcMs));
  const label = parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone;
  // in Hindi, India's own time by its name
  return locale.startsWith("hi") && label === "IST" ? "(भारतीय समय)" : label;
}
