import { useEffect, useState, type RefObject } from "react";

/**
 * For a floating button: true while the guest scrolls down (so it never sits over what they're
 * reading), false again as they scroll up or a moment after they stop. It never tucks while the
 * button has the keyboard's focus.
 */
export function useTuckOnScroll(button: RefObject<HTMLElement>, restMs = 1200): boolean {
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let rest = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const focused = document.activeElement === button.current;
      if (!focused && y > last + 4 && y > 120) setTucked(true);
      else if (y < last - 4) setTucked(false);
      last = y;
      clearTimeout(rest);
      rest = window.setTimeout(() => setTucked(false), restMs);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(rest);
    };
  }, [button, restMs]);
  return tucked;
}
