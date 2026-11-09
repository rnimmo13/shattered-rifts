// The Settings menu (DECISIONS #571): one panel, opened from any screen, for the player's preferences (sound, graphics, tips).
// Each preference keeps its own storage where it always lived; this only opens the panel and tells an open screen (a fight)
// what changed, so it can apply it at once.

import { useEffect } from 'react';

const OPEN = 'sr:settings-open';
const CHANGED = 'sr:settings-changed';

/** What changed: sound needs no telling (the sound module reads its own setting on every sound), so it is not announced. */
export type SettingKind = 'graphics' | 'tips' | 'models';

/** Opens the Settings panel (from a button on any screen). */
export function openSettings(): void {
  window.dispatchEvent(new Event(OPEN));
}

export function onSettingsOpen(cb: () => void): () => void {
  window.addEventListener(OPEN, cb);
  return () => window.removeEventListener(OPEN, cb);
}

/** A setting was changed in the panel. */
export function settingsChanged(kind: SettingKind): void {
  window.dispatchEvent(new CustomEvent<SettingKind>(CHANGED, { detail: kind }));
}

/** Runs `cb` with what changed, whenever a setting changes, while the component is mounted. */
export function useSettingsChanged(cb: (kind: SettingKind) => void): void {
  useEffect(() => {
    const on = (e: Event): void => cb((e as CustomEvent<SettingKind>).detail);
    window.addEventListener(CHANGED, on);
    return () => window.removeEventListener(CHANGED, on);
  }, [cb]);
}
