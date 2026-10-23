/** Shapes of the lists in wedding.ts, so real details can replace the samples safely. */

/** A photo slot: `src: null` shows a soft watercolour placeholder until a photo is added. */
export interface Photo {
  /** e.g. "/photos/engagement.jpg" (put the file in public/photos/). */
  src: string | null;
  alt: string;
  caption?: string;
  /** Which part stays in view when a frame crops it (CSS object-position), e.g. "50% 25%". */
  focus?: string;
}

export type Motif = "lotus" | "diya" | "kalash" | "crescent" | "knot";

export type EventIcon =
  "mehendi" | "sangeet" | "haldi" | "baraat" | "welcome" | "knot" | "sindoor" | "bidaai" | "reception";

export interface WeddingEvent {
  id: string;
  name: string;
  /** Hindi / Odia name, shown small (optional). */
  local?: string;
  icon: EventIcon;
  /** Venue's local time, "YYYY-MM-DDTHH:MM". */
  when: string;
  about: string;
  /** Only when it differs from the main venue. */
  venue?: string;
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
