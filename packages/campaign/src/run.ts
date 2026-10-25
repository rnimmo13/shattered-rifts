// The run state machine (03_CAMPAIGN §2, adapted to Combat v2). Every function takes a RunState and returns a new one
// (the input is never changed), so a run can be saved after every step and the UI can never put it in a state the rules
// forbid. Covers: Riftwalker start, the five stage maps, fights/elites/Wardens, HP that carries between fights, card
// rewards with skip, shrines (rest, upgrade, remove), the merchant, a small event, the Warden's Gift, Resolve, Bank and
// Continue. Boons come later.

import { nextInt, seedRng, shuffle, type RngState } from '@sr/combat';
import {
  COMBAT_DB,
  RIFTWALKERS,
  V2_DECK_RULES,
  encounter,
  isSanctified,
  canonicalHero,
  type HeroId,
} from '@sr/content/v2';
import {
  CROSSED_MERCHANT_CHANCE,
  EVENT_FIGHT_ODDS,
  FINAL_STAGE,
  GHOST_FROM_TIER,
  ambushEnemy,
  generateStageMap,
  reachableNodes,
} from './mapgen';

export { CROSSED_MERCHANT_CHANCE };
import { enemyScale } from './tierTable';
import { makeKits } from './kits';
import { rollEvent, resolveEvent } from './events';
import { beginTrial, endTrial, takePrize } from './trials';
import { makePrelude } from './preludes';
import {
  BOON_PRICE,
  MAX_POTIONS,
  MAX_TIER,
  POTION_PRICE,
  PRICE,
  REMOVE_PRICE,
  upgradePrice,
  ancestralPool,
  offerPotion,
  boonOfRarity,
  canAdd,
  cardOfRarity,
  giftOffers,
  offerBoon,
  offerCards,
  priceOf,
} from './rewards';
import type {
  Difficulty,
  GhostBoss,
  Luck,
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
export const FIGHT_SHARDS = { duel: 15, elite: 36, warden: 65 } as const;
/** The chance (percent) that a won fight drops a potion (when the belt has room). */
export const POTION_DROP_CHANCE = { duel: 40, elite: 75 } as const;
/** Percent of max HP an Elite fight heals when it is won. */
export const ELITE_HEAL_PCT = 10;

/** Fraction of max HP a shrine rest heals. */
export const REST_HEAL = 0.35;

/** Stages 1 and 2 are the first two realms of the run; the last stage is the Rift. */
export function realmOfStage(run: Pick<RunState, 'stageRealms'>, stage: number): StageRealm {
  if (stage < FINAL_STAGE) return run.stageRealms[stage - 1] as StageRealm;
  return 'rift';
}

/** Where a stage's enemies come from: its own realm, or in the Rift the realms not yet visited (an old save has one left). */
function enemyRealms(run: Pick<RunState, 'stageRealms'>, stage: number): StageRealm[] {
  if (stage < FINAL_STAGE) return [realmOfStage(run, stage)];
  const rest = run.stageRealms.slice(FINAL_STAGE - 1);
  return rest.length > 0 ? rest : ['umbral'];
}

/** The realms a run visits, in a shuffled order. */
function shuffledRealms(rng: RngState): StageRealm[] {
  return shuffle(rng, ['aurelion', 'nexus', 'wyldmaw', 'umbral'] as StageRealm[]);
}

export function newRun(
  hero: HeroId,
  seed: string,
  difficulty: Difficulty = 'normal',
  luck: Luck = 'normal',
): RunState {
  const rng = seedRng(`run:${seed}`);
  const stageRealms = shuffledRealms(rng);
  const map = generateStageMap(rng, 1, stageRealms[0] as StageRealm, hero);
  const rw = RIFTWALKERS[hero]; // throws on an unknown hero
  need(rw, `Unknown Riftwalker ${hero}`);
  const run: RunState = {
    v: 2,
    seed,
    character: hero,
    difficulty,
    luck,
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
  // the very start: choose one of two starting decks, and then meet The Threshold
  run.phase = 'kit';
  run.context = { nodeId: '', kits: makeKits(hero) };
  return run;
}

/** Put the start-of-run / start-of-stage choice in front of the player (changes `run`, which must be a copy). */
function openPrelude(run: RunState, kind: 'threshold' | 'stage'): void {
  run.phase = 'prelude';
  run.context = {
    nodeId: '',
    prelude: makePrelude(run.rng, kind, run.stage, realmOfStage(run, run.stage)),
  };
}

/** Add a Boon to the run, applying its campaign-side effects (max HP). */
function gainBoon(r: RunState, id: string): void {
  const b = COMBAT_DB.boons[id];
  need(b, `Unknown boon ${id}`);
  need(!r.boons.includes(id), 'You already have that boon');
  r.boons.push(id);
  if (b.maxHp) {
    r.maxHp += b.maxHp;
    r.hp += b.maxHp;
  }
}

const heal = (r: RunState, n: number): void => {
  r.hp = Math.min(r.maxHp, r.hp + Math.ceil(n));
};

export function availableNodes(run: RunState): MapNode[] {
  return run.phase === 'map' ? reachableNodes(run.map, run.at, run.cleared) : [];
}

const nodeOf = (run: RunState, id: string): MapNode => {
  const n = run.map.nodes.find((x) => x.id === id);
  need(n, `Unknown node ${id}`);
  return n;
};

function clearNode(run: RunState, id: string): void {
  if (!run.cleared.includes(id)) {
    run.cleared.push(id);
    run.stats.nodesCleared++;
  }
  run.at = id;
  run.context = null;
}

/** Step onto a node from the map. */
export function enterNode(run: RunState, nodeId: string): RunState {
  need(run.phase === 'map', 'You can only choose a node from the map');
  need(
    availableNodes(run).some((n) => n.id === nodeId),
    'That node is not reachable',
  );
  const r = clone(run);
  const node = nodeOf(r, nodeId);
  r.at = nodeId;
  r.context = { nodeId };
  switch (node.kind) {
    case 'duel':
    case 'elite':
    case 'warden':
      r.phase = 'duel';
      break;
    case 'shrine':
      r.phase = 'shrine';
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
          for (const id of offerCards(r.rng, crossed, r.deck, 'elite', 4, r.luck))
            if (COMBAT_DB.cards[id]?.hero === crossed && !stock.includes(id) && stock.length < 4)
              stock.push(id);
      } else stock = offerCards(r.rng, r.character, r.deck, 'elite', 4, r.luck);
      const items: MerchantItem[] = stock.map((cardId) => ({
        cardId,
        price: priceOf(cardId),
        sold: false,
      }));
      // a card you put on hold earlier is waiting for you, at the price you were promised
      if (r.held) {
        const keep = r.held.filter((h) => canAdd(r.deck, h.cardId));
        items.unshift(
          ...keep.map((h) => ({ cardId: h.cardId, price: h.price, sold: false, held: true })),
        );
        if (keep.length) r.held = keep;
        else delete r.held;
      }
      // now and then an ancestral card is on the table, at a price
      const ancestors = ancestralPool(r.deck);
      if (
        !crossed &&
        ancestors.length &&
        nextInt(r.rng, 100) < (r.luck === 'blessed' ? 55 : r.luck === 'lucky' ? 40 : 28)
      ) {
        const id = ancestors[nextInt(r.rng, ancestors.length)] as string;
        items.push({ cardId: id, price: PRICE['ancestral'] ?? 240, sold: false });
      }
      const potions = [offerPotion(r.rng), offerPotion(r.rng)].map((id) => ({
        id,
        price: POTION_PRICE[COMBAT_DB.potions[id]?.rarity ?? 'common'] ?? 40,
        sold: false,
      }));
      const boon = offerBoon(r.rng, r.boons, 'elite');
      r.context.merchant = {
        items,
        ...(crossed ? { crossed } : {}),
        removePrice: REMOVE_PRICE,
        removed: false,
        potions,
        ...(boon
          ? {
              boon: {
                id: boon,
                price: BOON_PRICE[COMBAT_DB.boons[boon]?.rarity ?? 'common'] ?? 100,
                sold: false,
              },
            }
          : {}),
      };
      r.phase = 'merchant';
      break;
    }
    case 'event': {
      delete r.eventResult; // (so the next event's result is shown even if its words are the same)
      delete r.eventFlips;
      // now and then the stop is an ambush: a fight (an Elite from the third floor on) in place of the event. (Maps never put an event on
      // the first floor, which is all fights, so an event stood on there by hand is left alone.)
      const roll = node.floor >= 2 ? nextInt(r.rng, 100) : 100;
      const ambush: 'duel' | 'elite' | null =
        roll < EVENT_FIGHT_ODDS.elite && node.floor >= 3
          ? 'elite'
          : roll < EVENT_FIGHT_ODDS.elite + EVENT_FIGHT_ODDS.duel
            ? 'duel'
            : null;
      const foe = ambush
        ? ambushEnemy(
            r.rng,
            enemyRealms(r, r.stage),
            ambush,
            r.map.nodes.map((n) => n.enemyId),
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
  ghost?: GhostBoss & { hp: number };
}

/** How much HP a ghost Warden has: its Riftwalker's own, times this (a Warden is tougher than a player), more with each Rift Tier. */
export const GHOST_BOSS_HP_BASE = 1.4;
export const GHOST_BOSS_HP_PER_TIER = 0.06;
export const ghostBossHp = (hero: string, tier: number): number =>
  Math.round(
    (RIFTWALKERS[hero as keyof typeof RIFTWALKERS]?.hero.maxHp ?? 80) *
      (GHOST_BOSS_HP_BASE + GHOST_BOSS_HP_PER_TIER * Math.max(0, tier - GHOST_FROM_TIER)),
  );

/** Is this a ghost Warden whose deck has not been fetched yet? (The screen asks the server for one, then calls `attachGhost`.) */
export function ghostWanted(run: RunState): boolean {
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
  const deck = g['deck'];
  const boons = g['boons'];
  if (!Array.isArray(deck) || deck.length < V2_DECK_RULES.minSize || deck.length > 80) return null;
  if (!deck.every((c) => typeof c === 'string' && Object.hasOwn(COMBAT_DB.cards, c))) return null;
  if (!Array.isArray(boons) || boons.length > 12) return null;
  if (!boons.every((b) => typeof b === 'string' && Object.hasOwn(COMBAT_DB.boons, b))) return null;
  const name = typeof g['name'] === 'string' ? g['name'].slice(0, 40) : 'A rival';
  const tier = typeof g['tier'] === 'number' && Number.isInteger(g['tier']) ? g['tier'] : 1;
  const stage = typeof g['stage'] === 'number' && Number.isInteger(g['stage']) ? g['stage'] : null;
  return {
    name,
    hero: hero as GhostBoss['hero'],
    deck: [...(deck as string[])],
    boons: [...(boons as string[])],
    tier,
    stage,
  };
}

/** The ghost for this Warden has arrived (or none could be had: null, and the usual Warden is fought). */
export function attachGhost(run: RunState, ghost: unknown): RunState {
  need(ghostWanted(run), 'This fight is not waiting for a ghost');
  const r = clone(run);
  const ctx = r.context as NonNullable<RunState['context']>;
  ctx.ghostAsked = true;
  const checked = checkGhostBoss(ghost);
  if (checked) ctx.ghost = checked;
  return r;
}

/** What the fight at the current node is. */
export function duelPlan(run: RunState): FightPlan | null {
  if (run.phase !== 'duel' || !run.context) return null;
  const node = nodeOf(run, run.context.nodeId);
  if (!node.enemyId) return null;
  const e = encounter(node.enemyId);
  const ghost = node.ghost ? run.context.ghost : undefined;
  return {
    ...(ghost ? { ghost: { ...ghost, hp: ghostBossHp(ghost.hero, run.tier) } } : {}),
    encounterId: e.id,
    units: [...e.units],
    deck: [...run.deck],
    hp: run.hp,
    maxHp: run.maxHp,
    // the engine's own tier scaling stays off: tierTable.ts carries all of it, through hpPct and dmgPct below
    tier: 1,
    boons: [...run.boons],
    potions: [...run.potions],
    // the tier table sets how hard this stage of this tier is; the difficulty only matters for a run saved on Easy or Hard
    hpPct: Math.round(
      (DIFFICULTY[run.difficulty].hpPct / DIFFICULTY.normal.hpPct) *
        enemyScale(run.tier, run.stage).hp,
    ),
    dmgPct: Math.round(
      (DIFFICULTY[run.difficulty].dmgPct / DIFFICULTY.normal.dmgPct) *
        enemyScale(run.tier, run.stage).dmg,
    ),
    kind: node.kind,
    seed: `${run.seed}:t${run.tier}:${node.id}:${run.stats.duelsLost}`,
  };
}

/** Report the result of the fight at the current node. `hpLeft` is your hero's HP at the end of a win. */
export function finishDuel(
  run: RunState,
  won: boolean,
  hpLeft = run.hp,
  potionsLeft: readonly string[] = run.potions,
): RunState {
  need(run.phase === 'duel' && run.context, 'No fight is in progress');
  const r = clone(run);
  const ctx = r.context as NonNullable<RunState['context']>;
  const node = nodeOf(r, ctx.nodeId);
  if (!won) {
    r.stats.duelsLost++;
    r.resolve = Math.max(0, r.resolve - (node.kind === 'duel' ? 1 : 2));
    if (r.resolve === 0) {
      r.phase = 'collapsed';
      r.context = null;
    }
    // otherwise the same fight is retried at the HP you entered with: the phase stays 'duel'
    return r;
  }
  need(
    Number.isInteger(hpLeft) && hpLeft >= 1 && hpLeft <= r.maxHp,
    'Invalid HP at the end of a fight',
  );
  r.stats.duelsWon++;
  r.hp = hpLeft;
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
  let potionGained: string | undefined;
  const dropChance = POTION_DROP_CHANCE[node.kind === 'duel' ? 'duel' : 'elite'];
  if (r.potions.length < MAX_POTIONS && nextInt(r.rng, 100) < dropChance) {
    potionGained = offerPotion(r.rng);
    r.potions.push(potionGained);
  }
  const gain =
    FIGHT_SHARDS[node.kind === 'duel' ? 'duel' : node.kind === 'elite' ? 'elite' : 'warden'];
  r.shards += gain;
  for (const id of r.boons) {
    const b = COMBAT_DB.boons[id];
    if (b?.healAfterFight) heal(r, b.healAfterFight);
    if (b?.shardsPerFight) r.shards += b.shardsPerFight;
  }
  let boonGained: string | undefined;
  if (node.kind === 'elite' || (node.kind === 'warden' && r.stage < FINAL_STAGE)) {
    const id = offerBoon(r.rng, r.boons, 'elite');
    if (id) {
      gainBoon(r, id);
      boonGained = id;
    }
  }
  if (node.kind === 'elite') heal(r, (r.maxHp * ELITE_HEAL_PCT) / 100); // an elite leaves you a little breathing room
  if (node.kind === 'warden') {
    clearNode(r, node.id);
    // a Warden falls: you catch your breath
    heal(r, r.maxHp * 0.3);
    r.resolve = Math.min(r.maxResolve, r.resolve + 1);
    if (r.stage >= FINAL_STAGE) {
      r.phase = 'loopCleared';
      return r;
    }
    const offers = giftOffers(
      r.rng,
      r.character,
      r.deck,
      r.tier >= 5 ? 4 : 3,
      node.enemyId,
      r.luck,
    );
    if (offers.length === 0) {
      r.phase = 'stageClear';
      r.context = null;
      return r;
    }
    r.context = {
      nodeId: node.id,
      offers,
      shardsGained: gain,
      ...(boonGained ? { boonGained } : {}),
      ...(potionGained ? { potionGained } : {}),
    };
    r.phase = 'gift';
    return r;
  }
  const count = r.tier >= 4 ? 4 : 3;
  r.context = {
    nodeId: node.id,
    offers: offerCards(
      r.rng,
      r.character,
      r.deck,
      node.kind === 'elite' ? 'elite' : 'duel',
      count,
      r.luck,
    ),
    shardsGained: gain,
    ...(boonGained ? { boonGained } : {}),
    ...(potionGained ? { potionGained } : {}),
  };
  r.phase = 'reward';
  return r;
}

/** Pick a card from the reward or the Warden's Gift, or skip it (null): every card reward can be skipped. */
export function chooseCard(run: RunState, cardId: string | null): RunState {
  need(run.phase === 'reward' || run.phase === 'gift', 'There is no card reward to choose from');
  const ctx = run.context;
  need(ctx?.offers, 'There is nothing on offer');
  const r = clone(run);
  const c = r.context as NonNullable<RunState['context']>;
  if (cardId === null) {
    // any card reward, the Warden's Gift included, can be skipped
  } else {
    need(c.offers?.includes(cardId), 'That card is not on offer');
    need(canAdd(r.deck, cardId), 'That card would break the deck rules');
    r.deck.push(cardId);
  }
  if (r.phase === 'gift') {
    r.phase = 'stageClear';
    r.context = null;
  } else {
    clearNode(r, c.nodeId);
    r.phase = 'map';
  }
  return r;
}

/** After a Warden: start the next stage. */
export function nextStage(run: RunState): RunState {
  need(run.phase === 'stageClear', 'The stage is not cleared yet');
  const r = clone(run);
  r.stage += 1;
  r.map = generateStageMap(
    r.rng,
    r.stage,
    realmOfStage(r, r.stage),
    r.character,
    enemyRealms(r, r.stage),
    r.tier,
  );
  r.cleared = [];
  r.at = null;
  openPrelude(r, 'stage');
  return r;
}

// ---- the starting deck
/** Take one of the three starting decks on offer; The Threshold follows. */
export function chooseKit(run: RunState, kitId: string): RunState {
  need(run.phase === 'kit' && run.context?.kits, 'There is no starting deck to choose');
  const kit = run.context.kits.find((k) => k.id === kitId);
  need(kit, 'That is not one of the starting decks');
  const r = clone(run);
  r.deck = [...kit.deck];
  openPrelude(r, 'threshold');
  return r;
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
  return r;
}

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

/** The Attack and Defend cards a deck can still lose or change: Neutral basics. */
const isPlainBasic = (id: string): boolean =>
  !isSanctified(id) &&
  COMBAT_DB.cards[id]?.hero === 'neutral' &&
  COMBAT_DB.cards[id]?.rarity === 'basic';

/** Apply one effect; the answer says what chance decided (null when the option's own text already says it all). */
function applyEffect(r: RunState, e: PreludeEffect): string | null {
  switch (e.k) {
    case 'maxHp':
      r.maxHp = Math.max(10, r.maxHp + e.n);
      r.hp = e.n > 0 ? r.hp + e.n : Math.min(r.hp, r.maxHp);
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
        const slots = r.deck.flatMap((id, at) => (COMBAT_DB.cards[id]?.upgrade ? [at] : []));
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
        const at = r.deck.findIndex(isPlainBasic);
        if (at < 0) break;
        gone.push(nameOfCard(r.deck[at] as string));
        r.deck.splice(at, 1);
      }
      return gone.length ? `${listOf(gone)} leave${gone.length === 1 ? 's' : ''} your deck.` : null;
    }
    case 'boon': {
      const id = boonOfRarity(r.rng, r.boons, e.rarity);
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
        const rarity = nextInt(r.rng, 3) === 0 ? 'uncommon' : 'common';
        const id = cardOfRarity(r.rng, r.character, r.deck, rarity);
        if (id) {
          r.deck.push(id);
          made.push(`${from} becomes ${nameOfCard(id)}.`);
        }
      }
      return made.length ? made.join(' ') : null;
    }
  }
}

// ---- shrine -------------------------------------------------------------------------------------------
export type ShrineChoice =
  { kind: 'rest' } | { kind: 'upgrade'; card: string } | { kind: 'remove'; card: string };

/** Which cards in a deck can be upgraded at a shrine. */
export function upgradable(deck: readonly string[]): string[] {
  return [...new Set(deck.filter((id) => !!COMBAT_DB.cards[id]?.upgrade))];
}

export function takeShrine(run: RunState, choice: ShrineChoice): RunState {
  need(run.phase === 'shrine' && run.context, 'You are not at a shrine');
  const r = clone(run);
  if (choice.kind === 'rest') {
    heal(r, r.maxHp * REST_HEAL);
  } else if (choice.kind === 'upgrade') {
    const i = r.deck.indexOf(choice.card);
    need(i >= 0, 'That card is not in your deck');
    const up = COMBAT_DB.cards[choice.card]?.upgrade;
    need(up, 'That card cannot be upgraded');
    r.deck[i] = up;
  } else {
    need(
      r.deck.length > V2_DECK_RULES.minSize,
      `A deck cannot go below ${V2_DECK_RULES.minSize} cards`,
    );
    need(!isSanctified(choice.card), 'A sanctified card can never be removed');
    const i = r.deck.indexOf(choice.card);
    need(i >= 0, 'That card is not in your deck');
    r.deck.splice(i, 1);
  }
  clearNode(r, (r.context as NonNullable<RunState['context']>).nodeId);
  r.phase = 'map';
  return r;
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
  need(!m.removed, 'The merchant only removes one card per visit');
  need(r.shards >= m.removePrice, 'Not enough shards');
  need(
    r.deck.length > V2_DECK_RULES.minSize,
    `A deck cannot go below ${V2_DECK_RULES.minSize} cards`,
  );
  need(!isSanctified(card), 'A sanctified card can never be removed');
  const i = r.deck.indexOf(card);
  need(i >= 0, 'That card is not in your deck');
  r.shards -= m.removePrice;
  r.deck.splice(i, 1);
  m.removed = true;
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
  const price = upgradePrice(m.upgrades ?? 0);
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
  need(!ev.choose, 'Choose one of the cards first');
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
  // a choice of cards to make: the event waits for it (see pickEventCard)
  if (ev.choose) return r;
  clearNode(r, (r.context as NonNullable<RunState['context']>).nodeId);
  r.phase = 'map';
  return r;
}

/** Take one of the cards an event laid out for a choice (three cards from other Riftwalkers), which ends the event. */
export function pickEventCard(run: RunState, index: number): RunState {
  need(run.phase === 'event' && run.context?.event?.choose, 'There is no choice to make here');
  const r = clone(run);
  const ctx = r.context as NonNullable<RunState['context']>;
  const id = (ctx.event as NonNullable<typeof ctx.event>).choose?.cards[index];
  need(id, 'That is not one of the cards');
  need(canAdd(r.deck, id), 'That card would break the deck rules');
  r.deck.push(id);
  r.eventResult = `You take ${COMBAT_DB.cards[id]?.name ?? 'the card'}: not your class's card, but yours now.`;
  clearNode(r, ctx.nodeId);
  r.phase = 'map';
  return r;
}

/** The player pressed Begin on an elite event's trial. From now on it is spent: it is saved as begun, and cannot be tried again. */
export function startTrial(run: RunState): RunState {
  need(
    run.phase === 'event' && run.context?.event?.trial?.state === 'open',
    'There is no trial here',
  );
  const r = clone(run);
  beginTrial(
    (r.context as NonNullable<RunState['context']>).event as NonNullable<
      NonNullable<RunState['context']>['event']
    >,
  );
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

/** An elite event's trial has been played (the client plays the puzzle): a win opens the choice of prizes, a loss pays the consolation. */
export function finishTrial(run: RunState, won: boolean): RunState {
  need(
    run.phase === 'event' && run.context?.event?.trial?.state === 'playing',
    'There is no trial being played',
  );
  const r = clone(run);
  const ctx = r.context as NonNullable<RunState['context']>;
  const said = endTrial(r, ctx.event as NonNullable<typeof ctx.event>, won);
  if (said !== null) {
    r.eventResult = said;
    clearNode(r, ctx.nodeId);
    r.phase = 'map';
  }
  return r;
}

/** Take one of the prizes of a trial that was won. */
export function claimTrialPrize(run: RunState, prize: string, pick?: number): RunState {
  need(
    run.phase === 'event' && run.context?.event?.trial?.state === 'won',
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
  );
  clearNode(r, ctx.nodeId);
  r.phase = 'map';
  return r;
}

// ---- end of a loop --------------------------------------------------------------------------------------
/** Keep the deck for PvP. (The Vault itself lives with the player's profile, not the run.) */
export function bank(run: RunState): RunState {
  need(run.phase === 'loopCleared', 'You can only bank a cleared loop');
  const r = clone(run);
  r.phase = 'banked';
  return r;
}

/** Push on: one Rift Tier deeper, same deck, back to Stage 1. */
export function continueLoop(run: RunState): RunState {
  need(run.phase === 'loopCleared', 'You can only continue a cleared loop');
  need(run.tier < MAX_TIER, `Rift Tier ${MAX_TIER} is as deep as it goes`);
  const r = clone(run);
  r.tier += 1;
  if (r.tier < 8) r.resolve = Math.min(r.maxResolve, r.resolve + 1);
  // a loop cleared is a loop rested: back to full HP for the next one
  heal(r, r.maxHp);
  r.stage = 1;
  r.stageRealms = shuffledRealms(r.rng);
  r.map = generateStageMap(
    r.rng,
    1,
    r.stageRealms[0] as StageRealm,
    r.character,
    undefined,
    r.tier,
  );
  r.cleared = [];
  r.at = null;
  openPrelude(r, 'stage');
  return r;
}
