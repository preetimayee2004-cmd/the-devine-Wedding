import { useCallback, useEffect, useRef, useState } from "react";
import { wedding } from "@/config/wedding";
import type { Photo } from "@/config/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Sheet } from "@/components/ui/Sheet";

/**
 * Section 07 — moments to remember (PRD §4).
 *
 * The families' arch becomes the first, prominent frame; smaller rounded
 * frames follow in a staggered sequence, each easing back from a slight zoom.
 * Real photos open in a lightbox (swipe, arrow keys, or the buttons).
 * Slots still waiting for a photo show a soft watercolour wash instead.
 */
const MOTIFS = ["lotus", "diya", "crescent", "kalash"] as const;

export function Gallery() {
  const { gallery } = wedding;
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const seen = useInView(sectionRef, { threshold: 0.08 });
  const gridSeen = useInView(gridRef, { threshold: 0.15 });
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState<number | null>(null);

  const [first, ...rest] = gallery.photos;
  const viewable = gallery.photos.filter((p) => p.src);
  const openPhoto = (p: Photo) => setOpen(viewable.indexOf(p));
  const step = (ms: number, i: number) => (reduced ? 0 : ms * i);

  return (
    <section id="gallery" ref={sectionRef} aria-labelledby="gallery-heading" className="relative px-[var(--gutter)] pt-[var(--section-gap)]">
      <SectionHeading id="gallery-heading" eyebrow={gallery.eyebrow} title={gallery.title} show={seen} />

      <div ref={gridRef} className="mt-8">
        {first && (
          <figure className="mx-auto w-[82%]">
            <PhotoFrame
              photo={first}
              shape="arch"
              show={gridSeen}
              className="aspect-[4/5] w-full"
              onOpen={() => openPhoto(first)}
            />
            {first.caption && <Caption show={gridSeen} delay={step(1, 300)} text={first.caption} />}
          </figure>
        )}
        <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4">
          {rest.map((p, i) => (
            <figure key={`${p.alt}-${i}`}>
              <PhotoFrame
                photo={p}
                show={gridSeen}
                delay={step(140, i + 2)}
                tint={i + 1}
                motif={MOTIFS[i % MOTIFS.length]}
                className="aspect-square w-full"
                onOpen={() => openPhoto(p)}
              />
              {p.caption && <Caption show={gridSeen} delay={step(140, i + 3)} text={p.caption} />}
            </figure>
          ))}
        </div>
      </div>

      <Lightbox photos={viewable} index={open} onIndex={setOpen} />
    </section>
  );
}

function Caption({ show, delay, text }: { show: boolean; delay: number; text: string }) {
  return (
    <Reveal
      show={show}
      delay={delay}
      as="figcaption"
      className="mt-2 text-center font-sans text-[10.5px] font-medium uppercase tracking-[0.22em] text-slate"
    >
      {text}
    </Reveal>
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
          className="max-h-[74dvh] max-w-[92vw] rounded-[18px] border border-gold/60 bg-ivory/10 object-contain"
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
            <span className="font-sans text-[12px] tracking-[0.2em] text-ivory/70">
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
