// Background music (DECISIONS #664): Woodland Fantasy loops everywhere outside battle; each battle starts
// Blackmoor Tides from the beginning and loops it until the battle ends. Beating Drago opens the victory
// screen with Beyond the Clouds from the beginning, looping while it stays open. Leaving a battle or the
// victory screen resumes the woodland track where it paused. Music has its own on/off and volume.

import { battleActive, battleSerial, subscribeBattle } from '../battleActivity';

const KEY = 'sr.music';
const FADE_MS = 600;
/** The soundtracks are mixed loud: the Music volume setting plays them at a quarter of that level (Robert, DECISIONS #667, #669). */
export const MUSIC_GAIN = 0.25;
const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;

interface MusicSettings {
  on: boolean;
  volume: number;
}

function load(): MusicSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<MusicSettings>;
      return {
        on: v.on !== false,
        volume: typeof v.volume === 'number' ? Math.min(1, Math.max(0, v.volume)) : 0.4,
      };
    }
  } catch {
    /* storage may be unavailable */
  }
  return { on: true, volume: 0.4 };
}

let settings = load();
let menu: HTMLAudioElement | null = null;
let battle: HTMLAudioElement | null = null;
let victory: HTMLAudioElement | null = null;
let lastBattle = -1;
let victories = 0;
let victorySerial = 0;
let lastVictory = -1;
let waitingForGesture = false;

export const getMusic = (): MusicSettings => ({ ...settings });

export function setMusic(next: Partial<MusicSettings>): void {
  settings = { ...settings, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* non-fatal */
  }
  apply();
}

/** The campaign victory screen is open: its theme plays from the start. Returns the call for closing it. */
export function enterVictory(): () => void {
  victories++;
  victorySerial++;
  apply();
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    victories--;
    apply();
  };
}

const fades = new Map<HTMLAudioElement, number>();
/** Ramp a track's volume to `to`, pausing it at the end when it faded to silence. */
function fade(audio: HTMLAudioElement, to: number, pauseAtEnd: boolean): void {
  const running = fades.get(audio);
  if (running !== undefined) window.clearInterval(running);
  const from = audio.volume;
  const start = performance.now();
  const id = window.setInterval(() => {
    const t = Math.min(1, (performance.now() - start) / FADE_MS);
    audio.volume = Math.min(1, Math.max(0, from + (to - from) * t));
    if (t < 1) return;
    window.clearInterval(id);
    fades.delete(audio);
    if (pauseAtEnd) audio.pause();
  }, 50);
  fades.set(audio, id);
}

const files = new Map<HTMLAudioElement, string>();
const loading = new Set<HTMLAudioElement>();
/**
 * Download a track once and play it from memory. The website's static hosting answers byte-range
 * requests with the whole file, and browsers cannot seek, restart or loop media served that way; a
 * blob URL is always seekable. If the download fails, fall back to streaming the file directly.
 */
function download(audio: HTMLAudioElement): void {
  const url = files.get(audio);
  if (!url || audio.src || loading.has(audio)) return;
  loading.add(audio);
  void fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Music ${response.status}`);
      return response.blob();
    })
    .then((blob) => URL.createObjectURL(blob))
    .catch(() => url)
    .then((src) => {
      loading.delete(audio);
      audio.src = src;
      apply();
    });
}

function play(audio: HTMLAudioElement): void {
  if (!audio.src) {
    // (still downloading: apply() runs again once it arrives)
    download(audio);
    return;
  }
  void audio.play().catch(() => {
    // Browsers refuse sound before the first click or key press: try again on the next one.
    if (waitingForGesture) return;
    waitingForGesture = true;
    // (a touch only counts as a gesture once it is released, so phones need pointerup/touchend)
    const retry = (): void => {
      waitingForGesture = false;
      for (const type of GESTURES) window.removeEventListener(type, retry, true);
      apply();
    };
    for (const type of GESTURES) window.addEventListener(type, retry, true);
  });
}

function stop(audio: HTMLAudioElement | null): void {
  if (audio && !audio.paused) fade(audio, 0, true);
}

function start(audio: HTMLAudioElement, fromStart: boolean): void {
  if (fromStart) audio.currentTime = 0;
  if (audio.paused) audio.volume = 0;
  play(audio);
  fade(audio, settings.volume * MUSIC_GAIN, false);
}

/** Only `keep` plays; every other track fades out. */
function only(keep: HTMLAudioElement | null): void {
  for (const track of [menu, battle, victory]) if (track !== keep) stop(track);
}

/** Bring the music in line with the settings, the page's visibility and the screen that is open. */
function apply(): void {
  if (!menu || !battle || !victory) return;
  const hidden = typeof document !== 'undefined' && document.hidden;
  if (!settings.on || hidden) {
    only(null);
    return;
  }
  if (battleActive()) {
    const serial = battleSerial();
    const fresh = serial !== lastBattle;
    lastBattle = serial;
    only(battle);
    // A new battle starts the track over; an open one carries on.
    if (fresh) start(battle, true);
    else start(battle, false);
    return;
  }
  if (victories > 0) {
    const fresh = victorySerial !== lastVictory;
    lastVictory = victorySerial;
    only(victory);
    start(victory, fresh);
    return;
  }
  only(menu);
  start(menu, false);
}

function track(file: string, loop: boolean): HTMLAudioElement {
  const audio = new Audio();
  audio.loop = loop;
  audio.preload = 'auto';
  files.set(audio, `${import.meta.env.BASE_URL}music/${file}`);
  return audio;
}

/** Start the music system once, at startup. */
export function startMusic(): void {
  if (menu || typeof Audio === 'undefined') return;
  menu = track('woodland-fantasy.mp3', true);
  battle = track('blackmoor-tides.mp3', true);
  victory = track('beyond-the-clouds.mp3', true);
  // The battle theme downloads ahead so the first fight opens with it; the victory theme is only
  // fetched if someone reaches the ending.
  download(battle);
  // Battle listeners fire twice in one commit when a fight replaces another: settle once afterwards.
  let queued = false;
  subscribeBattle(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      apply();
    });
  });
  document.addEventListener('visibilitychange', apply);
  apply();
}
