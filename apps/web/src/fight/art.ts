// Placeholder art for Combat v2, painted by the same procedural painters as the rest of the game: which silhouette each
// Riftwalker, companion and enemy stands as, and a card-art adapter for the v2 card format.

import type { CardDef, UnitDef } from '@sr/combat';
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
  hound: ['beast', 'wyldmaw'],
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
  const [kind, realm] = HERO[heroId] ?? ['wanderer', 'neutral'];
  return avatarCutout(kind, realm, `char:${heroId}`);
}

export function unitFigure(defId: string): HTMLCanvasElement {
  const [kind, realm] = UNIT[base(defId)] ?? ['wanderer', 'neutral'];
  return avatarCutout(kind, realm, `unit:${base(defId)}`);
}

/** How tall a unit stands on the stage (stage px): companions are small, bosses are big. */
export function unitHeight(d: UnitDef | undefined, kind: 'ally' | 'enemy' | 'hero'): number {
  if (kind === 'hero') return 380;
  if (kind === 'ally') return d && d.maxHp >= 18 ? 270 : 220;
  const hp = d?.maxHp ?? 30;
  return hp >= 120 ? 470 : hp >= 55 ? 370 : hp >= 20 ? 310 : 240;
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
};

/** The art window for a v2 card (a data URL), via the old card-art painters. */
export function cardArtV2(c: CardDef): string {
  const fake = {
    id: c.id.replace(/\+$/, ''),
    name: c.name,
    realm: (c.realm === 'junk' ? 'neutral' : (c.realm ?? 'neutral')) as Realm,
    rarity: c.rarity === 'basic' || c.rarity === undefined ? 'common' : c.rarity,
    type: KIND_TYPE[c.kind],
    tribes: c.kind === 'summon' ? (REALM_TRIBES[c.realm ?? ''] ?? []) : [],
  } satisfies ArtCard;
  return cardArtUrl(fake);
}
