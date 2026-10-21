/**
 * One motion language for the whole site (PRD §6) — also exported to Tailwind.
 * Reveals are gentle and decelerating; camera-style moves ease in and out.
 */
export const EASE = {
  // Default reveal: calm, decelerating, no overshoot.
  silk: "cubic-bezier(0.22, 1, 0.36, 1)",
  // Hands gliding into place: eases in gently, settles softly.
  glide: "cubic-bezier(0.3, 0.05, 0.2, 1)",
  // Slow in-out for camera-style moves (the opening's pull-back).
  drift: "cubic-bezier(0.65, 0, 0.35, 1)",
  // Gathers, then lets go: glows blooming and fading.
  breath: "cubic-bezier(0.45, 0, 0.55, 1)",
} as const;

/** Shared reveal distance and durations, so every section moves alike. */
export const MOTION = {
  rise: 14, // px a staggered fade-up travels
  revealMs: 900,
  staggerMs: 140,
} as const;
