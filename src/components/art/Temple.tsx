import type { CSSProperties } from "react";

/**
 * Temple ornaments shared by the sections: the hanging bells and a temple's silhouette.
 *
 * The bells are the couple arch's own, hung alike from the top corners of whatever holds them (it
 * must be positioned) on fine antique-gold threads, the outermost longest: which bell, how far in
 * from its side, how far down it hangs (to its foot) and how wide it is (px).
 */
const BELLS = [
  { src: "/art/couple-bell-1.webp", ratio: 148 / 93, at: 16, drop: 58, w: 14 },
  { src: "/art/couple-bell-2.webp", ratio: 204 / 100, at: 33, drop: 40, w: 12 },
  { src: "/art/couple-bell-3.webp", ratio: 148 / 94, at: 49, drop: 24, w: 11 },
] as const;

/**
 * The bells, the same on each side. Their holder sets `data-bells`: "hidden" before they come in,
 * "in" to drop them in (each settles with one small swing toward the middle), "still" to simply
 * fade them in — see `.temple-bell` in index.css.
 */
export function TempleBells({ className = "" }: { className?: string }) {
  return (
    <>
      {(["left", "right"] as const).map((side) =>
        BELLS.map((b, i) => (
          <span
            key={`${side}${i}`}
            aria-hidden
            className={`temple-bell ${className}`}
            style={{ [side]: b.at, width: b.w, height: b.drop, "--i": i, "--dir": side === "left" ? 1 : -1 } as CSSProperties}
          >
            <img src={b.src} alt="" width={b.w} height={Math.round(b.w * b.ratio)} draggable={false} />
          </span>
        )),
      )}
    </>
  );
}

/** A temple's silhouette in `currentColor`: a hall, the main tower (its doorway open), a small shrine. */
export function TempleSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 90" className={className} fill="currentColor">
      {/* the plinth, the hall, the main tower with its amalaka, kalash and flag, a small shrine */}
      <path d="M8 84h112v6H8z" />
      <path d="M34 84V66q0-6 6-11 5-4 8-7 3 3 8 7 6 5 6 11v18z" />
      <path fillRule="evenodd" d="M60 84V52q0-11 6-21 5-9 12-17 7 8 12 17 6 10 6 21v32zM74 84v-9q4-5 8 0v9z" />
      <ellipse cx="78" cy="13.4" rx="4.4" ry="1.9" />
      <path d="M77.3 11.6V4h1.4v7.6z" />
      <path d="M78.6 4.2 85 6.4l-6.4 2.2z" />
      <path d="M98 84V68q0-5 4.5-9 2.5-2.4 3.5-4.4 1 2 3.5 4.4 4.5 4 4.5 9v16z" />
    </svg>
  );
}

/**
 * A small temple group in `currentColor`, its tallest spire at the outer edge (mirror it for the other
 * corner): on a plinth, a Nagara shikhara — its tiers marked, an amalaka, a kalash and a flag — with a
 * small spire at its outer side; a hall beside it under a stepped roof, its doorway open; and a domed
 * shrine. One path, so where parts meet the colour never doubles.
 */
export function TempleGroup({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 140 100" className={className} fill="currentColor">
      <path
        fillRule="evenodd"
        d={[
          // the ground and the plinth
          "M0 92H140V100H0Z",
          "M2 88H136V92H2Z",
          // the shikhara, its tiers marked by three fine lines across it
          "M24 88C24 70 28 48 40 32H48C60 48 64 70 64 88Z",
          "M25.3 74H62.7V74.8H25.3Z",
          "M27.2 61H60.8V61.8H27.2Z",
          "M31 48H57V48.8H31Z",
          // its amalaka, neck, kalash and flag
          "M37 30.4C37 28.6 40 27.6 44 27.6S51 28.6 51 30.4 48 33.2 44 33.2 37 32.2 37 30.4Z",
          "M42 27.6V25.4H46V27.6Z",
          "M44 25.4C42.4 25.4 41.6 24.4 41.6 23.2S42.6 21 44 21 46.4 21.9 46.4 23.2 45.6 25.4 44 25.4Z",
          "M43.5 21V5.5H44.5V21Z",
          "M44.5 5.5 55 8.6 44.5 11.8Z",
          // the small spire at its outer side, with its little amalaka
          "M12 88C12 79 14 70 18 64H21C25 70 24 80 24 88Z",
          "M16.6 63.8C16.6 62.9 17.9 62.4 19.5 62.4S22.4 62.9 22.4 63.8 21.1 65 19.5 65 16.6 64.7 16.6 63.8Z",
          // the hall under its stepped roof, a doorway open in it
          "M64 88V71H98V88Z",
          "M76 88V80.5A5 5 0 0 1 86 80.5V88Z",
          "M62 71 67.5 65.5H94.5L100 71Z",
          "M67.5 65.5 72 61H90L94.5 65.5Z",
          "M72 61 76.5 57H85.5L90 61Z",
          "M78 57C78 55.8 79.4 55.2 81 55.2S84 55.8 84 57Z",
          "M80.5 55.2V51H81.5V55.2Z",
          // the domed shrine, its door open
          "M104 88V75H126V88Z",
          "M111 88V82.5A4 4 0 0 1 119 82.5V88Z",
          "M102 75C102 65 107.5 58.5 115 56.5 122.5 58.5 128 65 128 75Z",
          "M114.5 56.5V50H115.5V56.5Z",
          "M115 50.8C114 50.8 113.4 50.2 113.4 49.4S114 48 115 48 116.6 48.6 116.6 49.4 116 50.8 115 50.8Z",
        ].join("")}
      />
    </svg>
  );
}
