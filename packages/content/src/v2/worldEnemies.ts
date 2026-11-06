import type { UnitDef, Op } from '@sr/combat';
import { barrier, cycle, dmg, foe, move, status } from './build';
const hit = (n: number, to: 'target' | 'allFoes' = 'target', hits = 1): Op => dmg(n, to, hits);
const ail = (id: 'seared' | 'faltering' | 'brittle' | 'exposed', n: number): Op =>
  status(id, n, 'target');
const staticCard = (n: number): Op => ({
  op: 'addCard',
  card: 'static',
  times: n,
  to: 'discard',
  side: 'foe',
});
export const WORLD_ENEMIES: UnitDef[] = [
  foe(
    'cinder-soldier',
    'Cinder Soldier',
    42,
    [move('cut', 'Ashen Cut', hit(8)), move('brace', 'Ember Guard', barrier(7), hit(5))],
    cycle('cut', 'brace'),
  ),
  foe(
    'kiln-wisp',
    'Kiln Wisp',
    32,
    [
      move('spark', 'Furnace Spark', hit(6), ail('seared', 1)),
      move('veil', 'Heat Veil', barrier(7)),
    ],
    cycle('spark', 'veil'),
  ),
  foe(
    'ash-collector',
    'Ash Collector',
    40,
    [
      move('gather', 'Gather Embers', status('might', 1), barrier(5)),
      move('scatter', 'Scatter Ash', hit(7)),
    ],
    cycle('gather', 'scatter'),
  ),
  foe(
    'cinder-marshal',
    'Cinder Marshal',
    120,
    [
      move('rally', 'Rally the Ash', status('might', 2), barrier(10)),
      move('cleave', 'Furnace Cleave', hit(18, 'allFoes')),
      move('brand', 'Brand', hit(13), ail('seared', 2)),
    ],
    cycle('rally', 'cleave', 'brand'),
  ),
  foe(
    'walking-kiln',
    'Walking Kiln',
    128,
    [
      move('stoke', 'Stoke', barrier(18)),
      move('blast', 'Kiln Blast', hit(9, 'target', 2)),
      move('vent', 'Vent', hit(13, 'allFoes'), status('exposed', 1)),
    ],
    cycle('stoke', 'blast', 'vent'),
  ),
  foe(
    'ashbound-colossus',
    'The Ashbound Colossus',
    210,
    [
      move('stoke', 'Stoke the Heart', barrier(24), status('blur', 1), status('might', 2)),
      move(
        'march',
        'Furnace Discharge',
        { op: 'damage', amount: 12, to: 'allFoes', scale: { by: 'barrier', mult: 0.5, max: 24 } },
        { op: 'strip', to: 'self' },
      ),
      move('rupture', 'Furnace Rupture', hit(27), status('exposed', 2)),
    ],
    cycle('stoke', 'march', 'rupture'),
  ),
  foe(
    'pearl-crab',
    'Pearl Crab',
    42,
    [move('shell', 'Pearl Shell', barrier(8)), move('claw', 'Tidal Claw', hit(8))],
    cycle('shell', 'claw'),
  ),
  foe(
    'tide-sprite',
    'Tide Sprite',
    32,
    [
      move('mend', 'Living Tide', { op: 'heal', amount: 5, to: 'allFriends' }),
      move('surge', 'Surge', hit(6)),
    ],
    cycle('surge', 'mend'),
  ),
  foe(
    'reef-stalker',
    'Reef Stalker',
    38,
    [move('bite', 'Reef Bite', hit(4, 'target', 2)), move('dive', 'Dive', barrier(5), hit(5))],
    cycle('bite', 'dive'),
  ),
  foe(
    'mirror-ray',
    'Mirror Ray',
    116,
    [
      move('mirror', 'Mirror Tide', status('reflect', 5), barrier(10)),
      move('sweep', 'Ray Sweep', hit(16, 'allFoes')),
      move('break', 'Breaking Wave', hit(20), status('exposed', 1)),
    ],
    cycle('mirror', 'sweep', 'break'),
  ),
  foe(
    'deep-watcher',
    'Deep Watcher',
    126,
    [
      move('gaze', 'Abyssal Gaze', ail('faltering', 1), hit(11)),
      move('lash', 'Many Arms', hit(6, 'target', 3)),
    ],
    cycle('gaze', 'lash'),
  ),
  foe(
    'pearlbound-sovereign',
    'The Pearlbound Sovereign',
    210,
    [
      move(
        'mirror',
        'Pearl Tribute',
        { op: 'barrier', amount: 0, to: 'self', scale: { by: 'barrier', of: 'target', max: 20 } },
        { op: 'strip', to: 'target', amount: 20 },
        barrier(24),
      ),
      move('surge', 'Royal Tide', hit(18, 'allFoes')),
      move('ebb', 'The Ebb', hit(23), status('exposed', 2)),
    ],
    cycle('mirror', 'surge', 'ebb'),
  ),
  foe(
    'dream-moth',
    'Dream Moth',
    32,
    [move('dust', 'Dream Dust', hit(5), ail('faltering', 1)), move('flutter', 'Flutter', hit(8))],
    cycle('dust', 'flutter'),
  ),
  foe(
    'hollow-sleeper',
    'Hollow Sleeper',
    44,
    [move('sleep', 'Sleepwalk', barrier(8)), move('wake', 'Waking Blow', hit(10))],
    cycle('sleep', 'wake'),
  ),
  foe(
    'memory-thief',
    'Memory Thief',
    36,
    [move('steal', 'Borrow a Memory', staticCard(1)), move('cut', 'Forgotten Cut', hit(8))],
    cycle('cut', 'steal'),
  ),
  foe(
    'nightmare-loom',
    'Nightmare Loom',
    118,
    [
      move('weave', 'Weave a Nightmare', staticCard(2), barrier(10)),
      move('snare', 'Dream Snare', hit(17), ail('faltering', 1)),
    ],
    cycle('weave', 'snare'),
  ),
  foe(
    'dream-custodian',
    'Dream Custodian',
    124,
    [
      move('hush', 'Hush', hit(12), ail('faltering', 1)),
      move('guard', 'Guard the Dream', barrier(15)),
      move('wake', 'Wake', hit(9, 'target', 2)),
    ],
    cycle('hush', 'guard', 'wake'),
  ),
  foe(
    'dreaming-monarch',
    'The Dreaming Monarch',
    215,
    [
      move(
        'dream',
        'The Sleeping Court',
        { op: 'addCard', card: 'nightmare', times: 2, to: 'hand', side: 'foe' },
        barrier(18),
      ),
      move('hush', 'Royal Hush', hit(17), ail('faltering', 1)),
      move('wake', 'Wake the World', hit(25), status('exposed', 1)),
    ],
    cycle('dream', 'hush', 'wake'),
  ),
  foe(
    'sand-sentinel',
    'Sand Sentinel',
    46,
    [move('guard', 'Dune Guard', barrier(8)), move('strike', 'Sandstone Strike', hit(9))],
    cycle('strike', 'guard'),
  ),
  foe(
    'glass-scorpion',
    'Glass Scorpion',
    34,
    [move('sting', 'Glass Sting', hit(5), ail('seared', 2)), move('claw', 'Scissor Claw', hit(8))],
    cycle('sting', 'claw'),
  ),
  foe(
    'dune-scribe',
    'Dune Scribe',
    36,
    [
      move('inscribe', 'Inscribe', { op: 'status', status: 'might', amount: 1, to: 'allFriends' }),
      move('erase', 'Erase', hit(7)),
    ],
    cycle('erase', 'inscribe'),
  ),
  foe(
    'bronze-sphinx',
    'Bronze Sphinx',
    124,
    [
      move('riddle', 'Ancient Riddle', barrier(12), ail('exposed', 1)),
      move('pounce', 'Sunlit Pounce', hit(7, 'target', 3)),
    ],
    cycle('riddle', 'pounce'),
  ),
  foe(
    'hourglass-giant',
    'Hourglass Giant',
    136,
    [
      move('gather', 'Gather the Sands', status('might', 2), barrier(10)),
      move('fall', 'Falling Age', hit(21)),
    ],
    cycle('gather', 'fall'),
  ),
  foe(
    'sandbound-chronicler',
    'The Sandbound Chronicler',
    220,
    [
      move('measure', 'Wager the Age', status('might', 2), barrier(16), {
        op: 'status',
        status: 'doom',
        amount: 0,
        to: 'self',
        scale: { by: 'maxHp', mult: 0.15 },
      }),
      move('erode', 'Erosion', hit(15), ail('brittle', 1)),
      move('stroke', 'Three Ages', hit(7, 'target', 3)),
      move(
        'turn',
        'Turn the Hourglass',
        { op: 'damage', amount: 26, to: 'target', scale: { by: 'doom', mult: 0.1, max: 12 } },
        status('doom', -999999),
        status('exposed', 1),
      ),
    ],
    cycle('measure', 'erode', 'stroke', 'turn'),
  ),
  foe(
    'pyrewing',
    'Pyrewing, the Cinder Tyrant',
    225,
    [
      move('inhale', 'Gather the Pyre', barrier(20), status('might', 2)),
      move('breath', 'Worldfire Breath', hit(19, 'allFoes'), status('burn', 4, 'allFoes')),
      move(
        'talon',
        'Kindling Talons',
        {
          op: 'damage',
          amount: 12,
          hits: 2,
          to: 'target',
          scale: { by: 'burn', of: 'target', mult: 2, max: 8 },
        },
        status('burn', -999999, 'target'),
        status('exposed', 1),
      ),
    ],
    cycle('inhale', 'breath', 'talon'),
  ),
  foe(
    'nacreth',
    'Nacreth, the Glassscale',
    230,
    [
      move(
        'scales',
        'Three Mirror Facets',
        barrier(28),
        status('shielded', 3),
        status('reflect', 8),
      ),
      move('shards', 'Glassfall', hit(8, 'target', 3)),
      move(
        'fracture',
        'Fractured Breath',
        status('shielded', -999999),
        status('reflect', -999999),
        hit(24),
        status('exposed', 2),
      ),
    ],
    cycle('scales', 'shards', 'fracture'),
  ),
  foe(
    'morvane',
    'Morvane, the Hollow Maw',
    230,
    [
      move(
        'brood',
        'Brood of Ruin',
        { op: 'summon', unit: 'hollow-egg' },
        { op: 'summon', unit: 'hollow-egg' },
      ),
      move('maw', 'Hollow Maw', hit(23)),
      move('consume', 'The Open Maw', hit(26), status('exposed', 2)),
    ],
    cycle('brood', 'maw', 'consume'),
    { leader: true },
  ),
  foe(
    'aethrion',
    'Aethrion, the Storm-Crowned',
    220,
    [
      move('charge', 'Storm Crown', status('might', 2), barrier(16)),
      move(
        'bolts',
        'Forked Crown',
        { op: 'when', by: 'foes', atMost: 1, ops: [hit(7, 'target', 3)] },
        {
          op: 'when',
          by: 'foes',
          atLeast: 2,
          ops: [{ op: 'damage', amount: 7, to: 'randomFoe', hits: 4, distinct: true }],
        },
      ),
      move('thunder', 'Thunderwake', hit(18, 'allFoes'), status('exposed', 1)),
    ],
    cycle('charge', 'bolts', 'thunder'),
  ),
  foe(
    'xalvorr',
    'Xalvorr, the Last Eclipse',
    240,
    [
      move('eclipse', 'Last Eclipse', barrier(20), ail('brittle', 1), {
        op: 'status',
        status: 'doom',
        amount: 0,
        to: 'target',
        scale: { by: 'missingHp', of: 'target', mult: 0.15, max: 12 },
      }),
      move('shadow', 'Eclipse Talons', hit(11, 'target', 2)),
      move(
        'night',
        'Endless Night',
        hit(26),
        {
          op: 'status',
          status: 'doom',
          amount: 0,
          to: 'target',
          scale: { by: 'doom', of: 'target', mult: 0.5, max: 10 },
        },
        ail('exposed', 1),
        status('exposed', 1),
      ),
    ],
    cycle('eclipse', 'shadow', 'night'),
  ),
];
WORLD_ENEMIES.push(
  foe(
    'hollow-egg',
    'Hollow Egg',
    18,
    [
      move('incubate', 'Incubate', barrier(6)),
      move(
        'hatch',
        'Hatch into Hunger',
        { op: 'heal', amount: 0, to: 'allFriends', scale: { by: 'maxHp', of: 'each', mult: 0.02 } },
        status('might', 1, 'allFriends'),
        { op: 'loseHp', amount: 0, to: 'self', scale: { by: 'hp' } },
      ),
    ],
    cycle('incubate', 'hatch'),
  ),
);
/** Incarnations retain the native mechanic, with 40% base HP and no leader death rule. */
for (const id of ['pyrewing', 'nacreth', 'morvane', 'aethrion', 'xalvorr']) {
  const native = WORLD_ENEMIES.find((u) => u.id === id)!;
  WORLD_ENEMIES.push({
    ...native,
    id: `${id}-incarnation`,
    name: `${native.name} — Incarnation`,
    maxHp: Math.round(native.maxHp * 0.4),
    leader: false,
  });
}
/** Existing silhouettes used by ordinary inhabitants; Wardens receive dedicated painted figures. */
export const WORLD_UNIT_ART: Record<string, string> = {
  'hollow-egg': 'rift-shard',
  ...Object.fromEntries(
    ['pyrewing', 'nacreth', 'morvane', 'aethrion', 'xalvorr'].map((id) => [
      `${id}-incarnation`,
      id,
    ]),
  ),
  'cinder-soldier': 'gilded-page',
  'kiln-wisp': 'ember-chessman',
  'ash-collector': 'cinder-scribe',
  'cinder-marshal': 'templar-aldric',
  'walking-kiln': 'molten-reliquary',
  'pearl-crab': 'censer-crab',
  'tide-sprite': 'lantern-angler',
  'reef-stalker': 'ribcage-eel',
  'mirror-ray': 'mirror-moth',
  'deep-watcher': 'coffin-nautilus',
  'dream-moth': 'mirror-moth',
  'hollow-sleeper': 'hooded-acolyte',
  'memory-thief': 'whisperer',
  'nightmare-loom': 'midnight-seamstress',
  'dream-custodian': 'the-borrowed-face',
  'sand-sentinel': 'gilded-page',
  'glass-scorpion': 'crown-centipede',
  'dune-scribe': 'cinder-scribe',
  'bronze-sphinx': 'reliquary-hound',
  'hourglass-giant': 'the-unburied-hour',
};
export const WORLD_RULES: Record<string, string> = {
  'ashbound-colossus':
    'Furnace Fuel: its charge retains Barrier for one turn. Discharge deals 12 damage to all foes plus half its remaining Barrier (up to +24), then spends the fuel. Break its Barrier to weaken the blast.',
  'pearlbound-sovereign':
    'Pearl Tribute steals up to 20 Barrier from its target before gaining its own 24 base Barrier. Its ebb leaves it Exposed. Spend or break through the stolen protection.',
  'dreaming-monarch':
    'Recurring Nightmares: two are placed in your hand. Each left unplayed at turn end or discarded by an effect creates another Nightmare. Pay 1 Mana to Consume one and draw a card; all are fight-only.',
  'sandbound-chronicler':
    'The Hourglass Wager: it curses itself with Fate equal to 15% of its Max HP. Its fourth move gains damage equal to 10% of that Fate (up to +12), then clears it. Bring its HP below its Fate before the wager ends.',
  pyrewing:
    'Kindling: Worldfire applies 4 Burn to every foe. The next two talon hits gain +2 damage per remaining Burn on their target (up to +8 per hit), then clear that Burn. Block the Burn tick or cleanse it before the talons.',
  nacreth:
    'Three Mirror Facets: three Shielded charges and 8 Reflect punish repeated small hits. Fractured Breath removes both protections and leaves Nacreth Exposed for 2 turns: save your burst for the opening.',
  morvane:
    'Hollow Brood: two Eggs incubate once, then each heals all allies for 2% of their own Max HP and grants them 1 Might before dying. Kill the Eggs before they hatch to deny the support. The Open Maw leaves Morvane Exposed.',
  aethrion:
    'Forked Crown: a lone foe takes three 7-damage bolts; against a formation, up to four different foes take one 7-damage bolt each. Healthy companions spread the lightning. Its crown still builds Might.',
  xalvorr:
    'The Last Eclipse applies Fate equal to 15% of its target’s missing HP (up to 12). Endless Night adds half that target’s existing Fate (up to 10). Healing lowers the first curse; cleansing prevents compounding Fate.',
};
export const WORLD_ENCOUNTERS = [
  ...(['cinder', 'tides', 'vespera', 'sands'] as const).flatMap((realm, i) => {
    const groups = [
      [
        'cinder-soldier',
        'kiln-wisp',
        'ash-collector',
        'cinder-marshal',
        'walking-kiln',
        'ashbound-colossus',
      ],
      [
        'pearl-crab',
        'tide-sprite',
        'reef-stalker',
        'mirror-ray',
        'deep-watcher',
        'pearlbound-sovereign',
      ],
      [
        'dream-moth',
        'hollow-sleeper',
        'memory-thief',
        'nightmare-loom',
        'dream-custodian',
        'dreaming-monarch',
      ],
      [
        'sand-sentinel',
        'glass-scorpion',
        'dune-scribe',
        'bronze-sphinx',
        'hourglass-giant',
        'sandbound-chronicler',
      ],
    ][i]!;
    return [
      ...[[groups[0]!], [groups[1]!, groups[2]!], [groups[0]!, groups[2]!]].map((units, k) => ({
        id: `${realm}-patrol-${k + 1}`,
        name: units.map((id) => WORLD_ENEMIES.find((u) => u.id === id)!.name).join(' and '),
        realm,
        kind: 'regular' as const,
        units,
      })),
      ...groups.slice(3, 5).map((id) => ({
        id,
        name: WORLD_ENEMIES.find((u) => u.id === id)!.name,
        realm,
        kind: 'elite' as const,
        units: [id],
      })),
      {
        id: groups[5]!,
        name: WORLD_ENEMIES.find((u) => u.id === groups[5])!.name,
        realm,
        kind: 'warden' as const,
        rule: WORLD_RULES[groups[5]!]!,
        units: [groups[5]!],
      },
    ];
  }),
  ...['pyrewing', 'nacreth', 'morvane', 'aethrion', 'xalvorr'].map((id) => ({
    id,
    name: WORLD_ENEMIES.find((u) => u.id === id)!.name,
    realm: 'ruin' as const,
    kind: 'warden' as const,
    rule: WORLD_RULES[id]!,
    units: [id],
  })),
];
