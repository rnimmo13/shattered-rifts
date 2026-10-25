// The non-map screens of a run: card rewards and the Warden's Gift, shrine, merchant, event, and the deck viewer.

import { useMemo, useState } from 'react';
import type { CardDef } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, V2_DECK_RULES } from '@sr/content/v2';
import {
  HOLD_DEPOSIT,
  HOLD_LATER,
  MAX_HELD,
  potionSellPrice,
  REST_HEAL,
  upgradable,
  type EventOption,
  type RunState,
} from '@sr/campaign';
import { FightCard } from '../fight/FightCard';
import { CardHover } from '../fight/CardHover';
import { HeroIcon } from '../ui/HeroIcon';
import { Grimoire } from '../fight/Grimoire';
import { tally } from '../fight/grimoireData';
import { BoonCard, BoonChip } from '../fight/BoonChip';
import { PotionCard, PotionIcon } from '../fight/PotionChip';
import { RarityGem } from '../ui/RarityGem';

const defOf = (id: string): CardDef | undefined => COMBAT_DB.cards[id];

/** A tag for a card that belongs to another Riftwalker: it still works in your deck, but it was not made for it. */
function CrossTag(props: { def: CardDef; own?: string | undefined }) {
  const h = props.def.hero;
  if (!props.own || !h || h === props.own || !Object.hasOwn(RIFTWALKERS, h)) return null;
  const r = RIFTWALKERS[h as keyof typeof RIFTWALKERS];
  return (
    <span
      className="pick__cross"
      title={`This card belongs to ${r.hero.name}, the ${r.role}. It works in your deck, but it leans on mechanics your Riftwalker does not build around.`}
    >
      <HeroIcon hero={h} size={26} />
      <span>
        <b>Rift-crossed</b>
        <small>
          {r.hero.name.split(',')[0]} · {r.role}
        </small>
      </span>
    </span>
  );
}

/** A card you can hover to read at full size. */
function Pickable(props: {
  id: string;
  /** the player's own Riftwalker: a card from another one gets a "Rift-crossed" tag */
  own?: string | undefined;
  width: number;
  onHover: (def: CardDef | null) => void;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
  /** just show the card (hover to read it): no button */
  preview?: boolean;
  children?: React.ReactNode;
}) {
  const def = defOf(props.id);
  if (!def) return null;
  if (props.preview)
    return (
      <div className="pick">
        <div
          className="pick__card pick__card--static"
          tabIndex={0}
          onPointerEnter={() => props.onHover(def)}
          onPointerLeave={() => props.onHover(null)}
          onFocus={() => props.onHover(def)}
          onBlur={() => props.onHover(null)}
          aria-label={`${def.name}, cost ${def.cost}`}
        >
          <FightCard db={COMBAT_DB} def={def} width={props.width} />
          {props.badge && <span className="pick__badge">{props.badge}</span>}
        </div>
        <CrossTag def={def} own={props.own} />
        {props.children}
      </div>
    );
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
      <CrossTag def={def} own={props.own} />
      {props.children}
    </div>
  );
}

/** A compact, readable list of a deck's cards (grouped, with counts). Hover any card to read it. */
export function DeckStrip(props: { deck: readonly string[]; width?: number }) {
  // a starting deck is ten or so cards: show them all on one page, five across, as big as the box allows
  return (
    <Grimoire
      cards={tally(props.deck, COMBAT_DB)}
      {...(props.width ? { cardWidth: props.width } : {})}
      cols={5}
      rows={Math.max(2, Math.ceil(props.deck.length / 5))}
      spread={1}
    />
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
  /** the player's Riftwalker, to tag cards from another one */
  character?: string | undefined;
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
            width={290}
            own={props.character}
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
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={props.title}>
      <div className="modal__panel deckmodal">
        <h2 className="modal__title">
          {props.title} <i>({props.deck.length} cards)</i>
        </h2>
        {props.hint && <p className="modal__hint">{props.hint}</p>}
        <Grimoire
          cards={tally(props.deck, COMBAT_DB)}
          // choosing a card (to remove or upgrade) needs cards big enough to read; just looking can fit more on a page
          readable={!!props.onPick}
          {...(props.onPick ? { onPick: props.onPick } : {})}
          {...(props.pickable ? { pickable: props.pickable } : {})}
        />
        <button className="btn" onClick={props.onClose}>
          <span>{props.onPick ? 'Cancel' : 'Close'}</span>
        </button>
      </div>
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
          <b>Upgrade</b>
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

/** One line of the shop: a picture, what it is, its price, and its button, in fixed columns so every row lines up. */
function ShopRow(props: {
  icon: React.ReactNode;
  name: string;
  kind: React.ReactNode;
  text: string;
  price: number | null;
  button: string;
  disabled: boolean;
  onBuy: () => void;
  tone?: string;
}) {
  return (
    <div className={`shoprow${props.tone ? ` ${props.tone}` : ''}`}>
      <span className="shoprow__icon">{props.icon}</span>
      <span className="shoprow__head">
        <b>{props.name}</b>
        <small>{props.kind}</small>
      </span>
      <span className="shoprow__price">{props.price === null ? '' : `${props.price}`}</span>
      <p className="shoprow__text">{props.text}</p>
      <button
        className="btn btn--small shoprow__buy"
        disabled={props.disabled}
        onClick={props.onBuy}
      >
        <span>{props.button}</span>
      </button>
    </div>
  );
}

export function MerchantView(props: {
  run: RunState;
  onBuy: (index: number) => void;
  onHold: (index: number) => void;
  /** let a hold go (no longer wanted) */
  onRelease: (index: number) => void;
  onBuyBoon: () => void;
  onBuyPotion: (index: number) => void;
  onSellPotion: (index: number) => void;
  onRemove: (card: string) => void;
  onLeave: () => void;
}) {
  const [hover, setHover] = useState<CardDef | null>(null);
  const [picking, setPicking] = useState(false);
  const m = props.run.context?.merchant;
  if (!m) return null;
  const shards = props.run.shards;
  const heldCount = props.run.held?.length ?? 0;
  const beltFull = props.run.potions.length >= 3;
  const canRemove =
    !m.removed && shards >= m.removePrice && props.run.deck.length > V2_DECK_RULES.minSize;
  const boon = m.boon ? COMBAT_DB.boons[m.boon.id] : undefined;
  return (
    <section className="stage-panel shop" aria-label="Merchant">
      <header className="shop__head">
        <h2 className="stage-panel__title">
          {m.crossed
            ? `A stranger from ${RIFTWALKERS[m.crossed as keyof typeof RIFTWALKERS]?.hero.name.split(',')[0] ?? 'another world'}'s world`
            : 'The rift merchant'}
        </h2>
        <div className="shop__purse" aria-label={`${shards} shards`}>
          <span aria-hidden>◈</span> <b>{shards}</b> shards
        </div>
      </header>

      {m.crossed && (
        <p className="shop__foreign" role="note">
          <HeroIcon hero={m.crossed} size={34} />
          <span>
            <b>A visiting merchant.</b> Every card on this table belongs to{' '}
            {RIFTWALKERS[m.crossed as keyof typeof RIFTWALKERS]?.hero.name}, the{' '}
            {RIFTWALKERS[m.crossed as keyof typeof RIFTWALKERS]?.role}. They work in your deck, but
            they lean on mechanics your Riftwalker does not build around.
          </span>
        </p>
      )}
      <div className="shop__block">
        <h3 className="shop__h">Cards</h3>
        <div className="shop__cards">
          {m.items.map((it, i) => (
            <div
              key={i}
              className={`shop__item${it.sold ? ' is-sold' : ''}${it.onHold ? ' is-onhold' : ''}`}
            >
              <Pickable
                id={it.cardId}
                own={props.run.character}
                width={270}
                onHover={setHover}
                preview
                badge={it.sold ? 'SOLD' : it.onHold ? 'ON HOLD' : it.held ? 'HELD FOR YOU' : ''}
              />
              <div className="shop__price">
                <span aria-hidden>◈</span> {it.price}
              </div>
              <button
                className="btn btn--small shop__buy"
                disabled={it.sold || it.onHold || shards < it.price}
                onClick={() => props.onBuy(i)}
              >
                <span>
                  {it.sold
                    ? 'Sold'
                    : it.onHold
                      ? 'On hold'
                      : shards < it.price
                        ? 'Too expensive'
                        : 'Buy'}
                </span>
              </button>
              {!it.sold && (it.onHold || it.held) && (
                <button
                  className="btn btn--small btn--ghost shop__hold"
                  onClick={() => props.onRelease(i)}
                  title={
                    it.held
                      ? 'Turn this card down. It leaves the table and is no longer kept for you.'
                      : 'Cancel the hold. The card goes back on sale now at its full price; the deposit is not refunded.'
                  }
                >
                  <span>{it.held ? 'Turn it down' : 'Cancel hold'}</span>
                </button>
              )}
              {!it.sold && !it.onHold && !it.held && (
                <button
                  className="btn btn--small btn--ghost shop__hold"
                  disabled={heldCount >= MAX_HELD || shards < Math.ceil(it.price * HOLD_DEPOSIT)}
                  onClick={() => props.onHold(i)}
                  title={`Pay ${Math.ceil(it.price * HOLD_DEPOSIT)} shards now to keep this card for your next merchant at ${Math.ceil(it.price * HOLD_LATER)} shards. The deposit is not refunded. Up to ${MAX_HELD} cards at a time.`}
                >
                  <span>
                    {heldCount >= MAX_HELD
                      ? `${MAX_HELD} cards already on hold`
                      : `Hold for later (${Math.ceil(it.price * HOLD_DEPOSIT)})`}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="shop__cols">
        {m.potions && m.potions.length > 0 && (
          <div className="shop__block">
            <h3 className="shop__h">Potions</h3>
            <div className="shop__rows">
              {m.potions.map((p, i) => {
                const def = COMBAT_DB.potions[p.id];
                if (!def) return null;
                return (
                  <ShopRow
                    key={i}
                    tone={`potion--${def.rarity}`}
                    icon={<PotionIcon potion={def} size={36} />}
                    name={def.name}
                    kind={
                      <>
                        <RarityGem rarity={def.rarity} />
                        potion · {def.rarity}
                      </>
                    }
                    text={def.text}
                    price={p.sold ? null : p.price}
                    button={
                      p.sold
                        ? 'Sold'
                        : beltFull
                          ? 'Belt full'
                          : shards < p.price
                            ? 'Too expensive'
                            : 'Buy'
                    }
                    disabled={p.sold || shards < p.price || beltFull}
                    onBuy={() => props.onBuyPotion(i)}
                  />
                );
              })}
            </div>
            <p className="shop__note">Your belt holds {props.run.potions.length} of 3 potions.</p>
          </div>
        )}
        {props.run.potions.length > 0 && (
          <div className="shop__block">
            <h3 className="shop__h">Sell your potions</h3>
            <div className="shop__rows">
              {props.run.potions.map((id, i) => {
                const def = COMBAT_DB.potions[id];
                if (!def) return null;
                return (
                  <ShopRow
                    key={`${id}-${i}`}
                    tone={`potion--${def.rarity}`}
                    icon={<PotionIcon potion={def} size={36} />}
                    name={def.name}
                    kind={
                      <>
                        <RarityGem rarity={def.rarity} />
                        potion · {def.rarity}
                      </>
                    }
                    text={def.text}
                    price={null}
                    button={`Sell for ${potionSellPrice(id)}`}
                    disabled={false}
                    onBuy={() => props.onSellPotion(i)}
                  />
                );
              })}
            </div>
          </div>
        )}
        {m.boon && boon && (
          <div className="shop__block">
            <h3 className="shop__h">Boon</h3>
            <div className="shop__rows">
              <ShopRow
                tone={`boon--${boon.rarity}`}
                icon={<BoonChip id={boon.id} size="large" />}
                name={boon.name}
                kind={
                  <>
                    <RarityGem rarity={boon.rarity} />
                    boon · {boon.rarity}
                  </>
                }
                text={boon.text}
                price={m.boon.sold ? null : m.boon.price}
                button={m.boon.sold ? 'Sold' : shards < m.boon.price ? 'Too expensive' : 'Buy'}
                disabled={m.boon.sold || shards < m.boon.price}
                onBuy={props.onBuyBoon}
              />
            </div>
          </div>
        )}
        <div className="shop__block">
          <h3 className="shop__h">Services</h3>
          <div className="shop__rows">
            <ShopRow
              icon={<span className="shoprow__glyph">✂</span>}
              name="Remove a card"
              kind="service"
              text="Cut one card from your deck for good. A thinner deck draws its best cards more often."
              price={m.removed ? null : m.removePrice}
              button={
                m.removed ? 'Done' : shards < m.removePrice ? 'Too expensive' : 'Choose a card'
              }
              disabled={!canRemove}
              onBuy={() => setPicking(true)}
            />
          </div>
        </div>
      </div>

      <div className="choices-row">
        <button className="btn btn--primary" onClick={props.onLeave}>
          <span>Leave the shop</span>
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

export function EventView(props: { run: RunState; onChoose: (id: EventOption['id']) => void }) {
  const ev = props.run.context?.event;
  const [hover, setHover] = useState<CardDef | null>(null);
  if (!ev) return null;
  const card = ev.cardOffer ? defOf(ev.cardOffer) : undefined;
  return (
    <section className="stage-panel" aria-label="Event">
      <h2 className="stage-panel__title">{ev.title}</h2>
      <p className="stage-panel__hint stage-panel__hint--event">{ev.text}</p>
      {ev.boonOffer && <BoonCard id={ev.boonOffer} />}
      {card && (
        <div className="offers">
          <Pickable id={card.id} width={270} own={props.run.character} onHover={setHover} />
        </div>
      )}
      <div className="eventopts">
        {ev.options.map((o) => {
          const { head, detail } = splitOption(o.label);
          return (
            <button key={o.id} className="eventopt" onClick={() => props.onChoose(o.id)}>
              <b className="eventopt__name">{head}</b>
              {detail && <span className="eventopt__text">{detail}</span>}
            </button>
          );
        })}
      </div>
      <CardHover def={hover} />
    </section>
  );
}

/** "Help them (lose 8 HP): they give you a potion" -> a short headline and the price/reward underneath. */
function splitOption(label: string): { head: string; detail: string } {
  const at = label.search(/:| \(/);
  if (at < 0) return { head: label, detail: '' };
  const detail = label
    .slice(at)
    .replace(/^[:\s(]+/, '')
    .replace(/\)\s*:\s*(.)/, (_m, c: string) => `. ${c.toUpperCase()}`)
    .replace(/\)$/, '');
  return { head: label.slice(0, at), detail: detail.charAt(0).toUpperCase() + detail.slice(1) };
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

/** The first choice of a run: one of three starting decks, one per build of your Riftwalker. */
export function KitView(props: { run: RunState; onChoose: (id: string) => void }) {
  const kits = props.run.context?.kits;
  const [hover, setHover] = useState<CardDef | null>(null);
  if (!kits) return null;
  return (
    <section className="stage-panel" aria-label="Choose your starting deck">
      <h2 className="stage-panel__title">Choose your starting deck</h2>
      <p className="stage-panel__hint">
        Three ways to begin, one for each of your builds. Each swaps {kits[0]?.removed.length ?? 2}{' '}
        plain cards of your usual starter for two that lean that way.
      </p>
      <div className="kits">
        {kits.map((k) => (
          <article key={k.id} className="kit">
            <h3 className="kit__lean">
              Build: <b>{k.leans}</b>
            </h3>
            <p className="kit__sub">Adds these two to your starter:</p>
            <div className="kit__cards">
              {k.added.map((id, i) => (
                <Pickable key={`${id}-${i}`} id={id} width={170} onHover={setHover} />
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
