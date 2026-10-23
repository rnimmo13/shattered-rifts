// The run state machine (03_CAMPAIGN §2, adapted to Combat v2). Every function takes a RunState and returns a new one
// (the input is never changed), so a run can be saved after every step and the UI can never put it in a state the rules
// forbid. Covers: Riftwalker start, the five stage maps, fights/elites/Wardens, HP that carries between fights, card
// rewards with skip, shrines (rest, upgrade, remove), the merchant, a small event, the Warden's Gift, Resolve, Bank and
// Continue. Boons come later.

import { nextInt, seedRng, shuffle } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, V2_DECK_RULES, encounter, type HeroId } from '@sr/content/v2';
import { generateStageMap, reachableNodes } from './mapgen';
import { makeKits } from './kits';
import { makePrelude } from './preludes';
import {
  BOON_PRICE,
  MAX_POTIONS,
  POTION_PRICE,
  REMOVE_PRICE,
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

export const MAX_RESOLVE = 3;

/**
 * Difficulty settings. Easy is the default while the game is built and tested: enemies have 60% HP and hit for 55%, you have
 * more Resolve and some shards to start. Change these numbers (and re-run `pnpm sim`) when it is time to balance.
 */
export const DIFFICULTY: Record<
  Difficulty,
  { label: string; hpPct: number; dmgPct: number; resolve: number; shards: number }
> = {
  easy: { label: 'Easy (for testing)', hpPct: 60, dmgPct: 55, resolve: 5, shards: 100 },
  normal: { label: 'Normal', hpPct: 100, dmgPct: 100, resolve: MAX_RESOLVE, shards: 0 },
};
/** Fraction of max HP a shrine rest heals. */
export const REST_HEAL = 0.35;

export function realmOfStage(run: Pick<RunState, 'stageRealms'>, stage: number): StageRealm {
  if (stage <= 3) return run.stageRealms[stage - 1] as StageRealm;
  return stage === 4 ? 'umbral' : 'rift';
}

export function newRun(hero: HeroId, seed: string, difficulty: Difficulty = 'easy'): RunState {
  const rng = seedRng(`run:${seed}`);
  const stageRealms = shuffle(rng, ['aurelion', 'nexus', 'wyldmaw'] as StageRealm[]);
  const map = generateStageMap(rng, 1, stageRealms[0] as StageRealm);
  const rw = RIFTWALKERS[hero]; // throws on an unknown hero
  need(rw, `Unknown Riftwalker ${hero}`);
  const run: RunState = {
    v: 2,
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
  // the very start: choose one of two starting decks, and then meet The Threshold
  run.phase = 'kit';
  run.context = { nodeId: '', kits: makeKits(run.rng, hero) };
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
      const items: MerchantItem[] = offerCards(r.rng, r.character, r.deck, 'elite', 4).map(
        (cardId) => ({ cardId, price: priceOf(cardId), sold: false }),
      );
      const potions = [offerPotion(r.rng), offerPotion(r.rng)].map((id) => ({
        id,
        price: POTION_PRICE[COMBAT_DB.potions[id]?.rarity ?? 'common'] ?? 40,
        sold: false,
      }));
      const boon = offerBoon(r.rng, r.boons, 'elite');
      r.context.merchant = {
        items,
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
      const cardOffer = offerCards(r.rng, r.character, r.deck, 'duel', 1)[0] ?? '';
      const kind = nextInt(r.rng, 3);
      const leave: EventOption = { id: 'leave', label: 'Walk away' };
      if (kind === 1 && upgradable(r.deck).length > 0) {
        r.context.event = {
          title: 'The wandering smith',
          text: 'A smith has set up a forge in the ruins. "One piece of yours, tempered free. I choose."',
          options: [{ id: 'upgrade', label: 'Let the smith temper a random card' }, leave],
          cardOffer: '',
        };
      } else if (kind === 2 && r.hp > 20) {
        const boonOffer = offerBoon(r.rng, r.boons, 'elite') ?? undefined;
        r.context.event = {
          title: 'The blood altar',
          text: 'An altar drinks what you give it, and gives back. The rift rewards those who bleed for it.',
          options: [
            { id: 'bleed', label: 'Give 10 HP: gain 60 shards' },
            ...(boonOffer ? [{ id: 'boon' as const, label: 'Give 15 HP: take the Boon' }] : []),
            leave,
          ],
          cardOffer: '',
          ...(boonOffer ? { boonOffer } : {}),
        };
      } else {
        r.context.event = {
          title: 'A rift cache',
          text: 'A seam in the world has split open, and something glints inside. You can only carry one thing away.',
          options: [
            { id: 'shards', label: 'Take the shards (+30)' },
            { id: 'heal', label: 'Drink from the spring (heal 20% of your HP)' },
            ...(cardOffer ? [{ id: 'card' as const, label: 'Take the relic card' }] : []),
            leave,
          ],
          cardOffer,
        };
      }
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
  /** percent of normal enemy HP and damage (the difficulty setting) */
  hpPct: number;
  dmgPct: number;
  kind: MapNode['kind'];
  /** a seed that changes on each retry, so a lost fight is not replayed identically */
  seed: string;
}

/** What the fight at the current node is. */
export function duelPlan(run: RunState): FightPlan | null {
  if (run.phase !== 'duel' || !run.context) return null;
  const node = nodeOf(run, run.context.nodeId);
  if (!node.enemyId) return null;
  const e = encounter(node.enemyId);
  return {
    encounterId: e.id,
    units: [...e.units],
    deck: [...run.deck],
    hp: run.hp,
    maxHp: run.maxHp,
    tier: run.tier,
    boons: [...run.boons],
    potions: [...run.potions],
    hpPct: DIFFICULTY[run.difficulty].hpPct,
    dmgPct: DIFFICULTY[run.difficulty].dmgPct,
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
  const dropChance = node.kind === 'duel' ? 40 : 75;
  if (r.potions.length < MAX_POTIONS && nextInt(r.rng, 100) < dropChance) {
    potionGained = offerPotion(r.rng);
    r.potions.push(potionGained);
  }
  const gain = node.kind === 'duel' ? 12 : node.kind === 'elite' ? 28 : 50;
  r.shards += gain;
  for (const id of r.boons) {
    const b = COMBAT_DB.boons[id];
    if (b?.healAfterFight) heal(r, b.healAfterFight);
    if (b?.shardsPerFight) r.shards += b.shardsPerFight;
  }
  let boonGained: string | undefined;
  if (node.kind === 'elite' || (node.kind === 'warden' && r.stage < 5)) {
    const id = offerBoon(r.rng, r.boons, 'elite');
    if (id) {
      gainBoon(r, id);
      boonGained = id;
    }
  }
  if (node.kind === 'elite') heal(r, r.maxHp * 0.1); // an elite leaves you a little breathing room
  if (node.kind === 'warden') {
    clearNode(r, node.id);
    // a Warden falls: you catch your breath
    heal(r, r.maxHp * 0.3);
    r.resolve = Math.min(r.maxResolve, r.resolve + 1);
    if (r.stage === 5) {
      r.phase = 'loopCleared';
      return r;
    }
    const offers = giftOffers(r.rng, r.character, r.deck, r.tier >= 5 ? 4 : 3, node.enemyId);
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
    offers: offerCards(r.rng, r.character, r.deck, node.kind === 'elite' ? 'elite' : 'duel', count),
    shardsGained: gain,
    ...(boonGained ? { boonGained } : {}),
    ...(potionGained ? { potionGained } : {}),
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
  openPrelude(r, 'stage');
  return r;
}

// ---- the starting deck
/** Take one of the two starting decks on offer; The Threshold follows. */
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
  for (const e of option.effects) applyEffect(r, e);
  r.phase = 'map';
  r.context = null;
  return r;
}

/** The Slash and Guard cards a deck can still lose or change: Neutral basics. */
const isPlainBasic = (id: string): boolean =>
  COMBAT_DB.cards[id]?.hero === 'neutral' && COMBAT_DB.cards[id]?.rarity === 'basic';

function applyEffect(r: RunState, e: PreludeEffect): void {
  switch (e.k) {
    case 'maxHp':
      r.maxHp = Math.max(10, r.maxHp + e.n);
      r.hp = e.n > 0 ? r.hp + e.n : Math.min(r.hp, r.maxHp);
      return;
    case 'heal':
      heal(r, (r.maxHp * e.pct) / 100);
      return;
    case 'hp':
      r.hp = Math.max(1, r.hp - e.n);
      return;
    case 'shards':
      r.shards += e.n;
      return;
    case 'card': {
      const id = cardOfRarity(r.rng, r.character, r.deck, e.rarity);
      if (id) r.deck.push(id);
      return;
    }
    case 'upgrade': {
      for (let i = 0; i < e.n; i++) {
        const slots = r.deck.flatMap((id, at) => (COMBAT_DB.cards[id]?.upgrade ? [at] : []));
        if (!slots.length) break;
        const at = slots[nextInt(r.rng, slots.length)] as number;
        r.deck[at] = COMBAT_DB.cards[r.deck[at] as string]?.upgrade ?? (r.deck[at] as string);
      }
      return;
    }
    case 'remove': {
      for (let i = 0; i < e.n && r.deck.length > V2_DECK_RULES.minSize; i++) {
        const at = r.deck.findIndex(isPlainBasic);
        if (at < 0) break;
        r.deck.splice(at, 1);
      }
      return;
    }
    case 'boon': {
      const id = boonOfRarity(r.rng, r.boons, e.rarity);
      if (id) gainBoon(r, id);
      return;
    }
    case 'potion':
      if (r.potions.length < MAX_POTIONS) r.potions.push(offerPotion(r.rng));
      return;
    case 'resolve':
      r.resolve = Math.min(r.maxResolve, r.resolve + e.n);
      return;
    case 'wound':
      for (let i = 0; i < e.n; i++) r.deck.push('wound');
      return;
    case 'transform': {
      for (let i = 0; i < e.n; i++) {
        const at = r.deck.findIndex(isPlainBasic);
        if (at < 0) break;
        r.deck.splice(at, 1);
        const rarity = nextInt(r.rng, 3) === 0 ? 'uncommon' : 'common';
        const id = cardOfRarity(r.rng, r.character, r.deck, rarity);
        if (id) r.deck.push(id);
      }
      return;
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
  if (option === 'heal') heal(r, r.maxHp * 0.2);
  if (option === 'card' && ev.cardOffer && canAdd(r.deck, ev.cardOffer)) r.deck.push(ev.cardOffer);
  if (option === 'upgrade') {
    const ups = upgradable(r.deck);
    need(ups.length > 0, 'Nothing to upgrade');
    const pick = ups[nextInt(r.rng, ups.length)] as string;
    const i = r.deck.indexOf(pick);
    r.deck[i] = COMBAT_DB.cards[pick]?.upgrade ?? pick;
  }
  if (option === 'bleed') {
    need(r.hp > 10, 'You are too hurt for that');
    r.hp -= 10;
    r.shards += 60;
  }
  if (option === 'boon') {
    need(ev.boonOffer, 'There is no boon here');
    need(r.hp > 15, 'You are too hurt for that');
    r.hp -= 15;
    gainBoon(r, ev.boonOffer);
  }
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
  heal(r, r.maxHp * 0.5);
  r.stage = 1;
  r.stageRealms = shuffle(r.rng, ['aurelion', 'nexus', 'wyldmaw'] as StageRealm[]);
  r.map = generateStageMap(r.rng, 1, r.stageRealms[0] as StageRealm);
  r.cleared = [];
  r.at = null;
  openPrelude(r, 'stage');
  return r;
}
