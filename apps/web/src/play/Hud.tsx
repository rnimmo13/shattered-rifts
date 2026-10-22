// The DOM layer of the duel screen: both players' status, turn banner, log, response window, action bar and
// the game-over panel. All of it reads the redacted view and the legal actions; none of it decides a rule.

import { useEffect, useRef } from 'react';
import type { Action, GameView, PlayerId } from '@sr/engine';
import { cardName, describeAction } from './actions';
import { AI_SEAT, HUMAN } from './session';

export interface Float {
  id: number;
  player: PlayerId;
  text: string;
  kind: 'damage' | 'heal';
}

function EssenceBar(props: { value: number; max: number; tone: 'me' | 'foe' }) {
  const pct = props.max > 0 ? Math.max(0, Math.min(100, (props.value / props.max) * 100)) : 0;
  return (
    <div className={`ess ess--${props.tone}`}>
      <div className="ess__fill" style={{ width: `${pct}%` }} />
      <span className="ess__num">
        {props.value}
        <i>/{props.max}</i>
      </span>
    </div>
  );
}

function FloatNumbers(props: { floats: Float[]; player: PlayerId }) {
  return (
    <>
      {props.floats
        .filter((f) => f.player === props.player)
        .map((f) => (
          <span key={f.id} className={`float float--${f.kind}`}>
            {f.kind === 'damage' ? `−${f.text}` : `+${f.text}`}
          </span>
        ))}
    </>
  );
}

/** The opponent: name, Essence, deck and hand. Click it (when highlighted) to attack the player directly. */
export function FoePanel(props: {
  view: GameView;
  name: string;
  targetable: boolean;
  floats: Float[];
  onFace: () => void;
}) {
  const foe = props.view.players[AI_SEAT];
  return (
    <button
      className={`foe${props.targetable ? ' is-targetable' : ''}`}
      onClick={props.onFace}
      disabled={!props.targetable}
      aria-label={props.targetable ? `Attack ${props.name} directly` : props.name}
    >
      <span className="foe__name">{props.name}</span>
      <EssenceBar value={foe.essence} max={foe.maxEssence} tone="foe" />
      <span className="foe__counts">
        <span title="Cards in hand">
          <b>{foe.handCount}</b> in hand
        </span>
        <span title="Cards in deck">
          <b>{foe.deckCount}</b> in deck
        </span>
        <span title="Mana">
          <b>{foe.mana + foe.tempMana}</b>/{foe.maxMana} mana
        </span>
      </span>
      <span className="foe__backs" aria-hidden>
        {Array.from({ length: Math.min(foe.handCount, 9) }, (_, i) => (
          <i key={i} style={{ rotate: `${(i - (Math.min(foe.handCount, 9) - 1) / 2) * 5}deg` }} />
        ))}
      </span>
      <FloatNumbers floats={props.floats} player={AI_SEAT} />
    </button>
  );
}

/** You: Essence, Mana and deck. */
export function SelfPanel(props: { view: GameView; name: string; floats: Float[] }) {
  const me = props.view.players[HUMAN];
  return (
    <div className="self" aria-label="Your status">
      <div className="self__top">
        <span className="self__name">{props.name}</span>
        <EssenceBar value={me.essence} max={me.maxEssence} tone="me" />
        <FloatNumbers floats={props.floats} player={HUMAN} />
      </div>
      <div className="self__mana">
        <div className="mana__gem" aria-label={`Mana ${me.mana + me.tempMana} of ${me.maxMana}`}>
          <span>{me.mana + me.tempMana}</span>
        </div>
        <span className="self__manaMax">/ {me.maxMana} mana</span>
        <span className="self__counts">
          <b>{me.deckCount}</b> deck · <b>{me.void.length}</b> void
        </span>
      </div>
    </div>
  );
}

export function Banner(props: { text: string; tone: 'me' | 'opp' | 'neutral'; id: number }) {
  return (
    <div key={props.id} className={`banner banner--${props.tone}`} role="status" aria-live="polite">
      <span>{props.text}</span>
    </div>
  );
}

export function LogPanel(props: { lines: string[] }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [props.lines.length]);
  return (
    <aside className="log" aria-label="Duel log">
      <div className="log__scroll">
        {props.lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
        <div ref={end} />
      </div>
    </aside>
  );
}

/** Shown when the enemy did something you can answer: lists the chain and your options. */
export function WindowPanel(props: {
  view: GameView;
  options: { label: string; run: () => void }[];
  /** Some options are cards in your hand: they are cast by dragging, so say so. */
  dragHint: boolean;
  onPass: () => void;
}) {
  const { view } = props;
  return (
    <div className="respond" role="dialog" aria-label="Response window">
      <p className="respond__title">Respond?</p>
      <ol className="respond__chain">
        {view.chain.map((l, i) => (
          <li key={l.id}>
            <b>{l.controller === HUMAN ? 'You' : 'Enemy'}</b>: {cardName(view, l.sourceId)}
            <i> ({l.kind})</i>
            {i === view.chain.length - 1 ? ' ← on top' : ''}
          </li>
        ))}
        {view.chain.length === 0 && <li>Nothing on the chain yet</li>}
      </ol>
      <div className="respond__row">
        {props.options.map((o, i) => (
          <button key={i} className="btn btn--small" onClick={o.run}>
            <span>{o.label}</span>
          </button>
        ))}
        <button className="btn btn--small btn--ghost" onClick={props.onPass}>
          <span>Pass</span>
        </button>
      </div>
      {props.dragHint && (
        <p className="respond__hint">Or drag a Swift spell from your hand onto its target.</p>
      )}
    </div>
  );
}

/** Buttons for the selected card: abilities, flips, Echo casts. */
export function ActionBar(props: {
  view: GameView;
  title: string;
  hint?: string;
  actions: Action[];
  onPick: (a: Action) => void;
}) {
  if (props.actions.length === 0 && !props.hint) return null;
  return (
    <div className="actionbar" role="group" aria-label={props.title}>
      <p className="actionbar__title">{props.title}</p>
      {props.hint && <p className="actionbar__hint">{props.hint}</p>}
      <div className="actionbar__row">
        {props.actions.map((a, i) => (
          <button key={i} className="btn btn--small" onClick={() => props.onPick(a)}>
            <span>{describeAction(a, props.view)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function GameOver(props: {
  winner: PlayerId | 'draw';
  onAgain: () => void;
  onExit: () => void;
  /** Campaign mode: one button that carries the result back to the run. */
  onContinue?: () => void;
}) {
  const won = props.winner === HUMAN;
  const draw = props.winner === 'draw';
  return (
    <div className="modal" role="dialog" aria-label="Duel over">
      <div className={`modal__panel gameover ${won ? 'gameover--win' : 'gameover--lose'}`}>
        <h2 className="gameover__title">{draw ? 'Draw' : won ? 'Victory' : 'Defeat'}</h2>
        <p className="modal__hint">
          {draw
            ? 'Neither side could break the other.'
            : won
              ? 'The rift bends to your will.'
              : 'The rift takes this one.'}
        </p>
        {props.onContinue ? (
          <button className="btn btn--primary" onClick={props.onContinue}>
            <span>Continue</span>
          </button>
        ) : (
          <div className="modal__row">
            <button className="btn" onClick={props.onAgain}>
              <span>Duel again</span>
            </button>
            <button className="btn btn--ghost" onClick={props.onExit}>
              <span>Back</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
