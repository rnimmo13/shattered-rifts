// @sr/campaign: run state machine, stage maps, rewards, Vault and seasons. Pure, like the engine.

/** Deck rules for runs (and later PvP). They live in content so every system shares them. */
export { V2_DECK_RULES as DECK_RULES } from '@sr/content/v2';

export type * from './types';
export { generateStageMap, reachableNodes, wardenFor } from './mapgen';
export {
  PRICE,
  priceOf,
  REMOVE_PRICE,
  REALM_LABEL,
  canAdd,
  giftOffers,
  offerBoon,
  offerPotion,
  MAX_POTIONS,
  POTION_PRICE,
  offerCards,
  crossedPool,
  LUCK_WEIGHTS,
} from './rewards';
export {
  MAX_RESOLVE,
  DIFFICULTY,
  REST_HEAL,
  RunError,
  upgradable,
  type FightPlan,
  availableNodes,
  bank,
  buyBoon,
  buyPotion,
  potionSellPrice,
  sellPotion,
  buyCard,
  buyRemoval,
  chooseCard,
  chooseEvent,
  chooseKit,
  choosePrelude,
  CROSSED_MERCHANT_CHANCE,
  HOLD_DEPOSIT,
  HOLD_LATER,
  holdCard,
  continueLoop,
  duelPlan,
  enterNode,
  finishDuel,
  leaveMerchant,
  newRun,
  nextStage,
  realmOfStage,
  takeShrine,
  type ShrineChoice,
} from './run';
export { makePrelude, describeEffect } from './preludes';
export { makeKits, mechanicsOf } from './kits';
export { RUN_SAVE_VERSION, parseRun, serializeRun } from './save';
