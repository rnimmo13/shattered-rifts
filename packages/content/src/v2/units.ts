// Companions (allies) and enemies for Combat v2. Enemy moves are shown as intents, so every number here is
// something the player can read and plan around.

import type { UnitDef } from '@sr/combat';
import {
  ally,
  barrier,
  cycle,
  dmg,
  foe,
  heal,
  lose,
  move,
  phases,
  status,
  summon,
  weighted,
  wound,
} from './build';

// --- companions ---------------------------------------------------------------------------------------------

const RAW_ALLIES: UnitDef[] = [
  // Nexus: machines
  ally('drone', 'Drone', 8, [dmg(3)]),
  ally('patrol-drone', 'Patrol Drone', 7, [dmg(4)]),
  ally('sentry-turret', 'Sentry Turret', 10, [dmg(3), barrier(2, 'hero')], { taunt: true }),
  ally('salvage-bot', 'Salvage Bot', 6, [barrier(4, 'hero')]),
  ally('repair-bot', 'Repair Bot', 6, [heal(3, 'hero')]),
  ally('enforcer', 'Enforcer Mk.II', 14, [dmg(6)]),
  ally('war-engine', 'War Engine', 22, [dmg(9)]),
  ally('micro-drone', 'Micro Drone', 4, [dmg(3)]),
  ally('siege-engine', 'Siege Engine', 16, [dmg(13)]),
  // Wyldmaw: the pack
  // Warden signature companions
  ally('gilded-guard', 'Gilded Guard', 16, [dmg(4), barrier(4, 'hero')], { taunt: true }),
  ally('maw-hatchling', 'Maw Hatchling', 12, [dmg(7)]),
  ally('hound', 'Hound', 10, [dmg(4)]),
  ally('dire-wolf', 'Dire Wolf', 18, [dmg(9)]),
  // Gloomfen: Mire's dead
  ally('bone-thrall', 'Bone Thrall', 12, [dmg(4)]),
  ally('grave-colossus', 'Grave Colossus', 22, [dmg(9)]),
  ally('drowned-king', 'The Drowned King', 22, [dmg(10), barrier(4, 'hero')]),
  ally('gnashling', 'Gnashling', 4, [dmg(3)]),
];

/** The "+" companion a "+" summon card brings: tougher and hits or guards harder. */
function plusAlly(a: UnitDef): UnitDef {
  if (a.brain.kind !== 'ally') return a;
  const act = a.brain.act.map((o) =>
    o.op === 'damage' || o.op === 'barrier' || o.op === 'heal' ? { ...o, amount: o.amount + 2 } : o,
  );
  return {
    ...a,
    id: `${a.id}+`,
    name: `${a.name}+`,
    maxHp: a.maxHp + 4,
    brain: { kind: 'ally', act },
  };
}

export const ALLIES: UnitDef[] = RAW_ALLIES.flatMap((a) => [a, plusAlly(a)]);

// --- enemies ----------------------------------------------------------------------------------------------------------

const slash = (n: number) => move('slash', 'Slash', dmg(n));

const RAW_ENEMY_UNITS: UnitDef[] = [
  // ---- Aurelion ----
  foe(
    'squire',
    'Gilded Squire',
    24,
    [slash(6), move('guard', 'Raise Shield', barrier(7))],
    cycle('slash', 'guard', 'slash'),
  ),
  // a swarm unit: many of them at once (Page Troop), each weak
  foe('gilded-page', 'Gilded Page', 6, [move('poke', 'Poke', dmg(2))], cycle('poke')),
  foe(
    'squire-recruit',
    'Squire Recruit',
    36,
    [slash(7), move('guard', 'Raise Shield', barrier(8))],
    cycle('slash', 'guard', 'slash'),
  ),
  foe(
    'bell-cleric',
    'Cleric of the Ninth Bell',
    32,
    [move('chime', 'Chime', dmg(6)), move('bless', 'Blessing', barrier(6, 'allFriends'), heal(4))],
    cycle('chime', 'bless'),
  ),
  foe(
    'wandering-knight',
    'Wandering Knight',
    44,
    [
      move('strike', 'Strike', dmg(9)),
      move('guard', 'Guard', barrier(10)),
      move('smite', 'Smite', dmg(6), status('faltering', 1, 'target')),
    ],
    weighted(['strike', 3], ['guard', 2], ['smite', 2]),
  ),
  foe(
    'templar-aldric',
    'Templar-Commander Aldric',
    72,
    [
      move('banner', 'Raise the Banner', status('might', 2), barrier(10)),
      move('cleave', 'Cleave', dmg(12, 'allFoes')),
      move('wall', 'Shield Wall', barrier(14, 'allFriends')),
      move('hammer', 'Hammer of Dawn', dmg(16)),
    ],
    cycle('banner', 'cleave', 'wall', 'hammer'),
  ),
  foe(
    'inquisitor-maelis',
    'High Inquisitor Maelis',
    66,
    [
      move('censure', 'Censure', dmg(6), status('faltering', 2, 'target')),
      move('denounce', 'Denounce', wound('foe'), dmg(5)),
      move('smite', 'Smite', dmg(14)),
      move('ward', 'Warding Prayer', status('shielded', 1), barrier(8)),
    ],
    cycle('censure', 'denounce', 'smite', 'ward'),
  ),
  foe(
    'gilded-halberdier',
    'Gilded Halberdier',
    18,
    [move('thrust', 'Thrust', dmg(7)), move('brace', 'Brace', barrier(6))],
    cycle('thrust', 'brace'),
  ),
  foe(
    'seraphine',
    'Seraphine, the Gilded Warden',
    150,
    [
      move('chant', 'Choir of Dawn', barrier(10), status('shielded', 1)),
      move('smite', 'Smite', dmg(12)),
      move('bell', 'Judgment Bell', dmg(22)),
      move('ascend', 'Ascension', summon('gilded-halberdier'), heal(8), status('might', 1)),
      move('radiance', 'Radiant Smite', dmg(15)),
      move('bell2', 'Judgment Bell', dmg(28)),
    ],
    phases(
      [100, { kind: 'cycle', order: ['smite', 'chant', 'bell'] }],
      [50, { kind: 'cycle', order: ['ascend', 'radiance', 'bell2'] }],
    ),
  ),

  // ---- Nexus-9 ----
  foe('scrap-drone', 'Scrap Drone', 6, [move('ping', 'Ping', dmg(3))], cycle('ping')),
  foe(
    'line-technician',
    'Line Technician',
    34,
    [move('tune', 'Retool', barrier(6), summon('scrap-drone')), move('zap', 'Zap', dmg(7))],
    cycle('tune', 'zap', 'zap'),
  ),
  foe(
    'patrol-unit',
    'Patrol Unit 44',
    40,
    [
      move('burst', 'Burst Fire', dmg(3, 'target', 3)),
      move('brace', 'Brace', barrier(8), status('might', 1)),
    ],
    cycle('burst', 'brace', 'burst'),
  ),
  foe(
    'scrap-collector',
    'Scrap Collector',
    38,
    [
      move('grab', 'Grab', dmg(5), wound('foe')),
      move('toss', 'Toss', dmg(8)),
      move('hoard', 'Hoard', barrier(7)),
    ],
    cycle('grab', 'toss', 'hoard'),
  ),
  foe(
    'hive-7',
    'Hive-7',
    64,
    [
      move('spawn', 'Spawn Drone', summon('scrap-drone'), barrier(5)),
      move('swarm', 'Swarm', dmg(6, 'target', 2)),
      move('lash', 'Lash', dmg(10)),
    ],
    cycle('spawn', 'spawn', 'swarm', 'lash'),
  ),
  foe(
    'ghostwire',
    'Ghostwire',
    58,
    [
      move('hack', 'Hack', status('exposed', 2, 'target'), dmg(5)),
      move('signal', 'Ghost Signal', status('faltering', 2, 'target'), wound('foe', 'static')),
      move('strike', 'Strike', dmg(11)),
    ],
    cycle('signal', 'hack', 'strike'),
  ),
  foe(
    'kron',
    'KR-0N "Kron", Foundry Overseer',
    180,
    [
      move('line', 'Production Line', summon('scrap-drone'), barrier(6)),
      move('slam', 'Press', dmg(12)),
      move('charge', 'Charging Orbital Strike', barrier(10)),
      move('orbital', 'Orbital Strike', dmg(14, 'allFoes')),
      move('assemble', 'Reassemble', summon('scrap-drone'), status('might', 2)),
      move('laser', 'Laser Array', dmg(9, 'target', 2)),
      move('orbital2', 'Orbital Strike', dmg(17, 'allFoes')),
    ],
    phases(
      [100, { kind: 'cycle', order: ['line', 'slam', 'charge', 'orbital'] }],
      [50, { kind: 'cycle', order: ['assemble', 'laser', 'orbital2'] }],
    ),
  ),

  // ---- Wyldmaw ----
  foe(
    'raptor',
    'Rift Raptor',
    11,
    [
      move('peck', 'Peck', dmg(5)),
      move('screech', 'Screech', dmg(3), status('faltering', 1, 'target')),
    ],
    cycle('peck', 'peck', 'screech'),
  ),
  foe(
    'acid-spitter',
    'Acid Spitter',
    36,
    [
      move('spit', 'Spit', dmg(6), status('faltering', 1, 'target')),
      move('hide', 'Harden', barrier(8)),
    ],
    cycle('spit', 'spit', 'hide'),
  ),
  foe(
    'feral-riftling',
    'Feral Riftling',
    46,
    [
      move('claw', 'Claw', dmg(8)),
      move('rage', 'Rage', status('might', 2)),
      move('pounce', 'Pounce', dmg(12)),
    ],
    weighted(['claw', 3], ['rage', 1], ['pounce', 2]),
    { opening: 'rage' },
  ),
  foe(
    'packmother-ruhn',
    'Packmother Ruhn',
    66,
    [
      move('howl', 'Call the Pack', summon('raptor')),
      move('maul', 'Maul', dmg(10)),
      move('rend', 'Rend', dmg(6, 'target', 2)),
    ],
    cycle('howl', 'maul', 'howl', 'rend'),
  ),
  foe(
    'bloated-one',
    'The Bloated One',
    82,
    [
      move('devour', 'Devour', dmg(10), heal(8)),
      move('belch', 'Belch', wound('foe'), wound('foe'), barrier(6)),
      move('slam', 'Slam', dmg(16)),
    ],
    cycle('belch', 'devour', 'slam'),
  ),
  foe('maw-spawn', 'Maw Spawn', 22, [move('bite', 'Bite', dmg(8))], cycle('bite')),
  foe(
    'gorrmaw',
    'Gorrmaw, the Hunger Below',
    160,
    [
      move('gorge', 'Gorge', heal(8), status('might', 1)),
      move('bite', 'Bite', dmg(12)),
      move('spawn', 'Birth Maw Spawn', summon('maw-spawn')),
      move('frenzy', 'Feeding Frenzy', status('might', 3)),
      move('bite2', 'Ravenous Bite', dmg(14)),
      move('rend', 'Rend', dmg(6, 'target', 3)),
    ],
    phases(
      [100, { kind: 'cycle', order: ['gorge', 'bite', 'spawn', 'bite'] }],
      [50, { kind: 'cycle', order: ['frenzy', 'bite2', 'spawn', 'rend'] }],
    ),
  ),

  // ---- Umbral Veil ----
  foe(
    'hooded-acolyte',
    'Hooded Acolyte',
    32,
    [
      move('curse', 'Curse', status('exposed', 2, 'target'), dmg(4)),
      move('chant', 'Chant', barrier(7)),
      move('stab', 'Stab', dmg(8)),
    ],
    cycle('curse', 'stab', 'chant'),
  ),
  foe(
    'whisperer',
    'The Whisperer',
    34,
    [
      move('whisper', 'Whisper', dmg(5), wound('foe')),
      move('rot', 'Mindrot', status('seared', 3, 'target')),
      move('stab', 'Shadowstab', dmg(9)),
    ],
    cycle('whisper', 'rot', 'stab'),
  ),
  foe(
    'lost-courtier',
    'Lost Courtier',
    40,
    [
      move('waltz', 'Waltz', dmg(8)),
      move('veil', 'Veil', barrier(10), status('faltering', 1, 'target')),
      move('fan', 'Fan of Knives', dmg(4, 'target', 2)),
    ],
    weighted(['waltz', 3], ['veil', 2], ['fan', 2]),
  ),
  foe(
    'lamplighter',
    'The Lamplighter',
    68,
    [
      move('lantern', 'Lantern', status('seared', 4, 'target'), status('exposed', 2, 'target')),
      move('ambush', 'Ambush', dmg(14)),
      move('shroud', 'Shroud', barrier(10)),
      move('flicker', 'Flicker', dmg(6, 'target', 2)),
    ],
    cycle('lantern', 'ambush', 'shroud', 'flicker'),
  ),
  foe(
    'choir-of-silence',
    'Choir of Silence',
    62,
    [
      move('hush', 'Hush', status('faltering', 2, 'target'), wound('foe')),
      move('siphon', 'Siphon', dmg(8), heal(6)),
      move('dirge', 'Dirge', dmg(7, 'allFoes')),
      move('toll', 'Toll', dmg(12)),
    ],
    cycle('hush', 'siphon', 'dirge', 'toll'),
  ),
  foe(
    'nyxara',
    'Nyxara, the Veiled Matriarch',
    185,
    [
      move('web', 'Weave the Web', barrier(8), status('shielded', 1)),
      move('whisper', 'She Whispers', status('exposed', 2, 'target'), wound('foe')),
      move('strike', 'Strike from the Dark', dmg(17)),
      move('ensnare', 'Ensnare', status('faltering', 2, 'target'), status('seared', 3, 'target')),
      move('unmask', 'Unmasking', status('exposed', 2, 'target'), wound('foe')),
      move('ambush', 'Ambush', dmg(18)),
      move('lash', 'Shadow Lash', dmg(6, 'target', 3)),
    ],
    phases(
      [100, { kind: 'cycle', order: ['web', 'whisper', 'strike', 'ensnare'] }],
      [50, { kind: 'cycle', order: ['unmask', 'ambush', 'web', 'lash'] }],
    ),
  ),

  // ---- the finale ----
  foe('rift-shard', 'Rift Shard', 14, [move('slice', 'Slice', dmg(6))], cycle('slice')),
  foe(
    'vorthax',
    'Vorthax, Heart of the Rift',
    230,
    [
      move('shards', 'Crystal Shards', dmg(5, 'target', 3)),
      move('refract', 'Refract', barrier(12), status('might', 1)),
      move('gather', 'Gathering Collapse', barrier(8)),
      move('collapse', 'Collapse', dmg(24)),
      move('shatter', 'The Shattering', dmg(10, 'allFoes'), summon('rift-shard')),
      move('shardstorm', 'Shard Storm', dmg(4, 'target', 4)),
      move('core', 'Prismatic Core', status('shielded', 2), barrier(15)),
      move('beam', 'Prismatic Beam', dmg(14, 'target', 2)),
      move('rupture', 'Rupture', lose(6, 'target'), dmg(10)),
    ],
    phases(
      [100, { kind: 'cycle', order: ['shards', 'refract', 'gather', 'collapse'] }],
      [66, { kind: 'cycle', order: ['shatter', 'shardstorm', 'refract', 'collapse'] }],
      [33, { kind: 'cycle', order: ['core', 'beam', 'rupture', 'beam'] }],
    ),
  ),
];

/**
 * Two knobs for enemy strength. Regulars and Elites are scaled from the raw numbers above; Wardens and the finale are
 * hand-tuned (scale 1). Change a number, re-run `pnpm sim2`, and record it in docs/BALANCE.md.
 */
export const ENEMY_SCALE = {
  regular: { dmg: 1.6, hp: 1.15 },
  elite: { dmg: 1.5, hp: 1.15 },
  boss: { dmg: 1, hp: 1 },
} as const;
// bosses and the adds they summon are hand-tuned
const BOSSES = new Set([
  'seraphine',
  'kron',
  'gorrmaw',
  'nyxara',
  'vorthax',
  'rift-shard',
  'maw-spawn',
  'gilded-halberdier',
]);
const ELITES = new Set([
  'templar-aldric',
  'inquisitor-maelis',
  'hive-7',
  'ghostwire',
  'packmother-ruhn',
  'bloated-one',
  'lamplighter',
  'choir-of-silence',
]);

function scaleUnit(u: UnitDef, k: { dmg: number; hp: number }): UnitDef {
  if (u.brain.kind !== 'enemy' || (k.dmg === 1 && k.hp === 1)) return u;
  const moves = Object.fromEntries(
    Object.entries(u.brain.moves).map(([id, m]) => [
      id,
      {
        ...m,
        effects: m.effects.map((o) =>
          o.op === 'damage' ? { ...o, amount: Math.round(o.amount * k.dmg) } : o,
        ),
      },
    ]),
  );
  return { ...u, maxHp: Math.round(u.maxHp * k.hp), brain: { ...u.brain, moves } };
}

export const ENEMY_UNITS: UnitDef[] = RAW_ENEMY_UNITS.map((u) =>
  scaleUnit(
    u,
    BOSSES.has(u.id)
      ? ENEMY_SCALE.boss
      : ELITES.has(u.id)
        ? ENEMY_SCALE.elite
        : ENEMY_SCALE.regular,
  ),
);
