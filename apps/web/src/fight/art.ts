// Placeholder art for Combat v2, painted by the same procedural painters as the rest of the game: which silhouette each
// Riftwalker, companion and enemy stands as, and a card-art adapter for the v2 card format.

import type { CardDef, UnitDef } from '@sr/combat';
import type { Motif } from '../art/motifs';
import { realCardArt, realFigure } from '../art/assets';
import { HERO_EMBLEM } from '../art/emblems';
import { bespokeHero } from '../art/heroFigures';
import {
  avatarCutout,
  cardArtUrl,
  type ArtCard,
  type Archetype,
  type Realm,
} from '../art/proceduralArt';

const HERO: Record<string, [Archetype, Realm]> = {
  maren: ['knight', 'aurelion'],
  rivet: ['drone', 'nexus'],
  kesh: ['beast', 'wyldmaw'],
  vesper: ['cultist', 'umbral'],
  quill: ['wanderer', 'umbral'],
  ilvane: ['mage', 'nexus'],
  sehra: ['cleric', 'aurelion'],
  astra: ['mage', 'starfall'],
  mire: ['shade', 'gloomfen'],
  kp: ['engineer', 'midden'],
};

const UNIT: Record<string, [Archetype, Realm]> = {
  // companions
  drone: ['drone', 'nexus'],
  'patrol-drone': ['drone', 'nexus'],
  'sentry-turret': ['turret', 'nexus'],
  'salvage-bot': ['drone', 'nexus'],
  'repair-bot': ['drone', 'nexus'],
  enforcer: ['mech', 'nexus'],
  'war-engine': ['mech', 'nexus'],
  'micro-drone': ['drone', 'nexus'],
  'siege-engine': ['mech', 'nexus'],
  'dire-wolf': ['beast', 'wyldmaw'],
  'bone-thrall': ['spirit', 'gloomfen'],
  'grave-colossus': ['mech', 'gloomfen'],
  hound: ['beast', 'wyldmaw'],
  'gilded-guard': ['knight', 'aurelion'],
  'maw-hatchling': ['beast', 'wyldmaw'],
  gnashling: ['beast', 'wyldmaw'],
  // Aurelion
  squire: ['knight', 'aurelion'],
  'squire-recruit': ['knight', 'aurelion'],
  'bell-cleric': ['cleric', 'aurelion'],
  'wandering-knight': ['knight', 'aurelion'],
  'templar-aldric': ['knight', 'aurelion'],
  'inquisitor-maelis': ['cleric', 'aurelion'],
  'gilded-halberdier': ['knight', 'aurelion'],
  seraphine: ['dragon', 'aurelion'],
  // Nexus
  'scrap-drone': ['drone', 'nexus'],
  'line-technician': ['engineer', 'nexus'],
  'patrol-unit': ['mech', 'nexus'],
  'scrap-collector': ['engineer', 'nexus'],
  'hive-7': ['insect', 'nexus'],
  ghostwire: ['drone', 'nexus'],
  kron: ['mech', 'nexus'],
  // Wyldmaw
  raptor: ['beast', 'wyldmaw'],
  'acid-spitter': ['insect', 'wyldmaw'],
  'feral-riftling': ['beast', 'wyldmaw'],
  'packmother-ruhn': ['beast', 'wyldmaw'],
  'bloated-one': ['insect', 'wyldmaw'],
  'maw-spawn': ['beast', 'wyldmaw'],
  gorrmaw: ['dragon', 'wyldmaw'],
  // Umbral
  'hooded-acolyte': ['cultist', 'umbral'],
  whisperer: ['shade', 'umbral'],
  'lost-courtier': ['shade', 'umbral'],
  lamplighter: ['cultist', 'umbral'],
  'choir-of-silence': ['spirit', 'umbral'],
  nyxara: ['shade', 'umbral'],
  // the finale
  'rift-shard': ['elemental', 'neutral'],
  vorthax: ['dragon', 'neutral'],
};

const base = (id: string): string => id.replace(/\+$/, '');

export function heroFigure(heroId: string): HTMLCanvasElement {
  const real = realFigure(`hero:${heroId}`);
  if (real) return real;
  const own = bespokeHero(heroId);
  if (own) return own;
  const [kind, realm] = HERO[heroId] ?? ['wanderer', 'neutral'];
  return avatarCutout(kind, realm, `char:${heroId}`);
}

export function unitFigure(defId: string): HTMLCanvasElement {
  const real = realFigure(`unit:${base(defId)}`);
  if (real) return real;
  const [kind, realm] = UNIT[base(defId)] ?? ['wanderer', 'neutral'];
  return avatarCutout(kind, realm, `unit:${base(defId)}`);
}

/** How tall a unit stands on the stage (stage px): companions are small, bosses are big. */
export function unitHeight(d: UnitDef | undefined, kind: 'ally' | 'enemy' | 'hero'): number {
  if (kind === 'hero') return 520;
  if (kind === 'ally') return d && d.maxHp >= 18 ? 340 : 280;
  const hp = d?.maxHp ?? 30;
  return hp >= 120 ? 600 : hp >= 55 ? 470 : hp >= 20 ? 390 : 300;
}

const KIND_TYPE: Record<CardDef['kind'], ArtCard['type']> = {
  attack: 'spell',
  skill: 'spell',
  power: 'relic',
  summon: 'unit',
  snare: 'trap',
};

const REALM_TRIBES: Record<string, string[]> = {
  nexus: ['Drone'],
  wyldmaw: ['Beast'],
  aurelion: ['Knight'],
  umbral: ['Shade'],
  starfall: ['Spirit'],
  gloomfen: ['Spirit'],
  midden: ['Drone'],
};

/** What a card is ABOUT, as a symbol: by what its name says first, then by what it does. */
const EMBLEM_WORDS: [RegExp, string][] = [
  [/shell|buckshot|gauge|barrel|boomstick|shotgun|pump/, 'shell'],
  [/window|pane|glass|glaz|shatter|stained|shard/, 'pane'],
  [/bottle|swig|flask|brawl|rotgut|courage|drunk|toast|round$/, 'bottle'],
  [/hammer|anvil|crush|smith|mallet|pound/, 'hammer'],
  [/knife|knives|dagger|sleeve|razor|stab|jab|sleight/, 'daggers'],
  [/rune|glyph|sigil|hollow|resonan|ward-?stone|spark/, 'rune'],
  [/star|lumen|nova|comet|meteor|constellation|astral|cosmos|sovereign/, 'star8'],
  [/crown|king|queen|throne|sovereign|regal/, 'crown'],
  [/doom|fate|grave|thrall|skull|toll|ash|soul|dead|requiem|reap|undead|colossus|bone/, 'skull'],
  [/bell|chime|knell/, 'bell'],
  [/web|snare|trap|net\b|cage|trip|wire|bait|noose|tangle/, 'web'],
  [/mask|veil|shadow|mirror|bluff|disguise|masquerade|ghost|phantom/, 'mask'],
  [/\beye|mark|prey|sight|gaze|spotlight|unmask|read|watch/, 'eye'],
  [/fist|palm|stance|fury|serene|fervor|monk|punch|ire\b|stillness|balance/, 'fist'],
  [/arrow|bow\b|hunt|volley|pierce|quiver|stalk|track/, 'bow'],
  [/gear|drone|bot\b|turret|engine|assembl|core|spring|rivet|machine|clock|legion|foundry/, 'cog'],
  [/flame|burn|sear|fire|ember|cinder|blaze|scorch|pyre|inferno/, 'flame'],
  [/bite|maw|fang|claw|rend|feral|savage|hunger|rav|gnash|wild/, 'claw'],
  [/heal|mend|heart|feast|devour|blood|tithe|vital|swallow/, 'heart'],
  [/thorn|oath|spike|barb|vow/, 'thorn'],
  [/sun|dawn|radiant|light|hymn|prayer|halo|smite|sanct|aurora/, 'sunshield'],
  [/shield|ward|guard|brace|barrier|bulwark|barricade|bastion|aegis|fort|steadfast/, 'shield'],
  [/coin|gold|purse|bargain|tribute|loot|salvage/, 'coin'],
  [/time|patien|moment|hourglass|wait|delay|long\b/, 'hourglass'],
  [/moon|night|dusk|twilight/, 'moon'],
  [/book|tome|study|lore|page|scroll|foresee|cold read/, 'book'],
  [/bolt|lightning|shock|storm|thunder|surge|overclock|charge/, 'bolt'],
  [/wave|tide|drown|fen|mire|flood|bog|swamp/, 'wave'],
  [/key|unlock|lock\b/, 'key'],
  [/blade|sword|strike|slash|cut|edge|saber|cleave|lunge|riposte/, 'sword'],
];
const MOTIF_EMBLEM: Record<Motif, string> = {
  slash: 'sword',
  flurry: 'daggers',
  burst: 'bolt',
  shield: 'shield',
  heal: 'heart',
  flame: 'flame',
  curse: 'eye',
  draw: 'book',
  power: 'crown',
  snare: 'web',
  crystal: 'star8',
  rune: 'rune',
};
function emblemOf(c: CardDef, motif: Motif | undefined): string {
  const text = `${c.id.replace(/\+$/, '')} ${c.name}`.toLowerCase().replace(/-/g, ' ');
  for (const [re, name] of EMBLEM_WORDS)
    if (new RegExp(String.raw`\b(?:${re.source})`).test(text)) return name;
  return MOTIF_EMBLEM[motif ?? 'rune'];
}

/** What a card does, as a picture: chosen from its effects, never from its name. */
function motifOf(c: CardDef): Motif {
  if (c.kind === 'snare') return 'snare';
  if (c.kind === 'power') return 'power';
  const ops = c.effects;
  const dmg = ops.find((o) => o.op === 'damage');
  if (dmg && dmg.op === 'damage') {
    if (dmg.to === 'allFoes') return 'burst';
    return (dmg.hits ?? 1) > 1 || dmg.to === 'randomFoe' ? 'flurry' : 'slash';
  }
  const has = (op: string): boolean =>
    [...ops, ...ops.flatMap((o) => (o.op === 'power' ? o.ops : []))].some((o) => o.op === op);
  if (
    ops.some(
      (o) => o.op === 'addCard' && (o.card === 'sleeve-knife' || o.card === 'buckshot-shell'),
    )
  )
    return 'flurry';
  if (has('channel') || has('evoke') || has('runeSlots')) return 'rune';
  if (has('stars') || has('forge')) return 'crystal';
  if (has('stance')) return 'power';
  if (has('scry') || has('discard')) return 'draw';
  if (ops.some((o) => o.op === 'status' && o.status === 'seared')) return 'flame';
  if (
    ops.some(
      (o) =>
        o.op === 'status' &&
        ['exposed', 'faltering', 'stunned'].includes(o.status) &&
        o.to !== 'self',
    )
  )
    return 'curse';
  if (
    ops.some((o) => o.op === 'barrier') ||
    ops.some((o) => o.op === 'status' && (o.status === 'shielded' || o.status === 'thorns'))
  )
    return 'shield';
  if (ops.some((o) => o.op === 'heal')) return 'heal';
  if (ops.some((o) => o.op === 'draw')) return 'draw';
  if (ops.some((o) => o.op === 'mana')) return 'crystal';
  if (ops.some((o) => o.op === 'status' && o.status === 'might')) return 'power';
  return 'rune';
}

/** The art window for a v2 card (a data URL), via the card-art painters. */
export function cardArtV2(c: CardDef): string {
  const real = realCardArt(c.id);
  if (real) return real;
  const unit = c.effects.find((o) => o.op === 'summon');
  const summoned = unit && unit.op === 'summon' ? UNIT[base(unit.unit)]?.[0] : undefined;
  const fake = {
    id: c.id.replace(/\+$/, ''),
    name: c.name,
    realm: (c.realm === 'junk' ? 'neutral' : (c.realm ?? 'neutral')) as Realm,
    rarity: c.rarity === 'basic' || c.rarity === undefined ? 'common' : c.rarity,
    type: KIND_TYPE[c.kind],
    tribes: c.kind === 'summon' ? (REALM_TRIBES[c.realm ?? ''] ?? []) : [],
    ...(summoned ? { archetype: summoned } : { motif: motifOf(c) }),
    emblem: emblemOf(c, summoned ? undefined : motifOf(c)),
    ...(c.hero && HERO_EMBLEM[c.hero] ? { seal: HERO_EMBLEM[c.hero] as string } : {}),
  } satisfies ArtCard;
  return cardArtUrl(fake);
}
