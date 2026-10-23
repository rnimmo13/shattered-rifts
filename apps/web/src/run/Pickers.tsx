// The non-map screens of a run: card rewards and the Warden's Gift, shrine, merchant, event, and the deck viewer.

import { useMemo, useState } from 'react';
import type { CardDef } from '@sr/combat';
import { COMBAT_DB, V2_DECK_RULES } from '@sr/content/v2';
import { REST_HEAL, upgradable, type RunState } from '@sr/campaign';
import { FightCard } from '../fight/FightCard';
import { CardHover } from '../fight/CardHover';
import { BoonCard } from '../fight/BoonChip';
import { PotionCard } from '../fight/PotionChip';

const defOf = (id: string): CardDef | undefined => COMBAT_DB.cards[id];

/** A card you can hover to read at full size. */
function Pickable(props: {
  id: string;
  width: number;
  onHover: (def: CardDef | null) => void;
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
        onPointerEnter={() => props.onHover(def)}
        onPointerLeave={() => props.onHover(null)}
        onFocus={() => props.onHover(def)}
        onBlur={() => props.onHover(null)}
        aria-label={`${def.name}, cost ${def.cost}`}
      >
        <FightCard
          db={COMBAT_DB}
          def={def}
          width={props.width}
          playable={!!props.onClick && !props.disabled}
        />
        {props.badge && <span className="pick__badge">{props.badge}</span>}
      </button>
      {props.children}
    </div>
  );
}

function grouped(deck: readonly string[]): [string, number][] {
  const m = new Map<string, number>();
  for (const id of deck) m.set(id, (m.get(id) ?? 0) + 1);
  return [...m.entries()].sort(
    (a, b) => (defOf(a[0])?.cost ?? 0) - (defOf(b[0])?.cost ?? 0) || a[0].localeCompare(b[0]),
  );
}

/** A compact, readable list of a deck's cards (grouped, with counts). Hover any card to read it. */
export function DeckStrip(props: { deck: readonly string[]; width?: number }) {
  const [hover, setHover] = useState<CardDef | null>(null);
  const groups = useMemo(() => grouped(props.deck), [props.deck]);
  return (
    <div className="deckstrip">
      {groups.map(([id, n]) => (
        <Pickable
          key={id}
          id={id}
          width={props.width ?? 96}
          onHover={setHover}
          badge={n > 1 ? `×${n}` : ''}
        />
      ))}
      <CardHover def={hover} />
    </div>
  );
}

export function CardOffer(props: {
  title: string;
  hint: string;
  offers: string[];
  shards?: number | undefined;
  /** a Boon this fight dropped */
  boon?: string | undefined;
  /** a Potion this fight dropped */
  potion?: string | undefined;
  onPick: (id: string) => void;
  onSkip?: (() => void) | undefined;
}) {
  const [hover, setHover] = useState<CardDef | null>(null);
  return (
    <section className="stage-panel" aria-label={props.title}>
      <h2 className="stage-panel__title">{props.title}</h2>
      <p className="stage-panel__hint">
        {props.hint}
        {props.shards ? ` You also found ${props.shards} shards.` : ''}
      </p>
      {props.boon && <BoonCard id={props.boon} note="A new Boon, yours for the rest of the run." />}
      {props.potion && <PotionCard id={props.potion} note="Added to your belt." />}
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
      <CardHover def={hover} />
    </section>
  );
}

/** Your deck, grouped by card, with counts. Pass onPick to choose one (to remove or upgrade, say). */
export function DeckModal(props: {
  deck: readonly string[];
  title: string;
  hint?: string;
  onPick?: (id: string) => void;
  /** only these cards can be picked (the rest are shown but dimmed) */
  pickable?: ReadonlySet<string>;
  onClose: () => void;
}) {
  const [hover, setHover] = useState<CardDef | null>(null);
  const groups = useMemo(() => grouped(props.deck), [props.deck]);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={props.title}>
      <div className="modal__panel deckmodal">
        <h2 className="modal__title">
          {props.title} <i>({props.deck.length} cards)</i>
        </h2>
        {props.hint && <p className="modal__hint">{props.hint}</p>}
        <div className="deckgrid">
          {groups.map(([id, n]) => {
            const ok = !props.pickable || props.pickable.has(id);
            return (
              <Pickable
                key={id}
                id={id}
                width={130}
                onHover={setHover}
                {...(props.onPick && ok ? { onClick: () => props.onPick?.(id) } : {})}
                badge={n > 1 ? `×${n}` : ''}
              />
            );
          })}
        </div>
        <button className="btn" onClick={props.onClose}>
          <span>{props.onPick ? 'Cancel' : 'Close'}</span>
        </button>
      </div>
      <CardHover def={hover} />
    </div>
  );
}

export function ShrineView(props: {
  run: RunState;
  onRest: () => void;
  onUpgrade: (card: string) => void;
  onRemove: (card: string) => void;
}) {
  const [picking, setPicking] = useState<'upgrade' | 'remove' | null>(null);
  const canRest = props.run.hp < props.run.maxHp;
  const ups = useMemo(() => new Set(upgradable(props.run.deck)), [props.run.deck]);
  const canRemove = props.run.deck.length > V2_DECK_RULES.minSize;
  const heal = Math.min(props.run.maxHp - props.run.hp, Math.ceil(props.run.maxHp * REST_HEAL));
  return (
    <section className="stage-panel" aria-label="Shrine">
      <h2 className="stage-panel__title">A quiet shrine</h2>
      <p className="stage-panel__hint">The rift is thin here. Take one blessing.</p>
      <div className="choices-row">
        <button className="bigchoice" disabled={!canRest} onClick={props.onRest}>
          <b>Rest</b>
          <span>
            Heal {heal} HP ({props.run.hp}/{props.run.maxHp})
          </span>
          {!canRest && <i>You are at full health</i>}
        </button>
        <button
          className="bigchoice"
          disabled={ups.size === 0}
          onClick={() => setPicking('upgrade')}
        >
          <b>Temper</b>
          <span>Upgrade a card in your deck</span>
          {ups.size === 0 && <i>Nothing left to upgrade</i>}
        </button>
        <button className="bigchoice" disabled={!canRemove} onClick={() => setPicking('remove')}>
          <b>Let one go</b>
          <span>Remove a card from your deck</span>
          {!canRemove && <i>A deck cannot go below {V2_DECK_RULES.minSize} cards</i>}
        </button>
      </div>
      {!canRest && ups.size === 0 && !canRemove && (
        <button className="btn" onClick={props.onRest}>
          <span>Move on</span>
        </button>
      )}
      {picking && (
        <DeckModal
          deck={props.run.deck}
          title={picking === 'upgrade' ? 'Upgrade a card' : 'Remove a card'}
          hint={
            picking === 'upgrade'
              ? 'Choose a card to make stronger.'
              : 'Choose a card to leave behind.'
          }
          {...(picking === 'upgrade' ? { pickable: ups } : {})}
          onPick={(id) => (picking === 'upgrade' ? props.onUpgrade(id) : props.onRemove(id))}
          onClose={() => setPicking(null)}
        />
      )}
    </section>
  );
}

export function MerchantView(props: {
  run: RunState;
  onBuy: (index: number) => void;
  onBuyBoon: () => void;
  onBuyPotion: (index: number) => void;
  onRemove: (card: string) => void;
  onLeave: () => void;
}) {
  const [hover, setHover] = useState<CardDef | null>(null);
  const [picking, setPicking] = useState(false);
  const m = props.run.context?.merchant;
  if (!m) return null;
  const canRemove =
    !m.removed &&
    props.run.shards >= m.removePrice &&
    props.run.deck.length > V2_DECK_RULES.minSize;
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
      {m.potions && m.potions.length > 0 && (
        <div className="shopboon">
          {m.potions.map((p, i) => (
            <div key={i} className="shopboon">
              <PotionCard id={p.id} />
              <button
                className="btn"
                disabled={p.sold || props.run.shards < p.price || props.run.potions.length >= 3}
                onClick={() => props.onBuyPotion(i)}
              >
                <span>
                  {p.sold
                    ? 'Sold'
                    : props.run.potions.length >= 3
                      ? 'Belt full (3/3)'
                      : `Buy for ${p.price} shards`}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
      {m.boon && (
        <div className="shopboon">
          <BoonCard id={m.boon.id} />
          <button
            className="btn"
            disabled={m.boon.sold || props.run.shards < m.boon.price}
            onClick={props.onBuyBoon}
          >
            <span>{m.boon.sold ? 'Sold' : `Buy for ${m.boon.price} shards`}</span>
          </button>
        </div>
      )}
      <div className="choices-row">
        <button className="btn" disabled={!canRemove} onClick={() => setPicking(true)}>
          <span>{m.removed ? 'Card removed' : `Remove a card (${m.removePrice} shards)`}</span>
        </button>
        <button className="btn btn--primary" onClick={props.onLeave}>
          <span>Leave</span>
        </button>
      </div>
      <CardHover def={hover} />
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
  onChoose: (id: 'shards' | 'card' | 'heal' | 'upgrade' | 'bleed' | 'boon' | 'leave') => void;
}) {
  const ev = props.run.context?.event;
  const [hover, setHover] = useState<CardDef | null>(null);
  if (!ev) return null;
  const card = ev.cardOffer ? defOf(ev.cardOffer) : undefined;
  return (
    <section className="stage-panel" aria-label="Event">
      <h2 className="stage-panel__title">{ev.title}</h2>
      <p className="stage-panel__hint">{ev.text}</p>
      {ev.boonOffer && <BoonCard id={ev.boonOffer} />}
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
      <CardHover def={hover} />
    </section>
  );
}

/** The choice at the start of a run (The Threshold) or of a stage (a Waymark): one option, taken once. */
export function PreludeView(props: { run: RunState; onChoose: (id: string) => void }) {
  const offer = props.run.context?.prelude;
  if (!offer) return null;
  return (
    <section className="stage-panel" aria-label={offer.title}>
      <h2 className="stage-panel__title">{offer.title}</h2>
      <p className="stage-panel__hint">{offer.text}</p>
      <div className="prelude">
        {offer.options.map((o) => (
          <button
            key={o.id}
            className={`prelude__opt${o.risky ? ' is-risky' : ''}`}
            onClick={() => props.onChoose(o.id)}
          >
            <b className="prelude__name">{o.name}</b>
            <span className="prelude__text">{o.text}</span>
            {o.risky && <span className="prelude__tag">At a price</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

/** The first choice of a run: one of two starting decks. */
export function KitView(props: { run: RunState; onChoose: (id: string) => void }) {
  const kits = props.run.context?.kits;
  const [hover, setHover] = useState<CardDef | null>(null);
  if (!kits) return null;
  return (
    <section className="stage-panel" aria-label="Choose your starting deck">
      <h2 className="stage-panel__title">Choose your starting deck</h2>
      <p className="stage-panel__hint">
        Two ways to begin. Each swaps {kits[0]?.removed.length ?? 3} plain cards of your usual
        starter for three that lean one way.
      </p>
      <div className="kits">
        {kits.map((k) => (
          <article key={k.id} className="kit">
            <h3 className="kit__lean">
              Leans toward <b>{k.leans}</b>
            </h3>
            <p className="kit__sub">Adds these three to your starter:</p>
            <div className="kit__cards">
              {k.added.map((id, i) => (
                <Pickable key={`${id}-${i}`} id={id} width={150} onHover={setHover} />
              ))}
            </div>
            <p className="kit__sub">
              Everything else is your usual starting deck ({k.deck.length} cards in all).
            </p>
            <button className="btn btn--primary" onClick={() => props.onChoose(k.id)}>
              <span>Take this deck</span>
            </button>
          </article>
        ))}
      </div>
      <CardHover def={hover} />
    </section>
  );
}
