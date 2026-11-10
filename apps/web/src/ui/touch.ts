// Whether the player is on a touch screen (a phone or a tablet): the words on screen then say "tap" and "hold", and never name a
// key or a hover. The same question the stylesheets ask with `@media (pointer: coarse)`, so words and layout always agree.

export const touchScreen = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches;
