// Preludes: the choices at the start of a run (The Threshold) and at the start of every Rift Tier (a Waymark), in the spirit of
// the opening events of other deckbuilders. Each offer is a few options; each option is a list of plain effects, so the text on
// screen is generated from the same data that is applied, and the whole thing is saved and replayed with the run.
//
// Offers use the run's own seeded PRNG, so a seed and the choices made reproduce the same run.
//
// Grades (DECISIONS #672): every offering is modest, rich or grand. Tier I only ever draws modest ones; each later tier draws the
// richer grades more often (GRADE_ODDS), and the amounts in an offering (shards, max HP, the HP it costs) grow with the tier. An offer
// never shows two options of the same family, so two piles of shards never stand side by side.

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
      return e.rarity ? `Take a random ${e.rarity} Potion` : 'Take a random Potion';
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

const countOf = (effects: readonly PreludeEffect[], k: PreludeEffect['k']): number =>
  effects.filter((e) => e.k === k).length;
const boonsIn = (effects: readonly PreludeEffect[]): number => countOf(effects, 'boon');

/** The option's text: one sentence per effect, with several Boons (or several unnamed Potions) read as one. */
function textOf(effects: readonly PreludeEffect[]): string {
  const lines: string[] = [];
  for (const [i, e] of effects.entries()) {
    const same = (x: PreludeEffect): boolean =>
      x.k === e.k && (x.k !== 'potion' || (e.k === 'potion' && x.rarity === e.rarity));
    if (e.k === 'boon' || e.k === 'potion') {
      if (effects.findIndex(same) !== i) continue;
      const n = effects.filter(same).length;
      if (n > 1) {
        lines.push(
          e.k === 'boon'
            ? `Gain ${n} random Boons`
            : `Take ${n} random ${e.rarity ? `${e.rarity} ` : ''}Potions`,
        );
        continue;
      }
    }
    lines.push(describeEffect(e));
  }
  return lines.join('. ') + '.';
}

const opt = (
  id: string,
  name: string,
  effects: PreludeEffect[],
  risky = false,
  grade?: Grade,
): PreludeOption => ({
  id,
  name,
  text: textOf(effects),
  effects,
  ...(risky ? { risky } : {}),
  ...(grade ? { grade } : {}),
});

// ---- grades and scaling ------------------------------------------------------------------------------------------

export type Grade = 1 | 2 | 3;
export const GRADE_NAME: Record<Grade, string> = { 1: 'Modest', 2: 'Rich', 3: 'Grand' };

/**
 * The chance of each grade (modest / rich / grand, in percent) for an option drawn at each Rift Tier: Tier I never draws a rich or
 * grand one, and from Tier XI no modest one is drawn. Tiers past the table use its last row.
 */
export const GRADE_ODDS: readonly (readonly [number, number, number])[] = [
  [100, 0, 0], // I
  [75, 25, 0], // II
  [60, 35, 5], // III
  [45, 45, 10], // IV
  [35, 50, 15], // V
  [25, 55, 20], // VI
  [20, 55, 25], // VII
  [15, 55, 30], // VIII
  [10, 55, 35], // IX
  [5, 55, 40], // X
  [0, 55, 45], // XI
  [0, 50, 50], // XII
];
export const gradeOdds = (tier: number): readonly [number, number, number] =>
  GRADE_ODDS[Math.min(GRADE_ODDS.length, Math.max(1, tier)) - 1]!;

/** How much an offering's amounts grow by the tier: shards 8% of the Tier I amount a tier (they keep pace with the merchants' rising prices), max HP and HP prices 5%. */
const growth = (tier: number, perTier: number): number => 1 + perTier * Math.max(0, tier - 1);
const shardsAt = (base: number, tier: number): number =>
  Math.round((base * growth(tier, 0.08)) / 5) * 5;
const hpAt = (base: number, tier: number): number => Math.round(base * growth(tier, 0.05));

/** The kind of reward an offering mostly is: an offer shows at most one option of each. */
type Family =
  'shards' | 'card' | 'upgrade' | 'remove' | 'trade' | 'maxHp' | 'boon' | 'potion' | 'resolve';

interface Offering {
  id: string;
  name: string;
  grade: Grade;
  family: Family;
  risky?: boolean;
  /** only for a run missing some Resolve */
  hurt?: boolean;
  effects: (tier: number) => PreludeEffect[];
}

const shards = (base: number) => (tier: number) =>
  ({ k: 'shards', n: shardsAt(base, tier) }) as const;
const maxHp = (base: number) => (tier: number) => ({ k: 'maxHp', n: hpAt(base, tier) }) as const;
const lose = (base: number) => (tier: number) => ({ k: 'hp', n: hpAt(base, tier) }) as const;

// What an option is worth at Tier I (docs/BALANCE.md, "Threshold and Waymarks"; Merchant: common/uncommon/rare card 30/55/95, removal 50,
// upgrade 75, Boon 70): modest about 70-100 shards, rich about 150, grand about 250. A bargain ("at a price") pays clearly more than a
// blessing of its grade, paid mostly in HP the next rest heals; a price the deck carries for good (a Wound, max HP) buys the most.
// Cards are always a choice of three from your own class (a random card is often one you cannot use).

/** Good things with no strings. */
const BLESSINGS: Offering[] = [
  // modest: a small, solid start (Tier I offers only these)
  {
    id: 'purse',
    name: 'A Full Purse',
    grade: 1,
    family: 'shards',
    effects: (t) => [shards(75)(t)],
  },
  {
    id: 'open-hand',
    name: 'Open Hand',
    grade: 1,
    family: 'card',
    effects: () => [{ k: 'pick', rarity: 'uncommon' }],
  },
  {
    id: 'two-gifts',
    name: "Wayfinder's Gift",
    grade: 1,
    family: 'card',
    effects: () => [{ k: 'pick', rarity: 'common', upgraded: true }],
  },
  {
    id: 'whetstone',
    name: 'Whetstone and Oil',
    grade: 1,
    family: 'upgrade',
    effects: (t) => [{ k: 'upgrade', n: 1 }, shards(30)(t)],
  },
  {
    id: 'lighter',
    name: 'Lighter Load',
    grade: 1,
    family: 'remove',
    effects: () => [{ k: 'remove', n: 2 }],
  },
  {
    id: 'fresh-steel',
    name: 'Fresh Steel',
    grade: 1,
    family: 'trade',
    effects: () => [
      { k: 'remove', n: 1, only: 'strike' },
      { k: 'pick', rarity: 'common', kind: 'attack', upgraded: true },
    ],
  },
  {
    id: 'quiet-study',
    name: 'Quiet Study',
    grade: 1,
    family: 'trade',
    effects: () => [
      { k: 'remove', n: 1, only: 'defend' },
      { k: 'pick', rarity: 'common', kind: 'skill', upgraded: true },
    ],
  },
  {
    id: 'hardened',
    name: 'Rift-hardened',
    grade: 1,
    family: 'maxHp',
    effects: (t) => [maxHp(10)(t)],
  },
  {
    id: 'pilgrim',
    name: "Pilgrim's Blessing",
    grade: 1,
    family: 'maxHp',
    effects: (t) => [maxHp(5)(t), { k: 'upgrade', n: 1 }],
  },
  {
    id: 'keepsake',
    name: "Traveller's Keepsake",
    grade: 1,
    family: 'potion',
    effects: () => [{ k: 'potion' }, { k: 'potion' }],
  },
  {
    id: 'nerve',
    name: 'Steeled Nerves',
    grade: 1,
    family: 'resolve',
    hurt: true,
    effects: () => [{ k: 'resolve', n: 1 }],
  },

  // rich
  {
    id: 'cache',
    name: 'A Hidden Cache',
    grade: 2,
    family: 'shards',
    effects: (t) => [shards(150)(t)],
  },
  {
    id: 'rare-find',
    name: 'A Rare Find',
    grade: 2,
    family: 'card',
    effects: () => [{ k: 'pick', rarity: 'rare' }],
  },
  {
    id: 'fine-choice',
    name: 'A Fine Choice',
    grade: 2,
    family: 'card',
    effects: () => [{ k: 'pick', rarity: 'uncommon', upgraded: true }],
  },
  {
    id: 'honed',
    name: 'Honed Edges',
    grade: 2,
    family: 'upgrade',
    effects: () => [{ k: 'upgrade', n: 3 }],
  },
  {
    id: 'reforge',
    name: 'Reforged',
    grade: 2,
    family: 'remove',
    effects: () => [{ k: 'transform', n: 2 }],
  },
  {
    id: 'trade-steel',
    name: 'Trade Steel',
    grade: 2,
    family: 'trade',
    effects: () => [
      { k: 'remove', n: 2, only: 'strike' },
      { k: 'pick', rarity: 'uncommon', kind: 'attack' },
    ],
  },
  {
    id: 'trade-guard',
    name: 'Trade Guard',
    grade: 2,
    family: 'trade',
    effects: () => [
      { k: 'remove', n: 2, only: 'defend' },
      { k: 'pick', rarity: 'uncommon', kind: 'skill' },
    ],
  },
  {
    id: 'rift-forged',
    name: 'Rift-forged',
    grade: 2,
    family: 'maxHp',
    effects: (t) => [maxHp(18)(t)],
  },
  {
    id: 'ironblood',
    name: 'Ironblood',
    grade: 2,
    family: 'maxHp',
    effects: (t) => [maxHp(8)(t), { k: 'upgrade', n: 2 }],
  },
  {
    id: 'trinket',
    name: 'A Trinket of the Road',
    grade: 2,
    family: 'boon',
    effects: (t) => [{ k: 'boon' }, shards(60)(t)],
  },
  {
    id: 'apothecary',
    name: "Apothecary's Satchel",
    grade: 2,
    family: 'potion',
    effects: () => [{ k: 'potion' }, { k: 'potion' }, { k: 'upgrade', n: 1 }],
  },
  {
    id: 'rare-draught',
    name: 'A Rare Draught',
    grade: 2,
    family: 'potion',
    effects: (t) => [{ k: 'potion', rarity: 'rare' }, shards(60)(t)],
  },
  {
    id: 'calm-mind',
    name: 'A Calm Mind',
    grade: 2,
    family: 'resolve',
    hurt: true,
    effects: (t) => [{ k: 'resolve', n: 1 }, shards(60)(t)],
  },

  // grand
  {
    id: 'hoard',
    name: "A Warden's Hoard",
    grade: 3,
    family: 'shards',
    effects: (t) => [shards(260)(t)],
  },
  {
    id: 'masterpiece',
    name: 'A Masterpiece',
    grade: 3,
    family: 'card',
    effects: () => [{ k: 'pick', rarity: 'rare', upgraded: true }],
  },
  {
    id: 'ancestor-gift',
    name: "An Ancestor's Gift",
    grade: 3,
    family: 'card',
    effects: () => [{ k: 'pick', rarity: 'ancestral' }],
  },
  {
    id: 'masterwork',
    name: 'Masterwork',
    grade: 3,
    family: 'upgrade',
    effects: () => [{ k: 'upgrade', n: 4 }],
  },
  {
    id: 'clean-slate',
    name: 'A Clean Slate',
    grade: 3,
    family: 'remove',
    effects: () => [
      { k: 'remove', n: 3 },
      { k: 'upgrade', n: 2 },
    ],
  },
  {
    id: 'heart-of-rift',
    name: 'Heart of the Rift',
    grade: 3,
    family: 'maxHp',
    effects: (t) => [maxHp(30)(t)],
  },
  {
    id: 'twin-trinkets',
    name: 'Twin Trinkets',
    grade: 3,
    family: 'boon',
    effects: () => [{ k: 'boon' }, { k: 'boon' }],
  },
  {
    id: 'wardens-tithe',
    name: "A Warden's Tithe",
    grade: 3,
    family: 'boon',
    effects: (t) => [{ k: 'boon' }, shards(160)(t)],
  },
  {
    id: 'alchemist',
    name: "The Alchemist's Crate",
    grade: 3,
    family: 'potion',
    effects: (t) => [
      { k: 'potion', rarity: 'rare' },
      { k: 'potion', rarity: 'rare' },
      shards(80)(t),
    ],
  },
];

/** Bigger rewards with a price. */
const BARGAINS: Offering[] = [
  // modest: HP the next rest heals, for clearly more than a modest blessing
  {
    id: 'blood-price',
    name: 'Blood Price',
    grade: 1,
    family: 'card',
    risky: true,
    effects: (t) => [lose(10)(t), { k: 'pick', rarity: 'rare' }],
  },
  {
    id: 'silver-sale',
    name: 'Sell the Silver',
    grade: 1,
    family: 'shards',
    risky: true,
    effects: (t) => [lose(8)(t), shards(160)(t)],
  },
  {
    id: 'blood-for-steel',
    name: 'Blood for Steel',
    grade: 1,
    family: 'upgrade',
    risky: true,
    effects: (t) => [lose(10)(t), { k: 'upgrade', n: 3 }],
  },
  {
    id: 'fire-sale',
    name: 'Fire Sale',
    grade: 1,
    family: 'remove',
    risky: true,
    effects: (t) => [lose(8)(t), { k: 'remove', n: 3 }],
  },
  {
    id: 'reckless-haste',
    name: 'Reckless Haste',
    grade: 1,
    family: 'potion',
    risky: true,
    effects: (t) => [lose(6)(t), { k: 'potion' }, { k: 'potion' }, { k: 'potion' }],
  },

  // rich
  {
    id: 'heavy-purse',
    name: 'Heavy Purse',
    grade: 2,
    family: 'shards',
    risky: true,
    effects: (t) => [shards(320)(t), { k: 'wound', n: 1 }],
  },
  {
    id: 'hollow-bargain',
    name: 'A Hollow Bargain',
    grade: 2,
    family: 'card',
    risky: true,
    effects: () => [
      { k: 'maxHp', n: -5 },
      { k: 'pick', rarity: 'rare', upgraded: true },
    ],
  },
  {
    id: 'call-ancestors',
    name: 'Call on the Ancestors',
    grade: 2,
    family: 'card',
    risky: true,
    effects: (t) => [lose(12)(t), { k: 'pick', rarity: 'ancestral' }, shards(80)(t)],
  },
  {
    id: 'trade-up',
    name: 'Trade Up',
    grade: 2,
    family: 'trade',
    risky: true,
    effects: (t) => [
      lose(10)(t),
      { k: 'remove', n: 2 },
      { k: 'pick', rarity: 'rare', upgraded: true },
    ],
  },
  {
    id: 'hungry-rift',
    name: 'The Rift Is Hungry',
    grade: 2,
    family: 'boon',
    risky: true,
    effects: () => [{ k: 'maxHp', n: -5 }, { k: 'boon' }, { k: 'boon' }],
  },

  // grand
  {
    id: 'rift-bounty',
    name: "The Rift's Bounty",
    grade: 3,
    family: 'shards',
    risky: true,
    effects: (t) => [{ k: 'maxHp', n: -8 }, shards(450)(t)],
  },
  {
    id: 'ascendant-due',
    name: "The Ascendant's Due",
    grade: 3,
    family: 'card',
    risky: true,
    effects: (t) => [
      lose(14)(t),
      { k: 'pick', rarity: 'rare', upgraded: true },
      { k: 'upgrade', n: 2 },
    ],
  },
  {
    id: 'blood-crown',
    name: 'A Crown of Blood',
    grade: 3,
    family: 'boon',
    risky: true,
    effects: (t) => [lose(15)(t), { k: 'boon' }, { k: 'boon' }, { k: 'upgrade', n: 3 }],
  },
  {
    id: 'cursed-crown',
    name: 'The Cursed Crown',
    grade: 3,
    family: 'boon',
    risky: true,
    effects: (t) => [
      { k: 'wound', n: 1 },
      lose(12)(t),
      { k: 'boon' },
      { k: 'boon' },
      { k: 'boon' },
      shards(150)(t),
    ],
  },
];

const make = (o: Offering, tier: number): PreludeOption =>
  opt(o.id, o.name, o.effects(tier), o.risky === true, o.grade);

/** The rest a Waymark always offers; from Tier IV it heals more. */
const restAt = (tier: number): PreludeOption =>
  opt('rest', 'Rest by the Waymark', [{ k: 'heal', pct: tier >= ASCENDED_TIER ? 45 : 30 }]);

/** From this Rift Tier on, a run has beaten Tier III's Warden: it is ascended, and its Waymark rest heals more (DECISIONS #517). */
export const ASCENDED_TIER = 4;

/**
 * Every option the Threshold and the Waymarks can offer, as they read at `tier`, by grade (for the How to play page). The Resolve
 * blessings are included, though they only appear when a run is missing Resolve; a Waymark always offers its rest as well.
 */
export function preludeCatalogue(tier = 1): {
  rest: PreludeOption;
  ascendedRest: PreludeOption;
  grades: { grade: Grade; name: string; blessings: PreludeOption[]; bargains: PreludeOption[] }[];
  odds: readonly (readonly [number, number, number])[];
} {
  return {
    rest: restAt(1),
    ascendedRest: restAt(ASCENDED_TIER),
    grades: ([1, 2, 3] as const).map((grade) => ({
      grade,
      name: GRADE_NAME[grade],
      blessings: BLESSINGS.filter((o) => o.grade === grade).map((o) => make(o, tier)),
      bargains: BARGAINS.filter((o) => o.grade === grade).map((o) => make(o, tier)),
    })),
    odds: GRADE_ODDS,
  };
}

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

/** A grade for one option, by the tier's odds. */
function rollGrade(rng: RngState, tier: number): Grade {
  const [modest, rich] = gradeOdds(tier);
  const r = nextInt(rng, 100);
  return r < modest ? 1 : r < modest + rich ? 2 : 3;
}

/**
 * `n` options from `pool`, each of a grade rolled for the tier and of a family no option in the offer has yet. When nothing of the rolled
 * grade fits, the next grade down is tried first (so Tier I stays modest), then up.
 */
function drawOptions(
  rng: RngState,
  pool: readonly Offering[],
  tier: number,
  used: Set<Family>,
  n: number,
): PreludeOption[] {
  const out: PreludeOption[] = [];
  const taken = new Set<string>();
  for (let i = 0; i < n; i++) {
    const want = rollGrade(rng, tier);
    const order = ([want, want - 1, want - 2, want + 1, want + 2] as number[]).filter(
      (g) => g >= 1 && g <= 3,
    );
    // (a family already shown is skipped; only when a deck has room for nothing else is one repeated, so an option is never lost)
    for (const freshFamily of [true, false]) {
      const found = order.some((g) => {
        const fit = pool.filter(
          (o) => o.grade === g && !taken.has(o.id) && (!freshFamily || !used.has(o.family)),
        );
        if (!fit.length) return false;
        const o = fit[nextInt(rng, fit.length)]!;
        used.add(o.family);
        taken.add(o.id);
        out.push(make(o, tier));
        return true;
      });
      if (found) break;
    }
  }
  return out;
}

/**
 * The offer for the start of a run or of a Rift Tier.
 *  threshold: three blessings and one bargain.
 *  stage: a rest by the waymark (always), two blessings, and half the time a bargain.
 */
export function makePrelude(
  rng: RngState,
  kind: PreludeKind,
  /** (no longer read: the Rift Tier sets the amounts and the grades) */
  _stage: number,
  realm: StageRealm,
  /** the run is missing some Resolve, so Resolve blessings can be offered */
  hurt = false,
  /** how many Boons the run does not hold yet: an option never promises more than that */
  boonsLeft = Infinity,
  /** what the deck and belt have left to give */
  room: PreludeRoom = ANY_ROOM,
  tier = 1,
): PreludeOffer {
  const fits = (o: Offering): boolean => {
    if (o.hurt && !hurt) return false;
    const made = make(o, tier);
    return boonsIn(made.effects) <= boonsLeft && hasRoom(made, room);
  };
  const good = BLESSINGS.filter(fits);
  const risky = BARGAINS.filter(fits);
  const used = new Set<Family>();
  if (kind === 'threshold') {
    return {
      kind,
      title: 'The Threshold',
      text: 'Before the first step into the Rift, something offers you a choice. Take one.',
      options: [
        ...drawOptions(rng, good, tier, used, 3),
        ...drawOptions(rng, risky, tier, used, 1),
      ],
    };
  }
  const options: PreludeOption[] = [restAt(tier), ...drawOptions(rng, good, tier, used, 2)];
  if (nextInt(rng, 2) === 0) options.push(...drawOptions(rng, risky, tier, used, 1));
  return {
    kind,
    title: `Waymark: ${REALM_LABEL[realm]}`,
    text: FLAVOUR[realm],
    options,
  };
}
