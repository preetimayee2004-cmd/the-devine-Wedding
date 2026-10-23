/** Shapes of the lists in wedding.ts, so real details can replace the samples safely. */

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
  /** The couple dressed for it: a cut-out (transparent background), with its pixel size. */
  image: { src: string; width: number; height: number; alt: string };
  /** The illustration's artist, shown small under the arch while this card is up (optional). */
  credit?: string;
}

export interface FamilyMember {
  relation: string;
  name: string;
}

export interface FamilySide {
  title: string;
  photo: Photo;
  members: FamilyMember[];
}

export interface Wish {
  id: string;
  name: string | null;
  message: string;
}

export type TravelKind = "air" | "rail" | "bus" | "local";

export interface TravelPoint {
  kind: TravelKind;
  label: string;
  name: string;
  note: string;
}

export interface Contact {
  name: string;
  role: string;
  /** International format without "+", e.g. "919876543210". Null hides the call / WhatsApp buttons. */
  phone: string | null;
}

export interface Stay {
  name: string;
  distance: string;
  note: string;
  phone: string | null;
  bookingUrl: string | null;
}

/** Widens a list written inside the `as const` config to its real type. */
export const list = <T>(items: T[]): T[] => items;
