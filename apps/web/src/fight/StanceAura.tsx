// The stance a Riftwalker is in, made impossible to miss: a coloured aura around the character and a banner above them naming it.
// Radiant (a triple-damage stance for the turn) also burns with golden rays and rising sparks. Pure presentation: it reads the hero's
// statuses and draws; the rules live in the engine.

import { useRef, type CSSProperties } from 'react';
import { useClearOfBelt } from './clearOfBelt';
import type { StatusId, UnitView } from '@sr/combat';
import { STATUS_INFO } from './info';

type Stance = 'wrath' | 'calm' | 'radiant';
const STANCES: readonly Stance[] = ['radiant', 'wrath', 'calm'];

/** The stance this unit is in (at most one), or null. */
function stanceOf(u: Pick<UnitView, 'statuses'>): Stance | null {
  return STANCES.find((s) => (u.statuses[s as StatusId] ?? 0) > 0) ?? null;
}

const LINE: Record<Stance, string> = {
  wrath: 'Deal double damage, take 50% more',
  calm: 'Leave it to gain 2 Mana',
  radiant: 'Deal triple damage this turn',
};

/** The stance as a small chip, for sitting inside another label (a player's name tag in PvP) instead of floating over it. */
export function StanceChip(props: { unit: Pick<UnitView, 'statuses'> }) {
  const stance = stanceOf(props.unit);
  if (!stance) return null;
  const info = STATUS_INFO[stance];
  return (
    <small className={`stance__chip stance__chip--${stance}`} aria-label={`${info.name} stance`}>
      <span aria-hidden>{info.glyph}</span> {info.name}
    </small>
  );
}

export function StanceAura(props: {
  unit: UnitView;
  /** draw the banner over the head (false in PvP, where the name tag carries a chip instead) */
  banner?: boolean;
  /** the figure's feet in host px, and its height and width */
  x: number;
  y: number;
  h: number;
  w: number;
  /** push the banner up (a name tag already sits above the head) */
  lift?: number;
}) {
  const stance = stanceOf(props.unit);
  const banner = useRef<HTMLDivElement>(null);
  // (on a small screen the banner above the head would sit on the potion belt: it slides clear of it)
  useClearOfBelt(banner);
  if (!stance) return null;
  const info = STATUS_INFO[stance];
  const size = Math.max(props.w * 1.5, props.h * 0.9, 200);
  const aura: CSSProperties = {
    left: props.x,
    top: props.y - props.h * 0.5,
    width: size,
    height: size,
  };
  return (
    <>
      <div className={`stance stance--${stance}`} style={aura} aria-hidden>
        <span className="stance__glow" />
        {stance === 'radiant' && (
          <>
            <span className="stance__rays" />
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} className="stance__spark" style={{ '--i': i } as CSSProperties} />
            ))}
          </>
        )}
      </div>
      {props.banner !== false && (
        <div
          ref={banner}
          className={`stance__banner stance__banner--${stance}`}
          style={{ left: props.x, top: Math.max(4, props.y - props.h - 12 - (props.lift ?? 0)) }}
          role="status"
          aria-label={`In the ${info.name} stance. ${LINE[stance]}.`}
        >
          <b>
            <span aria-hidden>{info.glyph}</span> {info.name}
          </b>
          <small>{LINE[stance]}</small>
        </div>
      )}
    </>
  );
}
