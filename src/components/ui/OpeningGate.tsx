import { useEffect, useRef, useState, type KeyboardEvent } from "react";

interface OpeningGateProps {
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
 * Before the opening, on a guest's first visit: a soft sky, a golden ॐ that
 * breathes, and "Touch to begin". A tap anywhere sends a golden ripple out
 * from the ॐ, the ॐ swells and fades, the phone gives a tiny buzz, and the
 * gate melts away as the hands begin. Skip goes straight to the card.
 * Only transform and opacity move; reduced motion gets a plain fade.
 */
export function OpeningGate({ label, devanagari = false, reduced, onBegin, onSkip, onGone }: OpeningGateProps) {
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
        {/* the golden ripple that spreads out from the ॐ on the tap */}
        {!reduced && <span aria-hidden className="gate-ripple" data-go={tapped || undefined} />}
        {/* soft light behind the ॐ, breathing */}
        <span aria-hidden className="gate-glow" data-still={reduced || undefined} data-go={tapped || undefined} />
        {/* the outer layer swells and fades on the tap; the inner one breathes */}
        <span aria-hidden className="gate-om-go" data-go={tapped || undefined}>
          <span lang="sa" className="gate-om font-deva" data-still={reduced || undefined}>
            ॐ
          </span>
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
