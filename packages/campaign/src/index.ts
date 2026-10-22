// @sr/campaign: run state machine, stage maps, rewards, Vault and seasons. Pure, like the engine.

/** Deck rules shared by runs and PvP (01_GAME_DESIGN.md §3.1). They live in content so enemy decks use them too. */
export { DECK_RULES } from '@sr/content';

export type * from './types';
export { generateStageMap, reachableNodes, wardenFor } from './mapgen';
export {
  PRICE,
  REMOVE_PRICE,
  REALM_LABEL,
  canAdd,
  giftOffers,
  offerCards,
  ownPool,
  crossedPool,
  signatureCards,
} from './rewards';
export {
  MAX_RESOLVE,
  RunError,
  availableNodes,
  bank,
  buyCard,
  buyRemoval,
  chooseCard,
  chooseEvent,
  continueLoop,
  duelPlan,
  enterNode,
  finishDuel,
  leaveMerchant,
  newRun,
  nextStage,
  realmOfStage,
  useShrine,
  type ShrineChoice,
} from './run';
export { RUN_SAVE_VERSION, parseRun, serializeRun } from './save';
