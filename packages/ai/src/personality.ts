// AI personalities are weight sets (01_GAME_DESIGN §5). Bosses add scripted Omens on top (campaign).

export interface Personality {
  name: string;
  /** How much damage to the enemy Riftwalker matters (1 = normal). */
  aggression: number;
  /** Chance (0–1) to use a response that looks beneficial. Lethal-prevention is always taken. */
  trapHappiness: number;
  /** How much a card in hand is worth, so spending cards has to buy something. */
  valueHoarding: number;
  /** Fear of attacking into enemy set cards while they hold Mana (0–1). */
  caution: number;
  /** Chance (0–1) to pick a near-best action instead of the best. Difficulty comes from this. */
  mistakeRate: number;
}

export const PERSONALITIES = {
  balanced: {
    name: 'Balanced',
    aggression: 1,
    trapHappiness: 0.8,
    valueHoarding: 1,
    caution: 0.5,
    mistakeRate: 0.05,
  },
  aggressive: {
    name: 'Aggressive',
    aggression: 1.7,
    trapHappiness: 0.6,
    valueHoarding: 0.7,
    caution: 0.1,
    mistakeRate: 0.08,
  },
  controlling: {
    name: 'Controlling',
    aggression: 0.7,
    trapHappiness: 0.9,
    valueHoarding: 1.5,
    caution: 0.8,
    mistakeRate: 0.05,
  },
  trappy: {
    name: 'Trappy',
    aggression: 0.9,
    trapHappiness: 1,
    valueHoarding: 1.2,
    caution: 0.7,
    mistakeRate: 0.05,
  },
  /** Easy enemies: makes plenty of mistakes. */
  novice: {
    name: 'Novice',
    aggression: 1,
    trapHappiness: 0.4,
    valueHoarding: 0.8,
    caution: 0.2,
    mistakeRate: 0.35,
  },
} satisfies Record<string, Personality>;

export type PersonalityId = keyof typeof PERSONALITIES;
