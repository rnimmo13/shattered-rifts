// One simulated game between two decks, played by AIs. Pure of any I/O so workers can run it.

import { createEngine, type Engine, type GameState, type Rules } from '@sr/engine';
import { CARD_DB } from '@sr/content';
import { HeuristicAi, PERSONALITIES, RandomAi, type AiPlayer, type PersonalityId } from '@sr/ai';

export interface DeckSpec {
  label: string;
  cards: string[];
  sigil?: string;
  /** Starting Essence (enemies have their own). */
  essence?: number;
  /** Overrides the AI personality for this deck (enemies bring their own). */
  personality?: PersonalityId;
}

export interface AiSpec {
  kind: 'heuristic' | 'random';
  personality: PersonalityId;
}

export interface GameTask {
  seed: string;
  a: DeckSpec;
  b: DeckSpec;
  aiA: AiSpec;
  aiB: AiSpec;
  /** Whether deck A takes the first turn (alternated by the runner so seats are fair). */
  aFirst: boolean;
  /** Rule overrides, e.g. { secondPlayerExtraCards: 1 } to test a balance change. */
  rules?: Partial<Rules>;
}

export interface GameResult {
  winner: 'a' | 'b' | 'draw';
  turns: number;
  aFirst: boolean;
}

let cached: Engine | undefined;
const engine = (): Engine => (cached ??= createEngine(CARD_DB));

function makeAi(spec: AiSpec, seed: string, deck: DeckSpec): AiPlayer {
  if (spec.kind === 'random') return new RandomAi(seed);
  const personality = PERSONALITIES[deck.personality ?? spec.personality];
  return new HeuristicAi({ db: CARD_DB, seed, personality });
}

export function playGame(t: GameTask): GameResult {
  const e = engine();
  const ais = [makeAi(t.aiA, `${t.seed}:A`, t.a), makeAi(t.aiB, `${t.seed}:B`, t.b)];
  let s: GameState = e.createGame({
    seed: t.seed,
    players: [
      {
        deck: t.a.cards,
        ...(t.a.sigil ? { sigil: t.a.sigil } : {}),
        ...(t.a.essence ? { essence: t.a.essence } : {}),
      },
      {
        deck: t.b.cards,
        ...(t.b.sigil ? { sigil: t.b.sigil } : {}),
        ...(t.b.essence ? { essence: t.b.essence } : {}),
      },
    ],
    first: t.aFirst ? 0 : 1,
    ...(t.rules ? { rules: t.rules } : {}),
  });
  for (let i = 0; i < 100_000; i++) {
    const p = e.toAct(s);
    if (p === null) break;
    s = e.applyAction(s, (ais[p] as AiPlayer).choose(e, s, p)).state;
  }
  const winner = s.winner === 0 ? 'a' : s.winner === 1 ? 'b' : 'draw';
  return { winner, turns: s.turn, aFirst: t.aFirst };
}
