import { wedding } from "@/config/wedding";

/**
 * The couple's song — only its opening tune, looped for the whole visit (`assets.music`, trimmed to
 * the opening, and `assets.musicLoop`). It plays from the top once, then loops seamlessly between two
 * of the tune's own downbeats, so the join falls on the beat. Web Audio does the looping, sample-exact.
 *
 * It starts only from a tap — the gate's "Tap to open" (or Skip), or the sound button — fading in (when
 * the gate opens by itself, at the guest's first tap or key anywhere: a browser allows sound only
 * from one); it
 * fades out when turned off, and rests while the page is hidden (resuming when it's back, if it was
 * on). The file is fetched ahead at the gate, so a tap starts it at once.
 */
type Listener = (playing: boolean) => void;

const VOLUME = 0.6;
const FADE_IN_S = 1.8;
const FADE_OUT_S = 0.5;

type AudioCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let source: AudioBufferSourceNode | null = null;
let bytes: Promise<ArrayBuffer | null> | null = null;
let decoded: Promise<AudioBuffer | null> | null = null;
/** The guest wants it on (the page being hidden doesn't change that). */
let wanted = false;
let resting = 0;
const listeners = new Set<Listener>();

const tell = () => listeners.forEach((l) => l(wanted));

/** The audio context and its volume — made on the first tap (a browser allows sound only then). */
function context(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor: AudioCtor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
  if (!Ctor) return null;
  // on an iPhone, play as music even with the ringer switched to silent (where the browser allows it)
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) session.type = "playback";
  ctx = new Ctor();
  gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);
  document.addEventListener("visibilitychange", () => {
    if (!ctx || !wanted) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });
  return ctx;
}

/** Glide the volume to `to` over `seconds`. */
function ramp(to: number, seconds: number) {
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(to, now + seconds);
}

/**
 * Smooth the loop's join: the last few milliseconds before its end are blended into the ones before
 * its start, so when it jumps back the sound runs on without a click.
 */
function smoothJoin(buffer: AudioBuffer, from: number, to: number) {
  const fade = Math.round(buffer.sampleRate * 0.03);
  const a = Math.round(from * buffer.sampleRate);
  const b = Math.round(to * buffer.sampleRate);
  if (a - fade < 0 || b > buffer.length) return;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < fade; i++) {
      const w = i / fade;
      data[b - fade + i] = data[b - fade + i] * (1 - w) + data[a - fade + i] * w;
    }
  }
}

/** It can't play here (no Web Audio, or the file failed): simply off. */
function fail() {
  wanted = false;
  tell();
}

async function start() {
  const ac = context();
  if (!ac) return fail();
  // resumed within the tap itself, as browsers require
  void ac.resume();
  if (!source) {
    preloadMusic();
    decoded ??= (bytes as Promise<ArrayBuffer | null>).then((data) =>
      data ? new Promise<AudioBuffer>((done, failed) => ac.decodeAudioData(data, done, failed)).catch(() => null) : null,
    );
    const buffer = await decoded;
    if (!buffer) return fail();
    if (!source && gain) {
      const { start: from } = wedding.assets.musicLoop;
      const to = Math.min(wedding.assets.musicLoop.end, buffer.duration);
      smoothJoin(buffer, from, to);
      source = ac.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = from;
      source.loopEnd = to;
      source.connect(gain);
      source.start();
    }
  }
  if (wanted) ramp(VOLUME, FADE_IN_S);
}

/** Fetch the file ahead (no sound yet), so a tap starts it at once. */
export function preloadMusic() {
  bytes ??= fetch(wedding.assets.music)
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .catch(() => null);
}

/** Start (or resume) the song — call it from a tap. */
export function playMusic() {
  wanted = true;
  clearTimeout(resting);
  tell();
  void start();
}

/**
 * The gate opened by itself, before any tap: the song starts at the guest's first tap or key anywhere
 * (a tap on the sound button is left to the button itself).
 */
export function playMusicAtFirstTouch() {
  // the events a browser counts as the guest's own gesture
  const gestures = ["pointerup", "touchend", "mousedown", "keydown"] as const;
  const stop = () => gestures.forEach((g) => document.removeEventListener(g, onGesture, true));
  function onGesture(e: Event) {
    stop();
    const target = e.target as Element | null;
    if (target?.closest?.("[data-music-toggle]")) return;
    playMusic();
  }
  gestures.forEach((g) => document.addEventListener(g, onGesture, true));
}

export function pauseMusic() {
  wanted = false;
  tell();
  ramp(0, FADE_OUT_S);
  clearTimeout(resting);
  resting = window.setTimeout(() => {
    if (!wanted) void ctx?.suspend();
  }, FADE_OUT_S * 1000 + 60);
}

export const isMusicOn = () => wanted;

/** Hear when it is turned on or off; returns the way to stop hearing. */
export function onMusicChange(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
