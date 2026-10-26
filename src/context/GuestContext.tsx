import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { wedding } from "@/config/wedding";

interface GuestState {
  /** Guest's name from the share link, else the sample name, else the fallback ("Guest"). */
  guestName: string;
  /** True when there is a name to greet: from the URL, or the sample name. */
  isPersonalized: boolean;
  /** True only when the name came from the URL — the name that may be saved with a wish or an RSVP. */
  fromLink: boolean;
}

const GuestContext = createContext<GuestState | null>(null);

/**
 * Normalises a name from an untrusted URL. React escapes output, so this is
 * about tidiness, not XSS: drop control/markup characters, collapse
 * whitespace, cap the length.
 */
export function sanitizeGuestName(raw: string | null, maxLength: number): string | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F<>{}[\]\\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

function readGuestFromUrl(): GuestState {
  const { queryKeys, fallbackName, sampleName, maxLength } = wedding.guest;
  const params = new URLSearchParams(window.location.search);

  for (const key of queryKeys) {
    const name = sanitizeGuestName(params.get(key), maxLength);
    if (name) return { guestName: name, isPersonalized: true, fromLink: true };
  }
  // no name in the link: the example name, if one is set (see `guest.sampleName`)
  if (sampleName) return { guestName: sampleName, isPersonalized: true, fromLink: false };
  return { guestName: fallbackName, isPersonalized: false, fromLink: false };
}

export function GuestProvider({ children }: { children: ReactNode }) {
  // The share link is fixed for a visit, so read it once.
  const value = useMemo(readGuestFromUrl, []);
  // a named guest sees their name in the browser tab too
  useEffect(() => {
    if (!value.isPersonalized) return;
    const base = document.title;
    document.title = `${forGuest(wedding.guest.titleFor, value.guestName)} · ${base}`;
    return () => {
      document.title = base;
    };
  }, [value]);
  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

/** A line with the guest's name put in for "{guest}". */
export function forGuest(template: string, name: string): string {
  return template.replace(/\{guest\}/g, name);
}

/**
 * Lines for this guest: `personal(template, plain)` is the template with their name when the link
 * names them, and the plain line when it doesn't.
 */
export function usePersonal(): (template: string, plain: string) => string {
  const { guestName, isPersonalized } = useGuest();
  return (template, plain) => (isPersonalized ? forGuest(template, guestName) : plain);
}

export function useGuest(): GuestState {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error("useGuest must be used inside <GuestProvider>");
  return ctx;
}
