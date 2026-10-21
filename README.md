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
| under 768px (phones) | The site, full-bleed |
| 768–1023px (tablets) | The site in a centred column on the same sky |
| 1024px+ with a mouse | The phone site, live inside an iPhone 17 Pro Max mockup floating in the sky |

## Design

**Colours:**

| Token | Colour | Use |
| --- | --- | --- |
| `navy` | #173B56 | Every heading and name |
| `gold-ink` | #8A642F | Gold text: mantras, dates, labels, signatures |
| `slate` | #3D5A73 | Body text |
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
| 00 | Opening | Shiva's and Parvati's hands meet in a gold glow; Shiv–Parvati paint in; the glow becomes the Om emblem. Skip is always shown, a reload gets a short version, and `?opening=full` replays the full one. |
| 01 | Invitation | The emblem opens into a ring where Ganpati draws himself; mantra, blessing, "Dear {guest}", names and date follow. After 5 s of reading it glides to the couple (`invitation.autoAdvanceMs`); any touch cancels this. |
| 02 | Couple | The gold thread arrives; the couple at the Shivling paints in like watercolour and settles on a cloud; then names and the Lagna card. |
| 03 | Countdown | The cloud parts; a gold temple arch draws down from Shiva's crescent; live time to the muhurat at the venue. On the day it reads "Today Is the Day", afterwards "Happily Married". |
| 04 | Our Story | A golden path winds between the moments and draws with the scroll, ending in a kalash. |
| 05 | Events | The kalash ties on a twisted gold "sacred thread"; each ceremony hangs from it as a medallion, grouped by day. |
| 06 | Family | The thread parts into two gold arches that draw themselves, one per family. |
| 07 | Gallery | The arch becomes the large frame; a lightbox opens the real photos (swipe or arrow keys). |
| 08 | RSVP | One button: Accept with Joy. It becomes a gold seal, then shows a personal message, Add to Calendar (Google or .ics) and an honest saved-where note. |
| 09 | Blessing Wall | Exactly three featured wishes, View All Wishes, one box and one button. Wishes are cleaned and checked; only a successful send plays the keepsake; a failure keeps the words. |
| 10 | Venue & Travel | The lotus becomes a location marker; a route connects the venue (map and directions), travel and stay panels. |
| 11 | Thank You | A gold halo draws slowly around Shiv–Parvati, with ॐ नमः शिवाय. |
| 12 | Love Note | An envelope opens, the note rises, and the sky settles back to pale blue. |

## Artwork and credits

- **Opening hands** (`public/art/opening/`): cut from the supplied painting `art-source/hands-night-ArtistAdarsh.webp`. Its night sky was removed so the hands sit on the sky, Shiva's forearm was traced back in, and a petal was painted out. The painting is marked "ArtistAdarsh — All Rights Reserved", so a credit is shown (`credits.openingHands`). Please get the artist's permission before sharing publicly.
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
