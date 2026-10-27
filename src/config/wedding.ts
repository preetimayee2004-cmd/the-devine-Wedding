/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE ONE FILE TO EDIT
 *  Names, dates, places, artwork and wording for the whole invitation.
 *  Values marked SAMPLE are stand-ins until the family confirms them.
 * ─────────────────────────────────────────────────────────────────────────
 */
import {
  list,
  type Ceremony,
  type Coordinator,
  type FamilyContact,
  type FamilySide,
  type Photo,
  type TravelPoint,
  type Wish,
} from "./types";

export const wedding = {
  couple: {
    bride: { displayName: "Preeti" },
    groom: { displayName: "Shivasish" },
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
     * seal in its mandala, then "Tap to open" under it. For a guest named in the link, their name
     * shows above this line. (No other names, and no date, there.)
     */
    youreInvited: "You're invited",
    touchToBegin: "Tap to open",
    title: "Save the Date",
    blessing: "With the blessings of Mahadev and Maa Parvati, two hearts begin their sacred journey together.",
    request: "request the honour of your presence as they celebrate their union",
    /** The date waits under an ornate label of gold foil to scratch away: its words, and the tap alternative beneath. */
    scratchHint: "Gently scratch to reveal",
    tapToReveal: "or tap to reveal",
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
      touchToBegin: "खोलने के लिए स्पर्श करें",
      title: "शुभ विवाह",
      blessing: "महादेव और माँ पार्वती के आशीर्वाद से, दो हृदय अपनी पवित्र यात्रा आरंभ कर रहे हैं।",
      names: { bride: "प्रीति", groom: "शिवाशीष" },
      request: "अपने विवाह के शुभ अवसर पर आपकी गरिमामयी उपस्थिति की कामना करते हैं",
      scratchHint: "हल्के से खुरचें और देखें",
      tapToReveal: "या स्पर्श करके देखें",
      viewInvitation: "निमंत्रण देखें",
    },
  },

  /**
   * Section 02 — the welcome on the sky between the arch and the couple at the Shivling.
   * {guest} = the guest's name from the link (?guest=…), or `guest.fallbackName` when the link has none.
   * Names, date and venue come from `couple`, `wedding` and `venue`. A tap on the hashtag copies it.
   */
  coupleWelcome: {
    welcome: "Welcome",
    dear: "Dear {guest},",
    invited: "you are warmly invited",
    hashtag: "#PreetiWedsShivasish",
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
    /** The line above the numbers. */
    lead: "Hamare vivah mein baaki hain",
    /** The same, for a guest named in the link. */
    leadFor: "{guest}, hamare vivah mein baaki hain",
    /** Read out for the wedding's date in the little calendar. */
    weddingDay: "wedding day",
    /** With the EN / हिं switch on हिं (the date and the calendar's month and days come from the date). */
    hindi: {
      title: "उल्टी गिनती शुरू",
      labels: { days: "दिन", hours: "घंटे", minutes: "मिनट", seconds: "सेकंड" },
      weddingDay: "विवाह का दिन",
      lead: "हमारे विवाह में बाकी हैं",
      leadFor: "{guest}, हमारे विवाह में बाकी हैं",
      today: {
        title: "आज हमारा विवाह है",
        line: "महादेव के आशीर्वाद से, आज दो दिल एक हो रहे हैं।",
        lineFor: "{guest}, महादेव के आशीर्वाद से आज दो दिल एक हो रहे हैं — आपके साथ होने की हमें बहुत खुशी है।",
      },
      after: { title: "शुभ विवाह", line: "हमें आशीर्वाद देने के लिए धन्यवाद।", lineFor: "{guest}, हमें आशीर्वाद देने के लिए धन्यवाद।" },
    },
    /** Shown on the wedding day itself (at the venue), instead of the numbers. */
    today: {
      title: "Aaj Hamara Vivah Hai",
      line: "Today, with Mahadev's blessings, two hearts become one.",
      lineFor: "Today, with Mahadev's blessings, two hearts become one — and we're so glad you're with us, {guest}.",
    },
    /** Shown once the wedding day has passed. */
    after: { title: "Shubh Vivah", line: "Thank you for blessing us.", lineFor: "Thank you for blessing us, {guest}." },
  },

  /**
   * Section 05 — the wedding events: the heading and one quote above the couple's arch, and inside
   * the arch one ceremony at a time — a tap moves to the next (the Ganga washes the card away), and
   * after the last it comes back to the first.
   *
   * ▶ SAMPLE details (dates, times, venues, dress codes): replace them with your own. Each line
   *   wraps by itself if it is long. Images: a couple cut out on a transparent background, in
   *   public/art/events/ (any size; it is fitted into the arch, standing on its foot).
   */
  events: {
    title: "Wedding Events",
    quote: "Every ritual, a blessing; every moment, a memory we hope to share with you.",
    /** The same, for a guest named in the link. */
    quoteFor: "Every ritual, a blessing; every moment, a memory we hope to share with you, {guest}.",
    /** Under the arch: how to see the other ceremonies. */
    hint: "Tap the arch frame to see the events",
    list: list<Ceremony>([
      {
        name: "Mehendi",
        date: "Wednesday, 10 February 2027",
        time: "4:00 PM",
        venue: "Kailash Vatika, Varanasi",
        dressCode: "Shades of green",
        image: { src: "/art/events/mehendi.webp", width: 444, height: 531, alt: "The couple at the Mehendi, her hands painted with henna, she in green" },
      },
      {
        name: "Sangeet",
        date: "Wednesday, 10 February 2027",
        time: "8:00 PM",
        venue: "The Lawn, Kailash Vatika",
        dressCode: "Indo-western glam",
        image: { src: "/art/events/sangeet.webp", width: 506, height: 556, alt: "The couple dancing at the Sangeet, she twirling in a red lehenga, he in a tuxedo" },
        credit: "Illustration by @aarchi_sharma_",
      },
      {
        name: "Haldi",
        date: "Thursday, 11 February 2027",
        time: "10:00 AM",
        venue: "Kailash Vatika, Varanasi",
        dressCode: "Yellow and white",
        image: { src: "/art/events/haldi.webp", width: 586, height: 640, alt: "The couple at the Haldi in yellow, marigold petals falling as they dance" },
      },
      {
        name: "Shubh Vivah",
        date: "Friday, 12 February 2027",
        time: "7:30 PM",
        venue: "Kailash Vatika, Varanasi",
        dressCode: "Pastels and gold",
        image: { src: "/art/events/wedding.webp", width: 433, height: 640, alt: "The bride and groom in blush pink and gold, walking hand in hand" },
      },
    ]),
  },

  /** Section 06 — two families. SAMPLE: real names and photos replace these. */
  family: {
    eyebrow: "Two Families, One Celebration",
    title: "With Their Blessings",
    intro: "Held in our elders' blessings and our families' love, two homes become one.",
    /** The same, for a guest named in the link. */
    introFor: "Held in our elders' blessings and our families' love, two homes become one — and you, {guest}, are family to us.",
    sides: list<FamilySide>([
      {
        title: "The Bride's Family",
        photo: { src: "/photos/family-bride.webp", alt: "The bride in her bridal jewels, her mother kissing her cheek" },
        members: [
          { relation: "Parents", name: "Smt. Sunita & Shri Rakesh Kumar" },
          { relation: "Grandparents", name: "Smt. Kamla Devi & Shri Harinarayan" },
          { relation: "Brother", name: "Ankit" },
        ],
      },
      {
        title: "The Groom's Family",
        photo: { src: "/photos/family-groom.webp", alt: "The groom in a red sherwani and safa, hugged by his family" },
        members: [
          { relation: "Parents", name: "Smt. Meera & Shri Prakash Chandra" },
          { relation: "Grandmother", name: "Smt. Savitri Devi" },
          { relation: "Sister", name: "Shreya" },
        ],
      },
    ]),
  },

  /**
   * Section 07 — the gallery: the couple's photos as a heart of fourteen tiles.
   *
   * Which photo each tile shows, and the crop of it, is set by the tiles in Gallery.tsx (by `src`);
   * five of these show twice, once as a close-up. A tap brings a tile forward with its `caption`
   * (keep them short). The photos are 3:4; `thumb` is a small copy (360px wide) for the tiles, the
   * full photo is loaded when one is tapped. More photos than the heart shows: every 3s a tile turns
   * over to show one of the others (cropped to the tile, `focus` says which part stays in view).
   * These are cut from the couple's shoot collage (public/photos/gallery-1..9.webp, each tile only
   * ~240px wide, enlarged 2x): the full-size originals will look sharper — put them in
   * public/photos/ under the same names (and their small copies in public/photos/thumbs/).
   */
  gallery: {
    eyebrow: "Moments to Remember",
    title: "Our Gallery",
    intro: "Moments we hold close, like the moon in Mahadev's locks.",
    hint: "Tap a photo",
    /**
     * The frame round the photos: a double gold heart line wreathed in eucalyptus (the couple's picture,
     * its white keyed away, the leaves recoloured a dusty Shiva blue); the photos fill its opening.
     */
    heartFrame: "/art/gallery-heart-leaves.webp",
    photos: list<Photo>([
      {
        src: "/photos/gallery-1.webp",
        thumb: "/photos/thumbs/gallery-1.webp",
        alt: "The couple seated close on the old stone steps, she in a red silk saree, he in a white kurta",
        caption: "Side by side",
        focus: "52% 40%",
      },
      {
        src: "/photos/gallery-3.webp",
        thumb: "/photos/thumbs/gallery-3.webp",
        alt: "He holds her close on the steps; she smiles, eyes lowered",
        caption: "Held close",
        focus: "50% 40%",
      },
      {
        src: "/photos/gallery-4.webp",
        thumb: "/photos/thumbs/gallery-4.webp",
        alt: "Forehead to forehead, his hand on her cheek",
        caption: "Forehead to forehead",
        focus: "45% 40%",
      },
      {
        src: "/photos/gallery-5.webp",
        thumb: "/photos/thumbs/gallery-5.webp",
        alt: "He kisses her forehead as she smiles, by the old stone wall",
        caption: "A kiss on the forehead",
        focus: "55% 40%",
      },
      {
        src: "/photos/gallery-6.webp",
        thumb: "/photos/thumbs/gallery-6.webp",
        alt: "Seated on the steps, she in front of him, both smiling",
        caption: "Smiles on the steps",
        focus: "50% 45%",
      },
      {
        src: "/photos/gallery-7.webp",
        thumb: "/photos/thumbs/gallery-7.webp",
        alt: "Arm in arm, walking down the old stone steps",
        caption: "Walking on together",
        focus: "50% 50%",
      },
      {
        src: "/photos/gallery-2.webp",
        thumb: "/photos/thumbs/gallery-2.webp",
        alt: "On a stone path by the ghat steps, they reach for each other's hands as if to dance",
        caption: "A dance on the ghats",
        focus: "50% 50%",
      },
      {
        src: "/photos/gallery-8.webp",
        thumb: "/photos/thumbs/gallery-8.webp",
        alt: "On the old ghat steps, a few steps apart, smiling at each other",
        caption: "A few steps apart",
        focus: "50% 35%",
      },
      {
        src: "/photos/gallery-9.webp",
        thumb: "/photos/thumbs/gallery-9.webp",
        alt: "By the stone ledge of the ghat, she leans on the wall as he looks on",
        caption: "By the ghat wall",
        focus: "50% 30%",
      },
    ]),
  },

  /**
   * Section 08 — the invitation and "The Sacred Union": one button (no form) accepts — saved to the
   * family's database when there is one, never remembered on the phone — and opens the blessing
   * scene. The buttons, the scene's title and closing show in capitals. "Add to calendar" uses
   * wedding.dateTime and the venue above.
   */
  rsvp: {
    title: "A Sacred Celebration",
    message: "Your presence would make our celebration even more special.",
    /** The same, for a guest named in the link ({guest} is their name). */
    messageFor: "{guest}, your presence would make our celebration even more special.",
    /** Over the button, in the gold-framed label. */
    presence: "Your presence is our blessing",
    button: "Join the Celebration",
    /** The small pill floating at the foot of the screen until the invitation is accepted. */
    shortcut: "RSVP",
    /** Once accepted, over the scene: for a named guest, and for anyone. */
    thanksFor: "Thank you, {guest} — we can't wait to celebrate with you!",
    thanks: "Thank you — we can't wait to celebrate with you!",
    blessing: "By the grace of Mahadev and Maa Parvati, we look forward to celebrating this special occasion with you.",
    closing: "Har Har Mahadev",
    calendarButton: "Add to calendar",
    /** Under the scene, once accepted: where the acceptance went (each with its twin for a named guest). */
    reached: "Your acceptance has reached the family.",
    reachedFor: "Your acceptance has reached the family, {guest}.",
    tellFamily: "Please also let the family know you're coming.",
    tellFamilyFor: "{guest}, please also let the family know you're coming.",
  },

  /** Section 09 — the blessing wall. Sample wishes show until real ones arrive. */
  wishes: {
    eyebrow: "With Love and Blessings",
    title: "Blessing Wall",
    quote: "May your hearts always find their way home to each other.",
    placeholder: "Write a heartfelt wish for the couple…",
    placeholderFor: "{guest}, write a heartfelt wish for the couple…",
    maxLength: 280,
    formTitle: "Leave a Blessing",
    button: "Offer your blessing",
    /** Shown once a blessing is saved (never before). */
    thanks: "Your blessing joins their journey of love.",
    thanksFor: "Thank you, {guest}. Your blessing joins their journey of love.",
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

  /**
   * Section 10 — "Finding Your Way": the venue and how to get there.
   * SAMPLE: every distance, time and place below is a placeholder — check each one before sharing
   * the link.
   */
  travel: {
    eyebrow: "Venue & Guest Arrangements",
    title: "Finding Your Way",
    /** The three ways in, each a stop on the river line; a tap opens its detail. */
    points: list<TravelPoint>([
      {
        kind: "air",
        label: "By air",
        name: "Lal Bahadur Shastri Airport",
        place: "Babatpur",
        distance: "about 25 km",
        time: "50 min",
        detail: "Prepaid taxis and app cabs wait outside arrivals. We'll gladly pick you up on 11 & 12 February.",
      },
      {
        kind: "rail",
        label: "By rail",
        name: "Varanasi Junction",
        place: "Cantonment",
        distance: "about 10 km",
        time: "30 min",
        detail: "Autos and app cabs at the main exit; ask for Sarnath Road. Pickups on 11 & 12 February too.",
      },
      {
        kind: "local",
        label: "By road",
        name: "Local cab or auto",
        place: "Anywhere in the city",
        distance: "across Varanasi",
        time: "on call",
        detail: "Ola, Uber, autos and e-rickshaws run all over the city. Show the driver the venue on the map.",
      },
    ]),
  },

  /**
   * Section 10½ — "Contact & Assistance", between the venue and the thank-you.
   *
   * SAMPLE: the names and relations below are examples (the bride's brother and the groom's sister
   * as in the family section; the coordinators made up) — replace them with the real people. Each
   * shows a call button instead of a number: with a `phone` it dials it (a tel: link); without one
   * it only says the number is coming. Phones in international format without "+", e.g.
   * "919876543210".
   */
  contact: {
    eyebrow: "Here for You",
    title: "Contact & Assistance",
    intro: "For any questions or assistance, our families are always happy to help.",
    /** The same, for a guest named in the link (about as long, so the section still fits one screen). */
    introFor: "For anything you need, {guest}, our families are always happy to help.",
    /** One for each side: who to call, and how they are related to the bride or the groom. */
    family: list<FamilyContact>([
      // SAMPLE: the bride's brother and the groom's sister, as named in the family section above
      { side: "The Bride's Family", name: "Ankit", relation: "Bride's brother", phone: null },
      { side: "The Groom's Family", name: "Shreya", relation: "Groom's sister", phone: null },
    ]),
    coordinationTitle: "Wedding Coordination",
    coordinationNote: "For assistance with guest arrangements and wedding details.",
    coordinators: list<Coordinator>([
      // SAMPLE names
      { role: "Guest Coordinator", name: "Rohan", phone: null },
      { role: "Wedding Coordinator", name: "Neha Verma", phone: null },
    ]),
    /** The closing line at the foot of the section. */
    closing: "We're just a call away.",
    closingFor: "We're just a call away, {guest}.",
  },

  /** Section 11 — thank you. */
  thankYou: {
    eyebrow: "With hearts full of gratitude",
    title: "Thank You",
    message:
      "Thank you for being a part of our beautiful beginning. May the blessings of Mahadev always guide our journey.",
    messageFor:
      "Thank you, {guest}, for being a part of our beautiful beginning. May the blessings of Mahadev always guide our journey.",
  },

  /** The footer — the last page, small and quiet: a blessing, the mantra, an emblem, the couple's initials. */
  footer: {
    blessing: "May the blessings of Mahadev and Maa Parvati guide your journey with love, harmony, and eternal happiness.",
    mantra: "॥ हर हर महादेव ॥",
    backToTop: "Back to Top",
  },

  /**
   * Personalised links: ?guest=Ananya (also ?to= or ?name=). The name greets the guest on the gate
   * (above "You're invited"), in the couple section, the countdown's line on and after the day, the
   * family's intro, the events' quote, the RSVP (its line, and the thanks and note once accepted),
   * the countdown's line over the numbers, the blessing wall (the box, the signature and the thanks),
   * the contact intro and closing line, the
   * thank-you and the browser tab; without one, those lines read as written for
   * anyone (each "…For" line has its plain twin beside it).
   */
  guest: {
    queryKeys: ["guest", "to", "name"],
    fallbackName: "Guest",
    /**
     * SAMPLE: when the link names no guest, the invitation greets this example name instead, so every
     * personal line can be seen as a guest would. It is never saved with a wish or an RSVP. Set it to
     * null before sharing a link without a name, so such a link reads as written for anyone.
     */
    sampleName: "Ananya" as string | null,
    maxLength: 40,
    /** The browser tab, for a named guest: "Ananya, you're invited · …". */
    titleFor: "{guest}, you're invited",
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
    /**
     * On desktop, behind the phone: Mount Kailash rising through the clouds (1376 × 768). The
     * phone stands to the right of the peak, so the peak stays in view.
     */
    desktopBackdrop: "/art/kailash-desktop.webp",
    /** The opening's two hands, reaching from either side (same artboard, so they meet exactly). */
    /**
     * The opening, from the couple's own picture (852 × 1846, a phone screen): a sunrise sky with clouds
     * and the Himalaya, and the two hands on their own layers — all the same size, so they line up.
     */
    opening: {
      sky: "/art/opening/opening-sky.webp",
      shivaHand: "/art/opening/opening-shiva.webp",
      parvatiHand: "/art/opening/opening-parvati.webp",
    },
    /**
     * The Save the Date's painting — Mahadev blessing Maa Parvati before the
     * snowy Himalaya and a lotus lake — filling the card's lower half, its sky
     * melting into the site's. The layout is tuned to this painting's
     * composition (sky band, then their heads), see `.save-the-date` in
     * index.css. A larger original of the same painting will look sharper:
     * replace the file and update its pixel size here.
     */
    /**
     * Section 05: the couple's gold temple arch, wreathed in lotus and banana leaves, with tabla,
     * veena, harmonium, a painted gramophone and a festive elephant at its foot. Its white was made
     * transparent (and the editing app's checkerboard blob removed), so the site's sky shows through.
     */
    /**
     * Section 06: the frame round each family photo — gold pillars and scrolls, a peacock on each
     * pillar (its white made transparent, trimmed to the art). The photo sits between the peacocks
     * (WINDOW in Family.tsx). NOTE: this copy carries the stock site's watermark; replace it with
     * the licensed file of the same picture (same name, and update the size if it differs).
     */
    familyFrame: "/art/peacock-frame.webp",
    familyFrameSize: { width: 1163, height: 1105 },
    eventsArch: "/art/events-arch.webp",
    eventsArchSize: { width: 1098, height: 1228 },
    saveTheDateArt: "/art/shiva-parvati-blessing.jpg",
    saveTheDateArtSize: { width: 572, height: 1024 },
    /**
     * The same painting in two layers, for the descent to the couple section: the Himalaya (with a
     * soft mist where the figures stand) and Mahadev and Maa Parvati alone. Together they are the
     * painting; as the guest scrolls on, the mountains drift up slowly and the figures a little
     * faster. Made from `saveTheDateArt` — remake both if it changes.
     */
    saveTheDateLayers: { back: "/art/painting-back.webp", figures: "/art/painting-figures.webp" },
    /**
     * Section 11 (Thank You): Shiv and Parvati seated side by side, hands folded in prayer — the
     * couple's chosen painting, cut out of its Himalayan scene so they sit in the gold halo on the
     * site's own sky (her lap and skirt and his right arm, which the cut-out left faint, made solid).
     */
    /**
     * The couple's song — only its opening tune (the file keeps just its first 14s). It starts from
     * the gate's "Tap to open" (unless the guest turns the sound off there first), and the corner's
     * sound button pauses or resumes it.
     */
    music: "/audio/parvati-boli-shankar-se-intro.mp3",
    /**
     * Where the tune loops (seconds): it plays from the top once, then repeats between two of its own
     * downbeats — the triple beat that comes every 2.909s — four phrases a time, so the join falls on
     * the beat. To loop a longer or shorter stretch, keep both on a downbeat (1.032 + n × 2.909).
     */
    musicLoop: { start: 1.032, end: 12.67 },
    thankYouArt: "/art/shiva-parvati-prayer.webp",
    /**
     * Section 08 (RSVP). Before accepting: the kalash hanging on its chain and the Shivling beneath it,
     * drawn for the site (SVG) in the same fine gold line on warm ivory as Nandi. Nandi below the panel: from the couple's RSVP design,
     * in fine gold line with his jewels and drape, on a base of curls, flowers and a lotus (its page keyed away). Once accepted:
     * the gold trishul from the couple's design (keyed off its page, 2x).
     */
    rsvpTrishul: "/art/rsvp-trishul.webp",
    rsvpPot: "/art/rsvp-kalash.svg",
    rsvpShivling: "/art/rsvp-shivling.svg",
    rsvpNandi: "/art/rsvp-nandi.webp",
    /**
     * Section 08 (RSVP): Mahadev holding Maa Parvati close, eyes closed — the couple's chosen painting,
     * cut out of its red ground (the halo's arc and the corner flowers left behind) so it stands in the
     * gold arch on the site's own sky.
     */
    rsvpCouple: "/art/shiva-parvati-embrace.webp",
    rsvpCoupleSize: { width: 695, height: 969 },
    /** Soft-edged bloom used for every watercolour reveal. */
    watercolorMask: "/art/watercolor-mask.png",
    /** The golden ॐ wax seal on the gate before the opening ("Touch to begin"). */
    omSeal: "/art/om-seal.webp",
    /**
     * Section 02, made from one painting (its text and sky taken out, so the site's sky shows
     * through): the carved arch — its carving in deep navy (the Blessing Wall button's, toned shadow
     * to highlight so the carving keeps its depth), white flowers hanging where its leaves were — with bells and jasmine strings across the top (1220 × 600), and
     * the scene at the foot (1220 × 1448) — palms, petals, hills, a temple by the river, a diya,
     * lotuses, and the couple offering water to the Shivling.
     */
    coupleArch: "/art/couple-arch.webp",
    coupleArchSize: { width: 1220, height: 600 },
    /**
     * The arch's three temple bells, lifted out so they can sway: each with the lower part of its
     * chain, its top centre on the chain (the pivot). Placed in % of the arch.
     */
    /**
     * The lower part of the arch's two jasmine garlands, lifted out like the bells so they can swing
     * once as the section arrives (top centre = pivot; placed in % of the arch).
     */
    coupleGarlands: [
      { src: "/art/couple-garland-1.webp", left: 6.311, top: 50, width: 6.475, size: { width: 79, height: 282 } },
      { src: "/art/couple-garland-2.webp", left: 86.311, top: 50, width: 6.311, size: { width: 77, height: 282 } },
    ],
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
    /** Full public URL once deployed (for link previews), e.g. https://preeti-shivasish.vercel.app */
    siteUrl: "",
    /** Keep the invitation out of search engines. */
    noindex: true,
  },
} as const;

export type WeddingConfig = typeof wedding;
