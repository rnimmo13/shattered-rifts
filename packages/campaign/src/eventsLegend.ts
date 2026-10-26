// The third event batch (2026-10-25, DECISIONS #238): a Legendary given up for another (one of your own, or one from another
// Riftwalker, which you may take or leave), and a handful of events with a sharper choice in them. Same shape as eventsTuned.ts.

import { nextInt } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, rewardPool, stripRoll, type HeroId } from '@sr/content/v2';
import {
  chance,
  copy,
  def,
  heal,
  hurt,
  hurtPct,
  maxHp,
  shards,
  upgrade,
  wound,
  type DealSpec,
  type OptSpec,
} from './eventDeals';
import type { EventDef } from './events';
import type { DealStep, RunState } from './types';

const swap = (from: string, to: string): DealStep => ({ k: 'swap', from, to });
const staticCard = (n = 1): DealStep => ({ k: 'static', n });
const choose = (act: 'upgrade' | 'remove' | 'transform' | 'copy'): DealStep => ({
  k: 'choose',
  act,
});
const crossedPick = (rarity: 'common' | 'uncommon' | 'rare'): DealStep => ({
  k: 'crossedPick',
  rarity,
});
const loseBoon: DealStep = { k: 'loseBoon' };
const losePotion: DealStep = { k: 'losePotion', n: 1 };
const exchange: DealStep = { k: 'exchange' };

const name = (id: string): string => COMBAT_DB.cards[id]?.name ?? 'a card';
const base = (id: string): string => stripRoll(id).replace(/\+$/, '');
const isLegend = (id: string): boolean => COMBAT_DB.cards[base(id)]?.rarity === 'legendary';
/** a Riftwalker's Legendary cards (their pool's, plain) */
const legendsOf = (h: HeroId): string[] =>
  rewardPool(h).filter(
    (id) => COMBAT_DB.cards[id]?.rarity === 'legendary' && COMBAT_DB.cards[id]?.hero === h,
  );
const pick = <T>(r: RunState, xs: readonly T[]): T | undefined =>
  xs.length ? xs[nextInt(r.rng, xs.length)] : undefined;

/**
 * The reliquary: one Legendary of yours goes on the altar, and three wait behind the glass: another of your own class's and two
 * from other Riftwalkers. Take one (yours is given up for it, upgraded if yours was), or keep what you have.
 */
function reliquary(r: RunState): { opts: OptSpec[]; cards: string[] } {
  const mine = pick(
    r,
    r.deck.filter((id) => isLegend(id)),
  );
  if (!mine) return { opts: [], cards: [] };
  const up = mine.endsWith('+');
  const held = new Set(r.deck.map(base));
  const asCard = (id: string): string => (up && COMBAT_DB.cards[id]?.upgrade) || id;
  const own = pick(
    r,
    legendsOf(r.character).filter((id) => !held.has(id)),
  );
  const others = (Object.keys(RIFTWALKERS) as HeroId[]).filter((h) => h !== r.character);
  const crossed: string[] = [];
  for (let tries = 0; tries < 12 && crossed.length < 2; tries++) {
    const h = pick(r, others);
    const id = h ? pick(r, legendsOf(h)) : undefined;
    if (id && !held.has(id) && !crossed.includes(id)) crossed.push(id);
  }
  const offers = [...(own ? [own] : []), ...crossed].map(asCard);
  const whose = (id: string): string => {
    const h = COMBAT_DB.cards[base(id)]?.hero as HeroId | undefined;
    return h && h !== r.character
      ? ` (Rift-crossed: ${RIFTWALKERS[h]?.hero.name.split(',')[0] ?? 'another'}'s)`
      : ' (your own class)';
  };
  return {
    cards: offers,
    opts: offers.map((id): OptSpec => [
      `Give up ${name(mine)} for ${name(id)}${whose(id)}${mine === stripRoll(mine) ? '' : ' (its roll or keyword stays behind)'}`,
      [swap(mine, id)],
      'The glass closes on what you left. What you took is warm in your hand.',
    ]),
  };
}

const SPECS: DealSpec[] = [
  {
    id: 'legend-reliquary',
    weight: 1.4,
    title: 'The reliquary of legends',
    text: 'Behind glass, on velvet, three cards that each ended a war somewhere. The keeper does not sell them. "A legend for a legend," she says, and looks at your deck. "Or keep yours. Most do."',
    opts: [],
    needs: (r) => r.deck.some((id) => isLegend(id)),
    dyn: reliquary,
  },
  {
    id: 'echo-bargain',
    weight: 1,
    title: 'The bargain of echoes',
    text: 'A canyon that answers everything twice. Speak a card into it and two come back, though the second is never quite clean.',
    opts: [
      [
        'Speak your best card: choose a card to copy, and two Static cards join your deck',
        [choose('copy'), staticCard(2)],
        'The echo comes back with grit in it.',
      ],
      [
        'Shout and see what answers (lose 6 HP): a random card of your deck is copied',
        [hurt(6), copy],
        'Something answers. Close enough.',
      ],
    ],
  },
  {
    id: 'fading-saint',
    weight: 0.9,
    title: 'The fading saint',
    text: 'A saint of some old order sits by the road, almost gone. "I can mend you whole," she says, "but I need something of yours to hold on to."',
    opts: [
      [
        'Give her a Boon (a random one of yours): heal to full and +6 max HP',
        [loseBoon, maxHp(6), heal(100)],
        'She holds it to her chest and is gone. You feel new.',
        'optional',
      ],
      [
        'Give her a potion: heal 30% of your HP',
        [losePotion, heal(30)],
        'She drinks it slowly and smiles.',
        'optional',
      ],
      ['Sit with her a while: heal 10% of your HP', [heal(10)], 'Neither of you says much.'],
    ],
  },
  {
    id: 'mirror-of-fates',
    weight: 0.9,
    title: 'The mirror of fates',
    text: 'A cracked mirror shows your deck as it might have been. Touch it and one of those decks becomes yours, the better one or the worse.',
    opts: [
      [
        'Touch it (half a chance each way): three random cards are upgraded, or two of your basic cards become random cards of your class',
        [chance(50, [upgrade(3)], [{ k: 'transform' }, { k: 'transform' }])],
      ],
      [
        'Break it (lose 8 HP): +100 shards from the silvered frame',
        [hurt(8), shards(100)],
        'Seven years, they say. Worth it.',
      ],
    ],
  },
  {
    id: 'rift-pilgrim',
    weight: 1,
    title: 'The Rift-crossed pilgrim',
    text: 'A pilgrim from another world, walking the wrong way through the Rift. "I would trade," they say. "My road for yours."',
    opts: [
      [
        'Trade cards: a random card of yours (not basic, Legendary or Ancestral) becomes a card of the same rarity from another Riftwalker',
        [exchange],
        'Your card goes down a road you will never walk.',
      ],
      [
        'Ask for their best (lose 12% of your HP): choose 1 of 3 rare cards from other Riftwalkers',
        [hurtPct(12), crossedPick('rare')],
        'It costs blood to carry something from so far away.',
      ],
    ],
  },
  {
    id: 'hungering-blade',
    weight: 0.8,
    title: 'The hungering blade',
    text: 'A sword sunk in the path, humming. It will not let you pass until it has been fed, one way or another.',
    noLeave: true,
    opts: [
      [
        'Let it drink (lose 12% of your HP): choose a card to upgrade',
        [hurtPct(12), choose('upgrade')],
        'It drinks, and then it sharpens something of yours.',
      ],
      [
        'Break it (a Wound joins your deck): +60 shards from its hilt',
        [wound(1), shards(60)],
        'It bites you as it breaks.',
      ],
    ],
  },
  {
    id: 'smugglers-cache',
    weight: 0.9,
    title: "The smuggler's cache",
    text: 'A loose stone, a hollow behind it, and a crate of contraband from three worlds. Someone will come back for it.',
    opts: [
      [
        'Take the crate (half a chance its owner catches you: lose 15 HP): choose 1 of 3 uncommon cards from other Riftwalkers, and +40 shards',
        [crossedPick('uncommon'), shards(40), chance(50, [], [hurt(15)])],
      ],
      ['Take only the coin: +45 shards', [shards(45)], 'Nobody misses a few coins.'],
    ],
  },
];

export const LEGEND_EVENTS: EventDef[] = SPECS.map(def);
