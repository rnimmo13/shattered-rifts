// The non-map screens of a run: card rewards and the Warden's Gift, shrine, merchant, event, and the deck viewer.

import { useMemo, useState } from 'react';
import type { CardDef } from '@sr/engine';
import { CARD_DB } from '@sr/content';
import { type RunState } from '@sr/campaign';
import { Card } from '../cards/Card';
import { Inspector, type InspectInfo } from '../play/Inspector';

const defOf = (id: string): CardDef | undefined => CARD_DB[id];

/** A card you can hover to read at full size. */
function Pickable(props: {
  id: string;
  width: number;
  onHover: (info: InspectInfo | null) => void;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
  children?: React.ReactNode;
}) {
  const def = defOf(props.id);
  if (!def) return null;
  return (
    <div className="pick">
      <button
        className="pick__card"
        disabled={props.disabled || !props.onClick}
        onClick={props.onClick}
        onPointerEnter={() => props.onHover({ def })}
        onPointerLeave={() => props.onHover(null)}
        onFocus={() => props.onHover({ def })}
        onBlur={() => props.onHover(null)}
        aria-label={`${def.name}, cost ${def.cost}`}
      >
        <Card def={def} width={props.width} playable={!!props.onClick && !props.disabled} />
        {props.badge && <span className="pick__badge">{props.badge}</span>}
      </button>
      {props.children}
    </div>
  );
}

export function CardOffer(props: {
  title: string;
  hint: string;
  offers: string[];
  shards?: number | undefined;
  onPick: (id: string) => void;
  onSkip?: (() => void) | undefined;
}) {
  const [hover, setHover] = useState<InspectInfo | null>(null);
  return (
    <section className="stage-panel" aria-label={props.title}>
      <h2 className="stage-panel__title">{props.title}</h2>
      <p className="stage-panel__hint">
        {props.hint}
        {props.shards ? ` You also found ${props.shards} shards.` : ''}
      </p>
      <div className="offers">
        {props.offers.map((id) => (
          <Pickable
            key={id}
            id={id}
            width={240}
            onHover={setHover}
            onClick={() => props.onPick(id)}
          />
        ))}
      </div>
      {props.onSkip && (
        <button className="btn" onClick={props.onSkip}>
          <span>Skip (keep your deck lean)</span>
        </button>
      )}
      <Inspector info={hover} />
    </section>
  );
}

/** Your deck, grouped by card, with counts. Pass onPick to choose one (to remove, say). */
export function DeckModal(props: {
  deck: readonly string[];
  title: string;
  hint?: string;
  onPick?: (id: string) => void;
  onClose: () => void;
}) {
  const [hover, setHover] = useState<InspectInfo | null>(null);
  const groups = useMemo(() => {
    const m = new Map<string, number>();
    for (const id of props.deck) m.set(id, (m.get(id) ?? 0) + 1);
    return [...m.entries()].sort(
      (a, b) => (defOf(a[0])?.cost ?? 0) - (defOf(b[0])?.cost ?? 0) || a[0].localeCompare(b[0]),
    );
  }, [props.deck]);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={props.title}>
      <div className="modal__panel deckmodal">
        <h2 className="modal__title">
          {props.title} <i>({props.deck.length} cards)</i>
        </h2>
        {props.hint && <p className="modal__hint">{props.hint}</p>}
        <div className="deckgrid">
          {groups.map(([id, n]) => (
            <Pickable
              key={id}
              id={id}
              width={130}
              onHover={setHover}
              {...(props.onPick ? { onClick: () => props.onPick?.(id) } : {})}
              badge={n > 1 ? `×${n}` : ''}
            />
          ))}
        </div>
        <button className="btn" onClick={props.onClose}>
          <span>{props.onPick ? 'Cancel' : 'Close'}</span>
        </button>
      </div>
      <Inspector info={hover} />
    </div>
  );
}

export function ShrineView(props: {
  run: RunState;
  onRest: () => void;
  onRemove: (card: string) => void;
}) {
  const [picking, setPicking] = useState(false);
  const canRest = props.run.resolve < props.run.maxResolve;
  const canRemove = props.run.deck.length > 20;
  return (
    <section className="stage-panel" aria-label="Shrine">
      <h2 className="stage-panel__title">A quiet shrine</h2>
      <p className="stage-panel__hint">The rift is thin here. Take one blessing.</p>
      <div className="choices-row">
        <button className="bigchoice" disabled={!canRest} onClick={props.onRest}>
          <b>Rest</b>
          <span>
            Restore 1 Resolve ({props.run.resolve}/{props.run.maxResolve})
          </span>
          {!canRest && <i>Resolve is already full</i>}
        </button>
        <button className="bigchoice" disabled={!canRemove} onClick={() => setPicking(true)}>
          <b>Let one go</b>
          <span>Remove a card from your deck</span>
          {!canRemove && <i>A deck cannot go below 20 cards</i>}
        </button>
      </div>
      {!canRest && !canRemove && (
        <button className="btn" onClick={props.onRest}>
          <span>Move on</span>
        </button>
      )}
      {picking && (
        <DeckModal
          deck={props.run.deck}
          title="Remove a card"
          hint="Choose a card to leave behind."
          onPick={(id) => props.onRemove(id)}
          onClose={() => setPicking(false)}
        />
      )}
    </section>
  );
}

export function MerchantView(props: {
  run: RunState;
  onBuy: (index: number) => void;
  onRemove: (card: string) => void;
  onLeave: () => void;
}) {
  const [hover, setHover] = useState<InspectInfo | null>(null);
  const [picking, setPicking] = useState(false);
  const m = props.run.context?.merchant;
  if (!m) return null;
  const canRemove = !m.removed && props.run.shards >= m.removePrice && props.run.deck.length > 20;
  return (
    <section className="stage-panel" aria-label="Merchant">
      <h2 className="stage-panel__title">The rift merchant</h2>
      <p className="stage-panel__hint">You have {props.run.shards} shards.</p>
      <div className="offers">
        {m.items.map((it, i) => (
          <Pickable
            key={i}
            id={it.cardId}
            width={210}
            onHover={setHover}
            disabled={it.sold || props.run.shards < it.price}
            {...(!it.sold ? { onClick: () => props.onBuy(i) } : {})}
            badge={it.sold ? 'SOLD' : ''}
          >
            <p className="pick__price">
              {it.sold ? 'Sold' : `${it.price} shards`}
              {!it.sold && props.run.shards < it.price ? ' (too expensive)' : ''}
            </p>
          </Pickable>
        ))}
      </div>
      <div className="choices-row">
        <button className="btn" disabled={!canRemove} onClick={() => setPicking(true)}>
          <span>{m.removed ? 'Card removed' : `Remove a card (${m.removePrice} shards)`}</span>
        </button>
        <button className="btn btn--primary" onClick={props.onLeave}>
          <span>Leave</span>
        </button>
      </div>
      <Inspector info={hover} />
      {picking && (
        <DeckModal
          deck={props.run.deck}
          title="Remove a card"
          hint={`This costs ${m.removePrice} shards.`}
          onPick={(id) => {
            setPicking(false);
            props.onRemove(id);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </section>
  );
}

export function EventView(props: {
  run: RunState;
  onChoose: (id: 'shards' | 'card' | 'leave') => void;
}) {
  const ev = props.run.context?.event;
  const [hover, setHover] = useState<InspectInfo | null>(null);
  if (!ev) return null;
  const card = ev.cardOffer ? defOf(ev.cardOffer) : undefined;
  return (
    <section className="stage-panel" aria-label="Event">
      <h2 className="stage-panel__title">{ev.title}</h2>
      <p className="stage-panel__hint">{ev.text}</p>
      {card && (
        <div className="offers">
          <Pickable id={card.id} width={220} onHover={setHover} />
        </div>
      )}
      <div className="choices-row">
        {ev.options.map((o) => (
          <button key={o.id} className="btn" onClick={() => props.onChoose(o.id)}>
            <span>{o.label}</span>
          </button>
        ))}
      </div>
      <Inspector info={hover} />
    </section>
  );
}
