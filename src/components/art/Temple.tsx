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
