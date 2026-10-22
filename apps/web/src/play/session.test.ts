import { describe, expect, it } from 'vitest';
import type { Action, GameState } from '@sr/engine';
import { CARD_DB } from '@sr/content';
import {
  AI_SEAT,
  DuelSession,
  HUMAN,
  isOnlyPassOrSpark,
  sparkEnablesResponse,
  type Batch,
} from './session';

/** A tiny seeded generator so the "human" in these tests is reproducible. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

async function playOut(seed: string, rngSeed: number, maxSteps = 600) {
  const batches: Batch[] = [];
  let error: unknown = null;
  const session = new DuelSession(
    { seed, character: 'maren', enemyId: 'aur-squire-recruit' },
    {
      onBatch: (b) => {
        batches.push(b);
        return Promise.resolve();
      },
      onIdle: () => undefined,
      onError: (e) => {
        error = e;
      },
    },
  );
  await session.start();
  const rand = lcg(rngSeed);
  let steps = 0;
  while (!session.over && steps++ < maxSteps && !error) {
    const legal = session.legal();
    if (legal.length === 0) break;
    // prefer doing things over ending the turn so games actually progress
    const doing = legal.filter((a) => a.type !== 'endTurn' && a.type !== 'pass');
    const pool = doing.length > 0 && rand() < 0.85 ? doing : legal;
    await session.submit(pool[Math.floor(rand() * pool.length)] as Action);
  }
  return { session, batches, error, steps };
}

describe('DuelSession', () => {
  it('starts, plays a whole match against the AI without engine errors', async () => {
    const { session, batches, error } = await playOut('t-1', 1);
    expect(error).toBeNull();
    expect(batches.length).toBeGreaterThan(10);
    // it ended, or is waiting on the human after a long game: either way no error and a consistent view
    const v = session.view();
    expect(v.players[HUMAN].essence).toBeLessThanOrEqual(v.players[HUMAN].maxEssence);
  }, 120_000);

  it('never shows the human the AI hand or its drawn cards', async () => {
    const { batches } = await playOut('t-2', 2, 250);
    for (const b of batches) {
      expect(b.after.players[AI_SEAT].hand).toBeNull();
      expect(b.before.players[AI_SEAT].hand).toBeNull();
      for (const e of b.events) {
        if (e.type === 'cardDrawn' && e.player === AI_SEAT) {
          expect(e.cardId).toBe('?');
          expect(e.id).toBe('?');
        }
      }
    }
  }, 120_000);

  it('emits batches in order and each batch ends where the next begins', async () => {
    const { batches } = await playOut('t-3', 3, 120);
    for (let i = 1; i < batches.length; i++) {
      const a = batches[i - 1]!.after;
      const b = batches[i]!.before;
      expect(b.turn).toBe(a.turn);
      expect(b.players[HUMAN].essence).toBe(a.players[HUMAN].essence);
      expect(b.players[AI_SEAT].essence).toBe(a.players[AI_SEAT].essence);
    }
  }, 120_000);

  it('rejects submitting for the AI seat', async () => {
    const session = new DuelSession(
      { seed: 't-4', character: 'rivet', enemyId: 'aur-squire-recruit' },
      { onBatch: () => Promise.resolve(), onIdle: () => undefined, onError: () => undefined },
    );
    await session.start();
    await expect(session.submit({ type: 'pass', player: 1 })).rejects.toThrow();
  });

  it('auto-pass rule: only Pass (or a free Rift Spark) means nothing to decide', async () => {
    const session = new DuelSession(
      { seed: 't-5', character: 'kesh', enemyId: 'aur-squire-recruit' },
      { onBatch: () => Promise.resolve(), onIdle: () => undefined, onError: () => undefined },
    );
    await session.start();
    expect(isOnlyPassOrSpark([{ type: 'pass', player: 0 }], session.raw)).toBe(true);
    expect(isOnlyPassOrSpark([{ type: 'endTurn', player: 0 }], session.raw)).toBe(false);
  });
});

describe('Rift Spark auto-pass rule', () => {
  const trap = CARD_DB['UMB-13'];
  const stateWith = (mana: number): GameState =>
    ({
      rules: { secondPlayerCard: 'TOK-SPARK' },
      players: [
        { mana, tempMana: 0, backrow: ['t'], hand: [] },
        { mana: 0, tempMana: 0, backrow: [], hand: [] },
      ],
      cards: { t: { id: 't', cardId: 'UMB-13', faceDown: true } },
    }) as unknown as GameState;

  it('does not auto-pass when one more Mana would afford a face-down trap', () => {
    expect(trap).toBeDefined();
    const cost = trap?.cost ?? 0;
    expect(sparkEnablesResponse(stateWith(cost - 1))).toBe(true);
    expect(sparkEnablesResponse(stateWith(cost))).toBe(false);
  });

  it('uses the configured second-player card, not a hard-coded id', () => {
    const s = stateWith(0);
    s.cards['x'] = { id: 'x', cardId: 'TOK-SPARK' } as unknown as GameState['cards'][string];
    expect(isOnlyPassOrSpark([{ type: 'play', player: 0, card: 'x', targets: [] }], s)).toBe(true);
    s.rules = { ...s.rules, secondPlayerCard: null };
    expect(isOnlyPassOrSpark([{ type: 'play', player: 0, card: 'x', targets: [] }], s)).toBe(false);
  });
});

describe('illegal actions', () => {
  it('are rejected without ending the match', async () => {
    let error: unknown = null;
    const session = new DuelSession(
      { seed: 't-6', character: 'maren', enemyId: 'aur-squire-recruit' },
      {
        onBatch: () => Promise.resolve(),
        onIdle: () => undefined,
        onError: (e) => {
          error = e;
        },
      },
    );
    await session.start();
    const before = session.legal().length;
    await session.submit({ type: 'endTurn', player: 0 }); // not legal during the mulligan
    expect(error).toBeNull();
    expect(session.legal().length).toBe(before);
  });
});
