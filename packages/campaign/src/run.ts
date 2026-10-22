// The run state machine (03_CAMPAIGN §2). Every function takes a RunState and returns a new one (the input is never
// changed), so a run can be saved after every step and the UI can never put it in a state the rules forbid.
// Run v1 covers: character start, the five stage maps, duels/elites/Wardens, card rewards with skip, shrines,
// the merchant, a small event, the Warden's Gift, Resolve, Bank and Continue. Boons and Tempering come later.

import { seedRng, shuffle } from '@sr/engine';
import { CARD_DB, DECK_RULES, character, enemy, starterDeck, type CharacterId } from '@sr/content';
import { generateStageMap, reachableNodes, wardenFor } from './mapgen';
import { PRICE, REMOVE_PRICE, canAdd, giftOffers, offerCards } from './rewards';
import type { EventOption, MapNode, MerchantItem, RunState, StageRealm } from './types';

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

export class RunError extends Error {}

function need(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new RunError(msg);
}

export const MAX_RESOLVE = 3;

export function realmOfStage(run: Pick<RunState, 'stageRealms'>, stage: number): StageRealm {
  if (stage <= 3) return run.stageRealms[stage - 1] as StageRealm;
  return stage === 4 ? 'umbral' : 'rift';
}

export function newRun(characterId: CharacterId, seed: string): RunState {
  const rng = seedRng(`run:${seed}`);
  const stageRealms = shuffle(rng, ['aurelion', 'nexus', 'wyldmaw'] as StageRealm[]);
  const map = generateStageMap(rng, 1, stageRealms[0] as StageRealm);
  character(characterId); // throws on an unknown character
  return {
    v: 1,
    seed,
    character: characterId,
    tier: 1,
    stage: 1,
    resolve: MAX_RESOLVE,
    maxResolve: MAX_RESOLVE,
    deck: starterDeck(characterId),
    shards: 0,
    boons: [],
    stageRealms,
    map,
    cleared: [],
    at: null,
    phase: 'map',
    context: null,
    rng,
    stats: { duelsWon: 0, duelsLost: 0, nodesCleared: 0 },
  };
}

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
      const items: MerchantItem[] = offerCards(r.rng, r.character, r.deck, 'elite', 4).map(
        (cardId) => ({
          cardId,
          price: PRICE[CARD_DB[cardId]?.rarity ?? 'common'] ?? 60,
          sold: false,
        }),
      );
      r.context.merchant = { items, removePrice: REMOVE_PRICE, removed: false };
      r.phase = 'merchant';
      break;
    }
    case 'event': {
      const cardOffer = offerCards(r.rng, r.character, r.deck, 'duel', 1)[0] ?? '';
      const options: EventOption[] = [
        { id: 'shards', label: 'Take the shards (+30)' },
        ...(cardOffer ? [{ id: 'card' as const, label: 'Take the relic card' }] : []),
        { id: 'leave', label: 'Leave it' },
      ];
      r.context.event = {
        title: 'A rift cache',
        text: 'A seam in the world has split open, and something glints inside. You can only carry one thing away.',
        options,
        cardOffer,
      };
      r.phase = 'event';
      break;
    }
  }
  return r;
}

/** What the duel at the current node is: the enemy, its Essence (Tier-scaled), and your deck. */
export function duelPlan(
  run: RunState,
): { enemyId: string; essence: number; deck: string[]; kind: MapNode['kind'] } | null {
  if (run.phase !== 'duel' || !run.context) return null;
  const node = nodeOf(run, run.context.nodeId);
  if (!node.enemyId) return null;
  const e = enemy(node.enemyId);
  const bonus = (run.tier - 1) * (e.kind === 'warden' || e.kind === 'finale' ? 5 : 3);
  return { enemyId: e.id, essence: e.essence + bonus, deck: [...run.deck], kind: node.kind };
}

/** Report the result of the duel at the current node. */
export function finishDuel(run: RunState, won: boolean): RunState {
  need(run.phase === 'duel' && run.context, 'No duel is in progress');
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
    // otherwise the same node is retried with a fresh shuffle: the phase stays 'duel'
    return r;
  }
  r.stats.duelsWon++;
  const gain = node.kind === 'duel' ? 12 : node.kind === 'elite' ? 28 : 50;
  r.shards += gain;
  if (node.kind === 'warden') {
    clearNode(r, node.id);
    if (r.stage === 5) {
      r.phase = 'loopCleared';
      return r;
    }
    const count = r.tier >= 5 ? 4 : 3;
    r.context = {
      nodeId: node.id,
      offers: giftOffers(r.rng, r.character, r.deck, wardenFor(realmOfStage(r, r.stage)).id, count),
      shardsGained: gain,
    };
    r.phase = 'gift';
    return r;
  }
  const count = r.tier >= 4 ? 4 : 3;
  r.context = {
    nodeId: node.id,
    offers: offerCards(r.rng, r.character, r.deck, node.kind === 'elite' ? 'elite' : 'duel', count),
    shardsGained: gain,
  };
  r.phase = 'reward';
  return r;
}

/** Pick a card from the reward or the Warden's Gift, or skip a reward (null). Gifts cannot be skipped. */
export function chooseCard(run: RunState, cardId: string | null): RunState {
  need(run.phase === 'reward' || run.phase === 'gift', 'There is no card reward to choose from');
  const ctx = run.context;
  need(ctx?.offers, 'There is nothing on offer');
  const r = clone(run);
  const c = r.context as NonNullable<RunState['context']>;
  if (cardId === null) {
    need(run.phase === 'reward', 'A Warden’s Gift cannot be skipped');
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
  r.map = generateStageMap(r.rng, r.stage, realmOfStage(r, r.stage));
  r.cleared = [];
  r.at = null;
  r.phase = 'map';
  r.context = null;
  return r;
}

// ---- shrine -------------------------------------------------------------------------------------------
export type ShrineChoice = { kind: 'rest' } | { kind: 'remove'; card: string };

export function useShrine(run: RunState, choice: ShrineChoice): RunState {
  need(run.phase === 'shrine' && run.context, 'You are not at a shrine');
  const r = clone(run);
  if (choice.kind === 'rest') {
    r.resolve = Math.min(r.maxResolve, r.resolve + 1);
  } else {
    need(r.deck.length > DECK_RULES.minSize, `A deck cannot go below ${DECK_RULES.minSize} cards`);
    const i = r.deck.indexOf(choice.card);
    need(i >= 0, 'That card is not in your deck');
    r.deck.splice(i, 1);
  }
  clearNode(r, (r.context as NonNullable<RunState['context']>).nodeId);
  r.phase = 'map';
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
  need(item && !item.sold, 'That is not for sale');
  need(r.shards >= item.price, 'Not enough shards');
  need(canAdd(r.deck, item.cardId), 'That card would break the deck rules');
  r.shards -= item.price;
  item.sold = true;
  r.deck.push(item.cardId);
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
  need(r.deck.length > DECK_RULES.minSize, `A deck cannot go below ${DECK_RULES.minSize} cards`);
  const i = r.deck.indexOf(card);
  need(i >= 0, 'That card is not in your deck');
  r.shards -= m.removePrice;
  r.deck.splice(i, 1);
  m.removed = true;
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
  need(
    ev.options.some((o) => o.id === option),
    'That is not an option',
  );
  if (option === 'shards') r.shards += 30;
  if (option === 'card' && ev.cardOffer && canAdd(r.deck, ev.cardOffer)) r.deck.push(ev.cardOffer);
  clearNode(r, (r.context as NonNullable<RunState['context']>).nodeId);
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
  const r = clone(run);
  r.tier += 1;
  if (r.tier < 8) r.resolve = Math.min(r.maxResolve, r.resolve + 1);
  r.stage = 1;
  r.stageRealms = shuffle(r.rng, ['aurelion', 'nexus', 'wyldmaw'] as StageRealm[]);
  r.map = generateStageMap(r.rng, 1, r.stageRealms[0] as StageRealm);
  r.cleared = [];
  r.at = null;
  r.phase = 'map';
  r.context = null;
  return r;
}
