// Astra, the Starcaller (Starfall). A scholar of fallen stars. No companions. Starts with 2 Stars and a Sovereign Blade.
// Stars are a second resource: cards gain them and spend them, and they last the whole fight.
// The Sovereign Blade is one card that every Forge permanently sharpens (it Retains, so it waits for you).
// Three lanes:
//   Blade           - forge the Blade and swing it
//   Stars           - spend Stars on finishers
//   Constellations  - Powers that tick every turn

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
} from '../build';

const a = pool('astra', 'starfall');

export const ASTRA: CardDef[] = [
  // --- basics and the token ---
  a('basic', 'meteor-jab', 'Meteor Jab', 'attack', 1, 'foe', [dmg(7), stars(1)]),
  a('basic', 'gather-light', 'Gather Light', 'skill', 1, 'none', [stars(3)], { innate: true }),
  a('basic', 'lumen-bolt', 'Lumen Bolt', 'attack', 1, 'foe', [dmg(16)], {
    starCost: 1,
    innate: true,
  }),
  a(
    'common',
    'starforged-blade',
    'Starforged Blade',
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

  a('common', 'sunsteel', 'Sunsteel', 'attack', 1, 'foe', [dmg(8), forge('starforged-blade', 1)]),
  a('uncommon', 'astral-edge', 'Astral Edge', 'power', 1, 'none', [
    on('play', [forge('starforged-blade', 1)], { tag: 'blade' }),
  ]),
  a('rare', 'celestial-edge', 'Celestial Edge', 'attack', 2, 'foe', [
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
    'Big Bang',
    'skill',
    2,
    'none',
    [draw(1), mana(1), stars(2), forge('starforged-blade', 4)],
    { exhaust: true },
  ),
  a('rare', 'armory-of-light', 'Armory of Light', 'power', 2, 'none', [
    on('created', [status('might', 1)]),
  ]),
  a('rare', 'collapsing-star', 'Collapsing Star', 'attack', 2, 'foe', [
    scaled(dmg(5), per('created', 2)),
  ]),

  // --- Stars ---
  a('common', 'stargaze', 'Stargaze', 'skill', 0, 'none', [stars(1), draw(1)], { exhaust: true }),
  a('common', 'starshield', 'Starshield', 'skill', 1, 'none', [barrier(6), stars(1)]),
  a('common', 'ray-of-light', 'Ray of Light', 'attack', 1, 'foe', [dmg(9)]),
  a('common', 'gleam', 'Gleam', 'attack', 1, 'foe', [dmg(7), scry(2)]),
  a('common', 'skybolt', 'Skybolt', 'attack', 1, 'foe', [dmg(20)], { starCost: 1 }),
  a('common', 'star-barrier', 'Star Barrier', 'skill', 1, 'none', [barrier(16)], { starCost: 1 }),
  a('uncommon', 'nova', 'Nova', 'attack', 2, 'foe', [dmg(34)], { starCost: 2 }),
  a('uncommon', 'falling-sky', 'Falling Sky', 'attack', 1, 'none', [dmg(8, 'allFoes', 3)], {
    starCost: 3,
  }),
  a(
    'uncommon',
    'solar-flare',
    'Solar Flare',
    'attack',
    1,
    'none',
    [dmg(14, 'allFoes'), status('exposed', 1, 'allFoes')],
    { starCost: 2 },
  ),
  a('uncommon', 'orbit', 'Orbit', 'skill', 1, 'none', [
    stars(1),
    forge('starforged-blade', 1),
    draw(1),
  ]),
  a('uncommon', 'cosmic-lance', 'Cosmic Lance', 'attack', 2, 'foe', [dmg(14), stars(1)]),
  a('uncommon', 'gravity-well', 'Gravity Well', 'skill', 1, 'foe', [
    status('exposed', 2, 'target'),
    stars(1),
  ]),
  a('uncommon', 'eclipse', 'Eclipse', 'skill', 2, 'none', [
    barrier(10),
    status('faltering', 1, 'allFoes'),
  ]),
  a('uncommon', 'starlight', 'Starlight', 'skill', 1, 'none', [stars(3)], { exhaust: true }),
  a(
    'rare',
    'supernova',
    'Supernova',
    'attack',
    3,
    'foe',
    [dmg(54), status('exposed', 2, 'target')],
    {
      starCost: 4,
    },
  ),
  a('rare', 'dawn-of-stars', 'Dawn of Stars', 'skill', 2, 'none', [stars(5), draw(2)], {
    exhaust: true,
  }),

  // (more Lumen)
  a('common', 'faint-glow', 'Faint Glow', 'skill', 1, 'none', [stars(1), draw(1), drawNext(1)]),
  a('common', 'astral-pulse', 'Astral Pulse', 'attack', 1, 'none', [dmg(6, 'allFoes', 2)]),
  a('common', 'heavenly-might', 'Heavenly Might', 'attack', 2, 'foe', [dmg(6, 'target', 3)]),
  a('common', 'sunstrike', 'Sunstrike', 'attack', 1, 'foe', [dmg(9), stars(1)]),
  a('common', 'crushing-light', 'Crushing Light', 'attack', 2, 'none', [
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
  a('uncommon', 'radiance', 'Radiance', 'attack', 1, 'none', [
    scaled(dmg(3, 'allFoes'), per('stars', 1)),
  ]),
  a('uncommon', 'sovereign-strike', 'Sovereign Strike', 'attack', 2, 'foe', [dmg(15), manaNext(2)]),
  a('uncommon', 'devastate', 'Devastate', 'attack', 2, 'foe', [dmg(34)], { starCost: 2 }),
  a('rare', 'gamma-burst', 'Gamma Burst', 'attack', 2, 'foe', [
    dmg(13),
    status('faltering', 2, 'target'),
    status('exposed', 2, 'target'),
  ]),
  a('rare', 'killing-light', 'Killing Light', 'attack', 2, 'foe', [dmg(30)], { starCost: 3 }),
  a('rare', 'starburst', 'Starburst', 'skill', 1, 'none', [stars(6)], { exhaust: true }),
  a(
    'rare',
    'comet',
    'Comet',
    'attack',
    3,
    'foe',
    [dmg(33), status('faltering', 3, 'target'), status('exposed', 3, 'target')],
    { starCost: 3 },
  ),
  a(
    'rare',
    'dying-star',
    'Dying Star',
    'attack',
    1,
    'none',
    [dmg(10, 'allFoes'), status('faltering', 2, 'allFoes')],
    { ethereal: true },
  ),

  // --- Constellations ---
  a('uncommon', 'orion', 'Orion', 'power', 2, 'none', [on('turnStart', [stars(1)])]),
  a('uncommon', 'lyra', 'Lyra', 'power', 2, 'none', [
    on('turnEnd', [scaled(barrier(0), per('stars'))]),
  ]),
  a('uncommon', 'draco', 'Draco', 'power', 2, 'none', [on('turnStart', [dmg(3, 'allFoes')])]),
  a('uncommon', 'cygnus', 'Cygnus', 'power', 1, 'none', [
    on('play', [barrier(2)], { filter: 'skill' }),
  ]),
  a('uncommon', 'ursa', 'Ursa', 'power', 1, 'none', [on('turnEnd', [barrier(3)])]),
  a('rare', 'cassiopeia', 'Cassiopeia', 'power', 2, 'none', [
    on('play', [stars(1)], { filter: 'attack' }),
  ]),
  a('rare', 'gemini', 'Gemini', 'power', 3, 'none', [on('turnStart', [draw(1), stars(1)])]),
  a('uncommon', 'lumen-trap', 'Lumen Trap', 'snare', 1, 'none', [stars(2), dmg(6, 'allFoes')], {
    trigger: { on: 'foeTurn' },
  }),
  a('uncommon', 'star-chart', 'Star Chart', 'power', 1, 'none', [on('discard', [stars(1)])]),
  a('uncommon', 'chart-the-orbit', 'Chart the Orbit', 'skill', 1, 'none', [
    manaNext(2),
    forge('starforged-blade', 1),
  ]),
  a('legendary', 'the-sovereigns-crown', "The Sovereign's Crown", 'power', 2, 'none', [
    forge('starforged-blade', 8),
    on('turnStart', [forge('starforged-blade', 3), stars(1)]),
  ]),
  a(
    'legendary',
    'birth-of-a-star',
    'Birth of a Star',
    'skill',
    3,
    'none',
    [stars(8), draw(3), barrier(20)],
    { exhaust: true },
  ),
  a(
    'uncommon',
    'star-borrowed',
    'Borrowed Light',
    'skill',
    0,
    'none',
    [mana(2), manaNext(-1), stars(1)],
    { exhaust: true },
  ),
  // (more Constellations)
  a('rare', 'dawn-engine', 'Dawn Engine', 'power', 2, 'none', [
    on('turnStart', [stars(2), barrier(3)]),
  ]),
  a('rare', 'pillar-of-light', 'Pillar of Light', 'power', 1, 'none', [
    on('created', [barrier(4)]),
  ]),
  a('rare', 'orrery', 'Orrery', 'power', 3, 'none', [on('play', [stars(1)])]),
];
