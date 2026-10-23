import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type AnimationEvent,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { wedding } from "@/config/wedding";
import type { Photo } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useScrollLock } from "@/hooks/useScrollLock";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Section 07 — "Our Gallery": the couple's photos under a crescent moon.
 *
 * A thin gold crescent arcs over the photos, and a small moon travels along it — with the first
 * photo a thin crescent, with the last a full moon. The photo in the centre is large and sharp,
 * in a softly domed gold frame (some in a round "chandra" frame, some in a tilted polaroid with a
 * handwritten caption), a small gold lotus above it and a few sparkles that come and go at its
 * corners; the photos on either side smaller, tilted a little, softened and dimmed. A swipe moves
 * the three layers at their own speeds (the sky slowest); the arriving photo opens upward inside
 * its frame and then slowly zooms (1 → 1.05, 6s). The section's light wash takes on each photo's
 * own colour. It turns by itself every 4 seconds; a touch stops it until 8 seconds of quiet.
 * A tap opens the photo full screen, growing out of its frame: swipe for the next, or down (or ×)
 * to close. Transform and opacity only; reduced motion: plain fades, nothing drifts.
 */

type Shown = Photo & { src: string };
const FALLBACK_TINT = "#8c735d";
const AUTO_MS = 4000;
const IDLE_MS = 8000;

/** Where a photo stands, by its distance from the centre (they loop: -3 … 3 for seven). */
function position(offset: number): string {
  if (offset === 0) return "c";
  return `${offset < 0 ? "l" : "r"}${Math.min(3, Math.abs(offset))}`;
}

/** How lit the moon is for photo i of n: a thin crescent first, full at the last. */
const phaseOf = (i: number, n: number) => (n > 1 ? 0.12 + (0.88 * i) / (n - 1) : 1);

/** A waxing moon of radius r, lit fraction f (0 … 1), lit on the right: the lit part's path. */
function litPath(r: number, f: number) {
  const k = Math.min(1, Math.max(0, f));
  const rx = Math.abs(1 - 2 * k) * r;
  return `M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${rx.toFixed(2)} ${r} 0 0 ${k < 0.5 ? 0 : 1} 0 ${-r}Z`;
}

const toRgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

export function Gallery() {
  const { gallery } = wedding;
  const photos = gallery.photos.filter((p): p is Shown => Boolean(p.src));
  const n = photos.length;
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.08 });
  const stageSeen = useInView(stageRef, { threshold: 0.25 });
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [viewing, setViewing] = useState<{ from: DOMRect } | null>(null);
  const [width, setWidth] = useState(0);
  // the wash: two layers, the newer fading in over the older
  const [wash, setWash] = useState<{ colors: [string, string]; front: 0 | 1 }>(() => ({
    colors: [photos[0]?.tint ?? FALLBACK_TINT, photos[0]?.tint ?? FALLBACK_TINT],
    front: 0,
  }));
  const lastTouch = useRef(0);
  const drag = useRef<{ x: number; y: number; dx: number; on: boolean; moved: boolean } | null>(null);
  const visible = useRef(false);

  const go = useCallback((dir: 1 | -1) => setActive((a) => (a + dir + n) % n), [n]);
  const offset = (i: number) => {
    let o = (i - active + n) % n;
    if (o > n / 2) o -= n;
    return o;
  };

  // the wash follows the photo
  useEffect(() => {
    const tint = photos[active]?.tint ?? FALLBACK_TINT;
    setWash((w) => {
      const back = (1 - w.front) as 0 | 1;
      const colors: [string, string] = [...w.colors];
      colors[back] = tint;
      return { colors, front: back };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // the stage's width, for the sky
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setWidth(stage.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  // is the gallery on screen (for the autoplay)?
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0.4 });
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  // it turns by itself every 4s while it is on screen; a touch holds it until 8s of quiet
  useEffect(() => {
    if (n < 2) return;
    const timer = window.setInterval(() => {
      if (!visible.current || viewing || document.hidden || drag.current) return;
      if (Date.now() - lastTouch.current < IDLE_MS) return;
      go(1);
    }, AUTO_MS);
    return () => clearInterval(timer);
  }, [n, viewing, go]);
  const touched = () => (lastTouch.current = Date.now());

  // a swipe: the photos follow the finger (centre 1x, sides 0.65x, the sky 0.3x), then turn or settle
  const setDrag = (dx: number, dragging: boolean) => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--drag", `${dx}px`);
    if (dragging) stage.setAttribute("data-dragging", "");
    else stage.removeAttribute("data-dragging");
  };
  const onPointerDown = (e: PointerEvent) => {
    touched();
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, dx: 0, on: false, moved: false };
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.on) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null; // a scroll, not a swipe
        return;
      }
      if (Math.abs(dx) < 8) return;
      d.on = true;
      d.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    const limit = (stageRef.current?.offsetWidth ?? 400) * 0.45;
    d.dx = Math.max(-limit, Math.min(limit, dx));
    setDrag(reduced ? 0 : d.dx, true);
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    setDrag(0, false);
    touched();
    if (d?.on && Math.abs(d.dx) > 48) go(d.dx < 0 ? 1 : -1);
    if (d?.moved) {
      // swallow the click that follows a swipe
      const stop = (ev: Event) => ev.stopPropagation();
      window.addEventListener("click", stop, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 50);
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      touched();
      go(e.key === "ArrowLeft" ? -1 : 1);
    }
  };

  if (!n) return null;
  const current = photos[active];
  const currentFrame = current.frame ?? "arch";
  const handwritten = currentFrame !== "arch";

  return (
    <section id="gallery" ref={sectionRef} aria-labelledby="gallery-heading" className="relative isolate px-[var(--gutter)] pt-[var(--section-gap)]">
      {/* the light wash, taking on the photo's colour */}
      <div aria-hidden className="cf-wash">
        {wash.colors.map((c, i) => (
          <span key={i} style={{ "--tint": toRgb(c), opacity: i === wash.front ? 1 : 0 } as CSSProperties} />
        ))}
      </div>

      <SectionHeading id="gallery-heading" eyebrow={gallery.eyebrow} title={gallery.title} intro={`“${gallery.intro}”`} show={seen} />

      <div className="cf">
        <div
          ref={stageRef}
          className="cf-stage"
          role="region"
          aria-roledescription="carousel"
          aria-label={`${gallery.title}: swipe or use the arrow keys`}
          tabIndex={0}
          onKeyDown={onKey}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          data-frame={currentFrame}
          data-shown={stageSeen || reduced || undefined}
          data-still={reduced || undefined}
        >
          {width > 0 && <Sky width={width} count={n} active={active} reduced={reduced} />}

          {photos.map((photo, i) => {
            const o = offset(i);
            const near = Math.abs(o) <= 1;
            const frame = photo.frame ?? "arch";
            return (
              <button
                key={photo.src}
                type="button"
                className="cf-card"
                data-pos={position(o)}
                data-active={o === 0 || undefined}
                data-frame={frame}
                tabIndex={near ? 0 : -1}
                aria-hidden={!near || undefined}
                aria-label={o === 0 ? `Open photo full screen: ${photo.alt}` : `Show the ${o < 0 ? "previous" : "next"} photo: ${photo.alt}`}
                onClick={(e) => {
                  touched();
                  if (o === 0) setViewing({ from: e.currentTarget.querySelector(".cf-photo")!.getBoundingClientRect() });
                  else setActive(i);
                }}
              >
                <span className="cf-frame">
                  <span className="cf-photo">
                    {/* softened, for the sides */}
                    <img className="cf-img-soft" src={photo.src} alt="" width={484} height={646} loading={Math.abs(o) <= 2 ? "eager" : "lazy"} decoding="async" draggable={false} style={{ objectPosition: photo.focus ?? "50% 40%" }} />
                    {/* sharp, opening upward when it comes to the centre */}
                    <span className="cf-reveal">
                      <span className="cf-reveal-in">
                        <img className="cf-img-sharp" src={photo.src} alt="" width={484} height={646} loading={Math.abs(o) <= 2 ? "eager" : "lazy"} decoding="async" draggable={false} style={{ objectPosition: photo.focus ?? "50% 40%" }} />
                      </span>
                    </span>
                  </span>
                  {frame === "polaroid" && <span className="cf-polaroid-words">{photo.caption}</span>}
                </span>
              </button>
            );
          })}

          {/* a small gold lotus above the centre frame, and sparkles at its corners */}
          <span aria-hidden className="cf-ornament">
            <svg viewBox="0 0 48 26" fill="none">
              <path d="M24 2C28 7 29 13 24 22C19 13 20 7 24 2Z" fill="url(#cf-orn)" stroke="#9c7a35" strokeWidth=".8" />
              <path d="M24 22C19 15 12 12 4 13C7 20 15 24 24 22Z" fill="url(#cf-orn)" stroke="#9c7a35" strokeWidth=".8" />
              <path d="M24 22C29 15 36 12 44 13C41 20 33 24 24 22Z" fill="url(#cf-orn)" stroke="#9c7a35" strokeWidth=".8" />
              <path d="M10 24C18 25 30 25 38 24" stroke="#b69a67" strokeWidth=".9" strokeLinecap="round" />
              <defs>
                <linearGradient id="cf-orn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#f3dca2" />
                  <stop offset="1" stopColor="#c99a4b" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          {!reduced && <Sparkles key={currentFrame} frame={currentFrame} />}
        </div>

        {/* the caption, a fine gold rule beneath; small arrows either side; the moons below */}
        <div className="cf-controls">
          <button type="button" className="cf-arrow" onClick={() => (touched(), go(-1))} aria-label="Previous photo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14.5 5.5L8 12l6.5 6.5" />
            </svg>
          </button>
          <div className="cf-caption" aria-live="polite">
            <p key={active} className={`cf-caption-text${handwritten ? " cf-caption-script" : ""}`}>
              {current.caption ?? current.alt}
            </p>
            <span aria-hidden className="cf-caption-rule" />
          </div>
          <button type="button" className="cf-arrow" onClick={() => (touched(), go(1))} aria-label="Next photo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9.5 5.5L16 12l-6.5 6.5" />
            </svg>
          </button>
        </div>
        <div className="cf-phases">
          {photos.map((p, i) => (
            <button key={p.src} type="button" className="cf-phase" data-on={i === active || undefined} onClick={() => (touched(), setActive(i))} aria-label={`Photo ${i + 1} of ${n}: ${p.caption ?? p.alt}`} aria-current={i === active || undefined}>
              <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden>
                <circle r="5.4" className="cf-phase-dark" />
                <path d={litPath(5.4, phaseOf(i, n))} className="cf-phase-lit" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {viewing && (
        <Viewer
          photos={photos}
          index={active}
          from={viewing.from}
          reduced={reduced}
          onStep={(dir) => (touched(), go(dir))}
          target={() => stageRef.current?.querySelector(".cf-card[data-active] .cf-photo")?.getBoundingClientRect() ?? null}
          onClosed={() => {
            touched();
            setViewing(null);
          }}
        />
      )}
    </section>
  );
}

/**
 * The thin gold crescent over the photos, and the moon on its outer curve: placed (and lit) by the
 * photo in the centre, gliding along the curve to the next place (700ms).
 */
function Sky({ width, count, active, reduced }: { width: number; count: number; active: number; reduced: boolean }) {
  const narrow = width < 620;
  const band = narrow ? 70 : 92;
  const chord = width * 0.86;
  const top = band * 0.16;
  const ends = band * 0.9;
  const sag = ends - top;
  const R = (chord * chord) / 4 / (2 * sag) + sag / 2;
  const cx = width / 2;
  const cy = top + R;
  const a0 = Math.atan2(ends - cy, -chord / 2);
  const a1 = Math.atan2(ends - cy, chord / 2);
  const at = (t: number) => {
    const a = a0 + t * (a1 - a0);
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  };
  const placeOf = (i: number) => (count > 1 ? 0.07 + (0.86 * i) / (count - 1) : 0.5);
  const innerSag = sag * 0.72;
  const Ri = (chord * chord) / 4 / (2 * innerSag) + innerSag / 2;
  const left = { x: cx - chord / 2, y: ends };
  const right = { x: cx + chord / 2, y: ends };
  const moonR = narrow ? 8.5 : 11;

  // the moon's place along the curve and its light, eased from where it was
  const [state, setState] = useState(() => ({ t: placeOf(active), f: phaseOf(active, count) }));
  const from = useRef(state);
  from.current = state;
  useEffect(() => {
    const target = { t: placeOf(active), f: phaseOf(active, count) };
    if (reduced) {
      setState(target);
      return;
    }
    const start = { ...from.current };
    let frame = 0;
    let t0 = 0;
    const step = (now: number) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / 700);
      const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      setState({ t: start.t + (target.t - start.t) * e, f: start.f + (target.f - start.f) * e });
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, count, reduced]);
  const moon = at(state.t);

  return (
    <svg aria-hidden className="cf-sky" width={width} height={band} viewBox={`0 0 ${width} ${band}`}>
      <defs>
        <radialGradient id="cf-moonglow">
          <stop offset="0" stopColor="#f6e2ad" stopOpacity="0.85" />
          <stop offset="1" stopColor="#f6e2ad" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cf-moonlit" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbedc4" />
          <stop offset="1" stopColor="#d6ad58" />
        </linearGradient>
      </defs>
      {/* the crescent: its outer curve, and a fainter inner one meeting it at the horns */}
      <path className="cf-crescent" d={`M${left.x} ${left.y}A${R} ${R} 0 0 1 ${right.x} ${right.y}`} pathLength={1} />
      <path className="cf-crescent cf-crescent-inner" d={`M${left.x} ${left.y}A${Ri} ${Ri} 0 0 1 ${right.x} ${right.y}`} pathLength={1} />
      <g className="cf-moon" transform={`translate(${moon.x.toFixed(1)} ${moon.y.toFixed(1)})`}>
        <circle r={moonR * 2.6} fill="url(#cf-moonglow)" />
        <circle r={moonR} className="cf-moon-dark" />
        <path d={litPath(moonR, state.f)} fill="url(#cf-moonlit)" />
      </g>
    </svg>
  );
}

/** A few gold sparkles around the centre frame's corners, each twinkling where it is, then somewhere new. */
const SPOTS: Record<string, Array<[number, number]>> = {
  arch: [[14, 14], [86, 14], [-2, 52], [102, 46], [3, 99], [97, 99]],
  moon: [[14, 24], [86, 24], [-1, 50], [101, 50], [14, 76], [86, 76]],
  polaroid: [[1, 2], [99, 3], [-2, 50], [102, 54], [2, 98], [98, 97]],
};
function Sparkles({ frame }: { frame: string }) {
  const spots = SPOTS[frame] ?? SPOTS.arch;
  const jitter = () => (Math.random() - 0.5) * 9;
  const [places, setPlaces] = useState(() => spots.map(([x, y]) => [x + jitter(), y + jitter()] as [number, number]));
  const moveOn = (i: number) => (e: AnimationEvent) => {
    if (e.animationName !== "cf-twinkle") return;
    setPlaces((p) => p.map((q, k) => (k === i ? [spots[k][0] + jitter(), spots[k][1] + jitter()] : q)));
  };
  return (
    <span aria-hidden className="cf-sparkles">
      {places.map(([x, y], i) => (
        <span
          key={i}
          className="cf-sparkle"
          onAnimationIteration={moveOn(i)}
          style={{ left: `${x}%`, top: `${y}%`, animationDuration: `${3.2 + ((i * 7) % 5) * 0.45}s`, animationDelay: `${-i * 0.9}s` }}
        />
      ))}
    </span>
  );
}

/**
 * Full screen, on a deep night-blue veil: the photo grows out of its frame; a swipe sideways turns
 * to the next (the carousel turns with it), a swipe down — or ×, or Escape — closes it back into
 * the frame. Focus returns, the page keeps its place.
 */
function Viewer({
  photos,
  index,
  from,
  reduced,
  onStep,
  target,
  onClosed,
}: {
  photos: Shown[];
  index: number;
  from: DOMRect;
  reduced: boolean;
  onStep: (dir: 1 | -1) => void;
  target: () => DOMRect | null;
  onClosed: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const [dir, setDir] = useState<1 | -1 | 0>(0);
  const closing = useRef(false);
  const touch = useRef<{ x: number; y: number; dy: number; mode: "" | "x" | "y" } | null>(null);
  useScrollLock(true);
  const photo = photos[index];

  /** The transform that lays the full-screen photo over a frame's rectangle. */
  const onto = (rect: DOMRect | null) => {
    const img = imgRef.current;
    if (!img || !rect) return "scale(0.92)";
    // measured where it rests, without whatever drag or flight it is in
    const [t, tr] = [img.style.transform, img.style.transition];
    img.style.transition = "none";
    img.style.transform = "none";
    const to = img.getBoundingClientRect();
    img.style.transform = t;
    void img.offsetWidth;
    img.style.transition = tr;
    const s = rect.width / to.width;
    const x = rect.left + rect.width / 2 - (to.left + to.width / 2);
    const y = rect.top + rect.height / 2 - (to.top + to.height / 2);
    return `translate(${x}px, ${y}px) scale(${s})`;
  };

  // open: show the dialog, start the photo over its frame, then let it grow to full size
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const img = imgRef.current;
    if (!dialog || !img) return;
    if (!dialog.open) dialog.showModal();
    const veil = veilRef.current!;
    if (reduced) {
      img.style.opacity = "0";
      veil.style.opacity = "0";
      requestAnimationFrame(() => {
        img.style.transition = veil.style.transition = "opacity 250ms linear";
        img.style.opacity = veil.style.opacity = "1";
      });
      return;
    }
    img.style.transition = "none";
    img.style.transform = onto(from);
    veil.style.opacity = "0";
    void img.offsetWidth;
    requestAnimationFrame(() => {
      img.style.transition = "transform 460ms cubic-bezier(0.22, 1, 0.36, 1)";
      img.style.transform = "none";
      veil.style.transition = "opacity 360ms ease-out";
      veil.style.opacity = "1";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const img = imgRef.current;
    const veil = veilRef.current;
    const dialog = dialogRef.current;
    const done = () => {
      const y = window.scrollY;
      dialog?.close();
      if (window.scrollY !== y) window.scrollTo({ top: y, behavior: "instant" });
      onClosed();
    };
    if (!img || !veil || reduced) {
      if (img) img.style.opacity = "0";
      if (veil) veil.style.opacity = "0";
      window.setTimeout(done, reduced ? 220 : 0);
      return;
    }
    img.style.transition = "transform 380ms cubic-bezier(0.4, 0, 0.2, 1), opacity 380ms ease";
    img.style.transform = onto(target());
    veil.style.transition = "opacity 340ms ease";
    veil.style.opacity = "0";
    window.setTimeout(done, 380);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, onClosed]);

  const step = useCallback(
    (d: 1 | -1) => {
      if (photos.length < 2) return;
      setDir(d);
      onStep(d);
    },
    [onStep, photos.length],
  );

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  // swipe sideways for the next, down to close (the photo follows the finger down, the veil thins)
  const down = (e: PointerEvent) => (touch.current = { x: e.clientX, y: e.clientY, dy: 0, mode: "" });
  const move = (e: PointerEvent) => {
    const t = touch.current;
    const img = imgRef.current;
    const veil = veilRef.current;
    if (!t || !img || !veil) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (!t.mode) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      t.mode = Math.abs(dy) > Math.abs(dx) && dy > 0 ? "y" : "x";
    }
    if (t.mode === "y" && !reduced) {
      t.dy = Math.max(0, dy);
      img.style.transition = "none";
      img.style.transform = `translateY(${t.dy}px) scale(${1 - Math.min(0.12, t.dy / 1600)})`;
      veil.style.transition = "none";
      veil.style.opacity = String(Math.max(0.3, 1 - t.dy / 420));
    }
  };
  const up = (e: PointerEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.clientX - t.x;
    if (t.mode === "y") {
      if (t.dy > 90) close();
      else {
        const img = imgRef.current!;
        const veil = veilRef.current!;
        img.style.transition = "transform 260ms ease-out";
        img.style.transform = "none";
        veil.style.transition = "opacity 260ms ease-out";
        veil.style.opacity = "1";
      }
    } else if (t.mode === "x" && Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  };

  const handwritten = (photo.frame ?? "arch") !== "arch";
  return (
    <dialog
      ref={dialogRef}
      aria-label="Photo"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      className="cf-viewer fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-transparent"
    >
      <div ref={veilRef} aria-hidden className="absolute inset-0 bg-navy-deep/[0.93]" onClick={close} />
      <figure className="cf-viewer-stage" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => (touch.current = null)}>
        {/* turned to, the photo slides in from the side the swipe came from */}
        <img
          key={index}
          ref={imgRef}
          src={photo.src}
          alt={photo.alt}
          width={484}
          height={646}
          draggable={false}
          className={`cf-viewer-img${dir !== 0 && !reduced ? " cf-viewer-enter" : ""}`}
          data-dir={dir}
        />
        <figcaption key={index} className={`cf-viewer-caption${handwritten ? " cf-caption-script" : ""}`}>
          {photo.caption}
        </figcaption>
        {photos.length > 1 && (
          <div className="cf-viewer-nav">
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="cf-viewer-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M14.5 5.5L8 12l6.5 6.5" />
              </svg>
            </button>
            <span aria-live="polite" className="cf-viewer-count">
              {index + 1} / {photos.length}
            </span>
            <button type="button" onClick={() => step(1)} aria-label="Next photo" className="cf-viewer-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9.5 5.5L16 12l-6.5 6.5" />
              </svg>
            </button>
          </div>
        )}
      </figure>
      <button type="button" onClick={close} aria-label="Close" className="cf-viewer-close" style={{ top: "calc(var(--status-bar, 0px) + 14px)" }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </dialog>
  );
}
