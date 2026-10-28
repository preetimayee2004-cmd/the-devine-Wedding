import { useEffect, useRef, useState } from "react";
import { wedding } from "@/config/wedding";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useTuckOnScroll } from "@/hooks/useTuckOnScroll";
import { useCopy } from "@/lib/lang";
import { RSVP_ACCEPTED } from "@/lib/rsvpEvents";

/**
 * A small navy "RSVP" pill floating in the lower right corner, so the one thing a guest must do is a
 * tap away from anywhere on the long page. It shows once the Save the Date has scrolled away, hides
 * while the RSVP section itself is on screen, and goes for good once the invitation is accepted. Like
 * the sound button, it tucks away while the guest scrolls down and comes back as they stop. A tap
 * glides to the RSVP. Reduced motion: it simply fades, and the jump is instant.
 */
export function RsvpShortcut() {
  const reduced = usePrefersReducedMotion();
  const [pastOpening, setPastOpening] = useState(false);
  const [rsvpInView, setRsvpInView] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const { shortcut } = useCopy(wedding.rsvp);
  const tucked = useTuckOnScroll(button);

  useEffect(() => {
    const opening = document.getElementById("invitation");
    const rsvp = document.getElementById("rsvp");
    if (!opening || !rsvp || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === opening) setPastOpening(!e.isIntersecting && e.boundingClientRect.top < 0);
        else setRsvpInView(e.isIntersecting);
      }
    });
    io.observe(opening);
    io.observe(rsvp);
    const done = () => setAccepted(true);
    window.addEventListener(RSVP_ACCEPTED, done);
    return () => {
      io.disconnect();
      window.removeEventListener(RSVP_ACCEPTED, done);
    };
  }, []);

  const shown = pastOpening && !rsvpInView && !accepted && !tucked;
  return (
    <button
      ref={button}
      type="button"
      className="rsvp-shortcut"
      data-shown={shown || undefined}
      data-still={reduced || undefined}
      aria-hidden={!shown || undefined}
      tabIndex={shown ? 0 : -1}
      onClick={() => document.getElementById("rsvp")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })}
    >
      <svg aria-hidden viewBox="0 0 24 16" className="rsvp-shortcut-lotus" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">
        <path d="M12 13.5C10 10.6 10 6.6 12 2.6 14 6.6 14 10.6 12 13.5Z" />
        <path d="M12 13.5C9 13 6.6 10.8 6 7.6 9 8 11.2 10.4 12 13.5Z" />
        <path d="M12 13.5C15 13 17.4 10.8 18 7.6 15 8 12.8 10.4 12 13.5Z" />
        <path d="M7 15.2H17" />
      </svg>
      {shortcut}
    </button>
  );
}
