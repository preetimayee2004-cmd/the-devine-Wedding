/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE ONE FILE TO EDIT
 *  Names, dates, places, artwork and wording for the whole invitation.
 *  Values marked SAMPLE are stand-ins until the family confirms them.
 * ─────────────────────────────────────────────────────────────────────────
 */
import {
  list,
  type Contact,
  type FamilySide,
  type Photo,
  type Stay,
  type StoryMoment,
  type TravelPoint,
  type WeddingEvent,
  type Wish,
} from "./types";

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
    address: "Sarnath Road, Varanasi, Uttar Pradesh",
    city: "Varanasi",
    /** A Google Maps link to the exact spot; when null, directions search for name + address. */
    mapsUrl: null as string | null,
  },

  /**
   * Section 01 — the Save the Date, which the opening becomes: the hands meet
   * and turn to golden dust, Shiv–Parvati appear and settle before Kailash,
   * and these words write themselves in. Date and city come from `wedding`
   * and `venue`.
   */
  invitation: {
    /** The gate before the opening (first visit): a golden ॐ and this line. */
    touchToBegin: "Touch to begin",
    title: "Save the Date",
    blessing: "With the blessings of Mahadev and Maa Parvati, two hearts begin their sacred journey together.",
    request: "request the honour of your presence as they celebrate their union",
    /** The link at the foot of the card, under the blessing: it scrolls on to the next section. */
    viewInvitation: "View the Invitation",
    /**
     * Once the invitation has been on screen this long (ms) and the guest
     * hasn't touched anything, it glides on to the next section. 0 = never.
     */
    autoAdvanceMs: 5000,
    /**
     * The same card in Hindi, for the EN / हिं switch (the month comes from the
     * date). SAMPLE: have the family check the wording.
     */
    hindi: {
      touchToBegin: "आरंभ करने के लिए स्पर्श करें",
      title: "शुभ विवाह",
      blessing: "महादेव और माँ पार्वती के आशीर्वाद से, दो हृदय अपनी पवित्र यात्रा आरंभ कर रहे हैं।",
      names: { bride: "प्रीति", groom: "शिवाशीष" },
      request: "अपने विवाह के शुभ अवसर पर आपकी गरिमामयी उपस्थिति की कामना करते हैं",
      venue: "कैलाश वाटिका, वाराणसी",
      viewInvitation: "निमंत्रण देखें",
    },
  },

  /** Section 03 — the celestial calendar. Counts to wedding.dateTime in wedding.timeZone. */
  countdown: {
    eyebrow: "शुभ मुहूर्त",
    title: "Counting the Moments",
    /** Shown on the wedding day itself (at the venue), instead of the numbers. */
    today: { title: "Today Is the Day", line: "Today, two hearts become one." },
    /** Shown once the wedding day has passed. */
    after: { title: "Happily Married", line: "With the blessings of Mahadev and Maa Parvati." },
  },

  /** Section 04 — our story. SAMPLE: the couple's own moments, words and photos go here. */
  story: {
    eyebrow: "Our Story",
    title: "A Journey Written in the Stars",
    moments: list<StoryMoment>([
      {
        title: "The First Hello",
        when: "Spring 2021",
        text: "A friend's Diwali gathering, one plate of jalebis, and a conversation that refused to end. Neither of us knew it then, but the story had already begun.",
        photo: { src: null, alt: "Preeti and Shivashish when they first met" },
      },
      {
        title: "Long Calls & Chai",
        when: "2022 – 2024",
        text: "Different cities, the same sunsets. Evenings of video calls over cutting chai turned miles into minutes, and friendship into something more.",
        photo: { src: null, alt: "Preeti and Shivashish on a video call" },
      },
      {
        title: "A Promise at the Ghats",
        when: "December 2025",
        text: "As the evening aarti lit up the Ganga, Shivashish asked the question — and Preeti said yes before he could finish it.",
        photo: { src: null, alt: "The proposal at the ghats" },
        motif: "diya",
      },
      {
        title: "Forever Begins",
        when: "February 2027",
        text: "With our families' blessings and Mahadev's grace, we begin our forever — and we would love you beside us.",
        photo: null,
        motif: "lotus",
      },
    ]),
  },

  /** Section 05 — the ceremonies, in order. SAMPLE: the final schedule replaces this. */
  events: {
    eyebrow: "The Wedding Ceremonies",
    title: "Sacred Celebrations",
    intro: "Every ritual, a blessing; every moment, a memory we hope to share with you.",
    list: list<WeddingEvent>([
      {
        id: "mehendi",
        name: "Mehendi",
        icon: "mehendi",
        when: "2027-02-10T16:00",
        about: "Henna, music and laughter as the bride's hands bloom with colour.",
      },
      {
        id: "sangeet",
        name: "Sangeet",
        icon: "sangeet",
        when: "2027-02-10T20:00",
        about: "An evening of song and dance with both families.",
        venue: "The Lawn, Kailash Vatika",
      },
      {
        id: "mangana",
        name: "Mangana",
        icon: "haldi",
        when: "2027-02-11T10:00",
        about: "Turmeric and blessings for the bride and groom.",
      },
      {
        id: "barajatri",
        name: "Barajatri",
        icon: "baraat",
        when: "2027-02-12T18:00",
        about: "The groom's procession sets out with drums and dancing.",
      },
      {
        id: "batabarana",
        name: "Batabarana",
        icon: "welcome",
        when: "2027-02-12T19:00",
        about: "The bride's family welcomes the baraat with aarti.",
      },
      {
        id: "hasta-ganthi",
        name: "Hasta Ganthi",
        icon: "knot",
        when: "2027-02-12T19:30",
        about: "The couple's hands are tied together in the sacred knot.",
      },
      {
        id: "sindoor-daan",
        name: "Sindoor Daan",
        icon: "sindoor",
        when: "2027-02-12T23:00",
        about: "The vermilion that seals a lifetime's promise.",
      },
      {
        id: "bidaai",
        name: "Bidaai",
        icon: "bidaai",
        when: "2027-02-13T06:00",
        about: "A tearful, joyful farewell as the bride begins her new home.",
      },
      {
        id: "reception",
        name: "Reception",
        icon: "reception",
        when: "2027-02-14T19:30",
        about: "Dinner and celebration with everyone we love.",
        venue: "The Grand Pavilion, Varanasi",
      },
    ]),
  },

  /** Section 06 — two families. SAMPLE: real names and photos replace these. */
  family: {
    eyebrow: "Two Families, One Celebration",
    title: "With Their Blessings",
    intro: "With the blessings of our elders and the love of our families, two homes become one.",
    sides: list<FamilySide>([
      {
        title: "The Bride's Family",
        photo: { src: null, alt: "Preeti's family" },
        members: [
          { relation: "Parents", name: "Smt. Sunita & Shri Rakesh Kumar" },
          { relation: "Grandparents", name: "Smt. Kamla Devi & Shri Harinarayan" },
          { relation: "Brother", name: "Ankit" },
        ],
      },
      {
        title: "The Groom's Family",
        photo: { src: null, alt: "Shivashish's family" },
        members: [
          { relation: "Parents", name: "Smt. Meera & Shri Prakash Chandra" },
          { relation: "Grandmother", name: "Smt. Savitri Devi" },
          { relation: "Sister", name: "Shreya" },
        ],
      },
    ]),
  },

  /** Section 07 — the gallery. The first photo is the large one. SAMPLE: add the couple's photos. */
  gallery: {
    eyebrow: "Moments to Remember",
    title: "Our Gallery",
    photos: list<Photo>([
      { src: "/art/couple-shivling.webp", alt: "Preeti and Shivashish at the Shivling", caption: "Blessed beginnings" },
      { src: "/art/shiva-parvati-seated.webp", alt: "Shiva and Parvati seated together", caption: "Shiv & Shakti" },
      { src: null, alt: "Engagement", caption: "Engagement" },
      { src: null, alt: "Pre-wedding", caption: "Pre-wedding" },
      { src: null, alt: "With family", caption: "With family" },
    ]),
  },

  /** Section 08 — one-tap acceptance (no form). */
  rsvp: {
    eyebrow: "You Are Cordially Invited",
    title: "Will You Join Our Celebration?",
    message: "Your presence will make our special day even more beautiful.",
    button: "Accept with Joy",
    welcome: "Dear {guest}, we can't wait to celebrate with you!",
    blessing: "Your presence is a blessing, your smiles a treasured gift.",
    quote: "We look forward to celebrating this beautiful beginning with you.",
    /**
     * SAMPLE: the family's WhatsApp number ("919876543210"). Without a
     * database (see README), acceptance stays on the guest's phone, and this
     * lets them tell the family in one tap.
     */
    whatsapp: null as string | null,
  },

  /** Section 09 — the blessing wall. Sample wishes show until real ones arrive. */
  wishes: {
    eyebrow: "With Love and Blessings",
    title: "Blessing Wall",
    quote: "May your hearts always find their way home to each other.",
    placeholder: "Write a heartfelt wish for the couple…",
    maxLength: 280,
    samples: list<Wish>([
      {
        id: "s1",
        name: "Family & Friends",
        message: "May your life together be filled with love, laughter and divine blessings.",
      },
      { id: "s2", name: "Mausi & Mausa", message: "Wishing you a lifetime of beautiful memories." },
      { id: "s3", name: "Nani", message: "May Mahadev bless your journey together." },
      {
        id: "s4",
        name: "College friends",
        message: "Can't wait to dance at your Sangeet! Two wonderful people, one beautiful story.",
      },
      { id: "s5", name: "Aditi", message: "May every sunrise bring you closer, and every evening find you laughing." },
    ]),
  },

  /** Section 10 — practical details. SAMPLE: only verified places, numbers and links belong here. */
  travel: {
    eyebrow: "Venue & Guest Arrangements",
    title: "Finding Your Way",
    points: list<TravelPoint>([
      {
        kind: "air",
        label: "Nearest airport",
        name: "Lal Bahadur Shastri International Airport (VNS)",
        note: "Babatpur, about 25 km from the city",
      },
      {
        kind: "rail",
        label: "Railway station",
        name: "Varanasi Junction (BSB)",
        note: "Cantonment, in the city centre",
      },
      { kind: "bus", label: "Bus stand", name: "Varanasi Cantt Bus Station", note: "Opposite Varanasi Junction" },
      {
        kind: "local",
        label: "Getting around",
        name: "Autos, e-rickshaws and app cabs",
        note: "Available across the city",
      },
    ]),
    pickup:
      "We'll arrange pickups from the airport and Varanasi Junction on 11 and 12 February. Just share your arrival time.",
    contacts: list<Contact>([{ name: "Rohan", role: "Travel help", phone: null }]),
    stayNote: "Rooms are reserved for our outstation guests. Let us know your dates and we'll take care of the rest.",
    stays: list<Stay>([
      {
        name: "Riverside Guest House",
        distance: "2 km from the venue",
        note: "Reserved for the bride's guests",
        phone: null,
        bookingUrl: null,
      },
      {
        name: "Sarnath Residency",
        distance: "3.5 km from the venue",
        note: "Reserved for the groom's guests",
        phone: null,
        bookingUrl: null,
      },
    ]),
  },

  /** Section 11 — thank you. */
  thankYou: {
    eyebrow: "With hearts full of gratitude",
    title: "Thank You",
    message:
      "Thank you for being a part of our beautiful beginning. May the blessings of Mahadev always guide our journey.",
    mantra: "ॐ नमः शिवाय",
  },

  /** Section 12 — a last little note. */
  loveNote: {
    eyebrow: "A Little Note from the Couple",
    title: "Before You Go…",
    message: "Our story is made more beautiful by the people who share it with us. Thank you for being part of ours.",
    signoff: "With love,",
    closing: "Har Har Mahadev",
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
    /** The opening's two hands, reaching from either side (same artboard, so they meet exactly). */
    opening: {
      shivaHand: "/art/opening/hand-shiva.webp",
      parvatiHand: "/art/opening/hand-parvati.webp",
    },
    /**
     * The Save the Date's painting — Mahadev blessing Maa Parvati before the
     * snowy Himalaya and a lotus lake — filling the card's lower half, its sky
     * melting into the site's. The layout is tuned to this painting's
     * composition (sky band, then their heads), see `.save-the-date` in
     * index.css. A larger original of the same painting will look sharper:
     * replace the file and update its pixel size here.
     */
    saveTheDateArt: "/art/shiva-parvati-blessing.jpg",
    saveTheDateArtSize: { width: 572, height: 1024 },
    /** Shiv–Parvati seated together (Thank You, gallery). */
    divineCouple: "/art/shiva-parvati-seated.webp",
    /** Soft-edged bloom used for every watercolour reveal. */
    watercolorMask: "/art/watercolor-mask.png",
    /** The toran (mango leaves, marigold strings, jasmine garlands) at the top of section 02 — 850 × 980. */
    toran: "/art/toran.webp",
    toranSize: { width: 850, height: 980 },
    /** The couple offering water to the Shivling, at the foot of section 02, inside the toran — 717 × 864. */
    coupleAbhishek: "/art/couple-abhishek.webp",
    coupleAbhishekSize: { width: 717, height: 864 },
    /** Soft cloud bank (it parts for the countdown, and drifts over the Save the Date's peaks). */
    clouds: "/art/clouds.webp",
  },

  /** An artwork credit shown at the very end, e.g. "Hands artwork © Artist name". Null shows none. */
  credits: {
    openingHands: null as string | null,
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
