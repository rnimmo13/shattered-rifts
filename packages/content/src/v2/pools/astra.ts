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
  on,
  per,
  pool,
  scaled,
  scry,
  stars,
  status,
} from '../build';

const a = pool('astra', 'starfall');

export const ASTRA: CardDef[] = [
  // --- basics and the token ---
  a('basic', 'meteor-jab', 'Meteor Jab', 'attack', 1, 'foe', [dmg(6), stars(1)]),
  a('basic', 'gather-light', 'Gather Light', 'skill', 1, 'none', [stars(2)], { innate: true }),
  a('basic', 'lumen-bolt', 'Lumen Bolt', 'attack', 1, 'foe', [dmg(12)], {
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
    [scaled(dmg(6), per('bonus'))],
    { retain: true, tags: ['blade'], source: 'token' },
  ),

  // --- Blade ---
  a('common', 'hone', 'Hone', 'skill', 1, 'none', [forge('starforged-blade', 3)]),
  a('common', 'honed-strike', 'Honed Strike', 'attack', 1, 'foe', [dmg(6), forge('starforged-blade', 2)]),
  a('common', 'blade-ward', 'Blade Ward', 'skill', 1, 'none', [barrier(5), forge('starforged-blade', 1)]),
  a('common', 'whetstone', 'Whetstone', 'skill', 0, 'none', [forge('starforged-blade', 4)], {
    exhaust: true,
  }),
  a('uncommon', 'crown-strike', 'Crown Strike', 'attack', 1, 'foe', [dmg(7), forge('starforged-blade', 1)]),
  a('uncommon', 'edgewise', 'Edgewise', 'skill', 1, 'none', [barrier(7), forge('starforged-blade', 2)]),
  a('uncommon', 'royal-decree', 'Royal Decree', 'skill', 2, 'none', [forge('starforged-blade', 5), draw(1)]),
  a('uncommon', 'knights-oath', "Knight's Oath", 'power', 1, 'none', [
    on('play', [stars(1)], { tag: 'blade' }),
  ]),
  a('rare', 'ever-sharpening', 'Ever-Sharpening', 'power', 2, 'none', [
    on('turnStart', [forge('starforged-blade', 2)]),
  ]),

  // --- Stars ---
  a('common', 'stargaze', 'Stargaze', 'skill', 0, 'none', [stars(1), draw(1)], { exhaust: true }),
  a('common', 'starshield', 'Starshield', 'skill', 1, 'none', [barrier(6), stars(1)]),
  a('common', 'ray-of-light', 'Ray of Light', 'attack', 1, 'foe', [dmg(8)]),
  a('common', 'gleam', 'Gleam', 'attack', 1, 'foe', [dmg(7), scry(2)]),
  a('common', 'skybolt', 'Skybolt', 'attack', 1, 'foe', [dmg(15)], { starCost: 1 }),
  a('common', 'star-barrier', 'Star Barrier', 'skill', 1, 'none', [barrier(14)], { starCost: 1 }),
  a('uncommon', 'nova', 'Nova', 'attack', 2, 'foe', [dmg(24)], { starCost: 2 }),
  a('uncommon', 'falling-sky', 'Falling Sky', 'attack', 1, 'none', [dmg(8, 'allFoes', 2)], {
    starCost: 3,
  }),
  a('uncommon', 'solar-flare', 'Solar Flare', 'attack', 1, 'none', [
    dmg(12, 'allFoes'),
    status('exposed', 1, 'allFoes'),
  ], { starCost: 2 }),
  a('uncommon', 'orbit', 'Orbit', 'skill', 1, 'none', [stars(1), forge('starforged-blade', 1), draw(1)]),
  a('uncommon', 'cosmic-lance', 'Cosmic Lance', 'attack', 2, 'foe', [dmg(12), stars(1)]),
  a('uncommon', 'gravity-well', 'Gravity Well', 'skill', 1, 'foe', [
    status('exposed', 2, 'target'),
    stars(1),
  ]),
  a('uncommon', 'eclipse', 'Eclipse', 'skill', 2, 'none', [
    barrier(10),
    status('faltering', 1, 'allFoes'),
  ]),
  a('uncommon', 'starlight', 'Starlight', 'skill', 1, 'none', [stars(3)], { exhaust: true }),
  a('rare', 'supernova', 'Supernova', 'attack', 3, 'foe', [dmg(45), status('exposed', 2, 'target')], {
    starCost: 4,
  }),
  a('rare', 'dawn-of-stars', 'Dawn of Stars', 'skill', 2, 'none', [stars(5), draw(2)], {
    exhaust: true,
  }),

  // --- Constellations ---
  a('uncommon', 'orion', 'Orion', 'power', 2, 'none', [on('turnStart', [stars(1)])]),
  a('uncommon', 'lyra', 'Lyra', 'power', 1, 'none', [on('turnEnd', [scaled(barrier(0), per('stars'))])]),
  a('uncommon', 'draco', 'Draco', 'power', 2, 'none', [on('turnStart', [dmg(3, 'allFoes')])]),
  a('uncommon', 'cygnus', 'Cygnus', 'power', 1, 'none', [on('play', [barrier(2)], { filter: 'skill' })]),
  a('uncommon', 'ursa', 'Ursa', 'power', 1, 'none', [on('turnEnd', [barrier(3)])]),
  a('rare', 'cassiopeia', 'Cassiopeia', 'power', 2, 'none', [on('play', [stars(1)], { filter: 'attack' })]),
  a('rare', 'gemini', 'Gemini', 'power', 3, 'none', [on('turnStart', [draw(1), stars(1)])]),
  a('uncommon', 'lumen-trap', 'Lumen Trap', 'snare', 1, 'none', [stars(2), dmg(6, 'allFoes')], {
    trigger: { on: 'foeTurn' },
  }),
];
