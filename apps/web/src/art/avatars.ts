// Which silhouette each Riftwalker and each enemy stands as on the battlefield. Placeholder art, like the cards:
// painted from the same figure painters, in the realm's colours.

import type { Realm } from '@sr/engine';
import type { CharacterId, EnemyDef } from '@sr/content';
import { avatarCutout, type Archetype } from './proceduralArt';

const CHARACTER: Record<CharacterId, { kind: Archetype; realm: Realm }> = {
  maren: { kind: 'knight', realm: 'aurelion' },
  rivet: { kind: 'drone', realm: 'nexus' },
  kesh: { kind: 'beast', realm: 'wyldmaw' },
  vesper: { kind: 'cultist', realm: 'umbral' },
};

const ENEMY_BY_REALM: Record<EnemyDef['realm'], { kind: Archetype; realm: Realm }> = {
  aurelion: { kind: 'knight', realm: 'aurelion' },
  nexus: { kind: 'mech', realm: 'nexus' },
  wyldmaw: { kind: 'beast', realm: 'wyldmaw' },
  umbral: { kind: 'shade', realm: 'umbral' },
  all: { kind: 'dragon', realm: 'neutral' },
};

export function characterAvatar(id: CharacterId): HTMLCanvasElement {
  const c = CHARACTER[id];
  return avatarCutout(c.kind, c.realm, `char:${id}`);
}

export function enemyAvatar(e: Pick<EnemyDef, 'id' | 'realm'>): HTMLCanvasElement {
  const c = ENEMY_BY_REALM[e.realm];
  return avatarCutout(c.kind, c.realm, `enemy:${e.id}`);
}
