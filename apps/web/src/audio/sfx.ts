// Sound effects, synthesized with the Web Audio API: no audio files, so nothing to download or license. Every
// major game event calls play(name); swapping in recorded sounds later only means changing this file.
// The AudioContext is created on the first sound (which always follows a click), and sound can be muted.

export type Sfx =
  | 'summon'
  | 'attackWindup'
  | 'attackHit'
  | 'hit'
  | 'death'
  | 'buff'
  | 'select'
  | 'trapSet'
  | 'trapCharge'
  | 'trapReveal'
  | 'trapEffect'
  | 'trapSpent'
  | 'deal'
  | 'hover'
  | 'pickup'
  | 'drop'
  | 'refuse'
  | 'cast'
  | 'turn'
  | 'win'
  | 'lose'
  | 'click';

const KEY = 'sr.sound';

interface Settings {
  on: boolean;
  volume: number;
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<Settings>;
      return {
        on: v.on !== false,
        volume: typeof v.volume === 'number' ? Math.min(1, Math.max(0, v.volume)) : 0.5,
      };
    }
  } catch {
    /* storage may be unavailable */
  }
  return { on: true, volume: 0.5 };
}

let settings = load();
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

export const getSound = (): Settings => ({ ...settings });

export function setSound(next: Partial<Settings>): void {
  settings = { ...settings, ...next };
  if (master) master.gain.value = settings.volume * 0.6;
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* non-fatal */
  }
}

function ensure(): AudioContext | null {
  if (ctx) {
    if (ctx.state === 'suspended') {
      // resuming is async: skip this sound rather than queue a burst that all fires at once
      void ctx.resume();
      return null;
    }
    return ctx;
  }
  const Ctor =
    typeof AudioContext !== 'undefined'
      ? AudioContext
      : (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = settings.volume * 0.6;
  master.connect(ctx.destination);
  const len = ctx.sampleRate;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  to?: number;
  delay?: number;
}

function tone(c: AudioContext, freq: number, dur: number, o: ToneOpts = {}): void {
  if (!master) return;
  const t0 = c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t0 + dur);
  const v = o.vol ?? 0.3;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + Math.min(0.012, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

interface NoiseOpts {
  vol?: number;
  from?: number;
  to?: number;
  q?: number;
  type?: BiquadFilterType;
  delay?: number;
}

function noise(c: AudioContext, dur: number, o: NoiseOpts = {}): void {
  if (!master || !noiseBuf) return;
  const t0 = c.currentTime + (o.delay ?? 0);
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = o.type ?? 'lowpass';
  f.Q.value = o.q ?? 0.8;
  f.frequency.setValueAtTime(o.from ?? 1200, t0);
  if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + dur);
  const g = c.createGain();
  const v = o.vol ?? 0.3;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + Math.min(0.01, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

const arpeggio = (c: AudioContext, notes: number[], step: number, o: ToneOpts = {}) =>
  notes.forEach((n, i) => tone(c, n, step * 2.2, { ...o, delay: i * step }));

const RECIPES: Record<Sfx, (c: AudioContext) => void> = {
  click: (c) => tone(c, 700, 0.04, { type: 'triangle', vol: 0.12 }),
  hover: (c) => tone(c, 1100, 0.025, { type: 'sine', vol: 0.04 }),
  select: (c) => tone(c, 880, 0.06, { type: 'triangle', vol: 0.14 }),
  pickup: (c) => tone(c, 420, 0.09, { to: 640, type: 'triangle', vol: 0.16 }),
  drop: (c) => {
    noise(c, 0.07, { from: 900, to: 300, vol: 0.18 });
    tone(c, 190, 0.1, { to: 110, type: 'sine', vol: 0.25 });
  },
  refuse: (c) => tone(c, 150, 0.14, { to: 110, type: 'square', vol: 0.1 }),
  deal: (c) => {
    noise(c, 0.05, { type: 'highpass', from: 3000, vol: 0.12 });
    tone(c, 760, 0.05, { type: 'triangle', vol: 0.08 });
  },
  summon: (c) => {
    tone(c, 240, 0.22, { to: 90, type: 'triangle', vol: 0.34 });
    noise(c, 0.14, { from: 500, to: 120, vol: 0.3, delay: 0.28 });
    tone(c, 90, 0.18, { to: 50, type: 'sine', vol: 0.35, delay: 0.3 });
  },
  attackWindup: (c) => tone(c, 320, 0.16, { to: 190, type: 'sawtooth', vol: 0.08 }),
  attackHit: (c) => {
    noise(c, 0.12, { from: 2200, to: 400, vol: 0.34 });
    tone(c, 130, 0.18, { to: 55, type: 'square', vol: 0.3 });
  },
  hit: (c) => {
    noise(c, 0.09, { type: 'bandpass', from: 1700, q: 1.4, vol: 0.3 });
    tone(c, 210, 0.1, { to: 90, type: 'triangle', vol: 0.28 });
  },
  death: (c) => {
    noise(c, 0.5, { from: 2600, to: 150, vol: 0.34 });
    tone(c, 170, 0.5, { to: 40, type: 'sawtooth', vol: 0.18 });
  },
  buff: (c) => arpeggio(c, [523, 659, 784], 0.06, { vol: 0.14 }),
  trapSet: (c) => {
    tone(c, 330, 0.22, { to: 440, type: 'triangle', vol: 0.18 });
    tone(c, 1320, 0.1, { type: 'sine', vol: 0.08, delay: 0.12 });
  },
  trapCharge: (c) => {
    tone(c, 110, 0.55, { to: 780, type: 'sawtooth', vol: 0.12 });
    noise(c, 0.55, { type: 'bandpass', from: 400, to: 3500, q: 2, vol: 0.12 });
  },
  trapReveal: (c) => {
    noise(c, 0.28, { from: 4000, to: 300, vol: 0.4 });
    arpeggio(c, [392, 494, 587], 0.02, { type: 'triangle', vol: 0.2 });
    tone(c, 98, 0.4, { to: 50, type: 'sine', vol: 0.4 });
  },
  trapEffect: (c) => {
    tone(c, 220, 0.28, { to: 70, type: 'sawtooth', vol: 0.22 });
    noise(c, 0.2, { from: 1800, to: 200, vol: 0.28 });
  },
  trapSpent: (c) => noise(c, 0.35, { from: 3000, to: 200, vol: 0.18 }),
  cast: (c) => {
    tone(c, 600, 0.2, { to: 920, type: 'sine', vol: 0.2 });
    arpeggio(c, [1175, 1568, 2093], 0.045, { vol: 0.07, delay: 0.1 });
  },
  turn: (c) => {
    tone(c, 330, 0.34, { type: 'triangle', vol: 0.14 });
    tone(c, 495, 0.34, { type: 'triangle', vol: 0.1, delay: 0.04 });
  },
  win: (c) => arpeggio(c, [523, 659, 784, 1047], 0.11, { type: 'triangle', vol: 0.22 }),
  lose: (c) => arpeggio(c, [392, 330, 262, 196], 0.18, { type: 'sine', vol: 0.22 }),
};

/** Play a sound. Safe to call at any time (it does nothing when muted or if audio is unavailable). */
export function play(name: Sfx): void {
  if (!settings.on || settings.volume <= 0) return;
  try {
    const c = ensure();
    if (c) RECIPES[name](c);
  } catch {
    /* sound must never break the game */
  }
}
