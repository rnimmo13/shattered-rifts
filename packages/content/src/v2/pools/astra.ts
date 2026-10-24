// Obsidia, the Glasswaste Spellblade (display name; the id stays 'astra', DECISIONS #140). A spellblade of black glass and ember. No companions.
// Arcana (the `stars` op) is a second resource: cards gain it and spend it, and it lasts the whole fight.
// The Obsidian Blade (id 'starforged-blade') is one card that every Sharpen permanently improves (it Retains, so it waits for you).
// Three lanes:
//   Blade   - sharpen the Obsidian Blade and swing it
//   Arcana  - spend Arcana on finishers
//   Sigils  - Powers that tick every turn

import type { CardDef } from '@sr/combat';
import {
  barrier,
  dmg,
  draw,
  forge,
  mana,
  manaNext,
  on,
  per,
  pool,
  scaled,
  scry,
  stars,
  status,
  drawNext,
  addTo,
  discard,
} from '../build';

const a = pool('astra', 'starfall');

export const ASTRA: CardDef[] = [
  // --- basics and the token ---
  a('basic', 'meteor-jab', 'Glass Jab', 'attack', 1, 'foe', [dmg(7), stars(1)]),
  a('basic', 'gather-light', 'Gather Arcana', 'skill', 1, 'none', [stars(3)], { innate: true }),
  a('basic', 'lumen-bolt', 'Arcane Bolt', 'attack', 1, 'foe', [dmg(16)], {
    starCost: 1,
    innate: true,
  }),
  a(
    'common',
    'starforged-blade',
    'Obsidian Blade',
    'attack',
    1,
    'foe',
    [scaled(dmg(9), per('bonus'))],
    { retain: true, tags: ['blade'], source: 'token' },
  ),

  // --- Blade ---
  a('common', 'hone', 'Hone', 'skill', 1, 'none', [forge('starforged-blade', 4)]),
  a('common', 'honed-strike', 'Honed Strike', 'attack', 1, 'foe', [
    dmg(6),
    forge('starforged-blade', 2),
  ]),
  a('common', 'blade-ward', 'Blade Ward', 'skill', 1, 'none', [
    barrier(5),
    forge('starforged-blade', 1),
  ]),
  a('common', 'whetstone', 'Whetstone', 'skill', 0, 'none', [forge('starforged-blade', 4)], {
    exhaust: true,
  }),
  a('uncommon', 'crown-strike', 'Crown Strike', 'attack', 1, 'foe', [
    dmg(7),
    forge('starforged-blade', 1),
  ]),
  a('uncommon', 'edgewise', 'Edgewise', 'skill', 1, 'none', [
    barrier(7),
    forge('starforged-blade', 2),
  ]),
  a('uncommon', 'royal-decree', 'Royal Decree', 'skill', 2, 'none', [
    forge('starforged-blade', 6),
    draw(1),
  ]),
  a('uncommon', 'knights-oath', "Knight's Oath", 'power', 1, 'none', [
    on('play', [stars(1)], { tag: 'blade' }),
  ]),
  a('rare', 'ever-sharpening', 'Ever-Sharpening', 'power', 2, 'none', [
    on('turnStart', [forge('starforged-blade', 2)]),
  ]),

  a('common', 'sunsteel', 'Blacksteel', 'attack', 1, 'foe', [dmg(8), forge('starforged-blade', 1)]),
  a('uncommon', 'astral-edge', 'Arcane Edge', 'power', 1, 'none', [
    on('play', [forge('starforged-blade', 1)], { tag: 'blade' }),
  ]),
  a('rare', 'celestial-edge', 'Volcanic Edge', 'attack', 2, 'foe', [
    dmg(12),
    forge('starforged-blade', 3),
  ]),

  // (more Blade)
  a('common', 'temper-edge', 'Temper Edge', 'skill', 1, 'none', [
    forge('starforged-blade', 5),
    manaNext(1),
  ]),
  a('common', 'spoils', 'Spoils', 'skill', 1, 'none', [forge('starforged-blade', 3), draw(2)]),
  a('common', 'forged-in-fury', 'Forged in Fury', 'attack', 1, 'foe', [
    dmg(7),
    forge('starforged-blade', 3),
  ]),
  a('uncommon', 'bladewall', 'Bladewall', 'skill', 2, 'none', [
    barrier(12),
    forge('starforged-blade', 4),
  ]),
  a('uncommon', 'call-the-blade', 'Call the Blade', 'skill', 1, 'none', [
    addTo('starforged-blade'),
    forge('starforged-blade', 3),
  ]),
  a('uncommon', 'warm-anvil', 'Warm Anvil', 'power', 1, 'none', [
    on('turnStart', [forge('starforged-blade', 1)]),
  ]),
  a('uncommon', 'parry', 'Parry', 'power', 1, 'none', [on('play', [barrier(6)], { tag: 'blade' })]),
  a('uncommon', 'sword-rain', 'Sword Rain', 'skill', 1, 'none', [addTo('starforged-blade', 2)]),
  a('rare', 'hammer-and-anvil', 'Hammer and Anvil', 'attack', 2, 'foe', [
    dmg(6, 'target', 2),
    forge('starforged-blade', 4),
  ]),
  a('rare', 'conqueror', 'Conqueror', 'skill', 1, 'none', [
    forge('starforged-blade', 4),
    status('twinned', 1),
  ]),
  a(
    'rare',
    'big-bang',
    'Eruption',
    'skill',
    2,
    'none',
    [draw(1), mana(1), stars(2), forge('starforged-blade', 4)],
    { exhaust: true },
  ),
  a('rare', 'armory-of-light', 'Armory of Glass', 'power', 2, 'none', [
    on('created', [status('might', 1)]),
  ]),
  a('rare', 'collapsing-star', 'Collapsing Vein', 'attack', 2, 'foe', [
    scaled(dmg(5), per('created', 2)),
  ]),

  // --- Arcana ---
  a('common', 'stargaze', 'Scrying Glass', 'skill', 0, 'none', [stars(1), draw(1)], {
    exhaust: true,
  }),
  a('common', 'starshield', 'Glass Shield', 'skill', 1, 'none', [barrier(6), stars(1)]),
  a('common', 'ray-of-light', 'Searing Ray', 'attack', 1, 'foe', [dmg(9)]),
  a('common', 'gleam', 'Glint', 'attack', 1, 'foe', [dmg(7), scry(2)]),
  a('common', 'skybolt', 'Spellbolt', 'attack', 1, 'foe', [dmg(20)], { starCost: 1 }),
  a('common', 'star-barrier', 'Arcane Barrier', 'skill', 1, 'none', [barrier(16)], { starCost: 1 }),
  a('uncommon', 'nova', 'Shatterburst', 'attack', 2, 'foe', [dmg(34)], { starCost: 2 }),
  a('uncommon', 'falling-sky', 'Falling Shards', 'attack', 1, 'none', [dmg(8, 'allFoes', 3)], {
    starCost: 3,
  }),
  a(
    'uncommon',
    'solar-flare',
    'Magma Flare',
    'attack',
    1,
    'none',
    [dmg(14, 'allFoes'), status('exposed', 1, 'allFoes')],
    { starCost: 2 },
  ),
  a('uncommon', 'orbit', 'Weave', 'skill', 1, 'none', [
    stars(1),
    forge('starforged-blade', 1),
    draw(1),
  ]),
  a('uncommon', 'cosmic-lance', 'Obsidian Lance', 'attack', 2, 'foe', [dmg(14), stars(1)]),
  a('uncommon', 'gravity-well', 'Binding Hex', 'skill', 1, 'foe', [
    status('exposed', 2, 'target'),
    stars(1),
  ]),
  a('uncommon', 'eclipse', 'Dark Glass', 'skill', 2, 'none', [
    barrier(10),
    status('faltering', 1, 'allFoes'),
  ]),
  a('uncommon', 'starlight', 'Arcane Surge', 'skill', 1, 'none', [stars(3)], { exhaust: true }),
  a(
    'rare',
    'supernova',
    'Cataclysm',
    'attack',
    3,
    'foe',
    [dmg(54), status('exposed', 2, 'target')],
    {
      starCost: 4,
    },
  ),
  a('rare', 'dawn-of-stars', 'Wellspring', 'skill', 1, 'none', [stars(5), draw(2)], {
    exhaust: true,
  }),

  // (more Arcana)
  a('common', 'faint-glow', 'Faint Ember', 'skill', 1, 'none', [stars(1), draw(1), drawNext(1)]),
  a('common', 'astral-pulse', 'Arcane Pulse', 'attack', 1, 'none', [dmg(6, 'allFoes', 2)]),
  a('common', 'heavenly-might', 'Molten Might', 'attack', 2, 'foe', [dmg(6, 'target', 3)]),
  a('common', 'sunstrike', 'Emberstrike', 'attack', 1, 'foe', [dmg(9), stars(1)]),
  a('common', 'crushing-light', 'Crushing Slag', 'attack', 2, 'none', [
    dmg(8, 'allFoes'),
    status('faltering', 1, 'allFoes'),
  ]),
  a(
    'common',
    'humble',
    'Humble',
    'skill',
    1,
    'foe',
    [status('faltering', 1, 'target'), status('exposed', 1, 'target')],
    { exhaust: true },
  ),
  a('uncommon', 'radiance', 'Overflow', 'attack', 1, 'none', [
    scaled(dmg(3, 'allFoes'), per('stars', 1)),
  ]),
  a('uncommon', 'sovereign-strike', 'Tyrant Strike', 'attack', 2, 'foe', [dmg(15), manaNext(2)]),
  a('uncommon', 'devastate', 'Devastate', 'attack', 2, 'foe', [dmg(34)], { starCost: 2 }),
  a('rare', 'gamma-burst', 'Glass Burst', 'attack', 2, 'foe', [
    dmg(13),
    status('faltering', 2, 'target'),
    status('exposed', 2, 'target'),
  ]),
  a('rare', 'killing-light', 'Killing Glass', 'attack', 2, 'foe', [dmg(30)], { starCost: 3 }),
  a('rare', 'starburst', 'Arcane Burst', 'skill', 1, 'none', [stars(6)], { exhaust: true }),
  a(
    'rare',
    'comet',
    'Lava Bomb',
    'attack',
    3,
    'foe',
    [dmg(33), status('faltering', 3, 'target'), status('exposed', 3, 'target')],
    { starCost: 3 },
  ),
  a(
    'rare',
    'dying-star',
    'Dying Ember',
    'attack',
    1,
    'none',
    [dmg(10, 'allFoes'), status('faltering', 2, 'allFoes')],
    { ethereal: true },
  ),

  // --- Sigils ---
  a('uncommon', 'orion', 'Sigil of Kindling', 'power', 2, 'none', [on('turnStart', [stars(1)])]),
  a('uncommon', 'lyra', 'Sigil of Ward', 'power', 2, 'none', [
    on('turnEnd', [scaled(barrier(0), per('stars'))]),
  ]),
  a('uncommon', 'draco', 'Sigil of Scorch', 'power', 2, 'none', [
    on('turnStart', [dmg(3, 'allFoes')]),
  ]),
  a('uncommon', 'cygnus', 'Sigil of Glass', 'power', 1, 'none', [
    on('play', [barrier(2)], { filter: 'skill' }),
  ]),
  a('uncommon', 'ursa', 'Sigil of Stone', 'power', 1, 'none', [on('turnEnd', [barrier(3)])]),
  a('rare', 'cassiopeia', 'Sigil of Conduit', 'power', 2, 'none', [
    on('play', [stars(1)], { filter: 'attack' }),
  ]),
  a('rare', 'gemini', 'Sigil of Twins', 'power', 3, 'none', [on('turnStart', [draw(1), stars(1)])]),
  a('uncommon', 'lumen-trap', 'Arcana Trap', 'snare', 1, 'none', [stars(2), dmg(6, 'allFoes')], {
    trigger: { on: 'foeTurn' },
  }),
  a('uncommon', 'star-chart', 'Spellbook', 'power', 1, 'none', [on('discard', [stars(1)])]),
  a('uncommon', 'chart-the-orbit', 'Ley Line', 'skill', 1, 'none', [
    manaNext(2),
    forge('starforged-blade', 1),
  ]),
  a('legendary', 'the-sovereigns-crown', 'The Obsidian Crown', 'power', 2, 'none', [
    forge('starforged-blade', 8),
    on('turnStart', [forge('starforged-blade', 3), stars(2)]),
  ]),
  a(
    'legendary',
    'birth-of-a-star',
    "Volcano's Birth",
    'skill',
    2,
    'none',
    [stars(8), draw(3), barrier(20)],
    { exhaust: true },
  ),
  a(
    'uncommon',
    'star-borrowed',
    'Borrowed Power',
    'skill',
    0,
    'none',
    [mana(2), manaNext(-1), stars(1)],
    { exhaust: true },
  ),
  // (more Sigils)
  a('rare', 'dawn-engine', 'Furnace Engine', 'power', 2, 'none', [
    on('turnStart', [stars(2), barrier(3)]),
  ]),
  a('rare', 'pillar-of-light', 'Pillar of Glass', 'power', 1, 'none', [
    on('created', [barrier(4)]),
  ]),
  a('rare', 'orrery', 'Sigil of Echoes', 'power', 3, 'none', [on('play', [stars(1)])]),

  // --- more Blade (batch 3) ---
  a('common', 'quenching-strike', 'Quenching Strike', 'attack', 1, 'foe', [
    dmg(5, 'target', 2),
    forge('starforged-blade', 2),
  ]),
  a(
    'common',
    'grindstone',
    'Grindstone',
    'skill',
    0,
    'none',
    [forge('starforged-blade', 2), draw(1)],
    { exhaust: true },
  ),
  a('uncommon', 'blade-oath', 'Blade Oath', 'skill', 1, 'none', [
    addTo('starforged-blade'),
    status('might', 1),
  ]),
  a('uncommon', 'sparring-partner', 'Sparring Partner', 'power', 2, 'none', [
    on('play', [draw(1)], { tag: 'blade' }),
  ]),
  a('rare', 'kingsbane', 'Kingsbane', 'attack', 3, 'foe', [
    dmg(8, 'target', 3),
    forge('starforged-blade', 4),
  ]),
  a(
    'rare',
    'starforged-legion',
    'Obsidian Legion',
    'skill',
    2,
    'none',
    [addTo('starforged-blade', 3)],
    {
      exhaust: true,
    },
  ),

  // --- more Arcana (batch 3) ---
  a('common', 'pale-beacon', 'Pale Ward', 'skill', 1, 'none', [barrier(5), scry(2), stars(1)]),
  a('common', 'lodestar-strike', 'Ley Strike', 'attack', 1, 'foe', [
    scaled(dmg(4), per('stars', 1)),
  ]),
  a('common', 'wishing-star', 'Wishing Well', 'skill', 0, 'none', [stars(2), manaNext(-1)]),
  a('common', 'stellar-wind', 'Ash Wind', 'skill', 1, 'none', [draw(2), stars(1), discard(1)]),
  a('uncommon', 'meteor-shower', 'Shard Shower', 'attack', 2, 'none', [
    dmg(5, 'allFoes', 3),
    stars(1),
  ]),
  a(
    'rare',
    'event-horizon',
    'Fault Line',
    'attack',
    2,
    'foe',
    [dmg(20), status('exposed', 2, 'target'), status('faltering', 2, 'target')],
    { starCost: 2 },
  ),
  a('rare', 'zenith', 'Zenith', 'attack', 1, 'foe', [scaled(dmg(0), per('stars', 3))]),

  // --- more Sigils (batch 3) ---
  a('uncommon', 'perseus', 'Sigil of Spite', 'power', 2, 'none', [
    on('play', [dmg(4, 'randomFoe')], { filter: 'attack' }),
  ]),
  a('uncommon', 'pleiades', 'Sigil of Shelter', 'power', 1, 'none', [
    on('turnStart', [barrier(4), draw(1)]),
  ]),
  a('uncommon', 'polaris', 'Sigil of Ash', 'power', 1, 'none', [on('exhaust', [stars(1)])]),
  a('uncommon', 'vega', 'Sigil of Ruin', 'power', 1, 'none', [
    on('discard', [dmg(4, 'randomFoe')]),
  ]),
  a('rare', 'andromeda', 'Sigil of the Storm', 'power', 2, 'none', [
    on('turnEnd', [scaled(dmg(0, 'allFoes'), per('stars', 0.5))]),
  ]),
  a('rare', 'sirius', 'Sigil of the Pyre', 'power', 3, 'none', [
    on('turnStart', [mana(1), forge('starforged-blade', 2)]),
  ]),
];
