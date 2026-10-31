// A choice the engine is waiting on: discard / exhaust N cards from your hand, or scry. It shows the cards to choose among
// and sends back exactly the ids the player picked; the engine decides whether that is legal.

import { useState } from 'react';
import type { CombatDb, PendingView } from '@sr/combat';
import { FightCard } from './FightCard';
import { ENCHANT_LOOK } from './enchantLook';
import { prompt } from './handPick';
import { totemLook } from './totemLook';
import { FORM_LOOK } from './formLook';

const TITLE: Record<PendingView['kind'], string> = {
  discard: 'Discard',
  exhaust: 'Consume',
  scry: 'Foresee',
  copy: 'Copy',
  topdeck: 'Put back',
  transform: 'Transform',
  // (the Spellblade's choices, DECISIONS #417)
  enchant: 'Replace',
  discharge: 'Discharge',
  recast: 'Recast',
  // (the Shaman's, DECISIONS #418)
  plantKind: 'Plant',
  plantAt: 'Plant',
  // (the Monk's, DECISIONS #419)
  form: 'Change form',
  commandPick: 'Command',
  defer: 'Defer',
};

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
  const title = p.kind === 'topdeck' && p.from === 'draw' ? 'Choose' : TITLE[p.kind];
  // Foresee is exactly one card out of a few: a click is the choice, no Confirm needed
  const instant = p.kind === 'scry' && p.min === 1 && p.max === 1;

  return (
    <div className="fight__modal fight__modal--pick" role="dialog" aria-label={title}>
      <div className="fight__modalBody">
        <header>
          <h3>
            {title} <small>{prompt(p)}</small>
          </h3>
          {!instant && (
            <button
              className="btn btn--primary btn--small"
              disabled={!ok}
              onClick={() => props.onSubmit(chosen)}
            >
              <span>
                {chosen.length === 0 && p.min === 0
                  ? p.kind === 'form'
                    ? 'Keep this form'
                    : 'Keep them all'
                  : 'Confirm'}
              </span>
            </button>
          )}
        </header>
        <div className="fight__grid">
          {/* (enchantments to choose among, not cards: DECISIONS #417) */}
          {p.charges?.map((c) => {
            const on = chosen.includes(c.id);
            const look = ENCHANT_LOOK[c.kind];
            return (
              <button
                key={c.id}
                className={`pick pick--charge${on ? ' is-on' : ''}`}
                aria-pressed={on}
                aria-label={`${look.name}: ${look.text}`}
                onClick={() => toggle(c.id)}
              >
                <span className={`enchant enchant--${c.kind}`}>
                  <b aria-hidden="true">{look.glyph}</b>
                  <small>{look.name}</small>
                </span>
                <p className="pick__note">{look.text}</p>
              </button>
            );
          })}
          {/* (forms to change to: DECISIONS #419) */}
          {p.forms?.map((f) => {
            const on = chosen.includes(f);
            const look = FORM_LOOK[f];
            return (
              <button
                key={f}
                className={`pick pick--charge${on ? ' is-on' : ''}`}
                aria-pressed={on}
                aria-label={`${look.name} form: ${look.goal}`}
                onClick={() => toggle(f)}
              >
                <span className={`form form--${f}`}>
                  <b aria-hidden="true">{look.glyph}</b>
                  <small>{look.name}</small>
                </span>
                <p className="pick__note">{look.goal}</p>
              </button>
            );
          })}
          {/* (spirits or totem positions to choose among: DECISIONS #418) */}
          {p.spirits?.map((c, k) => {
            const on = chosen.includes(c.id);
            const look = c.spirit ? totemLook(c.spirit) : null;
            const text = c.spirit
              ? (props.db.totems?.[c.spirit]?.text ?? '')
              : 'An empty position.';
            const label =
              p.kind === 'plantAt'
                ? `Position ${k + 1}: ${look ? look.name : 'empty'}`
                : (look?.name ?? c.id);
            return (
              <button
                key={c.id}
                className={`pick pick--charge${on ? ' is-on' : ''}`}
                aria-pressed={on}
                aria-label={`${label}. ${text}`}
                onClick={() => toggle(c.id)}
              >
                <span className={`totem${c.spirit ? ` totem--${c.spirit}` : ' is-empty'}`}>
                  <b aria-hidden="true">{look ? look.glyph : '·'}</b>
                  <small>{look ? look.name : 'empty'}</small>
                </span>
                <p className="pick__note">
                  {p.kind === 'plantAt' ? `Position ${k + 1}. ` : ''}
                  {text}
                </p>
              </button>
            );
          })}
          {p.pool.map((c) => {
            const def = props.db.cards[c.card];
            if (!def) return null;
            const on = chosen.includes(c.id);
            return (
              <button
                key={c.id}
                className={`pick${on ? ' is-on' : ''}`}
                aria-pressed={on}
                onClick={() => (instant ? props.onSubmit([c.id]) : toggle(c.id))}
              >
                <FightCard
                  db={props.db}
                  def={def}
                  width={props.width}
                  dimmed={!on && chosen.length >= p.max}
                  {...(c.bonus ? { bonus: c.bonus } : {})}
                />
                <span className="pick__tag">{on ? title : ''}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
