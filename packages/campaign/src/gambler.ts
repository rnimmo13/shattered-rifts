// The Gambler's Shrine (DECISIONS #234): from Rift Tier VI a Shrine offers more, and asks you to wager for some of it. Two
// different blessings a visit from seven (the three quiet ones, and four wagers that grow with the run), with the Brass Reel in an
// alcove for anyone with shards to spend. You can walk away at any time.

import { nextInt } from '@sr/combat';
import {
  COMBAT_DB,
  canMark,
  canRoll,
  markOf,
  rollOf,
  stripRoll,
  type CardMark,
} from '@sr/content/v2';
import { crossedOffers } from './rewards';
import type { RunState } from './types';

/** From this Rift Tier a Shrine is a Gambler's Shrine. */
export const GAMBLER_TIER = 6;
/** How many different blessings a Gambler's Shrine gives a visit. */
export const GAMBLER_BLESSINGS = 2;

export type ShrineKind =
  | 'rest'
  | 'upgrade'
  | 'remove'
  /** give up a card of yours for one of three Rift-crossed cards on the altar */
  | 'sacrifice'
  /** roll the dice on a card: it is sanctified, up or down (the odds better the deeper the tier) */
  | 'dice'
  /** the shrine's chisel engraves its keyword onto a card */
  | 'engrave'
  /** sign the Ledger: Max HP, more for every time you have signed it this run */
  | 'ledger';

export interface GamblerShrine {
  taken: ShrineKind[];
  /** the Rift-crossed cards on the altar, for a sacrifice */
  altar: string[];
  /** the keyword the chisel cuts today */
  chisel: CardMark;
  /** what the last wager did, said on the shrine */
  note?: string;
}

/** The chance (percent) that Loaded Dice roll a card up: 60% at Tier VI, 2 points better each tier after, to 80%. */
export function diceOdds(tier: number): number {
  return Math.min(80, 60 + 2 * Math.max(0, tier - GAMBLER_TIER));
}

/** The Max HP the Ledger gives the next time it is signed: 4, then 2 more each signature this run (4, 6, 8, ...). */
export function ledgerGain(run: Pick<RunState, 'ledger'>): number {
  return 4 + 2 * (run.ledger ?? 0);
}

/** The altar's rarities: a rare and two uncommons, three rares from Tier X. */
export function altarRarities(tier: number): string[] {
  return tier >= 10 ? ['rare', 'rare', 'rare'] : ['rare', 'uncommon', 'uncommon'];
}

const CHISELS: readonly CardMark[] = ['hold', 'opening', 'flare'];

/** A new Gambler's Shrine for this run (rolls its altar and chisel from the run's PRNG). */
export function makeGambler(r: RunState): GamblerShrine {
  return {
    taken: [],
    altar: crossedOffers(r.rng, r.character, r.deck, altarRarities(r.tier), 3),
    chisel: CHISELS[nextInt(r.rng, CHISELS.length)] as CardMark,
  };
}

/** Cards in the deck the Loaded Dice can roll: they have a number to change, and no roll yet. */
export function diceable(deck: readonly string[]): string[] {
  return [
    ...new Set(
      deck.filter((id) => {
        const base = COMBAT_DB.cards[stripRoll(id)];
        return rollOf(id) === 0 && !!base && canRoll(base);
      }),
    ),
  ];
}

/** Cards in the deck the chisel can engrave: no tag yet, not sanctified (that is final, DECISIONS #327), and the keyword changes something. */
export function engravable(deck: readonly string[], mark: CardMark): string[] {
  return [
    ...new Set(
      deck.filter((id) => {
        const c = COMBAT_DB.cards[stripRoll(id).replace(/\+$/, '')];
        return (
          markOf(id) === null &&
          rollOf(id) === 0 &&
          !!COMBAT_DB.cards[id] &&
          !!c &&
          canMark(c, mark)
        );
      }),
    ),
  ];
}
