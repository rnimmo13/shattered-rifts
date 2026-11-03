// @sr/campaign: run state machine, stage maps, rewards, Vault and seasons. Pure, like the engine.

/** Deck rules for runs (and later PvP). They live in content so every system shares them. */
export { V2_DECK_RULES as DECK_RULES } from '@sr/content/v2';

export type * from './types';
export { removableCards } from './deals';
export { FINAL_STAGE, depthOf, floorsOf, generateStageMap, reachableNodes, wardenFor } from './mapgen';
export {
  PRICE,
  priceOf,
  REMOVE_PRICE,
  SALE_OFF,
  UPGRADE_PRICE,
  UPGRADE_STEP,
  upgradePrice,
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
  CARD_ODDS,
} from './rewards';
export {
  MAX_RESOLVE,
  DIFFICULTY,
  REST_HEAL,
  restHeal,
  shopPrice,
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
  buyUpgrade,
  chooseCard,
  ASCEND_TIER,
  chooseAscendancy,
  chooseHeart,
  chooseEvent,
  pickEventCard,
  pickDeckCard,
  rollTrial,
  settleInterrupted,
  claimTrialPrize,
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
  MAX_EXTRA_REWARDS,
  resolveCost,
  RETRY_HP_PCT,
  leaveMerchant,
  newRun,
  realmOfRun,
  takeShrine,
  leaveShrine,
  type ShrineChoice,
} from './run';
export { makePrelude, describeEffect, preludeCatalogue } from './preludes';
export { EVENTS } from './events';
export { RUN_SAVE_VERSION, parseRun, serializeRun } from './save';
export {
  ELITE_EVENTS,
  ELITE_EVENT_CHANCE,
  REEL_PRIZES,
  ROLL_COST,
  spinCost,
  REEL_KINDS,
  buildElite,
  twinnable,
} from './trials';
export { EVENT_TAG_LABEL, eventOffers, type EventTag } from './odds';
export {
  NODE_ODDS,
  EVENT_FIGHT_ODDS,
  ALL_ELITE_TIER,
  ALL_WARDEN_TIER,
  eliteFightChance,
  GHOST_BOSS_MIN_TIER,
  ghostCleared,
  GHOST_FROM_TIER,
  GHOST_WARDEN_CHANCE,
  ECHO_FROM_TIER,
} from './mapgen';
export {
  TIER_TABLE,
  enemyScale,
  HP_START,
  HP_PER_TIER,
  HP_STEEP,
  HP_PER_STAGE,
  DMG_START,
  DMG_PER_TIER,
  DMG_PER_STAGE,
} from './tierTable';
export { upgradedCards } from './upgrades';
export {
  GHOST_BOSS_HP_BASE,
  attachGhost,
  ghostToSettle,
  settleGhost,
  checkGhostBoss,
  ghostBossHp,
  GHOST_ARENA_TIER,
  GHOST_ARENA_HP_MULT,
  ghostBossDmg,
  wardenMaxHp,
  ghostWanted,
  ghostsToSkip,
  echoOffers,
  ECHO_HP_PCT,
  ECHO_OFFERS,
  GHOST_FALTERING,
  ECHO_FALTERING,
} from './run';
export {
  buildCache,
  CACHE_TRAP_CHANCE,
  CACHE_STASH,
  CACHE_TRAP_HP_PCT,
  CACHE_DISARM,
} from './cache';
export {
  FIGHT_SHARDS,
  POTION_DROP_CHANCE,
  ELITE_HEAL_PCT,
  ELITE_HEAL_LAST_TIER,
  eliteRewards,
} from './run';
export {
  LOOP_BOON_CHANCE,
  CROSSED_OFFER_CHANCE,
  GIFT_LEGEND_CHANCE,
  POTION_WEIGHTS,
} from './rewards';
export {
  GAMBLER_TIER,
  GAMBLER_BLESSINGS,
  diceOdds,
  diceable,
  engravable,
  ledgerGain,
  altarRarities,
  type GamblerShrine,
  type ShrineKind,
} from './gambler';
export {
  OMENS,
  OMEN_TUNING,
  omenEffects,
  omenMods,
  omensOf,
  omensAt,
  type Omen,
  type OmenEffects,
} from './omens';
