import { useId } from 'react';
import { arrowControl, type Point } from './arrowGeometry';
import './hand.css';

export type ArrowState = 'neutral' | 'valid' | 'invalid';

/** A curved targeting arrow with marching dashes and an arrowhead, drawn over the whole screen. */
export function TargetingArrow(props: { from: Point; to: Point; state: ArrowState }) {
  const id = useId().replace(/:/g, '');
  const { from, to, state } = props;
  const c = arrowControl(from, to);
  // tangent at the end of a quadratic bezier = to - control
  const ang = (Math.atan2(to.y - c.y, to.x - c.x) * 180) / Math.PI;
  return (
    <svg className={`arrow arrow--${state}`} aria-hidden>
      <defs>
        <filter id={`g${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        className="arrow__glow"
        d={`M ${from.x} ${from.y} Q ${c.x} ${c.y} ${to.x} ${to.y}`}
        filter={`url(#g${id})`}
      />
      <path className="arrow__line" d={`M ${from.x} ${from.y} Q ${c.x} ${c.y} ${to.x} ${to.y}`} />
      <g transform={`translate(${to.x} ${to.y}) rotate(${ang})`} className="arrow__head">
        <path d="M 6 0 L -22 -17 L -14 0 L -22 17 Z" />
      </g>
      <circle className="arrow__tail" cx={from.x} cy={from.y} r="7" />
    </svg>
  );
}
