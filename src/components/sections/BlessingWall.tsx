import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { wedding } from "@/config/wedding";
import type { Wish } from "@/config/types";
import { useGuest } from "@/context/GuestContext";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { addWish, BackendError, backendMode, listWishes, newId } from "@/lib/backend";
import { Lotus, LotusRule } from "@/components/art/Ornaments";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Sheet } from "@/components/ui/Sheet";

/**
 * Section 09 — the Blessing Wall (PRD §4), laid out like a page of an old wedding manuscript.
 *
 * The heading and its line, a small gold lotus rule. Then three blessings, not as cards: the first
 * is the centrepiece — on a warm-ivory, faintly textured leaf with only small gold corner ornaments,
 * an oversized opening quotation mark, the words in italic serif and the sender beneath in small
 * gold capitals; the next two sit below it, unboxed, side by side and slightly staggered, a fine
 * gold line between them. "View all wishes →" (a fine gold underline that fills on hover, the arrow
 * stepping on) opens every blessing in the sheet.
 *
 * "Leave a Blessing" follows on the page itself, no card: a small gold lotus, the heading, a clean
 * box with a fine gold edge (its placeholder, a counter, who it is signed by), and "Send your
 * blessing". A wish is trimmed, checked and cleaned before it's sent; only once it is saved does
 * the form give way to its confirmation — a gold lotus drawing itself, "Your blessing has found its
 * place.", where it was kept — and the new blessing takes the centre of the wall. A failed send keeps
 * the words and offers to try again. "Leave another blessing" brings the form back.
 *
 * One way of moving throughout: the heading rises in, the centrepiece fades in, the two others
 * follow a beat apart, the form rises in when it is reached. Reduced motion: plain fades.
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

export function BlessingWall() {
  const { wishes: copy } = wedding;
  const { guestName, isPersonalized } = useGuest();
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.12 });
  const formSeen = useInView(formRef, { threshold: 0.2 });
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

  const all = useMemo(() => [...real, ...copy.samples.filter((s) => !real.some((r) => r.id === s.id))], [real, copy.samples]);
  const [lead, ...pair] = all.slice(0, 3);
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
    const wish: Wish = { id: pendingId.current, name: isPersonalized ? guestName : null, message };
    try {
      await addWish(wish);
      // saved: only now the confirmation, and the blessing takes the centre of the wall
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

  return (
    <section id="blessings" ref={sectionRef} aria-labelledby="blessings-heading" className="relative px-[var(--gutter)] pb-6 pt-[var(--section-gap)]">
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

      {/* the wall: one blessing at the centre, two beneath it */}
      <div className="bw-wall">
        {lead && (
          <Reveal key={lead.id} show={seen} delay={t(560)} rise={false}>
            <Featured wish={lead} fresh={state.kind === "sent" && state.wish.id === lead.id} />
          </Reveal>
        )}
        {pair.length > 0 && (
          <div className="bw-pair">
            {pair.map((w, i) => (
              <Reveal key={w.id} show={seen} delay={t(760 + i * 140)} className={i === 1 ? "bw-later" : undefined}>
                <Secondary wish={w} />
              </Reveal>
            ))}
          </div>
        )}
      </div>

      <Reveal show={seen} delay={t(1000)} className="mt-8 flex justify-center">
        <button type="button" onClick={() => setViewAll(true)} className="bw-link">
          <span className="bw-link-text">View all wishes</span>
          <svg aria-hidden viewBox="0 0 20 10" className="bw-link-arrow" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 5h17M14 1.5 18 5l-4 3.5" />
          </svg>
        </button>
      </Reveal>

      {/* leave a blessing: on the page itself, no card */}
      <div ref={formRef} className="mx-auto mt-14 max-w-[22.5rem] text-center">
        <Reveal show={formSeen} delay={t(0)} className="flex justify-center">
          <Lotus className="h-6 w-9" />
        </Reveal>
        <Reveal show={formSeen} delay={t(120)}>
          <h3 className="mt-2 text-[28px] leading-tight">{copy.formTitle}</h3>
        </Reveal>

        <Reveal show={formSeen} delay={t(260)} className="mt-5">
          {state.kind === "sent" ? (
            <Confirmation
              thanks={copy.thanks}
              reduced={reduced}
              onAnother={() => {
                setState({ kind: "idle" });
                requestAnimationFrame(() => textRef.current?.focus());
              }}
            />
          ) : (
            <form onSubmit={submit} noValidate className="text-left">
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
                rows={4}
                placeholder={copy.placeholder}
                aria-describedby="wish-count wish-hint"
                aria-invalid={invalid || undefined}
                className="bw-textarea"
              />
              <div className="mt-2 flex justify-between gap-3 font-sans text-[11.5px] text-slate/85">
                <span id="wish-hint" role={invalid ? "alert" : undefined} className={invalid ? "text-[#9a3b2e]" : ""}>
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
              <button type="submit" disabled={state.kind === "sending"} className="bw-send">
                {state.kind === "sending" ? "Sending…" : state.kind === "error" ? "Try again" : copy.button}
                {state.kind !== "sending" && (
                  <svg aria-hidden viewBox="0 0 20 10" className="bw-send-arrow" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 5h17M14 1.5 18 5l-4 3.5" />
                  </svg>
                )}
              </button>
            </form>
          )}
        </Reveal>
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

/** The centrepiece: a warm-ivory leaf, small gold corners, a large opening quotation mark (a blessing just left fades in). */
function Featured({ wish, fresh }: { wish: Wish; fresh: boolean }) {
  return (
    <figure className="bw-featured" data-fresh={fresh || undefined}>
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <svg key={c} aria-hidden viewBox="0 0 24 24" className={`bw-corner bw-corner-${c}`} fill="none" stroke="#b89554" strokeWidth="1" strokeLinecap="round">
          <path d="M2 20V6c0-2.2 1.8-4 4-4h14M6 9c0-1.7 1.3-3 3-3" />
          <circle cx="9" cy="9" r="1" fill="#b89554" stroke="none" />
        </svg>
      ))}
      <span aria-hidden className="bw-quote-mark">
        “
      </span>
      <blockquote className="bw-featured-text">{wish.message}</blockquote>
      <figcaption className="bw-from mt-4">
        <span aria-hidden className="bw-from-rule" />
        {signature(wish)}
      </figcaption>
    </figure>
  );
}

/** One of the two beneath: no box, a small quotation mark, the words, the sender. */
function Secondary({ wish }: { wish: Wish }) {
  return (
    <figure className="bw-secondary">
      <span aria-hidden className="bw-quote-small">
        “
      </span>
      <blockquote className="bw-secondary-text">{wish.message}</blockquote>
      <figcaption className="bw-from mt-2.5">{signature(wish)}</figcaption>
    </figure>
  );
}

/** Saved: a small gold lotus draws itself, a fine rule opens, then the words and where it was kept. */
function Confirmation({ thanks, reduced, onAnother }: { thanks: string; reduced: boolean; onAnother: () => void }) {
  return (
    <div className="bw-done" data-still={reduced || undefined} aria-live="polite">
      <Lotus className="bw-done-lotus mx-auto h-10 w-[60px]" />
      <span aria-hidden className="bw-done-rule" />
      <p className="bw-done-thanks">{thanks}</p>
      <p className="bw-done-where">
        {backendMode === "remote" ? "It has been sent to the couple, with love." : "It is kept on this phone, with love."}
      </p>
      <button type="button" onClick={onAnother} className="bw-link bw-done-again">
        <span className="bw-link-text">Leave another blessing</span>
      </button>
    </div>
  );
}
