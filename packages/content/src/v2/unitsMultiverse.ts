// The multiverse enemy expansion (DECISIONS #437; docs/MULTIVERSE_ENEMY_EXPANSION.md): 62 enemies from seven realms, 31 -> 93.
// Every number is the design's Tier I, stage 1 target; deeper stages and tiers scale them by the tier table, as for every enemy.
// Each cycle is the design's left-to-right loop, a half-HP clause is a second phase, and everything uses existing rules: Barrier
// and healing on the enemy itself unless it says otherwise, Fate on the hero (it resolves at the end of the hero's own turn),
// temporary Thorns through the player's next turn, junk cards into the discard pile. Summons fail quietly at the four-enemy cap.

import type { UnitDef } from '@sr/combat';
import {
  barrier,
  cycle,
  dmg,
  foe,
  heal,
  move,
  phases,
  status,
  statusTheirs,
  summon,
  wound,
} from './build';

const hit = (n: number, times?: number) => dmg(n, 'target', times);
const weak = (n = 1) => status('faltering', n, 'target');
// (Exposed from an enemy wears 1 a turn at the end of its own turn, so a single stack is gone before its next attack: 2, and
// put before the hit of the same move, as the older enemies do; DECISIONS #437 review)
const expose = (n = 2) => status('exposed', n, 'target');
/** Fate on the hero, past any companion in front (the design: "Fate targets the opposing hero") */
const fate = (n: number) => status('doom', n, 'foeHero');
const might = (n = 1) => status('might', n);
const mightAll = (n = 1) => status('might', n, 'allFriends');
const guardAll = (n: number) => barrier(n, 'allFriends');
const thorns = (n: number) => statusTheirs('thorns', n, 'self');
const junk = () => wound('foe');
const statik = () => wound('foe', 'static');
/** a boss: one loop, and another at half HP */
const twoPhase = (first: string[], second: string[]) =>
  phases([100, { kind: 'cycle', order: first }], [50, { kind: 'cycle', order: second }]);

export const MULTIVERSE_UNITS: UnitDef[] = [
  // ---- Aurelion ----
  foe(
    'censer-crab',
    'Censer Crab',
    42,
    [
      move('pinch', 'Brass Pinch', hit(9)),
      move('smoke', 'Incense Shell', barrier(7)),
      move('fume', 'Choking Fume', hit(6), weak()),
    ],
    cycle('pinch', 'smoke', 'fume'),
  ),
  foe(
    'waxwing-bailiff',
    'Waxwing Bailiff',
    49,
    [
      move('peck', 'Writ Pecks', hit(5, 2)),
      move('wax', 'Wax Seal', barrier(8)),
      move('verdict', 'Verdict', hit(11)),
    ],
    cycle('peck', 'wax', 'verdict'),
  ),
  foe(
    'marble-mantis',
    'Marble Mantis',
    56,
    [
      move('scythe', 'Marble Scythe', hit(12)),
      move('pose', 'Statue Pose', barrier(6)),
      move('pin', 'Pinning Strike', expose(), hit(8)),
    ],
    cycle('scythe', 'pose', 'pin'),
  ),
  foe(
    'reliquary-hound',
    'Reliquary Hound',
    63,
    [
      move('bite', 'Gilded Bite', hit(8)),
      move('ward', 'Reliquary Ward', guardAll(5)),
      move('maul', 'Holy Maul', hit(10)),
    ],
    cycle('bite', 'ward', 'maul'),
  ),
  foe(
    'banner-leech',
    'Banner Leech',
    42,
    [
      move('drape', 'Heavy Drape', weak()),
      move('lash', 'Banner Lash', hit(11)),
      move('fold', 'Fold Up', barrier(7)),
    ],
    cycle('drape', 'lash', 'fold'),
  ),
  foe(
    'bellows-pilgrim',
    'Bellows Pilgrim',
    49,
    [
      move('blast', 'Bellows Blast', hit(7)),
      move('hymn', 'Wheezing Hymn', might()),
      move('chords', 'Sharp Chords', hit(4, 3)),
    ],
    cycle('blast', 'hymn', 'chords'),
  ),
  foe(
    'prism-magistrate',
    'Prism Magistrate',
    105,
    [
      move('sentence', 'Sentence', hit(14)),
      move('facet', 'Faceted Ward', barrier(12)),
      move('glare', 'Prism Glare', expose(), hit(10)),
    ],
    cycle('sentence', 'facet', 'glare'),
  ),
  foe(
    'procession-engine',
    'Procession Engine',
    114,
    [
      move('march', 'Procession', guardAll(9)),
      move('hammer', 'Twin Hammers', hit(9, 2)),
      move('crush', 'Cathedral Crush', hit(20)),
    ],
    cycle('march', 'hammer', 'crush'),
  ),
  foe(
    'the-hollow-benediction',
    'The Hollow Benediction',
    230,
    [
      move('blessing', 'Hollow Blessing', hit(14)),
      move('halo', 'Empty Halo', barrier(15)),
      move('rite', 'Last Rite', hit(26)),
      move('litany', 'Litany of Blows', hit(10, 2)),
      move('veil', 'Gilded Veil', barrier(12)),
    ],
    twoPhase(['blessing', 'halo', 'rite'], ['litany', 'veil']),
  ),

  // ---- Nexus-9 ----
  foe(
    'magnet-tick',
    'Magnet Tick',
    42,
    [
      move('clamp', 'Clamp', hit(8)),
      move('polarise', 'Polarise', barrier(9)),
      move('yank', 'Magnetic Yank', hit(10)),
    ],
    cycle('clamp', 'polarise', 'yank'),
  ),
  foe(
    'receipt-wraith',
    'Receipt Wraith',
    49,
    [
      move('bill', 'Itemised Bill', hit(7), statik()),
      move('file', 'File Away', barrier(6)),
      move('audit', 'Audit', hit(10)),
    ],
    cycle('bill', 'file', 'audit'),
  ),
  foe(
    'cable-jelly',
    'Cable Jelly',
    56,
    [
      move('zap', 'Live Wires', hit(4, 3)),
      move('insulate', 'Insulate', barrier(7)),
      move('surge', 'Surge', hit(8)),
    ],
    cycle('zap', 'insulate', 'surge'),
  ),
  foe(
    'piston-hare',
    'Piston Hare',
    63,
    [
      move('hop', 'Piston Hop', hit(7)),
      move('kick', 'Spring Kick', hit(11)),
      move('vent', 'Vent Steam', barrier(6)),
    ],
    cycle('hop', 'kick', 'vent'),
  ),
  foe(
    'boiler-snail',
    'Boiler Snail',
    42,
    [
      move('shell', 'Boiler Shell', barrier(12)),
      move('scald', 'Scald', hit(13)),
      move('hiss', 'Hissing Jets', hit(5, 2)),
    ],
    cycle('shell', 'scald', 'hiss'),
  ),
  foe(
    'welding-cherub',
    'Welding Cherub',
    49,
    [
      move('torch', 'Torch', hit(8)),
      move('glare', 'Arc Glare', expose()),
      move('weld', 'Weld Shut', hit(12)),
    ],
    cycle('torch', 'glare', 'weld'),
  ),
  foe(
    'clockwork-guillotine',
    'Clockwork Guillotine',
    105,
    [
      move('wind', 'Wind the Spring', barrier(12)),
      move('drop', 'The Drop', hit(22)),
      move('chop', 'Chop Chop', hit(8, 2)),
    ],
    cycle('wind', 'drop', 'chop'),
  ),
  foe(
    'scrapyard-centipede',
    'Scrapyard Centipede',
    114,
    [
      move('legs', 'Hundred Legs', hit(6, 3)),
      move('curl', 'Scrap Curl', barrier(12)),
      move('jaw', 'Magnet Jaw', hit(19)),
    ],
    cycle('legs', 'curl', 'jaw'),
  ),
  foe(
    'mother-of-static',
    'Mother of Static',
    230,
    [
      move('crackle', 'Crackle', hit(12)),
      move('broadcast', 'Broadcast', statik(), barrier(10)),
      move('overload', 'Overload', hit(24)),
      move('storm', 'Static Storm', hit(8, 3)),
      move('ground', 'Ground Out', barrier(14)),
    ],
    twoPhase(['crackle', 'broadcast', 'overload'], ['storm', 'ground']),
  ),

  // ---- Wyldmaw ----
  foe(
    'thornback-toad',
    'Thornback Toad',
    42,
    [
      move('tongue', 'Tongue Lash', hit(8)),
      move('bristle', 'Bristle', thorns(3)),
      move('stomp', 'Stomp', hit(11)),
    ],
    cycle('tongue', 'bristle', 'stomp'),
  ),
  foe(
    'orchid-maw',
    'Orchid Maw',
    49,
    [
      move('snap', 'Snap', hit(9)),
      move('drink', 'Drink Deep', heal(5)),
      move('devour', 'Devour', hit(12)),
    ],
    cycle('snap', 'drink', 'devour'),
  ),
  foe(
    'antler-wasp',
    'Antler Wasp',
    56,
    [
      move('sting', 'Stinging Swarm', hit(4, 3)),
      move('daze', 'Dazing Drone', weak()),
      move('gore', 'Antler Gore', hit(10)),
    ],
    cycle('sting', 'daze', 'gore'),
  ),
  foe(
    'mossjaw-turtle',
    'Mossjaw Turtle',
    63,
    [
      move('shell', 'Moss Shell', barrier(11)),
      move('chomp', 'Mossjaw Chomp', hit(13)),
      move('nip', 'Nip', hit(7)),
    ],
    cycle('shell', 'chomp', 'nip'),
  ),
  foe(
    'fungal-drummer',
    'Fungal Drummer',
    42,
    [
      move('thump', 'Belly Thump', hit(7)),
      move('drum', 'War Drum', mightAll()),
      move('slam', 'Spore Slam', hit(9)),
    ],
    cycle('thump', 'drum', 'slam'),
  ),
  foe(
    'ribcage-eel',
    'Ribcage Eel',
    49,
    [
      move('lunge', 'Lunge', hit(10)),
      move('coil', 'Coil', barrier(7)),
      move('rake', 'Rib Rake', hit(5, 2)),
    ],
    cycle('lunge', 'coil', 'rake'),
  ),
  foe(
    'hunger-orchard',
    'Hunger Orchard',
    105,
    [
      move('swipe', 'Branch Swipe', hit(14)),
      move('ripen', 'Ripen', summon('raptor')),
      move('harvest', 'Harvest', hit(18)),
    ],
    cycle('swipe', 'ripen', 'harvest'),
  ),
  foe(
    'molting-cathedral',
    'Molting Cathedral',
    114,
    [
      move('molt', 'Molt', barrier(15)),
      move('toll', 'Bell Toll', hit(20)),
      move('claws', 'Hermit Claws', hit(7, 3)),
    ],
    cycle('molt', 'toll', 'claws'),
  ),
  foe(
    'the-upside-down-stag',
    'The Upside-Down Stag',
    230,
    [
      move('gore', 'Root Gore', hit(14)),
      move('grow', 'Overgrow', barrier(12), might()),
      move('trample', 'Upturned Trample', hit(25)),
      move('kick', 'Hoof and Root', hit(10, 2)),
      move('bark', 'Bark Over', barrier(15)),
    ],
    twoPhase(['gore', 'grow', 'trample'], ['kick', 'bark']),
  ),

  // ---- Umbral Veil ----
  foe(
    'velvet-lamprey',
    'Velvet Lamprey',
    42,
    [
      move('latch', 'Latch', hit(8)),
      move('numb', 'Numbing Kiss', weak()),
      move('drain', 'Drain', hit(11)),
    ],
    cycle('latch', 'numb', 'drain'),
  ),
  foe(
    'keyhole-imp',
    'Keyhole Imp',
    49,
    [
      move('grab', 'Grabby Hands', hit(7)),
      move('lock', 'Lock Up', barrier(8)),
      move('bite', 'Keyhole Bite', hit(10)),
    ],
    cycle('grab', 'lock', 'bite'),
  ),
  foe(
    'umbrella-widow',
    'Umbrella Widow',
    56,
    [
      move('open', 'Open Canopy', barrier(10)),
      move('spike', 'Ferrule Spike', hit(11)),
      move('legs', 'Rib Legs', hit(4, 2)),
    ],
    cycle('open', 'spike', 'legs'),
  ),
  foe(
    'mirror-moth',
    'Mirror Moth',
    63,
    [
      move('glint', 'Glint', expose(), hit(8)),
      move('dust', 'Mirror Dust', barrier(7)),
      move('flutter', 'Razor Flutter', hit(10)),
    ],
    cycle('glint', 'dust', 'flutter'),
  ),
  foe(
    'inkbound-usher',
    'Inkbound Usher',
    42,
    [
      move('ticket', 'Your Ticket', hit(7), junk()),
      move('cloak', 'Ink Cloak', barrier(8)),
      move('show', 'Show You Out', hit(11)),
    ],
    cycle('ticket', 'cloak', 'show'),
  ),
  foe(
    'puppet-of-knots',
    'Puppet of Knots',
    49,
    [
      move('jerk', 'Jerky Strikes', hit(5, 2)),
      move('tighten', 'Tighten the Strings', might()),
      move('snap', 'Snap Back', hit(12)),
    ],
    cycle('jerk', 'tighten', 'snap'),
  ),
  foe(
    'the-borrowed-face',
    'The Borrowed Face',
    105,
    [
      move('stare', 'Borrowed Stare', hit(12), weak()),
      move('mask', 'Wear the Mask', barrier(14)),
      move('grin', 'Cracked Grin', hit(21)),
    ],
    cycle('stare', 'mask', 'grin'),
  ),
  foe(
    'midnight-seamstress',
    'Midnight Seamstress',
    114,
    [
      move('snip', 'Snip Snip', hit(8, 2)),
      move('stitch', 'Stitch In', junk(), junk()),
      move('shear', 'Shear', hit(19)),
    ],
    cycle('snip', 'stitch', 'shear'),
  ),
  foe(
    'the-applause-below',
    'The Applause Below',
    230,
    [
      move('curtain', 'Curtain Call', barrier(12)),
      move('encore', 'Encore', hit(16)),
      move('ovation', 'Standing Ovation', hit(26)),
      move('clap', 'Thunderous Clapping', hit(7, 3)),
      move('bow', 'Final Bow', barrier(15)),
    ],
    twoPhase(['curtain', 'encore', 'ovation'], ['clap', 'bow']),
  ),

  // ---- Gloomfen ----
  foe(
    'coffin-nautilus',
    'Coffin Nautilus',
    42,
    [
      move('lid', 'Shut the Lid', barrier(10)),
      move('grasp', 'Tentacle Grasp', hit(10)),
      move('ink', 'Grave Ink', hit(7), weak()),
    ],
    cycle('lid', 'grasp', 'ink'),
  ),
  foe(
    'bog-bell',
    'Bog Bell',
    49,
    [
      move('ring', 'Dull Ring', hit(7)),
      move('knell', 'Death Knell', fate(5)),
      move('stamp', 'Bell Stamp', hit(10)),
    ],
    cycle('ring', 'knell', 'stamp'),
  ),
  foe(
    'funeral-kite',
    'Funeral Kite',
    56,
    [
      move('dive', 'Dive', hit(8)),
      move('drift', 'Drift', barrier(6)),
      move('tail', 'Bone Tail', hit(11)),
    ],
    cycle('dive', 'drift', 'tail'),
  ),
  foe(
    'gravewax-slug',
    'Gravewax Slug',
    63,
    [
      move('smother', 'Smother', hit(7)),
      move('melt', 'Melt and Mend', heal(4)),
      move('crawl', 'Wax Crawl', hit(11)),
    ],
    cycle('smother', 'melt', 'crawl'),
  ),
  foe(
    'silt-bride',
    'Silt Bride',
    42,
    [
      move('embrace', 'Cold Embrace', hit(8), weak()),
      move('veil', 'Reed Veil', barrier(7)),
      move('drown', 'Drown', hit(10)),
    ],
    cycle('embrace', 'veil', 'drown'),
  ),
  foe(
    'lantern-angler',
    'Lantern Angler',
    49,
    [
      move('chomp', 'Chomp', hit(8)),
      move('lure', 'The Lure', fate(6)),
      move('gnash', 'Gnash', hit(12)),
    ],
    cycle('chomp', 'lure', 'gnash'),
  ),
  foe(
    'pallbearer-swarm',
    'Pallbearer Swarm',
    105,
    [
      move('march', 'Funeral March', hit(6, 3)),
      move('lift', 'Lift the Coffin', barrier(12)),
      move('drop', 'Drop It', hit(18)),
    ],
    cycle('march', 'lift', 'drop'),
  ),
  foe(
    'the-unburied-hour',
    'The Unburied Hour',
    114,
    [
      move('sand', 'Last Sand', fate(10)),
      move('turn', 'Turn the Glass', barrier(12)),
      move('hour', 'The Hour Strikes', hit(20)),
    ],
    cycle('sand', 'turn', 'hour'),
  ),
  foe(
    'the-mourning-tide',
    'The Mourning Tide',
    230,
    [
      move('wave', 'Grey Wave', hit(14)),
      move('swell', 'Swell', heal(8), barrier(10)),
      move('flood', 'Flood', hit(24)),
      move('undertow', 'Undertow', fate(8)),
      move('breakers', 'Breakers', hit(10, 2)),
    ],
    twoPhase(['wave', 'swell', 'flood'], ['undertow', 'breakers']),
  ),

  // ---- the Hollow Crown ----
  foe(
    'glass-hermit',
    'Glass Hermit',
    42,
    [
      move('jab', 'Shard Jab', hit(8)),
      move('hide', 'Hide in Glass', barrier(9)),
      move('pinch', 'Obsidian Pinch', hit(11)),
    ],
    cycle('jab', 'hide', 'pinch'),
  ),
  foe(
    'crown-centipede',
    'Crown Centipede',
    49,
    [
      move('legs', 'Crown of Legs', hit(4, 3)),
      move('curl', 'Curl', barrier(6)),
      move('bite', 'Royal Bite', hit(10)),
    ],
    cycle('legs', 'curl', 'bite'),
  ),
  foe(
    'ember-chessman',
    'Ember Chessman',
    56,
    [
      move('advance', 'Rook Advance', hit(12)),
      move('castle', 'Castle', barrier(9)),
      move('check', 'Check', hit(8)),
    ],
    cycle('advance', 'castle', 'check'),
  ),
  foe(
    'shard-peacock',
    'Shard Peacock',
    63,
    [
      move('peck', 'Peck', hit(8)),
      move('fan', 'Dazzling Fan', expose()),
      move('quills', 'Shard Quills', hit(4, 3)),
    ],
    cycle('peck', 'fan', 'quills'),
  ),
  foe(
    'cinder-scribe',
    'Cinder Scribe',
    42,
    [
      move('decree', 'Burning Decree', hit(7), junk()),
      move('seal', 'Wax Seal', barrier(8)),
      move('quill', 'Hot Quill', hit(11)),
    ],
    cycle('decree', 'seal', 'quill'),
  ),
  foe(
    'obsidian-anemone',
    'Obsidian Anemone',
    49,
    [
      move('sting', 'Stinging Fronds', hit(5, 2)),
      move('close', 'Close Up', barrier(8)),
      move('bloom', 'Ember Bloom', hit(12)),
    ],
    cycle('sting', 'close', 'bloom'),
  ),
  foe(
    'the-cracked-heir',
    'The Cracked Heir',
    105,
    [
      move('claim', 'Claim the Throne', hit(14)),
      move('crack', 'Glass Mantle', barrier(14)),
      move('claws', 'Heir Claws', hit(9, 2)),
    ],
    cycle('claim', 'crack', 'claws'),
  ),
  foe(
    'molten-reliquary',
    'Molten Reliquary',
    114,
    [
      move('seal', 'Sealed Shell', barrier(12)),
      move('erupt', 'Erupt', hit(21)),
      move('shards', 'Molten Shards', hit(7, 3)),
    ],
    cycle('seal', 'erupt', 'shards'),
  ),
  foe(
    'queen-of-the-unmade',
    'Queen of the Unmade',
    230,
    [
      move('decree', 'Unmaking Decree', hit(14)),
      move('crown', 'Crown of Shards', barrier(14), might()),
      move('verdict', 'Royal Verdict', hit(25)),
      move('shards', 'Shard Rain', hit(9, 3)),
      move('throne', 'Glass Throne', barrier(12)),
    ],
    twoPhase(['decree', 'crown', 'verdict'], ['shards', 'throne']),
  ),

  // ---- the Far Rifts ----
  foe(
    'pocket-singularity',
    'Pocket Singularity',
    42,
    [
      move('orbit', 'Debris Orbit', barrier(8)),
      move('pull', 'Pull', hit(9)),
      move('collapse', 'Ring Collapse', hit(13)),
    ],
    cycle('orbit', 'pull', 'collapse'),
  ),
  foe(
    'origami-leviathan',
    'Origami Leviathan',
    49,
    [
      move('breach', 'Paper Breach', hit(9)),
      move('fold', 'Refold', barrier(7)),
      move('cuts', 'Paper Cuts', hit(5, 2)),
    ],
    cycle('breach', 'fold', 'cuts'),
  ),
  foe(
    'astral-teacup',
    'Astral Teacup',
    56,
    [
      move('spill', 'Spill', hit(7)),
      move('steep', 'Steep', barrier(7), might()),
      move('scald', 'Starry Scald', hit(10)),
    ],
    cycle('spill', 'steep', 'scald'),
  ),
  foe(
    'inverse-diver',
    'Inverse Diver',
    63,
    [
      move('punch', 'Brass Punch', hit(10)),
      move('seal', 'Seal the Helm', barrier(9)),
      move('pressure', 'Pressure', hit(8), weak()),
    ],
    cycle('punch', 'seal', 'pressure'),
  ),
  foe(
    'paradox-jelly',
    'Paradox Jelly',
    42,
    [
      move('loop', 'Loop', hit(7), statik()),
      move('set', 'Set', barrier(9)),
      move('wobble', 'Wobble', hit(11)),
    ],
    cycle('loop', 'set', 'wobble'),
  ),
  foe(
    'planet-eater',
    'Planet Eater',
    123,
    [
      move('gulp', 'Gulp', hit(16)),
      move('crust', 'Crust Over', barrier(13)),
      move('swallow', 'Swallow Whole', hit(22)),
    ],
    cycle('gulp', 'crust', 'swallow'),
  ),
  foe(
    'the-missing-frame',
    'The Missing Frame',
    105,
    [
      move('reach', 'Reach Through', hit(13)),
      move('gild', 'Gild', barrier(12)),
      move('hands', 'Many Hands', hit(8, 3)),
    ],
    cycle('reach', 'gild', 'hands'),
  ),
  foe(
    'event-horizon-regent',
    'Event Horizon Regent',
    230,
    [
      move('gravity', 'Gravity Well', hit(12)),
      move('ring', 'Accretion Ring', barrier(16)),
      move('horizon', 'Past the Horizon', hit(28)),
      move('debris', 'Debris Storm', hit(9, 3)),
      move('orbit', 'Tight Orbit', barrier(14)),
    ],
    twoPhase(['gravity', 'ring', 'horizon'], ['debris', 'orbit']),
  ),
];
