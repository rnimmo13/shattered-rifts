// The tiles a chance's reel is made of (DECISIONS #407): a run that repeats along the strip, with exactly the chance's share of
// "it goes your way" tiles (0) among "not this time" tiles (1), spread evenly so any stretch of the strip shows the real odds.
// A 60% chance is 12 of every 20 tiles; a chance that is not a multiple of 5 uses a run of 100.

export function oddsCycle(pct: number): number[] {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const len = p % 5 === 0 ? 20 : 100;
  const wins = Math.round((p * len) / 100);
  return Array.from({ length: len }, (_, i) =>
    Math.floor(((i + 1) * wins) / len) > Math.floor((i * wins) / len) ? 0 : 1,
  );
}
