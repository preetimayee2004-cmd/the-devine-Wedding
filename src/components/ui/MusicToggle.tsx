import { useEffect, useRef, useState } from "react";
import { createDhun, type Dhun } from "@/lib/templeBells";

/**
 * A small round button in the top corner: soft temple bells on, or off. Off
 * until the guest taps it — never plays on its own.
 */
export function MusicToggle({ visible }: { visible: boolean }) {
  const dhun = useRef<Dhun | null | undefined>(undefined);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => dhun.current?.pause(), []);

  const toggle = () => {
    if (dhun.current === undefined) dhun.current = createDhun();
    if (!dhun.current) return;
    if (playing) dhun.current.pause();
    else dhun.current.play();
    setPlaying(!playing);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? "Turn off the temple bells" : "Play soft temple bells"}
      className={`fixed right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-gold/70 bg-ivory/80 text-navy shadow-[0_4px_14px_-6px_rgb(var(--navy)/0.35)] backdrop-blur-sm transition-opacity duration-500 hover:bg-ivory ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
      style={{ top: "calc(var(--status-bar) + 12px)" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        {/* a temple bell */}
        <path strokeLinejoin="round" d="M12 3v2M7.5 15.5V11a4.5 4.5 0 0 1 9 0v4.5l1.5 2H6z" />
        <path strokeLinecap="round" d="M10.5 19.5a1.6 1.6 0 0 0 3 0" />
        {playing ? (
          // ringing
          <path strokeLinecap="round" className="text-gold-ink" stroke="currentColor" d="M19.5 8.5a6 6 0 0 1 0 6M4.5 8.5a6 6 0 0 0 0 6" />
        ) : (
          // silent
          <path strokeLinecap="round" d="M4 4l16 16" />
        )}
      </svg>
    </button>
  );
}
