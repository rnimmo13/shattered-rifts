// The DOM layer over the fighters: HP bars with Barrier, status chips and enemy intents. Pure presentation.

import type { CSSProperties } from 'react';
import type { StatusId, UnitView } from '@sr/combat';
import { RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { HeroIcon } from '../ui/HeroIcon';
import { tipAttrs } from '../ui/tip';
import { INTENT_GLYPH, STATUS_INFO, UI_TIPS, statusTip } from './info';

export interface Placed {
  unit: UnitView;
  /** host-relative px of the figure's feet, and its height in px */
  x: number;
  y: number;
  h: number;
  w: number;
}

export interface PlatesProps {
  items: Placed[];
  heroId: string | null;
  targetable: ReadonlySet<string>;
  hover: string | null;
  names: boolean;
  /** the damage the card being aimed would do to this unit */
  preview?: { id: string; text: string } | null;
}

export function UnitPlates({ items, targetable, hover, preview, heroId }: PlatesProps) {
  return (
    <div className="plates" aria-hidden={false}>
      {items.map(({ unit: u, x, y, h, w }) => {
        const pct = Math.max(0, Math.min(100, (u.hp / u.maxHp) * 100));
        const iv = u.intentView;
        const width = Math.max(96, Math.min(190, w * 0.9));
        const style: CSSProperties = { left: x, top: y + 10, width };
        const intentStyle: CSSProperties = { left: x, top: y - h - 8 };
        return (
          <div key={u.id}>
            {u.kind === 'enemy' && iv && (
              <div
                className={`intent intent--${iv.icons[0] ?? 'special'}`}
                style={intentStyle}
                aria-label={`${iv.name}: ${iv.text}`}
                tabIndex={0}
              >
                <span className="intent__icons">
                  {iv.icons.map((i) => INTENT_GLYPH[i]).join('')}
                </span>
                {iv.damage !== null && (
                  <b className="intent__num">
                    {iv.damage}
                    {iv.hits > 1 && <small>×{iv.hits}</small>}
                  </b>
                )}
                <span className="intent__name">{iv.name}</span>
                <span className="intent__tip" role="tooltip">
                  <b>{iv.name}</b> {iv.text}
                </span>
              </div>
            )}
            <div
              className={`plate${targetable.has(u.id) ? ' is-target' : ''}${hover === u.id ? ' is-hover' : ''}${u.kind === 'hero' ? ' plate--hero' : ''}`}
              style={style}
            >
              {preview?.id === u.id && <div className="plate__preview">{preview.text}</div>}
              <div
                className="plate__name"
                {...(u.kind === 'hero' && heroId && RIFTWALKERS[heroId as HeroId]
                  ? tipAttrs({
                      kicker: 'Innate',
                      title: RIFTWALKERS[heroId as HeroId].trait.name,
                      text: RIFTWALKERS[heroId as HeroId].trait.text,
                    })
                  : {})}
              >
                {u.kind === 'hero' && heroId ? <HeroIcon hero={heroId} size={22} /> : null}
                {u.name}
              </div>
              <div
                className={`bar${u.barrier > 0 ? ' has-barrier' : ''}`}
                {...tipAttrs(UI_TIPS.hp(u.hp, u.maxHp))}
              >
                <div className="bar__fill" style={{ width: `${pct}%` }} />
                <div className="bar__text">
                  {u.hp}/{u.maxHp}
                </div>
                {u.barrier > 0 && (
                  <div className="bar__barrier" {...tipAttrs(UI_TIPS.barrier(u.barrier))}>
                    ⛨ {u.barrier}
                  </div>
                )}
              </div>
              <div className="chips">
                {(Object.entries(u.statuses) as [StatusId, number][]).map(([id, n]) => {
                  const info = STATUS_INFO[id];
                  return (
                    <span
                      key={id}
                      className={`chip chip--${info.tone}`}
                      {...tipAttrs(statusTip(id, n))}
                    >
                      {info.glyph}
                      <b>{n}</b>
                    </span>
                  );
                })}
                {u.taunt && (
                  <span className="chip chip--good" {...tipAttrs(UI_TIPS.taunt)}>
                    ▣
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
