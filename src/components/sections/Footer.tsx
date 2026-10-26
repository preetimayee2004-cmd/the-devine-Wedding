import { useRef, type CSSProperties, type MouseEvent } from "react";
import { wedding } from "@/config/wedding";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

/**
 * The footer — the invitation's last page, small and quiet: on the page's own ivory, a soft golden
 * glow at the middle, a few faint bel leaves at the edges and barely-there gold flower scrolls in two
 * corners. A blessing in italic navy serif; "॥ हर हर महादेव ॥" in antique gold; a small emblem — a
 * fine gold trishul over a tiny lotus within a delicate mandala; the couple's initials, "P ♡ S"; and
 * "Back to Top ↑", gliding back to the start of the invitation.
 *
 * Once, as it is reached: the blessing fades up, then the mantra, the emblem softly appears, the
 * initials one by one; the link last. Reduced motion: plain fades, and the way back up is instant.
 */

/** Faint bel leaves at the outer edges: where (% of the footer), size (px), turn (deg), opacity. */
const BEL = [
  [3, 10, 26, -25, 0.16],
  [90, 6, 22, 30, 0.14],
  [1, 58, 22, 20, 0.13],
  [91, 52, 26, -35, 0.16],
  [8, 84, 18, 45, 0.12],
  [86, 86, 20, -15, 0.12],
] as const;

/** The mandala's sixteen petals, between its two rings. */
const PETALS = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);
/** Its eight beads, on the outer ring. */
const BEADS = Array.from({ length: 8 }, (_, i) => {
  const a = ((i + 0.5) / 8) * Math.PI * 2;
  return [60 + 56 * Math.sin(a), 60 - 56 * Math.cos(a)] as const;
});

const at = (ms: number) => ({ "--at": `${ms}ms` }) as CSSProperties;

export function Footer() {
  const { footer: copy, couple, credits } = wedding;
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { threshold: 0.3 });
  const reduced = usePrefersReducedMotion();
  const initial = (name: string) => name.trim().charAt(0).toUpperCase();

  const toTop = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <footer
      id="closing"
      ref={ref}
      aria-label="Closing blessing"
      className="cf"
      data-shown={seen || undefined}
      data-still={reduced || undefined}
    >
      {/* the background: a soft golden glow, faint bel leaves, barely-there flower scrolls */}
      <span aria-hidden className="cf-glow" />
      <div aria-hidden className="cf-field">
        {BEL.map(([x, y, size, turn, o], i) => (
          <svg
            key={i}
            viewBox="0 0 40 40"
            className="cf-bel"
            style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, rotate: `${turn}deg`, opacity: o }}
          >
            <path d="M20 22V38" fill="none" />
            <path d="M20 22C11.5 18 11 7 20 1 29 7 28.5 18 20 22Z" />
            <path d="M20 22C14 28.5 3 27.5 0.8 19 7 12 17 13.5 20 22Z" />
            <path d="M20 22C26 28.5 37 27.5 39.2 19 33 12 23 13.5 20 22Z" />
          </svg>
        ))}
        <FlowerScroll className="cf-scroll cf-scroll-top" />
        <FlowerScroll className="cf-scroll cf-scroll-bottom" />
      </div>

      <p className="cf-blessing cf-in" style={at(0)}>
        {copy.blessing}
      </p>
      <p className="cf-mantra cf-in" lang="sa" style={at(250)}>
        {copy.mantra}
      </p>

      <Emblem />

      <p className="cf-initials">
        <span className="sr-only">
          {couple.bride.displayName} and {couple.groom.displayName}
        </span>
        <span aria-hidden className="cf-in" style={at(900)}>
          {initial(couple.bride.displayName)}
        </span>
        <svg aria-hidden viewBox="0 0 24 22" className="cf-heart cf-in" style={at(1050)}>
          <path d="M12 19.6C6.2 15.4 2.6 12 2.6 8.2 2.6 5.5 4.7 3.4 7.3 3.4 9.2 3.4 10.9 4.4 12 6 13.1 4.4 14.8 3.4 16.7 3.4 19.3 3.4 21.4 5.5 21.4 8.2 21.4 12 17.8 15.4 12 19.6Z" />
        </svg>
        <span aria-hidden className="cf-in" style={at(1200)}>
          {initial(couple.groom.displayName)}
        </span>
      </p>

      <a href="#invitation" className="cf-top cf-in" style={at(1450)} onClick={toTop}>
        <span className="cf-top-text">{copy.backToTop}</span>
        <span aria-hidden className="cf-top-arrow">
          ↑
        </span>
      </a>

      {credits.openingHands && <p className="mt-4 font-sans text-[10px] tracking-wide text-navy/55">{credits.openingHands}</p>}
    </footer>
  );
}

/** The emblem: a fine gold trishul over a tiny lotus, within a delicate mandala. */
function Emblem() {
  return (
    <svg aria-hidden viewBox="0 0 120 120" className="cf-emblem" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* the mandala: two fine rings, sixteen petals between them, eight beads */}
      <circle cx="60" cy="60" r="56" stroke="#b89554" strokeWidth="0.7" opacity="0.75" />
      <circle cx="60" cy="60" r="47" stroke="#c9a45c" strokeWidth="0.5" opacity="0.6" />
      <g stroke="#c9a45c" strokeWidth="0.55" opacity="0.65">
        {PETALS.map((a) => (
          <path key={a} d="M60 7.6C58 9.6 57.6 12 60 14.8 62.4 12 62 9.6 60 7.6Z" transform={`rotate(${a} 60 60)`} />
        ))}
      </g>
      <g fill="#b89554">
        {BEADS.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" />
        ))}
      </g>
      {/* the trishul: the middle blade, the two curving prongs, the binding, the shaft */}
      <g stroke="#9c7333" strokeWidth="1.2">
        <path d="M60 25 56.6 36 60 46.5 63.4 36Z" fill="#e2c27a" fillOpacity="0.45" />
        <path d="M60 46.5V84" />
        <path d="M60 49.5C51.5 49.5 47.4 43.6 48 34M60 49.5C68.5 49.5 72.6 43.6 72 34" />
        <path d="M45.6 36.4 48 28.6 50.4 36ZM74.4 36.4 72 28.6 69.6 36Z" fill="#e2c27a" fillOpacity="0.45" />
        <path d="M56.2 54H63.8M56.8 57.2H63.2" strokeWidth="1" />
      </g>
      {/* the tiny lotus beneath it */}
      <g fill="#ecd49c" fillOpacity="0.7" stroke="#a8741f" strokeWidth="0.75">
        <path d="M60 96C57.8 92.8 57.8 89.2 60 85.6 62.2 89.2 62.2 92.8 60 96Z" />
        <path d="M60 96C56 95.5 53 93.2 52.3 89.6 56 90 58.8 92.4 60 96Z" />
        <path d="M60 96C64 95.5 67 93.2 67.7 89.6 64 90 61.2 92.4 60 96Z" />
      </g>
      <path d="M54.2 98H65.8" stroke="#a8741f" strokeWidth="0.75" />
    </svg>
  );
}

/** A barely-visible gold flower scroll for a corner: a curling vine with small five-petal flowers. */
function FlowerScroll({ className }: { className: string }) {
  const flower = (x: number, y: number, r: number) =>
    [0, 72, 144, 216, 288].map((a) => (
      <ellipse key={`${x}-${a}`} cx={x} cy={y - r} rx={r * 0.45} ry={r * 0.8} transform={`rotate(${a} ${x} ${y})`} />
    ));
  return (
    <svg aria-hidden viewBox="0 0 120 80" className={className} fill="none">
      <path d="M2 78C10 52 30 34 56 30 76 27 92 34 96 46 99 56 92 62 84 60 77 58 77 50 83 48" />
      <path d="M30 46C26 38 28 30 36 26M58 30C58 20 64 12 74 10M14 64C8 60 6 54 8 48" />
      <g>
        {flower(36, 26, 4)}
        {flower(74, 10, 4.5)}
        {flower(8, 48, 3.5)}
      </g>
    </svg>
  );
}
