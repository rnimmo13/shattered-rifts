// Saving a run: plain JSON text, so it can go to localStorage and to an export file. Loading checks the shape and the
// deck rules, so a hand-edited or damaged save is refused instead of crashing the game.

import { CARD_DB, CHARACTERS, validateDeck } from '@sr/content';
import type { RunPhase, RunState } from './types';

export const RUN_SAVE_VERSION = 1;

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

export function serializeRun(run: RunState): string {
  return JSON.stringify(run);
}

const isInt = (x: unknown, min: number, max: number): x is number =>
  typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;

/** Returns the run, or null when the text is not a valid save. */
export function parseRun(text: string): RunState | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Partial<RunState>;
  if (r.v !== RUN_SAVE_VERSION) return null;
  if (typeof r.seed !== 'string') return null;
  if (!CHARACTERS.some((c) => c.id === r.character)) return null;
  if (!isInt(r.tier, 1, 99) || !isInt(r.stage, 1, 5)) return null;
  if (!isInt(r.maxResolve, 1, 9) || !isInt(r.resolve, 0, r.maxResolve)) return null;
  if (!isInt(r.shards, 0, 1_000_000)) return null;
  if (!Array.isArray(r.deck) || r.deck.some((id) => typeof id !== 'string' || !CARD_DB[id]))
    return null;
  if (validateDeck(r.deck, CARD_DB, 0).length > 0) return null;
  if (typeof r.phase !== 'string' || !PHASES.includes(r.phase)) return null;
  if (!r.map || !Array.isArray(r.map.nodes) || !Array.isArray(r.cleared)) return null;
  if (!Array.isArray(r.rng) || r.rng.length !== 4 || r.rng.some((x) => typeof x !== 'number'))
    return null;
  if (!Array.isArray(r.stageRealms) || r.stageRealms.length !== 3) return null;
  if (!r.stats || typeof r.stats !== 'object') return null;
  return r as RunState;
}
