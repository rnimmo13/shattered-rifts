// The no-room prompt's choices: a button for each way to make room, and whether playing the card as it is would do anything at all.

import type { CardDef } from '@sr/combat';

/** One button for each set of companions that makes room. Companions that read the same (name and HP) share a button. */
export function scrapChoices(
  sets: readonly string[][],
  describe: (unit: string) => string,
): { set: string[]; label: string }[] {
  const seen = new Set<string>();
  return sets.flatMap((set) => {
    const label = `Scrap ${set.map(describe).join(' and ')}`;
    if (seen.has(label)) return [];
    seen.add(label);
    return [{ set, label }];
  });
}

/** Playing a card with no room is only a real choice if something comes of it: a card that only summons, and none would come, is wasted. */
export function playAnywayHelps(def: CardDef, fit: number): boolean {
  return fit > 0 || def.effects.some((o) => o.op !== 'summon');
}
