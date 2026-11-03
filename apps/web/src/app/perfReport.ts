// The performance report (DECISIONS #572): a player records a while of play from the Settings menu and copies a short text
// report of every stall, with what was running and what the game was doing, to send in. It reads only the browser's own timing
// (frame times, the long-animation-frame entries) and the game's notes; nothing is sent anywhere by itself.

import { loadEffectsMode, loadGraphicsQuality } from '../duel/effects';
import { BUILD } from '../build';

interface Note {
  at: number;
  text: string;
}
interface LongFrame {
  at: number;
  dur: number;
  blocking: number;
  /** time spent on style and layout in the frame's rendering */
  layout: number;
  scripts: string[];
  /** what the game noted up to the stall's end, taken when the stall is reported (older notes may be gone by the end) */
  during: string;
}
interface Recording {
  start: number;
  frames: number[];
  long: LongFrame[];
  notes: Note[];
  last: number;
  raf: number;
  observer: PerformanceObserver | null;
}

const CHANGED = 'sr:perf-recording';
const MAX_FRAMES = 60 * 60 * 10; // ten minutes at 60 fps: the oldest go after that
const MAX_LONG = 300;
const MAX_NOTES = 400;
let rec: Recording | null = null;
let report: string | null = null;

export const isRecording = (): boolean => rec !== null;
export const lastReport = (): string | null => report;

export function onRecordingChange(cb: () => void): () => void {
  window.addEventListener(CHANGED, cb);
  return () => window.removeEventListener(CHANGED, cb);
}
const changed = (): void => {
  window.dispatchEvent(new Event(CHANGED));
};

/** Something the game is doing, to read beside the stalls (only kept while recording; costs nothing otherwise). */
export function perfNote(text: string): void {
  if (!rec) return;
  rec.notes.push({ at: performance.now(), text });
  if (rec.notes.length > MAX_NOTES) rec.notes.shift();
}

export function startRecording(): void {
  if (rec) return;
  report = null;
  const r: Recording = { start: performance.now(), frames: [], long: [], notes: [], last: performance.now(), raf: 0, observer: null };
  const tick = (t: number): void => {
    if (rec !== r) return;
    // (a hidden tab pauses the frames: the gap while the player was away is not a stall)
    const gap = t - r.last;
    if (!document.hidden && gap < 1000) {
      r.frames.push(gap);
      if (r.frames.length > MAX_FRAMES) r.frames.shift();
    }
    r.last = t;
    r.raf = requestAnimationFrame(tick);
  };
  r.raf = requestAnimationFrame(tick);
  try {
    // (long-animation-frame names the scripts behind a stall; a browser without it gives the plainer long tasks)
    const types = PerformanceObserver.supportedEntryTypes ?? [];
    const type = types.includes('long-animation-frame') ? 'long-animation-frame' : types.includes('longtask') ? 'longtask' : null;
    if (type) {
      r.observer = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          const x = e as PerformanceEntry & {
            blockingDuration?: number;
            styleAndLayoutStart?: number;
            scripts?: {
              duration: number;
              invoker?: string;
              sourceFunctionName?: string;
              sourceURL?: string;
              sourceCharPosition?: number;
              forcedStyleAndLayoutDuration?: number;
            }[];
          };
          const end = x.startTime + x.duration;
          // (a move's note is made after its work, so the notes up to the stall's end, not its start, say what caused it)
          const near = r.notes.filter((n) => n.at <= end).slice(-2);
          r.long.push({
            during: near.length ? near.map((n) => n.text).join(' / ') : 'nothing noted',
            at: x.startTime,
            dur: x.duration,
            blocking: x.blockingDuration ?? 0,
            layout: x.styleAndLayoutStart ? end - x.styleAndLayoutStart : 0,
            scripts: (x.scripts ?? [])
              .filter((s) => s.duration >= 4)
              .map(
                (s) =>
                  `${Math.round(s.duration)} ms ${s.invoker ?? ''} ${s.sourceFunctionName || '(anonymous)'} @ ${(s.sourceURL ?? '').split('/').pop()}:${s.sourceCharPosition ?? '?'}${s.forcedStyleAndLayoutDuration ? ` (forced layout ${Math.round(s.forcedStyleAndLayoutDuration)} ms)` : ''}`,
              ),
          });
          if (r.long.length > MAX_LONG) r.long.shift();
        }
      });
      r.observer.observe({ type, buffered: false });
    }
  } catch {
    /* no observer: the frame times are still recorded */
  }
  rec = r;
  changed();
}

function gpuName(): string {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') ?? c.getContext('webgl');
    if (!gl) return 'no WebGL';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'hidden by the browser';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return name;
  } catch {
    return 'unknown';
  }
}

const pct = (sorted: number[], p: number): number => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0;
const ms = (n: number): string => `${n.toFixed(1)} ms`;

/** Stops recording and makes the report (kept to read again until the next recording). */
export function stopRecording(): string {
  const r = rec;
  if (!r) return report ?? '';
  rec = null;
  cancelAnimationFrame(r.raf);
  r.observer?.disconnect();
  const at = (t: number): string => `${((t - r.start) / 1000).toFixed(1)} s`;
  const frames = r.frames.slice(1);
  const sorted = [...frames].sort((a, b) => a - b);
  const median = pct(sorted, 0.5);
  const over = (limit: number): number => frames.filter((f) => f > limit).length;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const worst = [...r.long].sort((a, b) => b.dur - a.dur).slice(0, 20);
  const lines = [
    `Shattered Rifts performance report (${BUILD.label})`,
    `Recorded ${((performance.now() - r.start) / 1000).toFixed(0)} s, ${frames.length} frames`,
    '',
    '== Machine ==',
    `Graphics: ${gpuName()}`,
    `Browser: ${navigator.userAgent}`,
    `Window ${innerWidth}x${innerHeight}, pixel ratio ${devicePixelRatio}, screen ${screen.width}x${screen.height}`,
    `CPU cores: ${navigator.hardwareConcurrency ?? '?'}, memory: ${nav.deviceMemory ? `${nav.deviceMemory} GB` : '?'}`,
    `Settings: graphics ${loadGraphicsQuality()}, effects ${loadEffectsMode()}`,
    '',
    '== Frames ==',
    `Typical frame ${ms(median)} (about ${median > 0 ? Math.round(1000 / median) : '?'} fps); 95% under ${ms(pct(sorted, 0.95))}; 99% under ${ms(pct(sorted, 0.99))}; slowest ${ms(sorted[sorted.length - 1] ?? 0)}`,
    `Frames over 33 ms: ${over(33)}, over 50 ms: ${over(50)}, over 100 ms: ${over(100)}`,
    '',
    `== The ${worst.length} longest stalls (of ${r.long.length}) ==`,
    ...(worst.length
      ? worst.flatMap((l) => [
          `${at(l.at)}: ${Math.round(l.dur)} ms (blocking ${Math.round(l.blocking)} ms, style and layout ${Math.round(l.layout)} ms), while: ${l.during}`,
          ...l.scripts.map((s) => `    ${s}`),
        ])
      : ['none recorded (or this browser cannot tell)']),
    '',
    '== What the game was doing (last 60) ==',
    ...r.notes.slice(-60).map((n) => `${at(n.at)}: ${n.text}`),
  ];
  report = lines.join('\n');
  changed();
  return report;
}
