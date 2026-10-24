# Preeti & Shivasish: a Shiv–Parvati wedding invitation

A mobile-first wedding invitation (React + TypeScript + Vite + Tailwind CSS), shared as a WhatsApp link.

```bash
npm install
npm run dev        # http://localhost:8090
npm run build      # type-check + production build into dist/
npm run og         # remake the link-preview image (after changing names, date or city)
```

## Before you share it: replace the samples

Everything a family changes lives in **`src/config/wedding.ts`**. Every value marked `SAMPLE` is a stand-in. Replace these with the real details:

| Where in the config | What to put there |
| --- | --- |
| `wedding.dateTime` | The confirmed muhurat (venue time). The countdown, calendar and dates all follow it. |
| `venue` | Venue name and full address. Optionally `mapsUrl`, a Google Maps link to the exact spot. |
| `family.sides` | Real names, relations and family photos. |
| `events.list` | Your ceremonies, in order: name, date, time, venue, dress code and the couple's illustration (a cut-out on a transparent background). Long lines wrap by themselves. |
| `gallery.photos` | The heart's photos (3:4) with a short `caption` each (shown in the lightbox) and a small `thumb` (360px wide, in `public/photos/thumbs/`) for the tiles; the full photo is loaded on a tap. Which photo each of the 14 tiles shows, and its crop, is set by `TILES` in `Gallery.tsx` (by `src`). More photos than the tiles show: one tile turns over every 3s to show the others (`focus` keeps the right part in view). Now nine photos cut from the couple's shoot collage (`public/photos/gallery-1..9.webp`); full-size originals under the same names will look sharper. `gallery.hint` is the "Tap a photo" line. |
| `rsvp.whatsapp` | The family's WhatsApp number, e.g. `"919876543210"`. |
| `wishes.samples` | The starting wishes. Remove them once real wishes arrive. |
| `travel` | Verified stations, pickup plan, travel contacts with phone numbers, and the actual hotels with phone numbers or booking links. |
| `meta.siteUrl` | The deployed address. WhatsApp needs it to show the preview image. |
| `assets.saveTheDateArt` | The Save the Date's painting (Mahadev blessing Maa Parvati before the Himalaya), filling the card's lower half. It is 572 × 1024; a larger original of the same painting will look sharper — replace the file and update `assets.saveTheDateArtSize`. The layout is tuned to this painting's composition (see `.save-the-date` in `src/index.css`). |

Call, WhatsApp and Book buttons appear only when a number or link is filled in. Nothing is invented for the guest.

### Adding photos

1. Put the file in `public/photos/`, e.g. `public/photos/engagement.jpg`.
2. Set it in the config: `photo: { src: "/photos/engagement.jpg", alt: "Our engagement" }`.

Any slot with `src: null` shows a soft watercolour wash with a gold ornament, so the page never shows an empty box. Photos around 1200 px on the long side are plenty.

### Personalised links

Add the guest's name to the link:

```
https://<site>/?guest=Ananya        (also ?to= or ?name=)
```

The invitation then greets them by name. Their RSVP and wishes are signed with that name, and the RSVP is tied to it. With no name in the link it says "Dear Guest" and wishes are signed "With love".

## RSVPs and blessings: where they're saved

The site works in two modes. Neither ever claims the family received something that wasn't actually sent.

**Without a database (default).** Wishes are kept on each guest's own phone, and the wording says so honestly ("saved on your phone"). An RSVP isn't kept on the phone at all — a reload shows "Join the Celebration" again — and without a database the wording asks the guest to let the family know too. If `rsvp.whatsapp` is set, the RSVP offers "Tell the family on WhatsApp".

**With Supabase (recommended, free tier is enough).** Acceptances reach the family, and wishes appear for everyone. To set it up:

1. Create a project at supabase.com.
2. Open the SQL Editor and run `supabase/migrations/20261021000000_divine_wedding.sql`.
3. Copy the project URL and the anon key (Project settings → API) into `.env.local` (see `.env.example`), or into your host's environment variables:
   ```
   VITE_SUPABASE_URL=…
   VITE_SUPABASE_ANON_KEY=…
   ```
4. Rebuild.
   - **RSVPs:** read them in Table editor → `rsvps`. Guests can't read them.
   - **Wishes:** read them in Table editor → `wishes`. To take one off the wall, set its `status` to `hidden`.

While developing without a database, a wish containing `#fail` rehearses the error state.

## Link preview (WhatsApp, etc.)

`npm run og` renders `public/og-image.jpg` (1200×630) from the config, using your local Chrome or Edge. Re-run it after changing the names, date or city. Set `meta.siteUrl` so the preview tags carry the image's full address.

## How it looks on each screen

| Width | What guests see |
| --- | --- |
| up to 480px (phones) | The invitation, full-screen |
| wider, touch (tablets) | The site in a centred column on the same mist and ivory |
| wider than 480px with a mouse (desktop) | The phone site, live in a 390 × 844 phone mockup (dark bezel, 54px corners) in the very middle of the screen, scaled down in proportion when the window is small; behind it Mount Kailash in the clouds, full-bleed under a soft navy veil (`assets.desktopBackdrop`) |

## Design

**Colours:**

| Token | Colour | Use |
| --- | --- | --- |
| `navy` | #12294A | Every heading and name |
| `gold-ink` | #A8741F | Gold text: mantras, dates, labels, signatures |
| `slate` | #1F3A5C | Body text |
| `gold` | #D0AF72 | Fine lines and ornaments only |
| `ivory` | #FFF9EF | Cards and button text |

**Background:** behind every section, one fixed layer of soft Himalayan mist-blue (#DAE8F2) that warms into ivory (#FBF6EC), across the whole site (`.sky-backdrop` in `src/index.css`). Only the "Touch to begin" gate keeps its own light-blue sky.

**Typefaces:**

| Typeface | Use |
| --- | --- |
| Cormorant Garamond | Names and headings |
| Jost | Body text |
| Tiro Devanagari Sanskrit | Mantras |
| Pinyon Script | Used sparingly: a tagline, the sign-offs |

**Motion:** one language throughout, defined in `src/lib/motion.ts`: watercolour reveals, gold lines that draw themselves, gentle fade-ups and slight zoom-outs. Every animation honours `prefers-reduced-motion`, and every section plays once.

## The guest's journey

Each section has its own composition, and each hands over to the next.

| | Section | What happens |
| --- | --- | --- |
| 00 | Gate | Every time the link opens or reloads, as in the couple's design: the opening's own sunrise sky over the Himalaya (`assets.opening.sky`, framed exactly as the opening frames it, so the gate fades into the opening with the sky unchanged; its words in a deep antique gold with a soft ivory halo, to read on the clouds); "You're invited" over a small gold lotus line; the golden ॐ wax seal (`assets.omSeal`) breathing in a fine gold lotus mandala that turns once in 40s (its four diamonds keep still), a warm glow behind; and a hand in a gold circle pulsing gently over "Tap to open" and another lotus line. No names or date here. Gold dust rises; tilting the phone moves a soft shine over the seal where the browser allows it without asking. A tap simply fades the gate (400ms) into the opening — a tiny buzz, and a temple ghanti if the sound button in the corner is on (off by default). Skip goes straight to the Save the Date. The sound and Skip buttons look as the opening's own: ivory, a fine gold edge, navy. Reduced motion: nothing moves, just a 300 ms fade. |
| 00 | Opening | The couple's own picture (`assets.opening`, 852 × 1846): a sunrise sky with clouds and the Himalaya, and the two hands on their own layers (cut out with the background-removal model; the sky behind them rebuilt seamlessly). Both hands start partly off the screen — Shiva's at the upper left, reaching down; the bride's at the lower right, palm up — and glide slowly toward each other (3.8s), until their fingertips all but touch; a warm gold glow between them, then it widens, a few gold motes drift outward and both hands fade together into the sky. Only once they are gone does the card rise in, as the sunrise melts away. Skip is always shown, a reload gets a quicker version, and `?opening=full` replays the full one. |
| 01 | Save the Date | Exactly one screen (`100svh`). The card rises in piece by piece, in order of importance: "Save the Date", the names (stacked: bride, a small gold "&", groom — never cut, however long), the request, the date on one line (February · 12 · 2027) — under a "Golden Veil": a compact strip of antique-gold foil (a faint grain, a fine ivory line inside its edge, a small lotus and curl at each end, "SCRATCH TO REVEAL" in navy — `invitation.scratchHint`, Hindi too), a fingertip gliding across it a few times when the card shows; a finger or the mouse wipes it away with a soft edge (the page doesn't scroll while scratching), and once about half is gone the rest lifts off and a faint gleam of gold crosses the date. "or tap to reveal" beneath (`tapToReveal`, a real button) uncovers it at once; a screen reader reads the date all along; nothing around it moves; every visit scratches afresh — and the venue (a tap opens Google Maps directions) — 64px from the top, 12px apart, each with a soft white glow; then the painting of Mahadev blessing Maa Parvati before the snowy Himalaya, edge to edge across the foot of the screen (at least 58svh, cropped from the bottom so the crown stays in view), only its top edge fading into the sky. At the foot, on a dark-navy panel (rgba(8,24,52,.88) rising to clear): the blessing line and **View the Invitation** with a gently bobbing double arrow — a tap glides to the next section. EN / हिं switches the card to Hindi (`invitation.hindi`, remembered on the phone, shared with the switch on the couple section). Faint clouds part as the guest scrolls, the moon in Mahadev's hair glows softly, and a bell in the corner plays a soft temple dhun made in the browser — only when tapped. After 5 s of reading it glides on by itself (`invitation.autoAdvanceMs`); any touch cancels this. |
| 01→02 | Descent | "Kailash se Mandir" (`Descent.tsx`), scrubbed by the scroll and only vertical: the Save the Date's painting, in two layers (`assets.saveTheDateLayers`), drifts up — the Himalaya slowly and a little to the left, Mahadev and Maa Parvati a little faster — and fades into mist; the blessing panel melts away; three layers of soft cloud pass across at their own speeds and a few petals fall; the couple section's arch rises 60px into place, then its scene as it comes up the screen. The sky behind is one fixed layer, so there is no line between them. On arrival the bells and the two jasmine garlands (`assets.coupleGarlands`) swing once, and the welcome comes in line by line after the arch has settled. Transform and opacity only, all inside the phone on desktop. Reduced motion: none of it — the couple section simply fades in. |
| 02 | Couple | One screen in the style of the couple's chosen painting, on the site's own sky, starting right where the Save the Date ends (no gap): a carved arch in deep navy (the Blessing Wall button's colour, toned so the carving keeps its depth) hung with white flowers where its leaves were, with jasmine strings and three temple bells that sway gently (`assets.coupleArch`, `assets.coupleBells`); on the sky below the bells, the welcome (`coupleWelcome`) — "Welcome" (स्वागतम् in Hindi), "Dear {guest}," from the link (`?guest=`, `?to=` or `?name=`, max 40 characters; without one, `guest.fallbackName`), 20px with the name in bold at 26px, "you are warmly invited" (or its Hindi), the couple's names stacked, a fine gold line, the hashtag (a tap copies it and shows "Copied"), the date on one line (12 · FEBRUARY · 2027), another gold line and the full venue as a Google Maps link — rising in one by one as the section comes into view; and at the foot (`assets.coupleScene`) palms, petals, hills, a temple by the river, a diya, blue lotuses and the couple offering water to the Shivling — she in soft lavender, he in cool white (the painting's pink and cream recoloured so the section sits with the invitation's Himalayan blue) — always with at least 40px of clear sky above their heads (on a short screen they move lower). Its words follow the Save the Date's EN / हिं switch. It keeps the `#couple` id because "View the Invitation" and the auto-glide land here. |
| — | Between sections | A ripple of the Ganga (`SectionSeparator`, 72px, edge to edge): a fine wavy line in pale blue and gold with a fainter one behind, on a soft band of the site's mist so each section flows into the next; on it a small floating ornament — lotus (its petals opening and closing, just), diya (its flame flickering) or shankh, by turn — bobbing gently. Once in view the line draws from left to right (0.8s) and the ornament rises in after it; as the guest scrolls the two lines drift a little in opposite ways (±26px / ∓18px). None between the Save the Date and the couple section. Section paddings are small (`--section-gap` 1.25rem) so the ripple takes the place of empty space. Reduced motion: still. |
| 03 | Countdown | Above: शुभ मुहूर्त, "Countdown Begins", a fine gold line and the date — the eyebrow and the date in a deep antique gold (#7A561C), the date at 14px, to read on the pale sky in sunlight. Then the couple's wreath (`assets.countdownWreath`), made over for Shiv–Parvati: its travel and café icons replaced with watercolour icons in its own palette — trishul, damru, bilva patra and diya on the left, ghanti, kalash, shankh and a rudraksha mala on the right, each level with its pair — and the ring closed beneath by a leafy vine running behind the mountain and the joined hands (made by `scratchpad/wreath/compose.cjs`: old icons taken out, the vines kept). Inside it, the wedding's month as a calendar (made from the date), raised so the 28th clears the mountain's peak by 19px+; on the wedding day the watercolour blue lotus (its reds, like the wreath's pink roses, recoloured to lavender-blue for a cool palette) blooms under a white 12, clear of the 11th and 13th, breathing with a soft gold glow (2.6s). The clouds part as it appears. Under it, "Hamare vivah mein baaki hain" in the section's italic, then the row: the days large in navy turning gold, hours, minutes and seconds a little smaller; labels in English over Hindi (DAYS / दिन …), tabular digits. The first time it is seen the numbers count up from zero (1s); then each digit rolls on its own as it changes (300ms), and a small gold bead beats by the seconds. Always to 12 February 2027, 7:30 PM at the venue (IST), whatever the guest's time zone; on the day "Aaj Hamara Vivah Hai", afterwards "Shubh Vivah" — "Thank you for blessing us." EN / हिं switches its words. Reduced motion: no count-up, no roll, nothing pulses — fades only. |
| 05 | Wedding Events | "Wedding Events" and its quote above the couple's gold temple arch (`assets.eventsArch`), its blue lotuses (recoloured from pink for a cool palette), banana leaves, music and elephant all still. Inside the arch, one ceremony at a time (`events.list`: name, date, time, venue, dress code, the couple dressed for it — cut-outs in `public/art/events/` — and an optional artist credit); all sized to the arch's own width, so it fits the same on every phone. The venue is a small ivory button with a fine gold edge (pin, place, a small arrow out): a tap opens the place in Google Maps (the main venue's own `venue.mapsUrl` when set). To the next: a tap on the arch, a swipe left, or › under it (‹ or a swipe right for the one before; the arrow keys too); after the last, the first. Between the arrows, gold progress marks (the one shown a short gold bar; a tap goes straight to one), and under them "Tap the arch frame to see the events" (`events.hint`). The change (0.8s, ease-in-out; taps meanwhile are ignored): the ceremony shown fades out, its picture easing down to 97% (0.3s); a small gold ornament — a lotus bud between two tendrils — glimmers where the couple stood; the next picture fades in from 96% to 100% (0.45s) and its words rise softly in just after; the marks move at once. The words never move up or down. Reduced motion: a short crossfade, no ornament. The dates, times, venues and dress codes are SAMPLES. |
| 06 | Family | Temple bells hang from the section's top corners (fine antique-gold threads, alike on both sides; they drop in and settle with one small swing). "Two Families, One Celebration", "With Their Blessings" and its line, then a small gold lotus rule. Each family in the peacock frame (`assets.familyFrame`: gold pillars crowned with gold scrolls, a peacock on each pillar — its white made transparent, its bright yellow gold toned to the site's antique gold and the peacocks' blues and teals calmed so it sits with the palette; the copy now in the project carries the stock site's watermark, so replace it with the licensed file), its photograph (`family.sides[].photo`, 4:5) between the peacocks with an arched top and a fine gold edge, the peacocks just in front of it; then the family's name and members (relation in gold capitals, the names beneath). On a phone one above the other, a lotus rule between; from 520px side by side. A faint temple at the foot. The frame appears, then the photograph within it, then the names; the two sides take turns. |
| 07 | Gallery | A heart-shaped collage under "Moments to Remember", "Our Gallery" and the quote (26px below it): 14 photos of different sizes (5 of the 9 twice, once as a close-up) with the same thin antique-gold gap between all of them and round the edge (0.9cqw), clipped to the heart curve on a gilded mount with a faint, soft shadow, 20px from the screen's edges (up to 440px), sized in its own width units so a real phone and the desktop's phone match. Seen the first time, the tiles fly in from random edges (turned up to ±15°, 70ms apart, a little spring, ~1.4s); then the heart beats now and then, barely (a soft double beat to 1.012, every 3.2s). 3D: 900px perspective, each tile lifted 0–40px by its size (large back, small front) and drawn back to its place at rest; it tilts up to ±8° with the gyroscope (Android at once; an iPhone asks on the first tap, and until allowed — or if refused — a sideways drag tilts it), or toward the mouse in the desktop's phone. A tap opens a lightbox: the whole photo grows out of its tile onto a night-blue veil, with its caption and ‹ 2 / 9 › — a swipe sideways, the arrows or the arrow keys go through all nine photos once each; a swipe down, ×, a tap on the veil or Escape closes it back into a tile showing it (focus and scroll position kept). "Tap a photo" shows until the first tap. With more photos than tiles, every 3s one tile turns over (rotateY 180°) to one not shown — one at a time, not while the lightbox is open or the heart is tilting. Thumbnails lazy-load; the full photo loads in the lightbox. Transform and opacity (a filter for the shadows). Reduced motion or a slow phone: no tilt, turning or beat; tiles fade in where they are; the lightbox fades. |
| 08 | RSVP | On the page's own sky, as every section (no card). A gold trishul and fine rule at the top, temple bells hanging alike from the upper corners; first the invitation — "A Sacred Celebration", one line and one deep-navy button with a gold edge (as the Blessing Wall's), "JOIN THE CELEBRATION →" (the arrow steps on when pointed at). Tapped (once; more taps are ignored), the acceptance is sent (saved to the family's database when there is one); only when that succeeds does the invitation fade and "The Sacred Union" open in its place (a failure keeps the button, with the reason): a temple arch in thin antique-gold lines draws itself (pillars rising, the arch meeting at its peak, a kalash, one gleam), Mahadev holding Maa Parvati close (the couple's chosen painting, `assets.rsvpCouple`, cut out of its red ground) appears within it from 97% with a soft warm light behind, their feet melting into the sky; then "A Sacred Celebration", the blessing and "Har Har Mahadev" (`rsvp.*`), a navy "Add to calendar" button (Google Calendar or an .ics file of `wedding.dateTime` at the venue — saying exactly what happened, never that the date is saved) and an honest saved-where note. Nothing is remembered on the phone: every visit, a reload too, starts with the button. Then all is still. Reduced motion: plain fades. |
| 09 | Blessing Wall | "Blessings of the Divine Union": "With Love and Blessings", "Blessing Wall", its line and a small gold lotus rule. The first blessing on a keepsake scroll laid across the page — warm-ivory paper with a faint texture between two slim rolled edges (gold-capped), a small seal at its head after Ardhanarishvara (a fine gold circle halved by a line: his crescent moon on one side, her lotus on the other, a bindu where they meet), an oversized opening quotation mark, the words in italic serif and the sender in small gold capitals. The next two as editorial blocks, unboxed — one set left, one right — joined by a thin gold curve through a small gold lotus. "View all wishes →" (a gold underline that fills on hover, the arrow stepping on) opens them all in the sheet. "Leave a Blessing" on the page itself (no card): a tiny gold lotus, the heading, a clean box with a fine gold edge (gold-ink when writing, red when amiss, with its placeholder, counter and who it is signed by) and a deep-navy "OFFER YOUR BLESSING →" with a gold edge (as the RSVP's buttons). Only once a wish is saved does the form give way to a gold lotus drawing itself and "Your blessing joins their journey of love." (and where it was kept); the new blessing takes the scroll; a failure keeps the words. In order, once: the heading, the scroll unrolling from its middle and its words fading in, the two blocks a beat apart as the gold curve draws itself, then "View all wishes". Reduced motion: plain fades. |
| 10 | Finding Your Way | On the page's own sky: navy words, gold capitals, few boxes. The Wedding Destination: the real Google map (its roads, labels, pin and own links left clear — it starts below the arch's curve) set in a temple arch with a fine antique-gold edge and a finer line just outside, a small lotus above its peak and a faint Himalayan range behind; then "The Wedding Destination", the venue's name in navy serif, its address, the date and time in gold capitals and "FIND YOUR WAY" (navy, gold edge, a small compass that turns a little on hover, a soft ripple where pressed) to the directions. A Sacred Journey: by air, rail, road (`travel.points`) as editorial rows — a small line icon in a fine gold ring, the gold label, the place, distance and time on one line, a chevron — a fine gold line between rows; a tap, click, Enter or Space opens a row's detail. A curved gold route runs behind the icons only (never under the words), drawn in pixels and redrawn as rows open. A tip chip: pickup details come on WhatsApp. Blessed Stays (a small bilva leaf): cards to swipe across (no scrollbar) — a photo in an arch (or a soft painted one), name, distance, a line, Call (when there is a number) and Map; the first stay the family hosts is marked "Hosted by family" in a gold edge. Then the point of contact with WhatsApp (when there is a number). As it is reached: the map fades in, the route draws, the icons follow a beat apart. Buttons are at least 48px tall. All of `travel` is SAMPLE until checked. |
| 10½ | Contact & Assistance | Between the venue and the thank-you: "Here for You", "Contact & Assistance", one line and a small gold lotus rule. The two families (`contact.family`) side by side from 520px, one above the other on a phone — each under a fine gold temple arch on a soft cream ground (no box): the side in gold capitals, the name in navy serif, the relationship in small gold capitals and a deep-navy "Call" in place of the number. Then a gold rule drawing out from a lotus and "Wedding Coordination" with one line: two compact rows (`contact.coordinators`) — role in gold capitals, name and a round navy call button — a fine gold line between them. A call button dials its number (tel:, labelled for screen readers); with no number yet it only says "Number coming soon". The names and relations are SAMPLE (Ankit and Shreya as in the family section; the coordinators made up) and every number is still to be filled in. Reduced motion: plain fades. |
| 11 | Thank You | A gold halo draws slowly around Shiv–Parvati, with ॐ नमः शिवाय. |
| 12 | Love Note | An envelope opens and the note rises. |

## Artwork and credits

- **Opening** (`public/art/opening/`): the sunrise sky and the two hands, layered from the couple's own picture: the hands cut out with the background-removal model, the sky behind them rebuilt from the picture's own clouds, and the screenshot's status bar, Skip button and corners painted out. If the picture is someone's artwork, add their credit in `credits.openingHands`; it shows at the end of the page.
- **Your two illustrations** (`art-source/`): the couple at the Shivling and Shiv–Parvati seated. They are small (245×435), so larger originals would look sharper on phones. The couple illustration's cut edges were feathered into a white watercolour vignette.
- **Generated art:** the Ganpati line drawing, the countdown arch, all gold icons, the clouds and the watercolour mask were all made for this site.

## Build phases

- [x] 1. Global shell: fonts, tokens, guest context, breakpoints, desktop phone mockup
- [x] 2. Opening animation + Skip
- [x] 3. Invitation
- [x] 4. Couple / Hero
- [x] 5. Countdown
- [x] 6. Our Story (later removed, at the couple's request)
- [x] 7. Events
- [x] 8. Family
- [x] 9. Gallery
- [x] 10. RSVP
- [x] 11. Blessing Wall
- [x] 12. Venue & Travel
- [x] 13. Thank You + Final Love Notice
- [x] 14. Final pass: section spacing, reduced-motion check, small-phone check, link-preview image, favicon, sharing tags
