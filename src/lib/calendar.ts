import { wedding } from "@/config/wedding";
import { parseVenueDateTime, venueInstant, type VenueDateTime } from "@/lib/venueTime";

const pad = (n: number) => String(n).padStart(2, "0");
const utcStamp = (ms: number) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
};
/** iCalendar text escapes backslashes, commas, semicolons and newlines. */
const icsText = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/([,;])/g, "\\$1")
    .replace(/\n/g, "\\n");

interface CalendarItem {
  title: string;
  /** Venue wall-clock time. */
  start: VenueDateTime;
  hours: number;
  location: string;
  details: string;
}

const coupleNames = () => `${wedding.couple.bride.displayName} & ${wedding.couple.groom.displayName}`;

/** The wedding itself, from the configured muhurat (four hours). */
export function weddingCalendarItem(): CalendarItem | null {
  const start = parseVenueDateTime(wedding.wedding.dateTime);
  if (!start || start.hour === null) return null;
  const { venue } = wedding;
  return {
    title: `${coupleNames()} — Wedding`,
    start,
    hours: 4,
    location: [venue.name, venue.address].filter(Boolean).join(", "),
    details: `With the blessings of Mahadev and Maa Parvati, ${coupleNames()} begin their forever.`,
  };
}

/** A Google Calendar link that opens the event ready to save, in the venue's time zone. */
export function googleCalendarUrl(item: CalendarItem): string {
  const s = Date.UTC(
    item.start.year,
    item.start.month - 1,
    item.start.day,
    item.start.hour ?? 0,
    item.start.minute ?? 0,
  );
  const wall = (ms: number) => {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`;
  };
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: item.title,
    dates: `${wall(s)}/${wall(s + item.hours * 3600_000)}`,
    ctz: wedding.wedding.timeZone,
    location: item.location,
    details: item.details,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** Downloads an .ics file, which phones open straight into their calendar app. */
export function downloadIcs(item: CalendarItem) {
  const s = venueInstant(item.start, wedding.wedding.timeZone);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Divine Wedding//Invitation//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:wedding-${utcStamp(s)}@divine-wedding`,
    `DTSTAMP:${utcStamp(Date.now())}`,
    `DTSTART:${utcStamp(s)}`,
    `DTEND:${utcStamp(s + item.hours * 3600_000)}`,
    `SUMMARY:${icsText(item.title)}`,
    `LOCATION:${icsText(item.location)}`,
    `DESCRIPTION:${icsText(`${item.details} ${window.location.origin}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${coupleNames()
    .replace(/\s*&\s*/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase()}-wedding.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
