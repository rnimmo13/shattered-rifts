// Shielded, made impossible to miss: a yellow bubble around the unit that ignores the next hit, gone with the last stack
// (Robert, 2026-10-27; DECISIONS #346). Pure presentation: it reads the unit's statuses and draws; the rules live in the engine.

import type { CSSProperties } from 'react';
import type { UnitView } from '@sr/combat';

export function ShieldBubble(props: {
  unit: UnitView;
  /** the figure's feet in host px, and its height and width */
  x: number;
  y: number;
  h: number;
  w: number;
}) {
  const stacks = props.unit.statuses.shielded ?? 0;
  if (stacks <= 0) return null;
  const style: CSSProperties = {
    left: props.x,
    top: props.y - props.h * 0.5,
    width: Math.max(props.w * 1.3, props.h * 0.75, 90),
    height: Math.max(props.h * 1.12, 110),
  };
  return (
    <div
      className={`shieldbubble${stacks > 1 ? ' shieldbubble--more' : ''}`}
      style={style}
      aria-hidden
    >
      <span className="shieldbubble__shine" />
    </div>
  );
}
