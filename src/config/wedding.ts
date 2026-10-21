/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE ONE FILE TO EDIT
 *  Names, dates, places, artwork and wording for the whole invitation.
 *  Values marked SAMPLE are stand-ins until the family confirms them.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const wedding = {
  couple: {
    bride: { displayName: "Preeti" },
    groom: { displayName: "Shivashish" },
  },

  wedding: {
    // SAMPLE: replace with the confirmed muhurat. Local time at the venue, in `timeZone`.
    dateTime: "2027-02-12T19:30",
    timeZone: "Asia/Kolkata",
  },

  // SAMPLE: replace with the confirmed venue.
  venue: {
    name: "Kailash Vatika",
    city: "Varanasi",
  },

  /** Personalised links: ?guest=Ananya (also ?to= or ?name=). */
  guest: {
    queryKeys: ["guest", "to", "name"],
    fallbackName: "Guest",
    maxLength: 40,
  },

  opening: {
    /**
     * A guest who already watched the opening during this visit (e.g. they
     * reloaded the page) gets a short version instead of the full one.
     */
    shortOnRepeatVisit: true,
    /** Longest wait for the artwork before the opening starts anyway. */
    maxAssetWaitMs: 3500,
  },

  assets: {
    /** The sky behind every section (supplied reference image). */
    sky: "/art/sky.jpg",
    opening: {
      shivaHand: "/art/opening/hand-shiva.webp",
      parvatiHand: "/art/opening/hand-parvati.webp",
      joinedHands: "/art/opening/hands-joined.webp",
      /** Shiv–Parvati seated, revealed beneath the joined hands. */
      divineCouple: "/art/shiva-parvati-seated.webp",
    },
    /** Soft-edged bloom used for every watercolour reveal. */
    watercolorMask: "/art/watercolor-mask.png",
    /** Couple at the Shivling — the hero illustration (Phase 4). */
    heroCouple: "/art/couple-shivling.webp",
  },

  /** Artwork credits shown on the site. */
  credits: {
    openingHands: "Hands artwork © ArtistAdarsh",
  },

  meta: {
    title: "{bride} & {groom} · Wedding Invitation",
    description: "With the blessings of Mahadev and Maa Parvati, you are invited to our wedding.",
    /** Full public URL once deployed (for link previews), e.g. https://preeti-shivashish.vercel.app */
    siteUrl: "",
    /** Keep the invitation out of search engines. */
    noindex: true,
  },
} as const;

export type WeddingConfig = typeof wedding;
