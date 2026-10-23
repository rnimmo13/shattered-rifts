// @sr/combat: Combat v2 (Slay-the-Spire-style). Pure and deterministic, like the original engine.

export * from './types';
export { validateDb } from './validate';
export { chooseAction, evaluate } from './bot';
export {
  applyAction,
  createCombat,
  legalActions,
  canPlay,
  heroOf,
  modifiedDamage,
  activePattern,
  type StepResult,
} from './engine';
export {
  viewFor,
  eventsFor,
  describeIntent,
  cardText,
  opText,
  type CombatView,
  type SideView,
  type UnitView,
  type IntentView,
  type IntentIcon,
} from './view';

/** Stable fingerprint of a state, for determinism tests and save-game checks. */
export function hashState(state: unknown): string {
  const text = JSON.stringify(state);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
