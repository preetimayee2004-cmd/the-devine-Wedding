# Preeti & Shivashish: a Shiv–Parvati wedding invitation

A mobile-first wedding invitation (React + TypeScript + Vite + Tailwind CSS), shared as a WhatsApp link.

```bash
npm install
npm run dev        # http://localhost:8090
npm run build      # type-check + production build into dist/
```

## Editing the content

Everything a family changes (names, date, venue, artwork, credits, link-preview text) lives in **`src/config/wedding.ts`**. Values marked `SAMPLE` are stand-ins until they're confirmed.

### Personalised links

Add the guest's name to the link and the site greets them by name:

```
https://<site>/?guest=Ananya        (also ?to= or ?name=)
```

With no name it falls back to "Guest".

## How it looks on each screen

| Width | What guests see |
| --- | --- |
| under 768px (phones) | The site, full-bleed |
| 768–1023px (tablets) | The site in a centred column on the same sky |
| 1024px+ with a mouse | The phone site, live inside an iPhone 17 Pro Max mockup floating in the sky |

## Design tokens

| Token | Colour | Use |
| --- | --- | --- |
| `navy` | #173B56 | Every main heading and the couple's names |
| `gold-ink` | #8A642F | Supporting text in gold: mantra, date, labels, signature |
| `slate` | #3D5A73 | Body text |
| `gold` | #D0AF72 | Fine lines and ornaments only, never text |
| `ivory` | #FFF9EF | Cards, text on navy buttons |

The supplied sky image (`public/art/sky.jpg`) sits behind every section as one fixed layer.

Typefaces are Cormorant Garamond for names and headings, Jost for body text, Tiro Devanagari Sanskrit for mantras, and Pinyon Script, used sparingly.

## The opening (Section 00)

`src/components/opening/Preloader.tsx`:

1. Shiva's and Parvati's hands glide in from opposite corners.
2. They clasp, and a gold glow blooms where they meet.
3. The view pulls back, and the seated Shiv–Parvati paint in through a watercolour bloom.
4. The glow condenses into the gold Om emblem, which settles at the top of the invitation.

It runs for about 4.5 seconds and never blocks the guest:

- **Skip** is always there.
- A reload in the same visit gets a short version.
- `prefers-reduced-motion` shows a still frame.

The hand layers in `public/art/opening/` were cut from `art-source/hands-night-ArtistAdarsh.webp`. That's the full painting with its night sky removed so the hands sit on the sky, Shiva's forearm traced back in, and a petal painted out. The painting is marked "ArtistAdarsh — All Rights Reserved", so the opening shows a credit (`credits.openingHands`). Please get the artist's permission before sharing the site publicly.

## Build phases

- [x] 1. Global shell: fonts, tokens, guest context, breakpoints, desktop phone mockup
- [x] 2. Opening animation + Skip
- [ ] 3. Invitation
- [ ] 4. Couple / Hero
- [ ] 5. Countdown
- [ ] 6. Our Story
- [ ] 7. Events
- [ ] 8. Family
- [ ] 9. Gallery
- [ ] 10. RSVP
- [ ] 11. Blessing Wall
- [ ] 12. Venue & Travel
- [ ] 13. Thank You + Final Love Notice
- [ ] 14. Final pass: spacing, performance, Open Graph image
