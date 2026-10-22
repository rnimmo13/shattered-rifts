// Modal prompts for the decisions the engine asks the human: mulligan, choose targets/cards/scry, optional
// triggers, and "which way to play this card". Every option is built from the engine's legal actions.

import { useMemo, useState } from 'react';
import type { Action, GameView, InstanceId } from '@sr/engine';
import { CARD_DB } from '@sr/content';
import { Card } from '../cards/Card';

export interface ChoiceOption {
  label: string;
  action: Action;
}

/** A centred panel over a dimmed backdrop. */
function Modal(props: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={props.title}>
      <div className="modal__panel">
        <h2 className="modal__title">{props.title}</h2>
        {props.hint && <p className="modal__hint">{props.hint}</p>}
        {props.children}
      </div>
    </div>
  );
}

/** Pick one of several ways to do something (play variants, targets, cards, scry orders...). */
export function ChoiceList(props: {
  title: string;
  hint?: string;
  options: ChoiceOption[];
  onPick: (a: Action) => void;
  onCancel?: () => void;
}) {
  return (
    <Modal title={props.title} {...(props.hint ? { hint: props.hint } : {})}>
      <ul className="choices">
        {props.options.map((o, i) => (
          <li key={i}>
            <button className="btn btn--choice" onClick={() => props.onPick(o.action)}>
              <span>{o.label}</span>
            </button>
          </li>
        ))}
      </ul>
      {props.onCancel && (
        <button className="btn btn--small modal__cancel" onClick={props.onCancel}>
          <span>Cancel</span>
        </button>
      )}
    </Modal>
  );
}

/** Opening hand: tap the cards to shuffle back, then confirm. */
export function MulliganPrompt(props: {
  view: GameView;
  legal: readonly Action[];
  onSubmit: (a: Action) => void;
}) {
  const hand = props.view.players[props.view.viewer].hand ?? [];
  const [replace, setReplace] = useState<ReadonlySet<InstanceId>>(new Set());
  const toggle = (id: InstanceId) =>
    setReplace((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // the engine lists each subset of the hand as its own action; find the one matching the selection
  const action = useMemo(
    () =>
      props.legal.find(
        (a) =>
          a.type === 'mulligan' &&
          a.cards.length === replace.size &&
          a.cards.every((id) => replace.has(id)),
      ),
    [props.legal, replace],
  );
  return (
    <Modal
      title="Opening hand"
      hint="Tap any cards you want to shuffle back and replace. Keep a hand you can play."
    >
      <div className="mull">
        {hand.map((id) => {
          const def = CARD_DB[props.view.cards[id]?.cardId ?? ''];
          if (!def) return null;
          const out = replace.has(id);
          return (
            <button
              key={id}
              className={`mull__card${out ? ' is-out' : ''}`}
              onClick={() => toggle(id)}
              aria-pressed={out}
              aria-label={`${def.name}${out ? ', will be replaced' : ', keep'}`}
            >
              <Card def={def} width={150} playable={!out} dimmed={out} />
              {out && <span className="mull__tag">Replace</span>}
            </button>
          );
        })}
      </div>
      <button
        className="btn modal__confirm"
        disabled={!action}
        onClick={() => action && props.onSubmit(action)}
      >
        <span>{replace.size === 0 ? 'Keep all' : `Replace ${replace.size}`}</span>
      </button>
    </Modal>
  );
}

export function YesNoPrompt(props: {
  title: string;
  hint?: string;
  yes: Action;
  no: Action;
  onSubmit: (a: Action) => void;
}) {
  return (
    <Modal title={props.title} {...(props.hint ? { hint: props.hint } : {})}>
      <div className="modal__row">
        <button className="btn" onClick={() => props.onSubmit(props.yes)}>
          <span>Yes</span>
        </button>
        <button className="btn" onClick={() => props.onSubmit(props.no)}>
          <span>No</span>
        </button>
      </div>
    </Modal>
  );
}
