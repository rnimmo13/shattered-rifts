// The Rift Cache (DECISIONS #549): one a map, a stop with no fight. An open one lets you take one thing of three; a trapped one holds
// two of them together, behind a Snare you spring, reach past or disarm. Built on the data-driven events, so it is shown and settled as one.

import { nextInt } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import type { EventCtx } from './deals';
import { hurtPct, make, shards, wound, type DealSpec, type OptSpec } from './eventDeals';
import { cardOfRarity, offerBoon } from './rewards';
import type { DealStep, RunState } from './types';

/** The chance (percent) that a Cache is trapped. */
export const CACHE_TRAP_CHANCE = 40;
/** An open Cache's shards, the third of its three things. */
export const CACHE_STASH = 75;
/** A trapped Cache: the share of Max HP its Snare takes when sprung, and the shards it costs to disarm. */
export const CACHE_TRAP_HP_PCT = 15;
export const CACHE_DISARM = 60;

const TEXT_OPEN =
  'A strongbox half sunk in rift-glass, its seal already broken. Someone left in a hurry, and left most of it behind. There is room in your pack for one thing.';
const TEXT_TRAPPED =
  'A strongbox half sunk in rift-glass, still sealed. A thin wire runs from its lid to a Snare coiled beneath: whoever left this meant to come back for it.';

/** The Cache at the current stop: open or trapped, and what is in it (its Boon is one the run does not have, named here). */
export function buildCache(r: RunState): EventCtx {
  const boonId = offerBoon(r.rng, r.boons);
  // (the Boon by name, so a choice can be checked before it is taken)
  const boon: DealStep[] = boonId ? [{ k: 'boonOf', id: boonId }] : [];
  const boonName = boonId ? (COMBAT_DB.boons[boonId]?.name ?? 'the Boon') : '';
  // (one rare card, named on every option that gives it, so the options differ only in their price)
  const cardId = cardOfRarity(r.rng, r.character, r.deck, 'rare');
  const card: DealStep[] = cardId ? [{ k: 'card', id: cardId }] : [];
  const cardName = cardId ? (COMBAT_DB.cards[cardId]?.name ?? 'a rare card') : '';
  const trapped = nextInt(r.rng, 100) < CACHE_TRAP_CHANCE;
  let opts: OptSpec[];
  if (trapped) {
    // two of the three together: the Boon and the rare card, or the stash in place of whichever is missing
    const parts: [DealStep[], string][] = [
      ...(boonId ? [[boon, boonName] as [DealStep[], string]] : []),
      ...(cardId ? [[card, cardName] as [DealStep[], string]] : []),
      [[shards(CACHE_STASH)], `${CACHE_STASH} shards`],
    ];
    const two = parts.slice(0, 2);
    const prize = two.flatMap(([steps]) => steps);
    const what = `take ${two.map(([, name]) => name).join(' and ')}`;
    opts = [
      [
        `Spring the trap (lose ${CACHE_TRAP_HP_PCT}% of your Max HP): ${what}`,
        [hurtPct(CACHE_TRAP_HP_PCT), ...prize],
        'The Snare bites. The lid comes open.',
        'optional',
      ],
      [
        `Reach past the wire (a Wound joins your deck): ${what}`,
        [wound(), ...prize],
        'The wire grazes you on the way out.',
        'optional',
      ],
      [
        `Disarm it (pay ${CACHE_DISARM} shards): ${what}`,
        [{ k: 'shards', n: -CACHE_DISARM }, ...prize],
        'Patient work, and the wire goes slack.',
        'optional',
      ],
    ];
  } else {
    opts = [
      ...(boonId
        ? [[`Take the Boon: ${boonName}`, boon, 'It hums as you lift it.'] satisfies OptSpec]
        : []),
      ...(cardId
        ? [[`Take the card: ${cardName}`, card, 'Wrapped in oilcloth, untouched.'] satisfies OptSpec]
        : []),
      [`Take the stash: +${CACHE_STASH} shards`, [shards(CACHE_STASH)], 'Heavy, and worth it.'],
    ];
  }
  const spec: DealSpec = {
    id: trapped ? 'cache-trapped' : 'cache-open',
    weight: 0,
    title: trapped ? 'A trapped Rift Cache' : 'A Rift Cache',
    text: trapped ? TEXT_TRAPPED : TEXT_OPEN,
    opts,
  };
  // (the Boon is shown beside the options, as an event's Boon is)
  return { ...make(spec, r), ...(boonId ? { boonOffer: boonId } : {}) };
}
