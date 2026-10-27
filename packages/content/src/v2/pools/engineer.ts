// Rivet (Nexus-9). Builds an army of machines (max 3 allies). Three build paths:
//   Swarm     - cheap bodies, recycling them, and payoffs for how many allies you have
//   Assemble  - make allies act again: burst turns
//   Core      - a few big constructs, Might and repairs on them

import type { CardDef } from '@sr/combat';
import {
  growHp,
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
  revive,
  discoverOp,
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
  r('uncommon', 'call-turret', 'Call Turret', 'summon', 1, 'none', [summon('sentry-turret')]),
  r('common', 'recycle', 'Strip for Parts', 'skill', 0, 'ally', [
    scaled(barrier(0), per('hp', 1, 'target')),
    draw(1),
    sacrifice,
  ]),
  r('uncommon', 'overcharge-blast', 'Overcharge Blast', 'attack', 2, 'none', [
    scaled(dmg(8, 'allFoes'), per('allies', 2)),
  ]),
  r('rare', 'legion', 'Legion', 'power', 2, 'none', [
    on('summon', [status('might', 1, 'allFriends')]),
  ]),

  r('uncommon', 'parts-bin', 'Parts Bin', 'skill', 1, 'none', [summon('micro-drone'), draw(1)]),

  // (more Swarm)
  r(
    'uncommon',
    'nanoswarm',
    'Nanoswarm',
    'skill',
    1,
    'none',
    [summon('micro-drone'), summon('micro-drone'), summon('micro-drone')],
    { exhaust: true },
  ),
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
  r('rare', 'swarm-tactics', 'Swarm Tactics', 'power', 1, 'none', [
    on('summon', [dmg(3, 'randomFoe')]),
  ]),
  r('uncommon', 'detonate', 'Detonate', 'skill', 0, 'ally', [dmg(10, 'allFoes'), sacrifice]),
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

  // (even more Swarm)
  r('common', 'breach-charge', 'Breach Charge', 'attack', 1, 'foe', [
    dmg(5),
    summon('micro-drone'),
  ]),
  r('rare', 'mob-rule', 'Mob Rule', 'attack', 2, 'none', [
    scaled(dmg(5, 'allFoes'), per('allies', 3)),
  ]),
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
  r('rare', 'double-time', 'Double Time', 'skill', 2, 'none', [ACT, ACT]),
  r('uncommon', 'overdrive', 'Overdrive', 'skill', 1, 'none', [
    status('might', 1, 'allFriends'),
    ACT,
  ]),
  r('rare', 'emp', 'EMP', 'snare', 1, 'none', [status('stunned', 1, 'attacker')], {
    trigger: { on: 'attacked' },
  }),
  r('rare', 'perpetual-motion', 'Perpetual Motion', 'power', 2, 'none', [on('turnStart', [ACT])]),

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
  r('rare', 'chain-reaction', 'Chain Reaction', 'skill', 2, 'none', [ACT, ACT, draw(1)]),
  r('rare', 'command-chip', 'Command Chip', 'power', 3, 'none', [
    on('play', [ACT], { filter: 'summon' }),
  ]),

  // (even more Assemble)
  r('common', 'tandem-strike', 'Tandem Strike', 'attack', 1, 'foe', [
    scaled(dmg(3), per('played', 2)),
  ]),
  r('uncommon', 'arc-relay', 'Arc Relay', 'attack', 2, 'none', [dmg(5, 'allFoes'), ACT]),
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

  // --- Core ---
  r('common', 'repair-bot', 'Repair Bot', 'summon', 1, 'none', [summon('repair-bot')]),
  r('common', 'build-enforcer', 'Build Enforcer', 'summon', 2, 'none', [summon('enforcer')]),
  r('uncommon', 'reinforce', 'Reinforce', 'skill', 1, 'ally', [
    barrier(8, 'target'),
    status('might', 2, 'target'),
  ]),
  r('uncommon', 'upgrade-chip', 'Upgrade Chip', 'skill', 1, 'ally', [
    status('might', 2, 'target'),
    growHp(6, 'target'),
  ]),
  r('rare', 'siege-engine', 'Siege Engine', 'summon', 2, 'none', [summon('siege-engine')]),
  r('rare', 'war-engine', 'War Engine', 'summon', 3, 'none', [summon('war-engine')]),
  r('rare', 'reactor', 'Reactor', 'power', 2, 'none', [status('might', 3, 'allFriends')]),
  r('rare', 'overclock-core', 'Overclock Core', 'power', 3, 'none', [
    on('turnStart', [status('might', 1, 'allFriends')]),
  ]),

  // (a drone that grows instead of only being shielded: DECISIONS #285)
  r('uncommon', 'weld-armor', 'Weld Armor', 'skill', 1, 'ally', [
    growHp(6, 'target'),
    barrier(6, 'target'),
  ]),
  r('common', 'heavy-plating', 'Heavy Plating', 'power', 1, 'none', [
    on('summon', [barrier(5, 'allFriends')]),
  ]),
  r('common', 'retrofit', 'Retrofit', 'skill', 1, 'ally', [status('might', 3, 'target')]),

  // (more Core)
  r('uncommon', 'bulwark-frame', 'Bulwark Frame', 'skill', 1, 'ally', [barrier(14, 'target')]),
  r(
    'rare',
    'reactor-meltdown',
    'Reactor Meltdown',
    'skill',
    0,
    'ally',
    // the bigger the construct you give up, the bigger the blast (DECISIONS #358)
    [scaled(dmg(0, 'allFoes'), per('hp', 1, 'target')), sacrifice],
    { exhaust: true },
  ),
  r('uncommon', 'rebuild', 'Rebuild', 'skill', 1, 'none', [revive, barrier(6)], { exhaust: true }),
  r('rare', 'heavy-industry', 'Heavy Industry', 'power', 2, 'none', [
    on('turnStart', [barrier(4, 'allFriends')]),
  ]),

  // (even more Core)
  r('common', 'armor-piercer', 'Armor Piercer', 'attack', 1, 'foe', [
    dmg(6),
    status('exposed', 1, 'target'),
  ]),
  r('uncommon', 'siege-protocol', 'Siege Protocol', 'attack', 2, 'foe', [
    scaled(dmg(6), per('might', 2)),
  ]),
  r(
    'uncommon',
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
  r('common', 'static-field', 'Static Field', 'attack', 1, 'none', [
    dmg(3, 'allFoes'),
    status('faltering', 1, 'allFoes'),
  ]),
  r('common', 'plating', 'Plating', 'skill', 1, 'none', [barrier(6, 'allFriends')]),
  r('uncommon', 'ion-lance', 'Ion Lance', 'attack', 2, 'foe', [dmg(16)]),
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

  // --- brought back (DECISIONS #337) ---
  r('common', 'sync-pulse', 'Sync Pulse', 'skill', 1, 'none', [ACT, heal(3, 'allFriends')]),
  r('rare', 'overload', 'Overload', 'skill', 2, 'none', [ACT, ACT, ACT], { exhaust: true }),
  r('common', 'hardened-chassis', 'Hardened Chassis', 'skill', 1, 'ally', [
    barrier(9, 'target'),
    draw(1),
  ]),

  // --- more glue: uncommons and rares for any build path (DECISIONS #339) ---
  r('rare', 'factory-floor', 'Factory Floor', 'power', 2, 'none', [on('summon', [draw(1)])]),
  r('uncommon', 'blueprint', 'Blueprint', 'skill', 1, 'none', [discoverOp('summon', 1, false)]),

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  r('uncommon', 'salvage-rights', 'Salvage Rights', 'power', 1, 'none', [
    on('allyDies', [draw(1)]),
  ]),
  r('uncommon', 'scrapyard-king', 'Scrapyard King', 'power', 2, 'none', [
    on('allyDies', [status('might', 1, 'allFriends')]),
  ]),
  r('uncommon', 'echo-command', 'Echo Command', 'skill', 1, 'none', [ACT, ACT, manaNext(-1)], {
    exhaust: true,
    retain: true,
  }),
  r('uncommon', 'resonant-pulse', 'Resonant Pulse', 'power', 1, 'none', [
    on('play', [heal(1, 'allFriends')], { filter: 'skill' }),
  ]),
  r('uncommon', 'self-repair', 'Self-Mending', 'power', 1, 'none', [
    on('turnStart', [heal(2, 'allFriends')]),
  ]),
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

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  r('uncommon', 'patch-job', 'Patch Job', 'skill', 0, 'ally', [
    growHp(8, 'target'),
    barrier(3, 'target'),
  ]),
  r('rare', 'relay-network', 'Relay Network', 'power', 2, 'none', [on('snare', [ACT])]),

  // --- Core: one big construct, built up and cashed in (DECISIONS #358) ---
  r('common', 'crankshaft', 'Crankshaft', 'attack', 1, 'foe', [scaled(dmg(4), per('biggestAlly', 1 / 4))]),
  r('common', 'reinforced-frame', 'Reinforced Frame', 'skill', 1, 'ally', [growHp(5, 'target'), draw(1)]),
  r('rare', 'heavy-hitter', 'Heavy Hitter', 'attack', 2, 'foe', [scaled(dmg(0), per('biggestAlly'))]),
];
