// Combat v2 card pool: Neutral + the four realms (docs/08_COMBAT_V2.md §5). Numbers assume 3 Mana and a 5-card hand;
// a 1-Mana attack is worth ~6-9 damage and a 2-Mana attack ~12-15. Upgrades ("+") are derived by build.plus().

import type { CardDef } from '@sr/combat';
import {
  ACT,
  PREVENT,
  barrier,
  card,
  dmg,
  draw,
  heal,
  lose,
  mana,
  status,
  summon,
  withUpgrades,
} from './build';

const N = 'neutral';
const neutral: CardDef[] = [
  card(N, 'basic', 'strike', 'Strike', 'attack', 1, 'foe', [dmg(6)]),
  card(N, 'basic', 'defend', 'Defend', 'skill', 1, 'none', [barrier(5)]),
  card(N, 'common', 'rift-bolt', 'Rift Bolt', 'attack', 0, 'foe', [dmg(5)], { exhaust: true }),
  card(N, 'common', 'second-wind', 'Second Wind', 'skill', 1, 'none', [draw(2)]),
  card(N, 'common', 'steady-guard', 'Steady Guard', 'skill', 1, 'none', [barrier(8)], {
    retain: true,
  }),
  card(N, 'common', 'pommel-strike', 'Pommel Strike', 'attack', 1, 'foe', [dmg(8), draw(1)]),
  card(N, 'common', 'shatter-strike', 'Shatter Strike', 'attack', 2, 'foe', [dmg(14)]),
  card(N, 'common', 'reckless-swing', 'Reckless Swing', 'attack', 0, 'foe', [dmg(9), lose(3)]),
  card(N, 'common', 'stagger', 'Stagger', 'attack', 1, 'foe', [
    dmg(4),
    status('faltering', 2, 'target'),
  ]),
  card(N, 'uncommon', 'rift-storm', 'Rift Storm', 'attack', 2, 'none', [dmg(7, 'allFoes')]),
  card(N, 'uncommon', 'wanderers-draught', "Wanderer's Draught", 'skill', 1, 'none', [heal(6)], {
    exhaust: true,
  }),
  card(N, 'uncommon', 'rift-surge', 'Rift Surge', 'skill', 0, 'none', [mana(2)], { exhaust: true }),
  card(N, 'rare', 'rift-resonance', 'Rift Resonance', 'power', 2, 'none', [status('might', 2)]),
];

const A = 'aurelion';
const aurelion: CardDef[] = [
  card(A, 'basic', 'dawn-smite', 'Dawn Smite', 'attack', 1, 'foe', [dmg(6), barrier(3)]),
  card(A, 'basic', 'oathbound', 'Oathbound', 'skill', 1, 'none', [barrier(7), status('thorns', 1)]),
  card(A, 'common', 'bell-toll', 'Bell Toll', 'attack', 1, 'none', [dmg(5, 'allFoes'), barrier(3)]),
  card(A, 'common', 'lightbearer', 'Lightbearer', 'skill', 1, 'none', [heal(4), barrier(5)]),
  card(
    A,
    'common',
    'righteous-rebuke',
    'Righteous Rebuke',
    'snare',
    1,
    'none',
    [dmg(10, 'attacker')],
    {
      trigger: { on: 'attacked' },
    },
  ),
  card(A, 'common', 'thornmail', 'Thornmail', 'skill', 1, 'none', [status('thorns', 3)]),
  card(A, 'common', 'gilded-bastion', 'Gilded Bastion', 'skill', 2, 'none', [barrier(16)]),
  card(A, 'common', 'dawnlance', 'Dawnlance', 'attack', 2, 'foe', [dmg(12), barrier(6)]),
  card(A, 'common', 'zealous-charge', 'Zealous Charge', 'attack', 1, 'foe', [dmg(4, 'target', 3)]),
  card(A, 'common', 'stand-firm', 'Stand Firm', 'skill', 1, 'none', [barrier(10)], {
    retain: true,
  }),
  card(A, 'uncommon', 'aegis-of-the-warden', 'Aegis of the Warden', 'skill', 1, 'none', [
    barrier(8),
    status('shielded', 1),
  ]),
  card(A, 'uncommon', 'sanctuary', 'Sanctuary', 'snare', 2, 'none', [PREVENT, barrier(8)], {
    trigger: { on: 'attacked' },
  }),
  card(A, 'uncommon', 'benediction', 'Benediction', 'skill', 2, 'none', [heal(10), barrier(6)], {
    exhaust: true,
  }),
  card(A, 'uncommon', 'sunburst', 'Sunburst', 'attack', 2, 'none', [
    dmg(9, 'allFoes'),
    status('faltering', 1, 'allFoes'),
  ]),
  card(A, 'rare', 'judgment', 'Judgment', 'attack', 3, 'foe', [
    dmg(24),
    status('exposed', 2, 'target'),
  ]),
  card(A, 'rare', 'radiant-oath', 'Radiant Oath', 'power', 2, 'none', [status('thorns', 4)]),
  card(A, 'rare', 'hallowed-ground', 'Hallowed Ground', 'power', 2, 'none', [
    status('shielded', 2),
  ]),
];

const X = 'nexus';
const nexus: CardDef[] = [
  card(X, 'basic', 'deploy-drone', 'Deploy Drone', 'summon', 1, 'none', [summon('patrol-drone')]),
  card(X, 'basic', 'overclock', 'Overclock', 'skill', 1, 'none', [
    status('might', 1, 'allFriends'),
  ]),
  card(X, 'common', 'call-turret', 'Call Turret', 'summon', 1, 'none', [summon('sentry-turret')]),
  card(X, 'common', 'salvage-bot', 'Salvage Bot', 'summon', 1, 'none', [summon('salvage-bot')]),
  card(X, 'common', 'repair-bot', 'Repair Bot', 'summon', 1, 'none', [summon('repair-bot')]),
  card(X, 'common', 'build-enforcer', 'Build Enforcer', 'summon', 2, 'none', [summon('enforcer')]),
  card(X, 'common', 'recompile', 'Recompile', 'skill', 1, 'none', [heal(4, 'allFriends')]),
  card(
    X,
    'common',
    'countermeasure-grid',
    'Countermeasure Grid',
    'snare',
    1,
    'none',
    [dmg(5, 'attacker'), barrier(5)],
    { trigger: { on: 'attacked' } },
  ),
  card(X, 'common', 'static-field', 'Static Field', 'attack', 1, 'none', [
    dmg(3, 'allFoes'),
    status('faltering', 1, 'allFoes'),
  ]),
  card(X, 'common', 'plating', 'Plating', 'skill', 1, 'none', [barrier(6, 'allFriends')]),
  card(X, 'common', 'ion-lance', 'Ion Lance', 'attack', 2, 'foe', [dmg(12)]),
  card(X, 'common', 'scrap-volley', 'Scrap Volley', 'attack', 1, 'none', [dmg(4, 'randomFoe', 2)]),
  card(X, 'uncommon', 'swarm-protocol', 'Swarm Protocol', 'summon', 2, 'none', [
    summon('patrol-drone'),
    summon('patrol-drone'),
  ]),
  card(X, 'uncommon', 'assemble', 'Assemble', 'skill', 1, 'none', [ACT, draw(1)]),
  card(X, 'uncommon', 'emp', 'EMP', 'snare', 1, 'none', [status('stunned', 1, 'attacker')], {
    trigger: { on: 'attacked' },
  }),
  card(X, 'rare', 'war-engine', 'War Engine', 'summon', 3, 'none', [summon('war-engine')]),
  card(X, 'rare', 'reactor', 'Reactor', 'power', 2, 'none', [status('might', 2, 'allFriends')]),
];

const W = 'wyldmaw';
const wyldmaw: CardDef[] = [
  card(W, 'basic', 'savage-bite', 'Savage Bite', 'attack', 1, 'foe', [dmg(8), lose(2)]),
  card(W, 'basic', 'blood-frenzy', 'Blood Frenzy', 'skill', 1, 'none', [
    lose(3),
    status('might', 2, 'allFriends'),
  ]),
  card(W, 'common', 'call-gnashlings', 'Call Gnashlings', 'summon', 1, 'none', [
    summon('gnashling'),
    summon('gnashling'),
  ]),
  card(W, 'common', 'pack-tactics', 'Pack Tactics', 'skill', 1, 'none', [
    status('might', 1, 'allFriends'),
    barrier(4, 'allFriends'),
  ]),
  card(W, 'common', 'bloodscent', 'Bloodscent', 'attack', 1, 'foe', [
    dmg(5),
    status('might', 1, 'allFriends'),
  ]),
  card(W, 'common', 'rend', 'Rend', 'attack', 1, 'foe', [dmg(11), lose(3)]),
  card(W, 'common', 'primal-feast', 'Primal Feast', 'skill', 1, 'none', [heal(5, 'allFriends')]),
  card(W, 'common', 'howl', 'Howl', 'skill', 1, 'none', [ACT]),
  card(W, 'common', 'thick-hide', 'Thick Hide', 'skill', 1, 'none', [barrier(5, 'allFriends')]),
  card(W, 'common', 'feral-instinct', 'Feral Instinct', 'skill', 0, 'none', [lose(2), draw(2)]),
  card(W, 'uncommon', 'savage-command', 'Savage Command', 'skill', 2, 'none', [
    ACT,
    status('might', 1, 'allFriends'),
  ]),
  card(W, 'uncommon', 'ravage', 'Ravage', 'attack', 2, 'none', [dmg(7, 'allFoes'), lose(3)]),
  card(W, 'uncommon', 'rampage', 'Rampage', 'attack', 2, 'foe', [
    dmg(6, 'target', 2),
    status('might', 1),
  ]),
  card(W, 'uncommon', 'devour', 'Devour', 'attack', 2, 'foe', [dmg(14), heal(5)]),
  card(W, 'rare', 'alpha-call', 'Alpha Call', 'summon', 2, 'none', [
    summon('hound'),
    status('might', 1, 'allFriends'),
  ]),
  card(W, 'rare', 'unchained', 'Unchained', 'power', 2, 'none', [status('might', 3, 'allFriends')]),
  card(W, 'rare', 'the-hunger', 'The Hunger', 'power', 1, 'none', [lose(4), status('might', 3)]),
];

const U = 'umbral';
const umbral: CardDef[] = [
  card(U, 'basic', 'veil-strike', 'Veil Strike', 'attack', 1, 'foe', [
    dmg(5),
    status('exposed', 1, 'target'),
  ]),
  card(
    U,
    'basic',
    'set-the-web',
    'Set the Web',
    'snare',
    1,
    'none',
    [dmg(6, 'attacker'), status('exposed', 2, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),
  card(
    U,
    'common',
    'hollow-snare',
    'Hollow Snare',
    'snare',
    1,
    'none',
    [dmg(8, 'attacker'), status('faltering', 1, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),
  card(
    U,
    'common',
    'whisper-net',
    'Whisper Net',
    'snare',
    1,
    'none',
    [dmg(6, 'attacker'), status('stunned', 1, 'attacker')],
    { trigger: { on: 'foeSummons' } },
  ),
  card(U, 'common', 'mindrot', 'Mindrot', 'skill', 1, 'foe', [
    status('seared', 4, 'target'),
    status('exposed', 1, 'target'),
  ]),
  card(U, 'common', 'unmask', 'Unmask', 'skill', 1, 'none', [status('exposed', 2, 'allFoes')]),
  card(U, 'common', 'shadow-cloak', 'Shadow Cloak', 'skill', 1, 'none', [barrier(6), draw(1)]),
  card(U, 'common', 'ambush', 'Ambush', 'attack', 2, 'foe', [
    dmg(14),
    status('exposed', 1, 'target'),
  ]),
  card(U, 'common', 'veil-dance', 'Veil Dance', 'skill', 1, 'none', [
    status('faltering', 1, 'allFoes'),
    barrier(5),
  ]),
  card(U, 'common', 'dark-study', 'Dark Study', 'skill', 1, 'none', [draw(2)]),
  card(
    U,
    'uncommon',
    'mirror-veil',
    'Mirror Veil',
    'snare',
    1,
    'none',
    [PREVENT, status('faltering', 2, 'attacker')],
    {
      trigger: { on: 'attacked' },
    },
  ),
  card(U, 'uncommon', 'pain-link', 'Pain Link', 'snare', 0, 'none', [dmg(6, 'allFoes')], {
    trigger: { on: 'hpLost', min: 5 },
  }),
  card(U, 'uncommon', 'hungering-dark', 'Hungering Dark', 'skill', 2, 'none', [
    status('seared', 3, 'allFoes'),
  ]),
  card(
    U,
    'uncommon',
    'cold-bargain',
    'Cold Bargain',
    'skill',
    0,
    'none',
    [lose(3), mana(1), draw(1)],
    {
      exhaust: true,
    },
  ),
  card(
    U,
    'rare',
    'bait-and-switch',
    'Bait and Switch',
    'snare',
    2,
    'none',
    [PREVENT, dmg(12, 'attacker')],
    {
      trigger: { on: 'attacked' },
    },
  ),
  card(
    U,
    'rare',
    'silencing-snare',
    'Silencing Snare',
    'snare',
    1,
    'none',
    [status('stunned', 1, 'attacker'), status('shielded', 1)],
    { trigger: { on: 'attacked' } },
  ),
  card(
    U,
    'rare',
    'nightfall',
    'Nightfall',
    'skill',
    3,
    'none',
    [status('seared', 5, 'allFoes'), status('exposed', 2, 'allFoes')],
    { exhaust: true },
  ),
];

// Warden signature cards: one set per Warden, offered as the Warden's Gift. Any Riftwalker can take them.
const sig = (boss: string) => ({ source: `boss:${boss}` });
const signatures: CardDef[] = [
  card(
    'neutral',
    'rare',
    'bell-of-judgment',
    'Bell of Judgment',
    'snare',
    2,
    'none',
    [dmg(20, 'attacker'), status('exposed', 2, 'attacker')],
    { trigger: { on: 'attacked' }, ...sig('seraphine') },
  ),
  card(
    'neutral',
    'rare',
    'gilded-guard',
    'Gilded Guard',
    'summon',
    2,
    'none',
    [summon('gilded-guard')],
    sig('seraphine'),
  ),
  card(
    'neutral',
    'rare',
    'seraphines-oath',
    "Seraphine's Oath",
    'power',
    2,
    'none',
    [status('thorns', 3), status('shielded', 1)],
    sig('seraphine'),
  ),
  card(
    'neutral',
    'rare',
    'orbital-uplink',
    'Orbital Uplink',
    'snare',
    1,
    'none',
    [dmg(14, 'attacker')],
    { trigger: { on: 'foeSummons' }, ...sig('kron') },
  ),
  card(
    'neutral',
    'rare',
    'override-virus',
    'Override Virus',
    'skill',
    2,
    'foe',
    [status('stunned', 1, 'target'), status('exposed', 2, 'target')],
    sig('kron'),
  ),
  card(
    'neutral',
    'rare',
    'assembly-arm',
    "Kron's Assembly Arm",
    'power',
    1,
    'none',
    [status('might', 1, 'allFriends'), draw(1)],
    sig('kron'),
  ),
  card(
    'neutral',
    'rare',
    'the-hunger-below',
    'The Hunger Below',
    'attack',
    3,
    'foe',
    [dmg(22), heal(8)],
    sig('gorrmaw'),
  ),
  card(
    'neutral',
    'rare',
    'maw-spawn-egg',
    'Maw Spawn Egg',
    'summon',
    2,
    'none',
    [summon('maw-hatchling')],
    sig('gorrmaw'),
  ),
  card(
    'neutral',
    'rare',
    'gorrmaws-tooth',
    "Gorrmaw's Tooth",
    'power',
    1,
    'none',
    [status('might', 2), lose(3)],
    sig('gorrmaw'),
  ),
  card(
    'neutral',
    'rare',
    'nyxaras-web',
    "Nyxara's Web",
    'snare',
    1,
    'none',
    [PREVENT, status('exposed', 2, 'attacker'), barrier(6)],
    { trigger: { on: 'attacked' }, ...sig('nyxara') },
  ),
  card(
    'neutral',
    'rare',
    'faceless-courtier',
    'Faceless Courtier',
    'skill',
    1,
    'none',
    [status('exposed', 2, 'allFoes'), status('faltering', 1, 'allFoes')],
    sig('nyxara'),
  ),
  card(
    'neutral',
    'rare',
    'unmasking',
    'Unmasking',
    'attack',
    2,
    'foe',
    [dmg(12), status('seared', 4, 'target')],
    sig('nyxara'),
  ),
];

const junk: CardDef[] = [
  card('junk', 'basic', 'wound', 'Wound', 'skill', 0, 'none', [], { unplayable: true }),
  card('junk', 'basic', 'static', 'Static', 'skill', 0, 'none', [], { unplayable: true }),
];

/** Every playable card with its "+" version, plus junk. */
export const V2_CARDS: CardDef[] = [
  ...withUpgrades([...neutral, ...aurelion, ...nexus, ...wyldmaw, ...umbral, ...signatures]),
  ...junk,
];
