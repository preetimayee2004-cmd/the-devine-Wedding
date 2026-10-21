import { useEffect, useState } from "react";
import { dateKey, venueDateKey, venueInstant, type VenueDateTime } from "@/lib/venueTime";

export type CountdownState =
  | { phase: "counting"; days: number; hours: number; minutes: number; seconds: number }
  | { phase: "today" }
  | { phase: "after" };

/**
 * Time left until a wedding written in the venue's local time. Ticks on the
 * second; once the moment has passed it reports the wedding day (still the
 * same date at the venue) or "after", and stops ticking.
 */
export function useCountdown(when: VenueDateTime | null, timeZone: string): CountdownState | null {
  const target = when ? venueInstant(when, timeZone) : null;
  const [now, setNow] = useState(() => Date.now());

  const finished = target !== null && now >= target;
  useEffect(() => {
    if (target === null || finished) return;
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          setNow(Date.now());
          schedule();
        },
        1010 - (Date.now() % 1000),
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [target, finished]);

  if (!when || target === null) return null;
  if (finished) return { phase: venueDateKey(now, timeZone) === dateKey(when) ? "today" : "after" };

  const total = Math.floor((target - now) / 1000);
  return {
    phase: "counting",
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
