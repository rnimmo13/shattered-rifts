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

import type { CardDef } from '@sr/combat';
import {
  barrier,
  barrierNext,
  discharge,
  dmg,
  draw,
  drawNext,
  drawUntil,
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
    [barrier(6), fetchCards(1, 'draw')],
    {
      up: { effects: [barrier(9), fetchCards(1, 'draw')] },
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
    [discharge(), dmg(13), manaNext(1)],
    {
      tags: ['blade'],
      up: { effects: [discharge(), dmg(17), manaNext(1)] },
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
    { up: { effects: [on('turnStart', [imbue('ember', true), barrier(4)])] } },
  ),
  a(
    'uncommon',
    'call-the-blade',
    'Call the Blade',
    'skill',
    1,
    'none',
    [drawUntil('skill'), imbue('glass')],
    {
      up: { effects: [drawUntil('skill'), imbue('glass'), barrier(4)] },
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
      up: { effects: [on('discharge', [dmg(6, 'allFoes')])] },
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
    [discharge(), dmg(8, 'allFoes'), statusTheirs('sapped', 6, 'allFoes')],
    {
      tags: ['blade'],
      up: { effects: [discharge(), dmg(10, 'allFoes'), statusTheirs('sapped', 8, 'allFoes')] },
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
    [imbue('ember'), manaNext(1), status('holdfast', 1)],
    { up: { effects: [imbue('ember'), manaNext(1), status('holdfast', 1), barrier(3)] } },
  ),
  a('uncommon', 'scheme', 'Scheme', 'skill', 1, 'none', [drawNext(2), imbue('glass')], {
    up: { effects: [drawNext(3), imbue('glass')] },
  }),
  a(
    'rare',
    'emberglass-covenant',
    'Emberglass Covenant',
    'power',
    1,
    'none',
    [on('dischargeMixed', [manaNext(1), barrier(4)], { once: true })],
    { up: { effects: [on('dischargeMixed', [manaNext(1), barrier(7)], { once: true })] } },
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
    [discharge(2), dmg(14), scaled(dmg(0, 'allFoes'), per('discharged', 3))],
    {
      tags: ['blade'],
      up: { effects: [discharge(2), dmg(19), scaled(dmg(0, 'allFoes'), per('discharged', 3))] },
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
    [discharge(), barrier(10), status('reflect', 1)],
    {
      up: { effects: [discharge(), barrier(14), status('reflect', 1)] },
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
];
