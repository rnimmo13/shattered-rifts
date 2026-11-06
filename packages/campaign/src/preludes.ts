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
    case 'remove': {
      const one =
        e.only === 'strike' ? 'Strike' : e.only === 'defend' ? 'Defend' : 'Strike or Defend';
      const many =
        e.only === 'strike' ? 'Strikes' : e.only === 'defend' ? 'Defends' : 'Strikes or Defends';
      return e.n === 1 ? `Remove a ${one} from your deck` : `Remove ${e.n} ${many} from your deck`;
    }
    case 'boon':
      return 'Gain a random Boon';
    case 'potion':
      return 'Take a random Potion';
    case 'resolve':
      return `+${e.n} Resolve`;
    case 'wound':
      return e.n === 1 ? 'Add a Wound to your deck' : `Add ${e.n} Wounds to your deck`;
    case 'transform':
      return `Transform ${e.n} Strikes or Defends in your deck into random ${e.better ? 'uncommon or rare ' : ''}cards`;
    case 'pick':
      return `Choose one of three ${e.upgraded ? 'upgraded ' : ''}${rarityWord[e.rarity]} ${e.kind === 'attack' ? 'Attacks' : e.kind === 'skill' ? 'Skills' : 'cards'} for your deck`;
  }
}

const boonsIn = (effects: readonly PreludeEffect[]): number =>
  effects.filter((e) => e.k === 'boon').length;

const opt = (id: string, name: string, effects: PreludeEffect[], risky = false): PreludeOption => ({
  id,
  name,
  text:
    effects
      // (several Boons read as one line)
      .filter((e, i) => e.k !== 'boon' || effects.findIndex((x) => x.k === 'boon') === i)
      .map((e) =>
        e.k === 'boon' && boonsIn(effects) > 1
          ? `Gain ${boonsIn(effects)} random Boons`
          : describeEffect(e),
      )
      .join('. ') + '.',
  effects,
  ...(risky ? { risky } : {}),
});

// What an option is worth (docs/BALANCE.md, "Threshold and Waymarks"): a blessing is one solid thing, about 100 shards' worth; a
// bargain pays clearly more than any blessing, and its price is mostly HP you can heal, not something the deck carries for good.
// Cards are always a choice of three from your own class (a random card is often one you cannot use).

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
    opt('trinket', 'A Trinket of the Road', [{ k: 'boon' }]),
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
    // trades (DECISIONS #256): plain cards given up for a choice of a better card of one kind
    opt('trade-steel', 'Trade Steel', [
      { k: 'remove', n: 2, only: 'strike' },
      { k: 'pick', rarity: 'uncommon', kind: 'attack' },
    ]),
    opt('trade-guard', 'Trade Guard', [
      { k: 'remove', n: 2, only: 'defend' },
      { k: 'pick', rarity: 'uncommon', kind: 'skill' },
    ]),
    opt('fresh-steel', 'Fresh Steel', [
      { k: 'remove', n: 1, only: 'strike' },
      { k: 'pick', rarity: 'common', kind: 'attack', upgraded: true },
    ]),
    opt('quiet-study', 'Quiet Study', [
      { k: 'remove', n: 1, only: 'defend' },
      { k: 'pick', rarity: 'common', kind: 'skill', upgraded: true },
    ]),
    opt('pilgrim', "Pilgrim's Blessing", [
      { k: 'maxHp', n: 6 },
      { k: 'upgrade', n: 1 },
    ]),
    opt('cache', 'A Hidden Cache', [{ k: 'shards', n: 120 + stage * 15 }]),
    opt('lucky-find', 'A Lucky Find', [{ k: 'boon' }, { k: 'shards', n: 40 }]),
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
      [{ k: 'maxHp', n: -6 }, { k: 'boon' }, { k: 'boon' }],
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
    // ("A Legend's Price": 15 HP for a pick of three Legendary cards. Gone while there are no Legendary cards, DECISIONS #363)
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
      [{ k: 'boon' }, { k: 'boon' }, { k: 'wound', n: 1 }],
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
      [{ k: 'wound', n: 1 }, { k: 'hp', n: 10 }, { k: 'boon' }, { k: 'boon' }, { k: 'boon' }],
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
  /** what a run sees from Tier IV: a better rest, and these on top of what it has not outgrown */
  ascended: { rest: PreludeOption; blessings: PreludeOption[]; bargains: PreludeOption[] };
} {
  return {
    rest: opt('rest', 'Rest by the Waymark', [{ k: 'heal', pct: 30 }]),
    blessings: blessings(stage, true),
    bargains: bargains(stage),
    ascended: {
      rest: opt('rest', 'Rest by the Waymark', [{ k: 'heal', pct: 45 }]),
      blessings: ascendedBlessings(stage),
      bargains: ascendedBargains(stage),
    },
  };
}

/** From this Rift Tier on, a run has beaten Tier III's Warden: it is ascended, and is offered more (DECISIONS #517). */
export const ASCENDED_TIER = 4;

/** What an ascended run can be offered. A blessing here is worth about three of the first tiers'. */
function ascendedBlessings(stage: number): PreludeOption[] {
  return [
    opt('rift-forged', 'Rift-forged', [{ k: 'maxHp', n: 20 }]),
    opt('hoard', "A Warden's Hoard", [{ k: 'shards', n: 350 + stage * 50 }]),
    opt('masterwork', 'Masterwork', [{ k: 'upgrade', n: 4 }]),
    opt('rare-find', 'A Rare Find', [{ k: 'pick', rarity: 'rare' }]),
    opt('ancestor-gift', "An Ancestor's Gift", [{ k: 'pick', rarity: 'ancestral' }]),
    opt('twin-trinkets', 'Twin Trinkets', [{ k: 'boon' }, { k: 'boon' }]),
    opt('ironblood', 'Ironblood', [
      { k: 'maxHp', n: 12 },
      { k: 'upgrade', n: 2 },
    ]),
  ];
}

/** An ascended run's bargains, on top of the usual ones. */
function ascendedBargains(stage: number): PreludeOption[] {
  return [
    opt(
      'ascendant-due',
      "The Ascendant's Due",
      [
        { k: 'hp', n: 12 },
        { k: 'pick', rarity: 'rare', upgraded: true },
      ],
      true,
    ),
    opt(
      'rift-bounty',
      "The Rift's Bounty",
      [
        { k: 'maxHp', n: -8 },
        { k: 'shards', n: 600 + stage * 60 },
      ],
      true,
    ),
    opt(
      'blood-crown',
      'A Crown of Blood',
      [{ k: 'hp', n: 15 }, { k: 'boon' }, { k: 'boon' }, { k: 'upgrade', n: 2 }],
      true,
    ),
  ];
}

/** The first tiers' options an ascended run no longer sees: the ones a better version replaces, the common cards it has outgrown, and bargains a free blessing beats. */
const OUTGROWN: ReadonlySet<string> = new Set([
  'hardened',
  'purse',
  'cache',
  'honed',
  'frame',
  'whetstone',
  'pilgrim',
  'clear-out',
  'two-gifts',
  'fresh-steel',
  'quiet-study',
  // (bargains that ask a price for less than a free blessing there gives)
  'blood-price',
  'blood-for-steel',
  'call-ancestors',
  'silver-sale',
  'hungry-rift',
  'heavy-purse',
  'haunted-gift',
]);

/** What the deck and belt have left to give: an option that could not do all it says is not offered (DECISIONS #517). */
export interface PreludeRoom {
  /** plain Strikes and plain Defends left */
  strikes: number;
  defends: number;
  /** Strikes and Defends of any kind that can still be removed or changed */
  basics: number;
  /** how many cards can leave before the deck is at its smallest */
  deckRoom: number;
  /** cards that can still be upgraded */
  upgradable: number;
  /** free places on the potion belt */
  beltRoom: number;
  /** is there a card of this kind left for the deck? */
  canPick: (
    rarity: Extract<PreludeEffect, { k: 'pick' }>['rarity'],
    kind?: 'attack' | 'skill',
  ) => boolean;
}

const ANY_ROOM: PreludeRoom = {
  strikes: Infinity,
  defends: Infinity,
  basics: Infinity,
  deckRoom: Infinity,
  upgradable: Infinity,
  beltRoom: Infinity,
  canPick: () => true,
};

function hasRoom(o: PreludeOption, room: PreludeRoom): boolean {
  const total = (test: (e: PreludeEffect) => number): number =>
    o.effects.reduce((sum, e) => sum + test(e), 0);
  const strikes = total((e) => (e.k === 'remove' && e.only === 'strike' ? e.n : 0));
  const defends = total((e) => (e.k === 'remove' && e.only === 'defend' ? e.n : 0));
  const anyBasic = total((e) => (e.k === 'remove' && !e.only ? e.n : 0));
  const changed = total((e) => (e.k === 'transform' ? e.n : 0));
  const removed = strikes + defends + anyBasic;
  return (
    strikes <= room.strikes &&
    defends <= room.defends &&
    removed + changed <= room.basics &&
    removed <= room.deckRoom &&
    total((e) => (e.k === 'upgrade' ? e.n : 0)) <= room.upgradable &&
    total((e) => (e.k === 'potion' ? 1 : 0)) <= room.beltRoom &&
    o.effects.every((e) => e.k !== 'pick' || room.canPick(e.rarity, e.kind))
  );
}

const FLAVOUR: Record<StageRealm, string> = {
  aurelion: 'A cracked bell hangs from a gilded archway. Someone has left offerings beneath it.',
  nexus: 'A maintenance hatch stands open, a console blinking: SALVAGE AVAILABLE, TAKE ONE.',
  wyldmaw: 'A ring of bones around a warm fire. Whoever made it is watching from the dark.',
  umbral: 'A masked figure sits at an empty table. Three cards are face up. A fourth is not.',
  gloomfen: 'A lantern floats over dark water. Beneath it, the drowned have left an offering.',
  starfall: 'A fallen-star shard shines between the roots of a broken throne.',
  beyond: 'A road folds back through its own shadow. Something waits at the crossing.',
  cinder: 'A furnace door opens in the ash. An imperial seal still glows on its threshold.',
  tides: 'The tide uncovers a pearl shrine. Its offerings are dry despite the rising sea.',
  vespera: 'You remember this place from a dream. Someone has remembered you, too.',
  sands: 'Two suns cast opposing shadows over an hourglass half buried in the dunes.',
  ruin: 'No kingdom remains. The broken stones still answer to Drago.',
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
  /** how many Boons the run does not hold yet: an option never promises more than that */
  boonsLeft = Infinity,
  /** what the deck and belt have left to give */
  room: PreludeRoom = ANY_ROOM,
  tier = 1,
): PreludeOffer {
  const ascended = tier >= ASCENDED_TIER;
  const fits = (o: PreludeOption): boolean => boonsIn(o.effects) <= boonsLeft && hasRoom(o, room);
  const good = (
    ascended
      ? [...ascendedBlessings(stage), ...blessings(stage, hurt).filter((o) => !OUTGROWN.has(o.id))]
      : blessings(stage, hurt)
  ).filter(fits);
  const risky = (
    ascended
      ? [...ascendedBargains(stage), ...bargains(stage).filter((o) => !OUTGROWN.has(o.id))]
      : bargains(stage)
  ).filter(fits);
  if (kind === 'threshold') {
    return {
      kind,
      title: 'The Threshold',
      text: 'Before the first step into the Rift, something offers you a choice. Take one.',
      options: [...takeDistinct(rng, good, 3), ...takeDistinct(rng, risky, 1)],
    };
  }
  const catalogue = preludeCatalogue(stage);
  const options: PreludeOption[] = [
    ascended ? catalogue.ascended.rest : catalogue.rest,
    ...takeDistinct(rng, good, 2),
  ];
  if (nextInt(rng, 2) === 0) options.push(...takeDistinct(rng, risky, 1));
  return {
    kind,
    title: `Waymark: ${REALM_LABEL[realm]}`,
    text: FLAVOUR[realm],
    options,
  };
}
