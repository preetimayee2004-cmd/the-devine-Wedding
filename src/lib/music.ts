import { wedding } from "@/config/wedding";

/**
 * The couple's song (`assets.music`): one audio element for the whole page. It starts only from a
 * tap — the gate's "Tap to open" (or Skip), or the sound button — fading in, and loops; it fades out
 * when turned off, and rests while the page is hidden (resuming when it's back, if it was on). The
 * gate's own sound button decides, before the tap, whether the tap starts it.
 */
type Listener = (playing: boolean) => void;

const VOLUME = 0.6;
const FADE_IN_MS = 1800;
const FADE_OUT_MS = 500;

let audio: HTMLAudioElement | null = null;
/** The guest wants it on (the page being hidden doesn't change that). */
let wanted = false;
let frame = 0;
const listeners = new Set<Listener>();

const tell = () => listeners.forEach((l) => l(wanted));

function element(): HTMLAudioElement {
  if (audio) return audio;
  audio = new Audio(wedding.assets.music);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;
  document.addEventListener("visibilitychange", () => {
    if (!audio || !wanted) return;
    if (document.hidden) audio.pause();
    else start();
  });
  return audio;
}

/** Glide the volume to `to` (on iOS the volume is fixed, so this simply waits). */
function glide(to: number, ms: number, then?: () => void) {
  const a = element();
  cancelAnimationFrame(frame);
  const from = a.volume;
  const t0 = performance.now();
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / ms);
    try {
      a.volume = from + (to - from) * k;
    } catch {
      // a fixed volume — no matter
    }
    if (k < 1) frame = requestAnimationFrame(step);
    else then?.();
  };
  frame = requestAnimationFrame(step);
}

function start() {
  const a = element();
  const played = a.play();
  glide(VOLUME, FADE_IN_MS);
  // a browser that won't play (no tap yet, or no audio): it is simply off
  played?.catch(() => {
    wanted = false;
    tell();
  });
}

/** Load it ahead, so a tap starts it at once. */
export function preloadMusic() {
  element();
}

/** Start (or resume) the song — call it from a tap. */
export function playMusic() {
  wanted = true;
  tell();
  start();
}

export function pauseMusic() {
  wanted = false;
  tell();
  glide(0, FADE_OUT_MS, () => element().pause());
}

export const isMusicOn = () => wanted;

/** Hear when it is turned on or off; returns the way to stop hearing. */
export function onMusicChange(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
