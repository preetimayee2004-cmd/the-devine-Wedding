import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
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
 * Section 07 — "Our Gallery": a simple slideshow.
 *
 * One large photo in a softly domed frame with a fine double gold edge; under it its caption and
 * seven small dots (the one shown in deep navy). A swipe or a dot changes the photo — and every
 * 4 seconds it changes by itself while on screen (a touch holds it until 8 seconds of quiet).
 *
 * The change: the photo shown splits into seven upright strips which lift away one by one, 70ms
 * apart — left to right going forward, right to left going back — showing the next photo beneath
 * (about 0.9s; swipes meanwhile are ignored). The new photo then zooms slowly (1 → 1.05 over 6s)
 * and its caption rises in. A tap opens it full screen. Transform and opacity only; the next
 * photo is loaded before it is needed. Reduced motion, or a slow phone: a plain crossfade.
 */

type Shown = Photo & { src: string };
const STRIPS = 7;
const AUTO_MS = 4000;
const IDLE_MS = 8000;
/** The change (ms): the last strip lifts away by ~840ms. */
const TURN_MS = 950;
const FADE_MS = 450;

/** A phone too slow for the strips gets the plain crossfade. */
const slowDevice = () => {
  const n = navigator as Navigator & { deviceMemory?: number };
  return (n.hardwareConcurrency ?? 8) <= 2 || (n.deviceMemory ?? 8) <= 1;
};

/** Load (and decode) a photo before it is shown. */
function ready(src: string) {
  const im = new Image();
  im.src = src;
  return im.decode().catch(() => undefined);
}

export function Gallery() {
  const { gallery } = wedding;
  const photos = gallery.photos.filter((p): p is Shown => Boolean(p.src));
  const n = photos.length;
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.08 });
  const stageSeen = useInView(stageRef, { threshold: 0.2 });
  const reduced = usePrefersReducedMotion();
  const [simple] = useState(() => slowDevice());
  const plain = reduced || simple;
  const [active, setActive] = useState(0);
  // a change under way: the photo that was, the way the strips go (1: left to right), its zoom then
  const [turn, setTurn] = useState<{ from: number; dir: 1 | -1; n: number; scale: number } | null>(null);
  const [viewing, setViewing] = useState<{ from: DOMRect } | null>(null);
  const busy = useRef(false);
  const count = useRef(0);
  const lastTouch = useRef(0);
  const visible = useRef(false);
  const touch = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  const go = useCallback(
    async (to: number, dir: 1 | -1) => {
      const from = activeRef.current;
      if (busy.current || n < 2 || to === from) return;
      busy.current = true;
      await ready(photos[to].src);
      // the shown photo's slow zoom at this moment, so its strips start exactly where it is
      const m = imgRef.current ? new DOMMatrix(getComputedStyle(imgRef.current).transform) : null;
      count.current += 1;
      setTurn({ from, dir, n: count.current, scale: m ? m.a : 1 });
      setActive(to);
      window.setTimeout(
        () => {
          setTurn(null);
          busy.current = false;
        },
        plain ? FADE_MS : TURN_MS,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [n, plain],
  );
  const step = useCallback((dir: 1 | -1) => go((activeRef.current + dir + n) % n, dir), [go, n]);
  const touched = () => (lastTouch.current = Date.now());

  // the next photo, loaded ahead
  useEffect(() => {
    if (n > 1) void ready(photos[(active + 1) % n].src);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, n]);

  // on screen? (for the autoplay)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0.4 });
    io.observe(stage);
    return () => io.disconnect();
  }, []);
  // every 4s while on screen; a touch holds it until 8s of quiet
  useEffect(() => {
    if (n < 2) return;
    const timer = window.setInterval(() => {
      if (!visible.current || viewing || document.hidden || touch.current) return;
      if (Date.now() - lastTouch.current < IDLE_MS) return;
      step(1);
    }, AUTO_MS);
    return () => clearInterval(timer);
  }, [n, viewing, step]);

  // a swipe: left for the next, right for the one before; a tap opens the photo full screen
  const onPointerDown = (e: PointerEvent) => {
    touched();
    touch.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onPointerMove = (e: PointerEvent) => {
    const t = touch.current;
    if (t && (Math.abs(e.clientX - t.x) > 10 || Math.abs(e.clientY - t.y) > 10)) t.moved = true;
  };
  const onPointerUp = (e: PointerEvent) => {
    const t = touch.current;
    touch.current = null;
    touched();
    if (!t) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    else if (!t.moved && !busy.current) {
      const r = stageRef.current?.querySelector(".ss-photo")?.getBoundingClientRect();
      if (r) setViewing({ from: r });
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      touched();
      step(e.key === "ArrowLeft" ? -1 : 1);
    } else if (e.key === "Enter") {
      const r = stageRef.current?.querySelector(".ss-photo")?.getBoundingClientRect();
      if (r) setViewing({ from: r });
    }
  };

  if (!n) return null;
  const photo = photos[active];
  const old = turn ? photos[turn.from] : null;

  return (
    <section id="gallery" ref={sectionRef} aria-labelledby="gallery-heading" className="relative px-[var(--gutter)] pb-4 pt-[var(--section-gap)]">
      <SectionHeading id="gallery-heading" eyebrow={gallery.eyebrow} title={gallery.title} intro={`“${gallery.intro}”`} show={seen} />

      <div className="ss" data-shown={stageSeen || reduced || undefined}>
        <div
          ref={stageRef}
          className="ss-stage"
          role="region"
          aria-roledescription="slideshow"
          aria-label={`${gallery.title}: swipe, or use the arrow keys; Enter opens the photo`}
          tabIndex={0}
          onKeyDown={onKey}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (touch.current = null)}
        >
          <div className="ss-frame">
            <div className="ss-photo">
              {/* the photo shown: zooming slowly */}
              <img
                key={active}
                ref={imgRef}
                className="ss-img"
                src={photo.src}
                alt={photo.alt}
                width={484}
                height={646}
                decoding="async"
                draggable={false}
                style={{ objectPosition: photo.focus ?? "50% 40%" }}
                data-still={plain || undefined}
              />
              {/* the photo that was: lifting away in strips (or simply fading) */}
              {old && turn && !plain && (
                <div key={`s${turn.n}`} aria-hidden className="ss-strips" style={{ transform: `scale(${turn.scale})` }}>
                  {Array.from({ length: STRIPS }, (_, i) => {
                    const order = turn.dir === 1 ? i : STRIPS - 1 - i;
                    return (
                      <span
                        key={i}
                        className="ss-strip"
                        style={
                          {
                            left: `calc(${i} * 100% / ${STRIPS})`,
                            backgroundImage: `url(${old.src})`,
                            backgroundPosition: `calc(${i} * -100cqw / ${STRIPS}) ${(old.focus ?? "50% 40%").split(" ")[1] ?? "40%"}`,
                            animationDelay: `${order * 70}ms`,
                          } as CSSProperties
                        }
                      />
                    );
                  })}
                </div>
              )}
              {old && turn && plain && (
                <img key={`f${turn.n}`} aria-hidden className="ss-img ss-fade-out" src={old.src} alt="" style={{ objectPosition: old.focus ?? "50% 40%" }} />
              )}
            </div>
          </div>
        </div>

        <p key={active} className="ss-caption" aria-live="polite" data-still={plain || undefined}>
          {photo.caption ?? photo.alt}
        </p>
        <div className="ss-dots">
          {photos.map((p, i) => (
            <button
              key={p.src}
              type="button"
              className="ss-dot"
              data-on={i === active || undefined}
              aria-label={`Photo ${i + 1} of ${n}: ${p.caption ?? p.alt}`}
              aria-current={i === active || undefined}
              onClick={() => {
                touched();
                go(i, i > active ? 1 : -1);
              }}
            >
              <span />
            </button>
          ))}
        </div>
      </div>

      {viewing && (
        <Viewer
          photos={photos}
          index={active}
          from={viewing.from}
          reduced={plain}
          onStep={(dir) => {
            touched();
            step(dir);
          }}
          target={() => stageRef.current?.querySelector(".ss-photo")?.getBoundingClientRect() ?? null}
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
        <figcaption key={index} className="cf-viewer-caption">
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
