// Which cards a step of the run upgraded: the difference between the deck before and after. It does not matter where the upgrade came
// from (a Shrine, the merchant, an event, a trial prize, a starting choice), so the screen can always say what changed.

import { COMBAT_DB } from '@sr/content/v2';

/** The cards that were swapped for their upgraded form between two decks, as [before, after] pairs of card ids. */
export function upgradedCards(
  before: readonly string[],
  after: readonly string[],
): [string, string][] {
  const left = [...after];
  const gone: string[] = [];
  for (const id of before) {
    const i = left.indexOf(id);
    if (i >= 0) left.splice(i, 1);
    else gone.push(id);
  }
  const out: [string, string][] = [];
  for (const id of gone) {
    const up = COMBAT_DB.cards[id]?.upgrade;
    const i = up ? left.indexOf(up) : -1;
    if (up && i >= 0) {
      left.splice(i, 1);
      out.push([id, up]);
    }
  }
  return out;
}
