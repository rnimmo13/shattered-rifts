// The DOM layer of the duel screen: both players' status, turn banner, log, response window, action bar and
// the game-over panel. All of it reads the redacted view and the legal actions; none of it decides a rule.

import { useEffect, useRef } from 'react';
import { play } from '../audio/sfx';
import type { Action, GameView, PlayerId } from '@sr/engine';
import { cardName, describeAction } from './actions';
import { AI_SEAT, HUMAN } from './session';

export interface Float {
  id: number;
  player: PlayerId;
  text: string;
  kind: 'damage' | 'heal';
}

/** The Essence (life) bar. A paler "ghost" bar trails behind the real one so you can see how much you just lost. */
function EssenceBar(props: { value: number; max: number; tone: 'me' | 'foe' }) {
  const pct = props.max > 0 ? Math.max(0, Math.min(100, (props.value / props.max) * 100)) : 0;
  return (
    <div className={`ess ess--${props.tone}`}>
      <div className="ess__ghost" style={{ width: `${pct}%` }} />
      <div className="ess__fill" style={{ width: `${pct}%` }} />
      <span className="ess__num" key={props.value}>
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

/** A round crest in the realm's colours: a stand-in for a portrait until there is art. */
function Crest(props: { realm: string; label: string; tone: 'me' | 'foe' }) {
  return (
    <span className={`crest crest--${props.realm} crest--${props.tone}`} aria-hidden>
      <b>{props.label.trim().charAt(0).toUpperCase()}</b>
    </span>
  );
}

/** The opponent: name, Essence, deck and hand. Click it (when highlighted) to attack the player directly. */
export function FoePanel(props: {
  view: GameView;
  name: string;
  realm: string;
  targetable: boolean;
  floats: Float[];
  onFace: () => void;
}) {
  const foe = props.view.players[AI_SEAT];
  const backs = Math.min(foe.handCount, 9);
  return (
    <div className="foewrap">
      <button
        className={`foe${props.targetable ? ' is-targetable' : ''}`}
        onClick={props.onFace}
        disabled={!props.targetable}
        aria-label={props.targetable ? `Attack ${props.name} directly` : props.name}
      >
        <Crest realm={props.realm} label={props.name} tone="foe" />
        <span className="foe__body">
          <span className="foe__name">{props.name}</span>
          <EssenceBar value={foe.essence} max={foe.maxEssence} tone="foe" />
          <span className="foe__counts">
            <span title="Cards in hand">
              <b>{foe.handCount}</b> hand
            </span>
            <span title="Cards in deck">
              <b>{foe.deckCount}</b> deck
            </span>
            <span title="Mana">
              <b>{foe.mana + foe.tempMana}</b>/{foe.maxMana} mana
            </span>
          </span>
        </span>
        <FloatNumbers floats={props.floats} player={AI_SEAT} />
      </button>
      <span className="foe__backs" aria-hidden>
        {Array.from({ length: backs }, (_, i) => (
          <i key={i} style={{ rotate: `${(i - (backs - 1) / 2) * 6}deg` }} />
        ))}
      </span>
    </div>
  );
}

/** You: Essence, Mana and deck. */
export function SelfPanel(props: { view: GameView; name: string; realm: string; floats: Float[] }) {
  const me = props.view.players[HUMAN];
  const mana = me.mana + me.tempMana;
  return (
    <div className="self" aria-label="Your status">
      <div className="self__head">
        <Crest realm={props.realm} label={props.name} tone="me" />
        <div className="self__top">
          <span className="self__name">{props.name}</span>
          <EssenceBar value={me.essence} max={me.maxEssence} tone="me" />
          <FloatNumbers floats={props.floats} player={HUMAN} />
        </div>
      </div>
      <div className="self__mana">
        <div className="mana__gem" aria-label={`Mana ${mana} of ${me.maxMana}`}>
          <span key={mana}>{mana}</span>
        </div>
        <div className="pips" aria-hidden>
          {Array.from({ length: Math.max(me.maxMana, 1) }, (_, i) => (
            <i key={i} className={i < mana ? 'is-full' : ''} />
          ))}
        </div>
      </div>
      <p className="self__counts">
        <span>
          <b>{me.deckCount}</b> deck
        </span>
        <span>
          <b>{me.void.length}</b> void
        </span>
      </p>
    </div>
  );
}

/** Whose turn it is, always visible. */
export function TurnPill(props: { turn: number; mine: boolean; thinking: boolean; over: boolean }) {
  return (
    <div className={`turnpill turnpill--${props.mine ? 'me' : 'foe'}`} role="status">
      <span className={`turnpill__dot${props.thinking ? ' is-busy' : ''}`} aria-hidden />
      <b>{props.over ? 'Duel over' : props.mine ? 'Your turn' : 'Enemy turn'}</b>
      <i>Turn {props.turn}</i>
    </div>
  );
}

/** A quick colour wash over the screen edges when someone takes damage. */
export function DamageFlash(props: { id: number; kind: 'hurt' | 'strike' }) {
  if (props.id === 0) return null;
  return <div key={props.id} className={`dmgflash dmgflash--${props.kind}`} aria-hidden />;
}

export function Banner(props: {
  text: string;
  tone: 'me' | 'opp' | 'neutral';
  id: number;
  /** animation speed setting: the sweep lasts as long as the banner stays */
  speed: number;
}) {
  return (
    <div
      key={props.id}
      className={`banner banner--${props.tone}`}
      style={{ '--banner-ms': `${650 / props.speed}ms` } as React.CSSProperties}
      role="status"
      aria-live="polite"
    >
      <i className="banner__streak" aria-hidden />
      <span>{props.text}</span>
    </div>
  );
}

export function LogPanel(props: { lines: string[] }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [props.lines]);
  return (
    <aside className="log" aria-label="Duel log">
      <p className="log__title">Duel log</p>
      <div className="log__scroll">
        {props.lines.map((l, i) => (
          <p key={i} className={l.startsWith('Turn ') ? 'is-turn' : ''}>
            {l}
          </p>
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
  useEffect(() => {
    play(won ? 'win' : 'lose');
  }, [won]);
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
