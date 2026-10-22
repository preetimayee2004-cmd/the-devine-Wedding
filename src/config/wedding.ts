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
    /**
     * The gate before the opening (every time the link opens or reloads): this line over the golden ॐ
     * seal, the couple's names and the date under it, then "Touch to begin".
     */
    youreInvited: "You're invited",
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
      youreInvited: "आप आमंत्रित हैं",
      touchToBegin: "आरंभ करने के लिए स्पर्श करें",
      title: "शुभ विवाह",
      blessing: "महादेव और माँ पार्वती के आशीर्वाद से, दो हृदय अपनी पवित्र यात्रा आरंभ कर रहे हैं।",
      names: { bride: "प्रीति", groom: "शिवाशीष" },
      request: "अपने विवाह के शुभ अवसर पर आपकी गरिमामयी उपस्थिति की कामना करते हैं",
      venue: "कैलाश वाटिका, वाराणसी",
      viewInvitation: "निमंत्रण देखें",
    },
  },

  /**
   * Section 02 — the welcome on the sky between the arch and the couple at the Shivling.
   * {guest} = the guest's name from the link (?guest=…), or `everyone` when the link has none.
   * Names, date and venue come from `couple`, `wedding` and `venue`. A tap on the hashtag copies it.
   */
  coupleWelcome: {
    welcome: "Welcome",
    dear: "Dear {guest},",
    everyone: "Family & Friends",
    invited: "you are warmly invited",
    hashtag: "#PreetiWedsShivashish",
    copied: "Copied",
    /** With the EN / हिं switch on हिं. */
    hindi: {
      welcome: "स्वागतम्",
      invited: "आप सादर आमंत्रित हैं",
    },
  },

  /** Section 03 — the celestial calendar. Counts to wedding.dateTime in wedding.timeZone. */
  countdown: {
    eyebrow: "शुभ मुहूर्त",
    title: "Countdown Begins",
    labels: { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" },
    /** Read out for the wedding's date in the little calendar. */
    weddingDay: "wedding day",
    /** With the EN / हिं switch on हिं (the date and the calendar's month and days come from the date). */
    hindi: {
      title: "उल्टी गिनती शुरू",
      labels: { days: "दिन", hours: "घंटे", minutes: "मिनट", seconds: "सेकंड" },
      weddingDay: "विवाह का दिन",
    },
    /** Shown on the wedding day itself (at the venue), instead of the numbers. */
    today: { title: "Today Is the Day", line: "Today, two hearts become one." },
    /** Shown once the wedding day has passed. */
    after: { title: "Happily Married", line: "With the blessings of Mahadev and Maa Parvati." },
  },

  /** Section 04 — our story. SAMPLE: the couple's own moments, words and photos go here. */
  /**
   * Section 04 — "A Love Written in the Stars": four milestones on a gold constellation.
   *
   * ▶ PLACEHOLDERS — fill in your own story here:
   *   - year:  the year of each milestone
   *   - line:  one short line (and its Hindi in `hindi.line`)
   *   - photo: a WebP in public/photos/ (any size; it is shown 4:5, cropped to fit — `focus`
   *            says which part stays in view). With `src: null` a soft watercolour wash holds
   *            its place. Keep the `alt` describing the photo.
   */
  story: {
    eyebrow: "Under the same sky",
    title: "A Love Written in the Stars",
    subtitle: "Some souls are destined to find each other.",
    hindi: {
      eyebrow: "एक ही आसमान तले",
      title: "सितारों में लिखा प्रेम",
      subtitle: "कुछ आत्माएँ एक-दूसरे को पाने के लिए ही बनी होती हैं।",
    },
    moments: list<StoryMoment>([
      {
        title: "The First Spark",
        year: "2021", // PLACEHOLDER: your year
        line: "One coffee, one long conversation.", // PLACEHOLDER: your line
        photo: {
          src: "/photos/story-1.webp",
          alt: "Illustration: he watches her from the balcony as she turns, a hand in her hair",
          focus: "50% 24%",
        },
        hindi: { title: "पहली चिंगारी", line: "एक कॉफ़ी, एक लंबी बात।" },
      },
      {
        title: "Growing Closer",
        year: "2023", // PLACEHOLDER: your year
        line: "Long calls and cutting chai turned miles into minutes.", // PLACEHOLDER: your line
        photo: {
          src: "/photos/story-2.webp",
          alt: "Illustration: he kisses her cheek in the afternoon sun, she in a lavender saree",
          focus: "50% 16%",
        },
        hindi: { title: "और क़रीब", line: "लंबी बातें और कटिंग चाय — मीलों की दूरी पलों में बदल गई।" },
      },
      {
        title: "Our Promise",
        year: "2025", // PLACEHOLDER: your year
        line: "At the evening aarti by the Ganga, a question — and a yes.", // PLACEHOLDER: your line
        photo: {
          src: "/photos/story-3.webp",
          alt: "Illustration: a warm embrace before a wall of soft lights, she in a red saree",
          focus: "50% 40%",
        },
        hindi: { title: "हमारा वादा", line: "गंगा किनारे संध्या आरती में, एक सवाल — और एक हाँ।" },
      },
      {
        title: "Written in the Stars",
        year: "2027", // PLACEHOLDER: your year
        line: "With Mahadev's blessings, our forever begins.", // PLACEHOLDER: your line
        photo: {
          src: "/photos/story-4.webp",
          alt: "Illustration: their hands joined and the gathbandhan knot tied, at the wedding fire",
          focus: "50% 42%",
        },
        hindi: { title: "सितारों में लिखा", line: "महादेव के आशीर्वाद से, हमारा सदा का साथ शुरू होता है।" },
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
    /**
     * On desktop, behind the phone: Mount Kailash rising through the clouds (1376 × 768). The
     * phone stands to the right of the peak, so the peak stays in view.
     */
    desktopBackdrop: "/art/kailash-desktop.webp",
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
    /** The golden ॐ wax seal on the gate before the opening ("Touch to begin"). */
    omSeal: "/art/om-seal.webp",
    /**
     * Section 02, made from one painting (its text and sky taken out, so the site's sky shows
     * through): the carved arch — recoloured to the gold of Parvati's saree in the Save the Date
     * painting — with bells and jasmine strings across the top (1220 × 600), and
     * the scene at the foot (1220 × 1448) — palms, petals, hills, a temple by the river, a diya,
     * lotuses, and the couple offering water to the Shivling.
     */
    coupleArch: "/art/couple-arch.webp",
    coupleArchSize: { width: 1220, height: 600 },
    /**
     * The arch's three temple bells, lifted out so they can sway: each with the lower part of its
     * chain, its top centre on the chain (the pivot). Placed in % of the arch.
     */
    coupleBells: [
      { src: "/art/couple-bell-1.webp", left: 27.213, top: 21.667, width: 7.623, size: { width: 93, height: 148 } },
      { src: "/art/couple-bell-2.webp", left: 45.492, top: 7, width: 8.197, size: { width: 100, height: 204 } },
      { src: "/art/couple-bell-3.webp", left: 64.344, top: 21.667, width: 7.705, size: { width: 94, height: 148 } },
    ],
    coupleScene: "/art/couple-scene.webp",
    coupleSceneSize: { width: 1220, height: 1448 },
    /**
     * Section 03's frame — a wreath of flowering vines and the couple's little things (a plane, an
     * evil-eye charm, popcorn, a suitcase, donuts, a car, a coffee cup…), a watercolour mountain
     * and the joined hands at its foot (1324 × 1324, transparent). Lifted from the couple's design
     * screenshot; a larger original would look sharper.
     */
    countdownWreath: "/art/countdown-wreath.webp",
    countdownWreathSize: { width: 1324, height: 1324 },
    /** The couple's watercolour lotus (cut out of its grey background), on the wedding's date. */
    calendarLotus: "/art/lotus.webp",
    calendarLotusSize: { width: 240, height: 186 },
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
