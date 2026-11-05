import { expect, it } from 'vitest';
import { RULES_VERSION, type StoredReplay } from '@sr/pvp';
import { RIFTWALKERS } from '@sr/content/v2';
import { replayArchive, readReplayArchive } from './replayArchive';
const entry = {
  hero: 'knight',
  name: 'Tester',
  deck: [...RIFTWALKERS.knight.starter],
  boons: [],
  tier: 20,
  who: 'a'.repeat(64),
  run: 'private-run',
};
const replay: StoredReplay = {
  id: 'Abcdef1234',
  at: 1,
  rules: RULES_VERSION,
  seed: 'arena-seed',
  a: entry,
  b: entry,
  winner: 'a',
  reason: 'resign',
  log: [],
};
it('saves an independent match record with matching definitions, feedback and no account/run IDs', () => {
  const archive = replayArchive(replay, 'I was trying a defensive build.');
  expect(readReplayArchive(JSON.parse(JSON.stringify(archive)))?.note).toBe(archive.note);
  expect(archive.contentRules).toBe(RULES_VERSION);
  expect(archive.content?.cards.strike).toBeDefined();
  expect(JSON.stringify(archive)).not.toContain('private-run');
  expect(JSON.stringify(archive)).not.toContain('a'.repeat(64));
  expect(replayArchive({ ...replay, rules: RULES_VERSION - 1 }, '').content).toBeNull();
  const historical = replayArchive(
    { ...replay, rules: RULES_VERSION - 1, a: { ...entry, deck: ['retired-card'] } },
    'Historical evidence',
  );
  expect(readReplayArchive(historical)?.replay.a.deck).toEqual(['retired-card']);
  const frozen = { content: archive.content, contentRules: RULES_VERSION - 1 };
  const imported = readReplayArchive({ ...historical, ...frozen })!;
  expect(replayArchive(imported.replay, imported.note, imported).content).toEqual(archive.content);
  expect(readReplayArchive({ schema: 9 })).toBeNull();
});
