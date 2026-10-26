// Rivet (Nexus-9). Builds an army of machines (max 3 allies). Three build paths:
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
  lose,
  mana,
  manaNext,
  on,
  per,
  pool,
  sacrifice,
  scaled,
  status,
  summon,
  discoverOp,
  revive,
} from '../build';

const r = pool('engineer', 'nexus');

export const ENGINEER: CardDef[] = [
  // --- basics ---
  r('basic', 'deploy-drone', 'Deploy Drone', 'summon', 1, 'none', [summon('patrol-drone')]),
  r('basic', 'overclock', 'Tune-Up', 'skill', 1, 'none', [status('might', 1, 'allFriends')]),

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
  r('uncommon', 'recycle', 'Strip for Parts', 'skill', 0, 'ally', [
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

  // (more Swarm)
  r(
    'common',
    'nanoswarm',
    'Nanoswarm',
    'skill',
    1,
    'none',
    [summon('micro-drone'), summon('micro-drone'), summon('micro-drone')],
    { exhaust: true },
  ),
  r('common', 'scrap-storm', 'Scrap Storm', 'attack', 1, 'none', [
    scaled(dmg(2, 'allFoes'), per('allies', 1)),
  ]),
  r(
    'uncommon',
    'scrap-heap',
    'Scrap Heap',
    'skill',
    1,
    'none',
    [summon('micro-drone'), summon('micro-drone')],
    { exhaust: true },
  ),
  r('uncommon', 'swarm-tactics', 'Swarm Tactics', 'power', 1, 'none', [
    on('summon', [dmg(3, 'randomFoe')]),
  ]),
  r('uncommon', 'salvage-rights', 'Salvage Rights', 'power', 1, 'none', [
    on('allyDies', [draw(1)]),
  ]),
  r('uncommon', 'detonate', 'Detonate', 'skill', 0, 'ally', [dmg(10, 'allFoes'), sacrifice]),
  r('uncommon', 'blueprint', 'Blueprint', 'skill', 1, 'none', [discoverOp('summon', 1, false)]),
  r('rare', 'hive-mind', 'Hive Mind', 'power', 2, 'none', [
    on('allyDies', [draw(1), summon('micro-drone')]),
  ]),
  r('rare', 'mass-production', 'Mass Production', 'power', 3, 'none', [
    on('turnStart', [summon('patrol-drone')]),
  ]),
  r(
    'rare',
    'drone-carrier',
    'Drone Carrier',
    'summon',
    3,
    'none',
    [summon('patrol-drone'), summon('patrol-drone'), summon('patrol-drone')],
    { exhaust: true },
  ),
  r('rare', 'factory-floor', 'Factory Floor', 'power', 2, 'none', [on('summon', [draw(1)])]),

  // (even more Swarm)
  r('common', 'scrap-rush', 'Scrap Rush', 'attack', 0, 'foe', [scaled(dmg(1), per('allies', 3))]),
  r('common', 'breach-charge', 'Breach Charge', 'attack', 1, 'foe', [
    dmg(5),
    summon('micro-drone'),
  ]),
  r('common', 'rapid-prototype', 'Rapid Prototype', 'summon', 0, 'none', [summon('micro-drone')], {
    ethereal: true,
    exhaust: true,
  }),
  r('uncommon', 'mob-rule', 'Mob Rule', 'attack', 2, 'none', [
    scaled(dmg(5, 'allFoes'), per('allies', 3)),
  ]),
  r('uncommon', 'cannibalise', 'Cannibalise', 'skill', 1, 'ally', [mana(1), draw(1), sacrifice]),
  r(
    'uncommon',
    'drone-ambush',
    'Drone Ambush',
    'snare',
    1,
    'none',
    [dmg(4, 'allFoes'), summon('micro-drone')],
    { trigger: { on: 'foeTurn' } },
  ),
  r(
    'rare',
    'swarm-surge',
    'Swarm Surge',
    'skill',
    2,
    'none',
    [summon('patrol-drone'), scaled(draw(0), per('allies', 1))],
    { exhaust: true },
  ),
  r('rare', 'scrapyard-king', 'Scrapyard King', 'power', 2, 'none', [
    on('allyDies', [status('might', 1, 'allFriends')]),
  ]),

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
  r('uncommon', 'overdrive', 'Overdrive', 'skill', 1, 'none', [
    status('might', 1, 'allFriends'),
    ACT,
  ]),
  r('uncommon', 'emp', 'EMP', 'snare', 1, 'none', [status('stunned', 1, 'attacker')], {
    trigger: { on: 'attacked' },
  }),
  r('rare', 'perpetual-motion', 'Perpetual Motion', 'power', 2, 'none', [on('turnStart', [ACT])]),

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

  // (more Assemble)
  r('uncommon', 'link-up', 'Link Up', 'skill', 1, 'none', [ACT, barrier(4, 'allFriends')]),
  r('uncommon', 'synchronise', 'Synchronise', 'skill', 1, 'none', [
    ACT,
    status('might', 1, 'allFriends'),
  ]),
  r('uncommon', 'resonant-pulse', 'Resonant Pulse', 'power', 1, 'none', [
    on('play', [heal(1, 'allFriends')], { filter: 'skill' }),
  ]),
  r('rare', 'overload', 'Overload', 'skill', 2, 'none', [ACT, ACT, ACT], { exhaust: true }),
  r('rare', 'chain-reaction', 'Chain Reaction', 'skill', 2, 'none', [ACT, ACT, draw(1)]),
  r('rare', 'command-chip', 'Command Chip', 'power', 3, 'none', [
    on('play', [ACT], { filter: 'summon' }),
  ]),

  // (even more Assemble)
  r('common', 'tandem-strike', 'Tandem Strike', 'attack', 1, 'foe', [
    scaled(dmg(3), per('played', 2)),
  ]),
  r('uncommon', 'arc-relay', 'Arc Relay', 'attack', 2, 'none', [dmg(5, 'allFoes'), ACT]),
  r('uncommon', 'overtime', 'Overtime', 'skill', 0, 'none', [ACT, lose(3)], { exhaust: true }),
  r('uncommon', 'clockwork-snare', 'Clockwork Trap', 'snare', 1, 'none', [ACT, barrier(8)], {
    trigger: { on: 'hpLost', min: 5 },
  }),
  r(
    'uncommon',
    'surge-protocol',
    'Surge Protocol',
    'skill',
    0,
    'none',
    [scaled(status('might', 0, 'allFriends'), per('x')), ACT],
    { x: true },
  ),
  r('rare', 'relay-network', 'Relay Network', 'power', 2, 'none', [on('snare', [ACT])]),
  r('rare', 'echo-command', 'Echo Command', 'skill', 1, 'none', [ACT, ACT, manaNext(-1)], {
    exhaust: true,
    retain: true,
  }),

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

  // (more Core)
  r('common', 'patch-job', 'Patch Job', 'skill', 0, 'ally', [
    heal(8, 'target'),
    barrier(3, 'target'),
  ]),
  r('uncommon', 'bulwark-frame', 'Bulwark Frame', 'skill', 1, 'ally', [barrier(14, 'target')]),
  r('uncommon', 'self-repair', 'Self-Mending', 'power', 1, 'none', [
    on('turnStart', [heal(2, 'allFriends')]),
  ]),
  r(
    'rare',
    'reactor-meltdown',
    'Reactor Meltdown',
    'skill',
    0,
    'ally',
    [dmg(25, 'allFoes'), sacrifice],
    { exhaust: true },
  ),
  r('rare', 'rebuild', 'Rebuild', 'skill', 1, 'none', [revive, barrier(6)], { exhaust: true }),
  r('rare', 'heavy-industry', 'Heavy Industry', 'power', 2, 'none', [
    on('turnStart', [barrier(4, 'allFriends')]),
  ]),

  // (even more Core)
  r('common', 'hardened-chassis', 'Hardened Chassis', 'skill', 1, 'ally', [
    barrier(9, 'target'),
    draw(1),
  ]),
  r('common', 'field-engineer', 'Field Engineer', 'summon', 1, 'none', [
    summon('repair-bot'),
    barrier(3),
  ]),
  r('common', 'armor-piercer', 'Armor Piercer', 'attack', 1, 'foe', [
    dmg(6),
    status('exposed', 1, 'target'),
  ]),
  r('uncommon', 'calibrate', 'Calibrate', 'skill', 0, 'ally', [
    status('might', 1, 'target'),
    barrier(4, 'target'),
  ]),
  r('uncommon', 'siege-protocol', 'Siege Protocol', 'attack', 2, 'foe', [
    scaled(dmg(6), per('might', 2)),
  ]),
  r(
    'rare',
    'titan-forge',
    'Titan Forge',
    'summon',
    2,
    'none',
    [summon('enforcer'), status('might', 2, 'allFriends')],
    { exhaust: true },
  ),
  r('rare', 'backup-core', 'Backup Core', 'power', 2, 'none', [on('allyDies', [revive])]),

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
    { exhaust: true, up: { cost: 1, effects: [status('might', 4, 'allFriends'), ACT, ACT] } },
  ),
  r('uncommon', 'overcharge', 'Overcharge', 'skill', 0, 'none', [mana(2), manaNext(-1)], {
    exhaust: true,
  }),
];
