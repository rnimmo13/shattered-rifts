// Preludes: the choices at the start of a run (The Threshold) and at the start of every stage (a Waymark), in the spirit of
// the opening events of other deckbuilders. Each offer is a few options; each option is a list of plain effects, so the text on
// screen is generated from the same data that is applied, and the whole thing is saved and replayed with the run.
//
// Offers use the run's own seeded PRNG, so a seed and the choices made reproduce the same run.

import { nextInt, type RngState } from '@sr/combat';
import { REALM_LABEL } from './rewards';
import type { PreludeEffect, PreludeKind, PreludeOffer, PreludeOption, StageRealm } from './types';

const rarityWord = {
  common: 'common',
  uncommon: 'uncommon',
  rare: 'rare',
  legendary: 'legendary',
  ancestral: 'ancestral',
} as const;

/** Plain-language text for one effect. */
export function describeEffect(e: PreludeEffect): string {
  switch (e.k) {
    case 'maxHp':
      return e.n >= 0 ? `+${e.n} max HP` : `${e.n} max HP`;
    case 'heal':
      return `Heal ${e.pct}% of your max HP`;
    case 'hp':
      return `Lose ${e.n} HP`;
    case 'shards':
      return `+${e.n} shards`;
    case 'card':
      return `Add a random ${rarityWord[e.rarity]} card to your deck`;
    case 'upgrade':
      return e.n === 1
        ? 'Upgrade a random card in your deck'
        : `Upgrade ${e.n} random cards in your deck`;
    case 'remove':
      return e.n === 1
        ? 'Remove a Strike or Defend from your deck'
        : `Remove ${e.n} Strikes or Defends from your deck`;
    case 'boon':
      return `Gain a random ${rarityWord[e.rarity]} Boon`;
    case 'potion':
      return 'Take a random Potion';
    case 'resolve':
      return `+${e.n} Resolve`;
    case 'wound':
      return e.n === 1 ? 'Add a Wound to your deck' : `Add ${e.n} Wounds to your deck`;
    case 'transform':
      return `Transform ${e.n} Strikes or Defends in your deck into random ${e.better ? 'uncommon or rare ' : ''}cards`;
    case 'pick':
      return `Choose one of three ${e.upgraded ? 'upgraded ' : ''}${rarityWord[e.rarity]} cards for your deck`;
  }
}

const opt = (id: string, name: string, effects: PreludeEffect[], risky = false): PreludeOption => ({
  id,
  name,
  text: effects.map(describeEffect).join('. ') + '.',
  effects,
  ...(risky ? { risky } : {}),
});

// What an option is worth (docs/BALANCE.md, "Threshold and Waymarks"): a blessing is one solid thing, about 100 shards' worth; a
// bargain pays clearly more than any blessing, and its price is mostly HP you can heal, not something the deck carries for good.
// Cards are always a choice of three from your own class (a random card is usually from a lane you are not playing).

/** Good things with no strings; the amounts grow a little with the stage. `hurt`: Resolve is missing, so Resolve is worth offering. */
function blessings(stage: number, hurt: boolean): PreludeOption[] {
  return [
    opt('hardened', 'Rift-hardened', [{ k: 'maxHp', n: 10 }]),
    opt('purse', 'A Full Purse', [{ k: 'shards', n: 100 + stage * 20 }]),
    opt('open-hand', 'Open Hand', [{ k: 'pick', rarity: 'uncommon' }]),
    opt('honed', 'Honed Edges', [{ k: 'upgrade', n: 2 }]),
    opt('lighter', 'Lighter Load', [{ k: 'remove', n: 2 }]),
    opt('keepsake', "Traveller's Keepsake", [
      { k: 'potion' },
      { k: 'potion' },
      { k: 'shards', n: 40 },
    ]),
    opt('trinket', 'A Trinket of the Road', [{ k: 'boon', rarity: 'common' }]),
    opt('whetstone', 'Whetstone and Oil', [
      { k: 'upgrade', n: 1 },
      { k: 'shards', n: 60 },
    ]),
    opt('frame', 'Sturdy Frame', [
      { k: 'maxHp', n: 6 },
      { k: 'shards', n: 50 },
    ]),
    opt('clear-out', 'A Clear-Out', [
      { k: 'remove', n: 1 },
      { k: 'pick', rarity: 'common' },
    ]),
    opt('two-gifts', "Wayfinder's Gift", [
      { k: 'pick', rarity: 'common', upgraded: true },
      { k: 'shards', n: 40 },
    ]),
    opt('pilgrim', "Pilgrim's Blessing", [
      { k: 'maxHp', n: 6 },
      { k: 'upgrade', n: 1 },
    ]),
    opt('cache', 'A Hidden Cache', [{ k: 'shards', n: 120 + stage * 15 }]),
    opt('lucky-find', 'A Lucky Find', [
      { k: 'boon', rarity: 'common' },
      { k: 'shards', n: 40 },
    ]),
    opt('apothecary', "Apothecary's Satchel", [{ k: 'potion' }, { k: 'upgrade', n: 1 }]),
    // Resolve only helps a run that has lost some (a fresh run is already full)
    ...(hurt
      ? [
          opt('nerve', 'Steeled Nerves', [{ k: 'resolve', n: 1 }]),
          opt('calm-mind', 'A Calm Mind', [
            { k: 'resolve', n: 1 },
            { k: 'shards', n: 40 },
          ]),
        ]
      : []),
  ];
}

/** Bigger rewards with a price. */
function bargains(stage: number): PreludeOption[] {
  return [
    opt(
      'blood-price',
      'Blood Price',
      [
        { k: 'hp', n: 12 },
        { k: 'pick', rarity: 'rare' },
      ],
      true,
    ),
    opt(
      'heavy-purse',
      'Heavy Purse',
      [
        { k: 'shards', n: 260 + stage * 30 },
        { k: 'wound', n: 1 },
      ],
      true,
    ),
    opt(
      'hungry-rift',
      'The Rift Is Hungry',
      [
        { k: 'maxHp', n: -6 },
        { k: 'boon', rarity: 'rare' },
      ],
      true,
    ),
    opt(
      'trade-up',
      'Trade Up',
      [
        { k: 'hp', n: 8 },
        { k: 'transform', n: 3, better: true },
      ],
      true,
    ),
    opt(
      'legends-price',
      "A Legend's Price",
      [
        { k: 'hp', n: 15 },
        { k: 'pick', rarity: 'legendary' },
      ],
      true,
    ),
    opt(
      'call-ancestors',
      'Call on the Ancestors',
      [
        { k: 'hp', n: 12 },
        { k: 'pick', rarity: 'ancestral' },
      ],
      true,
    ),
    opt(
      'silver-sale',
      'Sell the Silver',
      [
        { k: 'hp', n: 8 },
        { k: 'shards', n: 200 + stage * 25 },
      ],
      true,
    ),
    opt(
      'haunted-gift',
      'A Haunted Gift',
      [
        { k: 'boon', rarity: 'uncommon' },
        { k: 'boon', rarity: 'common' },
        { k: 'wound', n: 1 },
      ],
      true,
    ),
    opt(
      'blood-for-steel',
      'Blood for Steel',
      [
        { k: 'hp', n: 10 },
        { k: 'upgrade', n: 4 },
      ],
      true,
    ),
    opt(
      'hollow-bargain',
      'A Hollow Bargain',
      [
        { k: 'maxHp', n: -5 },
        { k: 'pick', rarity: 'rare', upgraded: true },
      ],
      true,
    ),
    opt(
      'cursed-crown',
      'The Cursed Crown',
      [
        { k: 'wound', n: 1 },
        { k: 'hp', n: 10 },
        { k: 'boon', rarity: 'rare' },
      ],
      true,
    ),
    opt(
      'fire-sale',
      'Fire Sale',
      [
        { k: 'hp', n: 8 },
        { k: 'remove', n: 3 },
      ],
      true,
    ),
    opt(
      'reckless-haste',
      'Reckless Haste',
      [{ k: 'hp', n: 8 }, { k: 'potion' }, { k: 'potion' }, { k: 'shards', n: 100 }],
      true,
    ),
    opt(
      'heavy-heart',
      'Heavy Heart',
      [
        { k: 'maxHp', n: 25 },
        { k: 'wound', n: 1 },
      ],
      true,
    ),
  ];
}

/**
 * Every option the Threshold and the Waymarks can offer, as they read at `stage` (for the How to play page). The Resolve blessings are
 * included, though they only appear when a run is missing Resolve; a Waymark always offers its rest as well.
 */
export function preludeCatalogue(stage = 1): {
  rest: PreludeOption;
  blessings: PreludeOption[];
  bargains: PreludeOption[];
} {
  return {
    rest: opt('rest', 'Rest by the Waymark', [{ k: 'heal', pct: 30 }]),
    blessings: blessings(stage, true),
    bargains: bargains(stage),
  };
}

const FLAVOUR: Record<StageRealm, string> = {
  aurelion: 'A cracked bell hangs from a gilded archway. Someone has left offerings beneath it.',
  nexus: 'A maintenance hatch stands open, a console blinking: SALVAGE AVAILABLE, TAKE ONE.',
  wyldmaw: 'A ring of bones around a warm fire. Whoever made it is watching from the dark.',
  umbral: 'A masked figure sits at an empty table. Three cards are face up. A fourth is not.',
  rift: 'The air itself offers. You are close to the Heart, and the Rift knows it.',
};

function takeDistinct<T>(rng: RngState, list: readonly T[], n: number): T[] {
  const pool = [...list];
  const out: T[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(nextInt(rng, pool.length), 1)[0] as T);
  return out;
}

/**
 * The offer for the start of a run or of a stage.
 *  threshold: three blessings and one bargain.
 *  stage: a rest by the waymark (always), two blessings, and half the time a bargain.
 */
export function makePrelude(
  rng: RngState,
  kind: PreludeKind,
  stage: number,
  realm: StageRealm,
  /** the run is missing some Resolve, so Resolve blessings can be offered */
  hurt = false,
): PreludeOffer {
  if (kind === 'threshold') {
    return {
      kind,
      title: 'The Threshold',
      text: 'Before the first step into the Rift, something offers you a choice. Take one.',
      options: [
        ...takeDistinct(rng, blessings(stage, hurt), 3),
        ...takeDistinct(rng, bargains(stage), 1),
      ],
    };
  }
  const options: PreludeOption[] = [
    preludeCatalogue(stage).rest,
    ...takeDistinct(rng, blessings(stage, hurt), 2),
  ];
  if (nextInt(rng, 2) === 0) options.push(...takeDistinct(rng, bargains(stage), 1));
  return {
    kind,
    title: `Waymark: ${REALM_LABEL[realm]}`,
    text: FLAVOUR[realm],
    options,
  };
}
