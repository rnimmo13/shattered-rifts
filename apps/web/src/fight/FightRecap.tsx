// The fight recap: what a finished fight added up to (what hurt you most, the blow that ended it, your best turns) and its whole
// battle log, to read before leaving. It is worked out by playing the fight again from its moves (recap.ts), so it can be opened
// from the result of a fight, from a replay, or from the run history long after.

import { useEffect, useMemo } from 'react';
import type { CombatDb } from '@sr/combat';
import { replayFight, type FightReplay } from './recap';
import './recap.css';

export function FightRecap(props: { db: CombatDb; replay: FightReplay; onClose: () => void }) {
  const { db, replay, onClose } = props;
  const me = replay.me;
  const foe = replay.names?.[me === 'a' ? 'b' : 'a'] ?? null;
  const { recap, lines, broken } = useMemo(
    () => replayFight(db, replay.setup, replay.moves, me, foe),
    [db, replay, me, foe],
  );

  useEffect(() => {
    const on = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onClose]);

  const outcome =
    recap.winner === null
      ? 'Unfinished'
      : recap.winner === 'draw'
        ? 'Draw'
        : replay.names
          ? `${recap.winner === me ? 'You' : (foe ?? 'Your opponent')} won`
          : recap.winner === me
            ? 'Victory'
            : 'Defeat';
  const most = recap.takenFrom[0]?.amount ?? 0;

  return (
    <div
      className="recap"
      role="dialog"
      aria-modal="true"
      aria-label="Fight recap"
      onClick={onClose}
    >
      <div className="recap__panel" onClick={(e) => e.stopPropagation()}>
        <header className="recap__head">
          <div>
            <h2>{replay.title}</h2>
            <p>
              <b>{outcome}</b> · {recap.rounds} {recap.rounds === 1 ? 'turn' : 'turns'}
            </p>
          </div>
          <button className="btn btn--small" onClick={onClose}>
            <span>Close</span>
          </button>
        </header>
        {broken && (
          <p className="recap__note" role="note">
            This fight was played on an older version of the game, and part of it no longer plays
            the same way. The recap covers it up to there.
          </p>
        )}
        <dl className="recap__stats">
          <div>
            <dt>Damage dealt</dt>
            <dd>{recap.dealt}</dd>
          </div>
          <div>
            <dt>HP lost</dt>
            <dd>{recap.taken}</dd>
          </div>
          <div>
            <dt>Barrier soaked</dt>
            <dd>{recap.blocked}</dd>
          </div>
          <div>
            <dt>Healed</dt>
            <dd>{recap.healed}</dd>
          </div>
          <div>
            <dt>Cards played</dt>
            <dd>{recap.cardsPlayed}</dd>
          </div>
        </dl>
        {recap.killer && (
          <section className="recap__killer" aria-label="What ended it">
            <h3>The blow that ended it</h3>
            <p>
              <b>{recap.killer.name}</b> for {recap.killer.amount} on turn {recap.killer.round}
              {recap.killer.lastRound > recap.killer.amount
                ? `, after ${recap.killer.lastRound - recap.killer.amount} more earlier that turn`
                : ''}
              .
            </p>
          </section>
        )}
        <div className="recap__cols">
          <section aria-label="What hurt you most">
            <h3>What hurt you most</h3>
            {recap.takenFrom.length === 0 && <p className="recap__empty">Nothing got through.</p>}
            <ol className="recap__bars">
              {recap.takenFrom.slice(0, 6).map((s) => (
                <li key={s.name}>
                  <span className="recap__barName">
                    {s.name} <small>{s.hits === 1 ? '1 hit' : `${s.hits} hits`}</small>
                  </span>
                  <span className="recap__bar">
                    <i style={{ width: `${most ? Math.max(4, (100 * s.amount) / most) : 0}%` }} />
                    <b>{s.amount}</b>
                  </span>
                </li>
              ))}
            </ol>
            {recap.biggestHit && (
              <p className="recap__aside">
                Hardest single hit: {recap.biggestHit.name}, {recap.biggestHit.amount} on turn{' '}
                {recap.biggestHit.round}.
              </p>
            )}
          </section>
          <section aria-label="Your best turns">
            <h3>Your best turns</h3>
            {recap.bestTurns.length === 0 && <p className="recap__empty">No damage dealt.</p>}
            <ol className="recap__turns">
              {recap.bestTurns.map((t) => (
                <li key={t.round}>
                  <b>
                    Turn {t.round}: {t.dealt} damage
                  </b>
                  <span>{t.cards.join(', ')}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <section className="recap__log" aria-label="Battle log">
          <h3>Battle log</h3>
          <div className="recap__logBody" role="log">
            {lines.map((l) => (
              <p key={l.id} className={`recap__line recap__line--${l.tone}`}>
                {l.text}
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
