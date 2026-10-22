import { useEffect, useRef, useState, type KeyboardEvent } from "react";

interface OpeningGateProps {
  /** The golden ॐ wax seal at its centre. */
  seal: string;
  /** "Touch to begin", in the card's language. */
  label: string;
  /** The label is in Hindi (set in Devanagari, without letter-spacing, which would break its joins). */
  devanagari?: boolean;
  reduced: boolean;
  /** The tap has landed: start the opening now (the gate is already fading away over it). */
  onBegin: () => void;
  /** Skip straight to the finished Save the Date. */
  onSkip: () => void;
  /** The gate has faded out and can be removed. */
  onGone: () => void;
}

// The ripple runs 700ms (in CSS); the gate starts to fade 300ms in and is gone with it.
const FADE_MS = 400;
const FADE_START_MS = 300;
const REDUCED_FADE_MS = 300;

/**
 * Before the opening, every time the link opens: a soft sky, a golden ॐ wax
 * seal that breathes, a little hand tapping it, and "Touch to begin". A tap
 * anywhere sends a golden ripple out from the seal, the seal swells and
 * fades, the phone gives a tiny buzz, and the gate melts away as the hands
 * begin. Skip goes straight to the card. Only transform and opacity move;
 * reduced motion gets a plain fade.
 */
export function OpeningGate({ seal, label, devanagari = false, reduced, onBegin, onSkip, onGone }: OpeningGateProps) {
  const [phase, setPhase] = useState<"waiting" | "opening" | "leaving">("waiting");
  const timers = useRef<number[]>([]);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    root.current?.focus({ preventScroll: true });
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const begin = () => {
    if (phase !== "waiting") return;
    try {
      navigator.vibrate?.(30);
    } catch {
      // some browsers refuse vibration — no matter
    }
    if (reduced) {
      setPhase("leaving");
      onBegin();
      later(REDUCED_FADE_MS, onGone);
      return;
    }
    setPhase("opening");
    later(FADE_START_MS, () => {
      setPhase("leaving");
      onBegin();
    });
    later(FADE_START_MS + FADE_MS, onGone);
  };

  const skip = () => {
    if (phase === "leaving") return;
    setPhase("leaving");
    onSkip();
    later(reduced ? REDUCED_FADE_MS : FADE_MS, onGone);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      begin();
    }
  };

  const tapped = phase !== "waiting";
  return (
    <div
      ref={root}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={begin}
      onKeyDown={onKey}
      className="gate fixed inset-0 z-[60] flex cursor-pointer select-none flex-col items-center justify-center outline-none"
      style={{
        opacity: phase === "leaving" ? 0 : 1,
        transition: `opacity ${reduced ? REDUCED_FADE_MS : FADE_MS}ms ease-out`,
        pointerEvents: phase === "leaving" ? "none" : undefined,
      }}
    >
      <div className="relative flex items-center justify-center">
        {/* the golden ripple that spreads out from the seal on the tap */}
        {!reduced && <span aria-hidden className="gate-ripple" data-go={tapped || undefined} />}
        {/* soft light behind the seal, breathing */}
        <span aria-hidden className="gate-glow" data-still={reduced || undefined} data-go={tapped || undefined} />
        {/* the outer layer swells and fades on the tap; the inner one breathes */}
        <span aria-hidden className="gate-seal-go" data-go={tapped || undefined}>
          <img src={seal} alt="" draggable={false} className="gate-seal" data-still={reduced || undefined} />
        </span>
        {/* a little hand tapping the seal: "touch here" (its fingertip sits at this point) */}
        <span aria-hidden className="gate-hand-at" data-go={tapped || undefined}>
          {!reduced && <span className="gate-tap-ring" />}
          <svg
            className="gate-hand"
            data-still={reduced || undefined}
            width="52"
            height="64"
            viewBox="0 0 44 54"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <path
              fill="#FFF9EF"
              d="M17 6.5a3.5 3.5 0 0 1 7 0V21a3.2 3.2 0 0 1 6 1.4a3.2 3.2 0 0 1 5.6 2a3 3 0 0 1 4.4 2.6V36c0 7-5.6 12.6-12.6 12.6h-3c-3.6 0-7-1.7-9.2-4.6l-7.6-10.2a3.2 3.2 0 0 1 5-4L17 31Z"
            />
            <path d="M24 21v7M30 22.4v6.6M35.6 24.4v6" />
          </svg>
        </span>
      </div>
      <p
        className={`gate-hint mt-6 font-medium text-navy ${devanagari ? "font-deva text-[17px]" : "font-display text-[15px] uppercase tracking-[0.32em]"}`}
        data-still={reduced || undefined}
        data-go={tapped || undefined}
      >
        {label}
      </p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
        className="fixed right-4 rounded-full border border-gold/70 bg-ivory/75 px-4 py-1.5 font-display text-[15px] font-semibold tracking-[0.08em] text-navy backdrop-blur-sm hover:bg-ivory/90"
        style={{ top: "calc(var(--status-bar) + 12px)" }}
      >
        Skip <span aria-hidden>›</span>
      </button>
    </div>
  );
}
