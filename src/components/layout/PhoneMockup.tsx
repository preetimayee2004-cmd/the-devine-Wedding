import { useEffect, useState } from "react";
import { wedding } from "@/config/wedding";
import { FRAMED_STATUS_BAR } from "@/lib/viewMode";

// iPhone 17 Pro Max: 6.9" display, 440 × 956 CSS px viewport.
const SCREEN_W = 440;
const SCREEN_H = 956;
const BEZEL = 14; // titanium band + black border
const FRAME_W = SCREEN_W + BEZEL * 2;
const FRAME_H = SCREEN_H + BEZEL * 2;

// Space kept free above and below the phone.
const PAD = 28;

function useFitScale(): number {
  const compute = () => Math.max(0.5, Math.min(1, (window.innerHeight - PAD * 2) / FRAME_H));
  const [scale, setScale] = useState(compute);

  useEffect(() => {
    const onResize = () => setScale(compute());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return scale;
}

/** Desktop-only frame that hosts the live site in an iframe, floating in the same sky. */
export function PhoneMockup({ src }: { src: string }) {
  const scale = useFitScale();
  useFixedPage();

  return (
    <div className="relative flex h-[100dvh] flex-col items-center justify-center overflow-hidden">
      <div aria-hidden className="sky-backdrop" style={{ ["--sky-image" as string]: `url(${wedding.assets.sky})` }} />
      {/* A soft brightening of the sky behind the phone */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 38% 60% at 50% 52%, rgb(255 255 255 / 0.35), transparent 70%)" }}
      />

      {/* Reserves the scaled footprint so layout matches what's visible */}
      <div style={{ width: FRAME_W * scale, height: FRAME_H * scale }}>
        <div
          className="relative origin-top-left"
          style={{ width: FRAME_W, height: FRAME_H, transform: `scale(${scale})` }}
        >
          <SideButtons />
          {/* Titanium band */}
          <div
            className="absolute inset-0 rounded-[76px]"
            style={{
              background: "linear-gradient(145deg, #ebe8e3 0%, #b8b3ac 35%, #dcd8d2 55%, #a7a29b 100%)",
              boxShadow:
                "0 40px 80px -20px rgb(15 42 62 / 0.45), 0 18px 36px -18px rgb(15 42 62 / 0.35), inset 0 0 0 1px rgb(255 255 255 / 0.35)",
            }}
          />
          {/* Black border */}
          <div className="absolute inset-[3px] rounded-[73px] bg-[#0b0b0c]" />

          {/* Screen: the site fills it edge to edge; the status bar floats on top, as on a real iPhone */}
          <div
            className="absolute overflow-hidden rounded-[62px] bg-black"
            style={{ inset: BEZEL, width: SCREEN_W, height: SCREEN_H }}
          >
            <iframe
              src={src}
              title="Wedding invitation — phone preview"
              allow="autoplay"
              className="block w-full border-0"
              style={{ height: SCREEN_H }}
            />
            <StatusBar />
            {/* Dynamic Island */}
            <div className="pointer-events-none absolute left-1/2 top-[11px] h-[37px] w-[125px] -translate-x-1/2 rounded-full bg-black" />
            {/* Home indicator */}
            <div className="pointer-events-none absolute bottom-2 left-1/2 h-[5px] w-[140px] -translate-x-1/2 rounded-full bg-navy/80" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** The desktop page itself stays still: no scrolling, no bounce. */
function useFixedPage() {
  useEffect(() => {
    const els = [document.documentElement, document.body];
    const previous = els.map((el) => [el.style.overflow, el.style.overscrollBehavior]);
    els.forEach((el) => {
      el.style.overflow = "hidden";
      el.style.overscrollBehavior = "none";
    });
    return () =>
      els.forEach((el, i) => {
        [el.style.overflow, el.style.overscrollBehavior] = previous[i];
      });
  }, []);
}

function StatusBar() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-[34px] pt-[6px] font-sans text-navy"
      style={{ height: FRAMED_STATUS_BAR }}
    >
      <span className="w-[54px] text-center text-[16px] font-medium tracking-tight">9:41</span>
      <span className="flex items-center gap-[6px]">
        {/* Cellular */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        {/* Wi-Fi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.1-1.2A10.3 10.3 0 0 0 8 .8 10.3 10.3 0 0 0 .9 3.6L2 4.8a8.6 8.6 0 0 1 6-2.4Z" />
          <path d="M8 5.6c1.4 0 2.7.5 3.7 1.4l1.1-1.2A7.1 7.1 0 0 0 8 4a7.1 7.1 0 0 0-4.8 1.8L4.3 7c1-.9 2.3-1.4 3.7-1.4Z" />
          <path d="M8 8.8c.6 0 1.1.2 1.5.6L8 11l-1.5-1.6c.4-.4.9-.6 1.5-.6Z" />
        </svg>
        {/* Battery */}
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor" />
          <path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="currentColor" opacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

function SideButtons() {
  const btn = "absolute w-[4px] bg-gradient-to-b from-[#c9c5bf] to-[#9e9993]";
  return (
    <div aria-hidden>
      {/* Left: Action button, volume up, volume down */}
      <span className={`${btn} -left-[3px] top-[188px] h-[34px] rounded-l-[2px]`} />
      <span className={`${btn} -left-[3px] top-[248px] h-[64px] rounded-l-[2px]`} />
      <span className={`${btn} -left-[3px] top-[326px] h-[64px] rounded-l-[2px]`} />
      {/* Right: Side button, Camera Control */}
      <span className={`${btn} -right-[3px] top-[276px] h-[100px] rounded-r-[2px]`} />
      <span className={`${btn} -right-[3px] top-[560px] h-[64px] rounded-r-[2px]`} />
    </div>
  );
}
