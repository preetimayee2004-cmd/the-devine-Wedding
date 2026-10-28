/**
 * Shapes of the lists in wedding.ts, so real details can replace the samples safely.
 *
 * Each item may carry `hindi`: the same words in Hindi, shown when the EN / हिं switch is on हिं
 * (anything left out stays as written).
 */

/** A photo slot: `src: null` shows a soft watercolour placeholder until a photo is added. */
export interface Photo {
  /** e.g. "/photos/engagement.jpg" (put the file in public/photos/). */
  src: string | null;
  alt: string;
  caption?: string;
  /** Which part stays in view when a frame crops it (CSS object-position), e.g. "50% 25%". */
  focus?: string;
  /** Gallery only: a small copy for the heart's tiles (the full `src` is loaded when one is tapped). */
  thumb?: string;
  hindi?: { alt?: string; caption?: string };
}

export type Motif = "lotus" | "diya" | "kalash" | "crescent" | "knot";

export type EventIcon =
  "mehendi" | "sangeet" | "haldi" | "baraat" | "welcome" | "knot" | "sindoor" | "bidaai" | "reception";

/** One ceremony, as its card shows it inside the events arch. Plain words, shown as written. */
export interface Ceremony {
  name: string;
  /** e.g. "Wednesday, 10 February 2027" */
  date: string;
  /** e.g. "4:00 PM" */
  time: string;
  venue: string;
  dressCode: string;
  /**
   * Its illustration (the couple dressed for it, or the ceremony itself): a cut-out (transparent
   * background), with its pixel size. Without one,
   * the arch shows a small gold jhoomar in its place until the illustration comes.
   */
  image?: { src: string; width: number; height: number; alt: string };
  /** The illustration's artist, shown small under the arch while this card is up (optional). */
  credit?: string;
  hindi?: Partial<Pick<Ceremony, "name" | "date" | "time" | "venue" | "dressCode" | "credit">>;
}

export interface FamilyMember {
  relation: string;
  name: string;
  hindi?: { relation?: string; name?: string };
}

export interface FamilySide {
  title: string;
  photo: Photo;
  members: FamilyMember[];
  hindi?: { title?: string };
}

export interface Wish {
  id: string;
  name: string | null;
  message: string;
  /** Samples only (a guest's own wish is shown as they wrote it). */
  hindi?: { name?: string; message?: string };
}

export type TravelKind = "air" | "rail" | "bus" | "local";

export interface TravelPoint {
  kind: TravelKind;
  /** "By air", "By rail", "By road". */
  label: string;
  name: string;
  /** Where it is, briefly ("Babatpur"). */
  place: string;
  /** From the venue: shown together on one line ("about 25 km · 50 min"). */
  distance: string;
  time: string;
  /** Shown when the stop is opened. */
  detail: string;
  hindi?: Partial<Pick<TravelPoint, "label" | "name" | "place" | "distance" | "time" | "detail">>;
}

export interface Contact {
  name: string;
  role: string;
  /** International format without "+", e.g. "919876543210". Null hides the call / WhatsApp buttons. */
  phone: string | null;
}

/** A family member to call (Contact & Assistance). Null fields show as "to come". */
export interface FamilyContact {
  /** "The Bride's Family", "The Groom's Family" — not shown; it names the window for a screen reader. */
  side: string;
  name: string | null;
  /** Their actual relationship, e.g. "Bride's brother". */
  relation: string | null;
  /** International format without "+"; null hides the call button. */
  phone: string | null;
  hindi?: { side?: string; name?: string; relation?: string };
}

/** A coordinator to call (Contact & Assistance). */
export interface Coordinator {
  role: string;
  name: string | null;
  phone: string | null;
  hindi?: { role?: string; name?: string };
}

/** Widens a list written inside the `as const` config to its real type. */
export const list = <T>(items: T[]): T[] => items;
