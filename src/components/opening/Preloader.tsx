import { useEffect, useRef, useState, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { EASE } from "@/lib/motion";
import { readSessionFlag, writeSessionFlag } from "@/lib/session";
import { REDUCED_MOTION_QUERY } from "@/hooks/useMediaQuery";
import { Emblem } from "@/components/ui/Emblem";

/**
 * Section 00 — the divine union (PRD §4).
 *
 *   0.0–2.8 s  arrival     Shiva's hand glides in slowly from the left, Parvati's
 *                          from the right, on the sky
 *   2.4–3.6 s  union       their fingertips meet; a restrained golden glow
 *                          blooms in the space between them
 *   3.7–4.8 s  transition  the hands soften into the sky and the glow gathers
 *                          into the gold emblem, which settles where the
 *                          invitation wears it
 *
 * Never a gate: Skip is always there, a guest who already watched it this
 * visit gets a short version, and reduced-motion shows a still frame.
 */

const SEEN_KEY = "dw:opening-seen";

type Mode = "full" | "short" | "still";

function pickMode(): Mode {
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return "still";
  // ?opening=full plays the whole opening even on a reload (handy when reviewing).
  if (new URLSearchParams(window.location.search).get("opening") === "full") return "full";
  if (wedding.opening.shortOnRepeatVisit && readSessionFlag(SEEN_KEY)) return "short";
  return "full";
}

interface PreloaderProps {
  /** The overlay starts to fade: show the page beneath now. */
  onReveal: () => void;
  /** The overlay is gone. */
  onDone: () => void;
}

export function Preloader({ onReveal, onDone }: PreloaderProps) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const shiva = useRef<HTMLImageElement>(null);
  const parvati = useRef<HTMLImageElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const emblem = useRef<HTMLDivElement>(null);
  const skip = useRef<() => void>(() => {});
  const [waiting, setWaiting] = useState(true);
  const [skipVisible, setSkipVisible] = useState(false);

  // Callbacks may change identity between renders; the timeline reads the latest.
  const callbacks = useRef({ onReveal, onDone });
  callbacks.current = { onReveal, onDone };

  useEffect(() => {
    const els = {
      root: root.current!,
      stage: stage.current!,
      shiva: shiva.current!,
      parvati: parvati.current!,
      glow: glow.current!,
      emblem: emblem.current!,
    };
    const mode = pickMode();
    const running: Animation[] = [];
    const timers: number[] = [];
    let cancelled = false;
    let finished = false;

    const restoreScroll = lockScroll();

    const play = (el: Element, frames: Keyframe[], timing: KeyframeAnimationOptions) => {
      const a = el.animate(frames, { fill: "forwards", ...timing });
      running.push(a);
      return a;
    };
    const wait = (ms: number) => new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, ms)));

    /** Fade the overlay away and hand over to the page. */
    const finish = async (fast: boolean) => {
      if (finished) return;
      finished = true;
      writeSessionFlag(SEEN_KEY);
      callbacks.current.onReveal();
      const fade = els.root.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: fast ? 380 : 480,
        easing: EASE.silk,
        fill: "forwards",
      });
      await fade.finished.catch(() => {});
      callbacks.current.onDone();
    };

    skip.current = () => {
      cancelled = true;
      running.forEach((a) => a.pause());
      void finish(true);
    };

    // ── shared pieces of the timeline ──

    /** The gold emblem, starting at the glow and settling on the invitation's emblem. */
    const emblemJourney = (duration: number) => {
      const g = els.glow.getBoundingClientRect();
      const from = { x: g.left + g.width / 2, y: g.top + g.height / 2 };
      const to = emblemTarget();
      els.emblem.style.left = `${to.x}px`;
      els.emblem.style.top = `${to.y}px`;
      const at = (x: number, y: number, s: number) => `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${s})`;
      return play(
        els.emblem,
        [
          { opacity: 0, transform: at(from.x - to.x, from.y - to.y, 0.45) },
          { opacity: 1, transform: at(from.x - to.x, from.y - to.y, 1), offset: 0.3, easing: EASE.drift },
          { opacity: 1, transform: at(0, 0, 1) },
        ],
        { duration },
      );
    };

    /** The hands soften into the sky; the glow gathers itself into the emblem. */
    const transition = async (duration: number) => {
      play(
        els.glow,
        [
          { transform: "scale(1)", opacity: 0.7 },
          { transform: "scale(0.28)", opacity: 0.95, offset: 0.4 },
          { transform: "scale(0.2)", opacity: 0 },
        ],
        { duration: duration * 1.1, easing: EASE.breath },
      );
      for (const hand of [els.shiva, els.parvati])
        play(
          hand,
          [
            { opacity: 1, filter: "blur(0px)" },
            { opacity: 0, filter: "blur(5px)" },
          ],
          {
            duration: duration * 0.8,
            easing: "ease-in",
          },
        );
      await wait(duration * 0.3);
      await emblemJourney(duration).finished;
    };

    // ── the three versions ──

    const runFull = async () => {
      // 0–2.8 s · arrival: slowly, each from its own side
      const glide = { duration: 2800, easing: EASE.glide };
      play(
        els.shiva,
        [
          { opacity: 0, transform: "translateX(-46%)" },
          { opacity: 1, offset: 0.35 },
          { opacity: 1, transform: "translateX(0)" },
        ],
        glide,
      );
      play(
        els.parvati,
        [
          { opacity: 0, transform: "translateX(46%)" },
          { opacity: 1, offset: 0.35 },
          { opacity: 1, transform: "translateX(0)" },
        ],
        glide,
      );
      // the seed of light waits between them, then blooms as the fingertips meet
      play(
        els.glow,
        [
          { transform: "scale(0.25)", opacity: 0.4, easing: EASE.breath },
          { transform: "scale(0.4)", opacity: 0.6, offset: 0.62, easing: EASE.breath },
          { transform: "scale(1.5)", opacity: 1, offset: 0.8, easing: EASE.breath },
          { transform: "scale(1)", opacity: 0.7 },
        ],
        { duration: 3600 },
      );
      await wait(3700);
      if (cancelled) return;
      // 3.7–4.8 s · transition
      await transition(900);
    };

    const runShort = async () => {
      for (const hand of [els.shiva, els.parvati])
        play(hand, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: "ease-out" });
      play(
        els.glow,
        [
          { transform: "scale(0.3)", opacity: 0.4 },
          { transform: "scale(1.4)", opacity: 0.95, offset: 0.6 },
          { transform: "scale(1)", opacity: 0.7 },
        ],
        { duration: 1000, easing: EASE.breath },
      );
      await wait(1050);
      if (cancelled) return;
      await transition(750);
    };

    const runStill = async () => {
      for (const hand of [els.shiva, els.parvati]) hand.style.opacity = "1";
      els.glow.style.transform = "scale(1)";
      els.glow.style.opacity = "0.7";
      await wait(2400);
    };

    (async () => {
      await artReady([els.shiva, els.parvati], wedding.opening.maxAssetWaitMs);
      if (cancelled) return;
      setWaiting(false);
      timers.push(window.setTimeout(() => setSkipVisible(true), mode === "full" ? 700 : 0));
      if (mode === "full") await runFull();
      else if (mode === "short") await runShort();
      else await runStill();
      if (!cancelled) await finish(false);
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      running.forEach((a) => a.cancel());
      restoreScroll();
    };
  }, []);

  const { opening } = wedding.assets;
  const hand: CSSProperties = { opacity: 0 };

  return (
    <div ref={root} className="fixed inset-0 z-50 overflow-hidden" role="presentation">
      <p className="sr-only">The hands of Shiva and Parvati reach for each other. The invitation opens in a moment.</p>

      <div ref={stage} className="opening-stage">
        <img ref={shiva} src={opening.shivaHand} alt="" className="opening-layer" style={hand} />
        <img ref={parvati} src={opening.parvatiHand} alt="" className="opening-layer" style={hand} />
        <div ref={glow} className="opening-glow" data-waiting={waiting || undefined} />
      </div>

      <div ref={emblem} className="pointer-events-none fixed left-1/2 top-0 opacity-0">
        <Emblem />
      </div>

      <button
        type="button"
        onClick={() => skip.current()}
        className={`absolute right-4 rounded-full border border-gold/70 bg-ivory/75 px-4 py-2 font-sans text-[13px] font-medium tracking-[0.12em] text-navy backdrop-blur-sm transition-opacity duration-500 hover:bg-ivory/90 active:bg-ivory ${skipVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}
        style={{ top: "calc(var(--status-bar) + 12px)" }}
      >
        Skip <span aria-hidden>›</span>
      </button>

      {wedding.credits.openingHands && (
        <p
          className="absolute left-5 font-sans text-[10px] tracking-wide text-navy/60"
          style={{ top: "calc(var(--status-bar) + 22px)" }}
        >
          {wedding.credits.openingHands}
        </p>
      )}
    </div>
  );
}

/** Centre of the invitation's emblem (where the opening's emblem must land). */
function emblemTarget(): { x: number; y: number } {
  const target = document.querySelector("[data-emblem-target]");
  if (target) {
    const r = target.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { x: window.innerWidth / 2, y: 96 };
}

/** Resolves once every image is decoded, or after `maxWait` — the opening never waits forever. */
function artReady(images: HTMLImageElement[], maxWait: number): Promise<void> {
  const decoded = Promise.all(images.map((img) => img.decode().catch(() => undefined)));
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, maxWait));
  return Promise.race([decoded.then(() => undefined), timeout]);
}

/** No scrolling the page behind the opening. Returns the undo. */
function lockScroll(): () => void {
  const el = document.documentElement;
  const previous = el.style.overflow;
  el.style.overflow = "hidden";
  return () => {
    el.style.overflow = previous;
  };
}
