import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { wedding } from "@/config/wedding";
import type { Photo } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Sheet } from "@/components/ui/Sheet";

/**
 * Section 07 — "Our Gallery": a celestial coverflow.
 *
 * The couple's portrait large in the centre, in a softly domed frame with a
 * fine double antique-gold edge; the photos before and after it tucked in on
 * either side, a little smaller and turned in 3D (less so on a phone). Over
 * them arcs a gold constellation, one star for each photo: the star of the
 * photo in the centre glows, with the two lines that meet it.
 *
 * The arrows, a tap on a side photo, a swipe or the arrow keys turn the
 * carousel (680ms; it never moves by itself, and loops). The photo arriving in
 * the centre catches a brief gold glint on its frame, and its caption rises in
 * beneath. A tap on the centre photo opens it full screen; the lightbox and the
 * carousel share their place, so closing it leaves the carousel on the photo
 * last seen. The constellation draws itself once, as the gallery comes into
 * view. Reduced motion: the photos change places at once, nothing glints.
 */

type Shown = Photo & { src: string };

/** Where a photo stands, by its distance from the centre (they loop, so that is -3 … 3 for seven). */
function position(offset: number): string {
  if (offset === 0) return "c";
  return `${offset < 0 ? "l" : "r"}${Math.min(3, Math.abs(offset))}`;
}

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
  const [viewing, setViewing] = useState(false);
  const [width, setWidth] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((dir: 1 | -1) => setActive((a) => (a + dir + n) % n), [n]);
  const offset = (i: number) => {
    let o = (i - active + n) % n;
    if (o > n / 2) o -= n;
    return o;
  };

  // the constellation is laid out on the stage's real width
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setWidth(stage.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
  };

  if (!n) return null;
  const current = photos[active];

  return (
    <section id="gallery" ref={sectionRef} aria-labelledby="gallery-heading" className="relative px-[var(--gutter)] pt-[var(--section-gap)]">
      <SectionHeading id="gallery-heading" eyebrow={gallery.eyebrow} title={gallery.title} intro={`“${gallery.intro}”`} show={seen} />

      <div className="cf">
        <div
          ref={stageRef}
          className="cf-stage"
          role="region"
          aria-roledescription="carousel"
          aria-label={`${gallery.title}: use the arrow keys to turn`}
          tabIndex={0}
          onKeyDown={onKey}
          onTouchStart={(e) => {
            touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }}
          onTouchEnd={(e) => {
            const start = touch.current;
            touch.current = null;
            if (!start) return;
            const dx = e.changedTouches[0].clientX - start.x;
            const dy = e.changedTouches[0].clientY - start.y;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
          }}
          data-shown={stageSeen || reduced || undefined}
          data-still={reduced || undefined}
        >
          {/* moonlight behind the centre */}
          <span aria-hidden className="cf-moonlight" />
          {width > 0 && <Constellation width={width} count={n} active={active} />}

          {photos.map((photo, i) => {
            const o = offset(i);
            const near = Math.abs(o) <= 1;
            return (
              <button
                key={photo.src}
                type="button"
                className="cf-card"
                data-pos={position(o)}
                data-active={o === 0 || undefined}
                tabIndex={near ? 0 : -1}
                aria-hidden={!near || undefined}
                aria-label={o === 0 ? `Open photo full screen: ${photo.alt}` : `Show the ${o < 0 ? "previous" : "next"} photo: ${photo.alt}`}
                onClick={() => (o === 0 ? setViewing(true) : setActive(i))}
              >
                <span className="cf-frame">
                  <span className="cf-photo">
                    <img
                      src={photo.src}
                      alt=""
                      width={484}
                      height={646}
                      loading={Math.abs(o) <= 2 ? "eager" : "lazy"}
                      decoding="async"
                      draggable={false}
                      style={{ objectPosition: photo.focus ?? "50% 40%" }}
                    />
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* the arrows either side of the caption */}
        <div className="cf-controls">
          <button type="button" className="cf-arrow" onClick={() => go(-1)} aria-label="Previous photo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14.5 5.5L8 12l6.5 6.5" />
            </svg>
          </button>
          <div className="cf-caption" aria-live="polite">
            <p key={active} className="cf-caption-text">
              {current.caption ?? current.alt}
            </p>
            <p className="cf-count">
              {String(active + 1).padStart(2, "0")} <span aria-hidden>·</span> {String(n).padStart(2, "0")}
            </p>
          </div>
          <button type="button" className="cf-arrow" onClick={() => go(1)} aria-label="Next photo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9.5 5.5L16 12l-6.5 6.5" />
            </svg>
          </button>
        </div>
      </div>

      <Lightbox photos={photos} index={viewing ? active : null} onStep={go} onClose={() => setViewing(false)} />
    </section>
  );
}

/** Small irregularities, so the stars sit like a constellation rather than on a ruled curve (px). */
const JITTER = [3, -5, 2, -3, 4, -2, 5, -4, 3];

/**
 * One star for each photo, on an arc over the carousel, joined by fine gold lines. The first photo's
 * star is the middle one; the photos before it lie to the left, those after it to the right — as
 * the carousel stands at first. The star of the photo in the centre glows, with the lines that meet it.
 */
function Constellation({ width, count, active }: { width: number; count: number; active: number }) {
  const narrow = width < 620;
  const band = narrow ? 64 : 88;
  const mid = Math.floor(count / 2);
  const stars = Array.from({ length: count }, (_, s) => {
    const t = count > 1 ? s / (count - 1) : 0.5;
    const arc = (2 * t - 1) ** 2; // 0 in the middle, 1 at the ends
    return { x: width * (0.07 + 0.86 * t), y: band * (0.22 + 0.5 * arc) + JITTER[s % JITTER.length] * (narrow ? 0.7 : 1) };
  });
  const lit = (active + mid) % count;
  return (
    <svg aria-hidden className="cf-sky" width={width} height={band} viewBox={`0 0 ${width} ${band}`}>
      <defs>
        <radialGradient id="cf-star-glow">
          <stop offset="0" stopColor="#f3dca2" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f3dca2" stopOpacity="0" />
        </radialGradient>
      </defs>
      {stars.slice(1).map((b, s) => {
        const a = stars[s];
        return (
          <line
            key={s}
            className="cf-seg"
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            pathLength={1}
            data-lit={s === lit || s + 1 === lit || undefined}
            style={{ "--i": s } as CSSProperties}
          />
        );
      })}
      {stars.map(({ x, y }, s) => (
        <g key={s} className="cf-star" transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} data-active={s === lit || undefined} style={{ "--i": s } as CSSProperties}>
          <circle className="cf-star-glow" r={13} fill="url(#cf-star-glow)" />
          <path className="cf-star-spark" d="M0 -6.5C.7 -1.6 1.6 -.7 6.5 0C1.6 .7 .7 1.6 0 6.5C-.7 1.6 -1.6 .7 -6.5 0C-1.6 -.7 -.7 -1.6 0 -6.5Z" />
          <circle className="cf-star-dot" r={1.9} />
        </g>
      ))}
    </svg>
  );
}

/** Full screen, on a deep night-blue veil; it turns the carousel itself, so the two stay together. */
function Lightbox({ photos, index, onStep, onClose }: { photos: Shown[]; index: number | null; onStep: (dir: 1 | -1) => void; onClose: () => void }) {
  const [shown, setShown] = useState(0);
  const touchX = useRef<number | null>(null);
  if (index !== null && index !== shown) setShown(index);
  const photo = photos[shown];

  const open = index !== null;
  const go = useCallback(
    (dir: 1 | -1) => {
      if (open && photos.length > 1) onStep(dir);
    },
    [open, onStep, photos.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  if (!photo) return null;
  return (
    <Sheet open={open} onClose={onClose} label="Photo" variant="lightbox">
      <figure
        className="flex flex-col items-center"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <img
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          className="gallery-lightbox-img h-auto max-h-[72dvh] w-[min(92vw,calc(72dvh*0.75))] rounded-[18px] border border-gold/60 object-contain"
        />
        {photo.caption && (
          <figcaption className="mt-3 font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-ivory/85">{photo.caption}</figcaption>
        )}
        {photos.length > 1 && (
          <div className="mt-4 flex items-center gap-6 text-ivory">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/60 text-gold"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M14.5 5.5L8 12l6.5 6.5" />
              </svg>
            </button>
            <span aria-live="polite" className="font-sans text-[12px] tracking-[0.2em] text-ivory/70">
              {shown + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/60 text-gold"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9.5 5.5L16 12l-6.5 6.5" />
              </svg>
            </button>
          </div>
        )}
      </figure>
    </Sheet>
  );
}
