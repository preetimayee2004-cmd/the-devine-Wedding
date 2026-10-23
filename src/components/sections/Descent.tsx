import { useEffect, useRef, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

/**
 * From the Save the Date down to the couple section: "Kailash se Mandir", a
 * descent that follows the scroll (scrubbed, never on a timer) — vertical only.
 *
 *   The Himalaya drifts up slowly and a little to the left, Mahadev and Maa
 *   Parvati a little faster, both fading; the blessing panel melts away; soft
 *   clouds in three layers pass across at their own speeds (the only movement
 *   to the side); a few petals fall; and the couple section's arch rises 60px
 *   into place, then its scene as it comes up the screen. The sky behind
 *   is one fixed layer, so there is no line between the two screens.
 *
 * It writes transform and opacity straight onto the elements tagged
 * data-descent="…" in the two sections, once per frame. With reduced motion it
 * does nothing (the couple section then simply fades in).
 */

/** Cloud layers: where they cross (% of the screen down), how wide, from and to (% of their own
 * width, sideways), how strong at their fullest, how far they lift (px), and which way they face. */
const CLOUDS = [
  { top: 12, width: 120, from: -62, to: 18, peak: 0.65, lift: 30, flip: false },
  { top: 42, width: 110, from: 36, to: -52, peak: 0.85, lift: 70, flip: true },
  { top: 68, width: 150, from: -72, to: 30, peak: 0.95, lift: 120, flip: false },
] as const;

/** Petals: across (%), when each starts falling (in the descent's 0–1), how fast, sway (px), spin (deg), size (px). */
const PETALS = [
  [12, 0.02, 1.35, 14, 260, 11],
  [29, 0.12, 1.2, -12, -220, 9],
  [47, 0.05, 1.45, 10, 300, 10],
  [64, 0.17, 1.25, -16, -260, 12],
  [80, 0.08, 1.4, 12, 240, 9],
  [91, 0.22, 1.3, -10, -200, 10],
  [37, 0.28, 1.5, 14, 280, 8],
] as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** 0 → 1 → 0 across a…peak…b */
const bump = (a: number, peak: number, b: number, v: number) =>
  v <= a || v >= b ? 0 : v < peak ? smooth(a, peak, v) : 1 - smooth(peak, b, v);

/** An element's top in the document, ignoring any transform on it. */
function docTop(el: HTMLElement) {
  let y = 0;
  for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement | null) y += e.offsetTop;
  return y;
}

export function Descent() {
  const reduced = usePrefersReducedMotion();
  const overlay = useRef<HTMLDivElement>(null);
  const clouds = useRef<Array<HTMLImageElement | null>>([]);
  const petals = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    if (reduced) return;
    const section = document.getElementById("invitation");
    if (!section) return;
    const tagged = (name: string) => document.querySelector<HTMLElement>(`[data-descent="${name}"]`);
    const back = tagged("back");
    const figures = tagged("figures");
    const foot = tagged("foot");
    const arch = tagged("arch");
    const scene = tagged("scene");
    const copies = (layer: HTMLElement | null) => [
      layer?.querySelector<HTMLElement>(".std-solid") ?? null,
      layer?.querySelector<HTMLElement>(".std-soft") ?? null,
    ];
    const [backSolid, backSoft] = copies(back);
    const [figSolid, figSoft] = copies(figures);
    const moving = [back, figures, arch, scene];

    let top = 0;
    let height = 1;
    let sceneTop = 0;
    let vh = window.innerHeight;
    const measure = () => {
      top = docTop(section);
      height = section.offsetHeight || 1;
      sceneTop = scene ? docTop(scene) : 0;
      vh = window.innerHeight;
    };

    let frame = 0;
    let active: boolean | null = null;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const p = clamp01((y - top) / height);
      const s = p * height;
      const on = p > 0.001 && p < 0.999;
      if (on !== active) {
        active = on;
        moving.forEach((el) => el && (el.style.willChange = on ? "transform, opacity" : "auto"));
        overlay.current?.toggleAttribute("data-on", on);
      }

      // the Himalaya rises slowly (0.58× the scroll) drifting a little left; the figures faster (0.82×)
      if (back) {
        back.style.transform = `translate3d(${(-p * 16).toFixed(2)}px, ${(s * 0.42).toFixed(1)}px, 0)`;
        back.style.opacity = String(1 - smooth(0.15, 0.85, p));
      }
      if (figures) {
        figures.style.transform = `translate3d(${(p * 8).toFixed(2)}px, ${(s * 0.18).toFixed(1)}px, 0)`;
        figures.style.opacity = String(1 - smooth(0.1, 0.7, p));
      }
      // the moment they move, the copies whose foot fades take over, so no lower edge shows
      const f = smooth(0, 0.08, p);
      for (const el of [backSolid, figSolid]) if (el) el.style.opacity = String(1 - f);
      for (const el of [backSoft, figSoft]) if (el) el.style.opacity = String(f);
      if (foot) foot.style.opacity = String(1 - smooth(0, 0.1, p));

      // the arch rises 60px into place; the scene as it comes up the screen
      if (arch) {
        const a = smooth(0.35, 1, p);
        arch.style.transform = `translate3d(0, ${(60 * (1 - a)).toFixed(1)}px, 0)`;
        arch.style.opacity = String(a);
      }
      if (scene) {
        const c = smooth(0, 1, (vh - (sceneTop - y)) / (vh * 0.45));
        scene.style.transform = `translate3d(0, ${(60 * (1 - c)).toFixed(1)}px, 0)`;
        scene.style.opacity = String(c);
      }

      if (!on) return;
      // clouds pass across, each at its own pace
      CLOUDS.forEach((c, i) => {
        const el = clouds.current[i];
        if (!el) return;
        el.style.opacity = String(bump(0.06, 0.5, 0.96, p) * c.peak);
        el.style.transform = `translate3d(${(c.from + (c.to - c.from) * p).toFixed(2)}%, ${(-p * c.lift).toFixed(1)}px, 0)${c.flip ? " scaleX(-1)" : ""}`;
      });
      // a few petals fall through it
      PETALS.forEach(([, start, speed, sway, spin], i) => {
        const el = petals.current[i];
        if (!el) return;
        const t = (p - start) * speed;
        el.style.opacity = t > 0 && t < 1 ? String(0.75 * bump(0, 0.12, 1, t)) : "0";
        el.style.transform = `translate3d(${(Math.sin(t * Math.PI * 2 + i) * sway).toFixed(1)}px, ${(t * (vh + 60) - 30).toFixed(1)}px, 0) rotate(${(t * spin).toFixed(0)}deg)`;
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    update();
    const ro = new ResizeObserver(onResize);
    ro.observe(section);
    const couple = document.getElementById("couple");
    if (couple) ro.observe(couple);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      // leave everything as it would be without the descent
      for (const el of [back, figures, foot, arch, scene, backSolid, backSoft, figSolid, figSoft]) {
        if (!el) continue;
        el.style.transform = "";
        el.style.opacity = "";
        el.style.willChange = "";
      }
    };
  }, [reduced]);

  if (reduced) return null;
  return (
    <div ref={overlay} aria-hidden className="descent">
      {CLOUDS.map((c, i) => (
        <img
          key={i}
          ref={(el) => {
            clouds.current[i] = el;
          }}
          src={wedding.assets.clouds}
          alt=""
          className="descent-cloud"
          style={{ top: `${c.top}%`, width: `${c.width}%` }}
          draggable={false}
        />
      ))}
      {PETALS.map(([left, , , , , size], i) => (
        <span
          key={i}
          ref={(el) => {
            petals.current[i] = el;
          }}
          className="descent-petal"
          style={{ left: `${left}%`, "--size": `${size}px` } as CSSProperties}
        />
      ))}
    </div>
  );
}
