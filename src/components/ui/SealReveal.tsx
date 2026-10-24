import { useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * The wedding date, kept under a small gold seal until the guest opens it.
 *
 * A delicate seal — a fine gold ring with a tiny lotus at its heart, in the hero's own gold — with
 * "Reveal your wedding date" beneath it and, smaller, "Tap the sacred seal to begin". When the card
 * shows it, the seal's outer ring draws itself once. One tap (anywhere on the seal or its words — a
 * large, forgiving target; Enter or Space too) presses it in a little; a soft gold light opens from it
 * and fades, and the date (its children, in the hero's serif) rises gently into its place. The seal
 * and the date share one box, so nothing around them moves. The date is announced to screen readers
 * when it appears. Every visit opens it afresh. Reduced motion: a short crossfade, no light.
 */
export function SealReveal({
  title,
  note,
  shown,
  delay,
  reduced,
  children,
}: {
  title: string;
  note: string;
  /** The card is showing (the seal's ring draws from then, after `delay` ms). */
  shown: boolean;
  delay: number;
  reduced: boolean;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<"closed" | "pressing" | "open">("closed");
  const timer = useRef(0);
  const open = phase === "open";

  const reveal = () => {
    if (phase !== "closed") return;
    if (reduced) return setPhase("open");
    setPhase("pressing");
    timer.current = window.setTimeout(() => setPhase("open"), 180);
  };

  return (
    <div
      className="seal-reveal"
      data-shown={shown || undefined}
      data-phase={phase}
      data-still={reduced || undefined}
      style={{ "--seal-at": `${delay}ms` } as CSSProperties}
    >
      <button type="button" className="seal-button" onClick={reveal} disabled={open} aria-hidden={open || undefined} tabIndex={open ? -1 : 0}>
        <svg aria-hidden viewBox="0 0 40 40" className="seal-mark" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* the outer ring, which draws itself once; a finer ring inside it */}
          <circle className="seal-ring" cx="20" cy="20" r="18.4" pathLength={1} transform="rotate(-90 20 20)" />
          <circle className="seal-ring-fine" cx="20" cy="20" r="15.6" />
          {/* the lotus at its heart */}
          <g className="seal-lotus">
            <path d="M20 27C17.8 24 17.8 19.6 20 15.4 22.2 19.6 22.2 24 20 27Z" />
            <path d="M20 27C16.6 26.4 14 23.8 13.4 20.3 16.8 20.9 19.2 23.4 20 27Z" />
            <path d="M20 27C23.4 26.4 26 23.8 26.6 20.3 23.2 20.9 20.8 23.4 20 27Z" />
            <path d="M15.6 28.6H24.4" fill="none" />
          </g>
        </svg>
        <span className="seal-title">{title}</span>
        <span className="seal-note">{note}</span>
      </button>
      <span aria-hidden className="seal-light" />
      <div className="seal-date" aria-live="polite" aria-hidden={!open || undefined}>
        {open && children}
      </div>
    </div>
  );
}
