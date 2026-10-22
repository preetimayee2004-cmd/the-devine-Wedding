# Preeti & Shivashish: a Shiv–Parvati wedding invitation

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
| `story.moments` | Your own moments, dates, words and photos. |
| `events.list` | The final ceremony schedule (times are at the venue). |
| `family.sides` | Real names, relations and family photos. |
| `gallery.photos` | Your photos. The first one is the large frame. |
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

**Without a database (default).** RSVPs and wishes are kept on each guest's own phone, and the wording says so honestly ("saved on your phone"). If `rsvp.whatsapp` is set, the RSVP offers "Tell the family on WhatsApp".

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
| wider, touch (tablets) | The site in a centred column on the same sky |
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

**Sky:** the supplied sky image sits behind every section as one fixed layer.

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
| 00 | Gate | Once per browser session (`sessionStorage dw:gate-seen`; always with `?opening=full`): a soft sky with a faint Mount Kailash at its foot and clouds drifting slowly by (60s); "You're invited"; the golden ॐ wax seal (`assets.omSeal`) breathing in a thin gold mandala that turns once in 40s, with a warm glow behind; the couple's names and the date; and "Touch to begin", with a little hand tapping the seal's lower right rim. Gold dust rises and a few marigold petals drift down; tilting the phone moves a soft shine over the seal where the browser allows it without asking. A tap (about 1.2s): a tiny buzz (and a temple ghanti if the sound in the corner is on — off by default), the ॐ flashes, the seal cracks down the middle and parts on a burst of golden light, a golden ripple crosses the screen, and the gate fades into the opening. Skip goes straight to the Save the Date. Reduced motion: nothing moves, just a 300 ms fade. |
| 00 | Opening | Both hands start partly off the screen — Shiva's at the upper left, palm down; the bride's at the lower right, palm up — and glide slowly to the centre, where Shiva's hand settles over hers and rests (a soft contact shadow, a warm gold glow). The hands are the painted artwork, only moved and faded, never stretched or redrawn. Then the glow widens, a few gold motes drift outward and both hands fade together into the sky. Skip is always shown, a reload gets a quicker version, and `?opening=full` replays the full one. |
| 01 | Save the Date | Exactly one screen (`100svh`). The card rises in piece by piece, in order of importance: "Save the Date", the names (stacked: bride, a small gold "&", groom — never cut, however long), the request, the date on one line (February · 12 · 2027) and the venue (a tap opens Google Maps directions) — 64px from the top, 12px apart, each with a soft white glow; then the painting of Mahadev blessing Maa Parvati before the snowy Himalaya, edge to edge across the foot of the screen (at least 58svh, cropped from the bottom so the crown stays in view), only its top edge fading into the sky. At the foot, on a dark-navy panel (rgba(8,24,52,.88) rising to clear): the blessing line and **View the Invitation** with a gently bobbing double arrow — a tap glides to the next section. EN / हिं switches the card to Hindi (`invitation.hindi`, remembered on the phone, shared with the switch on the couple section). Faint clouds part as the guest scrolls, the moon in Mahadev's hair glows softly, and a bell in the corner plays a soft temple dhun made in the browser — only when tapped. After 5 s of reading it glides on by itself (`invitation.autoAdvanceMs`); any touch cancels this. |
| 02 | Couple | One screen in the style of the couple's chosen painting, on the site's own sky, starting right where the Save the Date ends (no gap): a carved arch in the gold of Parvati's saree, with jasmine strings and three temple bells that sway gently (`assets.coupleArch`, `assets.coupleBells`), and the EN / हिं switch on its top left corner; on the sky below the bells, the welcome (`coupleWelcome`) — "Welcome" (स्वागतम् in Hindi), "Dear {guest}," from the link (`?guest=`, max 40 characters, else "Family & Friends"), "you are warmly invited" (or its Hindi), the couple's names stacked, a fine gold line, the hashtag (a tap copies it and shows "Copied"), the date on one line (12 · FEBRUARY · 2027), another gold line and the full venue as a Google Maps link — rising in one by one as the section comes into view; and at the foot (`assets.coupleScene`) palms, petals, hills, a temple by the river, a diya, lotuses and the couple offering water to the Shivling, always with at least 40px of clear sky above their heads (on a short screen they move lower), set 40px up with the marble floor reflected below; over the foot, on a dark-navy panel, **View the Invitation** glides on to the countdown. It keeps the `#couple` id because "View the Invitation" and the auto-glide land here. |
| 03 | Countdown | The clouds part; inside the couple's wreath (`assets.countdownWreath` — flowering vines threaded with their little things, a watercolour mountain and the joined hands at its foot): शुभ मुहूर्त, the title, a fine gold line with a diamond, the date line and the live time to the muhurat at the venue in old-style figures with faint gold dividers. On the day it reads "Today Is the Day", afterwards "Happily Married". |
| 04 | Our Story | "A Love Written in the Stars" on the site's sky: ✦ Under the same sky ✦, the title, a line of subtitle and a gold flourish, then four milestones (`story.moments` — **placeholders**: each one's year, line and photo, marked in the config), each a photo in a cream polaroid with its title, year and line. On a phone the cards alternate left and right and a fine gold constellation runs down behind them through a star beside each; from 768px they stand in a row over a dotted line through four stars. Faint around it: Mahadev's crescent, slow clouds, small constellations and Kailash drawn in gold at the foot, under a double arrow on to the ceremonies. Once only: the heading fades in, the line draws (on a phone, on to each card as it arrives) and each star glows as it's reached, the cards rise 18px, 140ms apart; afterwards a rare twinkle. EN / हिं switches all of its words. Reduced motion: all as finished, in a 200ms fade. |
| 05 | Events | The kalash ties on a twisted gold "sacred thread"; each ceremony hangs from it as a medallion, grouped by day. |
| 06 | Family | The thread parts into two gold arches that draw themselves, one per family. |
| 07 | Gallery | The arch becomes the large frame; a lightbox opens the real photos (swipe or arrow keys). |
| 08 | RSVP | One button: Accept with Joy. It becomes a gold seal, then shows a personal message, Add to Calendar (Google or .ics) and an honest saved-where note. |
| 09 | Blessing Wall | Exactly three featured wishes, View All Wishes, one box and one button. Wishes are cleaned and checked; only a successful send plays the keepsake; a failure keeps the words. |
| 10 | Venue & Travel | The lotus becomes a location marker; a route connects the venue (map and directions), travel and stay panels. |
| 11 | Thank You | A gold halo draws slowly around Shiv–Parvati, with ॐ नमः शिवाय. |
| 12 | Love Note | An envelope opens, the note rises, and the sky settles back to pale blue. |

## Artwork and credits

- **Opening hands** (`public/art/opening/`): cut from the supplied painting `art-source/hands-reaching.webp`. Its black background was removed so the hands sit on the sky, and the two hands were separated so each can arrive from its own side. Their gold line art is traced from the same cut-outs: the outlines are SVG paths in `src/components/art/handLineArt.ts`, and the inner lines are the `*-sketch.webp` images. If the painting is someone's artwork, add their credit in `credits.openingHands`; it shows at the end of the page.
- **Your two illustrations** (`art-source/`): the couple at the Shivling and Shiv–Parvati seated. They are small (245×435), so larger originals would look sharper on phones. The couple illustration's cut edges were feathered into a white watercolour vignette.
- **Generated art:** the Ganpati line drawing, the countdown arch, all gold icons, the clouds and the watercolour mask were all made for this site.

## Build phases

- [x] 1. Global shell: fonts, tokens, guest context, breakpoints, desktop phone mockup
- [x] 2. Opening animation + Skip
- [x] 3. Invitation
- [x] 4. Couple / Hero
- [x] 5. Countdown
- [x] 6. Our Story
- [x] 7. Events
- [x] 8. Family
- [x] 9. Gallery
- [x] 10. RSVP
- [x] 11. Blessing Wall
- [x] 12. Venue & Travel
- [x] 13. Thank You + Final Love Notice
- [x] 14. Final pass: section spacing, reduced-motion check, small-phone check, link-preview image, favicon, sharing tags
