import { describe, expect, it } from 'vitest';
import type { Action, GameView } from '@sr/engine';
import { DuelSession, HUMAN } from './session';
import {
  attackTargets,
  cardPlays,
  describeAction,
  endTurnAction,
  playableIds,
  windowOptions,
} from './actions';
import {
  fieldKeys,
  idAtKey,
  keyResolver,
  playerOfKey,
  slotIndexOf,
  trapKey,
  unitKey,
} from './slots';

async function sessionAtMain(seed: string) {
  const session = new DuelSession(
    { seed, character: 'maren', enemyId: 'aur-squire-recruit' },
    {
      onBatch: () => Promise.resolve(),
      onIdle: () => undefined,
      onError: (e) => {
        throw e;
      },
    },
  );
  await session.start();
  // answer the mulligan (keep everything), then pass turns until the human can play something
  for (let i = 0; i < 40; i++) {
    const legal = session.legal();
    if (legal.length === 0) break;
    if (legal.some((a) => a.type === 'mulligan')) {
      await session.submit(
        legal.find((a) => a.type === 'mulligan' && a.cards.length === 0) as Action,
      );
      continue;
    }
    if (legal.some((a) => a.type === 'play' || a.type === 'setTrap')) return session;
    const end = endTurnAction(legal) ?? legal.find((a) => a.type === 'pass');
    if (!end) break;
    await session.submit(end);
  }
  return session;
}

describe('action helpers on a real game', () => {
  it('indexes plays by card, and every legal action has a label', async () => {
    const session = await sessionAtMain('h-1');
    const legal = session.legal();
    const view = session.view();
    expect(legal.length).toBeGreaterThan(0);
    for (const a of legal) expect(describeAction(a, view).length).toBeGreaterThan(0);
    const ids = playableIds(legal);
    for (const id of ids) {
      const plays = cardPlays(legal, id);
      expect(plays.length).toBeGreaterThan(0);
      expect(plays.every((p) => p.card === id)).toBe(true);
      expect(view.players[HUMAN].hand).toContain(id);
    }
  }, 60_000);

  it('only offers attack targets for units that can attack', async () => {
    const session = await sessionAtMain('h-2');
    const legal = session.legal();
    expect(attackTargets(legal, 'nope')).toEqual([]);
    expect(windowOptions([{ type: 'pass', player: 0 }])).toEqual([]);
  }, 60_000);
});

describe('slot mapping', () => {
  const view = {
    players: [
      { units: ['a', null, 'b', null, null], backrow: [null, 't', null, null] },
      { units: [null, 'x', null, null, null], backrow: ['y', null, null, null] },
    ],
    cards: {},
  } as unknown as GameView;

  it('names keys by side, kind and index', () => {
    expect(unitKey(0, 2)).toBe('me-unit-2');
    expect(trapKey(1, 0)).toBe('opp-trap-0');
    expect(playerOfKey('me-unit-1')).toBe(0);
    expect(playerOfKey('opp-trap-3')).toBe(1);
    expect(slotIndexOf('opp-unit-4')).toBe(4);
  });

  it('maps every field card to its slot and back', () => {
    const m = fieldKeys(view);
    expect(m.get('a')).toBe('me-unit-0');
    expect(m.get('b')).toBe('me-unit-2');
    expect(m.get('t')).toBe('me-trap-1');
    expect(m.get('x')).toBe('opp-unit-1');
    expect(m.get('y')).toBe('opp-trap-0');
    expect(idAtKey(view, 'me-unit-2')).toBe('b');
    expect(idAtKey(view, 'opp-trap-0')).toBe('y');
    expect(idAtKey(view, 'me-unit-1')).toBeNull();
  });

  it('a card that left the field during a batch still resolves to where it stood', () => {
    const after = {
      players: [
        { units: [null, null, 'b', null, null], backrow: [null, null, null, null] },
        { units: [null, null, null, null, null], backrow: [null, null, null, null] },
      ],
      cards: {},
    } as unknown as GameView;
    const resolve = keyResolver(view, after);
    expect(resolve('b')).toBe('me-unit-2');
    expect(resolve('a')).toBe('me-unit-0'); // destroyed: falls back to the "before" slot
    expect(resolve('zzz')).toBeUndefined();
  });
});
