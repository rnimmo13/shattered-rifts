import { COMBAT_DB } from '@sr/content/v2';
import { cleanReplay, RULES_VERSION, type StoredReplay } from '@sr/pvp';
import { BUILD } from '../build';
import type { CombatDb } from '@sr/combat';

export interface ArchivedDefinitions {
  content: CombatDb | null;
  contentRules: number | null;
}

export function replayArchive(replay: StoredReplay, note: string, original?: ArchivedDefinitions) {
  // Public display names are retained; account/run identifiers do not belong in a shared archive.
  const entry = (e: StoredReplay['a']) => ({
    name: e.name,
    hero: e.hero,
    deck: e.deck,
    boons: e.boons,
    tier: e.tier,
    ascendancy: e.ascendancy,
    stage: e.stage,
    maxHp: e.maxHp,
  });
  return {
    schema: 1,
    kind: 'shattered-rifts-arena-match',
    exportedBy: BUILD,
    note: note.slice(0, 4000),
    replay: { ...replay, a: entry(replay.a), b: entry(replay.b) },
    // Never attach today's card definitions to an older-rule game.
    content:
      original?.contentRules === replay.rules
        ? original.content
        : replay.rules === RULES_VERSION
          ? COMBAT_DB
          : null,
    contentRules:
      original?.contentRules === replay.rules
        ? original.contentRules
        : replay.rules === RULES_VERSION
          ? RULES_VERSION
          : null,
  };
}
export function readReplayArchive(
  raw: unknown,
): ({ replay: StoredReplay; note: string } & ArchivedDefinitions) | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  if (a['schema'] !== 1 || a['kind'] !== 'shattered-rifts-arena-match') return null;
  const replay = cleanReplay(a['replay']);
  return replay
    ? {
        replay,
        note: typeof a['note'] === 'string' ? a['note'].slice(0, 4000) : '',
        content:
          a['contentRules'] === replay.rules && a['content'] && typeof a['content'] === 'object'
            ? (a['content'] as CombatDb)
            : null,
        contentRules: a['contentRules'] === replay.rules ? replay.rules : null,
      }
    : null;
}
export function downloadReplayArchive(
  replay: StoredReplay,
  note: string,
  original?: ArchivedDefinitions,
): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(replayArchive(replay, note, original), null, 2)], {
      type: 'application/json',
    }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `shattered-rifts-arena-${replay.id}.json`;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
