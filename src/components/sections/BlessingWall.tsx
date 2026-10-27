import { Fragment, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { wedding } from "@/config/wedding";
import type { Wish } from "@/config/types";
import { useGuest, usePersonal } from "@/context/GuestContext";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { addWish, BackendError, backendMode, listWishes, newId } from "@/lib/backend";
import { LotusRule } from "@/components/art/Ornaments";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Sheet } from "@/components/ui/Sheet";

/**
 * Section 09 — the Blessing Wall, on a hanging scroll (PRD §4).
 *
 * The heading, its line and a small gold lotus rule; then a scroll hung upright on a fine gold cord:
 * a roller at its head and another at its foot (rolled ivory paper on a gold rod, gold knobs at the
 * ends), warm-ivory paper between. When it comes into view it opens by itself, once: the foot roller
 * rolls down and the paper unrolls behind it. On the paper: three blessings — a gold quotation mark,
 * the words in italic serif, the sender in small gold capitals after a short rule — set left, right,
 * left, a fine gold lotus divider between; "View all wishes →", a glass pill (every blessing, in the sheet); a
 * small lotus rule; "Leave a Blessing", the wish box and a navy pill button with a little lotus.
 *
 * Tapped, with a few good words: the button glows softly while the blessing is saved. Only once it
 * is: the box folds away, the button draws in to a small golden circle and becomes a golden lotus,
 * which slowly blooms, releasing a few delicate golden motes and a handful of golden hearts that rise
 * softly and fade; then the thanks and where it was kept —
 * and the new blessing takes the scroll's first place. A failed send keeps the words and offers to
 * try again. "Leave another blessing" (a glass pill too) brings the box back. Reduced motion: the scroll is simply
 * open, and the lotus simply appears, open.
 */
type SendState =
  { kind: "idle" } | { kind: "sending" } | { kind: "sent"; wish: Wish } | { kind: "error"; message: string };

/** Tidy a wish: no control characters, no runs of blank lines or spaces. */
function clean(raw: string): string {
  return raw
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const signature = (w: Wish) => (w.name ? `With love · ${w.name}` : "With love");

/** The button glows at least this long before it turns into the lotus (a local save is instant). */
const GLOW_MS = 650;

export function BlessingWall() {
  const { wishes: copy } = wedding;
  const { guestName, fromLink } = useGuest();
  const personal = usePersonal();
  const sectionRef = useRef<HTMLElement>(null);
  const hangRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.12 });
  // the scroll opens once its head is well into view
  const hangSeen = useInView(hangRef, { threshold: 0, rootMargin: "0px 0px -30% 0px" });
  const reduced = usePrefersReducedMotion();

  const [real, setReal] = useState<Wish[]>([]);
  const [text, setText] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [state, setState] = useState<SendState>({ kind: "idle" });
  const [viewAll, setViewAll] = useState(false);
  const [roll, setRoll] = useState<"closed" | "opening" | "open">("closed");
  // A retry re-sends under the same id, so a slow first attempt can't post twice.
  const pendingId = useRef<string | null>(null);

  useEffect(() => {
    listWishes()
      .then(setReal)
      .catch(() => {
        /* the samples still show; a guest can still leave a wish */
      });
  }, []);

  // open by itself: a moment after its head comes into view (at once, without motion)
  useEffect(() => {
    if (roll !== "closed" || !hangSeen) return;
    if (reduced) {
      setRoll("open");
      return;
    }
    const id = window.setTimeout(() => setRoll("opening"), 350);
    return () => window.clearTimeout(id);
  }, [hangSeen, reduced, roll]);

  const all = useMemo(() => [...real, ...copy.samples.filter((s) => !real.some((r) => r.id === s.id))], [real, copy.samples]);
  const shown = all.slice(0, 3);
  const t = (ms: number) => (reduced ? 0 : ms);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state.kind === "sending") return;
    const message = clean(text);
    if (message.length < 2) {
      setHint("Please write a few words for the couple first.");
      textRef.current?.focus();
      return;
    }
    if (message.length > copy.maxLength) {
      setHint(`Please keep your wish under ${copy.maxLength} characters.`);
      textRef.current?.focus();
      return;
    }
    setHint(null);
    setState({ kind: "sending" });
    pendingId.current ??= newId();
    // signed with the name from the link only (never the sample name)
    const wish: Wish = { id: pendingId.current, name: fromLink ? guestName : null, message };
    const started = performance.now();
    try {
      await addWish(wish);
      // the soft glow, long enough to be seen, before the button becomes the lotus
      const rest = reduced ? 0 : GLOW_MS - (performance.now() - started);
      if (rest > 0) await new Promise((r) => setTimeout(r, rest));
      // saved: only now the lotus and the thanks, and the blessing takes the scroll's first place
      pendingId.current = null;
      setReal((r) => [wish, ...r.filter((w) => w.id !== wish.id)]);
      setText("");
      setState({ kind: "sent", wish });
    } catch (err) {
      // the words stay in the box, ready to try again
      setState({ kind: "error", message: err instanceof BackendError ? err.message : "Please try again." });
    }
  };

  const invalid = Boolean(hint) || state.kind === "error";
  const sent = state.kind === "sent";

  return (
    <section id="blessings" ref={sectionRef} aria-labelledby="blessings-heading" className="relative px-[var(--gutter)] pb-8 pt-[var(--section-gap)]">
      <SectionHeading id="blessings-heading" eyebrow={copy.eyebrow} title={copy.title} show={seen} />
      <Reveal
        show={seen}
        delay={t(300)}
        as="p"
        className="mx-auto mt-2 max-w-[19rem] text-balance text-center font-display text-[20px] font-medium italic leading-snug text-slate"
      >
        “{copy.quote}”
      </Reveal>
      <Reveal show={seen} delay={t(420)} className="mt-4 flex justify-center">
        <LotusRule />
      </Reveal>

      {/* the hanging scroll: it opens by itself, the foot roller rolling down */}
      <div ref={hangRef} className="bw-hang" data-shown={seen || undefined} data-roll={roll} data-still={reduced || undefined}>
        <span aria-hidden className="bw-cord">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d="M2 29 50 2 98 29" />
          </svg>
          <span className="bw-cord-ring" />
        </span>
        <div className="bw-body">
          <Roller className="bw-roller-top" />
          <div
            className="bw-sheet"
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget && e.animationName === "bw-unroll") setRoll("open");
            }}
            // a keyboard reaching the box first opens it at once
            onFocusCapture={() => roll !== "open" && setRoll("open")}
          >
            {shown.map((w, i) => (
              <Fragment key={w.id}>
                {i > 0 && <WishDivider />}
                <WishItem wish={w} side={i % 2 ? "right" : "left"} fresh={sent && state.wish.id === w.id} />
              </Fragment>
            ))}

            <div className="mt-7 flex justify-center">
              <button type="button" onClick={() => setViewAll(true)} className="bw-glass">
                <span>View all wishes</span>
                <svg aria-hidden viewBox="0 0 20 10" className="bw-glass-arrow" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 5h17M14 1.5 18 5l-4 3.5" />
                </svg>
              </button>
            </div>

            {/* leave a blessing */}
            <div className="mt-8 flex justify-center">
              <LotusRule />
            </div>
            <h3 className="mt-3 text-center text-[28px] leading-tight">{copy.formTitle}</h3>
            <form onSubmit={submit} noValidate className="mt-4">
              <div className="bw-fields" data-gone={sent || undefined} aria-hidden={sent || undefined}>
                <div>
                  <label htmlFor="wish" className="sr-only">
                    {copy.formTitle}
                  </label>
                  <textarea
                    ref={textRef}
                    id="wish"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      if (hint) setHint(null);
                      if (state.kind === "error") setState({ kind: "idle" });
                    }}
                    maxLength={copy.maxLength}
                    rows={3}
                    disabled={sent}
                    placeholder={personal(copy.placeholderFor, copy.placeholder)}
                    aria-describedby="wish-count wish-hint"
                    aria-invalid={invalid || undefined}
                    className="bw-textarea"
                  />
                  <div className="mt-2 flex justify-between gap-3 font-sans text-[11.5px] text-slate/85">
                    <span id="wish-hint" role={invalid ? "alert" : undefined} className={invalid ? "text-[#9a3b2e]" : ""}>
                      {hint ??
                        (state.kind === "error"
                          ? `We couldn't send your blessing. ${state.message}`
                          : fromLink
                            ? `Signed with love, ${guestName}`
                            : "Signed “With love”")}
                    </span>
                    <span id="wish-count" className="shrink-0 tabular-nums">
                      {text.length} / {copy.maxLength}
                    </span>
                  </div>
                </div>
              </div>

              {/* the button — and, once the blessing is saved, the lotus it becomes */}
              <div className="bw-send-row" data-phase={state.kind}>
                <span aria-hidden className="bw-send-orn" />
                <button type="submit" disabled={state.kind === "sending" || sent} aria-busy={state.kind === "sending" || undefined} className="bw-send">
                  <SendLotus />
                  <span className="bw-send-label">{state.kind === "error" ? "Try again" : copy.button}</span>
                </button>
                <span aria-hidden className="bw-send-orn bw-send-orn-r" />
                {sent && <Bloom />}
              </div>
            </form>

            {sent && (
              <div className="bw-done" aria-live="polite">
                <p className="bw-done-thanks">{personal(copy.thanksFor, copy.thanks)}</p>
                <p className="bw-done-where">
                  {backendMode === "remote" ? "It has been sent to the couple, with love." : "It is kept on this phone, with love."}
                </p>
                <div className="bw-done-again">
                  <button
                    type="button"
                    onClick={() => {
                      setState({ kind: "idle" });
                      requestAnimationFrame(() => textRef.current?.focus());
                    }}
                    className="bw-glass"
                  >
                    <SendLotus className="bw-glass-lotus" />
                    <span>Leave another blessing</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <Roller className="bw-roller-bottom" />
        </div>
      </div>

      <Sheet open={viewAll} onClose={() => setViewAll(false)} label="All wishes">
        <h3 className="text-center text-[28px]">All Blessings</h3>
        <p className="mt-1 text-center font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-ink">
          {all.length} {all.length === 1 ? "wish" : "wishes"} with love
        </p>
        <div className="mt-3 flex justify-center">
          <LotusRule />
        </div>
        <ul className="bw-list">
          {all.map((w) => (
            <li key={w.id}>
              <p className="whitespace-pre-line text-balance font-display text-[18px] font-medium italic leading-snug text-navy">{w.message}</p>
              <p className="bw-from mt-2">{signature(w)}</p>
            </li>
          ))}
        </ul>
      </Sheet>
    </section>
  );
}

/** A roller: ivory paper rolled on a gold rod, a gold knob at each end. */
function Roller({ className }: { className: string }) {
  return (
    <span aria-hidden className={`bw-roller ${className}`}>
      <span className="bw-rod" />
      <span className="bw-roll" />
    </span>
  );
}

/** One blessing on the scroll: a gold quotation mark, the words, the sender after a short rule. */
function WishItem({ wish, side, fresh }: { wish: Wish; side: "left" | "right"; fresh: boolean }) {
  return (
    <figure className="bw-item" data-side={side} data-fresh={fresh || undefined}>
      <span aria-hidden className="bw-q">
        “
      </span>
      <blockquote className="bw-item-text">{wish.message}</blockquote>
      <figcaption className="bw-from mt-2.5">
        <span aria-hidden className="bw-from-rule" />
        {signature(wish)}
      </figcaption>
    </figure>
  );
}

/** Between two blessings: fine gold lines curving in to a small lotus, a bead either side. */
function WishDivider() {
  return (
    <svg aria-hidden viewBox="0 0 280 22" className="bw-divider" fill="none">
      <g stroke="#b89554" strokeWidth="0.8" strokeLinecap="round">
        <path d="M8 9C52 15 98 16 124 13.5" />
        <path d="M272 9C228 15 182 16 156 13.5" />
      </g>
      <g fill="#a8741f">
        <circle cx="128.5" cy="13.4" r="1.1" />
        <circle cx="151.5" cy="13.4" r="1.1" />
      </g>
      <g fill="#e9d29a" fillOpacity="0.55" stroke="#b89554" strokeWidth="0.8" strokeLinejoin="round">
        <path d="M140 18.5C136.6 18 134 15.6 133.3 12.2 136.8 12.6 139 15 140 18.5Z" />
        <path d="M140 18.5C143.4 18 146 15.6 146.7 12.2 143.2 12.6 141 15 140 18.5Z" />
        <path d="M140 18.5C137.6 15 137.6 10.8 140 6.6 142.4 10.8 142.4 15 140 18.5Z" />
      </g>
    </svg>
  );
}

/** The little lotus on the button. */
function SendLotus({ className = "bw-send-lotus" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">
      <path d="M12 13.5C10 10.6 10 6.6 12 2.6 14 6.6 14 10.6 12 13.5Z" />
      <path d="M12 13.5C9 13 6.6 10.8 6 7.6 9 8 11.2 10.4 12 13.5Z" />
      <path d="M12 13.5C15 13 17.4 10.8 18 7.6 15 8 12.8 10.4 12 13.5Z" />
      <path d="M7 15.2H17" />
    </svg>
  );
}

/** Golden motes the lotus releases as it blooms: where each drifts to (px), its delay (ms), its size. */
const MOTES = [
  [-46, -64, 0, 4],
  [-26, -92, 140, 3],
  [-8, -76, 60, 3.5],
  [12, -100, 200, 3],
  [30, -70, 100, 4],
  [50, -54, 260, 3],
  [-40, -34, 320, 2.5],
  [42, -30, 230, 2.5],
  [-16, -116, 380, 2.5],
  [22, -122, 440, 2.5],
] as const;

/**
 * Golden hearts that rise from the lotus as it opens, swaying a little: where each drifts to (px), its
 * delay (ms), its size (px), how long it rises (ms) and how far it sways (px).
 */
const HEARTS = [
  [-34, -96, 0, 13, 2600, 7],
  [6, -124, 180, 16, 2900, -8],
  [38, -88, 340, 12, 2500, 6],
  [-14, -146, 520, 11, 3000, 7],
  [26, -150, 700, 13, 3100, -6],
  [-46, -60, 820, 10, 2300, -5],
  [48, -54, 960, 10, 2300, 5],
] as const;

/**
 * The golden lotus the button becomes: a closed bud that slowly blooms — outer petals, side petals and
 * the centre opening from its base — over a soft glow, releasing a few golden motes and, as it opens,
 * a handful of golden hearts that rise softly and fade.
 */
function Bloom() {
  const id = useId().replace(/:/g, "");
  return (
    <span aria-hidden className="bw-bloom">
      <span className="bw-bloom-glow" />
      <svg viewBox="0 0 80 64" className="bw-bloom-lotus">
        <defs>
          <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6e2a6" />
            <stop offset="0.55" stopColor="#d8b25e" />
            <stop offset="1" stopColor="#a8741f" />
          </linearGradient>
          {/* the hearts' gold: light at the top left, deeper below */}
          <linearGradient id={`${id}-h`} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="#fbecbf" />
            <stop offset="0.5" stopColor="#e2b85a" />
            <stop offset="1" stopColor="#b07c22" />
          </linearGradient>
        </defs>
        <g fill={`url(#${id}-p)`} stroke="#9c6b1e" strokeWidth="0.8" strokeLinejoin="round">
          <path className="bw-petal bw-petal-ol" d="M40 50C29 50 17 44 11 33 22 31 33 37 40 50Z" />
          <path className="bw-petal bw-petal-or" d="M40 50C51 50 63 44 69 33 58 31 47 37 40 50Z" />
          <path className="bw-petal bw-petal-sl" d="M40 50C32 46 26 35 27 22 36 26 40 37 40 50Z" />
          <path className="bw-petal bw-petal-sr" d="M40 50C48 46 54 35 53 22 44 26 40 37 40 50Z" />
          <path className="bw-petal bw-petal-c" d="M40 50C34.6 42 34.6 28 40 14 45.4 28 45.4 42 40 50Z" />
        </g>
        <path d="M28 54Q40 58.5 52 54" fill="none" stroke="#a8741f" strokeWidth="1" strokeLinecap="round" />
      </svg>
      {MOTES.map(([x, y, d, s], i) => (
        <span key={i} className="bw-mote" style={{ "--x": `${x}px`, "--y": `${y}px`, "--d": `${d}ms`, "--s": `${s}px` } as CSSProperties} />
      ))}
      {HEARTS.map(([x, y, d, s, ms, sway], i) => (
        <span
          key={i}
          className="bw-heart"
          style={{ "--x": `${x}px`, "--y": `${y}px`, "--d": `${d}ms`, "--s": `${s}px`, "--ms": `${ms}ms`, "--sway": `${sway}px` } as CSSProperties}
        >
          <svg viewBox="0 0 24 22" className="bw-heart-shape">
            <path
              d="M12 21C11.2 20.3 2 13.6 2 7.4 2 4 4.6 1.5 7.6 1.5c2 0 3.5 1.1 4.4 2.6.9-1.5 2.4-2.6 4.4-2.6 3 0 5.6 2.5 5.6 5.9 0 6.2-9.2 12.9-10 13.6Z"
              fill={`url(#${id}-h)`}
              stroke="#a8741f"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
            <path d="M6.2 5.2c-1 .6-1.6 1.6-1.6 2.8" fill="none" stroke="#fff8e2" strokeOpacity="0.85" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </span>
      ))}
    </span>
  );
}
