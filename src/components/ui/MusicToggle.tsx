import { useEffect, useRef, useState } from "react";
import { createDhun, type Dhun } from "@/lib/templeBells";

/**
 * A small round sound button in the top corner (a speaker, as on the gate): soft temple bells on, or
 * off. Off until the guest taps it — never plays on its own.
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
      aria-label={playing ? "Sound on: turn off the temple bells" : "Sound off: play soft temple bells"}
      className={`fixed right-5 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-gold/70 bg-ivory/80 text-navy shadow-[0_4px_14px_-6px_rgb(var(--navy)/0.35)] backdrop-blur-sm transition-opacity duration-500 hover:bg-ivory ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
      style={{ top: "calc(var(--status-bar) + 22px)" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {/* a speaker */}
        <path d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4Z" />
        {playing ? (
          // sound
          <path className="text-gold-ink" stroke="currentColor" d="M15 9.2a4 4 0 0 1 0 5.6M17.6 7a7.2 7.2 0 0 1 0 10" />
        ) : (
          // silent
          <path d="M15.6 9.8l4.2 4.4M19.8 9.8l-4.2 4.4" />
        )}
      </svg>
    </button>
  );
}
