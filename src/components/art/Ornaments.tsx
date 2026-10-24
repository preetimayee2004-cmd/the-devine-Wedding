/** Small antique-gold ornaments shared by the sections. */

/** A small gold lotus between two fine lines. */
export function LotusRule({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 140 14" className={`h-[14px] w-[140px] ${className}`} fill="none">
      <path d="M0 8h56M84 8h56" stroke="#b89554" strokeOpacity="0.85" strokeWidth="0.8" />
      <g fill="#e9d29a" fillOpacity="0.6" stroke="#b89554" strokeWidth="0.8" strokeLinejoin="round">
        <path d="M70 12C66 11.5 62.5 9 61.5 5.5 65.5 5.5 68.5 8 70 12Z" />
        <path d="M70 12C74 11.5 77.5 9 78.5 5.5 74.5 5.5 71.5 8 70 12Z" />
        <path d="M70 12C67.5 8.5 67.5 5 70 1.5 72.5 5 72.5 8.5 70 12Z" />
      </g>
    </svg>
  );
}

/**
 * A small gold lotus, drawn in fine line (five petals on a shallow base). Its paths take a
 * `pathLength` of 1, so a caller can draw it in by its stroke.
 */
export function Lotus({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 48 32" className={className} fill="none" stroke="#a8741f" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">
      <path pathLength={1} d="M24 26C20 20 20 11 24 4 28 11 28 20 24 26Z" fill="#e9d29a" fillOpacity="0.35" />
      <path pathLength={1} d="M24 26C18 25 13 20 12 12 18 13 22 18 24 26Z" />
      <path pathLength={1} d="M24 26C30 25 35 20 36 12 30 13 26 18 24 26Z" />
      <path pathLength={1} d="M22 26C15 27 8 24 4 19 11 18 18 21 22 26Z" />
      <path pathLength={1} d="M26 26C33 27 40 24 44 19 37 18 30 21 26 26Z" />
      <path pathLength={1} d="M14 29.5H34" />
    </svg>
  );
}
