import { describe, expect, it } from 'vitest';
import { createEngine, hashState, type GameState } from '@sr/engine';
import { FIXTURE_DB } from '@sr/engine/testkit';
import { RandomAi } from './index';

const engine = createEngine(FIXTURE_DB);
const deck = Array.from({ length: 20 }, (_, i) => (i % 2 ? 'TST-3-3' : 'TST-PIT'));

function play(seed: string): GameState {
  const ais = [new RandomAi(`${seed}-a`), new RandomAi(`${seed}-b`)];
  let s = engine.createGame({ seed, players: [{ deck }, { deck }] });
  for (let i = 0; i < 20_000; i++) {
    const p = engine.toAct(s);
    if (p === null) break;
    s = engine.applyAction(s, (ais[p] as RandomAi).choose(engine, s, p)).state;
  }
  return s;
}

describe('RandomAi', () => {
  it('only plays legal moves and finishes games', () => {
    for (let i = 0; i < 20; i++) expect(play(`g${i}`).winner).not.toBeNull();
  });

  it('is deterministic for a seed', () => {
    expect(hashState(play('same'))).toBe(hashState(play('same')));
  });
});
