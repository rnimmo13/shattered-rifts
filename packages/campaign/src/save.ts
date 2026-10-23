// Saving a run: plain JSON text, so it can go to localStorage and to an export file. Loading checks the whole shape
// and the deck rules, so a hand-edited or damaged save is refused instead of crashing the game.

import { COMBAT_DB, ENCOUNTERS, RIFTWALKERS, V2_DECK_RULES } from '@sr/content/v2';
const hasCard = (id: unknown): boolean =>
  typeof id === 'string' && Object.hasOwn(COMBAT_DB.cards, id);
import type { MapNode, NodeKind, RunPhase, RunState } from './types';

export const RUN_SAVE_VERSION = 2;

const PHASES: readonly RunPhase[] = [
  'map',
  'duel',
  'reward',
  'gift',
  'shrine',
  'merchant',
  'event',
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
  if (!isObj(map) || !isInt(map['stage'], 1, 5) || !isInt(map['floors'], 1, 20)) return false;
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
    const fights = n.kind === 'duel' || n.kind === 'elite' || n.kind === 'warden';
    if (fights && (typeof n.enemyId !== 'string' || !ENEMY_IDS.has(n.enemyId))) return false;
  }
  return true;
}

/** The context must be what the phase needs, so no screen can be handed missing data. */
function validContext(r: RunState): boolean {
  const ids = new Set(r.map.nodes.map((n) => n.id));
  const needsNode: RunPhase[] = ['duel', 'reward', 'gift', 'shrine', 'merchant', 'event'];
  if (!needsNode.includes(r.phase)) return true;
  const c = r.context;
  if (!isObj(c) || typeof c['nodeId'] !== 'string' || !ids.has(c['nodeId'])) return false;
  const cards = (x: unknown): x is string[] => isStrArray(x) && x.every((id) => hasCard(id));
  switch (r.phase) {
    case 'duel': {
      const node = r.map.nodes.find((n) => n.id === c['nodeId']);
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
        (e['options'] as unknown[]).every((o) => isObj(o) && typeof o['id'] === 'string') &&
        okOffer(e['cardOffer']) &&
        (e['boonOffer'] === undefined ||
          (typeof e['boonOffer'] === 'string' && Object.hasOwn(COMBAT_DB.boons, e['boonOffer'])))
      );
    }
    default:
      return true;
  }
}

/** Returns the run, or null when the text is not a valid save. */
export function parseRun(text: string): RunState | null {
  if (text.length > 2_000_000) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObj(raw)) return null;
  const r = raw as Partial<RunState>;
  if (r.v !== RUN_SAVE_VERSION) return null;
  if (typeof r.seed !== 'string') return null;
  if (typeof r.character !== 'string' || !Object.hasOwn(RIFTWALKERS, r.character)) return null;
  if (!isInt(r.maxHp, 1, 9999) || !isInt(r.hp, 1, r.maxHp)) return null;
  // saves from before the difficulty setting were all played on Easy
  if (r.difficulty === undefined) r.difficulty = 'easy';
  if (r.difficulty !== 'easy' && r.difficulty !== 'normal') return null;
  if (!isInt(r.tier, 1, 99) || !isInt(r.stage, 1, 5)) return null;
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
  if (!isStrArray(r.stageRealms) || r.stageRealms.length !== 3) return null;
  if (!isObj(r.stats)) return null;
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
