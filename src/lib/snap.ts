/** Slow in-out, matching EASE.drift. */
const drift = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Keys that mean "the next screen" / "the one before". */
const DOWN_KEYS = new Set(["ArrowDown", "PageDown", " "]);
const UP_KEYS = new Set(["ArrowUp", "PageUp"]);

/**
 * Between the top of the page (the Save the Date) and the next section's top, the page moves one
 * whole screen at a time: any scroll down — a swipe, the wheel or trackpad, the arrow or page keys —
 * glides it to `target()` and it stops there, however hard the fling; any scroll up from there glides
 * it back to the top. Past the target, scrolling is the page's own again.
 *
 * While gliding, further input is held (so the glide can't be overshot), and after it the rest of a
 * trackpad's or wheel's momentum is swallowed until it stops. A gesture that starts on an element
 * matching `ignore` (the date's scratch foil) is left alone, as are keys typed into a control, and
 * nothing happens while the page itself can't scroll (the opening). Returns a cleanup.
 */
export function snapToNext(target: () => number, { duration = 900, ignore = "" }: { duration?: number; ignore?: string } = {}) {
  let gliding = false;
  let frame = 0;
  // after a glide: wheel momentum is swallowed until it pauses (or this long at most)
  let quietUntil = 0;
  let quietCap = 0;
  let touchY: number | null = null;
  let touchX = 0;
  let touchIgnored = false;
  // the current touch has started a glide: the rest of it is ours, so the page can't fling on
  let touchOwned = false;

  const html = document.documentElement;
  const locked = () => html.style.overflow === "hidden" || document.querySelector("dialog[open]") !== null;
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const glide = (to: number) => {
    const from = window.scrollY;
    if (Math.abs(to - from) < 2) return;
    gliding = true;
    const ms = reduced() ? 0 : duration;
    const start = performance.now();
    const step = (now: number) => {
      const t = ms ? Math.min(1, (now - start) / ms) : 1;
      window.scrollTo({ top: from + (to - from) * drift(t), behavior: "instant" });
      if (t < 1) frame = requestAnimationFrame(step);
      else {
        gliding = false;
        const end = performance.now();
        quietUntil = end + 220;
        quietCap = end + 2500;
      }
    };
    frame = requestAnimationFrame(step);
  };

  /** Where a scroll in this direction should go, or null when it's the page's own. */
  const destination = (down: boolean) => {
    const y = window.scrollY;
    const next = target();
    if (down) return y < next - 1 ? next : null;
    return y > 0 && y <= next + 1 ? 0 : null;
  };

  const onWheel = (e: WheelEvent) => {
    if (locked() || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    const now = performance.now();
    if (gliding) return void e.preventDefault();
    // the tail of the gesture that started the glide
    if (now < quietUntil && now < quietCap) {
      quietUntil = now + 220;
      return void e.preventDefault();
    }
    const to = destination(e.deltaY > 0);
    if (to === null) return;
    e.preventDefault();
    glide(to);
  };

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touchY = t ? t.clientY : null;
    touchX = t ? t.clientX : 0;
    touchIgnored = Boolean(ignore && (e.target as Element | null)?.closest?.(ignore));
    touchOwned = false;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (touchOwned || gliding) {
      if (e.cancelable) e.preventDefault();
      return;
    }
    if (touchIgnored || touchY === null || locked() || e.touches.length > 1) return;
    const t = e.touches[0];
    const dy = touchY - t.clientY; // > 0: the finger moves up, the page would scroll down
    const dx = touchX - t.clientX;
    const to = destination(dy > 0);
    if (to === null) return;
    // inside the snapping range the page never scrolls by itself
    if (e.cancelable) e.preventDefault();
    if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
      touchOwned = true;
      glide(to);
    }
  };
  const onTouchEnd = () => {
    touchY = null;
    touchOwned = false;
  };

  const onKey = (e: KeyboardEvent) => {
    if (locked() || e.altKey || e.ctrlKey || e.metaKey) return;
    const el = e.target as HTMLElement | null;
    if (el && el !== document.body && el.closest("input, textarea, select, button, a, [contenteditable], [role='button']")) return;
    const down = DOWN_KEYS.has(e.key) && !e.shiftKey;
    const up = UP_KEYS.has(e.key) || (e.key === " " && e.shiftKey);
    if (!down && !up) return;
    if (gliding) return void e.preventDefault();
    const to = destination(down);
    if (to === null) return;
    e.preventDefault();
    glide(to);
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKey);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("touchcancel", onTouchEnd);
    window.removeEventListener("keydown", onKey);
  };
}
