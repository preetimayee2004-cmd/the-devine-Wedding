/** Things a guest does that mean "I'm in charge of scrolling now". */
export const USER_INPUT_EVENTS = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

/** Slow in-out, matching EASE.drift. */
const drift = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Glides the page to `y` over `duration` ms. Any touch, wheel or key press
 * hands control straight back to the guest. Returns a cancel function.
 */
export function glideTo(y: number, duration: number): () => void {
  const from = window.scrollY;
  const distance = y - from;
  const start = performance.now();
  let frame = 0;

  const stop = () => {
    cancelAnimationFrame(frame);
    USER_INPUT_EVENTS.forEach((type) => window.removeEventListener(type, stop));
  };
  USER_INPUT_EVENTS.forEach((type) => window.addEventListener(type, stop, { passive: true }));

  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    // "instant": each frame is one step of our own glide, whatever the page's scroll-behavior
    window.scrollTo({ top: from + distance * drift(t), behavior: "instant" });
    if (t < 1) frame = requestAnimationFrame(step);
    else stop();
  };
  frame = requestAnimationFrame(step);
  return stop;
}
