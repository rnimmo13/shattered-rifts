// Rivet (Nexus-9). Builds machines in 3 companion slots: a Light machine takes 1, a Heavy 2, a Colossal all 3 (DECISIONS #383).
// Three themes:
//   Swarm     - go wide: cheap Light bodies, payoffs per ally, per summon and per death, sacrifice, Might for everyone (DECISIONS #358)
//   Assemble  - charge up with Primed (the Engineer's own guns too), then fire: only 4 cards make the companions act now (#361, #383)
//   Core      - go tall: one Heavy or Colossal machine you grow, protect and cash in (Repair Bot, Reactor, Heavy Plating are Swarm's,
//               by tools/src/paths.ts)
// Every number was priced with the card costing guide (docs/14_CARD_COSTING.md, DECISIONS #383); the reasons are in
// docs/ENGINEER_REVIEW.md.

import type { CardDef, Op } from '@sr/combat';
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
  seekTop,
} from '../build';

/** every companion's next strike hits harder: Primed (`vigor`) for each of them (DECISIONS #361) */
const prime = (n: number): Op => status('vigor', n, 'allAllies');
/** you and your companions charge up: the hero's Primed goes into the next Attack card (DECISIONS #383) */
const primeAll = (n: number): Op => status('vigor', n, 'allFriends');
const r = pool('engineer', 'nexus');

export const ENGINEER: CardDef[] = [
  // --- basics ---
  r('basic', 'deploy-drone', 'Deploy Drone', 'summon', 1, 'none', [summon('patrol-drone')]),
  r('basic', 'overclock', 'Tune-Up', 'skill', 1, 'none', [status('might', 1, 'allFriends')], {
    up: { effects: [status('might', 1, 'allFriends'), draw(1)] },
  }),
  // (a hit that keeps the crew a little safer: a third class basic, Robert 2026-10-30)
  r('basic', 'spot-weld', 'Spot Weld', 'attack', 1, 'foe', [dmg(5), barrier(2, 'allFriends')]),

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
    scaled(dmg(9, 'allFoes'), per('allies', 3)),
  ]),
  r(
    'rare',
    'legion',
    'Legion',
    'power',
    2,
    'none',
    [on('summon', [status('might', 1, 'allFriends')])],
    {
      up: { innate: true },
    },
  ),

  r('uncommon', 'parts-bin', 'Parts Bin', 'skill', 1, 'none', [summon('micro-drone'), draw(1)]),

  // (more Swarm)
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
  r(
    'uncommon',
    'swarm-tactics',
    'Swarm Tactics',
    'power',
    1,
    'none',
    [on('summon', [dmg(6, 'randomFoe')])],
    { up: { effects: [on('summon', [dmg(9, 'randomFoe')])] } },
  ),
  r('uncommon', 'detonate', 'Detonate', 'skill', 0, 'ally', [dmg(12, 'allFoes'), sacrifice]),
  r(
    'rare',
    'hive-mind',
    'Hive Mind',
    'power',
    1,
    'none',
    [on('allyDies', [draw(1), summon('micro-drone')])],
    { up: { innate: true } },
  ),
  r(
    'rare',
    'mass-production',
    'Mass Production',
    'power',
    3,
    'none',
    [on('turnStart', [summon('patrol-drone')])],
    // (a machine every turn is an engine, like Rolling Thunder's Shells: the upgrade is the cost; Patrol Drone+ was +64%, DECISIONS #396)
    { up: { cost: 2 } },
  ),
  r(
    'rare',
    'drone-carrier',
    'Drone Carrier',
    'summon',
    2,
    'none',
    [summon('patrol-drone'), summon('patrol-drone'), summon('patrol-drone')],
    { exhaust: true },
  ),

  // (even more Swarm)
  r(
    'common',
    'breach-charge',
    'Breach Charge',
    'attack',
    1,
    'foe',
    [dmg(3), summon('micro-drone')],
    { up: { effects: [dmg(6), summon('micro-drone')] } },
  ),
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
  // a Light drone that marks the front enemy for everything after it (DECISIONS #383)
  r('common', 'deploy-spotter', 'Deploy Spotter', 'summon', 1, 'none', [summon('spotter-drone')]),

  // --- Assemble ---
  r('common', 'ping', 'Ping', 'skill', 0, 'none', [primeAll(3)], { exhaust: true }),
  r('common', 'jumpstart', 'Jumpstart', 'skill', 1, 'none', [prime(3), barrier(4)], {
    up: { effects: [prime(3), barrier(7)] },
  }),
  r(
    'common',
    'countermeasure-grid',
    'Countermeasure Grid',
    'snare',
    1,
    'none',
    [dmg(5, 'attacker'), barrier(5)],
    { trigger: { on: 'attacked' }, up: { effects: [dmg(8, 'attacker'), barrier(5)] } },
  ),
  r('uncommon', 'assemble', 'Assemble', 'skill', 1, 'none', [ACT, draw(1)]),
  r('rare', 'double-time', 'Double Time', 'skill', 1, 'none', [primeAll(6)]),
  r(
    'uncommon',
    'overdrive',
    'Overdrive',
    'skill',
    1,
    'none',
    [status('might', 1, 'allFriends'), prime(2)],
    { up: { effects: [status('might', 1, 'allFriends'), prime(4)] } },
  ),
  r('rare', 'emp', 'EMP', 'snare', 1, 'none', [status('stunned', 1, 'attacker')], {
    trigger: { on: 'attacked' },
  }),
  r(
    'rare',
    'perpetual-motion',
    'Perpetual Motion',
    'power',
    1,
    'none',
    [on('turnStart', [primeAll(2)])],
    { up: { effects: [on('turnStart', [primeAll(3)])] } },
  ),

  r('common', 'relay-strike', 'Relay Strike', 'attack', 1, 'foe', [dmg(6), ACT]),
  r('uncommon', 'overwatch', 'Overwatch', 'snare', 1, 'none', [prime(4), dmg(7, 'attacker')], {
    trigger: { on: 'attacked' },
  }),
  r(
    'rare',
    'grand-assembly',
    'Grand Assembly',
    'skill',
    1,
    'none',
    [status('might', 2, 'allFriends')],
    { exhaust: true },
  ),

  // (more Assemble)
  r('uncommon', 'link-up', 'Link Up', 'skill', 1, 'none', [barrier(4, 'allFriends'), draw(1)], {
    up: { effects: [barrier(6, 'allFriends'), draw(1)] },
  }),
  r('rare', 'chain-reaction', 'Chain Reaction', 'skill', 1, 'none', [draw(2), prime(4)]),
  r('rare', 'command-chip', 'Command Chip', 'power', 3, 'none', [
    on('play', [ACT], { filter: 'summon' }),
  ]),

  // (even more Assemble)
  r('common', 'tandem-strike', 'Tandem Strike', 'attack', 1, 'foe', [
    scaled(dmg(4), per('played', 3)),
  ]),
  r('uncommon', 'arc-relay', 'Arc Relay', 'attack', 2, 'none', [dmg(9, 'allFoes'), primeAll(4)]),
  r('uncommon', 'clockwork-snare', 'Clockwork Trap', 'snare', 1, 'none', [prime(3), barrier(8)], {
    trigger: { on: 'hpLost', min: 5 },
  }),
  r(
    'uncommon',
    'surge-protocol',
    'Surge Protocol',
    'skill',
    0,
    'none',
    [scaled(status('might', 0, 'allFriends'), per('x'))],
    { x: true },
  ),
  // the Engineer's own guns: every shot charges the machines, and the burst fires them all (DECISIONS #383)
  r('common', 'pulse-pistol', 'Pulse Pistol', 'attack', 1, 'foe', [dmg(5, 'target', 2)]),
  r('uncommon', 'laser-grid', 'Laser Grid', 'attack', 2, 'none', [dmg(8, 'allFoes', 2)]),
  r(
    'uncommon',
    'targeting-uplink',
    'Targeting Uplink',
    'power',
    1,
    'none',
    [on('play', [prime(2)], { filter: 'attack' })],
    { up: { innate: true } },
  ),
  r('rare', 'full-salvo', 'Full Salvo', 'skill', 2, 'none', [primeAll(5), ACT]),

  // Ceiling cards (Robert, 2026-10-30: "he is just steady sustained damage, nothing game breaking"). Both are spent after one use and
  // read the board the deck builds, so a built-up crew or a pile of Might is worth far more than the sticker price (guard rails,
  // balance.test.ts: a consumed payoff may scale 3 per Might).
  // Full Throttle: the crew acts twice (Robert 2026-10-30: "a card or two with allies act twice"; the other act-now cards act once). 2 Mana
  // rare = ~24. Primed 3 (~4.5) + two rounds of acts (2 x ~8 at 1-2 companions) = ~20.5; a full board of Heavy machines doubles into 40+,
  // and it is spent after one use.
  r('rare', 'full-throttle', 'Full Throttle', 'skill', 2, 'none', [prime(3), ACT, ACT], { exhaust: true }),
  // Final Volley: 3 Mana rare = ~35. 6 + 10 per companion (the 3 slots are the cap): 3 companions = 36, 2 = 26, 1 = 16, so it only
  // pays for a crew that is still standing. (Not an "act now" card: those each act once, DECISIONS #361.)
  r(
    'rare',
    'final-volley',
    'Final Volley',
    'attack',
    3,
    'foe',
    [scaled(dmg(6), per('allies', 10))],
    { exhaust: true },
  ),
  // Critical Mass: 3 Mana rare = ~35. 10 + 3 per Might, and the Might adds again on the hit: 6 Might = 10 + 18 + 6 = 34, 9 Might = 49.
  r(
    'rare',
    'critical-mass',
    'Critical Mass',
    'attack',
    3,
    'foe',
    [scaled(dmg(10), per('might', 3))],
    { exhaust: true },
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
  r(
    'rare',
    'overclock-core',
    'Overclock Core',
    'power',
    2,
    'none',
    [on('turnStart', [status('might', 1, 'allFriends')])],
    { up: { cost: 1 } },
  ),

  // (a drone that grows instead of only being shielded: DECISIONS #285)
  r('uncommon', 'weld-armor', 'Weld Armor', 'skill', 1, 'ally', [
    growHp(5, 'target'),
    barrier(5, 'target'),
  ]),
  r(
    'common',
    'heavy-plating',
    'Heavy Plating',
    'power',
    1,
    'none',
    [on('summon', [barrier(3, 'allFriends')])],
    { up: { effects: [on('summon', [barrier(4, 'allFriends')])] } },
  ),
  r('common', 'retrofit', 'Retrofit', 'skill', 1, 'ally', [status('might', 3, 'target')]),

  // (more Core)
  r('uncommon', 'bulwark-frame', 'Bulwark Frame', 'skill', 1, 'ally', [barrier(12, 'target')]),
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
  r('uncommon', 'rebuild', 'Rebuild', 'skill', 1, 'none', [revive, barrier(3)], { exhaust: true }),
  r(
    'rare',
    'heavy-industry',
    'Heavy Industry',
    'power',
    2,
    'none',
    [on('turnStart', [barrier(4, 'allFriends')])],
    { up: { effects: [on('turnStart', [barrier(6, 'allFriends')])] } },
  ),

  // (even more Core)
  r(
    'common',
    'armor-piercer',
    'Armor Piercer',
    'attack',
    1,
    'foe',
    [dmg(6), status('exposed', 1, 'target')],
    { up: { effects: [dmg(6), status('exposed', 2, 'target')] } },
  ),
  r('uncommon', 'siege-protocol', 'Siege Protocol', 'attack', 2, 'foe', [
    scaled(dmg(10), per('might', 2)),
  ]),
  r(
    'uncommon',
    'titan-forge',
    'Titan Forge',
    'summon',
    2,
    'none',
    [summon('enforcer'), status('might', 1, 'allFriends')],
    { exhaust: true },
  ),
  // (one death only, then it is spent: bringing back every death made the machine an endless wall, Robert 2026-10-28 and 2026-10-30)
  r('rare', 'backup-core', 'Backup Core', 'power', 2, 'none', [
    on('allyDies', [revive], { times: 1 }),
  ]),
  // Heavy and Colossal machines, and the gun that welds them bigger (DECISIONS #383)
  r('uncommon', 'build-bulwark-walker', 'Build Bulwark Walker', 'summon', 2, 'none', [
    summon('bulwark-walker'),
  ]),
  r('uncommon', 'scrap-golem', 'Scrap Golem', 'summon', 2, 'none', [summon('scrap-golem')]),
  r('rare', 'dreadnought', 'Dreadnought', 'summon', 3, 'none', [summon('dreadnought')]),
  r('common', 'welding-arc', 'Arc Welder', 'attack', 1, 'foe', [dmg(7), growHp(3, 'biggestAlly')], {
    up: { effects: [dmg(10), growHp(3, 'biggestAlly')] },
  }),

  // --- shared tools ---
  r(
    'common',
    'static-field',
    'Static Field',
    'attack',
    1,
    'none',
    [dmg(3, 'allFoes'), status('faltering', 1, 'allFoes')],
    { up: { effects: [dmg(6, 'allFoes'), status('faltering', 1, 'allFoes')] } },
  ),
  r('common', 'plating', 'Plating', 'skill', 1, 'none', [barrier(5, 'allFriends')]),
  r('uncommon', 'ion-lance', 'Ion Lance', 'attack', 2, 'foe', [dmg(20)]),
  r('rare', 'railgun', 'Railgun', 'attack', 3, 'foe', [dmg(34)]),
  // (the bigger the machines, the bigger the shot: Swarm and Core alike)
  r('rare', 'particle-cannon', 'Particle Cannon', 'attack', 2, 'foe', [
    scaled(dmg(8), per('slots', 6)),
  ]),
  r(
    'rare',
    'foundry-awakens',
    'The Foundry Awakens',
    'power',
    3,
    'none',
    [on('turnStart', [prime(3), summon('siege-engine')])],
    { up: { effects: [on('turnStart', [prime(5), summon('siege-engine')])] } },
  ),
  r(
    'rare',
    'overclocked-legion',
    'Overclocked Legion',
    'power',
    2,
    'none',
    // 2 Might for every friend now, and every turn the companions charge up (DECISIONS #361)
    [status('might', 2, 'allFriends'), on('turnStart', [prime(3)])],
  ),
  r('uncommon', 'overcharge', 'Overcharge', 'skill', 0, 'none', [mana(2), manaNext(-1)], {
    exhaust: true,
  }),
  // utility (Robert, 2026-10-28, DECISIONS #384): Mana and a chosen card. The Engineer's Mana engine is a machine, not an Aura:
  // the Generator takes a slot, can be struck down, and can't stand beside a Colossal
  r('common', 'battery-pack', 'Battery Pack', 'skill', 0, 'none', [mana(1)], {
    exhaust: true,
    up: { effects: [mana(1), draw(1)] },
  }),
  r('uncommon', 'schematics', 'Schematics', 'skill', 0, 'none', [seekTop(1), draw(1)], {
    exhaust: true,
  }),
  r('rare', 'build-generator', 'Build Generator', 'summon', 2, 'none', [summon('generator')]),

  // --- brought back (DECISIONS #337) ---
  r('common', 'sync-pulse', 'Sync Pulse', 'skill', 1, 'none', [heal(2, 'allFriends'), draw(1)], {
    up: { effects: [heal(2, 'allFriends'), draw(2)] },
  }),
  r(
    'common',
    'hardened-chassis',
    'Hardened Chassis',
    'skill',
    1,
    'ally',
    [barrier(8, 'target'), draw(1)],
    { up: { effects: [barrier(12, 'target'), draw(1)] } },
  ),

  // --- more glue: uncommons and rares for any deck (DECISIONS #339) ---
  r('uncommon', 'factory-floor', 'Factory Floor', 'power', 1, 'none', [on('summon', [draw(1)])], {
    up: { innate: true },
  }),
  r('uncommon', 'blueprint', 'Blueprint', 'skill', 1, 'none', [discoverOp('summon', 1, false)]),

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  // (a companion scrapped to make room counts as well as one that dies, DECISIONS #383)
  r(
    'uncommon',
    'salvage-rights',
    'Salvage Rights',
    'power',
    1,
    'none',
    [on('allyLost', [draw(1), barrier(2)])],
    { up: { effects: [on('allyLost', [draw(1), barrier(4)])] } },
  ),
  r(
    'uncommon',
    'scrapyard-king',
    'Scrapyard King',
    'power',
    2,
    'none',
    [on('allyLost', [status('might', 1, 'allFriends')])],
    { up: { cost: 1 } },
  ),
  r('uncommon', 'echo-command', 'Echo Command', 'skill', 1, 'none', [primeAll(5), draw(1)], {
    exhaust: true,
    up: { effects: [primeAll(7), draw(1)] },
  }),
  r(
    'uncommon',
    'resonant-pulse',
    'Resonant Pulse',
    'power',
    1,
    'none',
    [on('play', [heal(1, 'allFriends')], { filter: 'skill' })],
    { up: { innate: true } },
  ),
  r(
    'uncommon',
    'self-repair',
    'Self-Mending',
    'power',
    2,
    'none',
    [on('turnStart', [heal(2, 'allFriends')])],
    { up: { effects: [on('turnStart', [heal(3, 'allFriends')])] } },
  ),
  r('rare', 'swarm-surge', 'Swarm Surge', 'skill', 2, 'none', [
    summon('patrol-drone'),
    scaled(draw(0), per('allies', 1)),
  ]),

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  r('uncommon', 'patch-job', 'Patch Job', 'skill', 0, 'ally', [growHp(5, 'target')]),
  r(
    'uncommon',
    'relay-network',
    'Relay Network',
    'power',
    1,
    'none',
    [on('snare', [primeAll(3)])],
    {
      up: { effects: [on('snare', [primeAll(4)])] },
    },
  ),

  // --- Core: one big construct, built up and cashed in (DECISIONS #358) ---
  r('common', 'crankshaft', 'Crankshaft', 'attack', 1, 'foe', [
    scaled(dmg(5), per('biggestAlly', 1 / 3)),
  ]),
  r(
    'common',
    'reinforced-frame',
    'Reinforced Frame',
    'skill',
    1,
    'ally',
    [growHp(5, 'target'), draw(1)],
    { up: { effects: [growHp(8, 'target'), draw(1)] } },
  ),
  r('rare', 'heavy-hitter', 'Heavy Hitter', 'attack', 2, 'foe', [
    scaled(dmg(0), per('biggestAlly')),
  ]),
];
