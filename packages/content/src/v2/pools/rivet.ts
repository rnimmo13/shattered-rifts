// Rivet (Nexus-9). Builds an army of machines (max 3 allies). Three lanes:
//   Swarm     - cheap bodies, recycling them, and payoffs for how many allies you have
//   Assemble  - make allies act again: burst turns
//   Core      - a few big constructs, Might and repairs on them

import type { CardDef } from '@sr/combat';
import {
  ACT,
  barrier,
  dmg,
  draw,
  heal,
  mana,
  manaNext,
  on,
  per,
  pool,
  sacrifice,
  scaled,
  status,
  summon,
} from '../build';

const r = pool('rivet', 'nexus');

export const RIVET: CardDef[] = [
  // --- basics ---
  r('basic', 'deploy-drone', 'Deploy Drone', 'summon', 1, 'none', [summon('patrol-drone')]),
  r('basic', 'overclock', 'Overclock', 'skill', 1, 'none', [status('might', 1, 'allFriends')]),

  // --- Swarm ---
  r('common', 'spare-parts', 'Spare Parts', 'summon', 0, 'none', [summon('micro-drone')], {
    exhaust: true,
  }),
  r('common', 'formation-strike', 'Formation Strike', 'attack', 1, 'foe', [
    scaled(dmg(2), per('allies', 4)),
  ]),
  r('common', 'salvage-bot', 'Salvage Bot', 'summon', 1, 'none', [summon('salvage-bot')]),
  r('common', 'call-turret', 'Call Turret', 'summon', 1, 'none', [summon('sentry-turret')]),
  r('common', 'scrap-volley', 'Scrap Volley', 'attack', 1, 'none', [dmg(4, 'randomFoe', 2)]),
  r('uncommon', 'swarm-protocol', 'Swarm Protocol', 'summon', 2, 'none', [
    summon('patrol-drone'),
    summon('patrol-drone'),
  ]),
  r('uncommon', 'recycle', 'Recycle', 'skill', 0, 'ally', [
    scaled(barrier(0), per('hp', 1, 'target')),
    draw(1),
    sacrifice,
  ]),
  r('uncommon', 'overcharge-blast', 'Overcharge Blast', 'attack', 2, 'none', [
    scaled(dmg(8, 'allFoes'), per('allies', 2)),
  ]),
  r('uncommon', 'assembly-line', 'Assembly Line', 'power', 2, 'none', [
    on('turnStart', [summon('micro-drone')]),
  ]),
  r('rare', 'legion', 'Legion', 'power', 2, 'none', [
    on('summon', [status('might', 1, 'allFriends')]),
  ]),

  r('common', 'drone-barrage', 'Drone Barrage', 'attack', 1, 'foe', [
    scaled(dmg(3), per('allies', 2)),
  ]),
  r('uncommon', 'parts-bin', 'Parts Bin', 'skill', 1, 'none', [summon('micro-drone'), draw(1)]),

  // --- Assemble ---
  r('common', 'ping', 'Ping', 'skill', 0, 'none', [ACT], { exhaust: true }),
  r('common', 'jumpstart', 'Jumpstart', 'skill', 1, 'none', [ACT, barrier(4)]),
  r(
    'common',
    'countermeasure-grid',
    'Countermeasure Grid',
    'snare',
    1,
    'none',
    [dmg(5, 'attacker'), barrier(5)],
    { trigger: { on: 'attacked' } },
  ),
  r('uncommon', 'assemble', 'Assemble', 'skill', 1, 'none', [ACT, draw(1)]),
  r('uncommon', 'double-time', 'Double Time', 'skill', 2, 'none', [ACT, ACT]),
  r('uncommon', 'overdrive', 'Overdrive', 'skill', 2, 'none', [
    status('might', 1, 'allFriends'),
    ACT,
  ]),
  r('uncommon', 'emp', 'EMP', 'snare', 1, 'none', [status('stunned', 1, 'attacker')], {
    trigger: { on: 'attacked' },
  }),
  r('rare', 'perpetual-motion', 'Perpetual Motion', 'power', 3, 'none', [on('turnStart', [ACT])]),

  r('common', 'sync-pulse', 'Sync Pulse', 'skill', 1, 'none', [ACT, heal(3, 'allFriends')]),
  r('common', 'relay-strike', 'Relay Strike', 'attack', 1, 'foe', [dmg(6), ACT]),
  r('uncommon', 'overwatch', 'Overwatch', 'snare', 1, 'none', [ACT, dmg(6, 'attacker')], {
    trigger: { on: 'attacked' },
  }),
  r(
    'rare',
    'grand-assembly',
    'Grand Assembly',
    'skill',
    2,
    'none',
    [ACT, ACT, status('might', 1, 'allFriends')],
    { exhaust: true },
  ),

  // --- Core ---
  r('common', 'repair-bot', 'Repair Bot', 'summon', 1, 'none', [summon('repair-bot')]),
  r('common', 'build-enforcer', 'Build Enforcer', 'summon', 2, 'none', [summon('enforcer')]),
  r('common', 'reinforce', 'Reinforce', 'skill', 1, 'ally', [
    barrier(8, 'target'),
    status('might', 2, 'target'),
  ]),
  r('uncommon', 'upgrade-chip', 'Upgrade Chip', 'skill', 1, 'ally', [
    status('might', 2, 'target'),
    heal(6, 'target'),
  ]),
  r('uncommon', 'siege-engine', 'Siege Engine', 'summon', 2, 'none', [summon('siege-engine')]),
  r('rare', 'war-engine', 'War Engine', 'summon', 3, 'none', [summon('war-engine')]),
  r('rare', 'reactor', 'Reactor', 'power', 2, 'none', [status('might', 3, 'allFriends')]),
  r('rare', 'overclock-core', 'Overclock Core', 'power', 3, 'none', [
    on('turnStart', [status('might', 1, 'allFriends')]),
  ]),

  r('common', 'weld-armor', 'Weld Armor', 'skill', 1, 'ally', [
    barrier(10, 'target'),
    heal(4, 'target'),
  ]),
  r('uncommon', 'heavy-plating', 'Heavy Plating', 'power', 1, 'none', [
    on('summon', [barrier(5, 'allFriends')]),
  ]),
  r('uncommon', 'retrofit', 'Retrofit', 'skill', 1, 'ally', [status('might', 3, 'target')]),
  r('rare', 'forge-titan', 'Forge Titan', 'summon', 3, 'none', [
    summon('war-engine'),
    status('might', 1, 'allFriends'),
  ]),

  // --- shared tools ---
  r('common', 'recompile', 'Recompile', 'skill', 1, 'none', [heal(4, 'allFriends')]),
  r('common', 'static-field', 'Static Field', 'attack', 1, 'none', [
    dmg(3, 'allFoes'),
    status('faltering', 1, 'allFoes'),
  ]),
  r('common', 'plating', 'Plating', 'skill', 1, 'none', [barrier(6, 'allFriends')]),
  r('common', 'arc-welder', 'Arc Welder', 'attack', 1, 'foe', [
    dmg(7),
    status('faltering', 1, 'target'),
  ]),
  r('common', 'ion-lance', 'Ion Lance', 'attack', 2, 'foe', [dmg(16)]),
  r('rare', 'railgun', 'Railgun', 'attack', 3, 'foe', [dmg(30)]),
  r('legendary', 'foundry-awakens', 'The Foundry Awakens', 'power', 3, 'none', [
    on('turnStart', [summon('siege-engine'), ACT]),
  ]),
  r(
    'legendary',
    'overclocked-legion',
    'Overclocked Legion',
    'skill',
    2,
    'none',
    [status('might', 3, 'allFriends'), ACT, ACT],
    { exhaust: true },
  ),
  r('uncommon', 'overcharge', 'Overcharge', 'skill', 0, 'none', [mana(2), manaNext(-1)], {
    exhaust: true,
  }),
];
