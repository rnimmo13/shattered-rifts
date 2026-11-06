// The run state machine (03_CAMPAIGN §2, adapted to Combat v2). Every function takes a RunState and returns a new one
// (the input is never changed), so a run can be saved after every step and the UI can never put it in a state the rules
// forbid. Covers: Riftwalker start, the five stage maps, fights/elites/Wardens, HP that carries between fights, card
// rewards with skip, shrines (rest, upgrade, remove), the merchant, a small event, the Warden's Gift, Resolve, Bank and
// Continue. Boons come later.

import { nextInt, seedRng, shuffle, type RngState } from '@sr/combat';
import {
  CLASS_REWORKS,
  COMBAT_DB,
  CAMPAIGN_REALMS,
  CAMPAIGN_REALM_IDS,
  RIFTWALKERS,
  V2_DECK_RULES,
  HEARTS,
  encounter,
  isDeckCard,
  markOf,
  markedId,
  MARK_INFO,
  rolledId,
  rewardPool,
  canonicalCard,
  canonicalHero,
  BOONS,
  type HeroId,
  ascendanciesOf,
  ascendancyOf,
  classNameOf,
} from '@sr/content/v2';
import {
  CROSSED_MERCHANT_CHANCE,
  EVENT_FIGHT_ODDS,
  depthOf,
  ghostCleared,
  GHOST_FROM_TIER,
  ambushEnemy,
  generateStageMap,
  rollEliteFight,
  reachableNodes,
  WARDEN_SEQUENCE,
  dragonGauntletMap,
  shuffledWardens,
} from './mapgen';

export { CROSSED_MERCHANT_CHANCE };
import { enemyScale } from './tierTable';
import { changeMaxHp, heartCrossedChance, migrateHeart } from './hearts';
import { rollEvent, resolveEvent, promisedTreasure } from './events';
import { applyChoice, applyDeal } from './deals';
import { GAMBLER_REEL, buildElite, spinReel, takePrize } from './trials';
import {
  GAMBLER_BLESSINGS,
  GAMBLER_TIER,
  diceOdds,
  diceable,
  engravable,
  ledgerGain,
  makeGambler,
  type ShrineKind,
} from './gambler';
import { makePrelude } from './preludes';
import { buildCache } from './cache';
import { CAMPAIGN_GHOSTS_ENABLED, withoutCampaignGhosts } from './features';
import { omenEffects, omenMods } from './omens';
import type { EnemyMod, StatusId } from '@sr/combat';
import {
  BOON_PRICE,
  LOOP_BOON_CHANCE,
  MAX_POTIONS,
  MAX_TIER,
  POTION_PRICE,
  PRICE,
  SALE_OFF,
  REMOVE_PRICE,
  upgradePrice,
  ancestralPool,
  offerPotion,
  canAdd,
  cardOfRarity,
  giftOffers,
  offerBoon,
  offerCards,
  priceOf,
  deadElsewhere,
} from './rewards';
import type {
  DealStep,
  Difficulty,
  GhostBoss,
  EventOption,
  MapNode,
  MerchantItem,
  PreludeEffect,
  RunState,
  StageRealm,
} from './types';

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

export class RunError extends Error {}

function need(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new RunError(msg);
}

export const MAX_RESOLVE = 2;

/**
 * Difficulty settings. Only their RATIO to Normal matters now: the tier table (tierTable.ts) sets how strong enemies are on Normal, and Easy/Hard scale that. Normal is
 * the intended game; Easy is relaxed (weaker enemies, more Resolve, a few shards to start); Hard is for people who have
 * beaten Normal (fewer Resolve). Re-measure with `pnpm runsim` after any change (docs/BALANCE.md).
 */
export const DIFFICULTY: Record<
  Difficulty,
  { label: string; blurb: string; hpPct: number; dmgPct: number; resolve: number; shards: number }
> = {
  easy: {
    label: 'Easy',
    blurb: 'Weaker enemies, 5 Resolve and a few shards to start. Relaxed.',
    hpPct: 85,
    dmgPct: 80,
    resolve: 5,
    shards: 100,
  },
  normal: {
    label: 'Normal',
    blurb: 'The intended game: 2 Resolve, and the Wardens are real fights.',
    hpPct: 128,
    dmgPct: 118,
    resolve: 2,
    shards: 0,
  },
  hard: {
    label: 'Hard',
    blurb:
      'Tougher, harder-hitting enemies and only 1 Resolve: lose one fight and the run is over.',
    hpPct: 128,
    dmgPct: 120,
    resolve: 1,
    shards: 0,
  },
};
/** Shards a won fight pays, by the kind of fight. */
export const FIGHT_SHARDS = { duel: 25, elite: 50, warden: 100 } as const;
/** The chance (percent) that a won fight drops a potion (when the belt has room). */
export const POTION_DROP_CHANCE = { duel: 40, elite: 75 } as const;
/** Percent of max HP an Elite fight heals when it is won. */
export const ELITE_HEAL_PCT = 10;
/** An Elite heals up to and including this Rift Tier, and not after (DECISIONS #526). */
export const ELITE_HEAL_LAST_TIER = 10;
/** The chance (percent) that an Elite leaves a Boon once its rewards have faded all the way. */
export const ELITE_BOON_FLOOR = 10;
/** Reward fade is separate from encounter frequency; difficulty/reward retuning is a follow-up. */
export const ELITE_REWARD_FADE_TIER = 19;
/**
 * What winning an Elite pays at this tier: Tier I in full, fading evenly until by ELITE_REWARD_FADE_TIER its shards and potion chance are a plain
 * fight's and its Boon is rare, as most fights are Elites by then. Its card reward keeps an Elite's rarity chance at every tier (DECISIONS #526).
 */
export function eliteRewards(tier: number): {
  shards: number;
  potionPct: number;
  boonPct: number;
  healPct: number;
} {
  const left =
    Math.max(0, ELITE_REWARD_FADE_TIER - Math.max(1, tier)) / (ELITE_REWARD_FADE_TIER - 1);
  const fade = (floor: number, full: number): number => Math.round(floor + (full - floor) * left);
  return {
    shards: fade(FIGHT_SHARDS.duel, FIGHT_SHARDS.elite),
    potionPct: fade(POTION_DROP_CHANCE.duel, POTION_DROP_CHANCE.elite),
    boonPct: fade(ELITE_BOON_FLOOR, 100),
    healPct: tier <= ELITE_HEAL_LAST_TIER ? ELITE_HEAL_PCT : 0,
  };
}

/** Fraction of max HP a shrine rest heals. */
export const REST_HEAL = 0.35;
/** What a rest heals in this run (the Omen Times Are Tough takes some away), in HP. */
export const restHeal = (run: RunState): number =>
  Math.ceil(run.maxHp * REST_HEAL * (1 - omenEffects(run.tier, !run.campaignRoute).restPct / 100));
/** A merchant's price in this run (the Omen Times Are Tough adds to it). */
export const shopPrice = (run: RunState, n: number): number =>
  Math.round((n * (100 + omenEffects(run.tier, !run.campaignRoute).pricePct)) / 100);

/** The realm of the tier being walked. */
export const realmOfRun = (run: Pick<RunState, 'map'>): StageRealm => run.map.realm;

/** The realm of a tier, chosen as it opens: never the one just walked, and the Rift at the last tier. */
function realmOfTier(
  rng: RngState,
  tier: number,
  last?: StageRealm,
  wardenOrder: readonly string[] = WARDEN_SEQUENCE,
  realmOrder?: readonly StageRealm[],
): { realm: StageRealm; order: StageRealm[] } {
  if (realmOrder) {
    const realm = realmOrder[tier - 1] ?? 'ruin';
    return {
      realm,
      order: (realm === 'ruin'
        ? [...realmOrder].slice(-4)
        : [realm, ...realmOrder.filter((r) => r !== realm)]
      ).slice(0, 4),
    };
  }
  const order = shuffledRealms(rng).filter((x) => x !== last);
  const boss = wardenOrder[tier - 1];
  const bossRealm = boss ? encounter(boss).realm : 'rift';
  const realm: StageRealm = (CAMPAIGN_REALM_IDS as readonly string[]).includes(bossRealm)
    ? (bossRealm as StageRealm)
    : 'ruin';
  return {
    realm,
    order: (realm === 'ruin' ? order : [realm, ...order.filter((x) => x !== realm)]).slice(0, 4),
  };
}

/** Where a tier's enemies come from: its own realm, or in the Rift the last two of its order (an old save's Rift map was built from them too). */
function enemyRealms(run: Pick<RunState, 'stageRealms' | 'map'>): StageRealm[] {
  if (run.map.themed) return [run.map.realm];
  if (run.map.realm !== 'rift') return [run.map.realm];
  const rest = run.stageRealms.slice(-2);
  return rest.length > 0 ? rest : ['umbral'];
}

/** The realms a run visits, in a shuffled order. */
function shuffledRealms(rng: RngState): StageRealm[] {
  return shuffle(rng, ['aurelion', 'nexus', 'wyldmaw', 'umbral'] as StageRealm[]);
}

export function newRun(hero: HeroId, seed: string, difficulty: Difficulty = 'normal'): RunState {
  const rng = seedRng(`run:${seed}`);
  const realmOrder = shuffle(rng, [...CAMPAIGN_REALM_IDS]);
  const wardenOrder = realmOrder.map((id) => {
    const world = CAMPAIGN_REALMS.find((r) => r.id === id)!;
    return world.wardens[nextInt(rng, world.wardens.length)]!;
  });
  const first = realmOfTier(rng, 1, undefined, wardenOrder, realmOrder);
  const stageRealms = first.order;
  const map = generateStageMap(
    rng,
    1,
    first.realm,
    hero,
    undefined,
    1,
    'twelve',
    wardenOrder,
    true,
  );
  const rw = RIFTWALKERS[hero]; // throws on an unknown hero
  need(rw, `Unknown Riftwalker ${hero}`);
  const rework = CLASS_REWORKS[hero]?.version;
  const run: RunState = {
    v: 2,
    campaignRoute: 'twelve',
    realmRoute: 'eleven',
    realmOrder,
    wardenOrder,
    ...(rework ? { reworked: rework } : {}),
    weaponCards: true,
    seed,
    character: hero,
    difficulty,
    tier: 1,
    stage: 1,
    hp: rw.hero.maxHp,
    maxHp: rw.hero.maxHp,
    resolve: DIFFICULTY[difficulty].resolve,
    maxResolve: DIFFICULTY[difficulty].resolve,
    deck: [...rw.starter],
    shards: DIFFICULTY[difficulty].shards,
    boons: [],
    potions: [],
    stageRealms,
    map,
    cleared: [],
    at: null,
    phase: 'map',
    context: null,
    rng,
    stats: { duelsWon: 0, duelsLost: 0, nodesCleared: 0 },
  };
  // the very start: The Threshold (the run starts with the Riftwalker's plain starting deck, DECISIONS #374)
  openPrelude(run, 'threshold');
  return run;
}

/** Put the start-of-run / start-of-stage choice in front of the player (changes `run`, which must be a copy). */
function openPrelude(run: RunState, kind: 'threshold' | 'stage'): void {
  run.phase = 'prelude';
  // (many options ask about the same few kinds of card)
  const picks = new Map<string, boolean>();
  run.context = {
    nodeId: '',
    prelude: makePrelude(
      run.rng,
      kind,
      depthOf(run.tier),
      realmOfRun(run),
      run.resolve < run.maxResolve,
      BOONS.length - run.boons.length,
      {
        strikes: run.deck.filter((id) => id === 'strike').length,
        defends: run.deck.filter((id) => id === 'defend').length,
        basics: run.deck.filter(isPlainBasic).length,
        deckRoom: run.deck.length - V2_DECK_RULES.minSize,
        upgradable: run.deck.filter((id) => COMBAT_DB.cards[id]?.upgrade).length,
        beltRoom: MAX_POTIONS - run.potions.length,
        canPick: (rarity, kind) => {
          const key = `${rarity}:${kind ?? ''}`;
          if (!picks.has(key)) picks.set(key, pickPool(run, rarity, kind).length > 0);
          return picks.get(key) as boolean;
        },
      },
      run.tier,
    ),
  };
}

/** Add a Boon to the run, applying its campaign-side effects (max HP). */
function gainBoon(r: RunState, id: string): void {
  const b = COMBAT_DB.boons[id];
  need(b, `Unknown boon ${id}`);
  need(!r.boons.includes(id), 'You already have that boon');
  r.boons.push(id);
  if (b.maxHp) {
    changeMaxHp(r, b.maxHp);
  }
}

/** Two Warden's Hearts to offer (never the one the run holds). */
function heartOffers(r: RunState): string[] {
  const pool = HEARTS.map((h) => h.id).filter((id) => id !== r.heart);
  const out: string[] = [];
  while (out.length < 2 && pool.length)
    out.push(pool.splice(nextInt(r.rng, pool.length), 1)[0] as string);
  return out;
}

/** Take a Warden's Heart instead of the Gift's card: it replaces the one held before (whose Max HP change is undone). */
export function chooseHeart(run: RunState, id: string): RunState {
  need(run.phase === 'gift' && run.context?.hearts?.includes(id), 'That Heart is not on offer');
  const r = clone(run);
  migrateHeart(r);
  const old = r.heart ? COMBAT_DB.boons[r.heart] : undefined;
  if (old?.maxHp) {
    // (the Max HP it changed comes back; HP does not, so a Heart cannot be swapped in and out for health)
    r.maxHp = Math.max(1, r.maxHp - old.maxHp);
    r.hp = Math.max(1, Math.min(r.maxHp, r.hp));
  }
  if (r.heartMaxHpLoss !== undefined) {
    r.maxHp += r.heartMaxHpLoss;
    delete r.heartMaxHpLoss;
  }
  const h = COMBAT_DB.boons[id];
  need(h?.heart, 'That is not a Heart');
  r.heart = id;
  if (h.maxHpPct) {
    const before = r.maxHp;
    const hpBefore = r.hp;
    changeMaxHp(r, 0, false);
    r.hp = Math.max(1, hpBefore - (before - r.maxHp));
  }
  if (h.maxHp) {
    r.maxHp = Math.max(1, r.maxHp + h.maxHp);
    r.hp = Math.max(1, Math.min(r.maxHp, r.hp + h.maxHp));
  }
  r.eventResult = `You take the ${h.name}.${old ? ` The ${old.name} is given back.` : ''}`;
  afterGift(r);
  return r;
}

/**
 * One more card reward, if the fight earned any (a card that kills: Marked for Death, The Hunt). It replaces the context, keeping
 * the node, and says whether it did. Its cards are a fight's or an Elite's, as the fight's own reward was (a Warden's are an Elite's).
 */
function nextReward(
  r: RunState,
  c: NonNullable<RunState['context']>,
  afterWarden: boolean,
): boolean {
  const left = c.extraRewards ?? 0;
  if (left <= 0 || c.nodeId === '') return false;
  const kind = nodeOf(r, c.nodeId).kind;
  const count = Math.max(2, 3 - omenEffects(r.tier, !r.campaignRoute).fewerChoices);
  r.context = {
    nodeId: c.nodeId,
    offers: offerCards(
      r.rng,
      r.character,
      r.deck,
      kind === 'duel' ? 'duel' : 'elite',
      count,
      heartCrossedChance(r),
    ),
    extraReward: true,
    ...(left > 1 ? { extraRewards: left - 1 } : {}),
    ...(afterWarden ? { afterWarden: true } : {}),
  };
  r.phase = 'reward';
  return true;
}

/** The Rift Tier whose last Warden offers an Ascendancy. */
export const ASCEND_TIER = 3;

/** Take an Ascendancy: the Riftwalker's class changes for the rest of the run, and the tier is cleared. */
export function chooseAscendancy(run: RunState, id: string): RunState {
  need(
    run.phase === 'ascend' && run.context?.ascendancies?.includes(id),
    'That Ascendancy is not on offer',
  );
  need(!run.ascendancy, 'An Ascendancy cannot be changed');
  need(ascendancyOf(run.character, id), 'That Ascendancy is not this Riftwalker’s');
  const r = clone(run);
  r.ascendancy = id;
  if (!nextReward(r, r.context as NonNullable<RunState['context']>, true)) afterGift(r);
  return r;
}

/** After a Gift, pause on the gauntlet map or clear the tier (DECISIONS #352, #531, #627). */
function afterGift(r: RunState): void {
  const node = r.map.nodes.find((n) => n.id === r.at);
  if (node?.enemyId === 'vorthax') r.won = true;
  if (r.map.gauntlet && node?.next.length) {
    r.phase = 'map';
    r.context = null;
    return;
  }
  // Legacy saves finish their current map before entering the new finale; earned progress stays intact.
  if (!r.campaignRoute && r.tier >= MAX_TIER && !r.won) {
    r.campaignRoute = 'twelve';
    r.tier = MAX_TIER;
    if (r.rewardRerollTier !== undefined && r.rewardRerollTier > MAX_TIER)
      r.rewardRerollTier = MAX_TIER;
    r.realmRoute = 'legacy-themed';
    r.map = dragonGauntletMap(r.rng);
    r.cleared = [];
    r.at = null;
    r.context = null;
    r.phase = 'map';
    return;
  }
  r.phase = 'loopCleared';
  r.context = null;
}

/** Drago has fallen: the run is won and the next page is the victory screen, with nothing to choose first. */
export function finishCampaign(r: RunState, nodeId: string): void {
  clearNode(r, nodeId);
  delete r.eventResult;
  delete r.eventFlips;
  r.won = true;
  r.phase = 'loopCleared';
}

const heal = (r: RunState, n: number): void => {
  r.hp = Math.min(r.maxHp, r.hp + Math.ceil(n));
};
/** Only victory recovery is reduced; combat healing and earned permanent Max HP keep their rules. */
const healAfterFight = (r: RunState, n: number): void =>
  heal(r, n * (1 - omenEffects(r.tier, !r.campaignRoute).afterFightHealPct / 100));

export function availableNodes(run: RunState): MapNode[] {
  return run.phase === 'map' ? reachableNodes(run.map, run.at, run.cleared) : [];
}

const nodeOf = (run: RunState, id: string): MapNode => {
  const n = run.map.nodes.find((x) => x.id === id);
  need(n, `Unknown node ${id}`);
  return n;
};

function clearNode(run: RunState, id: string): void {
  if (run.context?.bonusEvent) {
    run.context = null;
    return;
  }
  if (!run.cleared.includes(id)) {
    run.cleared.push(id);
    run.stats.nodesCleared++;
  }
  run.at = id;
  run.context = null;
}

/** Step onto a node from the map. */
export function enterNode(run: RunState, nodeId: string): RunState {
  run = withoutCampaignGhosts(run);
  need(run.phase === 'map', 'You can only choose a node from the map');
  need(
    availableNodes(run).some((n) => n.id === nodeId),
    'That node is not reachable',
  );
  const r = clone(run);
  const node = nodeOf(r, nodeId);
  const treasure = promisedTreasure(r);
  if (treasure) {
    delete r.eventResult;
    delete r.eventFlips;
    r.context = { nodeId, bonusEvent: true, event: treasure };
    r.phase = 'event';
    return r;
  }
  r.at = nodeId;
  r.context = { nodeId };
  switch (node.kind) {
    case 'duel':
    case 'elite':
    case 'warden':
    case 'echo':
      r.phase = 'duel';
      // (news from an earlier stop, "The Warden falls", say, is not told again as this fight starts)
      delete r.eventResult;
      // a ghost Warden or Echo settled when the stage began is that ghost
      if (node.ghost && node.ghostDeck) meetGhost(r, node.ghostDeck);
      break;
    case 'cache':
      delete r.eventResult;
      delete r.eventFlips;
      r.context.event = buildCache(r);
      r.phase = 'event';
      break;
    case 'shrine':
      r.phase = 'shrine';
      // deep in the Rift a Shrine is a Gambler's Shrine: one blessing of seven, or the Brass Reel's prize instead (DECISIONS #234, #538)
      if (r.tier >= GAMBLER_TIER && !node.refinement) {
        r.context.gambler = makeGambler(r);
        const reel = buildElite(GAMBLER_REEL, r);
        r.context.event = { ...reel, options: reel.options.filter((o) => o.id === 'trial') };
      }
      break;
    case 'merchant': {
      // the map already said whether this merchant is a stranger from another Riftwalker's world
      const crossed =
        node.crossed && node.crossed !== r.character && node.crossed in RIFTWALKERS
          ? (node.crossed as HeroId)
          : undefined;
      // (a visitor's table is only that Riftwalker's own cards: no Neutral cards, no further crossings)
      let stock: string[];
      if (crossed) {
        stock = [];
        for (let g = 0; g < 40 && stock.length < 4; g++)
          for (const id of offerCards(r.rng, crossed, r.deck, 'elite', 4, 0))
            if (
              COMBAT_DB.cards[id]?.hero === crossed &&
              // (not a card that only works in its owner's deck: the Trickster's Suits, DECISIONS #387)
              !deadElsewhere(id) &&
              !stock.includes(id) &&
              stock.length < 4
            )
              stock.push(id);
      } else {
        stock = offerCards(r.rng, r.character, r.deck, 'elite', 4, heartCrossedChance(r));
      }
      const items: MerchantItem[] = stock.map((cardId) => ({
        cardId,
        price: priceOf(cardId),
        sold: false,
      }));
      // one card on the table is on sale
      if (items.length > 0) {
        const it = items[nextInt(r.rng, items.length)] as MerchantItem;
        it.price = Math.round(it.price * (1 - SALE_OFF));
        it.sale = true;
      }
      // a card you put on hold earlier is waiting for you, at the price you were promised
      if (r.held) {
        const keep = r.held.filter((h) => canAdd(r.deck, h.cardId));
        // (a held card the deck can no longer take, as an Aura it has since found twice: the deposit comes back, DECISIONS #498)
        const back = r.held
          .filter((h) => !keep.includes(h))
          .reduce((sum, h) => sum + Math.ceil(Math.round(h.price / HOLD_LATER) * HOLD_DEPOSIT), 0);
        if (back > 0) {
          r.shards += back;
          r.eventResult = `Your deck can no longer take a card you put on hold, so the merchant returns your ${back} shard deposit.`;
        }
        items.unshift(
          ...keep.map((h) => ({ cardId: h.cardId, price: h.price, sold: false, held: true })),
        );
        if (keep.length) r.held = keep;
        else delete r.held;
      }
      // now and then an ancestral card is on the table, at a price
      const ancestors = ancestralPool(r.deck);
      if (!crossed && ancestors.length && nextInt(r.rng, 100) < 28) {
        const id = ancestors[nextInt(r.rng, ancestors.length)] as string;
        items.push({ cardId: id, price: PRICE['ancestral'] ?? 240, sold: false });
      }
      const potions = [offerPotion(r.rng), offerPotion(r.rng)].map((id) => ({
        id,
        price: POTION_PRICE[COMBAT_DB.potions[id]?.rarity ?? 'common'] ?? 40,
        sold: false,
      }));
      const boon = offerBoon(r.rng, r.boons);
      r.context.merchant = {
        items,
        ...(crossed ? { crossed } : {}),
        removePrice: REMOVE_PRICE,
        removed: false,
        potions,
        ...(boon
          ? {
              boon: { id: boon, price: BOON_PRICE, sold: false },
            }
          : {}),
      };
      // the Omen Times Are Tough: everything costs more (a card held for you keeps the price you were promised)
      const up = omenEffects(r.tier, !r.campaignRoute).pricePct;
      if (up > 0) {
        const m = r.context.merchant;
        const dear = (n: number): number => shopPrice(r, n);
        for (const it of m.items) if (!it.held) it.price = dear(it.price);
        for (const pt of m.potions ?? []) pt.price = dear(pt.price);
        if (m.boon) m.boon.price = dear(m.boon.price);
        m.removePrice = dear(m.removePrice);
      }
      r.phase = 'merchant';
      break;
    }
    case 'event': {
      delete r.eventResult; // (so the next event's result is shown even if its words are the same)
      delete r.eventFlips;
      // now and then the stop is an ambush: a fight (an Elite from the third floor on, or by the tier's odds) in place of the event. (Maps never put an event on
      // the first floor, which is all fights, so an event stood on there by hand is left alone.)
      const roll = node.floor >= 2 ? nextInt(r.rng, 100) : 100;
      const ambush: 'duel' | 'elite' | null =
        roll < EVENT_FIGHT_ODDS.elite && node.floor >= 3
          ? 'elite'
          : roll < EVENT_FIGHT_ODDS.elite + EVENT_FIGHT_ODDS.duel
            ? rollEliteFight(r.rng, r.tier)
              ? 'elite'
              : 'duel'
            : null;
      const foe = ambush
        ? ambushEnemy(
            r.rng,
            enemyRealms(r),
            ambush,
            r.map.nodes.map((n) => n.enemyId),
            depthOf(r.tier),
            r.tier,
            !!r.map.themed,
          )
        : null;
      if (ambush && foe) {
        // the stop becomes that fight, and is played, rewarded and (if lost) retried like any other
        node.kind = ambush;
        node.enemyId = foe;
        r.phase = 'duel';
        r.eventResult = `Ambush! ${encounter(foe).name} was waiting${ambush === 'elite' ? ' (an Elite)' : ''}.`;
        break;
      }
      r.context.event = rollEvent(r);
      r.phase = 'event';
      break;
    }
  }
  return r;
}

export interface FightPlan {
  encounterId: string;
  /** enemy unit ids, front to back */
  units: string[];
  deck: string[];
  /** the HP you enter with (and restart with after a loss) */
  hp: number;
  maxHp: number;
  maxHpBeforeHeart?: number;
  tier: number;
  boons: string[];
  potions: string[];
  /** percent of the designed enemy HP and damage: the tier table for this tier and stage (tierTable.ts), scaled by the difficulty's ratio to Normal */
  hpPct: number;
  dmgPct: number;
  kind: MapNode['kind'];
  /** a seed that changes on each retry, so a lost fight is not replayed identically */
  seed: string;
  /** this Warden is a ghost: the deck to fight (played by the computer), and its HP (the usual Warden below is not fought) */
  ghost?: GhostBoss & {
    hp: number;
    dmgPct: number;
  };
  /** the Ascendancy the run has taken */
  ascendancy?: string;
  /** what the tier's Omens change about the enemies (DECISIONS #245) */
  mods: EnemyMod[];
  /** what the Omens start you with */
  heroStatuses: Partial<Record<StatusId, number>>;
}

// Campaign ghosts use their own straight-line curve. Their decks already develop with tier;
// multiplying saved Max HP by the normal enemy curve compounded that growth (#575).
export const GHOST_BOSS_HP_BASE = 2.2;
/** Additional multiples of the class's base HP per Rift Tier. */
export const GHOST_HP_PER_TIER = 0.2;
/** Percentage points of card damage per Rift Tier, starting at 100%. */
export const GHOST_DAMAGE_PER_TIER = 3;
/** Saved Max HP contributes an additive bonus, capped at this share of class base HP. */
export const GHOST_MAX_HP_BONUS_PCT = 50;
/** The Max HP a Warden leaves you: 3 to Tier IV, one more every five tiers (4 from Tier V, 5 from Tier X, 7 at Tier XX). */
export const wardenMaxHp = (tier: number): number => 3 + Math.floor(Math.max(1, tier) / 5);

/** Legacy stages divide a tier's increment into thirds; current runs always use stage 1. */
const ghostProgress = (tier: number, stage: number): number =>
  Math.max(0, Math.min(20, Math.round(tier)) - (GHOST_FROM_TIER + 1)) +
  (Math.max(1, Math.min(3, Math.round(stage))) - 1) / 3;
/** Saved HP is credited once, never multiplied by tier or used to inflate other scaling. */
export const ghostBossHp = (hero: string, tier: number, stage = 1, maxHp?: number): number => {
  const base = RIFTWALKERS[hero as keyof typeof RIFTWALKERS]?.hero.maxHp ?? 80;
  const saved = maxHp !== undefined && Number.isFinite(maxHp) ? maxHp : base;
  const bonus = Math.min(Math.max(0, saved - base), (base * GHOST_MAX_HP_BONUS_PCT) / 100);
  return Math.round(
    base * (GHOST_BOSS_HP_BASE + GHOST_HP_PER_TIER * ghostProgress(tier, stage)) + bonus,
  );
};
/** Same fixed increase through Tier XX: no late-tier ramp or Warden's Fury multiplier. */
export const ghostBossDmg = (tier: number, stage = 1): number =>
  Math.round(100 + GHOST_DAMAGE_PER_TIER * ghostProgress(tier, stage));

/** Is this a ghost Warden whose deck has not been fetched yet? (The screen asks the server for one, then calls `attachGhost`.) */
export function ghostWanted(run: RunState): boolean {
  if (!CAMPAIGN_GHOSTS_ENABLED) return false;
  if (run.phase !== 'duel' || !run.context) return false;
  const node = nodeOf(run, run.context.nodeId);
  return node.ghost === true && !run.context.ghost && !run.context.ghostAsked;
}

/** A ghost that arrives from the network is checked before it is believed: a real Riftwalker, real cards, a sane size. */
export function checkGhostBoss(raw: unknown): GhostBoss | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const g = raw as Record<string, unknown>;
  const sent = g['hero'];
  // (an id from before the Riftwalkers were named for their class is read as the class)
  const hero = typeof sent === 'string' ? canonicalHero(sent) : sent;
  if (typeof hero !== 'string' || !Object.hasOwn(RIFTWALKERS, hero)) return null;
  const rawDeck = g['deck'];
  // (a ghost saved before a card was taken out of the game plays its replacement: DECISIONS #312)
  const deck = Array.isArray(rawDeck)
    ? rawDeck.map((c: unknown) => (typeof c === 'string' ? canonicalCard(c) : c))
    : rawDeck;
  const sentBoons = g['boons'];
  const ascendancy = ascendancyOf(hero, g['ascendancy'])?.id;
  if (!Array.isArray(deck) || deck.length < V2_DECK_RULES.minSize || deck.length > 80) return null;
  // (sanctified and engraved cards are real cards of that deck: isDeckCard knows them)
  if (!deck.every(isDeckCard)) return null;
  if (!Array.isArray(sentBoons) || sentBoons.length > 12) return null;
  // (a ghost saved with a Boon that has been taken out of the game plays without it)
  const boons = sentBoons.filter(
    (b): b is string => typeof b === 'string' && Object.hasOwn(COMBAT_DB.boons, b),
  );
  const name = typeof g['name'] === 'string' ? g['name'].slice(0, 40) : 'A rival';
  const tier = typeof g['tier'] === 'number' && Number.isInteger(g['tier']) ? g['tier'] : 1;
  const stage = typeof g['stage'] === 'number' && Number.isInteger(g['stage']) ? g['stage'] : null;
  // (a ghost is a deck that cleared Tier GHOST_BOSS_MIN_TIER: an older server might send any)
  if (!ghostCleared(tier, stage)) return null;
  const id = typeof g['id'] === 'string' && g['id'].length <= 80 ? g['id'] : undefined;
  // (the run's Max HP, a whole number in reason: anything else is the class's own)
  const sentHp = g['maxHp'];
  const maxHp =
    typeof sentHp === 'number' && Number.isInteger(sentHp) && sentHp >= 1 && sentHp <= 999
      ? sentHp
      : undefined;
  return {
    ...(id ? { id } : {}),
    ...(maxHp ? { maxHp } : {}),
    name,
    hero: hero as GhostBoss['hero'],
    deck: [...deck],
    boons: [...new Set(boons)],
    ...(ascendancy ? { ascendancy } : {}),
    tier,
    stage,
  };
}

/**
 * The ghost Warden of this stage that is not settled yet (DECISIONS #253): the screen asks the server for a ghost as the stage begins,
 * so the map only says "Ghost Warden" when there is one to fight.
 */
export function ghostToSettle(run: RunState): MapNode | null {
  if (!CAMPAIGN_GHOSTS_ENABLED) return null;
  if (run.phase === 'duel' || run.phase === 'collapsed' || run.phase === 'banked') return null;
  return run.map.nodes.find((n) => n.ghost === true && !n.ghostDeck) ?? null;
}

/** The server's answer for this stage's ghost Warden: a valid ghost is kept for the fight; none (or nothing usable), and it is the usual Warden. */
export function settleGhost(run: RunState, ghost: unknown): RunState {
  if (!CAMPAIGN_GHOSTS_ENABLED) return withoutCampaignGhosts(run);
  const at = ghostToSettle(run);
  need(at, 'No ghost Warden is waiting to be settled');
  const r = clone(run);
  const node = r.map.nodes.find((n) => n.id === at.id) as MapNode;
  const checked = checkGhostBoss(ghost);
  if (checked && ghostFits(run, checked)) node.ghostDeck = checked;
  else unGhost(node);
  return r;
}

/**
 * A checked ghost this run can meet: never from above its tier, nor more than three below it (an older server might send one), nor one the
 * server was told to skip (met already, or waiting elsewhere on this map).
 */
function ghostFits(run: RunState, g: GhostBoss): boolean {
  if (g.id !== undefined && ghostsToSkip(run).includes(g.id)) return false;
  return g.tier <= run.tier && g.tier >= run.tier - 3;
}

/** No ghost could be had for this stop: a Warden is the usual one, an Echo the plain fight it stands on. */
function unGhost(node: MapNode): void {
  delete node.ghost;
  if (node.kind === 'echo') node.kind = 'duel';
}

/**
 * The ghosts the server should not send: those already waiting on this map (a Warden's and an Echo's) and those this run has met, the
 * latest 25 in all (what one request carries; the waiting ones last, so they are never the ones cut).
 */
export function ghostsToSkip(run: RunState): string[] {
  const waiting = run.map.nodes.flatMap((n) => (n.ghostDeck?.id ? [n.ghostDeck.id] : []));
  return [...(run.ghostsMet ?? []), ...waiting].slice(-25);
}

/** The ghost for this Warden has arrived (or none could be had: null, and the usual Warden is fought). */
export function attachGhost(run: RunState, ghost: unknown): RunState {
  if (!CAMPAIGN_GHOSTS_ENABLED) return withoutCampaignGhosts(run);
  need(ghostWanted(run), 'This fight is not waiting for a ghost');
  const r = clone(run);
  const ctx = r.context as NonNullable<RunState['context']>;
  ctx.ghostAsked = true;
  const checked = checkGhostBoss(ghost);
  if (checked && ghostFits(run, checked)) meetGhost(r, checked);
  else unGhost(nodeOf(r, ctx.nodeId));
  return r;
}

/** The fight at the current node is this ghost: it is remembered (never met twice in a run) and said plainly. */
function meetGhost(r: RunState, g: GhostBoss): void {
  const ctx = r.context as NonNullable<RunState['context']>;
  ctx.ghost = g;
  ctx.ghostAsked = true;
  // (the latest 25: what one request to the server carries)
  if (g.id) r.ghostsMet = [...(r.ghostsMet ?? []), g.id].slice(-25);
  // said plainly, so nobody takes it for the realm's usual Warden
  const who = classNameOf(g.hero, g.ascendancy);
  const a = /^[AEIOU]/.test(who) ? 'an' : 'a';
  // (whose deck it is stays unsaid: a ghost in the campaign is a nameless challenger)
  r.eventResult =
    nodeOf(r, ctx.nodeId).kind === 'echo'
      ? `Echo! A ghost stands here: ${a} ${who} deck from the Arena (Tier ${g.tier}), played by the computer. Beat it and take one of its cards.`
      : `Ghost Warden! This Warden is ${a} ${who} deck from the Arena (Tier ${g.tier}), played by the computer.`;
}

/** An Echo is a ghost met on the way, not a Warden: this share (percent) of a ghost Warden's HP, and its damage without Warden's Fury. */
export const ECHO_HP_PCT = 60;
/** Campaign ghosts add no opening penalty; ordinary tier Omens still apply. */
export const GHOST_FALTERING = 0;
export const ECHO_FALTERING = 0;
/** The cards an Echo lays out when it falls: its deck's best, by rarity. */
export const ECHO_OFFERS = 3;
const RARITY_RANK: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  legendary: 4,
  ancestral: 4,
};

/**
 * The cards a fallen Echo offers (DECISIONS #549): its own cards, sanctified and engraved ones as they were, the rarest first (ties in
 * a random order), never a basic card or a token, never one your deck cannot take, nor another class's card that would be dead in yours.
 */
export function echoOffers(r: RunState, ghost: GhostBoss): string[] {
  // (a card and its "+" are one card here: the upgraded copy is the one laid out)
  const best = new Map<string, string>();
  for (const id of ghost.deck) {
    const base = id.replace(/\+$/, '');
    if (!best.get(base)?.endsWith('+')) best.set(base, id);
  }
  const fit = [...best.values()].filter((id) => {
    const c = COMBAT_DB.cards[id];
    if (!c || !c.rarity || c.rarity === 'basic' || c.source === 'token') return false;
    if (c.hero && c.hero !== r.character && deadElsewhere(id)) return false;
    return canAdd(r.deck, id);
  });
  const rank = (id: string): number => RARITY_RANK[COMBAT_DB.cards[id]?.rarity ?? ''] ?? 0;
  return shuffle(r.rng, fit)
    .sort((x, y) => rank(y) - rank(x))
    .slice(0, ECHO_OFFERS);
}

/** What the fight at the current node is. */
export function duelPlan(run: RunState): FightPlan | null {
  if (run.phase !== 'duel' || !run.context) return null;
  const node = nodeOf(run, run.context.nodeId);
  if (!node.enemyId) return null;
  const e = encounter(node.enemyId);
  const ghost = CAMPAIGN_GHOSTS_ENABLED && node.ghost ? run.context.ghost : undefined;
  // the tier's Omens: phases and guards for the enemies, a shaken start for you, Static in your draw pile
  const omen = omenEffects(run.tier, !run.campaignRoute);
  const boss = node.kind === 'elite' || node.kind === 'warden';
  const hpOf = (id: string): number => COMBAT_DB.units[id]?.maxHp ?? 0;
  const units = [...e.units];
  // Elites have a visible, fixed premium over the common curve, including promoted encounters.
  // Wardens retain their authored kits and the ordinary tier budget.
  const eliteHp = node.kind === 'elite' ? 1.25 : 1;
  const eliteDamage = node.kind === 'elite' ? 1.08 : 1;
  const echoHp = node.kind === 'echo' ? ECHO_HP_PCT / 100 : 1;
  return {
    ...(ghost
      ? {
          ghost: {
            ...ghost,
            hp: Math.round(ghostBossHp(ghost.hero, run.tier, 1, ghost.maxHp) * echoHp),
            // Ghost decks keep their independent linear curve.
            dmgPct: ghostBossDmg(run.tier),
          },
        }
      : {}),
    encounterId: e.id,
    units,
    mods: omenMods(omen, units, boss, hpOf, e.kind === 'finale'),
    heroStatuses: {
      ...omen.heroStatuses,
      // Campaign ghosts add no extra Faltering; retain the ordinary tier's Omens (#575).
      ...(ghost
        ? {
            faltering:
              (omen.heroStatuses.faltering ?? 0) +
              (node.kind === 'echo' ? ECHO_FALTERING : GHOST_FALTERING),
          }
        : {}),
    },
    ...(run.ascendancy ? { ascendancy: run.ascendancy } : {}),
    deck: [...run.deck, ...omen.fightCards],
    hp: run.hp,
    maxHp: run.maxHp,
    maxHpBeforeHeart: run.maxHp + (run.heartMaxHpLoss ?? 0),
    // the engine's own tier scaling stays off: tierTable.ts carries all of it, through hpPct and dmgPct below
    tier: 1,
    // (a Warden's Heart works in every fight like a Boon)
    boons: [...run.boons, ...(run.heart ? [run.heart] : [])],
    potions: [...run.potions],
    // the tier table sets how hard this stage of this tier is; the difficulty only matters for a run saved on Easy or Hard
    hpPct: Math.round(
      (DIFFICULTY[run.difficulty].hpPct / DIFFICULTY.normal.hpPct) *
        enemyScale(run.tier, 1).hp *
        eliteHp,
    ),
    dmgPct: Math.round(
      (DIFFICULTY[run.difficulty].dmgPct / DIFFICULTY.normal.dmgPct) *
        enemyScale(run.tier, 1).dmg *
        eliteDamage,
    ),
    kind: node.kind,
    seed: `${run.seed}:t${run.tier}:${node.id}:${run.stats.duelsLost}`,
  };
}

/** Report the result of the fight at the current node. `hpLeft` is your hero's HP at the end of a win. */
/**
 * The Resolve a lost fight costs: 1 for a plain fight or a Warden, 2 for an Elite (Robert, 2026-10-26: a Warden costs 1 "for now";
 * DECISIONS #274). The run collapses when Resolve reaches 0.
 */
/** A fight lost with Resolve left is tried again with at least this share of max HP (percent): all of it (DECISIONS #355). */
export const RETRY_HP_PCT = 100;

export function resolveCost(kind: MapNode['kind']): number {
  // (an Echo is a stop you choose to take on, as an Elite is: DECISIONS #549)
  return kind === 'elite' || kind === 'echo' ? 2 : 1;
}

/** The most max HP a card can give for good in one fight (Bloodfeast is 3 per kill): a guard against a hand-made result. */
export const MAX_HP_GAIN_PER_FIGHT = 30;

/** The most extra card rewards one fight pays (Marked for Death is one per kill): more than this are earned but not paid. */
export const MAX_EXTRA_REWARDS = 3;

export function finishDuel(
  run: RunState,
  won: boolean,
  hpLeft = run.hp,
  potionsLeft: readonly string[] = run.potions,
  /** max HP the hero gained for good in the fight (a card that raises it when it kills), at most a few per fight */
  maxHpGained = 0,
  /** extra card rewards the fight earned (a card that gives one when it kills) */
  extraRewards = 0,
): RunState {
  need(run.phase === 'duel' && run.context, 'No fight is in progress');
  const r = clone(withoutCampaignGhosts(run));
  const ctx = r.context as NonNullable<RunState['context']>;
  const node = nodeOf(r, ctx.nodeId);
  if (!won) {
    r.stats.duelsLost++;
    r.resolve = Math.max(0, r.resolve - resolveCost(node.kind));
    if (r.resolve === 0) {
      r.phase = 'collapsed';
      r.context = null;
    }
    // otherwise the same fight is retried (the phase stays 'duel') at full HP: spending Resolve heals you completely
    // (Robert, 2026-10-27; DECISIONS #289, #355)
    else r.hp = Math.max(r.hp, Math.ceil((r.maxHp * RETRY_HP_PCT) / 100));
    return r;
  }
  need(
    Number.isInteger(maxHpGained) && maxHpGained >= 0 && maxHpGained <= MAX_HP_GAIN_PER_FIGHT,
    'Invalid max HP gain at the end of a fight',
  );
  need(
    Number.isInteger(hpLeft) && hpLeft >= 1 && hpLeft <= r.maxHp + maxHpGained,
    'Invalid HP at the end of a fight',
  );
  changeMaxHp(r, maxHpGained, false);
  need(
    Number.isInteger(extraRewards) && extraRewards >= 0,
    'Invalid extra card rewards at the end of a fight',
  );
  // (copies, replays and a crowd of enemies could earn more: the extra are dropped, never a fight that cannot be reported)
  const extra = extraRewards > 0 ? { extraRewards: Math.min(MAX_EXTRA_REWARDS, extraRewards) } : {};
  need(
    Number.isInteger(hpLeft) && hpLeft >= 1 && hpLeft <= r.maxHp,
    'Invalid HP at the end of a fight',
  );
  r.stats.duelsWon++;
  r.hp = hpLeft;
  // (the "Ghost Warden!" notice belongs to that fight: it is not told again later)
  if (r.eventResult?.startsWith('Ghost Warden!') || r.eventResult?.startsWith('Echo!'))
    delete r.eventResult;
  // whatever you did not drink comes with you (never more than you started with)
  const left = [...run.potions];
  r.potions = [];
  for (const id of potionsLeft) {
    const i = left.indexOf(id);
    if (i >= 0) {
      left.splice(i, 1);
      r.potions.push(id);
    }
  }
  // Drago ends the campaign: no Gift, shards, potion, Boon, Max HP or healing, straight to the victory screen
  if (node.enemyId === 'vorthax') {
    finishCampaign(r, node.id);
    return r;
  }
  let potionGained: string | undefined;
  const elitePays = eliteRewards(r.tier);
  // (an Echo pays as an Elite does, Boon chance and all, with one of its own cards for the card reward; DECISIONS #549, #550)
  const asElite = node.kind === 'elite' || node.kind === 'echo';
  const dropChance =
    node.kind === 'duel'
      ? POTION_DROP_CHANCE.duel
      : asElite
        ? elitePays.potionPct
        : POTION_DROP_CHANCE.elite;
  if (r.potions.length < MAX_POTIONS && nextInt(r.rng, 100) < dropChance) {
    potionGained = offerPotion(r.rng);
    r.potions.push(potionGained);
  }
  const gain = Math.round(
    (node.kind === 'duel' ? FIGHT_SHARDS.duel : asElite ? elitePays.shards : FIGHT_SHARDS.warden) *
      (1 - omenEffects(r.tier, !r.campaignRoute).shardsPct / 100) *
      (1 + (r.heart ? (COMBAT_DB.boons[r.heart]?.fightShardsPct ?? 0) : 0) / 100),
  );
  // (an Elite's or an Echo's shards are one of its spoils, chosen on the reward page: DECISIONS #555)
  if (!asElite) r.shards += gain;
  // a Riftwalker whose trait heals after a won fight (Kesh's Pack Instinct; DECISIONS #285)
  const traitHeal = COMBAT_DB.heroes[r.character]?.trait?.healAfterFight;
  if (traitHeal) healAfterFight(r, traitHeal);
  for (const id of r.boons) {
    const b = COMBAT_DB.boons[id];
    if (b?.healAfterFight) healAfterFight(r, b.healAfterFight);
    if (b?.shardsPerFight) r.shards += b.shardsPerFight;
  }
  let boonGained: string | undefined;
  // Elites and Echoes give Boons (by the tier's chance); Wardens give their Gift (they used to give a Boon as well, and decks owned every
  // Boon within a few loops). A fight an event started pays the spoils it promised instead (node.bonus, set even when empty), so no second Boon.
  const fromEvent = node.bonus !== undefined;
  // (no roll while it is certain, so Tier I's runs and replays stay as they were)
  if (
    asElite &&
    !fromEvent &&
    (elitePays.boonPct >= 100 || nextInt(r.rng, 100) < elitePays.boonPct)
  ) {
    const id = offerBoon(r.rng, r.boons);
    if (id) {
      gainBoon(r, id);
      boonGained = id;
    }
  }
  if (asElite && elitePays.healPct > 0) healAfterFight(r, (r.maxHp * elitePays.healPct) / 100); // an elite leaves you a little breathing room
  if (node.kind === 'warden') {
    clearNode(r, node.id);
    // a Warden falls: you grow a little sturdier for good (more deeper in, where enemies hit harder; DECISIONS #237), and catch your breath
    const sturdier = wardenMaxHp(r.tier);
    const gained = changeMaxHp(r, sturdier);
    r.eventResult = `The Warden falls: +${gained} Max HP.`;
    healAfterFight(r, r.maxHp * 0.3);
    r.resolve = Math.min(r.maxResolve, r.resolve + 1);
    // Tier III's last Warden: the reward is an Ascendancy, in place of the Gift, a Heart and whatever the Heart of the Rift leaves. A run
    // past it without one (saved before they came) is offered it at its next Warden of any act (DECISIONS #519, #529). A new run
    // has chosen by then, as the Tier III offer cannot be passed by, and one already chosen is never offered again.
    if (!r.ascendancy && r.tier >= ASCEND_TIER) {
      r.context = {
        nodeId: node.id,
        ascendancies: ascendanciesOf(r.character).map((a) => a.id),
        // (an extra card reward the fight earned still comes, after the choice)
        ...extra,
        shardsGained: gain,
        ...(boonGained ? { boonGained } : {}),
        ...(potionGained ? { potionGained } : {}),
      };
      r.phase = 'ascend';
      return r;
    }
    // a fallen Warden sometimes leaves something behind: a Boon you do not have yet
    if (nextInt(r.rng, 100) < LOOP_BOON_CHANCE) {
      const left = offerBoon(r.rng, r.boons);
      if (left) {
        gainBoon(r, left);
        r.eventResult = `${r.eventResult} It leaves something behind: the Boon ${COMBAT_DB.boons[left]?.name ?? left}.`;
      }
    }
    // every Warden, the last one too, leaves its Gift: a card, one of two Warden's Hearts, or nothing (DECISIONS #246, #352). It is
    // the only page after a Warden: an extra card reward the fight earned (Marked for Death) is one more card to choose from on it
    // (Robert, 2026-10-28; DECISIONS #392)
    const hearts = heartOffers(r);
    const offers = giftOffers(
      r.rng,
      r.character,
      r.deck,
      (r.tier >= 5 ? 4 : 3) + (extra.extraRewards ?? 0),
      node.enemyId,
    );
    // (the Gift always has cards; only if there were neither cards nor Hearts would there be nothing to choose)
    if (offers.length === 0 && hearts.length === 0) {
      if (!nextReward(r, { nodeId: node.id, ...extra }, true)) afterGift(r);
      return r;
    }
    r.context = {
      nodeId: node.id,
      offers,
      ...(hearts.length ? { hearts } : {}),
      shardsGained: gain,
      ...(boonGained ? { boonGained } : {}),
      ...(potionGained ? { potionGained } : {}),
    };
    r.phase = 'gift';
    return r;
  }
  // an event that became a fight pays what it promised, on top of the usual reward
  if (node.bonus) {
    const said: string[] = [];
    for (const step of node.bonus) {
      try {
        const line = applyDeal(
          r,
          { id: 'd1', label: '', deal: [step] },
          { title: '', text: '', options: [], cardOffer: '' },
          {
            gainBoon,
            fail: (msg) => {
              throw new RunError(msg);
            },
          },
        );
        if (line) said.push(line);
      } catch (e) {
        // (a spoil that cannot be had now, say a full potion belt, is missed, and said so)
        said.push(`(${e instanceof Error ? e.message : 'Something'}: that spoil is lost.)`);
      }
    }
    delete node.bonus;
    if (said.length) r.eventResult = `The spoils: ${said.join(' ')}`;
  }
  const count = Math.max(2, 3 - omenEffects(r.tier, !r.campaignRoute).fewerChoices);
  // a fallen Echo lays out its own cards (the Omen that takes a choice away does not reach them); with none to give, an Elite's reward
  const echoed = node.kind === 'echo' && ctx.ghost ? echoOffers(r, ctx.ghost) : [];
  r.context = {
    nodeId: node.id,
    offers: echoed.length
      ? echoed
      : offerCards(
          r.rng,
          r.character,
          r.deck,
          asElite ? 'elite' : 'duel',
          count,
          heartCrossedChance(r),
        ),
    ...extra,
    ...(asElite ? { spoils: { shards: gain } } : { shardsGained: gain }),
    ...(boonGained ? { boonGained } : {}),
    ...(potionGained ? { potionGained } : {}),
  };
  r.phase = 'reward';
  return r;
}

/** An Elite's spoil of Max HP (DECISIONS #555): small, as a run wins about two hundred Elites, so it builds a pool over the long tiers (2 until #556 shortened the maps). */
export const ELITE_SPOIL_MAX_HP = 3;
/** An Elite's spoil of healing: this percent of Max HP (DECISIONS #555). */
export const ELITE_SPOIL_HEAL_PCT = 15;
export type Spoil = 'shards' | 'maxHp' | 'heal';

/** What each spoil gives on this reward page, for the screen. */
export function spoilAmounts(
  run: RunState,
): { shards: number; maxHp: number; heal: number } | null {
  const sp = run.context?.spoils;
  if (!sp) return null;
  return {
    shards: sp.shards,
    maxHp: (() => {
      const copy = clone(run);
      return changeMaxHp(copy, ELITE_SPOIL_MAX_HP);
    })(),
    heal: Math.min(run.maxHp - run.hp, Math.ceil((run.maxHp * ELITE_SPOIL_HEAL_PCT) / 100)),
  };
}

/** Take one of an Elite's spoils (`r` is a copy): the shards, Max HP, or a heal. */
function takeSpoil(r: RunState, spoil: Spoil): void {
  const c = r.context as NonNullable<RunState['context']>;
  const sp = c.spoils;
  need(sp, 'There are no spoils to take');
  if (spoil === 'shards') {
    r.shards += sp.shards;
    c.shardsGained = sp.shards;
    c.spoilTaken = `+${sp.shards} shards`;
  } else if (spoil === 'maxHp') {
    const gained = changeMaxHp(r, ELITE_SPOIL_MAX_HP);
    c.spoilTaken = `+${gained} Max HP`;
  } else {
    const before = r.hp;
    heal(r, (r.maxHp * ELITE_SPOIL_HEAL_PCT) / 100);
    c.spoilTaken = `healed ${r.hp - before} HP`;
  }
  delete c.spoils;
}

/** Choose an Elite's spoils on its reward page (DECISIONS #555). */
export function chooseSpoil(run: RunState, spoil: Spoil): RunState {
  need(run.phase === 'reward' && run.context?.spoils, 'There are no spoils to take');
  need(spoil === 'shards' || spoil === 'maxHp' || spoil === 'heal', 'Unknown spoil');
  need(spoil !== 'heal' || run.hp < run.maxHp, 'You are already at full HP');
  const r = clone(run);
  takeSpoil(r, spoil);
  return r;
}

/** Pick a card from the reward or the Warden's Gift, or skip it (null): every card reward can be skipped. */
/** Events, Ascendancies and unfinished Elite spoils retain their own choices. */
export function canRerollReward(run: RunState): boolean {
  const c = run.context;
  const node = run.map.nodes.find((n) => n.id === c?.nodeId);
  return (
    (run.phase === 'reward' || run.phase === 'gift') &&
    !!c?.offers?.length &&
    !c.spoils &&
    run.rewardRerollTier !== run.tier &&
    !!node &&
    ['duel', 'elite', 'warden'].includes(node.kind)
  );
}

export function rerollReward(run: RunState): RunState {
  need(canRerollReward(run), 'No card reward reroll available');
  const r = clone(run);
  const c = r.context!;
  const node = nodeOf(r, c.nodeId);
  const count = c.offers!.length;
  c.offers =
    r.phase === 'gift'
      ? giftOffers(r.rng, r.character, r.deck, count)
      : offerCards(
          r.rng,
          r.character,
          r.deck,
          node.kind === 'duel' ? 'duel' : 'elite',
          count,
          heartCrossedChance(r),
        );
  r.rewardRerollTier = r.tier;
  return r;
}

export function chooseCard(run: RunState, cardId: string | null): RunState {
  need(run.phase === 'reward' || run.phase === 'gift', 'There is no card reward to choose from');
  const ctx = run.context;
  need(ctx?.offers, 'There is nothing on offer');
  const r = clone(run);
  const c = r.context as NonNullable<RunState['context']>;
  // (spoils left untaken are the shards, as an Elite paid before there was a choice)
  if (c.spoils) takeSpoil(r, 'shards');
  if (cardId === null) {
    // any card reward, the Warden's Gift included, can be skipped
  } else {
    need(c.offers?.includes(cardId), 'That card is not on offer');
    need(canAdd(r.deck, cardId), 'That card would break the deck rules');
    r.deck.push(cardId);
  }
  if (r.phase !== 'gift' && nextReward(r, c, c.afterWarden === true)) return r;
  if (r.phase === 'gift' || c.afterWarden) afterGift(r);
  else if (c.nodeId === '') {
    // a card chosen at the Threshold or a Waymark: no node is behind it
    r.context = null;
    r.phase = 'map';
  } else {
    clearNode(r, c.nodeId);
    r.phase = 'map';
  }
  return r;
}

/** The Omen of Rift Scars leaves no more than this many Wounds in a deck. */
export const MAX_SCARS = 6;
/** The Omen of Rift Scars: each new act leaves its Wounds in the deck, and the Waymark says so (DECISIONS #515). Call after opening it. */
function scarDeck(r: RunState): void {
  let added = 0;
  const held = r.deck.filter((id) => id === 'wound').length;
  for (
    let i = 0;
    i < omenEffects(r.tier, !r.campaignRoute).actWounds && held + i < MAX_SCARS;
    i++
  ) {
    r.deck.push('wound');
    added++;
  }
  const offer = r.context?.prelude;
  if (added > 0 && offer)
    offer.text += ` Rift Scars: ${added === 1 ? 'a Wound joins' : `${added} Wounds join`} your deck.`;
}

/**
 * A run saved before it left the old starting choice (the kits of DECISIONS #333, the two uncommons of #365): it starts again at
 * The Threshold with the plain starting deck (changes `run`, which must be a copy).
 */
export function restartAtThreshold(run: RunState): void {
  run.deck = [...RIFTWALKERS[run.character].starter];
  openPrelude(run, 'threshold');
}

// ---- the choice at the start of a run or a stage
/** Take one of the options on offer: its effects happen now, then the map opens. */
export function choosePrelude(run: RunState, optionId: string): RunState {
  need(run.phase === 'prelude' && run.context?.prelude, 'There is no choice to make here');
  const offer = run.context.prelude;
  const option = offer.options.find((o) => o.id === optionId);
  need(option, 'That is not one of the options');
  const r = clone(run);
  delete r.eventResult; // (so the result is shown even when its words match an earlier one)
  // a bargain that pays HP for a Legendary must be able to give one (the deck may already hold its limit)
  for (const e of option.effects)
    if (e.k === 'pick')
      need(
        threeToChoose(clone(r), e.rarity, false, e.kind).length > 0,
        'There is no card of that kind left for your deck',
      );
  for (const e of option.effects)
    if (e.k === 'card' && e.rarity === 'legendary')
      need(
        cardOfRarity(clone(r.rng), r.character, r.deck, 'legendary'),
        'Your deck already holds as many Legendary cards as it can',
      );
  const told: string[] = [];
  for (const e of option.effects) {
    const line = applyEffect(r, e);
    if (line) told.push(line);
  }
  // what chance decided (which card was upgraded, what came up) is told once, so nothing happens out of sight
  if (told.length) r.eventResult = told.join(' ');
  else delete r.eventResult;
  r.phase = 'map';
  r.context = null;
  // a card to choose: three on the table, taken (or skipped) on the card reward screen before the map
  const pick = option.effects.find((e) => e.k === 'pick');
  if (pick?.k === 'pick') {
    const offers = threeToChoose(r, pick.rarity, pick.upgraded === true, pick.kind);
    if (offers.length) {
      r.phase = 'reward';
      r.context = { nodeId: '', offers };
    }
  }
  return r;
}

/** The cards a pick of this rarity and kind draws from. Draws nothing from the run's random stream. */
function pickPool(r: RunState, rarity: PickRarity, kind?: 'attack' | 'skill'): string[] {
  const fits = (id: string) =>
    COMBAT_DB.cards[id]?.rarity === rarity &&
    (!kind || COMBAT_DB.cards[id]?.kind === kind) &&
    canAdd(r.deck, id);
  const own = rarity === 'ancestral' ? ancestralPool(r.deck) : rewardPool(r.character).filter(fits);
  const mine = own.filter(
    (id) => rarity === 'ancestral' || COMBAT_DB.cards[id]?.hero === r.character,
  );
  return [...(mine.length >= 3 ? mine : own)];
}

/**
 * Three different cards of a rarity to choose from: the Riftwalker's own (a Neutral card only when the class runs short), the
 * "+" versions if asked. Ancestral cards have no class.
 */
function threeToChoose(
  r: RunState,
  rarity: PickRarity,
  upgraded: boolean,
  kind?: 'attack' | 'skill',
): string[] {
  const out: string[] = [];
  const pool = pickPool(r, rarity, kind);
  while (out.length < 3 && pool.length)
    out.push(pool.splice(nextInt(r.rng, pool.length), 1)[0] as string);
  return upgraded ? out.map((id) => COMBAT_DB.cards[id]?.upgrade ?? id) : out;
}
type PickRarity = Extract<PreludeEffect, { k: 'pick' }>['rarity'];

const nameOfCard = (id: string): string => COMBAT_DB.cards[id]?.name ?? id;
const listOf = (all: readonly string[]): string => {
  // (two of the same card read "Strike (x2)", never "Strike and Strike")
  const counts = new Map<string, number>();
  for (const n of all) counts.set(n, (counts.get(n) ?? 0) + 1);
  const names = [...counts].map(([n, c]) => (c > 1 ? `${n} (x${c})` : n));
  return names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
};

/** The Strike and Defend cards a deck can still lose or change: Neutral basics. */
const isPlainBasic = (id: string): boolean =>
  markOf(id) === null &&
  COMBAT_DB.cards[id]?.hero === 'neutral' &&
  COMBAT_DB.cards[id]?.rarity === 'basic';

/** Apply one effect; the answer says what chance decided (null when the option's own text already says it all). */
function applyEffect(r: RunState, e: PreludeEffect): string | null {
  switch (e.k) {
    case 'maxHp':
      changeMaxHp(r, e.n, true, 10);
      return null;
    case 'heal':
      heal(r, (r.maxHp * e.pct) / 100);
      return null;
    case 'hp':
      r.hp = Math.max(1, r.hp - e.n);
      return null;
    case 'shards':
      r.shards += e.n;
      return null;
    case 'card': {
      const id = cardOfRarity(r.rng, r.character, r.deck, e.rarity);
      if (!id) return null;
      r.deck.push(id);
      return `${nameOfCard(id)} joins your deck.`;
    }
    case 'upgrade': {
      const done: string[] = [];
      for (let i = 0; i < e.n; i++) {
        const all = r.deck.flatMap((id, at) => (COMBAT_DB.cards[id]?.upgrade ? [at] : []));
        // (your own cards first: an upgraded Strike is the least of upgrades)
        const real = all.filter((at) => !isPlainBasic(r.deck[at] as string));
        const slots = real.length ? real : all;
        if (!slots.length) break;
        const at = slots[nextInt(r.rng, slots.length)] as number;
        const was = r.deck[at] as string;
        r.deck[at] = COMBAT_DB.cards[was]?.upgrade ?? was;
        done.push(nameOfCard(was));
      }
      if (!done.length) return 'There was no card left to upgrade.';
      return `${listOf(done)} ${new Set(done).size === 1 && done.length === 1 ? 'is' : 'are'} upgraded.`;
    }
    case 'remove': {
      const gone: string[] = [];
      for (let i = 0; i < e.n && r.deck.length > V2_DECK_RULES.minSize; i++) {
        const at = r.deck.findIndex((id) => isPlainBasic(id) && (!e.only || id === e.only));
        if (at < 0) break;
        gone.push(nameOfCard(r.deck[at] as string));
        r.deck.splice(at, 1);
      }
      return gone.length ? `${listOf(gone)} leave${gone.length === 1 ? 's' : ''} your deck.` : null;
    }
    case 'boon': {
      const id = offerBoon(r.rng, r.boons);
      if (!id) return null;
      gainBoon(r, id);
      return `You gain the Boon ${COMBAT_DB.boons[id]?.name ?? id}.`;
    }
    case 'potion': {
      if (r.potions.length >= MAX_POTIONS)
        return 'Your belt is full, so the potion is left behind.';
      const id = offerPotion(r.rng);
      r.potions.push(id);
      return `You take ${COMBAT_DB.potions[id]?.name ?? 'a potion'}.`;
    }
    case 'resolve':
      r.resolve = Math.min(r.maxResolve, r.resolve + e.n);
      return null;
    case 'wound':
      for (let i = 0; i < e.n; i++) r.deck.push('wound');
      return null;
    case 'transform': {
      const made: string[] = [];
      for (let i = 0; i < e.n; i++) {
        const at = r.deck.findIndex(isPlainBasic);
        if (at < 0) break;
        const from = nameOfCard(r.deck[at] as string);
        r.deck.splice(at, 1);
        const rarity = e.better
          ? nextInt(r.rng, 3) === 0
            ? 'rare'
            : 'uncommon'
          : nextInt(r.rng, 3) === 0
            ? 'uncommon'
            : 'common';
        const id = cardOfRarity(r.rng, r.character, r.deck, rarity);
        if (id) {
          r.deck.push(id);
          made.push(`${from} becomes ${nameOfCard(id)}.`);
        }
      }
      return made.length ? made.join(' ') : null;
    }
    case 'pick':
      // the choice itself comes after (see choosePrelude)
      return null;
  }
}

// ---- shrine -------------------------------------------------------------------------------------------
export type ShrineChoice =
  | { kind: 'rest' }
  | { kind: 'upgrade'; card: string }
  | { kind: 'remove'; card: string }
  // the Gambler's Shrine's wagers (Tier GAMBLER_TIER and up)
  | { kind: 'sacrifice'; card: string; take: string }
  | { kind: 'dice'; card: string }
  | { kind: 'engrave'; card: string }
  | { kind: 'ledger' };

/** Which cards in a deck can be upgraded at a shrine. */
export function upgradable(deck: readonly string[]): string[] {
  return [...new Set(deck.filter((id) => !!COMBAT_DB.cards[id]?.upgrade))];
}

export function takeShrine(run: RunState, choice: ShrineChoice): RunState {
  need(run.phase === 'shrine' && run.context, 'You are not at a shrine');
  const refinement = nodeOf(run, run.context.nodeId).refinement;
  need(
    !refinement || choice.kind === 'upgrade' || choice.kind === 'remove',
    'This shrine only upgrades or removes one card',
  );
  const g = run.context.gambler;
  need(!g || !g.taken.includes(choice.kind), 'You have taken that blessing here already');
  const wager: ShrineKind[] = ['sacrifice', 'dice', 'engrave', 'ledger'];
  need(!!g || !wager.includes(choice.kind), "Only a Gambler's Shrine takes wagers");
  // (one thing a visit, DECISIONS #538: a reel that was spun is the visit's choice, so its prize is taken or walked away from)
  need(
    !g || g.taken.length < GAMBLER_BLESSINGS - 1 || run.context.event?.trial?.state !== 'won',
    'You spun the reel here: take its prize, or walk away',
  );
  const r = clone(run);
  const gs = (r.context as NonNullable<RunState['context']>).gambler;
  if (gs) delete gs.note;
  if (choice.kind === 'rest') {
    heal(r, restHeal(r));
  } else if (choice.kind === 'upgrade') {
    const i = r.deck.indexOf(choice.card);
    need(i >= 0, 'That card is not in your deck');
    const up = COMBAT_DB.cards[choice.card]?.upgrade;
    need(up, 'That card cannot be upgraded');
    r.deck[i] = up;
  } else if (choice.kind === 'remove') {
    need(
      r.deck.length > V2_DECK_RULES.minSize,
      `A deck cannot go below ${V2_DECK_RULES.minSize} cards`,
    );
    const i = r.deck.indexOf(choice.card);
    need(i >= 0, 'That card is not in your deck');
    r.deck.splice(i, 1);
  } else if (gs) {
    wagerAt(r, gs, choice);
  }
  const ctx = r.context as NonNullable<RunState['context']>;
  // (a Gambler's Shrine that gave more than one blessing would stay open for the next; it gives one since DECISIONS #538)
  if (gs) {
    gs.taken.push(choice.kind);
    if (gs.taken.length < GAMBLER_BLESSINGS) return r;
    // (the shrine closes: what the last wager did is told as the stop's news)
    if (gs.note) r.eventResult = gs.note;
  }
  clearNode(r, ctx.nodeId);
  r.phase = 'map';
  return r;
}

/** A Shrine (a Gambler's Shrine too) can be walked away from at any time, with (the rest of) its blessings left untaken. */
export function leaveShrine(run: RunState): RunState {
  need(run.phase === 'shrine' && run.context, 'You are not at a shrine');
  const r = clone(run);
  clearNode(r, (r.context as NonNullable<RunState['context']>).nodeId);
  r.phase = 'map';
  return r;
}

/** One of the Gambler's Shrine's wagers, done to the run (`r` is already a copy). */
function wagerAt(
  r: RunState,
  g: NonNullable<NonNullable<RunState['context']>['gambler']>,
  choice: Exclude<ShrineChoice, { kind: 'rest' | 'upgrade' | 'remove' }>,
): void {
  const name = (id: string): string => COMBAT_DB.cards[id]?.name ?? id;
  if (choice.kind === 'ledger') {
    const gain = ledgerGain(r);
    r.ledger = (r.ledger ?? 0) + 1;
    const gained = changeMaxHp(r, gain);
    g.note = `You sign the Ledger (${r.ledger} ${r.ledger === 1 ? 'time' : 'times'} now): +${gained} Max HP. The next signature gives ${ledgerGain(r)} before Heart modifiers.`;
    return;
  }
  const i = r.deck.indexOf(choice.card);
  need(i >= 0, 'That card is not in your deck');
  if (choice.kind === 'sacrifice') {
    need(g.altar.includes(choice.take), 'That card is not on the altar');
    const rest = r.deck.filter((_, j) => j !== i);
    need(canAdd(rest, choice.take), 'Your deck cannot take another copy of that card');
    r.deck[i] = choice.take;
    g.note = `${name(choice.card)} burns on the altar, and ${name(choice.take)} is yours.`;
  } else if (choice.kind === 'dice') {
    need(diceable(r.deck).includes(choice.card), 'The dice cannot change that card');
    const up = nextInt(r.rng, 100) < diceOdds(r.tier);
    r.deck[i] = rolledId(choice.card, up ? 1 : -1);
    g.note = up
      ? `The dice come up high: ${name(choice.card)} is sanctified, its numbers 25% stronger.`
      : `The dice come up low: ${name(choice.card)} is sanctified, its numbers 25% weaker.`;
  } else {
    need(engravable(r.deck, g.chisel).includes(choice.card), 'The chisel cannot cut that card');
    r.deck[i] = markedId(choice.card, g.chisel);
    g.note = `${MARK_INFO[g.chisel].name} is cut into ${name(choice.card)}: it ${MARK_INFO[g.chisel].text}.`;
  }
}

/** Putting a merchant's card on hold: pay this share of its price now... */
export const HOLD_DEPOSIT = 0.2;
/** ...and it waits at the next merchant for this share of its price (so holding it costs 90% in all). */
export const HOLD_LATER = 0.7;
/** How many cards can be on hold at once. */
export const MAX_HELD = 3;

/** End one hold on `cardId` (the card was bought, or the hold let go). */
function dropHold(r: RunState, cardId: string): void {
  const at = r.held?.findIndex((h) => h.cardId === cardId) ?? -1;
  if (!r.held || at < 0) return;
  r.held.splice(at, 1);
  if (!r.held.length) delete r.held;
}

/** Put a card the merchant is selling on hold: pay a deposit now, and buy it for less at your next merchant. Up to MAX_HELD cards at a time. */
export function holdCard(run: RunState, index: number): RunState {
  need(run.phase === 'merchant' && run.context?.merchant, 'You are not at a merchant');
  const r = clone(run);
  const m = (r.context as NonNullable<RunState['context']>).merchant as NonNullable<
    NonNullable<RunState['context']>['merchant']
  >;
  const item = m.items[index];
  need(item && !item.sold && !item.onHold, 'That cannot be put on hold');
  need(!item.held, 'That card is already on hold for you');
  // (a sale price is for this visit only: it does not stack with a hold's)
  need(!item.sale, 'A card on sale cannot be put on hold');
  need((r.held?.length ?? 0) < MAX_HELD, `You can only hold ${MAX_HELD} cards at a time`);
  const deposit = Math.ceil(item.price * HOLD_DEPOSIT);
  need(r.shards >= deposit, 'Not enough shards for the deposit');
  r.shards -= deposit;
  (r.held ??= []).push({ cardId: item.cardId, price: Math.ceil(item.price * HOLD_LATER) });
  item.onHold = true;
  return r;
}

/**
 * Let a hold go: you no longer want that card. A card put on hold at this visit goes back on sale at its full price; a card that was
 * waiting for you from an earlier visit is taken off the table. Either way the hold is over, and the deposit is not refunded.
 */
export function releaseHold(run: RunState, index: number): RunState {
  need(run.phase === 'merchant' && run.context?.merchant, 'You are not at a merchant');
  const r = clone(run);
  const m = (r.context as NonNullable<RunState['context']>).merchant as NonNullable<
    NonNullable<RunState['context']>['merchant']
  >;
  const item = m.items[index];
  need(item && (item.onHold || item.held) && !item.sold, 'There is no hold on that card');
  dropHold(r, item.cardId);
  if (item.held) m.items.splice(index, 1);
  else delete item.onHold;
  return r;
}

// ---- merchant -----------------------------------------------------------------------------------------
export function buyCard(run: RunState, index: number): RunState {
  need(run.phase === 'merchant' && run.context?.merchant, 'You are not at a merchant');
  const r = clone(run);
  const m = (r.context as NonNullable<RunState['context']>).merchant as NonNullable<
    NonNullable<RunState['context']>['merchant']
  >;
  const item = m.items[index];
  need(item && !item.sold && !item.onHold, 'That is not for sale');
  need(r.shards >= item.price, 'Not enough shards');
  need(canAdd(r.deck, item.cardId), 'That card would break the deck rules');
  r.shards -= item.price;
  item.sold = true;
  r.deck.push(item.cardId);
  // buying the card you put on hold ends the hold
  if (item.held) dropHold(r, item.cardId);
  return r;
}

export function buyPotion(run: RunState, index: number): RunState {
  need(run.phase === 'merchant' && run.context?.merchant?.potions, 'There are no potions for sale');
  const r = clone(run);
  const m = (r.context as NonNullable<RunState['context']>).merchant as NonNullable<
    NonNullable<RunState['context']>['merchant']
  >;
  const item = m.potions?.[index];
  need(item && !item.sold, 'That is not for sale');
  need(r.potions.length < MAX_POTIONS, `You can only carry ${MAX_POTIONS} potions`);
  need(r.shards >= item.price, 'Not enough shards');
  r.shards -= item.price;
  item.sold = true;
  r.potions.push(item.id);
  return r;
}

/** What the merchant pays for a potion from your belt: half its shop price. */
export function potionSellPrice(id: string): number {
  return Math.floor((POTION_PRICE[COMBAT_DB.potions[id]?.rarity ?? 'common'] ?? 40) / 2);
}

/** Sell the potion at `index` of your belt to the merchant. */
export function sellPotion(run: RunState, index: number): RunState {
  need(run.phase === 'merchant' && run.context?.merchant, 'There is no merchant here');
  const r = clone(run);
  const id = r.potions[index];
  need(id !== undefined, 'You have no potion there');
  r.potions.splice(index, 1);
  r.shards += potionSellPrice(id);
  return r;
}

export function buyBoon(run: RunState): RunState {
  need(run.phase === 'merchant' && run.context?.merchant?.boon, 'There is no boon for sale');
  const r = clone(run);
  const m = (r.context as NonNullable<RunState['context']>).merchant as NonNullable<
    NonNullable<RunState['context']>['merchant']
  >;
  const b = m.boon as NonNullable<typeof m.boon>;
  need(!b.sold, 'That is sold');
  need(r.shards >= b.price, 'Not enough shards');
  r.shards -= b.price;
  b.sold = true;
  gainBoon(r, b.id);
  return r;
}

export function buyRemoval(run: RunState, card: string): RunState {
  need(run.phase === 'merchant' && run.context?.merchant, 'You are not at a merchant');
  const r = clone(run);
  const m = (r.context as NonNullable<RunState['context']>).merchant as NonNullable<
    NonNullable<RunState['context']>['merchant']
  >;
  need(r.shards >= m.removePrice, 'Not enough shards');
  need(
    r.deck.length > V2_DECK_RULES.minSize,
    `A deck cannot go below ${V2_DECK_RULES.minSize} cards`,
  );
  const i = r.deck.indexOf(card);
  need(i >= 0, 'That card is not in your deck');
  r.shards -= m.removePrice;
  r.deck.splice(i, 1);
  m.removed = true;
  r.removals = (r.removals ?? 0) + 1;
  // (as many as you can pay for, each double the last at this shop; the next shop starts over: DECISIONS #493)
  m.removePrice *= 2;
  return r;
}

/** Have the merchant upgrade a card in your deck. Each one bought at this shop makes the next cost more; the next shop starts over. */
export function buyUpgrade(run: RunState, card: string): RunState {
  need(run.phase === 'merchant' && run.context?.merchant, 'You are not at a merchant');
  const r = clone(run);
  const m = (r.context as NonNullable<RunState['context']>).merchant as NonNullable<
    NonNullable<RunState['context']>['merchant']
  >;
  const i = r.deck.indexOf(card);
  need(i >= 0, 'That card is not in your deck');
  const up = COMBAT_DB.cards[card]?.upgrade;
  need(up, 'That card cannot be upgraded');
  const price = shopPrice(r, upgradePrice(m.upgrades ?? 0));
  need(r.shards >= price, 'Not enough shards');
  r.shards -= price;
  r.deck[i] = up;
  m.upgrades = (m.upgrades ?? 0) + 1;
  return r;
}

export function leaveMerchant(run: RunState): RunState {
  need(run.phase === 'merchant' && run.context, 'You are not at a merchant');
  const r = clone(run);
  clearNode(r, (r.context as NonNullable<RunState['context']>).nodeId);
  r.phase = 'map';
  return r;
}

// ---- event --------------------------------------------------------------------------------------------
export function chooseEvent(run: RunState, option: EventOption['id']): RunState {
  need(run.phase === 'event' && run.context?.event, 'There is no event here');
  const r = clone(run);
  const ev = (r.context as NonNullable<RunState['context']>).event as NonNullable<
    NonNullable<RunState['context']>['event']
  >;
  need(!ev.choose && !ev.chooseDeck, 'Choose one of the cards first');
  need(
    ev.options.some((o) => o.id === option),
    'That is not an option',
  );
  delete r.eventFlips;
  r.eventResult = resolveEvent(r, option, ev, {
    gainBoon,
    fail: (msg) => {
      throw new RunError(msg);
    },
  });
  // a choice of cards to make: the event waits for it (see pickEventCard, pickDeckCard)
  if (ev.choose || ev.chooseDeck) {
    need(!ev.fight, 'An event option cannot both ask for a card and start a fight');
    return r;
  }
  // the option starts a fight: the stop becomes that fight, played, rewarded and retried like any other (as an ambush is)
  if (ev.fight) {
    const ctx = r.context as NonNullable<RunState['context']>;
    const node = nodeOf(r, ctx.nodeId);
    const kind =
      ev.fight.kind === 'duel' && rollEliteFight(r.rng, r.tier) ? 'elite' : ev.fight.kind;
    const foe = ambushEnemy(
      r.rng,
      enemyRealms(r),
      kind,
      r.map.nodes.map((n) => n.enemyId),
      depthOf(r.tier),
      r.tier,
      !!r.map.themed,
    );
    need(foe, 'There is nothing here to fight');
    node.kind = kind;
    node.enemyId = foe;
    // (the event's own Boon, if the spoils include it, is named now: the event is gone by the time the fight is won)
    node.bonus = pinBoon(ev.fight.bonus ?? [], ev.boonOffer);
    r.context = { nodeId: ctx.nodeId };
    r.phase = 'duel';
    r.eventResult = `${r.eventResult ? `${r.eventResult} ` : ''}${encounter(foe).name} stands in your way${kind === 'elite' ? ' (an Elite)' : ''}.`;
    return r;
  }
  clearNode(r, (r.context as NonNullable<RunState['context']>).nodeId);
  r.phase = 'map';
  return r;
}

/** The steps with "the event's Boon" replaced by that exact Boon (inside chances too). */
function pinBoon(steps: DealStep[], id: string | undefined): DealStep[] {
  return steps.flatMap((st): DealStep[] => {
    if (st.k === 'boon') return id ? [{ k: 'boonOf', id }] : [];
    if (st.k === 'chance') return [{ ...st, win: pinBoon(st.win, id), lose: pinBoon(st.lose, id) }];
    return [st];
  });
}

/** Choose the card of your deck an event asked for (to upgrade, remove, transform or tag it), which ends the event. */
export function pickDeckCard(run: RunState, cardId: string): RunState {
  need(run.phase === 'event' && run.context?.event?.chooseDeck, 'There is no choice to make here');
  const r = clone(run);
  const ctx = r.context as NonNullable<RunState['context']>;
  const ev = ctx.event as NonNullable<typeof ctx.event>;
  const said = applyChoice(r, ev.chooseDeck as NonNullable<typeof ev.chooseDeck>, cardId, (msg) => {
    throw new RunError(msg);
  });
  delete ev.chooseDeck;
  r.eventResult = r.eventResult ? `${r.eventResult} ${said}` : said;
  clearNode(r, ctx.nodeId);
  r.phase = 'map';
  return r;
}

/**
 * Take one of the cards an event laid out for a choice (three cards from other Riftwalkers), or none of them (null): no event ever
 * forces a card into your deck. Either way the event ends; what the option cost has been paid.
 */
export function pickEventCard(run: RunState, index: number | null): RunState {
  need(run.phase === 'event' && run.context?.event?.choose, 'There is no choice to make here');
  const r = clone(run);
  const ctx = r.context as NonNullable<RunState['context']>;
  if (index === null) {
    const said = 'You leave the cards where they lie.';
    r.eventResult = r.eventResult ? `${r.eventResult} ${said}` : said;
    clearNode(r, ctx.nodeId);
    r.phase = 'map';
    return r;
  }
  const id = (ctx.event as NonNullable<typeof ctx.event>).choose?.cards[index];
  need(id, 'That is not one of the cards');
  need(canAdd(r.deck, id), 'That card would break the deck rules');
  r.deck.push(id);
  r.eventResult = `You take ${COMBAT_DB.cards[id]?.name ?? 'the card'}: not your class's card, but yours now.`;
  clearNode(r, ctx.nodeId);
  r.phase = 'map';
  return r;
}

/**
 * Pay for a spin of an elite event's reel (see spinReel in trials.ts). The prize it stops on is now on the table: take it with
 * claimTrialPrize, or spin again.
 */
export function rollTrial(run: RunState): RunState {
  need(
    (run.phase === 'event' || run.phase === 'shrine') &&
      (run.context?.event?.trial?.state === 'open' || run.context?.event?.trial?.state === 'won'),
    'There is no reel here',
  );
  const r = clone(run);
  const ctx = r.context as NonNullable<RunState['context']>;
  spinReel(r, ctx.event as NonNullable<typeof ctx.event>, (msg) => {
    throw new RunError(msg);
  });
  return r;
}

/**
 * A run that is loaded while a trial was being played (the page was closed, the connection dropped, the run was reopened):
 * the trial counts as failed, with nothing for trying, and the run moves on. Any other run comes back unchanged.
 */
export function settleInterrupted(run: RunState): { run: RunState; notice: string | null } {
  if (run.phase !== 'event' || run.context?.event?.trial?.state !== 'playing')
    return { run, notice: null };
  const r = clone(run);
  const ctx = r.context as NonNullable<RunState['context']>;
  r.eventResult =
    'You left the game unfinished, so it counts as failed. The way closes, and you move on.';
  clearNode(r, ctx.nodeId);
  r.phase = 'map';
  return { run: r, notice: r.eventResult };
}

/** Take one of the prizes of a trial that was won. */
export function claimTrialPrize(
  run: RunState,
  prize: string,
  pick?: number,
  cards?: readonly string[],
): RunState {
  need(
    (run.phase === 'event' || run.phase === 'shrine') && run.context?.event?.trial?.state === 'won',
    'There is no prize here',
  );
  const r = clone(run);
  const ctx = r.context as NonNullable<RunState['context']>;
  r.eventResult = takePrize(
    r,
    ctx.event as NonNullable<typeof ctx.event>,
    prize,
    {
      gainBoon,
      fail: (msg) => {
        throw new RunError(msg);
      },
    },
    pick,
    cards,
  );
  // (a Gambler's Shrine's reel prize is the visit's one choice: the shrine closes with it, DECISIONS #538)
  clearNode(r, ctx.nodeId);
  r.phase = 'map';
  return r;
}

// ---- end of a loop --------------------------------------------------------------------------------------
/** Keep the deck for PvP. (The Vault itself lives with the player's profile, not the run.) */
export function bank(run: RunState): RunState {
  need(run.phase === 'loopCleared', 'You can only save the deck of a cleared loop');
  const r = clone(run);
  r.phase = 'banked';
  return r;
}

/** Push on: one Rift Tier deeper, same deck. The Warden's own heal and Resolve are all the rest there is (DECISIONS #531). */
export function continueLoop(run: RunState): RunState {
  need(run.phase === 'loopCleared', 'You can only continue a cleared loop');
  need(!run.won && run.tier < MAX_TIER, `Rift Tier ${MAX_TIER} is the final gauntlet`);
  const r = clone(run);
  if (!r.wardenOrder) {
    r.wardenOrder = shuffledWardens(r.rng);
    // A legacy save cannot reconstruct earlier maps; keep its known current Warden out of later tiers.
    const current = r.map.nodes.find((n) => n.kind === 'warden')?.enemyId;
    const index = r.wardenOrder.indexOf(current ?? '');
    if (index >= 0 && r.tier <= 11) {
      [r.wardenOrder[index], r.wardenOrder[r.tier - 1]] = [r.wardenOrder[r.tier - 1]!, current!];
    }
  }
  r.campaignRoute = 'twelve';
  if (!r.realmRoute) r.realmRoute = 'legacy-themed';
  r.tier += 1;
  r.stage = 1;
  const next = realmOfTier(
    r.rng,
    r.tier,
    r.map.realm,
    r.wardenOrder,
    r.realmRoute === 'eleven' ? r.realmOrder : undefined,
  );
  r.stageRealms = next.order;
  r.map = generateStageMap(
    r.rng,
    depthOf(r.tier),
    next.realm,
    r.character,
    next.realm === 'rift' ? next.order.slice(-2) : [next.realm],
    r.tier,
    r.campaignRoute,
    r.wardenOrder,
    r.realmRoute !== undefined,
  );
  r.cleared = [];
  r.at = null;
  if (r.map.gauntlet) {
    r.phase = 'map';
    r.context = null;
  } else openPrelude(r, 'stage');
  scarDeck(r);
  return r;
}
