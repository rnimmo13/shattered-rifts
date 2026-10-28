// The DOM layer over the fighters: HP bars with Barrier, status chips and enemy intents. Pure presentation.

import type { CSSProperties } from 'react';
import type { StatusId, UnitView } from '@sr/combat';
import { RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { HeroIcon } from '../ui/HeroIcon';
import { tipAttrs } from '../ui/tip';
import { INTENT_GLYPH, STATUS_INFO, UI_TIPS, statusTip } from './info';
import { Arrow } from '../ui/Arrow';

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
  /** how far the Obsidian Blade has been sharpened, shown as a buff on the hero (null: this deck has no blade) */
  sharp?: number | null;
  /** the damage the card being aimed would do to this unit */
  preview?: { id: string; text: string } | null;
}

/** Thorns: a bramble stem with barbs, drawn instead of a text glyph so it reads at chip size. */
function ThornIcon() {
  return (
    <svg className="chip__icon" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden>
      <path
        d="M3 21 Q9 15 12 12 T21 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 17.5 L3 13 L9.5 15 Z M10.5 13.5 L9 6.5 L15 10.5 Z M15 8.5 L16 2 L20.5 7.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function UnitPlates({ items, targetable, hover, preview, heroId, sharp }: PlatesProps) {
  // plates that would run into their neighbours get narrower, and a crowd staggers up and down, so no two ever overlap
  const lane = new Map<string, { width: number; dy: number }>();
  for (const side of ['a', 'b'] as const) {
    // (a flyer's plate hangs under the flyer, so each height is its own row)
    for (const band of new Set(items.map((i) => Math.round(i.y / 8)))) {
      const row = items
        .filter((i) => i.unit.side === side && Math.round(i.y / 8) === band)
        .sort((p, q) => p.x - q.x);
      row.forEach((it, idx) => {
        const prev = row[idx - 1];
        const next = row[idx + 1];
        const gap = Math.min(prev ? it.x - prev.x : Infinity, next ? next.x - it.x : Infinity);
        const want = Math.max(165, Math.min(215, it.w * 1.05));
        const tight = gap < want + 8;
        lane.set(it.unit.id, {
          width: tight ? Math.max(118, Math.min(want, gap - 8)) : want,
          // when even the narrow plates would touch, every other one drops a line
          dy: gap < 126 && idx % 2 === 1 ? 54 : 0,
        });
      });
    }
  }
  // an enemy's attack that strikes every unit of the other side: each unit it will hit is marked (with the moves, for its tip)
  const sweeps = (side: string): { name: string; by: string }[] =>
    items.flatMap(({ unit: e }) =>
      e.kind === 'enemy' && e.side !== side && e.hp > 0 && e.intentView?.area === 'all'
        ? [{ name: e.intentView.name, by: e.name }]
        : [],
    );
  return (
    <div className="plates" aria-hidden={false}>
      {items.map(({ unit: u, x, y, h, w }) => {
        const pct = Math.max(0, Math.min(100, (u.hp / u.maxHp) * 100));
        const iv = u.intentView;
        const incoming = u.hp > 0 ? sweeps(u.side) : [];
        const slot = lane.get(u.id) ?? { width: Math.max(165, Math.min(215, w * 1.05)), dy: 0 };
        const width = slot.width;
        const style: CSSProperties = { left: x, top: y + 10 + slot.dy, width };
        // (a tall figure never pushes its next move off the screen: it stops below the title bar, over the figure's head if it must, and
        // an enemy at the side of the screen keeps it, and its words, inside the edges)
        const intentStyle: CSSProperties = {
          left: `clamp(7.2rem, ${x}px, calc(100% - 7.2rem))`,
          top: `max(${y - h - 8}px, 7.8rem)`,
        };
        return (
          <div key={u.id}>
            {/* (an ally shows what it does at the end of its side's turn the same way, smaller) */}
            {u.kind !== 'hero' && iv && (
              <div
                className={`intent intent--${iv.icons[0] ?? 'special'}${u.kind === 'ally' ? ' intent--ally' : ''}`}
                style={intentStyle}
                aria-label={`${iv.name}: ${iv.text}`}
                tabIndex={0}
              >
                <span className="intent__icons">
                  {iv.icons.map((i) =>
                    i === 'buff' ? (
                      <Arrow key={i} dir="up" />
                    ) : i === 'debuff' ? (
                      <Arrow key={i} dir="down" />
                    ) : (
                      <span key={i}>{INTENT_GLYPH[i]}</span>
                    ),
                  )}
                </span>
                {iv.damage !== null && (
                  <b className="intent__num">
                    {iv.damage}
                    {iv.hits > 1 && <small>×{iv.hits}</small>}
                  </b>
                )}
                <span className="intent__name">{iv.name}</span>
                {iv.area && (
                  <span className={`intent__area intent__area--${iv.area}`}>
                    {iv.area === 'all' ? '⇶ Hits all' : '⁇ Random'}
                  </span>
                )}
                <span className="intent__tip" role="tooltip">
                  <b>{iv.name}</b> {iv.text}
                </span>
              </div>
            )}
            <div
              className={`plate${incoming.length ? ' is-incoming' : ''}${targetable.has(u.id) ? ' is-target' : ''}${hover === u.id ? ' is-hover' : ''}${u.kind === 'hero' ? ' plate--hero' : ''}`}
              style={style}
            >
              {preview?.id === u.id && <div className="plate__preview">{preview.text}</div>}
              {incoming.length > 0 && (
                <span
                  className="plate__incoming"
                  aria-label={`Will be hit by ${incoming.map((i) => i.name).join(', ')}`}
                  {...tipAttrs({
                    kicker: 'Incoming',
                    title: incoming.map((i) => i.name).join(' + '),
                    tone: 'bad',
                    text: `${incoming.map((i) => `${i.by}'s ${i.name}`).join(' and ')} will strike everyone on this side, this one included.`,
                  })}
                >
                  ⇶
                </span>
              )}
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
                {u.kind === 'ally' && u.slots !== undefined && (
                  <span className="plate__pips" {...tipAttrs(UI_TIPS.frame(u.slots))}>
                    {'●'.repeat(Math.min(3, u.slots))}
                  </span>
                )}
              </div>
              <div
                className={`bar${u.barrier > 0 ? ' has-barrier' : ''}`}
                {...tipAttrs(UI_TIPS.hp(u.hp, u.maxHp))}
              >
                <div className="bar__fill" style={{ width: `${pct}%` }} />
                {/* a phase still to come (an Omen): a notch where it rises */}
                {u.rise?.map((x, i) => (
                  <i
                    key={i}
                    className="bar__phase"
                    style={{ left: `${x.atPct}%` }}
                    {...tipAttrs({
                      kicker: 'Omen',
                      title: i === 0 ? 'Next phase' : 'A later phase',
                      tone: 'bad',
                      text: `At ${x.atPct}% HP it stops (the blow that gets it there goes no further) and rises with ${x.barrierPct}% of its HP as Barrier${x.might ? ` and ${x.might} Might` : ''}.`,
                    })}
                  />
                ))}
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
                {u.kind === 'hero' && u.id === heroId && sharp !== undefined && sharp !== null && (
                  <span
                    className={`chip chip--good chip--sharp${sharp > 0 ? ' is-sharp' : ''}`}
                    aria-label={`Blade sharpened by ${sharp}`}
                    {...tipAttrs({
                      kicker: 'Buff',
                      title: `Sharpened +${sharp}`,
                      tone: 'good',
                      text: 'The Obsidian Blade has permanently gained this much damage this fight. Every Sharpen adds more.',
                    })}
                  >
                    <Arrow dir="up" plain />
                    <b>{sharp}</b>
                  </span>
                )}
                {(Object.entries(u.statuses) as [StatusId, number][]).map(([id, n]) => {
                  const info = STATUS_INFO[id];
                  return (
                    <span
                      key={id}
                      className={`chip chip--${info.tone}`}
                      {...tipAttrs(statusTip(id, n))}
                    >
                      {id === 'thorns' ? <ThornIcon /> : info.glyph}
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
