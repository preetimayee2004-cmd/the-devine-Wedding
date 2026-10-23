import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

/**
 * Between two sections: a ripple of the Ganga — a fine wavy line in pale blue and gold across the
 * full width, a fainter second line behind it, on a soft band of the site's own mist so one
 * section flows into the next — and on it, in the middle, a small floating ornament (a lotus, a
 * diya or a shankh, by turn), bobbing gently.
 *
 * Once, as it comes into view, the line draws itself from left to right (0.8s) and the ornament
 * rises in after it. As the guest scrolls, the line drifts sideways a little and the line behind
 * drifts the other way. The diya's flame flickers; the lotus's petals open and close, just. All
 * of it transform and opacity (and the line's dash). Reduced motion: still and complete.
 */

export type SeparatorOrnament = "lotus" | "diya" | "shankh";

const HEIGHT = 72;
const LINE_Y = 46;

/** A gentle wave from x0 to x1 at height y: amplitude a, wavelength l, phase p (radians). */
function wave(x0: number, x1: number, y: number, a: number, l: number, p: number) {
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 6) pts.push(`${x.toFixed(1)} ${(y + a * Math.sin((x / l) * Math.PI * 2 + p)).toFixed(2)}`);
  return `M${pts.join("L")}`;
}

// One scroll listener for every separator: each drifts by where it sits on the screen (-1 … 1).
const drifting = new Set<HTMLElement>();
let queued = false;
function update() {
  queued = false;
  const vh = window.innerHeight;
  for (const el of drifting) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -120 || r.top > vh + 120) continue;
    const c = (r.top + r.height / 2) / vh;
    el.style.setProperty("--drift", Math.max(-1, Math.min(1, 1 - 2 * c)).toFixed(3));
  }
}
function onScroll() {
  if (!queued) {
    queued = true;
    requestAnimationFrame(update);
  }
}
function drift(el: HTMLElement) {
  drifting.add(el);
  if (drifting.size === 1) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }
  onScroll();
  return () => {
    drifting.delete(el);
    if (!drifting.size) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    }
  };
}

export function SectionSeparator({ ornament }: { ornament: SeparatorOrnament }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const shown = useInView(ref, { threshold: 0.6, rootMargin: "0px" });
  const [width, setWidth] = useState(0);
  const id = useId().replace(/:/g, "");

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    return drift(el);
  }, [reduced]);

  // a little beyond either edge, so the sideways drift never shows an end
  const x0 = -40;
  const x1 = width + 40;
  return (
    <div ref={ref} aria-hidden className="sep" data-shown={shown || reduced || undefined} data-still={reduced || undefined}>
      {width > 0 && (
        <svg className="sep-waves" width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`}>
          <defs>
            <linearGradient id={`${id}-w`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={width} y2={0}>
              <stop offset="0" stopColor="#9fcbe8" stopOpacity="0" />
              <stop offset="0.16" stopColor="#9fcbe8" />
              <stop offset="0.42" stopColor="#d2b06a" />
              <stop offset="0.58" stopColor="#d2b06a" />
              <stop offset="0.84" stopColor="#9fcbe8" />
              <stop offset="1" stopColor="#9fcbe8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="sep-back">
            <path className="sep-wave-back" d={wave(x0, x1, LINE_Y + 7, 4, 150, 1.9)} stroke={`url(#${id}-w)`} />
          </g>
          <g className="sep-front">
            <path className="sep-glow" d={wave(x0, x1, LINE_Y, 5, 120, 0)} />
            <path className="sep-wave" d={wave(x0, x1, LINE_Y, 5, 120, 0)} stroke={`url(#${id}-w)`} pathLength={1} />
          </g>
        </svg>
      )}
      <span className="sep-ornament">
        <span className="sep-bob">
          <Ornament kind={ornament} />
        </span>
      </span>
    </div>
  );
}

function Ornament({ kind }: { kind: SeparatorOrnament }) {
  if (kind === "diya")
    return (
      <svg viewBox="0 0 40 34" className="sep-art">
        <defs>
          <radialGradient id="sep-diya-glow">
            <stop offset="0" stopColor="#ffe3a0" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffe3a0" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sep-diya-flame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff6cf" />
            <stop offset="0.5" stopColor="#ffc54a" />
            <stop offset="1" stopColor="#ef7d2a" />
          </linearGradient>
          <linearGradient id="sep-diya-clay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e8a06e" />
            <stop offset="1" stopColor="#a8532a" />
          </linearGradient>
        </defs>
        <circle className="sep-flame-glow" cx="21" cy="12" r="11" fill="url(#sep-diya-glow)" />
        <path className="sep-flame" d="M21 3C24 8 24.6 12 21 16.5C17.4 12 18 8 21 3Z" fill="url(#sep-diya-flame)" />
        <path d="M4 20C8 18 30 18 34 19.5L38 17C37 21.5 34 24 30.5 25C26 30 14 30.5 9.5 26C6 25 4 23 4 20Z" fill="url(#sep-diya-clay)" stroke="#7f3b1e" strokeOpacity=".5" strokeWidth=".6" />
        <path d="M6 20.5C12 22.5 26 22.5 34 19.5" fill="none" stroke="#f4c49a" strokeWidth=".9" opacity=".85" />
      </svg>
    );
  if (kind === "shankh")
    return (
      <svg viewBox="0 0 40 34" className="sep-art">
        <defs>
          <linearGradient id="sep-shell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fffaf1" />
            <stop offset="0.6" stopColor="#f1dfca" />
            <stop offset="1" stopColor="#d7b79a" />
          </linearGradient>
        </defs>
        <g transform="rotate(-62 20 17)">
          <path d="M20 2C23 5 28 8.6 29.6 15C31.2 21.4 28.4 27.6 24 32L21.6 38L19.2 37.6C18.8 33.6 14.4 29.6 12.4 23.6C10 16.4 14 8.4 20 2Z" fill="url(#sep-shell)" stroke="#a7826a" strokeOpacity=".7" strokeWidth=".7" />
          <path d="M20 2C20.8 4 20.8 5.6 19.6 6.8M17.6 6C19.6 7.6 22.4 7.6 24.4 6.4M15.6 10C19.2 11.6 24 11.6 27.6 10.4M13.6 14.8C19.2 16.8 25.2 16.4 29.6 14.8" fill="none" stroke="#b9926f" strokeWidth=".6" opacity=".85" />
          <path d="M29.2 16.4C30.8 21.6 28.4 28 24 32.4C23.2 27.6 24.8 21.6 29.2 16.4Z" fill="#efb3aa" opacity=".9" />
        </g>
      </svg>
    );
  // the lotus: its outer petals open and close, just
  return (
    <svg viewBox="0 0 40 34" className="sep-art">
      <defs>
        <linearGradient id="sep-lotus" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbd3dc" />
          <stop offset="1" stopColor="#e488a2" />
        </linearGradient>
      </defs>
      <path className="sep-petal sep-petal-l" d="M20 28C14 26 7 22 3 14C10 13.5 16 18 20 28Z" fill="url(#sep-lotus)" stroke="#c76a86" strokeOpacity=".5" strokeWidth=".5" />
      <path className="sep-petal sep-petal-r" d="M20 28C26 26 33 22 37 14C30 13.5 24 18 20 28Z" fill="url(#sep-lotus)" stroke="#c76a86" strokeOpacity=".5" strokeWidth=".5" />
      <path d="M20 28C15.5 22 14 15 16.5 8C19 12 20.5 19 20 28Z" fill="url(#sep-lotus)" stroke="#c76a86" strokeOpacity=".5" strokeWidth=".5" />
      <path d="M20 28C24.5 22 26 15 23.5 8C21 12 19.5 19 20 28Z" fill="url(#sep-lotus)" stroke="#c76a86" strokeOpacity=".5" strokeWidth=".5" />
      <path d="M20 28C17.5 20 18 11 20 3C22 11 22.5 20 20 28Z" fill="#f8c2cf" stroke="#c76a86" strokeOpacity=".55" strokeWidth=".5" />
      <path d="M9 30C15 31.5 25 31.5 31 30" fill="none" stroke="#b69a67" strokeWidth=".8" strokeLinecap="round" />
    </svg>
  );
}
