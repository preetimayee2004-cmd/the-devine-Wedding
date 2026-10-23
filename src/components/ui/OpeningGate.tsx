import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ringGhanti } from "@/lib/templeBells";

interface OpeningGateProps {
  /** The golden ॐ wax seal at its centre. */
  seal: string;
  /** The watercolour sky behind it all (with its trishul, crescent and misty Himalaya). */
  sky: string;
  /** "You're invited", over the seal. */
  invited: string;
  /** "Tap to open", in the card's language. */
  label: string;
  /** The words are in Hindi (set in Devanagari, without letter-spacing, which would break its joins). */
  devanagari?: boolean;
  reduced: boolean;
  /** The seal has opened and the gate is fading: start the opening now. */
  onBegin: () => void;
  /** Skip straight to the finished Save the Date. */
  onSkip: () => void;
  /** The gate has faded out and can be removed. */
  onGone: () => void;
}

// The tap simply fades the gate (400ms) as the opening's hands begin beneath it.
const FADE_MS = 400;
const REDUCED_FADE_MS = 300;

// Gold dust rising: fixed, hand-spread values (left %, size px, seconds, delay s, sideways drift px),
// so every visit looks the same and nothing is random.
const DUST = [
  [8, 4, 9, 0, 14],
  [15, 3, 11, -4, -10],
  [22, 5, 8, -2, 18],
  [30, 3, 12, -7, -14],
  [37, 4, 10, -5, 10],
  [44, 3, 9, -1, -8],
  [52, 5, 11, -6, 16],
  [58, 3, 8, -3, -12],
  [65, 4, 12, -9, 12],
  [72, 3, 10, -2, -16],
  [79, 5, 9, -6, 8],
  [86, 3, 11, -8, -10],
  [92, 4, 8, -4, 14],
  [48, 4, 13, -10, -6],
] as const;

/**
 * Before the opening, every time the link opens — as in the couple's design: a
 * watercolour sky with soft clouds, a faint trishul and the crescent above, the
 * misty Himalaya at the foot; "You're invited" over a small gold lotus line;
 * the golden ॐ wax seal, breathing, in a fine gold lotus mandala that turns
 * once in 40s, a warm glow behind it; and under it a hand in a gold circle,
 * gently pulsing, "Tap to open" and another lotus line. Gold dust rises.
 * Tilting the phone moves a soft shine across the seal (where the browser
 * allows it without asking). No names or date here.
 *
 * A tap: a tiny buzz (and a temple ghanti, if the guest turned the sound on in
 * the corner), and the gate simply fades away as the opening's hands begin
 * beneath it. Skip goes straight to the card. Only transform and opacity move;
 * reduced motion gets a plain fade.
 */
export function OpeningGate({ seal, sky, invited, label, devanagari = false, reduced, onBegin, onSkip, onGone }: OpeningGateProps) {
  const [phase, setPhase] = useState<"waiting" | "leaving">("waiting");
  const [sound, setSound] = useState(false);
  const timers = useRef<number[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const shine = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    root.current?.focus({ preventScroll: true });
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // Tilting the phone: the seal shifts a little and a soft shine slides across it. Only where the
  // browser gives the motion without asking (it would need a tap, and the tap is for the seal).
  useEffect(() => {
    if (reduced || typeof DeviceOrientationEvent === "undefined") return;
    const needsPermission =
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === "function";
    if (needsPermission) return;
    let frame = 0;
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null || frame) return;
      const x = Math.max(-1, Math.min(1, e.gamma / 30));
      const y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (tilt.current) tilt.current.style.transform = `translate3d(${x * 6}px, ${y * 6}px, 0)`;
        if (shine.current) {
          shine.current.style.transform = `translate3d(${x * 34}%, ${y * 34}%, 0)`;
          shine.current.style.opacity = "1";
        }
      });
    };
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      window.removeEventListener("deviceorientation", onTilt);
      cancelAnimationFrame(frame);
    };
  }, [reduced]);

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const begin = () => {
    if (phase !== "waiting") return;
    try {
      navigator.vibrate?.(30);
    } catch {
      // some browsers refuse vibration — no matter
    }
    if (sound) ringGhanti();
    setPhase("leaving");
    onBegin();
    later(reduced ? REDUCED_FADE_MS : FADE_MS, onGone);
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

  const still = reduced || undefined;
  const words = devanagari ? "font-deva" : "font-display font-semibold uppercase";
  return (
    <div
      ref={root}
      role="button"
      tabIndex={0}
      aria-label={`${invited}. ${label}`}
      onClick={begin}
      onKeyDown={onKey}
      className="gate fixed inset-0 z-[60] flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden outline-none"
      data-still={still}
      style={{
        opacity: phase === "leaving" ? 0 : 1,
        transition: `opacity ${reduced ? REDUCED_FADE_MS : FADE_MS}ms ease-out`,
        pointerEvents: phase === "leaving" ? "none" : undefined,
      }}
    >
      {/* the sky: watercolour clouds, a faint trishul and the crescent, the Himalaya in mist at the foot */}
      <img aria-hidden src={sky} alt="" draggable={false} className="gate-sky" />

      {/* gold dust rising */}
      {!reduced && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {DUST.map(([left, size, secs, delay, drift], i) => (
            <span
              key={i}
              className="gate-dust"
              style={{ left: `${left}%`, width: size, height: size, animationDuration: `${secs}s`, animationDelay: `${delay}s`, "--x": `${drift}px` } as CSSProperties}
            />
          ))}
        </div>
      )}

      {/* ── the invitation ── */}
      <p
        className={`gate-words gate-gold relative ${devanagari ? "font-deva text-[17px]" : `${words} text-[15px] tracking-[0.32em]`}`}
       
      >
        {invited}
      </p>
      <LotusRule className="gate-words relative mt-2.5" />

      <div className="gate-stage relative mt-4 flex items-center justify-center">
        {/* warm light behind it all */}
        <span aria-hidden className="gate-glow" data-still={still} />
        {/* the fine gold lotus mandala, turning once in 40s */}
        <svg aria-hidden className="gate-mandala" viewBox="0 0 200 200" data-still={still}>
          <Mandala />
        </svg>
        {/* its four small diamonds stay where they are, at the top, the foot and either side */}
        <svg aria-hidden className="gate-mandala gate-mandala-marks" viewBox="0 0 200 200">
          {[0, 90, 180, 270].map((deg) => (
            <path key={deg} transform={`rotate(${deg} 100 100)`} d="M100 -9l3 4.5l-3 4.5l-3-4.5Z" fill="#b08b47" opacity="0.9" />
          ))}
        </svg>

        <div ref={tilt} className="gate-tilt relative">
          <div className="gate-seal-box" data-still={still}>
            <img src={seal} alt="" draggable={false} className="gate-seal" />
            {/* a soft shine across the seal, following the phone's tilt */}
            {!reduced && (
              <span aria-hidden className="gate-shine" style={{ WebkitMaskImage: `url(${seal})`, maskImage: `url(${seal})` }}>
                <span ref={shine} />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* a hand in a gold circle, gently tapping: "tap here" */}
      <span aria-hidden className="gate-words gate-tap relative mt-6">
        {!reduced && <span className="gate-tap-ring" />}
        <svg className="gate-hand" data-still={still} viewBox="0 0 44 54" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
          <path d="M17 6.5a3.5 3.5 0 0 1 7 0V21a3.2 3.2 0 0 1 6 1.4a3.2 3.2 0 0 1 5.6 2a3 3 0 0 1 4.4 2.6V36c0 7-5.6 12.6-12.6 12.6h-3c-3.6 0-7-1.7-9.2-4.6l-7.6-10.2a3.2 3.2 0 0 1 5-4L17 31Z" />
          <path d="M24 21v7M30 22.4v6.6M35.6 24.4v6" />
        </svg>
      </span>
      <p
        className={`gate-hint gate-gold relative mt-3.5 ${devanagari ? "font-deva text-[16px]" : `${words} text-[14px] tracking-[0.3em]`}`}
        data-still={still}
       
      >
        {label}
      </p>
      <LotusRule className="gate-words relative mt-2" />

      {/* the sound of the tap: off unless the guest turns it on */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSound((on) => !on);
        }}
        aria-pressed={sound}
        aria-label={sound ? "Sound on: a temple bell rings on the tap" : "Sound off"}
        className="gate-chip fixed left-4 flex h-10 w-10 items-center justify-center rounded-full"
        style={{ top: "calc(var(--status-bar) + 12px)" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4Z" />
          {sound ? <path d="M15 9.2a4 4 0 0 1 0 5.6M17.6 7a7.2 7.2 0 0 1 0 10" /> : <path d="M15.6 9.8l4.2 4.4M19.8 9.8l-4.2 4.4" />}
        </svg>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
        className="gate-chip fixed right-4 rounded-full px-4 py-1 font-display text-[17px] font-medium italic"
        style={{ top: "calc(var(--status-bar) + 12px)" }}
      >
        Skip <span aria-hidden className="not-italic">›</span>
      </button>
    </div>
  );
}

/** A short gold line either side of a small lotus. */
function LotusRule({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`gate-gold flex items-center gap-2 ${className}`}>
      <span className="h-px w-14 bg-gradient-to-r from-transparent to-current opacity-70" />
      <svg width="16" height="10" viewBox="0 0 24 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M12 1.5c2 2 2.6 5 0 9c-2.6-4-2-7 0-9ZM12 10.5c-2-3-5-4.6-8.5-4.2c.6 3.4 4 5.4 8.5 4.2ZM12 10.5c2-3 5-4.6 8.5-4.2c-.6 3.4-4 5.4-8.5 4.2ZM5 12.5h14" />
      </svg>
      <span className="h-px w-14 bg-gradient-to-l from-transparent to-current opacity-70" />
    </span>
  );
}

/**
 * A fine gold lotus mandala: a dotted outer ring, sixteen lotus petals with a vein each and sixteen
 * smaller ones between, and a ring of beads. (Its quarter diamonds are drawn apart, so they keep still.)
 */
function Mandala() {
  const big = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <g fill="none" stroke="#b08b47" strokeWidth="0.75" strokeLinecap="round">
      <circle cx="100" cy="100" r="96" strokeDasharray="0.1 3.4" strokeWidth="1.3" opacity="0.8" />
      <circle cx="100" cy="100" r="69.5" opacity="0.5" />
      {big.map((deg) => (
        <g key={deg} transform={`rotate(${deg} 100 100)`}>
          {/* a lotus petal pointing out, from r 70 to r 91, and its vein */}
          <path d="M100 30c5-5 7.5-11 0-21c-7.5 10-5 16 0 21Z" opacity="0.9" />
          <path d="M100 28v-13" opacity="0.5" />
          {/* a smaller petal between */}
          <path transform="rotate(11.25 100 100)" d="M100 31c3-3.4 4.5-7.2 0-13c-4.5 5.8-3 9.6 0 13Z" opacity="0.55" />
          <circle cx="100" cy="6.5" r="0.9" fill="#b08b47" stroke="none" opacity="0.8" />
        </g>
      ))}
    </g>
  );
}
