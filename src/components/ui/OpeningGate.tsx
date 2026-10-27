import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { playMusic, preloadMusic } from "@/lib/music";

interface OpeningGateProps {
  /** The golden ॐ wax seal at its centre. */
  seal: string;
  /** The sky behind it all: the opening's own sunrise over the Himalaya, so the gate fades into it unchanged. */
  sky: string;
  /** "You're invited", over the seal. */
  invited: string;
  /** The guest's name, above it — only when the link names them. */
  guest?: string;
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

// The tap opens the seal (a glow, a gold line drawn round its edge, a press, then it melts into gold
// dust as a soft light spreads into the clouds) — then the gate fades as the opening's hands begin.
const OPEN_MS = 950;
const FADE_MS = 650;
const REDUCED_FADE_MS = 300;

// A few gold motes drifting slowly about the seal: fixed, hand-spread values (where round the seal,
// in degrees; how far out, as a share of the stage's half-width; size px; seconds; delay s), so every
// visit looks the same and nothing is random.
const MOTES = [
  [22, 0.84, 3, 9, 0],
  [68, 0.97, 2, 11, -3],
  [118, 0.8, 3.5, 10, -6],
  [162, 0.93, 2, 12, -2],
  [206, 0.86, 3, 9.5, -7],
  [252, 0.98, 2.5, 11.5, -4],
  [296, 0.82, 2, 10.5, -8],
  [338, 0.94, 3, 12.5, -5],
] as const;

// The seal's gold dust as it opens: where each grain starts (round the seal, and how far from its
// middle as a share of its width), how far it drifts out (px), its size (px) and its delay (ms).
const GRAINS = Array.from({ length: 28 }, (_, i) => {
  const a = ((i * 360) / 28 + (i % 3) * 7) * (Math.PI / 180);
  const r = 0.16 + ((i * 37) % 30) / 100;
  const out = 30 + ((i * 53) % 44);
  return {
    x0: Math.cos(a) * r,
    y0: Math.sin(a) * r,
    dx: Math.cos(a) * out,
    dy: Math.sin(a) * out - 10,
    size: 4 + (i % 4),
    delay: (i * 29) % 170,
  };
});

/**
 * Before the opening, every time the link opens — as in the couple's design: a sunrise sky over the
 * Himalaya (the opening's own, so the gate fades into the opening with the sky unchanged), a breath of
 * blue at its top so the words read, a champagne warmth at its foot. For a named guest, their name in
 * antique-gold italic; "You're invited" over a small gold lotus line; then the golden ॐ wax seal,
 * floating very gently on a soft warm halo, a shimmer crossing its metal now and then, in its fine
 * gold mandala — a dotted outer ring turning once in two minutes, the leaf ring still — with a few
 * gold motes drifting about it. Under it a small gold diamond line and "Tap to open", softly pulsing.
 * Tilting the phone moves a soft shine across the seal (where the browser allows it without asking).
 * No names or date here — only, when the link names a guest, theirs.
 *
 * The seal is the button (a tap anywhere does the same). Its tap: a tiny buzz, the couple's song
 * fading in (unless the guest turned the sound off in the corner first), and the seal opens — a warm
 * glow, a fine gold line drawn round its edge, a small press, and it melts into gold dust as a soft
 * light spreads out into the clouds; then the gate fades and the opening's hands begin beneath it.
 * Skip goes straight to the card (the song starting too). Only transform and opacity move (and the
 * one gold line); reduced motion gets a plain fade.
 */
export function OpeningGate({ seal, sky, invited, guest, label, devanagari = false, reduced, onBegin, onSkip, onGone }: OpeningGateProps) {
  const [phase, setPhase] = useState<"waiting" | "opening" | "leaving">("waiting");
  // the song plays from the tap unless the guest turns it off here first
  const [sound, setSound] = useState(true);
  const timers = useRef<number[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const shine = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // focused (without a ring), so Enter or Space opens it straight away; the seal itself is a tab stop
    root.current?.focus({ preventScroll: true });
    preloadMusic();
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
    // the song starts on the tap itself (browsers allow sound only from a tap)
    if (sound) playMusic();
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
    if (phase !== "waiting") return;
    if (sound) playMusic();
    setPhase("leaving");
    onSkip();
    later(reduced ? REDUCED_FADE_MS : FADE_MS, onGone);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      begin();
    }
  };

  const still = reduced || undefined;
  const opened = (!reduced && phase !== "waiting") || undefined;
  const words = devanagari ? "font-deva" : "font-display font-semibold uppercase";
  return (
    <div
      ref={root}
      tabIndex={-1}
      onClick={begin}
      onKeyDown={onKey}
      className="gate fixed inset-0 z-[60] grid cursor-pointer select-none grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] justify-items-center overflow-hidden px-6 outline-none"
      data-still={still}
      data-opened={opened}
      style={{
        // the same above and below, so the seal sits in the very middle of the screen (clear of the corner buttons)
        paddingBlock: "calc(var(--status-bar) + 64px)",
        opacity: phase === "leaving" ? 0 : 1,
        transition: `opacity ${reduced ? REDUCED_FADE_MS : FADE_MS}ms ease-out`,
        pointerEvents: phase === "waiting" ? undefined : "none",
      }}
    >
      {/* the sky: the opening's sunrise over the Himalaya, a breath of blue at its top, warmth at its foot */}
      <img aria-hidden src={sky} alt="" draggable={false} className="gate-sky" />
      <span aria-hidden className="gate-tint" />

      {/* ── above the seal, the invitation: for a named guest, their name first ── */}
      <div className="flex flex-col items-center self-end pb-5">
        {guest && (
          <p className="gate-words gate-ivory gate-name relative mb-1.5 max-w-[18rem] text-balance text-center font-display text-[29px] font-semibold italic leading-tight">
            {guest}
          </p>
        )}
        <p className={`gate-words gate-ivory relative ${devanagari ? "font-deva text-[17px]" : `${words} text-[13px] tracking-[0.38em]`}`}>
          {invited}
        </p>
        <LotusRule className="gate-words relative mt-2.5" />
      </div>

      {/* ── the seal, in the very middle ── */}
      <div className="gate-stage relative flex items-center justify-center">
        {/* a soft warm light behind it all */}
        <span aria-hidden className="gate-glow" />
        {/* the mandala, in three layers: a dotted outer ring turning once in two minutes… */}
        <svg aria-hidden className="gate-mandala gate-ring" viewBox="0 0 200 200">
          <OuterRing />
        </svg>
        {/* …the ring of gold leaves, still… */}
        <svg aria-hidden className="gate-mandala" viewBox="0 0 200 200">
          <Mandala />
          {/* its four small diamonds, at the top, the foot and either side */}
          {[0, 90, 180, 270].map((deg) => (
            <path key={deg} transform={`rotate(${deg} 100 100)`} d="M100 -9l3 4.5l-3 4.5l-3-4.5Z" fill="#a98238" opacity="0.9" />
          ))}
        </svg>

        {/* a few gold motes drifting slowly about the seal */}
        {!reduced && (
          <span aria-hidden className="gate-motes">
            {MOTES.map(([deg, far, size, secs, delay], i) => {
              const a = (deg * Math.PI) / 180;
              return (
                <span
                  key={i}
                  className="gate-mote"
                  style={
                    {
                      left: `${50 + Math.cos(a) * far * 50}%`,
                      top: `${50 + Math.sin(a) * far * 50}%`,
                      width: size,
                      height: size,
                      animationDuration: `${secs}s`,
                      animationDelay: `${delay}s`,
                      "--dx": `${Math.round(Math.sin(a) * 9)}px`,
                      "--dy": `${Math.round(-Math.cos(a) * 9) - 4}px`,
                    } as CSSProperties
                  }
                />
              );
            })}
          </span>
        )}

        {/* …and the seal, on its own inner halo: the button */}
        <div ref={tilt} className="gate-tilt relative">
          <button
            type="button"
            className="gate-seal-btn"
            aria-label={`${guest ? `${guest}, ` : ""}${invited}. ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              begin();
            }}
          >
            <span aria-hidden className="gate-halo" />
            <span className="gate-float">
              <span className="gate-seal-box">
                <img src={seal} alt="" draggable={false} className="gate-seal" />
                {/* light from the upper left on the raised metal */}
                <span aria-hidden className="gate-emboss" style={{ WebkitMaskImage: `url(${seal})`, maskImage: `url(${seal})` }} />
                {!reduced && (
                  <>
                    {/* now and then, a shimmer across the gold */}
                    <span aria-hidden className="gate-shimmer" style={{ WebkitMaskImage: `url(${seal})`, maskImage: `url(${seal})` }}>
                      <span />
                    </span>
                    {/* a soft shine, following the phone's tilt */}
                    <span aria-hidden className="gate-shine" style={{ WebkitMaskImage: `url(${seal})`, maskImage: `url(${seal})` }}>
                      <span ref={shine} />
                    </span>
                  </>
                )}
              </span>
            </span>
            {/* opening: a fine gold line drawn once round the seal's edge */}
            {!reduced && (
              <svg aria-hidden className="gate-trace" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" pathLength={1} />
              </svg>
            )}
          </button>
        </div>

        {/* opening: the seal melts into gold dust, and a soft light spreads out into the clouds */}
        {opened && (
          <span aria-hidden className="gate-dust">
            {GRAINS.map((g, i) => (
              <span
                key={i}
                className="gate-grain"
                style={
                  {
                    width: g.size,
                    height: g.size,
                    animationDelay: `${520 + g.delay}ms`,
                    "--x0": g.x0.toFixed(3),
                    "--y0": g.y0.toFixed(3),
                    "--dx": `${g.dx.toFixed(1)}px`,
                    "--dy": `${g.dy.toFixed(1)}px`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        )}
        {!reduced && <span aria-hidden className="gate-bloom" />}
      </div>

      {/* ── below it, a small gold diamond line, and the invitation to open it ── */}
      <div className="flex flex-col items-center self-start pt-6">
        <SealRule className="gate-words relative" />
        <p className={`gate-hint gate-ivory relative mt-2.5 ${devanagari ? "font-deva text-[15px]" : `${words} text-[12.5px] tracking-[0.34em]`}`}>
          <span className="gate-pulse">{label}</span>
        </p>
      </div>

      {/* the song: on, unless the guest turns it off before the tap */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSound((on) => !on);
        }}
        aria-pressed={sound}
        aria-label={sound ? "Music on: the song plays when you open the invitation" : "Music off"}
        className="gate-chip fixed left-4 flex h-10 w-10 items-center justify-center rounded-full"
        data-off={!sound || undefined}
        style={{ top: "calc(var(--status-bar) + 12px)" }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
        aria-label="Skip the opening"
        className="gate-chip fixed right-4 inline-flex h-10 items-center gap-1.5 rounded-full pl-4 pr-3 font-display text-[15px] font-semibold tracking-[0.06em]"
        style={{ top: "calc(var(--status-bar) + 12px)" }}
      >
        Skip
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 8h9.5M8.8 4.2 12.6 8l-3.8 3.8" />
        </svg>
      </button>
    </div>
  );
}

/** A short gold line either side of a small lotus, a bead at each end. */
function LotusRule({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`gate-gold flex items-center gap-2 ${className}`}>
      <span className="h-1 w-1 rounded-full bg-current opacity-60" />
      <span className="-ml-1 h-px w-12 bg-gradient-to-r from-transparent to-current opacity-70" />
      <svg width="16" height="10" viewBox="0 0 24 14" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
        <path d="M12 1.5c2 2 2.6 5 0 9c-2.6-4-2-7 0-9ZM12 10.5c-2-3-5-4.6-8.5-4.2c.6 3.4 4 5.4 8.5 4.2ZM12 10.5c2-3 5-4.6 8.5-4.2c-.6 3.4-4 5.4-8.5 4.2ZM5 12.5h14" />
      </svg>
      <span className="-mr-1 h-px w-12 bg-gradient-to-l from-transparent to-current opacity-70" />
      <span className="h-1 w-1 rounded-full bg-current opacity-60" />
    </span>
  );
}

/** Under the seal: a fine gold line either side of a small open diamond, a dot at its heart. */
function SealRule({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden className={`gate-gold gate-rule ${className}`} width="104" height="10" viewBox="0 0 104 10" fill="none">
      <defs>
        {/* in user space: a gradient can't take its size from a line, which has no height */}
        <linearGradient id="gate-rule-l" gradientUnits="userSpaceOnUse" x1="4" x2="42" y1="0" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="gate-rule-r" gradientUnits="userSpaceOnUse" x1="100" x2="62" y1="0" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <path d="M4 5h38" stroke="url(#gate-rule-l)" strokeWidth="0.8" />
      <path d="M62 5h38" stroke="url(#gate-rule-r)" strokeWidth="0.8" />
      <circle cx="45.5" cy="5" r="0.9" fill="currentColor" opacity="0.7" />
      <circle cx="58.5" cy="5" r="0.9" fill="currentColor" opacity="0.7" />
      <path d="M52 1.4 55.6 5 52 8.6 48.4 5Z" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
      <circle cx="52" cy="5" r="1.1" fill="currentColor" />
    </svg>
  );
}

/** The mandala's outer layer: a ring of fine gold dots, a slightly larger bead every 30°. */
function OuterRing() {
  return (
    <g fill="#a98238">
      <circle cx="100" cy="100" r="96" fill="none" stroke="#a98238" strokeDasharray="0.1 3.4" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} transform={`rotate(${i * 30} 100 100)`} cx="100" cy="4" r="1.15" opacity="0.85" />
      ))}
    </g>
  );
}

/**
 * The mandala's ring of gold leaves: sixteen lotus petals with a vein each and sixteen smaller ones
 * between, a bead at each petal's tip, inside a fine circle.
 */
function Mandala() {
  const big = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <g fill="none" stroke="#a98238" strokeWidth="0.8" strokeLinecap="round">
      <circle cx="100" cy="100" r="69.5" opacity="0.55" />
      {big.map((deg) => (
        <g key={deg} transform={`rotate(${deg} 100 100)`}>
          {/* a lotus petal pointing out, from r 70 to r 91, and its vein */}
          <path d="M100 30c5-5 7.5-11 0-21c-7.5 10-5 16 0 21Z" opacity="0.95" />
          <path d="M100 28v-13" opacity="0.55" />
          {/* a smaller petal between */}
          <path transform="rotate(11.25 100 100)" d="M100 31c3-3.4 4.5-7.2 0-13c-4.5 5.8-3 9.6 0 13Z" opacity="0.6" />
          <circle cx="100" cy="6.5" r="0.9" fill="#a98238" stroke="none" opacity="0.8" />
        </g>
      ))}
    </g>
  );
}
