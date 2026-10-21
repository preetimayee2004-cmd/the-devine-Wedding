import type { CSSProperties } from "react";
import type { Motif, Photo } from "@/config/types";
import { EASE } from "@/lib/motion";
import { Icon } from "@/components/art/Icons";

export type FrameShape = "arch" | "round";

const SHAPES: Record<FrameShape, { outer: string; inner: string }> = {
  arch: { outer: "rounded-t-full rounded-b-[22px]", inner: "rounded-t-full rounded-b-[17px]" },
  round: { outer: "rounded-[26px]", inner: "rounded-[21px]" },
};

/** Soft watercolour washes for photo slots that are still waiting for a photo. */
const WASHES = [
  "radial-gradient(circle at 28% 24%, #fff 0, transparent 55%), radial-gradient(circle at 72% 78%, rgb(168 227 247 / 0.95), transparent 62%), #e6f5fc",
  "radial-gradient(circle at 70% 26%, #fff 0, transparent 52%), radial-gradient(circle at 28% 76%, rgb(246 205 196 / 0.9), transparent 62%), #fbefe9",
  "radial-gradient(circle at 30% 70%, #fff 0, transparent 50%), radial-gradient(circle at 72% 30%, rgb(240 214 160 / 0.85), transparent 62%), #fbf3e3",
  "radial-gradient(circle at 66% 70%, #fff 0, transparent 52%), radial-gradient(circle at 30% 30%, rgb(196 222 200 / 0.9), transparent 62%), #edf5ec",
];

interface PhotoFrameProps {
  photo: Photo;
  shape?: FrameShape;
  /** Enters with a gentle zoom-out when this turns true. */
  show: boolean;
  delay?: number;
  /** Which wash a placeholder uses (cycles). */
  tint?: number;
  /** The gold ornament on a placeholder. */
  motif?: Motif;
  className?: string;
  /** Makes a real photo tappable (gallery lightbox). */
  onOpen?: () => void;
}

/**
 * A photograph in a fine gold double frame. Until the couple adds the real
 * photo (`src: null`), a soft watercolour wash with a gold ornament holds
 * its place, so the page never shows an empty box.
 */
export function PhotoFrame({
  photo,
  shape = "round",
  show,
  delay = 0,
  tint = 0,
  motif = "lotus",
  className = "",
  onOpen,
}: PhotoFrameProps) {
  const s = SHAPES[shape];
  const enter: CSSProperties = {
    transform: show ? "scale(1)" : "scale(1.08)",
    transition: `transform 1600ms ${EASE.silk} ${delay}ms`,
  };

  const inner = photo.src ? (
    <img
      src={photo.src}
      alt={photo.alt}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover"
      style={enter}
      draggable={false}
    />
  ) : (
    <div
      role="img"
      aria-label={`${photo.alt} (photo to come)`}
      className="flex h-full w-full items-center justify-center"
      style={{ ...enter, background: WASHES[tint % WASHES.length] }}
    >
      <Icon name={motif} className="h-[26%] w-[26%] text-gold-ink/60" strokeWidth={1} />
    </div>
  );

  return (
    <div
      className={`relative border border-gold/70 bg-ivory/60 p-[5px] shadow-[0_16px_34px_-24px_rgb(23_59_86/0.5)] ${s.outer} ${className}`}
      style={{ opacity: show ? 1 : 0, transition: `opacity 900ms ease-out ${delay}ms` }}
    >
      <div className={`relative h-full w-full overflow-hidden ${s.inner}`}>
        {onOpen && photo.src ? (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Open photo: ${photo.alt}`}
            className="block h-full w-full"
          >
            {inner}
          </button>
        ) : (
          inner
        )}
      </div>
    </div>
  );
}
