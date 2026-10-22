// PREVIEW HARNESS ONLY. These helpers stand in for the rules while the browser build is a visual preview:
// they decide who an attack hits and when a monster "dies" so the animations can be tried by hand.
// In the real duel every one of these comes from the engine's GameEvents / legalActions(), and this file
// goes away. Nothing here may be imported by engine, ai or campaign code.

export const UNIT_SLOT_COUNT = 5;

/** First free unit slot on my side (used by keyboard play, which has no pointer position). */
export function firstFreeUnitSlot(isTaken: (key: string) => boolean): string | null {
  for (let i = 0; i < UNIT_SLOT_COUNT; i++) {
    const key = `me-unit-${i}`;
    if (!isTaken(key)) return key;
  }
  return null;
}

/** Guard after taking damage, and whether that defeats the monster. */
export function previewDamage(guard: number, amount: number): { left: number; dies: boolean } {
  const left = Math.max(0, guard - amount);
  return { left, dies: left === 0 };
}

/** The opposing unit in the same column if there is one, else the first opposing unit, else the player's face (null). */
export function previewTarget(attackerKey: string, foes: readonly string[]): string | null {
  const mine = attackerKey.startsWith('me-');
  const idx = attackerKey.split('-')[2] ?? '0';
  const same = `${mine ? 'opp' : 'me'}-unit-${idx}`;
  return foes.includes(same) ? same : (foes[0] ?? null);
}

export const TRAP_SLOT_COUNT = 4;

/** First free trap slot on my side (keyboard play has no pointer position). */
export function firstFreeTrapSlot(isTaken: (key: string) => boolean): string | null {
  for (let i = 0; i < TRAP_SLOT_COUNT; i++) {
    const key = `me-trap-${i}`;
    if (!isTaken(key)) return key;
  }
  return null;
}

/** Who a sprung trap hits in the preview: the first opposing monster, or nobody. */
export function previewSpringTarget(foes: readonly string[]): string | null {
  return foes[0] ?? null;
}

export const isTrapKey = (key: string): boolean => key.includes('-trap-');
