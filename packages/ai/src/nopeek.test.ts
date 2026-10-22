// "No peeking": the heuristic AI plans only from viewFor(). These tests compare what it believes and
// chooses when ONLY the opponent's hidden cards differ, and prove the detector would catch a cheat.
import { describe, expect, it } from 'vitest';
import {
  createEngine,
  type Action,
  type CardInstance,
  type GameState,
  type GameView,
  type PlayerId,
} from '@sr/engine';
import { CARD_DB, character, starterDeck } from '@sr/content';
import { HeuristicAi, RandomAi, beliefFromView } from './index';

const engine = createEngine(CARD_DB);

/** Replaces everything `me` cannot see of the opponent with a different card. */
function tamper(s: GameState, me: PlayerId): GameState {
  const t = JSON.parse(JSON.stringify(s)) as GameState;
  for (const c of Object.values<CardInstance>(t.cards)) {
    if (c.controller === me && c.owner === me) continue;
    const hidden = c.zone === 'hand' || c.zone === 'deck' || (c.faceDown && c.controller !== me);
    if (!hidden) continue;
    const swap = c.zone === 'units' ? 'NEU-03' : c.zone === 'backrow' ? 'WYL-11' : 'NEU-07';
    c.cardId = swap;
    c.baseCardId = swap;
  }
  return t;
}

/** What a CHEATING client would use: the view, but with the opponent's secrets filled in. */
function cheatView(s: GameState, me: PlayerId): GameView {
  const v = engine.viewFor(s, me);
  for (const c of Object.values<CardInstance>(s.cards))
    v.cards[c.id] = JSON.parse(JSON.stringify(c)) as CardInstance;
  return v;
}

function playedGame(seed: string, steps: number, visit: (s: GameState) => void): void {
  const opponent = new RandomAi(`opp-${seed}`);
  const mine = new RandomAi(`me-${seed}`);
  let s = engine.createGame({
    seed,
    players: [
      { deck: starterDeck('maren'), sigil: character('maren').sigil },
      { deck: starterDeck('vesper'), sigil: character('vesper').sigil },
    ],
  });
  for (let i = 0; i < steps && s.winner === null; i++) {
    const p = engine.toAct(s);
    if (p === null) break;
    if (p === 0) visit(s);
    s = engine.applyAction(s, (p === 0 ? mine : opponent).choose(engine, s, p)).state;
  }
}

describe('HeuristicAi cannot see hidden information', () => {
  it('its belief state is identical when only the opponent’s hidden cards differ', () => {
    let checked = 0;
    for (const seed of ['nopeek-1', 'nopeek-2', 'nopeek-3']) {
      playedGame(seed, 500, (s) => {
        const a = beliefFromView(engine.viewFor(s, 0), 'k');
        const b = beliefFromView(engine.viewFor(tamper(s, 0), 0), 'k');
        expect(a).toEqual(b);
        checked++;
      });
    }
    expect(checked).toBeGreaterThan(60);
  });

  it('the opponent’s hidden cards are placeholders in the belief, never real cards', () => {
    playedGame('nopeek-4', 500, (s) => {
      const belief = beliefFromView(engine.viewFor(s, 0), 'k');
      for (const c of Object.values<CardInstance>(belief.cards)) {
        if (c.owner !== 1) continue;
        if (c.zone === 'hand' || c.zone === 'deck') expect(c.cardId).toBe('AI-UNKNOWN');
        if (c.faceDown && c.controller === 1) expect(c.cardId).toMatch(/^AI-UNKNOWN-(UNIT|TRAP)$/);
      }
    });
  });

  it('chooseFromView picks the same action for views of different hidden states', () => {
    const seed = 'nopeek-5';
    const real = new HeuristicAi({ db: CARD_DB, seed });
    const other = new HeuristicAi({ db: CARD_DB, seed });
    let checked = 0;
    playedGame(seed, 400, (s) => {
      const t = tamper(s, 0);
      const a: Action = real.chooseFromView(engine.viewFor(s, 0), engine.legalActions(s, 0), 0);
      const b: Action = other.chooseFromView(engine.viewFor(t, 0), engine.legalActions(t, 0), 0);
      expect(b).toEqual(a);
      checked++;
    });
    expect(checked).toBeGreaterThan(20);
  }, 300_000);

  it('the detector works: a cheating view WOULD be caught by the same comparison', () => {
    let caught = 0;
    playedGame('nopeek-6', 500, (s) => {
      const a = beliefFromView(cheatView(s, 0), 'k');
      const b = beliefFromView(cheatView(tamper(s, 0), 0), 'k');
      if (JSON.stringify(a) !== JSON.stringify(b)) caught++;
    });
    expect(caught).toBeGreaterThan(0);
  });
});
