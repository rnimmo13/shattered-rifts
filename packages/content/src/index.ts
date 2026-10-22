// @sr/content: cards, tokens, characters (and later enemies, bosses, campaign tables) as data.
import type { CardDb, CardDef } from '@sr/engine';
import { AURELION } from './cards/aurelion';
import { NEXUS } from './cards/nexus';
import { WYLDMAW } from './cards/wyldmaw';
import { UMBRAL } from './cards/umbral';
import { NEUTRAL } from './cards/neutral';
import { TOKENS } from './cards/tokens';
import { SIGILS } from './cards/sigils';

export { CardIdSchema, CardDefSchema, EffectSchema, AbilitySchema } from './schema';
export { CHARACTERS, character, starterDeck, type Character, type CharacterId } from './characters';
export { DECK_RULES, validateDeck, randomLegalDeck } from './deckRules';
export {
  ENEMIES,
  enemy,
  deckList,
  type EnemyDef,
  type EnemyKind,
  type EnemyPersonality,
  type EnemyRealm,
} from './enemies';

/** Every card definition implemented so far (M1: all Commons + tokens + Rift Spark + Sigils). */
export const ALL_CARDS: CardDef[] = [
  ...AURELION,
  ...NEXUS,
  ...WYLDMAW,
  ...UMBRAL,
  ...NEUTRAL,
  ...TOKENS,
  ...SIGILS,
];

export const CARD_DB: CardDb = Object.freeze(Object.fromEntries(ALL_CARDS.map((c) => [c.id, c])));

export function cardByName(name: string): CardDef | undefined {
  return ALL_CARDS.find((c) => c.name === name);
}
