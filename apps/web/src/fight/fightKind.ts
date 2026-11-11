// What kind of fight the battle screen's title names (DECISIONS #757): a badge beside the encounter's name, in the words the campaign
// map uses for its nodes (Duel, Elite, Warden, Echo), plus the fights the map has no node for.

import type { EncounterKind } from '@sr/content/v2';

export type FightTone = 'duel' | 'elite' | 'warden' | 'finale' | 'ghost' | 'arena' | 'sandbox';

export interface FightKind {
  label: string;
  tone: FightTone;
}

const ENCOUNTER: Record<EncounterKind, FightKind> = {
  regular: { label: 'Duel', tone: 'duel' },
  elite: { label: 'Elite', tone: 'elite' },
  warden: { label: 'Warden', tone: 'warden' },
  finale: { label: 'Final battle', tone: 'finale' },
};

/** The badge for an encounter of this kind. */
export const kindOfEncounter = (kind: EncounterKind): FightKind => ENCOUNTER[kind];

/**
 * The badge for a campaign fight: the map node's word, as the map shows it (at Tier XX an Elite node can hold a Warden's
 * encounter: it is still the Elite the player chose), except that the finale's fights are the Final battle.
 */
export function kindOfNode(node: string | undefined, kind: EncounterKind): FightKind {
  if (kind === 'finale') return ENCOUNTER.finale;
  if (node === 'duel') return ENCOUNTER.regular;
  if (node === 'elite') return ENCOUNTER.elite;
  if (node === 'warden') return ENCOUNTER.warden;
  return ENCOUNTER[kind];
}

export const ECHO: FightKind = { label: 'Echo', tone: 'ghost' };
export const GHOST_WARDEN: FightKind = { label: 'Ghost Warden', tone: 'ghost' };
export const ARENA: FightKind = { label: 'Arena', tone: 'arena' };
export const ARENA_GHOST: FightKind = { label: 'Arena ghost', tone: 'ghost' };
export const SANDBOX: FightKind = { label: 'Sandbox', tone: 'sandbox' };
