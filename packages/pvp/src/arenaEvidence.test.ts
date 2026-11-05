import { expect, it } from 'vitest';
import { legalActions } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import { Match } from './match';
import { ArenaEvidenceRecorder, isArenaEvidence } from './arenaEvidence';

const entry = {
  hero: 'knight',
  name: 'Tester',
  deck: Array<string>(20).fill('strike'),
  boons: [],
  tier: 20,
};
it('records authoritative positions and events, rejects illegal moves and rebuilds identically on reconnect', () => {
  const m = new Match('evidence', entry, entry, 0, true);
  const before = JSON.stringify(m.evidence!.data.frames[0]);
  expect(m.submit('b', 1, { type: 'endTurn' }, 0).ok).toBe(false);
  expect(m.evidence!.data.totalActions).toBe(0);
  const action = legalActions(COMBAT_DB, m.state).find((a) => a.type === 'play')!;
  expect(m.submit('a', 1, action, 0).ok).toBe(true);
  expect(m.evidence!.data.frames[1]!.card).toBe('strike');
  expect(m.evidence!.data.frames[1]!.events.some((e) => e.type === 'damage')).toBe(true);
  expect(m.submit('a', 2, { type: 'endTurn' }, 0).ok).toBe(true);
  expect(JSON.stringify(m.evidence!.data.frames[0])).toBe(before);
  expect(isArenaEvidence(m.evidence!.data)).toBe(true);
  const rebuilt = new Match('evidence', entry, entry, 0, true);
  for (const move of m.log)
    expect(rebuilt.submit(move.seat, rebuilt.log.length + 1, move.action, 0).ok).toBe(true);
  expect(rebuilt.evidence!.data).toEqual(m.evidence!.data);
  expect(new Match('evidence', entry, entry, 0).evidence).toBeUndefined();
});
it('marks bounded capture incomplete without losing the complete accepted action count', () => {
  const recorder = new ArenaEvidenceRecorder();
  const m = new Match('bounds', entry, entry, 0);
  for (let seq = 0; seq < 2000; seq++) recorder.record(m.state, seq, []);
  expect(recorder.data.truncated).toBe(true);
  expect(recorder.data.totalActions).toBe(1999);
  expect(recorder.data.frames.length).toBeLessThan(1002);
  expect(isArenaEvidence(recorder.data)).toBe(true);
  expect(isArenaEvidence({ ...recorder.data, frames: [null] })).toBe(false);
});

it('retains normal accepted-move evidence beyond ten own turns for both seats', () => {
  const m = new Match('long-evidence-fixture', entry, entry, 0, true);
  // Scripted telemetry fixture: one Strike and End turn. No bot or balance measurement.
  for (let turn = 0; turn < 24; turn++) {
    const action = legalActions(COMBAT_DB, m.state).find((a) => a.type === 'play')!;
    expect(m.submit(m.active, m.log.length + 1, action, 0).ok).toBe(true);
    expect(m.submit(m.active, m.log.length + 1, { type: 'endTurn' }, 0).ok).toBe(true);
  }
  expect(m.turns.a).toBeGreaterThan(10);
  expect(m.turns.b).toBeGreaterThan(10);
  expect(m.evidence!.data.truncated).toBe(false);
  expect(m.evidence!.data.frames).toHaveLength(49);
  expect(m.evidence!.data.frames.at(-1)!.a.hand).toBeDefined();
});
