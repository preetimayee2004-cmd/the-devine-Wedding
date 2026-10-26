import { useEffect, useState } from "react";
import { isMusicOn, onMusicChange, pauseMusic, playMusic } from "@/lib/music";

/**
 * A small round sound button in the top corner (a speaker, as on the gate): the couple's song on, or
 * off. It shows the song as the gate's tap left it, and pauses or resumes it.
 */
export function MusicToggle({ visible }: { visible: boolean }) {
  const [playing, setPlaying] = useState(isMusicOn);

  useEffect(() => onMusicChange(setPlaying), []);

  return (
    <button
      type="button"
      onClick={() => (playing ? pauseMusic() : playMusic())}
      aria-pressed={playing}
      aria-label={playing ? "Music on: pause the song" : "Music off: play the song"}
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
