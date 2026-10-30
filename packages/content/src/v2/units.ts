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
  manaNext,
  lose,
  move,
  phases,
  status,
  summon,
  weighted,
  wound,
} from './build';
import { MULTIVERSE_UNITS } from './unitsMultiverse';

// --- companions ---------------------------------------------------------------------------------------------

const RAW_ALLIES: UnitDef[] = [
  // Nexus: machines
  // (the costing pass and frames, DECISIONS #383: Light takes 1 of the 3 companion slots, Heavy 2, Colossal 3; a companion is
  // worth 1.2 x HP + 3 + its hit x its acts, less 2 for each slot past the first; docs/ENGINEER_REVIEW.md)
  // (the rare big machines, Siege Engine, War Engine and Dreadnought, have a little more HP or damage, Robert 2026-10-30: they should feel rewarding to play; the buff to the others was taken back. Colossal machines hit several times, so Might and Primed reward them as they do a swarm)
  ally('drone', 'Drone', 8, [dmg(3)]),
  ally('patrol-drone', 'Patrol Drone', 4, [dmg(3)]),
  ally('sentry-turret', 'Sentry Turret', 5, [dmg(2), barrier(2, 'hero')], { taunt: true }),
  ally('salvage-bot', 'Salvage Bot', 4, [barrier(4, 'hero')]),
  ally('repair-bot', 'Repair Bot', 4, [heal(2, 'hero')]),
  ally('spotter-drone', 'Spotter Drone', 4, [status('exposed', 1, 'target')]),
  ally('micro-drone', 'Micro Drone', 3, [dmg(2)]),
  ally('enforcer', 'Enforcer Mk.II', 11, [dmg(6)], { slots: 2 }),
  ally('siege-engine', 'Siege Engine', 12, [dmg(4, 'target', 2)], { slots: 2 }),
  ally('bulwark-walker', 'Bulwark Walker', 12, [barrier(3, 'hero')], { taunt: true, slots: 2 }),
  ally('war-engine', 'War Engine', 22, [dmg(4, 'target', 3)], { slots: 3 }),
  ally('scrap-golem', 'Scrap Golem', 12, [dmg(3, 'target', 2)], { slots: 3 }),
  ally('dreadnought', 'Dreadnought', 22, [dmg(4, 'allFoes', 2)], { slots: 3 }),
  // (the Engineer's Mana engine: a Light machine that powers next turn, DECISIONS #384)
  ally('generator', 'Generator', 8, [manaNext(1)]),
  // Wyldmaw: the pack
  // Warden signature companions
  ally('gilded-guard', 'Gilded Guard', 16, [dmg(4), barrier(4, 'hero')], { taunt: true }),
  ally('maw-hatchling', 'Maw Hatchling', 12, [dmg(7)]),
  // (a pack grows with the card that calls it: basic and common cards bring a Pup, uncommon a Hound, rare a Pack Alpha or a
  // Dire Wolf; DECISIONS #298)
  // (the costing pass, DECISIONS #377: a companion is worth 1.2 x HP + 3 + its hit x its acts, docs/14_CARD_COSTING.md §10)
  ally('pup', 'Pup', 5, [dmg(3)]),
  ally('hound', 'Hound', 8, [dmg(4)]),
  ally('pack-alpha', 'Pack Alpha', 12, [dmg(6)]),
  ally('dire-wolf', 'Dire Wolf', 18, [dmg(9)]),
  // Gloomfen: Dorian's dead. The Bone Thrall is his copy of the Necrobinder's Osty, several at once: it does not act on its own, a
  // Raise brings one with the HP the card says (5 here is only the one he starts with), and his Command cards make each one strike.
  // (Grave Colossus and The Drowned King are no longer summoned by any card; they are kept for their looks and for later.)
  ally('bone-thrall', 'Bone Thrall', 5, []),
  ally('grave-colossus', 'Grave Colossus', 22, [dmg(9)]),
  ally('drowned-king', 'The Drowned King', 22, [dmg(10), barrier(4, 'hero')]),
  ally('gnashling', 'Gnashling', 4, [dmg(3)]),
];

/**
 * Companions whose "+" is not the usual +4 HP and +2 damage: the Pup's stays below the Hound (8 HP, 4 damage), whatever it is
 * upgraded to (DECISIONS #326).
 */
const PLUS_STATS: Record<string, { hp: number; hit: number }> = {
  pup: { hp: 7, hit: 3 },
  // (machines that strike twice gain 1 a hit, as a multi-hit attack card does: +2 a hit doubled their upgrade; DECISIONS #385)
  'siege-engine': { hp: 16, hit: 5 },
  'war-engine': { hp: 26, hit: 5 },
  'scrap-golem': { hp: 16, hit: 4 },
  dreadnought: { hp: 26, hit: 5 },
};

/** The "+" companion a "+" summon card brings: tougher and hits or guards harder. */
function plusAlly(a: UnitDef): UnitDef {
  if (a.brain.kind !== 'ally') return a;
  const own = PLUS_STATS[a.id];
  const act = a.brain.act.map((o) =>
    o.op === 'damage'
      ? { ...o, amount: own?.hit ?? o.amount + 2 }
      : o.op === 'barrier' || o.op === 'heal'
        ? { ...o, amount: o.amount + 2 }
        : o,
  );
  return {
    ...a,
    id: `${a.id}+`,
    name: `${a.name}+`,
    maxHp: own?.hp ?? a.maxHp + 4,
    brain: { kind: 'ally', act },
  };
}

export const ALLIES: UnitDef[] = RAW_ALLIES.flatMap((a) => [a, plusAlly(a)]);

// --- enemies ----------------------------------------------------------------------------------------------------------
// Every number here is what the player meets at Rift Tier I, stage 1 (no hidden multiplier). Deeper stages and tiers scale HP
// and attack damage by the tier table (packages/campaign/src/tierTable.ts). Slay the Spire is the yardstick: a regular hits for
// 5-14, an Elite for 9-23, a Warden for 14-34, against heroes of 70-88 HP.

const slash = (n: number) => move('slash', 'Slash', dmg(n));

export const ENEMY_UNITS: UnitDef[] = [
  // ---- Aurelion ----
  foe(
    'squire',
    'Gilded Squire',
    41,
    [slash(9), move('guard', 'Raise Shield', barrier(7))],
    cycle('slash', 'guard', 'slash'),
  ),
  // a swarm unit: many of them at once (Page Troop), each weak
  foe('gilded-page', 'Gilded Page', 10, [move('poke', 'Poke', dmg(3))], cycle('poke')),
  foe(
    'squire-recruit',
    'Squire Recruit',
    62,
    [slash(11), move('guard', 'Raise Shield', barrier(8))],
    cycle('slash', 'guard', 'slash'),
  ),
  foe(
    'bell-cleric',
    'Cleric of the Ninth Bell',
    55,
    [move('chime', 'Chime', dmg(9)), move('bless', 'Blessing', barrier(6, 'allFriends'), heal(4))],
    cycle('chime', 'bless'),
  ),
  foe(
    'wandering-knight',
    'Wandering Knight',
    76,
    [
      move('strike', 'Strike', dmg(14)),
      move('guard', 'Guard', barrier(10)),
      move('smite', 'Smite', dmg(9), status('faltering', 1, 'target')),
    ],
    weighted(['strike', 3], ['guard', 2], ['smite', 2]),
  ),
  foe(
    'templar-aldric',
    'Templar-Commander Aldric',
    124,
    [
      move('banner', 'Raise the Banner', status('might', 2), barrier(10)),
      move('cleave', 'Cleave', dmg(18, 'allFoes')),
      move('wall', 'Shield Wall', barrier(14, 'allFriends')),
      move('hammer', 'Hammer of Dawn', dmg(23)),
    ],
    cycle('banner', 'cleave', 'wall', 'hammer'),
  ),
  foe(
    'inquisitor-maelis',
    'High Inquisitor Maelis',
    114,
    [
      move('censure', 'Censure', dmg(9), status('faltering', 2, 'target')),
      move('denounce', 'Denounce', wound('foe'), dmg(7)),
      move('smite', 'Smite', dmg(20)),
      move('ward', 'Warding Prayer', status('shielded', 1), barrier(8)),
    ],
    cycle('censure', 'denounce', 'smite', 'ward'),
  ),
  foe(
    'gilded-halberdier',
    'Gilded Halberdier',
    27,
    [move('thrust', 'Thrust', dmg(8)), move('brace', 'Brace', barrier(6))],
    cycle('thrust', 'brace'),
  ),
  foe(
    'seraphine',
    'Seraphine, the Gilded Warden',
    225,
    [
      move('chant', 'Choir of Dawn', barrier(10), status('shielded', 1)),
      move('smite', 'Smite', dmg(14)),
      move('bell', 'Judgment Bell', dmg(26)),
      move('ascend', 'Ascension', summon('gilded-halberdier'), heal(8), status('might', 1)),
      move('radiance', 'Radiant Smite', dmg(18)),
      move('bell2', 'Judgment Bell', dmg(34)),
    ],
    phases(
      [100, { kind: 'cycle', order: ['smite', 'chant', 'bell'] }],
      [50, { kind: 'cycle', order: ['ascend', 'radiance', 'bell2'] }],
    ),
  ),

  // ---- Nexus-9 ----
  foe('scrap-drone', 'Scrap Drone', 10, [move('ping', 'Ping', dmg(5))], cycle('ping')),
  foe(
    'line-technician',
    'Line Technician',
    59,
    [move('tune', 'Retool', barrier(6), summon('scrap-drone')), move('zap', 'Zap', dmg(11))],
    cycle('tune', 'zap', 'zap'),
  ),
  foe(
    'patrol-unit',
    'Patrol Unit 44',
    69,
    [
      move('burst', 'Burst Fire', dmg(5, 'target', 3)),
      move('brace', 'Brace', barrier(8), status('might', 1)),
    ],
    cycle('burst', 'brace', 'burst'),
  ),
  foe(
    'scrap-collector',
    'Scrap Collector',
    66,
    [
      move('grab', 'Grab', dmg(8), wound('foe')),
      move('toss', 'Toss', dmg(12)),
      move('hoard', 'Hoard', barrier(7)),
    ],
    cycle('grab', 'toss', 'hoard'),
  ),
  foe(
    'hive-7',
    'Hive-7',
    110,
    [
      move('spawn', 'Spawn Drone', summon('scrap-drone'), barrier(5)),
      move('swarm', 'Swarm', dmg(9, 'target', 2)),
      move('lash', 'Lash', dmg(15)),
    ],
    cycle('spawn', 'spawn', 'swarm', 'lash'),
  ),
  foe(
    'ghostwire',
    'Ghostwire',
    100,
    [
      move('hack', 'Hack', status('exposed', 2, 'target'), dmg(7)),
      move('signal', 'Ghost Signal', status('faltering', 2, 'target'), wound('foe', 'static')),
      move('strike', 'Strike', dmg(16)),
    ],
    cycle('signal', 'hack', 'strike'),
  ),
  foe(
    'kron',
    'KR-0N "Kron", Foundry Overseer',
    270,
    [
      move('line', 'Production Line', summon('scrap-drone'), barrier(6)),
      move('slam', 'Press', dmg(14)),
      move('charge', 'Charging Orbital Strike', barrier(10)),
      move('orbital', 'Orbital Strike', dmg(17, 'allFoes')),
      move('assemble', 'Reassemble', summon('scrap-drone'), status('might', 2)),
      move('laser', 'Laser Array', dmg(11, 'target', 2)),
      move('orbital2', 'Orbital Strike', dmg(20, 'allFoes')),
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
    19,
    [
      move('peck', 'Peck', dmg(8)),
      move('screech', 'Screech', dmg(5), status('faltering', 1, 'target')),
    ],
    cycle('peck', 'peck', 'screech'),
  ),
  foe(
    'acid-spitter',
    'Acid Spitter',
    62,
    [
      move('spit', 'Spit', dmg(9), status('faltering', 1, 'target')),
      move('hide', 'Harden', barrier(8)),
    ],
    cycle('spit', 'spit', 'hide'),
  ),
  foe(
    'feral-riftling',
    'Feral Riftling',
    79,
    [
      move('claw', 'Claw', dmg(12)),
      move('rage', 'Rage', status('might', 2)),
      move('pounce', 'Pounce', dmg(19)),
    ],
    weighted(['claw', 3], ['rage', 1], ['pounce', 2]),
    { opening: 'rage' },
  ),
  foe(
    'packmother-ruhn',
    'Packmother Ruhn',
    114,
    [
      move('howl', 'Call the Pack', summon('raptor')),
      move('maul', 'Maul', dmg(15)),
      move('rend', 'Rend', dmg(9, 'target', 2)),
    ],
    cycle('howl', 'maul', 'howl', 'rend'),
  ),
  foe(
    'bloated-one',
    'The Bloated One',
    141,
    [
      move('devour', 'Devour', dmg(15), heal(8)),
      move('belch', 'Belch', wound('foe'), wound('foe'), barrier(6)),
      move('slam', 'Slam', dmg(23)),
    ],
    cycle('belch', 'devour', 'slam'),
  ),
  foe('maw-spawn', 'Maw Spawn', 33, [move('bite', 'Bite', dmg(10))], cycle('bite')),
  foe(
    'gorrmaw',
    'Gorrmaw, the Hunger Below',
    240,
    [
      move('gorge', 'Gorge', heal(8), status('might', 1)),
      move('bite', 'Bite', dmg(14)),
      move('spawn', 'Birth Maw Spawn', summon('maw-spawn')),
      move('frenzy', 'Feeding Frenzy', status('might', 3)),
      move('bite2', 'Ravenous Bite', dmg(17)),
      move('rend', 'Rend', dmg(7, 'target', 3)),
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
    55,
    [
      move('curse', 'Curse', status('exposed', 2, 'target'), dmg(6)),
      move('chant', 'Chant', barrier(7)),
      move('stab', 'Stab', dmg(12)),
    ],
    cycle('curse', 'stab', 'chant'),
  ),
  foe(
    'whisperer',
    'The Whisperer',
    59,
    [
      move('whisper', 'Whisper', dmg(8), wound('foe')),
      move('rot', 'Mindrot', status('seared', 3, 'target')),
      move('stab', 'Shadowstab', dmg(14)),
    ],
    cycle('whisper', 'rot', 'stab'),
  ),
  foe(
    'lost-courtier',
    'Lost Courtier',
    69,
    [
      move('waltz', 'Waltz', dmg(12)),
      move('veil', 'Veil', barrier(10), status('faltering', 1, 'target')),
      move('fan', 'Fan of Knives', dmg(6, 'target', 2)),
    ],
    weighted(['waltz', 3], ['veil', 2], ['fan', 2]),
  ),
  foe(
    'lamplighter',
    'The Lamplighter',
    117,
    [
      move('lantern', 'Lantern', status('seared', 4, 'target'), status('exposed', 2, 'target')),
      move('ambush', 'Ambush', dmg(20)),
      move('shroud', 'Shroud', barrier(10)),
      move('flicker', 'Flicker', dmg(9, 'target', 2)),
    ],
    cycle('lantern', 'ambush', 'shroud', 'flicker'),
  ),
  foe(
    'choir-of-silence',
    'Choir of Silence',
    107,
    [
      move('hush', 'Hush', status('faltering', 2, 'target'), wound('foe')),
      move('siphon', 'Siphon', dmg(12), heal(6)),
      move('dirge', 'Dirge', dmg(10, 'allFoes')),
      move('toll', 'Toll', dmg(18)),
    ],
    cycle('hush', 'siphon', 'dirge', 'toll'),
  ),
  foe(
    'nyxara',
    'Nyxara, the Veiled Matriarch',
    278,
    [
      move('web', 'Weave the Web', barrier(8), status('shielded', 1)),
      move('whisper', 'She Whispers', status('exposed', 2, 'target'), wound('foe')),
      move('strike', 'Strike from the Dark', dmg(20)),
      move('ensnare', 'Ensnare', status('faltering', 2, 'target'), status('seared', 3, 'target')),
      move('unmask', 'Unmasking', status('exposed', 2, 'target'), wound('foe')),
      move('ambush', 'Ambush', dmg(22)),
      move('lash', 'Shadow Lash', dmg(7, 'target', 3)),
    ],
    phases(
      [100, { kind: 'cycle', order: ['web', 'whisper', 'strike', 'ensnare'] }],
      [50, { kind: 'cycle', order: ['unmask', 'ambush', 'web', 'lash'] }],
    ),
  ),

  // ---- the finale ----
  foe('rift-shard', 'Rift Shard', 21, [move('slice', 'Slice', dmg(7))], cycle('slice')),
  foe(
    'vorthax',
    'Vorthax, Heart of the Rift',
    270,
    [
      move('shards', 'Crystal Shards', dmg(6, 'target', 3)),
      move('refract', 'Refract', barrier(12), status('might', 1)),
      move('gather', 'Gathering Collapse', barrier(8)),
      move('collapse', 'Collapse', dmg(26)),
      move('shatter', 'The Shattering', dmg(12, 'allFoes'), summon('rift-shard')),
      move('shardstorm', 'Shard Storm', dmg(5, 'target', 4)),
      move('core', 'Prismatic Core', status('shielded', 2), barrier(15)),
      move('beam', 'Prismatic Beam', dmg(17, 'target', 2)),
      move('rupture', 'Rupture', lose(6, 'target'), dmg(12)),
    ],
    phases(
      [100, { kind: 'cycle', order: ['shards', 'refract', 'gather', 'collapse'] }],
      [66, { kind: 'cycle', order: ['shatter', 'shardstorm', 'refract', 'collapse'] }],
      [33, { kind: 'cycle', order: ['core', 'beam', 'rupture', 'beam'] }],
    ),
  ),

  // ---- the multiverse expansion (DECISIONS #437): seven realms, 62 more ----
  ...MULTIVERSE_UNITS,
];
