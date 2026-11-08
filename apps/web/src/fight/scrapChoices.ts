// The no-room prompt's choices: a button for each way to make room, and whether playing the card as it is would do anything at all.

import type { CardDef } from '@sr/combat';

/** One button for each set of companions that makes room. Companions that read the same (name and HP) share a button. */
export function scrapChoices(
  sets: readonly string[][],
  describe: (unit: string) => string,
  /** the button's first word: "Scrap", or "Release" when they make way for a Colossus */
  verb = 'Scrap',
): { set: string[]; label: string }[] {
  const seen = new Set<string>();
  return sets.flatMap((set) => {
    const label = `${verb} ${set.map(describe).join(' and ')}`;
    if (seen.has(label)) return [];
    seen.add(label);
    return [{ set, label }];
  });
}

/** A Raise Colossus card: its Colossus always comes, so the companions that make way are chosen, never skipped (Robert 2026-11-08). */
export function raisesColossus(def: CardDef): boolean {
  return def.effects.some((o) => o.op === 'raise' && o.same === true);
}

/** Playing a card with no room is only a real choice if something comes of it: a card that only summons, and none would come, is wasted. */
export function playAnywayHelps(def: CardDef, fit: number): boolean {
  // (played as it is, a Raise Colossus card would still release the weakest: the choice is which, not whether)
  if (raisesColossus(def)) return false;
  return fit > 0 || def.effects.some((o) => o.op !== 'summon');
}
