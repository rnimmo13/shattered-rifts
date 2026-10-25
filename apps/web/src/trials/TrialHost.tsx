// The frame the Brass Cascade is played in: the rules and a Begin button, the game, then what the balls earned. The game
// reports the lanes its balls landed in through onEnd; the host shows them and hands them back through onDone (the run decides
// what they mean: you choose one of the prizes they earned).

import { useCallback, useState } from 'react';
import { play } from '../audio/sfx';
import { Cascade } from './Cascade';
import { PRIZE_MARK, type LanePrize } from './prizes';
import { TRIAL_INFO } from './info';
import './trials.css';

export interface GameProps {
  /** the ten lane prizes, in order */
  prizes: LanePrize[];
  /** the lane each of the three balls lands in (drawn fairly from the trial's seed) */
  lanes: number[];
  /** the balls have all been dropped: the lanes they landed in (each once) */
  onEnd: (won: boolean, earned: number[]) => void;
}

export function TrialHost(props: {
  prizes: LanePrize[];
  lanes: number[];
  onDone: (earned: number[]) => void;
  /** a practice game can be played again, and what it earns is only shown, not kept */
  practice?: boolean;
  onAgain?: () => void;
  onCancel?: () => void;
  /** Begin was pressed: from here the game is spent (a run saves it as begun) */
  onBegin?: () => void;
}) {
  const info = TRIAL_INFO.cascade;
  const [stage, setStage] = useState<'intro' | 'play' | 'result'>('intro');
  const [earned, setEarned] = useState<number[]>([]);
  const end = useCallback((_won: boolean, lanes: number[]) => {
    setEarned(lanes);
    play(lanes.length ? 'win' : 'lose');
    // in a run, what the balls earned is kept at once (and the prizes shown to choose from); practice shows a result page
    if (props.practice) setStage('result');
    else props.onDone(lanes);
  }, [props]);

  return (
    <div className="trial" role="dialog" aria-label={info.name}>
      <div className={`trial__box${stage === 'play' ? ' trial__box--wide' : ''}`}>
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
        {stage === 'play' && <Cascade prizes={props.prizes} lanes={props.lanes} onEnd={end} />}
        {stage === 'result' && (
          <div className="trial__result">
            <h3 className="is-won">
              {earned.length === 1 ? 'You earned a prize' : `You earned ${earned.length} prizes`}
            </h3>
            <ul className="trial__earned">
              {earned.map((i, k) => {
                const p = props.prizes[i];
                const second = earned.indexOf(i) !== k;
                const mark = PRIZE_MARK[p?.icon ?? ''] ?? PRIZE_MARK['shards']!;
                return (
                  <li key={i} style={{ '--mark': mark.color } as React.CSSProperties}>
                    <b>{mark.glyph}</b> {p?.label}
                    {second && <em> (×2: a second, different prize of this kind)</em>}
                  </li>
                );
              })}
            </ul>
            <p>
              {props.practice
                ? 'In a run, you would now choose one of these.'
                : 'Now choose one of them.'}
            </p>
            <div className="trial__buttons">
              <button className="btn" onClick={() => props.onDone(earned)}>
                <span>{props.practice ? 'Done' : 'Choose'}</span>
              </button>
              {props.practice && props.onAgain && (
                <button className="btn btn--ghost" onClick={props.onAgain}>
                  <span>Play again</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
