// The frame every trial is played in: the rules and a Begin button, the game, then the result. The game reports win or
// lose through onEnd; the host shows it and hands the answer back through onDone (the run decides what it means).

import { useCallback, useState } from 'react';
import type { TrialGame } from '@sr/campaign';
import { play } from '../audio/sfx';
import { Cipher } from './Cipher';
import { Echoes } from './Echoes';
import { Pairs } from './Pairs';
import { TRIAL_INFO } from './info';
import { RuneLock } from './RuneLock';
import { Rhythm } from './Rhythm';
import './trials.css';

export interface GameProps {
  seed: number;
  onEnd: (won: boolean) => void;
}

function Game(props: { game: TrialGame; seed: number; onEnd: (won: boolean) => void }) {
  switch (props.game) {
    case 'echoes':
      return <Echoes seed={props.seed} onEnd={props.onEnd} />;
    case 'pairs':
      return <Pairs seed={props.seed} onEnd={props.onEnd} />;
    case 'runelock':
      return <RuneLock seed={props.seed} onEnd={props.onEnd} />;
    case 'rhythm':
      return <Rhythm seed={props.seed} onEnd={props.onEnd} />;
    case 'cipher':
      return <Cipher seed={props.seed} onEnd={props.onEnd} />;
  }
}

export function TrialHost(props: {
  game: TrialGame;
  seed: number;
  onDone: (won: boolean) => void;
  /** a practice game can be played again, and the answer is only shown, not kept */
  practice?: boolean;
  onAgain?: () => void;
  onCancel?: () => void;
  /** Begin was pressed: from here the trial is spent (a run saves it as begun) */
  onBegin?: () => void;
}) {
  const info = TRIAL_INFO[props.game];
  const [stage, setStage] = useState<'intro' | 'play' | 'result'>('intro');
  const [won, setWon] = useState(false);
  const end = useCallback((w: boolean) => {
    setWon(w);
    setStage('result');
    play(w ? 'win' : 'lose');
  }, []);

  return (
    <div className="trial" role="dialog" aria-label={info.name}>
      <div className="trial__box">
        <h2 className="trial__title">{info.name}</h2>
        {stage === 'intro' && (
          <>
            <p className="trial__blurb">
              {info.blurb} <small>{info.time}</small>
            </p>
            <ul className="trial__rules">
              {info.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <div className="trial__buttons">
              <button
                className="btn"
                onClick={() => {
                  props.onBegin?.();
                  setStage('play');
                }}
              >
                <span>Begin</span>
              </button>
              {props.onCancel && (
                <button className="btn btn--ghost" onClick={props.onCancel}>
                  <span>Not now</span>
                </button>
              )}
            </div>
          </>
        )}
        {stage === 'play' && <Game game={props.game} seed={props.seed} onEnd={end} />}
        {stage === 'result' && (
          <div className="trial__result">
            <h3 className={won ? 'is-won' : 'is-lost'}>{won ? 'Trial passed' : 'Trial failed'}</h3>
            <p>
              {won
                ? props.practice
                  ? 'In a run, this opens a choice of prizes.'
                  : 'The way opens. Choose your prize.'
                : props.practice
                  ? 'In a run, you would leave with a few shards for trying.'
                  : 'It is not to be. You leave with a few shards for trying.'}
            </p>
            <div className="trial__buttons">
              <button className="btn" onClick={() => props.onDone(won)}>
                <span>{props.practice ? 'Done' : 'Continue'}</span>
              </button>
              {props.practice && props.onAgain && (
                <button className="btn btn--ghost" onClick={props.onAgain}>
                  <span>Play another</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
