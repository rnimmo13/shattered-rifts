// The Spellblade (persona Obsidia; id 'spellblade', DECISIONS #140). A warrior of black glass and ember, rebuilt on Spell Power and
// Fracture (DECISIONS #480; the list with every price: docs/reworks/SPELLBLADE_SPELL_POWER_MERGED.md). No companions.
//
// One reserve, Spell Power (the `stars` resource underneath; replaces Arcana and Sharpen), three ways to win:
//   Swords   - hold it: a Sword's damage grows with it (the bigger ones strike a fixed few times) and swinging spends nothing
//   Spells   - spend it: X is all of it (`starX`), X/2 half (`starHalf`), the rate per point rising with Mana (4 at 1, 6 at 2, 8 at 3)
//   (#727: the Swords that hit 3 or 4 times apply 2 Fracture a hit, and Spellbolt, Arcane Pulse, Molten Ruin and Lava Bomb a little,
//   so a Sword or Spell deck can lean into Shatters; the two commons, Obsidian Flurry and Rift Sweep, 1 a hit, so they stay behind the
//   Fracture commons)
//   Fracture - marks on an enemy that only add up: every 10 Shatters it, 3 harder each time (20, 23, 26... 47 at 100, + the Spell Power held; #713, #726); from 50 each Shatter cracks another enemy for 10; Faultline Hex is in the starter since DECISIONS #787 (rewards only before, #483)
// No caps on spending, by Robert's call. No Sword adds hits: Might and Primed pay off on the fixed hits of the bigger ones (DECISIONS #507, #509).

import type { CardDef, Op, Scale, Sel } from '@sr/combat';
import {
  barrier,
  barrierNext,
  discard,
  dmg,
  draw,
  fetchTag,
  growSelf,
  manaNext,
  on,
  onKill,
  per,
  pool,
  scaled,
  seekTop,
  stars,
  starsNext,
  status,
  when,
} from '../build';

const a = pool('spellblade', 'starfall');
/** the Obsidian Blade: the Blade Sweep and Blade Echo Auras read this tag, and every other Sword only has SWORD */
const BLADE = 'starforged-blade';
const SWORD = 'sword';
const SPELL = 'spell';
/** a card that gains Spell Power: The Forgemaster can raise it */
const GENERATOR = 'generator';
/** what a generator's copy has grown to reads on its card as "Grown +N" */
const GROWN = { forgeWord: 'Grown' } as const;

/** an X or X/2 card reads this: the Spell Power it spent */
// (the first 20 Spell Power spent count in full, the rest half: DECISIONS #762)
const SPENT = (mult = 1): Scale => ({ ...per('starSpend', mult), half: 20 * mult });
/** gain N Spell Power, plus what this copy has grown */
const gain = (n: number): Op => scaled(stars(n), per('bonus'));
/** "Grows N": this copy yields N more each time it is played */
const grows = (n: number): Op => ({ ...growSelf(n), grown: true }) as Op;
/** a Sword's one hit: `rate` x `base` damage, and `rate` more per `step` Spell Power (no card scales its hits, DECISIONS #507) */
const swing = (rate: number, base: number, step: number, to: Sel = 'target'): Op =>
  scaled(dmg(rate * base, to), { by: 'stars', step, mult: rate });
/** a bigger Sword: a fixed `hits` hits of `amount`, each 1 more per `step` Spell Power, so Might and Primed still pay off (DECISIONS #509) */
const volley = (amount: number, hits: number, step: number, to: Sel = 'target'): Op =>
  scaled(dmg(amount, to, hits), { by: 'stars', step });
/** a spell's hit: base damage + a rate per point spent */
const burst = (amount: number, rate: number, to: Sel = 'target'): Op =>
  scaled(dmg(amount, to), SPENT(rate));
const fracture = (amount: number, to: Sel = 'target', marked = false): Op => ({
  op: 'fracture',
  amount,
  to,
  ...(marked ? { marked } : {}),
});
/** Etching Edge's cut: 1 Fracture, and 1 more per 4 Spell Power (per 8 until DECISIONS #542) */
const etch: Op = scaled(fracture(1), { by: 'stars', step: 4 });
const shatterUp = (amount: number): Op => ({ op: 'shatterUp', amount });
const strip = (amount: number): Op => ({ op: 'strip', to: 'target', amount });
/** Barrier that grows with the Spell Power you hold, on every Barrier of hers (DECISIONS #486) */
const ward = (amount: number, step = 3): Op => scaled(barrier(amount), { by: 'stars', step });
/** the same on a card that asks you to be empty: what you have spent this turn takes the place of what you hold */
const wardSpent = (amount: number): Op =>
  scaled(barrier(amount), { by: 'starsSpentTurn', step: 3 });

export const SPELLBLADE: CardDef[] = [
  // --- starter ---
  // (0 Mana since DECISIONS #558: Spell Power is its whole price; the upgrade is 6, not 7, to stay a basic's 70-90%)
  a('basic', 'meteor-jab', 'Cinderfall', 'attack', 0, 'foe', [burst(4, 4)], {
    starHalf: true,
    tags: [SPELL],
    up: { effects: [burst(6, 4)] },
  }),
  // (Barrier since DECISIONS #559, 3 at her opening 5 Spell Power: it was the starter's one card that did nothing the turn it was played)
  a('basic', 'gather-light', 'Gather Power', 'skill', 1, 'none', [ward(2), gain(2)], {
    tags: [GENERATOR],
    ...GROWN,
    up: { effects: [ward(2), gain(3)] },
  }),
  // (her early Barrier, and the way into Spell Power: DECISIONS #483)
  a('basic', 'obsidian-ward', 'Obsidian Ward', 'skill', 1, 'none', [ward(7), gain(1)], {
    tags: [SPELL, GENERATOR],
    ...GROWN,
    up: { effects: [ward(10), gain(1)] },
  }),
  // (a card of her starting deck, always in the opening hand: DECISIONS #436)
  a(
    'common',
    BLADE,
    'Obsidian Blade',
    'attack',
    2,
    'foe', // (2 a Spell Power to 20 of it, 1 after, DECISIONS #762: it spends none, so every point counted for ever)
    [scaled(dmg(5), { ...per('stars', 2), half: 40 })],
    {
      retain: true,
      innate: true,
      tags: ['blade', SWORD],
      source: 'token',
      weapon: true,
      up: { effects: [scaled(dmg(8), { ...per('stars', 2), half: 40 })] },
    },
  ),
  // (a card that only takes up room; nothing of hers makes it now, and old effects in other pools may)
  a('basic', 'rubble', 'Rubble', 'skill', 1, 'none', [], {
    exhaust: true,
    source: 'token',
    hero: 'junk',
  }),

  // --- generators and growing cards ---
  a('common', 'forged-in-fury', 'Forged in Fury', 'attack', 1, 'foe', [swing(2, 1, 3), gain(1)], {
    tags: [SWORD, GENERATOR],
    ...GROWN,
    up: { effects: [swing(3, 1, 3), gain(1)] },
  }),
  a('common', 'whetstone', 'Deepening Enchantment', 'skill', 1, 'none', [gain(2), grows(1)], {
    tags: [GENERATOR],
    ...GROWN,
    up: { effects: [gain(3), grows(1)] },
  }),
  a('common', 'faint-glow', 'Faint Ember', 'skill', 1, 'none', [gain(2), draw(1)], {
    tags: [GENERATOR],
    ...GROWN,
    up: { effects: [gain(3), draw(1)] },
  }),
  a('common', 'ember-cache', 'Ember Cache', 'skill', 1, 'none', [gain(1), starsNext(3)], {
    tags: [GENERATOR],
    ...GROWN,
    up: { effects: [gain(1), starsNext(4)] },
  }),
  a('common', 'pale-beacon', 'Pale Ward', 'skill', 1, 'none', [ward(8), gain(1)], {
    tags: [SPELL, GENERATOR],
    ...GROWN,
    up: { effects: [ward(11), gain(1)] },
  }),
  a(
    'common',
    'sunstrike',
    'Emberstrike',
    'attack',
    1,
    'foe',
    [swing(2, 1, 3), gain(1), when('spellsPlayed', { atLeast: 1 }, [stars(1)])],
    {
      tags: [SWORD, GENERATOR],
      ...GROWN,
      up: { effects: [swing(3, 1, 3), gain(1), when('spellsPlayed', { atLeast: 1 }, [stars(1)])] },
    },
  ),
  a(
    'common',
    'empty-crucible',
    'Empty Crucible',
    'skill',
    1,
    'none',
    [when('stars', { atMost: 0 }, [stars(2)]), gain(3)],
    {
      tags: [GENERATOR],
      ...GROWN,
      up: { effects: [when('stars', { atMost: 0 }, [stars(2)]), gain(4)] },
    },
  ),
  a('uncommon', 'bladewall', 'Bladewall', 'skill', 2, 'none', [ward(12), gain(3)], {
    tags: [SPELL, GENERATOR],
    ...GROWN,
    up: { effects: [ward(15), gain(3)] },
  }),
  a('uncommon', 'banked-embers', 'Banked Embers', 'skill', 1, 'none', [starsNext(3), manaNext(1)], {
    up: { effects: [starsNext(4), manaNext(1)] },
  }),
  a(
    'uncommon',
    'growing-crucible',
    'Growing Crucible',
    'skill',
    2,
    'none',
    [ward(4), gain(4), grows(2)],
    {
      tags: [GENERATOR],
      ...GROWN,
      up: { effects: [ward(7), gain(4), grows(2)] },
    },
  ),
  a(
    'uncommon',
    'measured-recharge',
    'Measured Recharge',
    'skill',
    1,
    'none',
    [gain(3), when('starsSpentTurn', { atLeast: 3 }, [draw(1)])],
    {
      tags: [GENERATOR],
      ...GROWN,
      up: { effects: [gain(4), when('starsSpentTurn', { atLeast: 3 }, [draw(1)])] },
    },
  ),
  a(
    'uncommon',
    'last-ember',
    'Last Ember',
    'skill',
    0,
    'none',
    [when('stars', { atMost: 0 }, [wardSpent(5)]), gain(2)],
    {
      exhaust: true,
      tags: [GENERATOR],
      ...GROWN,
      up: { effects: [when('stars', { atMost: 0 }, [wardSpent(8)]), gain(2)] },
    },
  ),
  a('rare', 'big-bang', 'Magma Surge', 'skill', 0, 'none', [gain(3)], {
    exhaust: true,
    tags: [GENERATOR],
    ...GROWN,
    up: { effects: [gain(4)] },
  }),
  a(
    'rare',
    'the-forgemaster',
    'The Forgemaster',
    'skill',
    2,
    'none',
    [stars(6), { op: 'empower', amount: 2, tag: GENERATOR }],
    { exhaust: true, up: { effects: [stars(8), { op: 'empower', amount: 2, tag: GENERATOR }] } },
  ),

  // --- Swords ---
  a(
    'common',
    'obsidian-flurry',
    'Obsidian Flurry',
    'attack',
    2,
    'foe',
    [volley(4, 3, 3), fracture(3)],
    {
      tags: [SWORD],
      up: { effects: [volley(6, 3, 3), fracture(3)] },
    },
  ),
  a(
    'common',
    'cosmic-lance',
    'Obsidian Lance',
    'attack',
    1,
    'foe',
    [scaled(dmg(6), { by: 'stars', step: 2 })],
    {
      tags: [SWORD],
      up: { effects: [scaled(dmg(9), { by: 'stars', step: 2 })] },
    },
  ),
  a('common', 'gleam', 'Glint', 'attack', 1, 'foe', [swing(2, 1, 3), draw(1)], {
    tags: [SWORD],
    up: { effects: [swing(3, 1, 3), draw(1)] },
  }),
  // (1 more damage per 2 Spell Power, not 2 per 4: the same rate, but it moves at every second point, Robert 2026-11-02)
  a('common', 'etching-edge', 'Etching Edge', 'attack', 1, 'foe', [swing(1, 2, 2), etch], {
    tags: [SWORD],
    up: { effects: [swing(1, 5, 2), etch] },
  }),
  a(
    'common',
    'rift-sweep',
    'Rift Sweep',
    'attack',
    2,
    'none',
    [volley(3, 3, 3, 'allFoes'), fracture(3, 'allFoes')],
    {
      tags: [SWORD],
      up: { effects: [volley(5, 3, 3, 'allFoes'), fracture(3, 'allFoes')] },
    },
  ),
  a('common', 'glass-needle', 'Glass Needle', 'attack', 0, 'foe', [swing(2, 1, 3)], {
    exhaust: true,
    tags: [SWORD],
    up: { effects: [swing(3, 1, 3)] },
  }),
  a('common', 'guarded-cut', 'Guarded Cut', 'attack', 1, 'foe', [swing(2, 1, 4), ward(4)], {
    tags: [SWORD],
    up: { effects: [swing(2, 1, 4), ward(6)] },
  }),
  a(
    'uncommon',
    'shard-strike',
    'Shard Strike',
    'attack',
    1,
    'foe',
    [swing(2, 1, 3), stars(1), when('stars', { atLeast: 9 }, [ward(4)])],
    {
      tags: [SWORD],
      up: { effects: [swing(3, 1, 3), stars(1), when('stars', { atLeast: 9 }, [ward(4)])] },
    },
  ),
  a(
    'uncommon',
    'sovereign-strike',
    'Tyrant Strike',
    'attack',
    2,
    'foe',
    [
      volley(4, 3, 3),
      fracture(6),
      when('starsSpentTurn', { atLeast: 1 }, [status('exposed', 2, 'target')]),
    ],
    {
      tags: [SWORD],
      up: {
        effects: [
          volley(6, 3, 3),
          fracture(6),
          when('starsSpentTurn', { atLeast: 1 }, [status('exposed', 2, 'target')]),
        ],
      },
    },
  ),
  a(
    'uncommon',
    'crosscut',
    'Crosscut',
    'attack',
    1,
    'foe',
    [volley(2, 2, 4), when('prevSpell', { atLeast: 1 }, [dmg(2, 'target', 2), stars(1)])],
    {
      tags: [SWORD],
      up: {
        effects: [
          volley(3, 2, 4),
          when('prevSpell', { atLeast: 1 }, [dmg(3, 'target', 2), stars(1)]),
        ],
      },
    },
  ),
  a(
    'uncommon',
    'fault-piercer',
    'Fault Piercer',
    'attack',
    2,
    'foe',
    [
      volley(4, 3, 3),
      // (8 flat since #727: 2 a hit like the other Swords, and the 2 it gave a cracked target, which its own 6 would always meet)
      fracture(8),
    ],
    {
      tags: [SWORD],
      up: {
        effects: [volley(6, 3, 3), fracture(8)],
      },
    },
  ),
  a(
    'rare',
    'hammer-and-anvil',
    'Hammer and Anvil',
    'attack',
    2,
    'foe',
    [volley(3, 4, 3), fracture(8), scaled(stars(0), per('swordFoes'))],
    {
      tags: [SWORD],
      up: { effects: [volley(5, 4, 3), fracture(8), scaled(stars(0), per('swordFoes'))] },
    },
  ),
  a(
    'rare',
    'storm-of-glass',
    'Storm of Glass',
    'attack',
    3,
    'foe',
    [volley(5, 4, 2), fracture(8)],
    {
      tags: [SWORD],
      up: { effects: [volley(7, 4, 2), fracture(8)] },
    },
  ),
  a('rare', 'thousand-shards', 'Thousand Shards', 'attack', 2, 'foe', [burst(0, 6)], {
    starX: true,
    exhaust: true,
    tags: [SWORD],
    up: {
      effects: [burst(0, 7)],
    },
  }),
  a(
    'rare',
    'obsidian-drill',
    'Obsidian Drill',
    'attack',
    3,
    'foe',
    [scaled(dmg(7, 'target', 3), SPENT(2)), fracture(6)],
    {
      starHalf: true,
      tags: [SWORD],
      up: {
        effects: [scaled(dmg(9, 'target', 3), SPENT(2)), fracture(6)],
      },
    },
  ),
  a(
    'uncommon',
    'call-the-blade',
    'Call the Blade',
    'skill',
    1,
    'none',
    [fetchTag(1, SWORD), gain(2)],
    {
      tags: [GENERATOR],
      ...GROWN,
      up: { effects: [fetchTag(1, SWORD), gain(3)] },
    },
  ),

  // --- what makes the Blade hit harder ---
  a('common', 'feint', 'Feint', 'skill', 1, 'none', [ward(5), status('vigor', 1)], {
    up: { effects: [ward(7), status('vigor', 1)] },
  }),
  a(
    'uncommon',
    'conqueror',
    'Crowned Edge',
    'skill',
    1,
    'none',
    [status('vigor', 2, 'self', true), draw(1)],
    { up: { effects: [status('vigor', 3, 'self', true), draw(1)] } },
  ),
  a('uncommon', 'forge-heat', 'Heat of the Forge', 'skill', 1, 'none', [status('vigor', 2)], {
    up: { effects: [status('vigor', 3)] },
  }),
  a(
    'uncommon',
    'crowns-weight',
    'Weight of the Crown',
    'skill',
    1,
    'none',
    [status('might', 1), status('sapped', 1, 'allFoes')],
    { starCost: 2, up: { starCost: 1 } },
  ),
  a('rare', 'soul-of-steel', 'Soul of Steel', 'skill', 2, 'none', [status('might', 2)], {
    exhaust: true,
    up: { effects: [ward(5), status('might', 2)] },
  }),
  a('rare', 'whispering-edge', 'Whispering Edge', 'power', 1, 'none', [status('keen', 2)], {
    up: { innate: true },
  }),

  // --- Sword Auras ---
  a(
    'uncommon',
    'parry',
    'Glass Guard',
    'power',
    1,
    'none',
    [on('play', [ward(4)], { tag: SWORD, once: true })],
    { up: { effects: [on('play', [ward(6)], { tag: SWORD, once: true })] } },
  ),
  a(
    'uncommon',
    'quenched-edge',
    'Quenched Edge',
    'power',
    1,
    'none',
    [on('play', [status('vigor', 1)], { once: true, only: { by: 'lastSpend', atLeast: 1 } })],
    {
      up: {
        effects: [
          on('play', [status('vigor', 2)], { once: true, only: { by: 'lastSpend', atLeast: 1 } }),
        ],
      },
    },
  ),
  a(
    'rare',
    'tempered-focus',
    'Tempered Focus',
    'power',
    1,
    'none',
    [on('turnStart', [status('vigor', 1)])],
    { up: { innate: true } },
  ),
  a(
    'rare',
    'cleaving-edge',
    'Cleaving Edge',
    'power',
    1,
    'none',
    [stars(2), status('bladesweep', 1)],
    {
      up: { effects: [stars(3), status('bladesweep', 1)] },
    },
  ),
  a('rare', 'echoing-blade', 'Echoing Blade', 'power', 2, 'none', [status('bladeecho', 1)], {
    up: { cost: 1 },
  }),
  a(
    'uncommon',
    'patient-edge-aura',
    'Patient Edge',
    'power',
    1,
    'none',
    [on('turnEnd', [when('starsSpentTurn', { atMost: 0 }, [stars(2)])])],
    {
      up: {
        effects: [on('turnEnd', [when('starsSpentTurn', { atMost: 0 }, [stars(2), ward(2)])])],
      },
    },
  ),

  // --- Spells ---
  a('common', 'skybolt', 'Spellbolt', 'attack', 1, 'foe', [burst(8, 4), fracture(2)], {
    starHalf: true,
    tags: [SPELL],
    up: { effects: [burst(11, 4), fracture(2)] },
  }),
  a(
    'common',
    'astral-pulse',
    'Arcane Pulse',
    'attack',
    1,
    'none',
    [burst(7, 3, 'allFoes'), fracture(2, 'allFoes')],
    {
      starHalf: true,
      tags: [SPELL],
      up: { effects: [burst(9, 3, 'allFoes'), fracture(2, 'allFoes')] },
    },
  ),
  a(
    'common',
    'tempered-bolt',
    'Tempered Bolt',
    'attack',
    1,
    'foe',
    [when('stars', { atMost: 0 }, [stars(2)]), dmg(6), stars(1)],
    {
      tags: [SPELL],
      up: { effects: [when('stars', { atMost: 0 }, [stars(2)]), dmg(9), stars(1)] },
    },
  ),
  a('common', 'glassbrand', 'Glassbrand', 'attack', 1, 'foe', [dmg(5), fracture(2)], {
    tags: [SPELL],
    up: { effects: [dmg(8), fracture(2)] },
  }),
  a(
    'uncommon',
    'gamma-burst',
    'Glass Burst',
    'attack',
    1,
    'foe',
    [
      burst(6, 4),
      when('starSpend', { atLeast: 3 }, [
        status('exposed', 1, 'target'),
        status('faltering', 1, 'target'),
      ]),
    ],
    {
      starHalf: true,
      tags: [SPELL],
      up: {
        effects: [
          burst(9, 4),
          when('starSpend', { atLeast: 3 }, [
            status('exposed', 1, 'target'),
            status('faltering', 1, 'target'),
          ]),
        ],
      },
    },
  ),
  a(
    'uncommon',
    'controlled-release',
    'Controlled Release',
    'attack',
    1,
    'foe',
    [burst(8, 4), when('starSpend', { atLeast: 1 }, [when('stars', { atLeast: 1 }, [draw(1)])])],
    {
      starHalf: true,
      tags: [SPELL],
      up: {
        effects: [
          burst(11, 4),
          when('starSpend', { atLeast: 1 }, [when('stars', { atLeast: 1 }, [draw(1)])]),
        ],
      },
    },
  ),
  a(
    'uncommon',
    'falling-sky',
    'Falling Shards',
    'attack',
    1,
    'foe',
    [onKill(burst(9, 4), [scaled(fracture(0, 'allFoes'), SPENT())])],
    {
      starX: true,
      tags: [SPELL],
      up: { effects: [onKill(burst(12, 4), [scaled(fracture(0, 'allFoes'), SPENT())])] },
    },
  ),
  a('uncommon', 'devastate', 'Molten Ruin', 'attack', 2, 'foe', [burst(12, 6), fracture(4)], {
    starX: true,
    tags: [SPELL],
    up: { effects: [burst(18, 6), fracture(4)] },
  }),
  a('uncommon', 'radiance', 'Arcane Flood', 'attack', 2, 'none', [burst(10, 4, 'allFoes')], {
    starX: true,
    tags: [SPELL],
    up: { effects: [burst(14, 4, 'allFoes')] },
  }),
  a(
    'rare',
    'dying-star',
    'Dying Ember',
    'attack',
    2,
    'none',
    [burst(8, 4, 'allFoes'), status('faltering', 2, 'allFoes')],
    {
      starHalf: true,
      tags: [SPELL],
      up: { effects: [burst(11, 4, 'allFoes'), status('faltering', 2, 'allFoes')] },
    },
  ),
  // (her big payoff: the best rate per point in her pool, DECISIONS #484, #503)
  a('rare', 'comet', 'Lava Bomb', 'attack', 3, 'foe', [burst(20, 7), fracture(6)], {
    starX: true,
    exhaust: true,
    tags: [SPELL],
    up: { effects: [burst(28, 7), fracture(6)] },
  }),
  a('rare', 'supernova', 'Cataclysm', 'attack', 3, 'none', [burst(18, 6, 'allFoes')], {
    starX: true,
    exhaust: true,
    tags: [SPELL],
    up: { effects: [burst(24, 6, 'allFoes')] },
  }),

  // --- Fracture ---
  a('common', 'faultline-hex', 'Faultline Hex', 'skill', 1, 'foe', [fracture(7)], {
    tags: [SPELL],
    up: { effects: [fracture(9)] },
  }),
  a('common', 'spreading-fault', 'Spreading Fault', 'skill', 1, 'none', [fracture(5, 'allFoes')], {
    tags: [SPELL],
    up: { effects: [fracture(7, 'allFoes')] },
  }),
  a(
    'common',
    'pressure-point-hex',
    'Pressure Point',
    'skill',
    1,
    'foe',
    [fracture(6), when('shatteredNow', { atLeast: 1 }, [draw(1)])],
    {
      tags: [SPELL],
      up: { effects: [fracture(8), when('shatteredNow', { atLeast: 1 }, [draw(1)])] },
    },
  ),
  a('common', 'glass-prison', 'Glass Prison', 'skill', 1, 'foe', [ward(5), fracture(2)], {
    tags: [SPELL],
    up: { effects: [ward(7), fracture(2)] },
  }),
  a('common', 'crack-the-shell', 'Crack the Shell', 'skill', 1, 'foe', [strip(6), fracture(4)], {
    tags: [SPELL],
    up: { effects: [strip(10), fracture(4)] },
  }),
  a('common', 'hairline-crack', 'Hairline Crack', 'skill', 0, 'foe', [fracture(5)], {
    exhaust: true,
    tags: [SPELL],
    up: { effects: [fracture(7)] },
  }),
  a(
    'uncommon',
    'stress-the-glass',
    'Stress the Glass',
    'skill',
    1,
    'foe',
    [scaled(fracture(3), SPENT(2))],
    {
      starHalf: true,
      tags: [SPELL],
      up: { effects: [scaled(fracture(5), SPENT(2))] },
    },
  ),
  a(
    'uncommon',
    'fault-memory',
    'Fault Memory',
    'skill',
    1,
    'foe',
    [scaled(fracture(5), per('bonus')), grows(3)],
    {
      tags: [SPELL],
      ...GROWN,
      up: { effects: [scaled(fracture(7), per('bonus')), grows(3)] },
    },
  ),
  a(
    'uncommon',
    'final-shatter',
    'Final Shatter',
    'skill',
    2,
    'foe',
    // (8, not 10, so "if this caused a Shatter" asks for 2 already on the target; the Barrier is the payoff, DECISIONS #563)
    [fracture(8), when('shatteredNow', { atLeast: 1 }, [ward(12)])],
    {
      tags: [SPELL],
      up: { effects: [fracture(8), when('shatteredNow', { atLeast: 1 }, [ward(16)])] },
    },
  ),
  a(
    'uncommon',
    'collapsing-star',
    'Collapsing Vein',
    'skill',
    2,
    'foe',
    [fracture(6, 'allFoes'), fracture(3)],
    {
      tags: [SPELL],
      up: { effects: [fracture(8, 'allFoes'), fracture(3)] },
    },
  ),
  a(
    'uncommon',
    'carry-the-fault',
    'Carry the Fault',
    'skill',
    1,
    'foe',
    [{ op: 'carryFracture', amount: 3, alone: 6 }],
    {
      tags: [SPELL],
      up: { effects: [{ op: 'carryFracture', amount: 5, alone: 8 }] },
    },
  ),
  a('uncommon', 'deep-fault', 'Deep Fault', 'skill', 2, 'foe', [shatterUp(6), fracture(4)], {
    exhaust: true,
    tags: [SPELL],
    up: { effects: [shatterUp(8), fracture(4)] },
  }),
  a('rare', 'rupture-script', 'Rupture Script', 'skill', 2, 'foe', [fracture(10)], {
    exhaust: true,
    tags: [SPELL],
    up: { effects: [fracture(11)] },
  }),
  a(
    'rare',
    'breaking-point-hex',
    'Breaking Point',
    'skill',
    2,
    'foe',
    [{ op: 'shatterBlast', to: 'target' }, fracture(4)],
    {
      exhaust: true,
      tags: [SPELL],
      up: { effects: [{ op: 'shatterBlast', to: 'target' }, fracture(6)] },
    },
  ),

  // --- Fracture Auras ---
  a(
    'uncommon',
    'deepening-fault',
    'Deepening Fault',
    'power',
    2,
    'none',
    [on('fracture', [shatterUp(2)], { once: true })],
    { up: { effects: [on('fracture', [shatterUp(3)], { once: true })] } },
  ),
  a(
    'uncommon',
    'gravity-well',
    'Hungering Void',
    'power',
    1,
    'none',
    [on('turnEnd', [fracture(3, 'allFoes', true)])],
    { up: { effects: [on('turnEnd', [fracture(4, 'allFoes', true)])] } },
  ),
  a(
    'uncommon',
    'pillar-of-light',
    'Pillar of Glass',
    'power',
    1,
    'none',
    [on('shatter', [ward(4)], { once: true })],
    { up: { effects: [on('shatter', [ward(6)], { once: true })] } },
  ),
  a(
    'uncommon',
    'fault-reader',
    'Fault Reader',
    'power',
    1,
    'none',
    [on('shatter', [draw(1), ward(2)], { once: true })],
    { up: { effects: [on('shatter', [draw(1), ward(4)], { once: true })] } },
  ),
  // (Fracture that builds from her other cards: every Sword and Spell cracks, DECISIONS #564)
  a(
    'uncommon',
    'fault-lines',
    'Fault Lines',
    'power',
    2,
    'none',
    [
      on('play', [fracture(1, 'targetOrMostFracture')], {
        tag: SWORD,
        orTag: SPELL,
        ownTurn: true,
        perTurnLimit: 6,
      }),
    ],
    { up: { cost: 1 } },
  ),
  a(
    'uncommon',
    'glass-armory',
    'Glass Armory',
    'power',
    1,
    'none',
    [on('play', [stars(2)], { tag: SWORD, once: true, only: { by: 'prevSpell', atLeast: 1 } })],
    {
      up: {
        effects: [
          on('play', [stars(3)], { tag: SWORD, once: true, only: { by: 'prevSpell', atLeast: 1 } }),
        ],
      },
    },
  ),

  // --- Spell and generator Auras ---
  a('uncommon', 'warm-anvil', 'Warm Anvil', 'power', 2, 'none', [on('turnStart', [stars(2)])], {
    up: { effects: [on('turnStart', [stars(3)])] },
  }),
  a(
    'uncommon',
    'orion',
    'Sigil of Kindling',
    'power',
    1,
    'none',
    [on('grown', [stars(2), ward(2)], { once: true })],
    { up: { effects: [on('grown', [stars(3), ward(2)], { once: true })] } },
  ),
  a(
    'uncommon',
    'cygnus',
    'Sigil of Glass',
    'power',
    1,
    'none',
    [on('arcana', [wardSpent(5)], { once: true, only: { by: 'spent', atLeast: 3 } })],
    {
      up: {
        effects: [on('arcana', [wardSpent(7)], { once: true, only: { by: 'spent', atLeast: 3 } })],
      },
    },
  ),
  a(
    'uncommon',
    'afterglow',
    'Afterglow',
    'power',
    1,
    'none',
    [on('arcana', [draw(1), wardSpent(3)], { once: true, only: { by: 'stars', atMost: 0 } })],
    {
      up: {
        effects: [
          on('arcana', [draw(1), wardSpent(5)], { once: true, only: { by: 'stars', atMost: 0 } }),
        ],
      },
    },
  ),
  a(
    'rare',
    'crucible-heart',
    'Crucible Heart',
    'power',
    1,
    'none',
    [on('grown', [{ ...growSelf(2), that: true } as Op], { once: true })],
    { up: { innate: true } },
  ),
  a('rare', 'measured-ruin', 'Measured Ruin', 'power', 2, 'none', [status('ruinous', 1)], {
    up: { effects: [status('ruinous', 2)] },
  }),

  // --- defence and selection ---
  a(
    'common',
    'star-barrier',
    'Arcane Barrier',
    'skill',
    1,
    'none',
    [scaled(barrier(5), SPENT(3))],
    {
      starHalf: true,
      tags: [SPELL],
      up: { effects: [scaled(barrier(8), SPENT(3))] },
    },
  ),
  a('common', 'glass-veil', 'Glass Veil', 'skill', 2, 'none', [ward(8), barrierNext(6), stars(1)], {
    tags: [SPELL],
    up: { effects: [ward(11), barrierNext(6), stars(1)] },
  }),
  a('uncommon', 'glass-wall', 'Glass Wall', 'skill', 2, 'none', [scaled(barrier(12), SPENT(3))], {
    starHalf: true,
    retain: true,
    tags: [SPELL],
    up: { effects: [scaled(barrier(16), SPENT(3))] },
  }),
  a(
    'uncommon',
    'mirror-glass',
    'Mirror Glass',
    'skill',
    1,
    'none',
    [ward(7), status('shielded', 1)],
    {
      starCost: 2,
      tags: [SPELL],
      up: { effects: [ward(10), status('shielded', 1)] },
    },
  ),
  a('uncommon', 'stellar-wind', 'Ash Wind', 'skill', 1, 'none', [draw(3), discard(1), stars(1)], {
    up: { effects: [draw(4), discard(1), stars(1)] },
  }),
  a(
    'uncommon',
    'recenter',
    'Recenter',
    'skill',
    1,
    'none',
    [
      draw(2),
      stars(1),
      when('swordsPlayed', { atLeast: 1 }, [when('spellsPlayed', { atLeast: 1 }, [stars(2)])]),
    ],
    {
      up: {
        effects: [
          draw(3),
          stars(1),
          when('swordsPlayed', { atLeast: 1 }, [when('spellsPlayed', { atLeast: 1 }, [stars(2)])]),
        ],
      },
    },
  ),
  a(
    'rare',
    'obsidian-aegis',
    'Obsidian Aegis',
    'power',
    1,
    'none',
    [on('turnEnd', [scaled(barrier(0), { by: 'stars', step: 2, half: 10 })])],
    { up: { effects: [on('turnEnd', [scaled(barrier(3), { by: 'stars', step: 2, half: 10 })])] } },
  ),
  a(
    'rare',
    'unbreakable-crown',
    'Unbreakable Crown',
    'skill',
    2,
    'none',
    [ward(18, 2), status('steadfast', 1)],
    {
      exhaust: true,
      tags: [SPELL],
      up: { effects: [ward(24, 2), status('steadfast', 1)] },
    },
  ),
  a('rare', 'fated-hand', 'Fated Hand', 'skill', 1, 'none', [seekTop(2), draw(2), stars(1)], {
    exhaust: true,
    up: { effects: [seekTop(2), draw(3), stars(1)] },
  }),
];
