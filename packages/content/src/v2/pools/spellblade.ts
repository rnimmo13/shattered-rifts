// Obsidia, Spellblade of the Hollow Crown (id spellblade). A spellblade of black glass and ember. No companions. Rebuilt 2026-10-29
// (docs/BASE_CLASS_REWORKS.md §7, DECISIONS #417): her Obsidian Blade holds two enchantments; her spells Imbue them and her blade
// attacks Discharge them. Her Regent copy (Arcana, the Sovereign Blade's Sharpen, Retainers; DECISIONS #369) is archived in
// reviews/balance-baselines/2026-10-29-pre-identity-reworks/.
//
// Enchantments (SideState.enchants, at most 2, in the order imbued; duplicates allowed):
//   Ember - the attack that discharges it deals 3 more on its first hit
//   Glass - 2 damage to ALL enemies once that attack is done (a shard: not an attack)
//   Ward  - 3 Barrier at once
// `imbue(kind)`: into a free position; with both taken the player chooses which one it replaces (a replacement is not a discharge).
// `discharge(1)`: the player chooses when the two differ; `discharge(2)`: both, once each. A charge lasts until it is spent or the
// fight ends: nothing grows for good, and no Arcana.
//
// Three strategies, plus glue (build paths stay hidden, DECISIONS #365):
//   Edge   - frequent single discharges: cheap Imbues and attacks that spend one at a time
//   Burst  - mixed charges and full discharges: fill both positions, then spend them together
//   Ward   - Ward-focused weaving: Barrier, Wards, and payoffs for what the blade holds
// Costs and points: docs/reworks/SPELLBLADE.md and spellblade-ledger.md (docs/14_CARD_COSTING.md §15).

import type { CardDef, Op } from '@sr/combat';
import {
  barrier,
  barrierNext,
  cleanse,
  discharge,
  dischargeKind,
  dmg,
  draw,
  drawNext,
  drawUntil,
  echoCharges,
  fetchCards,
  imbue,
  mana,
  manaNext,
  on,
  onKill,
  per,
  pool,
  recast,
  scaled,
  scry,
  status,
  statusTheirs,
  topdeck,
  when,
} from '../build';

const a = pool('spellblade', 'starfall');
/** (DECISIONS #425) "if it discharged one": the kind-specific discharges' bonus */
const ifSpent = (...ops: Op[]): Op => when('discharged', { atLeast: 1 }, ops);
/** "if your blade still holds an enchantment" / "if your blade is full" / "if your blade is empty" */
const ifHolds = (...ops: Op[]): Op => when('enchants', { atLeast: 1 }, ops);
const ifFull = (...ops: Op[]): Op => when('enchants', { atLeast: 2 }, ops);
const ifEmpty = (...ops: Op[]): Op => when('enchants', { atMost: 0 }, ops);
const ifPair = (...ops: Op[]): Op => when('dischargedPair', { atLeast: 1 }, ops);
const ifMix = (...ops: Op[]): Op => when('dischargedMix', { atLeast: 1 }, ops);
/** put a blade Attack from your discard pile into your hand */
const recallBlade: Op = { op: 'fetch', amount: 1, to: 'hand', tag: 'blade' };

export const SPELLBLADE: CardDef[] = [
  // --- basics ---
  a(
    'basic',
    'ember-inscription',
    'Ember Inscription',
    'skill',
    1,
    'foe',
    [dmg(5), imbue('ember')],
    {
      up: { effects: [dmg(8), imbue('ember')] },
    },
  ),
  a('basic', 'obsidian-cut', 'Obsidian Cut', 'attack', 1, 'foe', [discharge(), dmg(6)], {
    tags: ['blade'],
    up: { effects: [discharge(), dmg(9)] },
  }),

  // --- glue: general attacks, Barrier and cards ---
  a('common', 'gleam', 'Glint', 'attack', 1, 'foe', [dmg(7), draw(1), topdeck(1)], {
    up: { effects: [dmg(10), draw(1), topdeck(1)] },
  }),
  a(
    'common',
    'hollow-gaze',
    'Hollow Gaze',
    'skill',
    1,
    'none',
    [barrier(7), fetchCards(1, 'draw')],
    {
      up: { effects: [barrier(10), fetchCards(1, 'draw')] },
    },
  ),
  a(
    'common',
    'humble',
    'Humble',
    'skill',
    0,
    'foe',
    [status('faltering', 1, 'target'), status('exposed', 1, 'target')],
    {
      exhaust: true,
      up: { exhaust: false },
    },
  ),
  a(
    'common',
    'molten-weight',
    'Molten Weight',
    'attack',
    1,
    'none',
    [dmg(7, 'allFoes'), statusTheirs('sapped', 1, 'allFoes')],
    { up: { effects: [dmg(9, 'allFoes'), statusTheirs('sapped', 1, 'allFoes')] } },
  ),
  a('uncommon', 'stellar-wind', 'Ash Wind', 'skill', 1, 'none', [draw(3), topdeck(1)], {
    up: { effects: [draw(4), topdeck(1)] },
  }),

  // --- Edge: frequent single discharges ---
  a('common', 'forged-in-fury', 'Forged in Fury', 'attack', 1, 'foe', [dmg(7), imbue('ember')], {
    tags: ['blade'],
    up: { effects: [dmg(10), imbue('ember')] },
  }),
  a('common', 'skybolt', 'Spellbolt', 'attack', 1, 'foe', [discharge(), dmg(6), draw(1)], {
    tags: ['blade'],
    up: { effects: [discharge(), dmg(9), draw(1)] },
  }),
  a('common', 'ember-cache', 'Ember Cache', 'skill', 1, 'none', [imbue('ember'), draw(2)], {
    up: { effects: [imbue('ember'), draw(3)] },
  }),
  // (a free card that draws must Consume: balance.test)
  a('common', 'faint-glow', 'Faint Ember', 'skill', 0, 'none', [imbue('ember'), scry(2)], {
    exhaust: true,
    up: { effects: [imbue('ember'), scry(3)] },
  }),
  a(
    'common',
    'sunstrike',
    'Emberstrike',
    'attack',
    1,
    'foe',
    [dmg(9), when('enchants', { atMost: 0 }, [imbue('ember')])],
    {
      tags: ['blade'],
      up: { effects: [dmg(12), when('enchants', { atMost: 0 }, [imbue('ember')])] },
    },
  ),
  a('common', 'fracture-script', 'Fracture Script', 'skill', 1, 'foe', [dmg(7), imbue('glass')], {
    up: { effects: [dmg(10), imbue('glass')] },
  }),
  a(
    'common',
    'astral-pulse',
    'Shard Pulse',
    'attack',
    1,
    'none',
    [discharge(), dmg(7, 'allFoes')],
    {
      tags: ['blade'],
      up: { effects: [discharge(), dmg(9, 'allFoes')] },
    },
  ),
  a(
    'uncommon',
    'gamma-burst',
    'Glass Burst',
    'attack',
    1,
    'foe',
    [discharge(), dmg(5), status('faltering', 1, 'target'), status('exposed', 1, 'target')],
    {
      tags: ['blade'],
      up: {
        effects: [
          discharge(),
          dmg(8),
          status('faltering', 1, 'target'),
          status('exposed', 1, 'target'),
        ],
      },
    },
  ),
  a('uncommon', 'shard-strike', 'Shard Strike', 'attack', 1, 'foe', [dmg(8), imbue('glass')], {
    tags: ['blade'],
    up: { effects: [dmg(11), imbue('glass')] },
  }),
  a(
    'uncommon',
    'sovereign-strike',
    'Tyrant Strike',
    'attack',
    2,
    'foe',
    [discharge(), dmg(15), manaNext(1)],
    {
      tags: ['blade'],
      up: { effects: [discharge(), dmg(19), manaNext(1)] },
    },
  ),
  a(
    'uncommon',
    'recast-the-edge',
    'Recast the Edge',
    'skill',
    1,
    'none',
    [recast, barrier(6), draw(1)],
    {
      up: { effects: [recast, barrier(9), draw(1)] },
    },
  ),
  a(
    'uncommon',
    'warm-anvil',
    'Warm Anvil',
    'power',
    1,
    'none',
    [on('turnStart', [imbue('ember', true), barrier(2)])],
    { up: { effects: [on('turnStart', [imbue('ember', true), barrier(3)])] } },
  ),
  a(
    'uncommon',
    'call-the-blade',
    'Call the Blade',
    'skill',
    1,
    'none',
    [drawUntil('skill'), imbue('glass'), barrier(3)],
    {
      up: { effects: [drawUntil('skill'), imbue('glass'), barrier(6)] },
    },
  ),
  a(
    'rare',
    'echoing-blade',
    'Echoing Blade',
    'skill',
    0,
    'none',
    // (a free card that draws Consumes: balance.test)
    [status('twinedge', 1, 'self', true), draw(1), barrier(3)],
    {
      exhaust: true,
      up: { effects: [status('twinedge', 1, 'self', true), draw(1), barrier(6)] },
    },
  ),
  a(
    'rare',
    'cleaving-edge',
    'Cleaving Edge',
    'power',
    1,
    'none',
    [on('discharge', [dmg(4, 'allFoes')])],
    {
      up: { effects: [on('discharge', [dmg(5, 'allFoes')])] },
    },
  ),
  a('rare', 'big-bang', 'Magma Surge', 'skill', 0, 'none', [mana(1), imbue('ember')], {
    exhaust: true,
    up: { innate: true },
  }),
  a(
    'rare',
    'dying-star',
    'Dying Ember',
    'attack',
    2,
    'none',
    [discharge(), dmg(10, 'allFoes'), statusTheirs('sapped', 6, 'allFoes')],
    {
      tags: ['blade'],
      up: { effects: [discharge(), dmg(12, 'allFoes'), statusTheirs('sapped', 8, 'allFoes')] },
    },
  ),

  // --- Burst: mixed charges and full discharges ---
  a(
    'common',
    'whetstone',
    'Etch the Edge',
    'skill',
    1,
    'none',
    [imbue('ember'), imbue('glass'), barrier(5)],
    {
      up: { effects: [imbue('ember'), imbue('glass'), barrier(8)] },
    },
  ),
  a(
    'common',
    'obsidian-flurry',
    'Obsidian Flurry',
    'attack',
    2,
    'foe',
    [discharge(), dmg(6, 'target', 3)],
    {
      tags: ['blade'],
      up: { effects: [discharge(), dmg(8, 'target', 3)] },
    },
  ),
  a(
    'common',
    'cosmic-lance',
    'Obsidian Lance',
    'attack',
    1,
    'foe',
    [scaled(dmg(5), per('enchants', 3))],
    {
      tags: ['blade'],
      up: { effects: [scaled(dmg(8), per('enchants', 3))] },
    },
  ),
  a('uncommon', 'crownfall', 'Crownfall', 'attack', 2, 'foe', [discharge(2), dmg(17)], {
    tags: ['blade'],
    up: { effects: [discharge(2), dmg(22)] },
  }),
  a('uncommon', 'devastate', 'Molten Ruin', 'attack', 3, 'foe', [discharge(2), dmg(26)], {
    tags: ['blade'],
    up: { effects: [discharge(2), dmg(34)] },
  }),
  a(
    'uncommon',
    'radiance',
    'Shard Storm',
    'attack',
    1,
    'none',
    [discharge(), dmg(4, 'allFoes', 2)],
    {
      tags: ['blade'],
      up: { effects: [discharge(), dmg(5, 'allFoes', 2)] },
    },
  ),
  a(
    'uncommon',
    'overcharge-edge',
    'Overcharge Edge',
    'attack',
    1,
    'foe',
    [discharge(2), scaled(dmg(4), per('discharged', 4))],
    { tags: ['blade'], up: { effects: [discharge(2), scaled(dmg(7), per('discharged', 4))] } },
  ),
  a(
    'uncommon',
    'final-shatter',
    'Final Shatter',
    'attack',
    3,
    'foe',
    [onKill(dmg(26), [imbue('ember', true), imbue('glass', true)])],
    {
      tags: ['blade'],
      up: { effects: [onKill(dmg(34), [imbue('ember', true), imbue('glass', true)])] },
    },
  ),
  a(
    'uncommon',
    'banked-embers',
    'Banked Embers',
    'skill',
    1,
    'none',
    [imbue('ember'), manaNext(1), status('holdfast', 1), barrier(3)],
    { up: { effects: [imbue('ember'), manaNext(1), status('holdfast', 1), barrier(6)] } },
  ),
  a('uncommon', 'scheme', 'Scheme', 'skill', 1, 'none', [drawNext(2), imbue('glass'), barrier(2)], {
    up: { effects: [drawNext(3), imbue('glass'), barrier(2)] },
  }),
  a(
    'rare',
    'emberglass-covenant',
    'Emberglass Covenant',
    'power',
    1,
    'none',
    [on('dischargeMixed', [manaNext(1), barrier(6)], { once: true })],
    { up: { effects: [on('dischargeMixed', [manaNext(1), barrier(9)], { once: true })] } },
  ),
  a(
    'rare',
    'comet',
    'Lava Bomb',
    'attack',
    3,
    'foe',
    [discharge(2), dmg(20), status('faltering', 2, 'target'), status('exposed', 2, 'target')],
    {
      tags: ['blade'],
      up: {
        effects: [
          discharge(2),
          dmg(26),
          status('faltering', 2, 'target'),
          status('exposed', 2, 'target'),
        ],
      },
    },
  ),
  a(
    'rare',
    'seven-shards',
    'Seven Shards',
    'attack',
    2,
    'foe',
    [discharge(2), dmg(3, 'target', 7)],
    {
      tags: ['blade'],
      up: { effects: [discharge(2), dmg(4, 'target', 7)] },
    },
  ),
  a(
    'rare',
    'heirloom-maul',
    'Heirloom Maul',
    'attack',
    2,
    'foe',
    [discharge(2), dmg(16), scaled(draw(0), per('discharged'))],
    {
      tags: ['blade'],
      up: { effects: [discharge(2), dmg(21), scaled(draw(0), per('discharged'))] },
    },
  ),
  a('rare', 'supernova', 'Cataclysm', 'attack', 1, 'none', [discharge(2), dmg(9, 'allFoes')], {
    tags: ['blade'],
    up: { effects: [discharge(2), dmg(12, 'allFoes')] },
  }),
  a(
    'rare',
    'twin-sigils',
    'Twin Sigils',
    'skill',
    1,
    'none',
    [imbue('ember'), imbue('ward'), barrier(4), draw(1)],
    {
      up: { effects: [imbue('ember'), imbue('ward'), barrier(7), draw(1)] },
    },
  ),
  a(
    'rare',
    'glass-requiem',
    'Glass Requiem',
    'attack',
    2,
    'foe',
    // (the shards only when something was discharged: a 0-damage hit on every enemy would still spring their Thorns and Traps)
    [
      discharge(2),
      dmg(14),
      when('discharged', { atLeast: 1 }, [scaled(dmg(0, 'allFoes'), per('discharged', 3))]),
    ],
    {
      tags: ['blade'],
      up: {
        effects: [
          discharge(2),
          dmg(19),
          when('discharged', { atLeast: 1 }, [scaled(dmg(0, 'allFoes'), per('discharged', 3))]),
        ],
      },
    },
  ),

  // --- Ward: Barrier, Wards, and payoffs for what the blade holds ---
  a('common', 'glass-veil', 'Glass Veil', 'skill', 2, 'none', [barrier(11), barrierNext(5)], {
    up: { effects: [barrier(13), barrierNext(7)] },
  }),
  a(
    'uncommon',
    'shatterguard',
    'Shatterguard',
    'skill',
    1,
    'none',
    [discharge(2), scaled(barrier(0), per('discharged', 5))],
    {
      up: { effects: [discharge(2), scaled(barrier(2), per('discharged', 5))] },
    },
  ),
  a('common', 'glassward', 'Glassward', 'skill', 1, 'none', [barrier(5), imbue('ward')], {
    up: { effects: [barrier(8), imbue('ward')] },
  }),
  a(
    'common',
    'pale-beacon',
    'Pale Ward',
    'skill',
    1,
    'none',
    [barrier(8), when('wards', { atLeast: 1 }, [draw(1)])],
    { up: { effects: [barrier(11), when('wards', { atLeast: 1 }, [draw(1)])] } },
  ),
  a('common', 'star-barrier', 'Glass Barrier', 'skill', 1, 'none', [discharge(), barrier(7)], {
    up: { effects: [discharge(), barrier(10)] },
  }),
  a('uncommon', 'bladewall', 'Bladewall', 'skill', 2, 'none', [barrier(14), imbue('ward')], {
    up: { effects: [barrier(18), imbue('ward')] },
  }),
  a('uncommon', 'parry', 'Glass Guard', 'power', 1, 'none', [on('discharge', [barrier(3)])], {
    up: { effects: [on('discharge', [barrier(4)])] },
  }),
  a(
    'uncommon',
    'mirror-glass',
    'Mirror Glass',
    'skill',
    2,
    'none',
    [discharge(), barrier(11), status('reflect', 1)],
    {
      up: { effects: [discharge(), barrier(15), status('reflect', 1)] },
    },
  ),
  a(
    'uncommon',
    'glass-wall',
    'Glass Wall',
    'skill',
    1,
    'none',
    [barrier(5), imbue('ward'), scry(1)],
    {
      up: { effects: [barrier(8), imbue('ward'), scry(1)] },
    },
  ),
  a(
    'uncommon',
    'ward-weave',
    'Weave the Ward',
    'skill',
    1,
    'none',
    [imbue('ward'), scaled(barrier(0), per('wards', 3)), draw(1)],
    { up: { effects: [imbue('ward'), scaled(barrier(0), per('wards', 4)), draw(1)] } },
  ),
  a(
    'rare',
    'obsidian-aegis',
    'Obsidian Aegis',
    'power',
    1,
    'none',
    [on('turnEnd', [scaled(barrier(0), per('enchants', 3))])],
    { up: { effects: [on('turnEnd', [scaled(barrier(0), per('enchants', 4))])] } },
  ),
  a(
    'rare',
    'unbreakable-crown',
    'Unbreakable Crown',
    'skill',
    2,
    'none',
    [barrier(16), imbue('ward'), imbue('ward')],
    {
      up: { effects: [barrier(20), imbue('ward'), imbue('ward')] },
    },
  ),

  // --- Edge, the expansion (DECISIONS #425): one charge at a time, the other kept for a purpose; Recast to fix the blade ---
  a(
    'common',
    'measured-release',
    'Measured Release',
    'attack',
    1,
    'foe',
    [discharge(), dmg(7), ifHolds(draw(1))],
    { tags: ['blade'], up: { effects: [discharge(), dmg(10), ifHolds(draw(1))] } },
  ),
  a('common', 'spark-thrust', 'Spark Thrust', 'attack', 0, 'foe', [discharge(), dmg(5)], {
    tags: ['blade'],
    up: { effects: [discharge(), dmg(7)] },
  }),
  // (kind-specific discharges: only that charge goes, the other stays on the blade)
  a(
    'common',
    'glass-fang',
    'Glass Fang',
    'attack',
    1,
    'foe',
    [dischargeKind('glass'), dmg(7), ifSpent(statusTheirs('sapped', 2, 'allFoes'))],
    {
      tags: ['blade'],
      up: {
        effects: [dischargeKind('glass'), dmg(10), ifSpent(statusTheirs('sapped', 2, 'allFoes'))],
      },
    },
  ),
  a(
    'uncommon',
    'searing-edge',
    'Searing Edge',
    'attack',
    2,
    'foe',
    [dischargeKind('ember'), dmg(14), ifSpent(status('exposed', 2, 'target'))],
    {
      tags: ['blade'],
      up: { effects: [dischargeKind('ember'), dmg(18), ifSpent(status('exposed', 2, 'target'))] },
    },
  ),
  // (two single discharges: each charge lands on its own hit, and each answers a discharge trigger)
  a(
    'uncommon',
    'double-release',
    'Double Release',
    'attack',
    1,
    'foe',
    [discharge(), dmg(4), discharge(), dmg(4)],
    { tags: ['blade'], up: { effects: [discharge(), dmg(6), discharge(), dmg(6)] } },
  ),
  a(
    'uncommon',
    'edge-discipline',
    'Edge Discipline',
    'power',
    1,
    'none',
    [on('discharge', [ifHolds(draw(1), barrier(1))])],
    { up: { innate: true } },
  ),
  a('common', 'shift-the-grain', 'Shift the Grain', 'skill', 0, 'none', [recast, barrier(4)], {
    up: { effects: [recast, barrier(6)] },
  }),
  a(
    'uncommon',
    'adaptive-strike',
    'Adaptive Strike',
    'attack',
    1,
    'foe',
    [recast, discharge(), dmg(8)],
    { tags: ['blade'], up: { effects: [recast, discharge(), dmg(11)] } },
  ),
  a(
    'uncommon',
    'living-glass',
    'Living Glass',
    'power',
    1,
    'none',
    [on('recast', [barrier(3), draw(1)], { once: true })],
    { up: { innate: true } },
  ),
  // (a free card that draws Consumes: balance.test)
  a(
    'rare',
    'obsidian-insight',
    'Obsidian Insight',
    'skill',
    0,
    'none',
    [scry(3), recast, draw(1)],
    { exhaust: true, up: { effects: [scry(4), recast, draw(1)] } },
  ),
  a(
    'common',
    'rekindle',
    'Rekindle',
    'skill',
    1,
    'none',
    // (empty-blade recovery: nothing but Barrier while the blade still holds something)
    [barrier(5), ifEmpty(imbue('ember'), imbue('glass'), draw(1))],
    { up: { effects: [barrier(8), ifEmpty(imbue('ember'), imbue('glass'), draw(1))] } },
  ),
  a(
    'uncommon',
    'spell-etched-steel',
    'Spell-Etched Steel',
    'power',
    1,
    'none',
    [on('imbue', [dmg(3, 'randomFoe')])],
    {
      up: { effects: [on('imbue', [dmg(4, 'randomFoe')])] },
    },
  ),

  // --- Burst, the expansion (DECISIONS #425): matching and mixed pairs, and a full blade held for the right turn ---
  a(
    'uncommon',
    'split-the-light',
    'Split the Light',
    'attack',
    1,
    'foe',
    [discharge(2), dmg(5), ifMix(draw(2))],
    { tags: ['blade'], up: { effects: [discharge(2), dmg(8), ifMix(draw(2))] } },
  ),
  a(
    'uncommon',
    'fault-line',
    'Fault Line',
    'attack',
    2,
    'none',
    [discharge(2), dmg(11, 'allFoes'), ifMix(status('exposed', 1, 'allFoes'))],
    {
      tags: ['blade'],
      up: { effects: [discharge(2), dmg(14, 'allFoes'), ifMix(status('exposed', 1, 'allFoes'))] },
    },
  ),
  a(
    'rare',
    'prism-break',
    'Prism Break',
    'attack',
    2,
    'foe',
    [discharge(2), dmg(13), ifMix(dmg(10))],
    { tags: ['blade'], up: { effects: [discharge(2), dmg(17), ifMix(dmg(10))] } },
  ),
  a(
    'common',
    'kindle-the-blade',
    'Kindle the Blade',
    'skill',
    1,
    'none',
    [imbue('ember'), imbue('ember'), barrier(4)],
    { up: { effects: [imbue('ember'), imbue('ember'), barrier(7)] } },
  ),
  a(
    'common',
    'glaze-the-edge',
    'Glaze the Edge',
    'skill',
    1,
    'none',
    [imbue('glass'), imbue('glass'), barrier(4)],
    { up: { effects: [imbue('glass'), imbue('glass'), barrier(7)] } },
  ),
  // (a matching pair: Ember+Ember 6 more on the hit, Glass+Glass 4 more to every enemy, Ward+Ward 6 more Barrier; never a charge back)
  a(
    'uncommon',
    'resonant-pair',
    'Resonant Pair',
    'attack',
    1,
    'foe',
    [discharge(2), ifPair(echoCharges), dmg(6)],
    { tags: ['blade'], up: { effects: [discharge(2), ifPair(echoCharges), dmg(9)] } },
  ),
  a(
    'rare',
    'kindred-shards',
    'Kindred Shards',
    'attack',
    2,
    'foe',
    [discharge(2), ifPair(echoCharges, draw(1)), dmg(15)],
    { tags: ['blade'], up: { effects: [discharge(2), ifPair(echoCharges, draw(1)), dmg(20)] } },
  ),
  a(
    'uncommon',
    'matched-set',
    'Matched Set',
    'power',
    1,
    'none',
    [on('imbue', [when('bladePair', { atLeast: 1 }, [barrier(3)])])],
    { up: { effects: [on('imbue', [when('bladePair', { atLeast: 1 }, [barrier(4)])])] } },
  ),
  a(
    'uncommon',
    'bide-the-blade',
    'Bide the Blade',
    'skill',
    1,
    'none',
    [barrier(7), ifFull(draw(2))],
    { retain: true, up: { effects: [barrier(10), ifFull(draw(2))] } },
  ),
  a(
    'common',
    'tempered-wait',
    'Tempered Wait',
    'skill',
    1,
    'none',
    [barrier(6), when('bladeEmbers', { atLeast: 1 }, [manaNext(1)])],
    { up: { effects: [barrier(9), when('bladeEmbers', { atLeast: 1 }, [manaNext(1)])] } },
  ),
  a(
    'uncommon',
    'glass-sight',
    'Glass Sight',
    'skill',
    1,
    'none',
    [barrier(5), scaled(draw(0), per('enchantKinds'))],
    { retain: true, up: { effects: [barrier(8), scaled(draw(0), per('enchantKinds'))] } },
  ),
  // (a full blade at the start of the turn: the Mana is for spending it)
  a(
    'rare',
    'stored-light',
    'Stored Light',
    'power',
    1,
    'none',
    [on('turnStart', [ifFull(mana(1), barrier(2))])],
    { up: { innate: true } },
  ),
  a(
    'rare',
    'obsidian-resonance',
    'Obsidian Resonance',
    'power',
    1,
    'none',
    [on('turnStart', [status('twinedge', 1, 'self', true), barrier(2)])],
    { up: { innate: true } },
  ),

  // --- Ward, the expansion (DECISIONS #425): Wards held for pressure or spent for defence, debuffs and recovery ---
  a(
    'common',
    'glass-and-guard',
    'Glass and Guard',
    'skill',
    1,
    'none',
    [imbue('glass'), imbue('ward'), barrier(3)],
    { up: { effects: [imbue('glass'), imbue('ward'), barrier(6)] } },
  ),
  a(
    'common',
    'glimpse-through-glass',
    'Glimpse Through Glass',
    'skill',
    1,
    'none',
    [scry(3), barrier(4)],
    { up: { effects: [scry(3), barrier(7)] } },
  ),
  a(
    'uncommon',
    'blade-recall',
    'Blade Recall',
    'skill',
    1,
    'none',
    [recallBlade, imbue('ward'), barrier(3)],
    { up: { effects: [recallBlade, imbue('ward'), barrier(6)] } },
  ),
  a(
    'common',
    'warding-strike',
    'Warding Strike',
    'attack',
    1,
    'foe',
    [dischargeKind('ward'), scaled(dmg(6), per('discharged', 4))],
    {
      tags: ['blade'],
      up: { effects: [dischargeKind('ward'), scaled(dmg(9), per('discharged', 4))] },
    },
  ),
  a(
    'uncommon',
    'wardbreak',
    'Wardbreak',
    'attack',
    1,
    'none',
    [dischargeKind('ward', 2), ifSpent(scaled(dmg(0, 'allFoes'), per('discharged', 5)))],
    {
      tags: ['blade'],
      up: {
        effects: [
          dischargeKind('ward', 2),
          ifSpent(scaled(dmg(0, 'allFoes'), per('discharged', 6))),
        ],
      },
    },
  ),
  a(
    'common',
    'hold-the-glass',
    'Hold the Glass',
    'skill',
    1,
    'none',
    [scaled(barrier(5), per('wards', 2))],
    { retain: true, up: { effects: [scaled(barrier(8), per('wards', 2))] } },
  ),
  a(
    'uncommon',
    'sentinel-glass',
    'Sentinel Glass',
    'power',
    1,
    'none',
    [on('turnEnd', [when('wards', { atLeast: 1 }, [dmg(4, 'allFoes')])])],
    { up: { effects: [on('turnEnd', [when('wards', { atLeast: 1 }, [dmg(5, 'allFoes')])])] } },
  ),
  a(
    'common',
    'blunting-ward',
    'Blunting Ward',
    'skill',
    1,
    'foe',
    [status('faltering', 1, 'target'), imbue('ward'), barrier(3)],
    { up: { effects: [status('faltering', 1, 'target'), imbue('ward'), barrier(6)] } },
  ),
  a(
    'uncommon',
    'purifying-shard',
    'Purifying Shard',
    'skill',
    1,
    'none',
    [cleanse(2), barrier(6), imbue('glass')],
    { up: { effects: [cleanse(2), barrier(9), imbue('glass')] } },
  ),
  // (a Skill that discharges: an Ember is lost, a Glass breaks at once, a Ward gives its Barrier)
  a(
    'uncommon',
    'shattering-rebuke',
    'Shattering Rebuke',
    'skill',
    1,
    'foe',
    [discharge(), status('faltering', 2, 'target'), barrier(3)],
    { up: { effects: [discharge(), status('faltering', 2, 'target'), barrier(6)] } },
  ),
  a(
    'common',
    'scatter-glass',
    'Scatter Glass',
    'attack',
    1,
    'none',
    [dmg(4, 'allFoes'), imbue('glass'), barrier(2)],
    { up: { effects: [dmg(6, 'allFoes'), imbue('glass'), barrier(2)] } },
  ),
];
