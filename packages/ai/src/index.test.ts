import { describe, expect, it } from 'vitest';
import { createEngine, hashState, type GameState } from '@sr/engine';
import {
  CARD_DB,
  CHARACTERS,
  ENEMIES,
  character,
  deckList,
  starterDeck,
  type CharacterId,
} from '@sr/content';
import { HeuristicAi, PERSONALITIES, RandomAi, type AiPlayer } from './index';

const engine = createEngine(CARD_DB);

function newGame(a: CharacterId, b: CharacterId, seed: string): GameState {
  return engine.createGame({
    seed,
    players: [
      { deck: starterDeck(a), sigil: character(a).sigil },
      { deck: starterDeck(b), sigil: character(b).sigil },
    ],
  });
}

function play(a: CharacterId, b: CharacterId, seed: string, ais: [AiPlayer, AiPlayer]): GameState {
  let s = newGame(a, b, seed);
  for (let i = 0; i < 20_000; i++) {
    const p = engine.toAct(s);
    if (p === null) break;
    s = engine.applyAction(s, ais[p].choose(engine, s, p)).state;
  }
  return s;
}

describe('RandomAi', () => {
  it('only plays legal moves and finishes games', () => {
    for (let i = 0; i < 10; i++) {
      const s = play('maren', 'kesh', `r${i}`, [new RandomAi(`a${i}`), new RandomAi(`b${i}`)]);
      expect(s.winner).not.toBeNull();
    }
  });

  it('is deterministic for a seed', () => {
    const run = () => play('rivet', 'vesper', 'same', [new RandomAi('x'), new RandomAi('y')]);
    expect(hashState(run())).toBe(hashState(run()));
  });
});

describe('HeuristicAi', () => {
  const mk = (seed: string, personality = PERSONALITIES.balanced) =>
    new HeuristicAi({ db: CARD_DB, seed, personality });

  it('plays legal moves in every pairing and finishes games', () => {
    for (const [i, a] of CHARACTERS.entries()) {
      const b = CHARACTERS[(i + 1) % CHARACTERS.length] as (typeof CHARACTERS)[number];
      const s = play(a.id, b.id, `h${i}`, [mk(`a${i}`), mk(`b${i}`)]);
      expect(s.winner, `${a.id} vs ${b.id}`).not.toBeNull();
    }
  }, 120_000);

  it('is deterministic for a seed', () => {
    const run = () => play('maren', 'rivet', 'det', [mk('p'), mk('q')]);
    expect(hashState(run())).toBe(hashState(run()));
  }, 60_000);

  it('beats the random AI most of the time', () => {
    let wins = 0;
    const games = 16;
    for (let i = 0; i < games; i++) {
      const seatZero = i % 2 === 0;
      const heuristic = mk(`m${i}`);
      const random = new RandomAi(`r${i}`);
      const s = play(
        'maren',
        'kesh',
        `match-${i}`,
        seatZero ? [heuristic, random] : [random, heuristic],
      );
      if (s.winner === (seatZero ? 0 : 1)) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(Math.ceil(games * 0.75));
  }, 300_000);
});

describe('enemies and the AI', () => {
  it('every enemy personality is one the AI knows', () => {
    for (const e of ENEMIES) expect(e.personality in PERSONALITIES, e.id).toBe(true);
  });

  it('every enemy deck plays a full game under the heuristic AI against a starter', () => {
    for (const [i, e] of ENEMIES.entries()) {
      let s = engine.createGame({
        seed: `enemy-ai-${i}`,
        players: [
          { deck: starterDeck('maren'), sigil: character('maren').sigil },
          { deck: deckList(e), essence: e.essence },
        ],
      });
      const ais = [
        new HeuristicAi({ db: CARD_DB, seed: `p${i}` }),
        new HeuristicAi({ db: CARD_DB, seed: `e${i}`, personality: PERSONALITIES[e.personality] }),
      ];
      for (let k = 0; k < 20_000; k++) {
        const p = engine.toAct(s);
        if (p === null) break;
        s = engine.applyAction(s, (ais[p] as AiPlayer).choose(engine, s, p)).state;
      }
      expect(s.winner, e.id).not.toBeNull();
    }
  }, 300_000);
});
