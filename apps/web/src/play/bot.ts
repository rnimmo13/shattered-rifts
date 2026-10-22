// A simple scripted "human" used to prove a duel can be played from the opening hand to Victory or Defeat:
// in the tests, and in the browser with ?bot in the address (it clicks through the real UI path). It only
// chooses among legal actions and reads the redacted view, exactly like the player does.

import type { Action, GameView } from '@sr/engine';
import { CARD_DB } from '@sr/content';

function costOf(view: GameView, cardId: string): number {
  const c = view.cards[cardId];
  return CARD_DB[c?.cardId ?? '']?.cost ?? 0;
}

/** True when every target is an enemy card (so we never aim our own removal at ourselves). */
function targetsEnemies(view: GameView, a: Action): boolean {
  if (a.type !== 'play') return true;
  return a.targets.flat().every((id) => {
    const c = view.cards[id];
    return !c || c.controller !== view.viewer;
  });
}

export function chooseBotAction(legal: readonly Action[], view: GameView): Action {
  const first = legal[0];
  if (!first) throw new Error('The bot was asked to act with no legal actions');

  // answer the engine's questions
  const mull = legal.find((a) => a.type === 'mulligan' && a.cards.length === 0);
  if (mull) return mull;
  const yes = legal.find((a) => a.type === 'chooseOptional' && a.accept);
  if (yes) return yes;
  if (legal.some((a) => a.type === 'chooseTargets')) {
    const enemyOnly = legal.find(
      (a) =>
        a.type === 'chooseTargets' &&
        a.targets.flat().every((id) => (view.cards[id]?.controller ?? view.viewer) !== view.viewer),
    );
    return enemyOnly ?? first;
  }
  if (legal.some((a) => a.type === 'scry' || a.type === 'chooseCards')) {
    return legal.find((a) => a.type === 'scry' || a.type === 'chooseCards') ?? first;
  }

  // a response window: just pass
  if (view.window) {
    const pass = legal.find((a) => a.type === 'pass');
    if (pass) return pass;
  }

  // main phase: develop the board, then attack, then end the turn
  const plays = legal.filter(
    (a) => (a.type === 'play' && !a.echo && targetsEnemies(view, a)) || a.type === 'setTrap',
  );
  if (plays.length > 0) {
    const best = [...plays].sort((x, y) => {
      const cx = x.type === 'play' || x.type === 'setTrap' ? costOf(view, x.card) : 0;
      const cy = y.type === 'play' || y.type === 'setTrap' ? costOf(view, y.card) : 0;
      return cy - cx;
    })[0];
    if (best) return best;
  }
  const attacks = legal.filter(
    (a): a is Extract<Action, { type: 'attack' }> => a.type === 'attack',
  );
  if (attacks.length > 0) {
    const face = attacks.find((a) => a.target === 'face');
    if (face) return face;
    return attacks[0] as Action;
  }
  return legal.find((a) => a.type === 'endTurn') ?? legal.find((a) => a.type === 'pass') ?? first;
}
