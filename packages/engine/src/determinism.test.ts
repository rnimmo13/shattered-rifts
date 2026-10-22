// Determinism (seed + action log = identical game) and property tests over random legal games.
import { describe, expect, it } from 'vitest';
import { createEngine } from './engine';
import { FIXTURE_CARDS, FIXTURE_DB, randomGame, replay } from './testkit';
import type { GameConfig, GameState } from './types';
import { hashState } from './util';

const engine = createEngine(FIXTURE_DB);
const pool = FIXTURE_CARDS.filter((c) => c.collectible && c.type !== 'sigil').map((c) => c.id);

function deckFor(seed: number): string[] {
  // deterministic pseudo-random 24-card deck from the fixture pool
  const out: string[] = [];
  let x = seed * 2654435761;
  for (let i = 0; i < 24; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    out.push(pool[x % pool.length] as string);
  }
  return out;
}

const cfg = (n: number): GameConfig => ({
  seed: `game-${n}`,
  players: [
    { deck: deckFor(n), sigil: n % 2 ? 'SIG-TEST' : undefined },
    { deck: deckFor(n + 1000) },
  ].map((p) => (p.sigil ? p : { deck: p.deck })) as GameConfig['players'],
});

export function checkInvariants(s: GameState, initialCards: [number, number]): void {
  for (const p of [0, 1] as const) {
    const ps = s.players[p];
    const units = ps.units.filter(Boolean).length;
    if (units > s.rules.unitSlots) throw new Error('too many units');
    if (ps.backrow.filter(Boolean).length > s.rules.backrowSlots)
      throw new Error('too many backrow');
    if (ps.hand.length > s.rules.handLimit) throw new Error('hand over limit');
    for (const n of [ps.essence, ps.mana, ps.tempMana, ps.maxMana, ps.resonance]) {
      if (!Number.isFinite(n)) throw new Error('NaN in player state');
    }
    if (ps.mana < 0 || ps.tempMana < 0) throw new Error('negative Mana');
    if (ps.maxMana > s.rules.maxMana) throw new Error('max Mana over cap');
    // card conservation: every non-token card the player owns is in exactly one zone
    const owned = Object.values(s.cards).filter((c) => c.owner === p && c.zone !== 'sigil');
    const real = owned.filter((c) => !c.cardId.startsWith('TST-TOKEN'));
    const located =
      [...ps.deck, ...ps.hand, ...ps.void, ...ps.beyond].length +
      ps.units.filter(Boolean).length +
      ps.backrow.filter(Boolean).length +
      (ps.rift ? 1 : 0) +
      s.chain.filter(
        (l) => s.cards[l.sourceId]?.zone === 'chain' && s.cards[l.sourceId]?.owner === p,
      ).length;
    const tokensOnField = owned.filter(
      (c) => c.cardId === 'TST-TOKEN' && c.zone === 'units',
    ).length;
    if (located !== real.length + tokensOnField)
      throw new Error(
        `zone bookkeeping mismatch for p${p}: located=${located} real=${real.length} tokens=${tokensOnField} zones=${JSON.stringify(owned.map((c) => c.zone + ':' + c.cardId + ':' + c.controller))}`,
      );
    const nonTokenTotal = real.length;
    if (nonTokenTotal !== initialCards[p])
      throw new Error(`card conservation broken for p${p}: ${nonTokenTotal} vs ${initialCards[p]}`);
  }
}

describe('determinism', () => {
  it('replaying seed + action log reproduces an identical state hash', () => {
    for (let n = 0; n < 20; n++) {
      const c = cfg(n);
      const g = randomGame(engine, c, `d${n}`, { maxSteps: 3000 });
      const again = replay(engine, c, g.log);
      expect(hashState(again)).toBe(hashState(g.state));
    }
  });

  it('the same seed and driver produce the same game', () => {
    const a = randomGame(engine, cfg(7), 'same', { maxSteps: 2000 });
    const b = randomGame(engine, cfg(7), 'same', { maxSteps: 2000 });
    expect(hashState(a.state)).toBe(hashState(b.state));
    expect(a.log).toEqual(b.log);
  });

  it('different seeds give different games', () => {
    const a = engine.createGame(cfg(1));
    const b = engine.createGame({ ...cfg(1), seed: 'other' });
    expect(hashState(a)).not.toBe(hashState(b));
  });

  it('applyAction never mutates its input', () => {
    const s = engine.createGame(cfg(3));
    const before = hashState(s);
    engine.applyAction(s, engine.legalActions(s, s.first)[0] as never);
    expect(hashState(s)).toBe(before);
  });
});

describe('property: random legal games', () => {
  const games = 300; // the 10k-game property run is the M2 gate
  it(`${games} random games keep invariants and always end`, () => {
    let ended = 0;
    for (let n = 0; n < games; n++) {
      const c = cfg(n + 50);
      const first = engine.createGame(c).first; // seeded, so this matches the game below
      // the second player also owns Rift Spark
      const initial: [number, number] = [
        c.players[0].deck.length + (first === 1 ? 1 : 0),
        c.players[1].deck.length + (first === 0 ? 1 : 0),
      ];
      const g = randomGame(engine, c, `p${n}`, {
        maxSteps: 20_000,
        check: (s) => {
          if (s.phase !== 'mulligan') checkInvariants(s, initial);
        },
      });
      expect(g.state.winner, `game ${n} did not end`).not.toBeNull();
      expect(g.state.turn).toBeLessThanOrEqual(201);
      ended++;
    }
    expect(ended).toBe(games);
  }, 300_000);
});
