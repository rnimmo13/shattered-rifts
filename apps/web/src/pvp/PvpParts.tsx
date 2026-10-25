// The two small screens that settle who goes first: the question (go first, or go second with more HP) and the coin.

import { useEffect, useRef, useState } from 'react';
import { RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { SECOND_PLAYER_HP } from '@sr/pvp';
import { heroFigure } from '../fight/art';
import type { ChooseInfo } from './session';

/** How long the player has waited: counts up from the moment it appears (so it restarts with each new search). */
export function WaitTimer(props: { label: string; widenAfterMs?: number }) {
  const [since] = useState(() => Date.now());
  const [now, setNow] = useState(since);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const secs = Math.max(0, Math.floor((now - since) / 1000));
  const widened = props.widenAfterMs !== undefined && now - since >= props.widenAfterMs;
  return (
    <p className="pvp__timer" role="timer" aria-label={`${props.label} ${secs} seconds`}>
      {props.label}{' '}
      <b>
        {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
      </b>
      {widened && <small> · now matching any Rift Tier</small>}
    </p>
  );
}

/** After a while in the queue with nobody to play, a ghost is offered: a deck another player has used, with the computer at the controls. */
export function GhostOffer(props: { afterMs: number; onGhost: () => void }) {
  const [late, setLate] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLate(true), props.afterMs);
    return () => window.clearTimeout(t);
  }, [props.afterMs]);
  if (!late) return null;
  return (
    <div className="pvp__ghostoffer" role="status">
      <p>Nobody else is around right now. Would you like to fight a ghost?</p>
      <button className="btn btn--primary" onClick={props.onGhost}>
        <span>Fight a ghost</span>
      </button>
    </div>
  );
}

/** A Riftwalker's face: the top of their figure, in a round frame. */
export function Portrait(props: { hero: string; size?: number; className?: string }) {
  const { hero, size = 140 } = props;
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext('2d');
    if (!c || !g) return;
    const src = heroFigure(hero);
    const px = size * 2;
    c.width = px;
    c.height = px;
    g.clearRect(0, 0, px, px);
    // the head and shoulders: a square from the top of the figure, as wide as the figure allows
    const side = Math.min(src.width, src.height * 0.46);
    g.drawImage(src, (src.width - side) / 2, 0, side, side, 0, 0, px, px);
  }, [hero, size]);
  return (
    <canvas
      ref={ref}
      className={`portrait ${props.className ?? ''}`}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

const heroName = (hero: string): string =>
  Object.hasOwn(RIFTWALKERS, hero) ? RIFTWALKERS[hero as HeroId].hero.name : hero;

/** "Do you want to go first?" Going second means more HP; the same answer from both means the coin decides. */
export function ChoosePanel(props: {
  info: ChooseInfo;
  onChoose: (first: boolean) => void;
  onCancel: () => void;
}) {
  const { info } = props;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((info.deadline - (now + info.skew)) / 1000));
  return (
    <section className="pvp__status pvp__choose" aria-live="polite">
      <h2>Who goes first?</h2>
      <div className="pvp__versus">
        <figure>
          <Portrait hero={info.me.hero} size={110} />
          <figcaption>
            <b>{info.me.name}</b>
            <small>{heroName(info.me.hero)}</small>
          </figcaption>
        </figure>
        <span className="pvp__vs">vs</span>
        <figure>
          <Portrait hero={info.foe.hero} size={110} />
          <figcaption>
            <b>{info.foe.name}</b>
            <small>{heroName(info.foe.hero)}</small>
          </figcaption>
        </figure>
      </div>
      <p>
        Go second and you start with <b>{SECOND_PLAYER_HP} more HP</b>. If you both want the same, a
        coin decides.
      </p>
      {info.chosen ? (
        <p className="pvp__waiting">
          Choice made. Waiting for {info.foe.name}… ({left}s)
        </p>
      ) : (
        <div className="pvp__actions">
          <button className="btn btn--primary" onClick={() => props.onChoose(true)}>
            <span>I will go first</span>
          </button>
          <button className="btn" onClick={() => props.onChoose(false)}>
            <span>I will go second (+{SECOND_PLAYER_HP} HP)</span>
          </button>
        </div>
      )}
      {!info.chosen && <p className="pvp__count">{left}s to choose</p>}
      <button className="btn btn--ghost btn--small" onClick={props.onCancel}>
        <span>Leave</span>
      </button>
    </section>
  );
}

/**
 * The result, as a coin when the coin decided: it spins and lands showing the portrait of the player who goes first, with
 * their name below. When the players chose differently there is nothing to toss, so it just says what was agreed.
 */
export function CoinFlip(props: {
  me: { name: string; hero: string };
  foe: { name: string; hero: string };
  /** the player who goes first */
  first: 'me' | 'foe';
  random: boolean;
  onDone: () => void;
}) {
  const { me, foe, first, random } = props;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [landed, setLanded] = useState(!random || reduced);
  const winner = first === 'me' ? me : foe;
  const loser = first === 'me' ? foe : me;
  // the coin shows me on its front and the opponent on its back: it lands on whoever won
  const turns = first === 'me' ? 1800 : 1980;

  // after the coin has landed, hold the result a moment, then go
  useEffect(() => {
    if (!landed) return;
    const t = window.setTimeout(props.onDone, random && !reduced ? 2200 : 2600);
    return () => window.clearTimeout(t);
  }, [landed, random, reduced, props.onDone]);

  return (
    <div className="coinscreen" role="dialog" aria-label="Who goes first">
      <h2>
        {random
          ? landed
            ? 'The coin has decided'
            : 'You both chose the same. Flipping a coin…'
          : 'The order is settled'}
      </h2>
      {random ? (
        <div className="coinstage">
          <div
            className={`coin${landed ? ' is-landed' : ''}`}
            style={{ '--end': `${turns}deg` } as React.CSSProperties}
            onAnimationEnd={(e) => {
              if (e.animationName === 'coin-spin') setLanded(true);
            }}
          >
            <div className="coin__face coin__face--front">
              <Portrait hero={me.hero} size={170} />
            </div>
            <div className="coin__face coin__face--back">
              <Portrait hero={foe.hero} size={170} />
            </div>
          </div>
        </div>
      ) : (
        <div className="coinstage">
          <div className="coin is-landed coin--still">
            <div className="coin__face coin__face--front" style={{ transform: 'none' }}>
              <Portrait hero={winner.hero} size={170} />
            </div>
          </div>
        </div>
      )}
      <p className={`coinname${landed ? ' is-shown' : ''}`}>
        <b>{winner.name}</b>
        <small>{heroName(winner.hero)}</small>
      </p>
      <p className={`coinsub${landed ? ' is-shown' : ''}`}>
        {winner.name} goes first. {loser.name} goes second and starts with {SECOND_PLAYER_HP} more
        HP.
      </p>
    </div>
  );
}
