import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { wedding } from "@/config/wedding";
import type { Wish } from "@/config/types";
import { useGuest } from "@/context/GuestContext";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { addWish, BackendError, backendMode, listWishes, newId } from "@/lib/backend";
import { EASE } from "@/lib/motion";
import { Icon } from "@/components/art/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Sheet } from "@/components/ui/Sheet";

/**
 * Section 09 — three wishes, one beautiful beginning (PRD §4).
 *
 * Exactly three featured wishes, a View All Wishes action, one wish box and
 * one Leave Your Wish button — nothing more. A wish is trimmed, checked and
 * cleaned before it's sent; only a successful send plays the little
 * celebration (a gold ripple, a lotus, the wish as a keepsake card). A failed
 * send keeps the words and offers to try again.
 */
type SendState =
  { kind: "idle" } | { kind: "sending" } | { kind: "sent"; wish: Wish } | { kind: "error"; message: string };

/** How long the keepsake stays before the form is ready for another wish. */
const KEEPSAKE_MS = 4600;

/** Tidy a wish: no control characters, no runs of blank lines or spaces. */
function clean(raw: string): string {
  return raw
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const signature = (w: Wish) => (w.name ? `With love · ${w.name}` : "With love");

export function BlessingWall() {
  const { wishes: copy } = wedding;
  const { guestName, isPersonalized } = useGuest();
  const sectionRef = useRef<HTMLElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.12 });
  const reduced = usePrefersReducedMotion();

  const [real, setReal] = useState<Wish[]>([]);
  const [text, setText] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [state, setState] = useState<SendState>({ kind: "idle" });
  const [viewAll, setViewAll] = useState(false);
  // A retry re-sends under the same id, so a slow first attempt can't post twice.
  const pendingId = useRef<string | null>(null);

  useEffect(() => {
    listWishes()
      .then(setReal)
      .catch(() => {
        /* the samples still show; a guest can still leave a wish */
      });
  }, []);

  useEffect(() => {
    if (state.kind !== "sent") return;
    const t = window.setTimeout(() => setState({ kind: "idle" }), reduced ? 2800 : KEEPSAKE_MS);
    return () => clearTimeout(t);
  }, [state, reduced]);

  const all = useMemo(
    () => [...real, ...copy.samples.filter((s) => !real.some((r) => r.id === s.id))],
    [real, copy.samples],
  );
  const [lead, ...pair] = all.slice(0, 3);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state.kind === "sending") return;
    const message = clean(text);
    if (message.length < 2) {
      setHint("Please write a few words for the couple first.");
      return;
    }
    if (message.length > copy.maxLength) {
      setHint(`Please keep your wish under ${copy.maxLength} characters.`);
      return;
    }
    setHint(null);
    setState({ kind: "sending" });
    pendingId.current ??= newId();
    const wish: Wish = { id: pendingId.current, name: isPersonalized ? guestName : null, message };
    try {
      await addWish(wish);
      pendingId.current = null;
      setReal((r) => [wish, ...r.filter((w) => w.id !== wish.id)]);
      setText("");
      setState({ kind: "sent", wish });
    } catch (err) {
      // the words stay in the box, ready to try again
      setState({ kind: "error", message: err instanceof BackendError ? err.message : "Please try again." });
    }
  };

  return (
    <section
      id="blessings"
      ref={sectionRef}
      aria-labelledby="blessings-heading"
      className="relative px-[var(--gutter)] pt-[var(--section-gap)]"
    >
      {/* the RSVP's seal, now a small lotus at the heart of the wall */}
      <div className="mb-4 flex justify-center text-gold-ink">
        <Reveal show={seen}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold bg-ivory/80">
            <Icon name="lotus" className="h-6 w-6" />
          </span>
        </Reveal>
      </div>
      <SectionHeading id="blessings-heading" eyebrow={copy.eyebrow} title={copy.title} show={seen} delay={150} />
      <Reveal
        show={seen}
        delay={450}
        as="p"
        className="mx-auto mt-3 max-w-[19rem] text-balance text-center font-display text-[20px] font-medium italic leading-snug text-slate"
      >
        “{copy.quote}”
      </Reveal>

      {/* exactly three featured wishes */}
      <div className="mt-8 space-y-3">
        {lead && (
          <Reveal show={seen} delay={600}>
            <WishCard wish={lead} large tilt={-0.8} />
          </Reveal>
        )}
        <div className="grid grid-cols-2 gap-3">
          {pair.map((w, i) => (
            <Reveal key={w.id} show={seen} delay={720 + i * 120}>
              <WishCard wish={w} tilt={i === 0 ? 0.9 : -0.6} />
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal show={seen} delay={900} className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={() => setViewAll(true)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-sans text-[13px] font-medium tracking-[0.08em] text-navy underline decoration-gold decoration-1 underline-offset-[6px] hover:decoration-gold-ink"
        >
          View All Wishes <span aria-hidden>↗</span>
        </button>
      </Reveal>

      {/* one wish box, one button */}
      <Reveal show={seen} delay={1000} className="mx-auto mt-8 max-w-[22.5rem]">
        <div className="relative rounded-[26px] border border-gold/60 bg-ivory/80 px-5 pb-6 pt-6 shadow-[0_18px_40px_-28px_rgb(23_59_86/0.55)]">
          {state.kind === "sent" ? (
            <Keepsake wish={state.wish} reduced={reduced} />
          ) : (
            <form onSubmit={submit} noValidate>
              <label
                htmlFor="wish"
                className="block text-center font-sans text-[11px] font-medium uppercase tracking-eyebrow text-gold-ink"
              >
                Leave a blessing
              </label>
              <textarea
                id="wish"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (hint) setHint(null);
                  if (state.kind === "error") setState({ kind: "idle" });
                }}
                maxLength={copy.maxLength}
                rows={4}
                placeholder={copy.placeholder}
                aria-describedby="wish-count wish-hint"
                className="mt-3 block w-full resize-none rounded-[18px] border border-gold/60 bg-white/70 px-4 py-3 font-display text-[18px] font-medium italic leading-snug text-navy placeholder:text-slate/55 focus:border-gold-ink focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
              <div className="mt-1.5 flex justify-between gap-3 font-sans text-[11.5px] text-slate/80">
                <span
                  id="wish-hint"
                  role={hint || state.kind === "error" ? "alert" : undefined}
                  className={hint || state.kind === "error" ? "text-[#9a3b2e]" : ""}
                >
                  {hint ??
                    (state.kind === "error"
                      ? `We couldn't send your blessing. ${state.message}`
                      : isPersonalized
                        ? `Signed with love, ${guestName}`
                        : "Signed “With love”")}
                </span>
                <span id="wish-count" className="shrink-0 tabular-nums">
                  {text.length} / {copy.maxLength}
                </span>
              </div>
              <button
                type="submit"
                disabled={state.kind === "sending"}
                className="mt-4 w-full rounded-full bg-navy px-6 py-3.5 font-sans text-[15px] font-medium tracking-[0.06em] text-ivory shadow-[0_12px_26px_-14px_rgb(23_59_86/0.9)] transition-transform duration-150 hover:bg-navy-deep active:scale-[0.97] disabled:opacity-80"
              >
                {state.kind === "sending" ? "Sending…" : state.kind === "error" ? "Try again" : "Leave Your Wish"}
              </button>
            </form>
          )}
        </div>
      </Reveal>

      <Sheet open={viewAll} onClose={() => setViewAll(false)} label="All wishes">
        <h3 className="text-center text-[28px]">All Blessings</h3>
        <p className="mt-1 text-center font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-ink">
          {all.length} {all.length === 1 ? "wish" : "wishes"} with love
        </p>
        <ul className="mt-6 space-y-3">
          {all.map((w) => (
            <li key={w.id}>
              <WishCard wish={w} />
            </li>
          ))}
        </ul>
      </Sheet>
    </section>
  );
}

function WishCard({ wish, large = false, tilt = 0 }: { wish: Wish; large?: boolean; tilt?: number }) {
  return (
    <figure
      className={`relative h-full rounded-[20px] border border-gold/45 bg-ivory px-4 shadow-[0_14px_30px_-22px_rgb(23_59_86/0.6)] ${large ? "py-5" : "py-4"}`}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      <span aria-hidden className="absolute left-3 top-1 font-display text-[40px] leading-none text-gold/70">
        “
      </span>
      <blockquote
        className={`whitespace-pre-line text-balance px-2 text-center font-display font-medium italic leading-snug text-navy ${large ? "text-[20px]" : "text-[16px]"}`}
      >
        {wish.message}
      </blockquote>
      <figcaption className="mt-2.5 text-center font-sans text-[10.5px] font-medium uppercase tracking-[0.18em] text-gold-ink">
        {signature(wish)}
      </figcaption>
    </figure>
  );
}

/** After a successful send: a gold ripple, a lotus, and the wish as a little keepsake card. */
function Keepsake({ wish, reduced }: { wish: Wish; reduced: boolean }) {
  const t = (ms: number) => (reduced ? 0 : ms);
  return (
    <div className="relative flex flex-col items-center text-center" aria-live="polite">
      {!reduced && (
        <span
          aria-hidden
          className="rsvp-ring absolute bottom-0 left-1/2 -ml-[34px] h-[68px] w-[68px] rounded-full border border-gold"
        />
      )}
      <Reveal show delay={t(150)} className="text-gold-ink">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full border border-gold bg-ivory"
          style={{ animation: reduced ? undefined : `keepsake-pop 700ms ${EASE.silk} both` }}
        >
          <Icon name="lotus" className="h-7 w-7" />
        </span>
      </Reveal>
      <Reveal show delay={t(450)} className="mt-4 w-full">
        <div className="rotate-[-1deg] rounded-[16px] border border-gold/50 bg-[#fffdf8] px-4 py-4 shadow-[0_12px_26px_-18px_rgb(138_100_47/0.7)]">
          <p className="whitespace-pre-line font-display text-[17px] font-medium italic leading-snug text-navy">
            {wish.message}
          </p>
          <p className="mt-2 font-sans text-[10.5px] font-medium uppercase tracking-[0.18em] text-gold-ink">
            {signature(wish)}
          </p>
        </div>
      </Reveal>
      <Reveal show delay={t(900)} as="p" className="mt-4 font-script text-[27px] leading-tight text-gold-ink">
        A little wish, a lifetime of love.
      </Reveal>
      <Reveal show delay={t(1300)} as="p" className="mt-2 font-sans text-[13px] font-medium text-navy">
        {backendMode === "remote"
          ? "Your blessing has been sent with love."
          : "Your blessing is saved on this phone, with love."}
      </Reveal>
    </div>
  );
}
