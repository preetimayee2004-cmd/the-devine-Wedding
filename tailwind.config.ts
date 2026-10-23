import type { Config } from "tailwindcss";
import { EASE } from "./src/lib/motion";

/**
 * Design tokens (PRD §2 + the couple's colour choices, 21 Oct 2026).
 * Colours live as RGB channels in CSS variables (src/index.css) so Tailwind
 * opacity modifiers like `bg-ivory/70` work.
 *
 *  sky / sky-pale  the Himalayan mist-blue behind everything (it warms into ivory)
 *  navy            every main heading and the couple's names (#12294A)
 *  gold-ink        supporting text in gold: mantra, date, labels, signature (#A8741F)
 *  slate           body text (#1F3A5C)
 *  (all three are the couple section's text colours, used site-wide since 22 Oct 2026)
 *  gold            fine lines and ornaments only, never text (#D0AF72)
 *  ivory           cards and buttons' text
 */
const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: { relative: true, files: ["./index.html", "./src/**/*.{ts,tsx}"] },
  theme: {
    extend: {
      screens: {
        // Short phones (iPhone SE, or Safari with toolbars showing): tighten vertical rhythm.
        short: { raw: "(max-height: 700px)" },
      },
      colors: {
        sky: { DEFAULT: withAlpha("--sky"), pale: withAlpha("--sky-pale") },
        navy: { DEFAULT: withAlpha("--navy"), deep: withAlpha("--navy-deep") },
        slate: withAlpha("--slate"),
        gold: { DEFAULT: withAlpha("--gold"), ink: withAlpha("--gold-ink") },
        ivory: withAlpha("--ivory"),
      },
      // Four families, set once as CSS variables in src/index.css (--font-*).
      fontFamily: {
        // Names and headings: refined display serif.
        display: "var(--font-display)",
        // Body text, buttons, labels.
        sans: "var(--font-body)",
        // Sanskrit mantras and Hindi lines.
        deva: "var(--font-deva)",
        // Sparingly: a quote, the date, a sign-off.
        script: "var(--font-script)",
      },
      letterSpacing: {
        eyebrow: "0.28em",
      },
      transitionTimingFunction: EASE,
      maxWidth: {
        // Content column on tablet-width full-bleed layouts.
        column: "35rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
