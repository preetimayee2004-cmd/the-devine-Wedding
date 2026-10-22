import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ringGhanti } from "@/lib/templeBells";

interface OpeningGateProps {
  /** The golden ॐ wax seal at its centre. */
  seal: string;
  /** Soft clouds drifting over the sky. */
  clouds: string;
  /** "You're invited", over the seal. */
  invited: string;
  /** The couple, under the seal. */
  names: { bride: string; groom: string };
  /** The date under the names, "12 · 02 · 2027" (or null). */
  date: string | null;
  /** "Touch to begin", in the card's language. */
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

// The tap, in all about 1.2s: the ॐ flashes and the seal cracks open (800ms), then the gate fades (400ms).
const OPEN_MS = 800;
const FADE_MS = 400;
const REDUCED_FADE_MS = 300;

// Gold dust rising and marigold petals drifting down: fixed, hand-spread values (left %, size px,
// seconds, delay s, sideways drift px), so every visit looks the same and nothing is random.
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
const PETALS = [
  [12, 16, -2, 40],
  [38, 19, -9, -30],
  [66, 17, -5, 36],
  [88, 21, -13, -28],
] as const;

/**
 * Before the opening, on a first visit: a soft sky with Mount Kailash faint
 * at its foot and clouds drifting slowly by; "You're invited"; the golden ॐ
 * wax seal, breathing, in a slowly turning gold mandala with a warm glow
 * behind it; the couple's names and the date; and "Touch to begin", with a
 * little hand tapping the seal's lower edge. Gold dust rises and a few
 * marigold petals drift down. Tilting the phone moves a soft shine across the
 * seal (where the browser allows it without asking).
 *
 * A tap: a tiny buzz (and a temple ghanti, if the guest turned the sound on in
 * the corner), the ॐ flashes, the seal cracks down the middle and its halves
 * part on a burst of golden light while a golden ripple spreads over the
 * screen — then the gate fades and the hands begin. Skip goes straight to the
 * card. Only transform and opacity move; reduced motion gets a plain fade.
 */
export function OpeningGate({
  seal,
  clouds,
  invited,
  names,
  date,
  label,
  devanagari = false,
  reduced,
  onBegin,
  onSkip,
  onGone,
}: OpeningGateProps) {
  const [phase, setPhase] = useState<"waiting" | "opening" | "leaving">("waiting");
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
    if (reduced) {
      setPhase("leaving");
      onBegin();
      later(REDUCED_FADE_MS, onGone);
      return;
    }
    setPhase("opening");
    later(OPEN_MS, () => {
      setPhase("leaving");
      onBegin();
    });
    later(OPEN_MS + FADE_MS, onGone);
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

  const go = phase !== "waiting" || undefined;
  const still = reduced || undefined;
  return (
    <div
      ref={root}
      role="button"
      tabIndex={0}
      aria-label={`${invited}: ${names.bride} & ${names.groom}. ${label}`}
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
      {/* ── the sky: Mount Kailash faint at its foot, clouds drifting slowly by ── */}
      {/* pale tints of the sky (not see-through layers, so where they overlap nothing darkens) */}
      <svg aria-hidden className="gate-kailash" viewBox="0 0 400 170">
        {/* the peak, far off: a steep, rounded pyramid with its snow cap and gullies */}
        <path fill="#d2e3f1" d="M104 170l44-46 24-26 14-28c6-12 9-20 14-20s8 8 14 20l14 28 24 26 44 46Z" />
        <path fill="#f3f9fd" d="M186 70c6-12 9-20 14-20s8 8 14 20l-6 9-5-7-4 11-4-10-4 8Z" />
        <path fill="none" stroke="#eaf3fa" strokeWidth="1.4" strokeLinecap="round" d="M200 83l-2 30M192 86l-7 28M208 86l7 28" />
        {/* nearer hills */}
        <path fill="#c6dae9" d="M0 170v-42l36-16 28 10 34-18 32 20 30 16 40 10 40-10 32-18 32-16 32 14 30-10 34 12v48Z" />
      </svg>
      <img aria-hidden src={clouds} alt="" draggable={false} className="gate-cloud left-[-24%] top-[9%] w-[78%]" style={{ "--drift": "7vw" } as CSSProperties} />
      <img aria-hidden src={clouds} alt="" draggable={false} className="gate-cloud right-[-26%] top-[33%] w-[66%] [scale:-1_1]" style={{ "--drift": "-6vw", animationDelay: "-22s" } as CSSProperties} />
      <img aria-hidden src={clouds} alt="" draggable={false} className="gate-cloud bottom-[12%] left-[-12%] w-[84%] opacity-50" style={{ "--drift": "5vw", animationDelay: "-41s" } as CSSProperties} />

      {/* gold dust rising, marigold petals drifting down */}
      {!reduced && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {DUST.map(([left, size, secs, delay, drift], i) => (
            <span
              key={`d${i}`}
              className="gate-dust"
              style={{ left: `${left}%`, width: size, height: size, animationDuration: `${secs}s`, animationDelay: `${delay}s`, "--x": `${drift}px` } as CSSProperties}
            />
          ))}
          {PETALS.map(([left, secs, delay, drift], i) => (
            <span
              key={`p${i}`}
              className="gate-petal"
              style={{ left: `${left}%`, animationDuration: `${secs}s`, animationDelay: `${delay}s`, "--x": `${drift}px` } as CSSProperties}
            />
          ))}
        </div>
      )}

      {/* ── the invitation ── */}
      <p
        className={`gate-words relative text-gold-ink ${devanagari ? "font-deva text-[15px]" : "font-sans text-[12px] font-medium uppercase tracking-[0.3em]"}`}
        data-go={go}
      >
        {invited}
      </p>

      <div className="gate-stage relative mt-1 flex items-center justify-center">
        {/* warm light behind it all */}
        <span aria-hidden className="gate-glow" data-still={still} data-go={go} />
        {/* the thin gold mandala, turning once in 40s */}
        <svg aria-hidden className="gate-mandala" viewBox="0 0 200 200" data-still={still} data-go={go}>
          <Mandala />
        </svg>
        {/* the golden ripple that spreads over the screen on the tap */}
        {!reduced && <span aria-hidden className="gate-ripple" data-go={go} />}
        {/* the light that bursts out of the opening seal */}
        {!reduced && <span aria-hidden className="gate-burst" data-go={go} />}

        <div ref={tilt} className="gate-tilt relative">
          <div className="gate-seal-box" data-still={still}>
            {/* whole until the tap; then two halves, cracked down the middle, part */}
            <img src={seal} alt="" draggable={false} className="gate-seal" data-go={go} />
            {!reduced && (
              <>
                <img src={seal} alt="" aria-hidden draggable={false} className="gate-half gate-half-l" data-go={go} />
                <img src={seal} alt="" aria-hidden draggable={false} className="gate-half gate-half-r" data-go={go} />
                <span aria-hidden className="gate-flash" data-go={go} />
                {/* a soft shine across the seal, following the phone's tilt */}
                <span aria-hidden className="gate-shine" style={{ WebkitMaskImage: `url(${seal})`, maskImage: `url(${seal})` }} data-go={go}>
                  <span ref={shine} />
                </span>
              </>
            )}
          </div>
        </div>

        {/* a little hand tapping the seal's lower right edge, clear of the ॐ (its fingertip is this point) */}
        <span aria-hidden className="gate-hand-at" data-go={go}>
          {!reduced && <span className="gate-tap-ring" />}
          <svg
            className="gate-hand"
            data-still={still}
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
        className={`gate-words relative mt-1 text-[28px] leading-tight text-navy ${devanagari ? "font-deva" : "font-display font-medium italic"}`}
        data-go={go}
      >
        {names.bride} <span className="font-display not-italic text-gold-ink">&amp;</span> {names.groom}
      </p>
      {date && (
        <p className="gate-words relative mt-1.5 font-display text-[13px] font-semibold tracking-[0.2em] text-slate" data-go={go}>
          {date}
        </p>
      )}
      <p
        className={`gate-hint relative mt-7 text-slate ${devanagari ? "font-deva text-[15px]" : "font-sans text-[13px] font-medium uppercase tracking-[0.3em]"}`}
        data-still={still}
        data-go={go}
      >
        {label}
      </p>

      {/* the sound of the tap: off unless the guest turns it on */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSound((on) => !on);
        }}
        aria-pressed={sound}
        aria-label={sound ? "Sound on: a temple bell rings on the tap" : "Sound off"}
        className="fixed left-4 flex h-10 w-10 items-center justify-center rounded-full border border-gold/70 bg-ivory/75 text-navy backdrop-blur-sm hover:bg-ivory/90"
        style={{ top: "calc(var(--status-bar) + 12px)" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinejoin="round" d="M12 3v2M7.5 15.5V11a4.5 4.5 0 0 1 9 0v4.5l1.5 2H6z" />
          <path strokeLinecap="round" d="M10.5 19.5a1.6 1.6 0 0 0 3 0" />
          {sound ? (
            <path strokeLinecap="round" className="text-gold-ink" d="M19.5 8.5a6 6 0 0 1 0 6M4.5 8.5a6 6 0 0 0 0 6" />
          ) : (
            <path strokeLinecap="round" d="M4 4l16 16" />
          )}
        </svg>
      </button>

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

/** A thin gold rangoli ring: two fine circles, 24 lotus petals between them and a ring of dots. */
function Mandala() {
  const petals = Array.from({ length: 24 }, (_, i) => i * 15);
  const dots = Array.from({ length: 48 }, (_, i) => i * 7.5);
  return (
    <g fill="none" stroke="rgb(var(--gold-ink))" strokeWidth="0.7">
      <circle cx="100" cy="100" r="97" opacity="0.7" />
      <circle cx="100" cy="100" r="70" opacity="0.6" />
      {petals.map((deg) => (
        // a petal pointing outward, from the inner circle (r 70) to r 89
        <path key={deg} transform={`rotate(${deg} 100 100)`} d="M100 30c4-6 5-12 0-19c-5 7-4 13 0 19Z" opacity="0.85" />
      ))}
      {petals.map((deg) => (
        <path key={`o${deg}`} transform={`rotate(${deg + 7.5} 100 100)`} d="M100 27c3-4 3.5-8 0-12c-3.5 4-3 8 0 12Z" opacity="0.5" />
      ))}
      {dots.map((deg) => (
        <circle key={`c${deg}`} transform={`rotate(${deg} 100 100)`} cx="100" cy="7.5" r="0.9" fill="rgb(var(--gold-ink))" stroke="none" opacity="0.75" />
      ))}
    </g>
  );
}
