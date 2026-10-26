// A coloured arrow for "went up" / "went down" (a cost, a sanctified card, a buff or debuff intent, Sharpen): green up, red down by
// default, or the colour around it with `plain`. Drawn, not a font glyph, so it looks the same everywhere.

import type { ReactNode } from 'react';
import './arrow.css';

export function Arrow(props: { dir: 'up' | 'down'; plain?: boolean; label?: string }) {
  return (
    <svg
      className={`arrow arrow--${props.dir}${props.plain ? ' arrow--plain' : ''}`}
      viewBox="0 0 16 16"
      width="0.9em"
      height="0.9em"
      role={props.label ? 'img' : undefined}
      aria-label={props.label}
      aria-hidden={props.label ? undefined : true}
    >
      <path
        d={
          props.dir === 'up'
            ? 'M8 1.5 14 8.2H10.2V14.5H5.8V8.2H2Z'
            : 'M8 14.5 2 7.8H5.8V1.5H10.2V7.8H14Z'
        }
      />
    </svg>
  );
}

/** Text with each ↑ / ↓ in it drawn as a coloured Arrow (a sanctified card's name: "Strike ↑"). */
export function WithArrows({ text }: { text: string }): ReactNode {
  if (!/[↑↓]/.test(text)) return text;
  return text
    .split(/([↑↓])/)
    .map((part, i) =>
      part === '↑' ? (
        <Arrow key={i} dir="up" label="stronger" />
      ) : part === '↓' ? (
        <Arrow key={i} dir="down" label="weaker" />
      ) : (
        part
      ),
    );
}
