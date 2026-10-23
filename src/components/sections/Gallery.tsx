import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import type { Photo } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Sheet } from "@/components/ui/Sheet";

/**
 * Section 07 — "Crescent Moon Memories".
 *
 * Seven photos along a crescent moon drawn in a fine antique-gold line: the
 * couple's portrait at its widest part, three photos up each horn, the
 * moon's hollow left clean. On a phone the moon stands upright (☾), its
 * horns to the right; on a wide screen it lies on its back (◡), as on
 * Mahadev's jata.
 *
 * Once, as it comes into view: the outline draws itself from horn to horn,
 * the portrait fades in easing back from a slight zoom, then the six rise in
 * one by one along the curve, and last the two horn tips catch a soft gold
 * glint. Then it stays still. Any photo opens the lightbox (swipe, arrow
 * keys or the buttons); closing it returns to the same place.
 */

/** A layout on its own grid (w × h units): the slots tip to tip (the portrait is the middle one), the crescent, the glints. */
interface Moon {
  w: number;
  h: number;
  /** [centre x, centre y, width, height] */
  slots: Array<[number, number, number, number]>;
  /** the lit limb and the inner edge, each drawn from one horn tip to the other */
  outer: string;
  inner: string;
  /** the two together, closed: the moon's pale body */
  body: string;
  /** the two horn tips */
  tips: Array<[number, number]>;
  /** corner radius of the six smaller frames, and of the portrait arch's foot, in units */
  radius: number;
  foot: number;
  stroke: number;
}

/**
 * Upright, for phones: the moon's own shape — a half-ellipse limb and a narrower half-ellipse inner
 * edge sharing their tips — with each photo clear of the next and both horn tips showing.
 */
const UPRIGHT: Moon = {
  w: 366,
  h: 900,
  slots: [
    [290, 60, 82, 116],
    [192, 126, 88, 125],
    [105, 268, 94, 133],
    [74, 450, 148, 204],
    [105, 632, 94, 133],
    [192, 774, 88, 125],
    [290, 840, 82, 116],
  ],
  outer: "M365 46A364 404 0 0 0 365 854",
  inner: "M365 46A218.4 404 0 0 0 365 854",
  body: "M365 46A364 404 0 0 0 365 854A218.4 404 0 0 1 365 46Z",
  tips: [
    [365, 46],
    [365, 854],
  ],
  radius: 12,
  foot: 14,
  stroke: 1.25,
};

/** On its back, for wide screens: the same moon turned a quarter, horns up. */
const CRADLE: Moon = {
  w: 1110,
  h: 516,
  slots: [
    [62, 134, 124, 174],
    [208, 281, 131, 184],
    [362, 347, 140, 196],
    [555, 373, 210, 280],
    [748, 347, 140, 196],
    [902, 281, 131, 184],
    [1048, 134, 124, 174],
  ],
  outer: "M28.2 4A526.8 492 0 0 0 1081.8 4",
  inner: "M28.2 4A526.8 246 0 0 0 1081.8 4",
  body: "M28.2 4A526.8 492 0 0 0 1081.8 4A526.8 246 0 0 1 28.2 4Z",
  tips: [
    [28.2, 4],
    [1081.8, 4],
  ],
  radius: 18,
  foot: 20,
  stroke: 1.6,
};

const WIDE_QUERY = "(min-width: 1000px)";

/** Reveal timing (ms after the moon comes into view). */
const T = { portrait: 700, firstOfSix: 1250, step: 150, glint: 2700 } as const;

export function Gallery() {
  const { gallery } = wedding;
  const sectionRef = useRef<HTMLElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.08 });
  const moonSeen = useInView(moonRef, { threshold: 0.12 });
  const reduced = usePrefersReducedMotion();
  const wide = useMediaQuery(WIDE_QUERY);
  const [open, setOpen] = useState<number | null>(null);

  const moon = wide ? CRADLE : UPRIGHT;
  // tip to tip along the curve, the portrait in the middle — also the lightbox's order
  const [portrait, ...rest] = gallery.photos;
  const along = [rest[0], rest[1], rest[2], portrait, rest[3], rest[4], rest[5]];
  const viewable = along.filter((p): p is Photo => Boolean(p?.src));
  const show = moonSeen || reduced;

  return (
    <section id="gallery" ref={sectionRef} aria-labelledby="gallery-heading" className="relative px-[var(--gutter)] pt-[var(--section-gap)]">
      <SectionHeading id="gallery-heading" eyebrow={gallery.eyebrow} title={gallery.title} intro={gallery.intro} show={seen} />

      <div className="gallery-stage">
        <div
          ref={moonRef}
          className="gallery-moon"
          data-layout={wide ? "cradle" : "upright"}
          data-shown={show || undefined}
          data-still={reduced || undefined}
          style={{ aspectRatio: `${moon.w} / ${moon.h}` }}
        >
          <svg aria-hidden className="gallery-moon-art" viewBox={`0 0 ${moon.w} ${moon.h}`} fill="none">
            {/* the moon's pale body, then its fine gold edges */}
            <path className="gallery-moon-body" d={moon.body} />
            <path className="gallery-moon-line" d={moon.outer} pathLength={1} strokeWidth={moon.stroke} />
            <path className="gallery-moon-line" d={moon.inner} pathLength={1} strokeWidth={moon.stroke} />
            {moon.tips.map(([x, y]) => (
              <g key={`${x}-${y}`} className="gallery-glint" transform={`translate(${x} ${y})`}>
                <circle r={moon.stroke * 9} fill="url(#gallery-glow)" />
                <path d="M0 -5.5C.6 -1.4 1.4 -.6 5.5 0C1.4 .6 .6 1.4 0 5.5C-.6 1.4 -1.4 .6 -5.5 0C-1.4 -.6 -.6 -1.4 0 -5.5Z" fill="#c9ab6e" />
              </g>
            ))}
            <defs>
              <radialGradient id="gallery-glow">
                <stop offset="0" stopColor="#e3c98f" stopOpacity="0.75" />
                <stop offset="1" stopColor="#e3c98f" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>

          {along.map((photo, i) => {
            if (!photo) return null;
            const [cx, cy, w, h] = moon.slots[i];
            const isPortrait = i === 3;
            const order = i < 3 ? i : i - 1; // the six, one by one along the curve
            const cqw = (units: number) => `${((units / moon.w) * 100).toFixed(2)}cqw`;
            const style = {
              left: `${((cx - w / 2) / moon.w) * 100}%`,
              top: `${((cy - h / 2) / moon.h) * 100}%`,
              width: `${(w / moon.w) * 100}%`,
              height: `${(h / moon.h) * 100}%`,
              // the portrait in a round-topped arch; the six softly rounded
              "--r": cqw(isPortrait ? w / 2 : moon.radius),
              "--foot": cqw(isPortrait ? moon.foot : moon.radius),
              "--delay": `${isPortrait ? T.portrait : T.firstOfSix + order * T.step}ms`,
            } as CSSProperties;
            return (
              <Frame
                key={`${photo.alt}-${i}`}
                photo={photo}
                portrait={isPortrait}
                style={style}
                onOpen={photo.src ? () => setOpen(viewable.indexOf(photo)) : undefined}
              />
            );
          })}
        </div>
      </div>

      <Lightbox photos={viewable} index={open} onIndex={setOpen} />
    </section>
  );
}

function Frame({ photo, portrait, style, onOpen }: { photo: Photo; portrait: boolean; style: CSSProperties; onOpen?: () => void }) {
  const image = photo.src ? (
    <img
      src={photo.src}
      alt={onOpen ? "" : photo.alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      className="gallery-frame-img"
      style={{ objectPosition: photo.focus ?? "50% 30%" }}
    />
  ) : (
    <span role="img" aria-label={`${photo.alt} (photo to come)`} className="gallery-frame-img" />
  );
  const className = `gallery-frame${portrait ? " gallery-frame-portrait" : ""}`;
  return onOpen ? (
    <button type="button" className={className} style={style} onClick={onOpen} aria-label={`Open photo: ${photo.alt}`}>
      <span className="gallery-frame-inner">{image}</span>
    </button>
  ) : (
    <div className={className} style={style}>
      <span className="gallery-frame-inner">{image}</span>
    </div>
  );
}

function Lightbox({
  photos,
  index,
  onIndex,
}: {
  photos: Photo[];
  index: number | null;
  onIndex: (i: number | null) => void;
}) {
  const [shown, setShown] = useState(0);
  const touchX = useRef<number | null>(null);
  if (index !== null && index !== shown) setShown(index);
  const photo = photos[shown];

  const go = useCallback(
    (dir: 1 | -1) => {
      if (index === null || photos.length < 2) return;
      onIndex((index + dir + photos.length) % photos.length);
    },
    [index, onIndex, photos.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  if (!photo) return null;
  return (
    <Sheet open={index !== null} onClose={() => onIndex(null)} label="Photo" variant="lightbox">
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
          src={photo.src!}
          alt={photo.alt}
          className="gallery-lightbox-img max-h-[72dvh] max-w-[92vw] rounded-[18px] border border-gold/60 object-contain"
        />
        {photo.caption && (
          <figcaption className="mt-3 font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-ivory/85">
            {photo.caption}
          </figcaption>
        )}
        {photos.length > 1 && (
          <div className="mt-4 flex items-center gap-6 text-ivory">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/40"
            >
              <span aria-hidden className="text-[22px] leading-none">
                ‹
              </span>
            </button>
            <span aria-live="polite" className="font-sans text-[12px] tracking-[0.2em] text-ivory/70">
              {shown + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/40"
            >
              <span aria-hidden className="text-[22px] leading-none">
                ›
              </span>
            </button>
          </div>
        )}
      </figure>
    </Sheet>
  );
}
