// The DOM layer over the fighters: HP bars with Barrier, status chips and enemy intents. Pure presentation.

import type { CSSProperties } from 'react';
import { intentPic } from './fxMoments';
import { Picture } from '../ui/Picture';
import {
  ON_OR_OFF,
  KNIFE_MAX,
  PREP_MAX,
  forgeLabel,
  type StatusId,
  type UnitView,
} from '@sr/combat';
import { RIFTWALKERS, classTrait, type HeroId } from '@sr/content/v2';
import { HeroIcon } from '../ui/HeroIcon';
import { tipAttrs } from '../ui/tip';
import { INTENT_GLYPH, STATUS_INFO, UI_TIPS, fateBarPct, statusTip } from './info';
import { Arrow } from '../ui/Arrow';
import { GameIcon } from '../ui/GameIcon';
import { STATUS_ICONS, TAUNT_ICON } from '../art/gameIcons';

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
  /** the Ascendancy your hero has taken, for what its plate says */
  ascendancy?: string;
  targetable: ReadonlySet<string>;
  hover: string | null;
  names: boolean;
  /** how far this deck's weapon (Obsidian Blade, Old Twelve Gauge) has been sharpened, shown as a buff on the hero (null: none) */
  sharp?: { weapon: string; word: string; amount: number } | null;
  /** the damage the card being aimed would do to this unit */
  preview?: { id: string; text: string } | null;
  /** how big the plates and intents are drawn (a small screen draws them smaller, DECISIONS #443); 1 when absent */
  scale?: number;
  /** the highest an intent may sit (CSS length): below the top bar */
  intentTop?: string;
  /** Direct selection through a unit's name/HP plate while aiming. */
  onTarget?: (unit: string) => void;
}

export function UnitPlates({
  items,
  targetable,
  hover,
  preview,
  heroId,
  ascendancy,
  sharp,
  scale = 1,
  intentTop = '7.8rem',
  onTarget,
}: PlatesProps) {
  const k = scale;
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
        // (screen px; a plate drawn smaller (scale) is as wide on screen as it is set here)
        const want = Math.max(165 * k, Math.min(215 * k, it.w * 1.05));
        const tight = gap < want + 8 * k;
        // (drawn smaller, a plate may also get narrower before it drops a line: a small screen has no room for two rows)
        const narrowest = k === 1 ? 118 : 80 * k;
        lane.set(it.unit.id, {
          width: tight ? Math.max(narrowest, Math.min(want, gap - 8 * k)) : want,
          // when even the narrow plates would touch, every other one drops a line
          dy: gap < narrowest + 8 * k && idx % 2 === 1 ? 54 * k : 0,
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
        const fate = u.statuses.doom ?? 0;
        const iv = u.intentView;
        const incoming = u.hp > 0 ? sweeps(u.side) : [];
        const slot = lane.get(u.id) ?? {
          width: Math.max(165 * k, Math.min(215 * k, w * 1.05)),
          dy: 0,
        };
        const width = slot.width / k;
        const style: CSSProperties = {
          left: x,
          top: y + 10 * k + slot.dy,
          width,
          ...(k !== 1 ? { scale: String(k) } : {}),
        };
        // (a tall figure never pushes its next move off the screen: it stops below the title bar, over the figure's head if it must, and
        // an enemy at the side of the screen keeps it, and its words, inside the edges)
        const intentStyle: CSSProperties = {
          left: `clamp(${7.2 * k}rem, ${x}px, calc(100% - ${7.2 * k}rem))`,
          top: `max(${y - h - 8 * k}px, ${intentTop})`,
          ...(k !== 1 ? { scale: String(k) } : {}),
        };
        return (
          <div
            key={u.id}
            data-figure-def={u.def}
            data-figure-height={Math.round(h * 100) / 100}
            data-figure-width={Math.round(w * 100) / 100}
            className={`unit-group${u.kind === 'ally' ? ' is-ally' : ''}${hover === u.id ? ' is-hover' : ''}`}
          >
            {/* (an ally shows what it does at the end of its side's turn the same way, smaller) */}
            {u.kind !== 'hero' && iv && (
              <div
                data-intent={u.id}
                // (its tip shows on hover or focus: a long press on a touch screen focuses it, ui/Tooltip.tsx)
                data-press-focus
                className={`intent intent--${iv.icons[0] ?? 'special'}${u.kind === 'ally' ? ' intent--ally' : ''}`}
                style={intentStyle}
                aria-label={`${iv.name}: ${iv.text}`}
                tabIndex={0}
              >
                <span className="intent__icons">
                  {iv.icons.map((i) => (
                    <Picture key={i} id={intentPic(i, iv.damage, iv.hits)} className="intent__pic">
                      {i === 'buff' ? (
                        <Arrow dir="up" />
                      ) : i === 'debuff' ? (
                        <Arrow dir="down" />
                      ) : (
                        <span>{INTENT_GLYPH[i]}</span>
                      )}
                    </Picture>
                  ))}
                </span>
                {iv.damage !== null && (
                  <b className="intent__num">
                    {iv.damage}
                    {iv.damagePreview &&
                      iv.damagePreview.hi !== iv.damage &&
                      `–${iv.damagePreview.hi}`}
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
                  {u.kind === 'ally' && iv.damagePreview && (
                    <>
                      <span className="intent__calculation">
                        <b>Damage calculation</b>
                        {iv.damagePreview.how?.join(' → ')}
                      </span>
                      <span className="intent__calculation">
                        <b>Total damage now</b>
                        {iv.damagePreview.total?.lo === iv.damagePreview.total?.hi
                          ? iv.damagePreview.total?.lo
                          : `${iv.damagePreview.total?.lo}–${iv.damagePreview.total?.hi}`}
                        {iv.damagePreview.each ? ' per enemy' : ''}
                      </span>
                      <span className="intent__calculation">
                        <b>Current target</b>
                        {iv.area === 'all'
                          ? 'All enemies'
                          : (items.find((p) => p.unit.id === iv.target)?.unit.name ??
                            'The front enemy')}
                      </span>
                      <span className="intent__caveat">
                        If it acted now, before Barrier and HP loss. Earlier actions can change its
                        target or damage.
                      </span>
                    </>
                  )}
                </span>
              </div>
            )}
            <div
              data-unit={u.id}
              onClick={() => {
                if (targetable.has(u.id)) onTarget?.(u.id);
              }}
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
                {...(u.kind === 'ally'
                  ? {
                      tabIndex: 0,
                      ...tipAttrs({
                        kicker: 'Companion',
                        title: u.name,
                        text:
                          iv?.text ??
                          'No automatic attack. Cards that command this companion determine its damage.',
                        ...(iv?.damagePreview
                          ? {
                              lines: [
                                {
                                  title: 'Damage calculation',
                                  text: iv.damagePreview.how?.join(' → ') ?? String(iv.damage),
                                },
                                {
                                  title: 'If it acted now',
                                  text: 'This uses the current board. Earlier actions can change its target and damage; Barrier and HP loss are separate.',
                                },
                              ],
                            }
                          : {}),
                      }),
                    }
                  : {})}
                {...(u.kind === 'hero' && heroId && RIFTWALKERS[heroId as HeroId]
                  ? tipAttrs({
                      kicker: 'Innate',
                      title: classTrait(heroId, ascendancy)?.name ?? '',
                      text: classTrait(heroId, ascendancy)?.text ?? '',
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
                {...tipAttrs(UI_TIPS.hp(u.hp, u.maxHp, fate))}
              >
                {/* (the pale trail that drains after the red) */}
                <div className="bar__lag" style={{ width: `${pct}%` }} />
                <div className="bar__fill" style={{ width: `${pct}%` }} />
                {/* Fate builds up from the left of the bar: when it reaches the red's end, this unit dies at the end of its turn (DECISIONS #504) */}
                {fate > 0 && u.hp > 0 && (
                  <div
                    className={`bar__fate${fate >= u.hp ? ' is-lethal' : ''}`}
                    style={{ width: `${fateBarPct(u.hp, u.maxHp, fate)}%` }}
                  />
                )}
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
                    {/* (the number pops each time it changes) */}
                    <span key={u.barrier} className="bar__barrierNum">
                      ⛨ {u.barrier}
                    </span>
                  </div>
                )}
              </div>
              <div className="chips">
                {u.kind === 'hero' && u.id === heroId && sharp && (
                  <span
                    className={`chip chip--good chip--sharp${sharp.amount > 0 ? ' is-sharp' : ''}`}
                    aria-label={`${sharp.weapon}: ${forgeLabel(sharp.word)} +${sharp.amount}`}
                    {...tipAttrs({
                      kicker: 'Buff',
                      title: `${forgeLabel(sharp.word)} +${sharp.amount}`,
                      tone: 'good',
                      text: `Your sharpest ${sharp.weapon} has gained this much damage this fight. Every ${sharp.word} adds more to the copies you have; a copy made later starts fresh.`,
                    })}
                  >
                    <GameIcon art={STATUS_ICONS.keen} pic="keen" />
                    <b>{sharp.amount}</b>
                  </span>
                )}
                {(Object.entries(u.statuses) as [StatusId, number][]).map(([id, n]) => {
                  const info = STATUS_INFO[id];
                  return (
                    <span
                      key={id}
                      data-status={id}
                      className={`chip chip--${info.tone}${id === 'opening' ? ' chip--open' : ''}`}
                      {...tipAttrs(statusTip(id, n))}
                    >
                      <GameIcon art={STATUS_ICONS[id]} pic={id} />
                      {/* (an Opening is on or off: it reads "Open", not a count, DECISIONS #415) */}
                      {/* (Preparation and knives say their cap, DECISIONS #416) */}
                      {/* (a status that is on or off has no number to show: DECISIONS #492) */}
                      {!ON_OR_OFF.has(id) && (
                        <b className={n >= 100 ? 'is-long' : undefined}>
                          {id === 'opening'
                            ? 'Open'
                            : id === 'prep' || id === 'knives'
                              ? `${n}/${id === 'prep' ? PREP_MAX : KNIFE_MAX}`
                              : n}
                        </b>
                      )}
                    </span>
                  );
                })}
                {u.taunt && (
                  <span className="chip chip--good" {...tipAttrs(UI_TIPS.taunt)}>
                    <GameIcon art={TAUNT_ICON} pic="taunt" />
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
