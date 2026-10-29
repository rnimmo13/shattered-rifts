// The small screens before a game: choosing the deck and who goes first (go first, or go second with more HP), and the reel that decides it when both want the same.

import { useEffect, useMemo, useRef, useState } from 'react';
import { RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { SECOND_PLAYER_HP, cleanRank, cleanTrophies } from '@sr/pvp';
import { HeroIcon } from '../ui/HeroIcon';
import { progressLabel } from './deckLayout';
import { TrophyBadges } from './Trophies';
import { RankBadge } from './RankBadge';
import { heroFigure } from '../fight/art';
import type { ChooseInfo } from './session';
import { seriesLine } from './seriesText';
import { Reel } from '../trials/Reel';
import { oddsCycle } from '../trials/odds';
import type { LanePrize } from '../trials/prizes';

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
      {widened && <small> · now matching any rank</small>}
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

/** "Do you want to go first?" Going second means more HP; the same answer from both means the reel decides. */
/**
 * Before each game: choose the deck to play it with (blind: the opponent's deck and Riftwalker stay hidden until it starts;
 * DECISIONS #307), and who goes first. Clicking a deck only looks at it; "Play this deck" (or answering who goes first) chooses it,
 * and a choice can be changed until the game starts.
 */
export function ChoosePanel(props: {
  info: ChooseInfo;
  onPick: (deck: number) => void;
  onChoose: (first: boolean, deck: number) => void;
  onCancel: () => void;
}) {
  const { info } = props;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((info.deadline - (now + info.skew)) / 1000));
  // the deck being looked at (the one that would be played, until another is clicked)
  const [looking, setLooking] = useState<number | null>(null);
  const shown = looking !== null && looking < info.decks.length ? looking : info.at;
  const me = info.decks[shown] ?? info.me;
  const several = info.decks.length > 1;
  const needPick = several && info.pick === null;
  /** the deck looked at is not the one chosen: it can be chosen (or the choice changed) */
  const canPlay = several && shown !== info.pick;
  const title = info.series ? `Game ${info.series.game}` : 'Get ready';
  return (
    <section className="pvp__status pvp__choose" aria-live="polite">
      <h2>{title}</h2>
      {info.series && info.seat && (
        <p className="pvp__series">{seriesLine(info.series, info.seat, info.foe.name)}</p>
      )}
      <div className="pvp__versus">
        <figure>
          <Portrait hero={me.hero} size={110} />
          <figcaption>
            <b>
              {me.name} <TrophyBadges trophies={cleanTrophies(me.trophies)} />
            </b>
            <small>
              {heroName(me.hero)} <RankBadge rank={cleanRank(me.rank)} />
            </small>
          </figcaption>
        </figure>
        <span className="pvp__vs">vs</span>
        <figure>
          <span className="pvp__hidden" aria-hidden>
            ?
          </span>
          <figcaption>
            <b>
              {info.foe.name} <TrophyBadges trophies={cleanTrophies(info.foe.trophies)} />
            </b>
            <small>
              <span className={info.foeReady ? 'pvp__ready' : 'pvp__notready'}>
                {info.foeReady ? 'Deck chosen' : 'Choosing a deck…'}
              </span>{' '}
              <RankBadge rank={cleanRank(info.foe.rank)} />
            </small>
          </figcaption>
        </figure>
      </div>

      {several && (
        <>
          <h3 className="pvp__pickh">
            {needPick ? 'Choose your deck for this game' : 'Your deck for this game'}
          </h3>
          <ul className="pvp__picks" aria-label="Your decks">
            {info.decks.map((d, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={`pvp__deck${i === shown ? ' is-picked' : ''}`}
                  aria-pressed={i === shown}
                  onClick={() => setLooking(i)}
                >
                  <HeroIcon hero={d.hero} size={32} />
                  <span>
                    <b>
                      {heroName(d.hero)} · {progressLabel(d.tier, d.stage)}
                    </b>
                    <small>
                      {d.deck.length} cards
                      {i === info.pick ? ' · chosen' : ''}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {canPlay && (
            <div className="pvp__actions">
              <button className="btn btn--primary" onClick={() => props.onPick(shown)}>
                <span>{info.pick === null ? 'Play this deck' : 'Play this deck instead'}</span>
              </button>
            </div>
          )}
          <p className="pvp__hint pvp__hint--center">
            Your opponent cannot see your choice until the game starts.
            {needPick ? ' If time runs out, you play the highlighted deck.' : ''}
          </p>
        </>
      )}

      <p>
        Go second and you start with <b>{SECOND_PLAYER_HP} more HP</b>.{' '}
        {info.series
          ? info.chooser
            ? 'You lost the last game, so the order is yours to choose. If you do not choose in time, the reel decides.'
            : ''
          : 'If you both want the same, the reel decides.'}
      </p>
      {!info.chooser && !info.chosen ? (
        <p className="pvp__waiting">
          {info.foe.name} lost the last game, so they choose who goes first… ({left}s)
        </p>
      ) : info.chosen ? (
        <p className="pvp__waiting">
          {needPick
            ? `Order settled. Choose your deck… (${left}s)`
            : `Waiting for ${info.foe.name}… (${left}s)`}
        </p>
      ) : (
        <div className="pvp__actions">
          <button className="btn btn--primary" onClick={() => props.onChoose(true, shown)}>
            <span>I will go first</span>
          </button>
          <button className="btn" onClick={() => props.onChoose(false, shown)}>
            <span>I will go second (+{SECOND_PLAYER_HP} HP)</span>
          </button>
        </div>
      )}
      {!info.chosen && info.chooser && <p className="pvp__count">{left}s to choose</p>}
      <button className="btn btn--ghost btn--small" onClick={props.onCancel}>
        <span>Leave</span>
      </button>
    </section>
  );
}

/** The two players' tiles on the who-goes-first reel: an even chance, half of each (DECISIONS #407). */
const ORDER_CYCLE = oddsCycle(50);

/**
 * The result, on the slider reel when chance decided (DECISIONS #407: it replaced a coin): a strip of the two players' names, half
 * of each, that slows to a stop on the one who goes first; then their portrait and name. When the players chose differently there is
 * nothing to roll, so it just says what was agreed.
 */
export function WhoGoesFirst(props: {
  me: { name: string; hero: string };
  foe: { name: string; hero: string };
  /** the player who goes first */
  first: 'me' | 'foe';
  random: boolean;
  onDone: () => void;
}) {
  const { me, foe, first, random } = props;
  const [landed, setLanded] = useState(!random);
  const winner = first === 'me' ? me : foe;
  const loser = first === 'me' ? foe : me;
  const tiles = useMemo<LanePrize[]>(
    () => [
      { icon: 'you', short: me.name, label: `${me.name} goes first` },
      { icon: 'foe', short: foe.name, label: `${foe.name} goes first` },
    ],
    [me.name, foe.name],
  );

  // (the screen behind passes a new closure on every redraw: keep the latest without restarting the hold)
  const doneRef = useRef(props.onDone);
  useEffect(() => {
    doneRef.current = props.onDone;
  });
  // after the reel has stopped, hold the result a moment, then go (the first player's turn clock is already running behind this)
  useEffect(() => {
    if (!landed) return;
    const t = window.setTimeout(() => doneRef.current(), random ? 1800 : 2600);
    return () => window.clearTimeout(t);
  }, [landed, random]);

  return (
    <div className="coinscreen" role="dialog" aria-label="Who goes first">
      <h2>
        {random
          ? landed
            ? 'The reel has decided'
            : 'You both chose the same. The reel decides…'
          : 'The order is settled'}
      </h2>
      {random ? (
        // (the reel stays up once it has stopped, the winner's tile lit, with their name below)
        <div className="orderreel">
          <Reel
            prizes={tiles}
            target={first === 'me' ? 0 : 1}
            from={null}
            spinKey={1}
            spinning={!landed}
            cycle={ORDER_CYCLE}
            onSettled={() => setLanded(true)}
          />
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
