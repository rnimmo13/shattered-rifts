// A choice the engine is waiting on: discard / exhaust N cards from your hand, or scry. It shows the cards to choose among
// and sends back exactly the ids the player picked; the engine decides whether that is legal.

import { useState } from 'react';
import type { CombatDb, PendingView } from '@sr/combat';
import { FightCard } from './FightCard';

const TITLE: Record<PendingView['kind'], string> = {
  discard: 'Discard',
  exhaust: 'Consume',
  scry: 'Foresee',
};

function prompt(p: PendingView): string {
  const many = p.max > 1 ? `${p.max} cards` : 'a card';
  if (p.kind === 'scry') return 'Choose any cards from the top of your draw pile to discard.';
  const verb = p.kind === 'discard' ? 'Discard' : 'Consume';
  if (p.min === 0) return `${verb} up to ${p.max} cards.`;
  return `${verb} ${many}.`;
}

export function PickModal(props: {
  db: CombatDb;
  pending: PendingView;
  width: number;
  onSubmit: (cards: string[]) => void;
}) {
  const { pending: p } = props;
  const [chosen, setChosen] = useState<string[]>([]);
  const toggle = (id: string): void =>
    setChosen((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id);
      // a single-card choice just swaps; a bigger one stops at its limit
      if (p.max === 1) return [id];
      return c.length >= p.max ? c : [...c, id];
    });
  const ok = chosen.length >= p.min && chosen.length <= p.max;

  return (
    <div className="fight__modal fight__modal--pick" role="dialog" aria-label={TITLE[p.kind]}>
      <div className="fight__modalBody">
        <header>
          <h3>
            {TITLE[p.kind]} <small>{prompt(p)}</small>
          </h3>
          <button
            className="btn btn--primary btn--small"
            disabled={!ok}
            onClick={() => props.onSubmit(chosen)}
          >
            <span>{chosen.length === 0 && p.min === 0 ? 'Keep them all' : 'Confirm'}</span>
          </button>
        </header>
        <div className="fight__grid">
          {p.pool.map((c) => {
            const def = props.db.cards[c.card];
            if (!def) return null;
            const on = chosen.includes(c.id);
            return (
              <button
                key={c.id}
                className={`pick${on ? ' is-on' : ''}`}
                aria-pressed={on}
                onClick={() => toggle(c.id)}
              >
                <FightCard
                  db={props.db}
                  def={def}
                  width={props.width}
                  dimmed={!on && chosen.length >= p.max}
                  {...(c.bonus ? { bonus: c.bonus } : {})}
                />
                <span className="pick__tag">{on ? TITLE[p.kind] : ''}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
