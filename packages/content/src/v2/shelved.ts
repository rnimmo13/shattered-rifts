// The cards that were Legendary until Robert put Legendary away (2026-10-28, DECISIONS #363: "do away with legendary cards for now,
// we will add those once the base set of common/uncommon/rare is balanced"). They are Rares now. When Legendary comes back, set their
// rarity back in the pool files and empty this list. The code that handles a Legendary (the one-per-deck limit, the Warden's Gift, the
// reliquary, the Arena's limit) is still there and still tested: those tests call `lendLegendaries` to make these cards Legendary
// for the length of a test file.

import type { CombatDb } from '@sr/combat';

export const SHELVED_LEGENDARIES: readonly string[] = [
  // engineer
  'overclocked-legion',
  'foundry-awakens',
  // hunter
  'hunger-unleashed',
  'bloodmoon-hunt',
  'apex-maw',
  // trickster (was trapper, DECISIONS #372)
  'the-perfect-trap',
  'the-long-ambush',
  'masquerade',
  // assassin: none (Sylas is exactly the Silent's list, and his three went with his older cards)
  // shaman: none (he is the Defect's card list, which has no Legendary)
  // monk (was barbarian)
  'perfect-balance',
  'still-flame-ascendant',
  'eye-of-the-storm',
  // (spellblade: none, she is the Regent's card list, which has no Legendary to put away)
  // necromancer: none (Dorian is the Necrobinder's card list, which has no Legendary)
  // drunkard
  'one-more-round',
  'the-glass-palace',
  'the-twelve-gauge-opera',
  // neutral
  'heart-of-the-rift',
  'rift-collapse',
];

/**
 * For tests of the Legendary rules only: turn the shelved cards (and their "+" versions) back into Legendaries, and return the
 * function that makes them Rares again. It changes the shared card data, so call it in `beforeAll` and the undo in `afterAll`.
 */
export function lendLegendaries(db: CombatDb): () => void {
  const lent: string[] = [];
  for (const id of SHELVED_LEGENDARIES)
    for (const key of [id, `${id}+`]) {
      const c = db.cards[key];
      if (c && c.rarity === 'rare') {
        c.rarity = 'legendary';
        lent.push(key);
      }
    }
  return () => {
    for (const key of lent) {
      const c = db.cards[key];
      if (c) c.rarity = 'rare';
    }
  };
}
