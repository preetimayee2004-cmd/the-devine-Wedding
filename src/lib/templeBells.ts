/**
 * A soft temple dhun, made in the browser — no audio file to download: a
 * quiet drone on Sa and Pa, and a small bell struck every few seconds on a
 * gentle phrase, in a little reverberant space. It starts only from a tap
 * (never on its own), fades in and out, and rests while the page is hidden.
 */
export interface Dhun {
  play(): void;
  pause(): void;
}

const SA = 146.83; // D3
// Sa Re Ga Pa Dha Sa' — the bell's phrase, weighted toward Sa and Pa
const PHRASE = [1, 3 / 2, 2, 1, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 8, 3 / 2];
const FADE = 0.6; // s

type AudioCtor = typeof AudioContext;

export function createDhun(): Dhun | null {
  const Ctor: AudioCtor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
  if (!Ctor) return null;

  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let bells: GainNode | null = null;
  let timer = 0;
  let step = 0;
  let wanted = false;

  const build = (ac: AudioContext) => {
    master = ac.createGain();
    master.gain.value = 0;
    master.connect(ac.destination);

    // a small temple's echo: decaying noise as the room
    const seconds = 2.8;
    const impulse = ac.createBuffer(2, Math.floor(ac.sampleRate * seconds), ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = impulse.getChannelData(c);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    }
    const room = ac.createConvolver();
    room.buffer = impulse;
    const wet = ac.createGain();
    wet.gain.value = 0.35;
    room.connect(wet).connect(master);

    bells = ac.createGain();
    bells.gain.value = 0.16;
    bells.connect(master);
    bells.connect(room);

    // the drone: Sa below, Sa and Pa, softened and breathing slowly
    const drone = ac.createGain();
    drone.gain.value = 0.045;
    const soften = ac.createBiquadFilter();
    soften.type = "lowpass";
    soften.frequency.value = 700;
    soften.connect(drone).connect(master);
    drone.connect(room);
    const breath = ac.createOscillator();
    breath.frequency.value = 0.12;
    const depth = ac.createGain();
    depth.gain.value = 0.015;
    breath.connect(depth).connect(drone.gain);
    breath.start();
    for (const [ratio, type, level] of [
      [0.5, "sine", 0.9],
      [1, "triangle", 0.5],
      [1.5, "triangle", 0.35],
      [1.003, "sine", 0.3],
    ] as const) {
      const osc = ac.createOscillator();
      osc.type = type;
      osc.frequency.value = SA * ratio;
      const g = ac.createGain();
      g.gain.value = level;
      osc.connect(g).connect(soften);
      osc.start();
    }
  };

  // one bell: a few inharmonic partials, each ringing away at its own pace
  const strike = (ac: AudioContext, freq: number, at: number, loud = 1) => {
    if (!bells) return;
    for (const [ratio, level, decay] of [
      [1, 1, 4.2],
      [2, 0.32, 2.6],
      [2.76, 0.22, 1.8],
      [5.4, 0.07, 0.8],
    ] as const) {
      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * ratio;
      const g = ac.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(level * loud, at + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
      osc.connect(g).connect(bells);
      osc.start(at);
      osc.stop(at + decay + 0.05);
    }
  };

  const schedule = () => {
    if (!ctx || !wanted) return;
    const ratio = PHRASE[step % PHRASE.length];
    step++;
    const now = ctx.currentTime + 0.05;
    strike(ctx, SA * 2 * ratio, now, step % 4 === 1 ? 1 : 0.75);
    // now and then a second, softer bell answers
    if (step % 3 === 0) strike(ctx, SA * 2 * PHRASE[(step + 2) % PHRASE.length], now + 0.9, 0.5);
    timer = window.setTimeout(schedule, 3200 + Math.random() * 2400);
  };

  const fadeTo = (value: number) => {
    if (!ctx || !master) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(value, t + FADE);
  };

  const start = () => {
    if (!ctx) {
      ctx = new Ctor();
      build(ctx);
    }
    void ctx.resume();
    fadeTo(1);
    clearTimeout(timer);
    schedule();
  };

  const stop = (suspend: boolean) => {
    clearTimeout(timer);
    fadeTo(0);
    if (suspend && ctx) {
      const ac = ctx;
      window.setTimeout(() => {
        if (!wanted || document.hidden) void ac.suspend();
      }, FADE * 1000 + 50);
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (!wanted) return;
    if (document.hidden) stop(true);
    else start();
  });

  return {
    play() {
      wanted = true;
      start();
    },
    pause() {
      wanted = false;
      stop(true);
    },
  };
}
