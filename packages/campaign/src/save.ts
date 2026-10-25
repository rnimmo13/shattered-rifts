// Saving a run: plain JSON text, so it can go to localStorage and to an export file. Loading checks the whole shape
// and the deck rules, so a hand-edited or damaged save is refused instead of crashing the game.

import {
  COMBAT_DB,
  ENCOUNTERS,
  RIFTWALKERS,
  V2_DECK_RULES,
  canonicalHero,
  rollOf,
} from '@sr/content/v2';
const hasCard = (id: unknown): boolean =>
  typeof id === 'string' &&
  (Object.hasOwn(COMBAT_DB.cards, id) || (rollOf(id) !== 0 && COMBAT_DB.cards[id] !== undefined));
import type { MapNode, NodeKind, RunPhase, RunState } from './types';
import { FINAL_STAGE } from './mapgen';
import { checkGhostBoss } from './run';

export const RUN_SAVE_VERSION = 2;

const PHASES: readonly RunPhase[] = [
  'kit',
  'map',
  'duel',
  'reward',
  'gift',
  'shrine',
  'merchant',
  'event',
  'prelude',
  'stageClear',
  'loopCleared',
  'collapsed',
  'banked',
];
const KINDS: readonly NodeKind[] = ['duel', 'elite', 'event', 'shrine', 'merchant', 'warden'];
const ENEMY_IDS = new Set(ENCOUNTERS.map((e) => e.id));

export function serializeRun(run: RunState): string {
  return JSON.stringify(run);
}

const isInt = (x: unknown, min: number, max: number): x is number =>
  typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
const isStrArray = (x: unknown): x is string[] =>
  Array.isArray(x) && x.every((s) => typeof s === 'string');

function validMap(map: unknown): map is RunState['map'] {
  if (!isObj(map) || !isInt(map['stage'], 1, FINAL_STAGE) || !isInt(map['floors'], 1, 20))
    return false;
  const nodes = map['nodes'];
  if (!Array.isArray(nodes) || nodes.length === 0 || nodes.length > 60) return false;
  const ids = new Set<string>();
  for (const n of nodes as unknown[]) {
    if (!isObj(n) || typeof n['id'] !== 'string') return false;
    ids.add(n['id']);
  }
  if (ids.size !== nodes.length) return false;
  for (const raw of nodes as unknown[]) {
    const n = raw as Partial<MapNode>;
    if (!n.kind || !KINDS.includes(n.kind) || !isInt(n.floor, 1, 20)) return false;
    if (!isStrArray(n.next) || n.next.some((t) => !ids.has(t))) return false;
    if (n.crossed !== undefined && typeof n.crossed !== 'string') return false;
    const fights = n.kind === 'duel' || n.kind === 'elite' || n.kind === 'warden';
    if (fights && (typeof n.enemyId !== 'string' || !ENEMY_IDS.has(n.enemyId))) return false;
  }
  return true;
}

/** The context must be what the phase needs, so no screen can be handed missing data. */
function validContext(r: RunState): boolean {
  const ids = new Set(r.map.nodes.map((n) => n.id));
  if (r.phase === 'kit') {
    const k = isObj(r.context) ? r.context['kits'] : undefined;
    return (
      Array.isArray(k) &&
      k.length > 0 &&
      k.every(
        (x) =>
          isObj(x) &&
          typeof x['id'] === 'string' &&
          Array.isArray(x['deck']) &&
          x['deck'].length >= V2_DECK_RULES.minSize &&
          x['deck'].every((id) => hasCard(id)),
      )
    );
  }
  if (r.phase === 'prelude') {
    const p = isObj(r.context) ? r.context['prelude'] : undefined;
    return (
      isObj(p) &&
      Array.isArray(p['options']) &&
      p['options'].length > 0 &&
      p['options'].every(
        (o) => isObj(o) && typeof o['id'] === 'string' && Array.isArray(o['effects']),
      )
    );
  }
  const needsNode: RunPhase[] = ['duel', 'reward', 'gift', 'shrine', 'merchant', 'event'];
  if (!needsNode.includes(r.phase)) return true;
  const c = r.context;
  if (!isObj(c) || typeof c['nodeId'] !== 'string') return false;
  // a card chosen at the Threshold or a Waymark has no node behind it (nodeId is empty), like the prelude itself
  const fromPrelude = r.phase === 'reward' && c['nodeId'] === '';
  if (!fromPrelude && !ids.has(c['nodeId'])) return false;
  const cards = (x: unknown): x is string[] => isStrArray(x) && x.every((id) => hasCard(id));
  switch (r.phase) {
    case 'duel': {
      const node = r.map.nodes.find((n) => n.id === c['nodeId']);
      if (c['ghost'] !== undefined && checkGhostBoss(c['ghost']) === null) return false;
      return !!node?.enemyId;
    }
    case 'reward':
    case 'gift':
      return cards(c['offers']);
    case 'merchant': {
      const m = c['merchant'];
      return (
        isObj(m) &&
        Array.isArray(m['items']) &&
        (m['items'] as unknown[]).every(
          (it) =>
            isObj(it) &&
            typeof it['cardId'] === 'string' &&
            hasCard(it['cardId']) &&
            isInt(it['price'], 0, 100000),
        ) &&
        isInt(m['removePrice'], 0, 100000) &&
        (m['upgrades'] === undefined || isInt(m['upgrades'], 0, 1000)) &&
        (m['potions'] === undefined ||
          (Array.isArray(m['potions']) &&
            (m['potions'] as unknown[]).every(
              (p) =>
                isObj(p) &&
                typeof p['id'] === 'string' &&
                Object.hasOwn(COMBAT_DB.potions, p['id']) &&
                isInt(p['price'], 0, 100000),
            ))) &&
        (m['boon'] === undefined ||
          (isObj(m['boon']) &&
            typeof m['boon']['id'] === 'string' &&
            Object.hasOwn(COMBAT_DB.boons, m['boon']['id']) &&
            isInt(m['boon']['price'], 0, 100000)))
      );
    }
    case 'event': {
      const e = c['event'];
      const okOffer = (x: unknown): boolean => x === undefined || x === '' || hasCard(x);
      return (
        isObj(e) &&
        Array.isArray(e['options']) &&
        (e['options'] as unknown[]).length > 0 &&
        (e['options'] as unknown[]).every(
          (o) =>
            isObj(o) &&
            typeof o['id'] === 'string' &&
            (o['deal'] === undefined || validDeal(o['deal'])),
        ) &&
        okOffer(e['cardOffer']) &&
        (e['choose'] === undefined ||
          (isObj(e['choose']) &&
            Array.isArray(e['choose']['cards']) &&
            (e['choose']['cards'] as unknown[]).every(hasCard))) &&
        (e['trial'] === undefined || validTrial(e['trial'])) &&
        (e['cardOffers'] === undefined ||
          (Array.isArray(e['cardOffers']) && (e['cardOffers'] as unknown[]).every(hasCard))) &&
        (e['boonOffer'] === undefined ||
          (typeof e['boonOffer'] === 'string' && Object.hasOwn(COMBAT_DB.boons, e['boonOffer'])))
      );
    }
    default:
      return true;
  }
}

const GAMES = ['reel', 'cascade'];
/** Trial games that were taken out: a run saved in front of one finds the place empty (just a walk away). */
const RETIRED_GAMES = [
  'echoes',
  'pairs',
  'runelock',
  'cardquiz',
  'whose',
  'maze',
  'rhythm',
  'cipher',
];
/** An elite event's trial: a known game, a state, and prizes that are deal steps like any option. */
function validTrial(t: unknown): boolean {
  if (!isObj(t) || !GAMES.includes(t['game'] as string)) return false;
  if (t['state'] !== 'open' && t['state'] !== 'playing' && t['state'] !== 'won') return false;
  if (!isInt(t['seed'], 0, 4294967295) || !isInt(t['consolation'], 0, 10000)) return false;
  if (t['rolls'] !== undefined && !isInt(t['rolls'], 0, 10000)) return false;
  const earned = t['earned'];
  if (t['state'] === 'won' && !(Array.isArray(earned) && earned.length > 0)) return false;
  if (
    earned !== undefined &&
    !(Array.isArray(earned) && earned.length <= 24 && earned.every((x) => isInt(x, 0, 23)))
  )
    return false;
  const prize = (p: unknown): boolean =>
    isObj(p) &&
    typeof p['id'] === 'string' &&
    validDeal(p['deal']) &&
    (p['removeUpTo'] === undefined || isInt(p['removeUpTo'], 1, 5)) &&
    (p['choices'] === undefined ||
      (Array.isArray(p['choices']) && p['choices'].length <= 3 && p['choices'].every(hasCard)));
  if (
    t['seconds'] !== undefined &&
    !(Array.isArray(t['seconds']) && t['seconds'].length <= 10 && t['seconds'].every(prize))
  )
    return false;
  return (
    Array.isArray(t['prizes']) &&
    (t['prizes'] as unknown[]).length <= 24 &&
    (t['prizes'] as unknown[]).length > 0 &&
    (t['prizes'] as unknown[]).every(prize)
  );
}

const DEAL_KINDS = new Set([
  'hurt',
  'hurtPct',
  'heal',
  'maxHp',
  'shards',
  'wound',
  'potion',
  'boon',
  'upgrade',
  'remove',
  'transform',
  'copy',
  'gift',
  'crossed',
  'crossedPick',
  'card',
  'static',
  'loseBoon',
  'losePotion',
  'exchange',
  'boonOf',
  'potionOf',
  'mark',
  'chance',
]);
/** An event option's effect steps (see deals.ts): known kinds, whole numbers, chance branches that are step lists too. */
function validDeal(steps: unknown, depth = 0): boolean {
  if (!Array.isArray(steps) || depth > 3) return false;
  return steps.every((s) => {
    if (!isObj(s) || typeof s['k'] !== 'string' || !DEAL_KINDS.has(s['k'])) return false;
    for (const f of ['n', 'pct'] as const)
      if (s[f] !== undefined && !isInt(s[f], -100000, 100000)) return false;
    if (s['k'] === 'card' && !hasCard(s['id'])) return false;
    if (
      s['k'] === 'boonOf' &&
      !(typeof s['id'] === 'string' && Object.hasOwn(COMBAT_DB.boons, s['id']))
    )
      return false;
    if (
      s['k'] === 'potionOf' &&
      !(typeof s['id'] === 'string' && Object.hasOwn(COMBAT_DB.potions, s['id']))
    )
      return false;
    if (s['k'] === 'mark' && typeof s['id'] !== 'string') return false;
    if (s['k'] === 'chance')
      return validDeal(s['win'], depth + 1) && validDeal(s['lose'], depth + 1);
    return true;
  });
}

/** Returns the run, or null when the text is not a valid save. */
export function parseRun(text: string): RunState | null {
  if (text.length > 2_000_000) return null;
  let raw: unknown;
  try {
    // a card that was renamed keeps working in old saves
    raw = JSON.parse(text.replace(/"twelve-gauge(\+?)"/g, '"slug-round$1"'));
  } catch {
    return null;
  }
  if (!isObj(raw)) return null;
  const r = raw as Partial<RunState>;
  if (r.v !== RUN_SAVE_VERSION) return null;
  // a save from before the Riftwalkers were named for their class (maren -> knight): the character, and any visiting merchant
  if (typeof r.character === 'string')
    r.character = canonicalHero(r.character) as RunState['character'];
  for (const n of (r.map?.nodes ?? []) as { crossed?: unknown }[])
    if (typeof n.crossed === 'string') n.crossed = canonicalHero(n.crossed);
  const shop = (r.context as { merchant?: { crossed?: unknown } } | null | undefined)?.merchant;
  if (shop && typeof shop.crossed === 'string') shop.crossed = canonicalHero(shop.crossed);
  if (typeof r.seed !== 'string') return null;
  if (typeof r.character !== 'string' || !Object.hasOwn(RIFTWALKERS, r.character)) return null;
  if (!isInt(r.maxHp, 1, 9999) || !isInt(r.hp, 1, r.maxHp)) return null;
  // saves from before the difficulty setting were all played on Easy
  if (r.difficulty === undefined) r.difficulty = 'easy';
  if (r.difficulty !== 'easy' && r.difficulty !== 'normal' && r.difficulty !== 'hard') return null;
  // saves from before several cards could be held kept one card on hold
  const held: unknown = (r as { held?: unknown }).held;
  if (held !== undefined) {
    const list = Array.isArray(held) ? (held as unknown[]) : [held];
    const clean = list.flatMap((h) =>
      isObj(h) && hasCard(h['cardId']) && isInt(h['price'], 0, 100_000)
        ? [{ cardId: h['cardId'] as string, price: h['price'] }]
        : [],
    );
    if (clean.length) r.held = clean.slice(0, 3);
    else delete r.held;
  }
  const oldTrial = (r.context as { event?: { trial?: { game?: unknown } } } | null | undefined)
    ?.event?.trial;
  if (oldTrial && RETIRED_GAMES.includes(oldTrial.game as string)) {
    const ev = (r.context as { event: { trial?: unknown; options: { id: string }[] } }).event;
    delete ev.trial;
    ev.options = ev.options.filter((o) => o.id !== 'trial');
    if (!ev.options.length) ev.options = [{ id: 'leave' }];
  }
  // event flags and the last event's coin tosses: kept only when well-formed
  const loose = r as { marks?: unknown; eventFlips?: unknown };
  if (loose.marks !== undefined && !isStrArray(loose.marks)) delete loose.marks;
  if (
    loose.eventFlips !== undefined &&
    !(
      Array.isArray(loose.eventFlips) &&
      (loose.eventFlips as unknown[]).every(
        (f) => isObj(f) && isInt(f['pct'], 0, 100) && typeof f['won'] === 'boolean',
      )
    )
  )
    delete loose.eventFlips;
  // saves from before card luck existed were all normal
  if (r.luck === undefined) r.luck = 'normal';
  if (r.luck !== 'normal' && r.luck !== 'lucky' && r.luck !== 'blessed') return null;
  if (!isInt(r.tier, 1, 99) || !isInt(r.stage, 1, FINAL_STAGE)) return null;
  if (!isInt(r.maxResolve, 1, 9) || !isInt(r.resolve, 0, r.maxResolve)) return null;
  if (!isInt(r.shards, 0, 1_000_000)) return null;
  if (!Array.isArray(r.deck) || r.deck.some((id) => !hasCard(id))) return null;
  if (r.deck.length < V2_DECK_RULES.minSize || r.deck.length > 200) return null;
  if (typeof r.phase !== 'string' || !PHASES.includes(r.phase)) return null;
  if (!validMap(r.map)) return null;
  if (!isStrArray(r.cleared)) return null;
  const ids = new Set(r.map.nodes.map((n) => n.id));
  if (r.cleared.some((id) => !ids.has(id))) return null;
  if (r.at !== null && (typeof r.at !== 'string' || !ids.has(r.at))) return null;
  if (!Array.isArray(r.rng) || r.rng.length !== 4 || r.rng.some((x) => typeof x !== 'number'))
    return null;
  if (!isStrArray(r.stageRealms) || (r.stageRealms.length !== 3 && r.stageRealms.length !== 4))
    return null;
  if (!isObj(r.stats)) return null;
  if (r.potions === undefined) r.potions = [];
  if (
    !isStrArray(r.potions) ||
    r.potions.length > 3 ||
    r.potions.some((id) => !Object.hasOwn(COMBAT_DB.potions, id))
  )
    return null;
  if (
    !isStrArray(r.boons) ||
    r.boons.some((id) => !Object.hasOwn(COMBAT_DB.boons, id)) ||
    new Set(r.boons).size !== r.boons.length
  )
    return null;
  const run = r as RunState;
  if (!validContext(run)) return null;
  return run;
}
