// @sr/campaign: run state machine, stage maps, rewards, Vault and seasons. Pure, like the engine.

/** Deck rules shared by runs and PvP (01_GAME_DESIGN.md §3.1). */
export const DECK_RULES = {
  minSize: 20,
  maxCopies: 3,
  maxCopiesLegendary: 1,
  maxLegendaryTotal: 2,
  maxTempered: 5,
  vaultSlots: 5,
} as const;
