// @sr/campaign: run state machine, stage maps, rewards, Vault and seasons. Pure, like the engine.

/** Deck rules for runs (and later PvP). They live in content so every system shares them. */
export { V2_DECK_RULES as DECK_RULES } from '@sr/content/v2';

export type * from './types';
export { removableCards } from './deals';
export { FINAL_STAGE, floorsOf, generateStageMap, reachableNodes, wardenFor } from './mapgen';
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
  MAX_TIER,
  POTION_PRICE,
  BOON_PRICE,
  offerCards,
  crossedPool,
  crossedOffers,
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
  pickEventCard,
  startTrial,
  settleInterrupted,
  finishTrial,
  claimTrialPrize,
  chooseKit,
  choosePrelude,
  CROSSED_MERCHANT_CHANCE,
  HOLD_DEPOSIT,
  HOLD_LATER,
  MAX_HELD,
  holdCard,
  releaseHold,
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
export { KIT_CARDS, makeKits } from './kits';
export { RUN_SAVE_VERSION, parseRun, serializeRun } from './save';
export {
  ELITE_EVENTS,
  ELITE_EVENT_CHANCE,
  CASCADE_BALLS,
  CASCADE_LANES,
  LAYOUT_PRIZES,
  cascadeLanes,
  buildElite,
  type Layout,
} from './trials';
export { EVENT_TAG_LABEL, eventOffers, type EventTag } from './odds';
export { NODE_ODDS, GHOST_FROM_TIER, GHOST_WARDEN_CHANCE } from './mapgen';
export { TIER_TABLE, enemyScale } from './tierTable';
export {
  GHOST_BOSS_HP_BASE,
  GHOST_BOSS_HP_PER_TIER,
  attachGhost,
  checkGhostBoss,
  ghostBossHp,
  ghostWanted,
} from './run';
export { FIGHT_SHARDS, POTION_DROP_CHANCE, ELITE_HEAL_PCT } from './run';
export {
  BOON_WEIGHTS,
  CROSSED_OFFER_CHANCE,
  GIFT_LEGEND_CHANCE,
  POTION_WEIGHTS,
} from './rewards';
