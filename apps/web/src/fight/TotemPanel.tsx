// The Shaman's totems on the battle screen (DECISIONS #430, the totem cycle): his row (three positions to start, up to five), front
// first, and his Spirit. Each totem works every turn while it stands; a command makes the front one (marked "Next") act and consumes
// it, and a plant into a full row pushes it out. Its tip shows its numbers with his Spirit counted. (The pick mode, a choice of
// totem, is kept for a card that would ask one; no card does since the cycle.) The carved totems are pictures where one is drawn (DECISIONS #429; they fill the panel, so they grow when
// it is resized), and a commanded totem's spirit rises out of it. Presentation only: the totems and the choice come from the combat view.

import { useEffect, useRef } from 'react';
import type { CombatDb } from '@sr/combat';
import { tipAttrs } from '../ui/tip';
import { useTotemArt } from './totemArt';
import { totemLook } from './totemLook';

/** a choice of totem positions the panel offers ('t0'..'t4'), and what picking does */
export interface TotemPick {
  /** the positions that can be chosen */
  ids: readonly string[];
  /** 0: the choice can be declined (planting into a full row: keep them all) */
  min: number;
  /** what is being asked, in a line */
  prompt: string;
  /** the label of the decline button, when min is 0 */
  keep?: string;
}

/** a totem commanded just now: its spirit shows over it for a moment (`key` tells two commands of the same totem apart) */
export interface TotemSummon {
  totem: number;
  spirit: string;
  key: number;
}

export function TotemPanel(props: {
  db: CombatDb;
  totems: readonly (string | null)[];
  spirit: number;
  pick?: TotemPick | null;
  /** a choice answered: the positions picked (none: kept) */
  onPick?: (ids: string[]) => void;
  summon?: TotemSummon | null;
}) {
  const pick = props.pick ?? null;
  const art = useTotemArt();
  const first = useRef<HTMLButtonElement>(null);
  const ids = pick ? pick.ids.join() : '';
  const asking = pick ? `${pick.prompt}|${ids}` : '';
  const onPick = pick ? props.onPick : undefined;
  // (the first choice takes the focus, so Enter or a number key answers at once)
  useEffect(() => {
    if (asking) first.current?.focus();
  }, [asking]);
  useEffect(() => {
    if (!onPick || !ids) return;
    const open = ids.split(',');
    const onKey = (e: KeyboardEvent): void => {
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1) return;
      const id = `t${n - 1}`;
      if (!open.includes(id)) return;
      e.preventDefault();
      onPick([id]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ids, onPick]);

  const firstIdx = pick ? props.totems.findIndex((_, i) => pick.ids.includes(`t${i}`)) : -1;
  return (
    <div
      className={`totems${pick ? ' is-picking' : ''}`}
      role="group"
      aria-label={pick ? pick.prompt : 'Totems'}
    >
      {pick && (
        <p className="totems__prompt" role="status" aria-live="assertive">
          {pick.prompt}
        </p>
      )}
      <div className="totems__row">
        {props.totems.map((kind, i) => {
          const def = kind ? props.db.totems?.[kind] : undefined;
          const look = kind ? totemLook(kind) : null;
          // (its numbers as they are now: "2 (+1 per Spirit)" reads 2 + Spirit)
          const live = def
            ? def.text.replace(/(\d+) \(\+1 per Spirit\)/g, (_, n: string) =>
                String(Number(n) + props.spirit),
              )
            : '';
          const label =
            look && def
              ? `${look.name} totem, ${i === 0 ? 'next to act' : `position ${i + 1}`}. ${live}`
              : `Position ${i + 1}: no totem`;
          const tip =
            look && def
              ? tipAttrs({
                  kicker: i === 0 ? 'Totem · next to act' : 'Totem',
                  title: look.name,
                  text: live,
                })
              : tipAttrs({
                  kicker: 'Totem position',
                  title: 'Empty',
                  text: 'A card that plants a totem puts it in the first empty position.',
                });
          const cls = `totem${kind ? ` totem--${kind}` : ' is-empty'}${kind && art.totems[kind] ? ' has-art' : ''}${props.summon?.totem === i ? ' is-acting' : ''}`;
          const picture = kind ? art.totems[kind] : undefined;
          const summoned = props.summon && props.summon.totem === i ? props.summon : null;
          const spiritPic = summoned ? art.spirits[summoned.spirit] : undefined;
          const face = (
            <>
              {picture ? (
                <img className="totem__img" src={picture} alt="" draggable={false} />
              ) : (
                <b aria-hidden="true">{look ? look.glyph : '·'}</b>
              )}
              {summoned && (
                <span key={summoned.key} className="totem__spirit" aria-hidden="true">
                  {spiritPic ? (
                    <img src={spiritPic} alt="" draggable={false} />
                  ) : (
                    <b>{totemLook(summoned.spirit).glyph}</b>
                  )}
                </span>
              )}
              <small>{look ? look.name : 'empty'}</small>
              {pick && (
                <kbd className="totem__key" aria-hidden="true">
                  {i + 1}
                </kbd>
              )}
              {!pick && i === 0 && kind && (
                <em className="totem__next" aria-hidden="true">
                  Next
                </em>
              )}
            </>
          );
          if (!pick) {
            return (
              <span key={i} className={cls} aria-label={label} {...tip}>
                {face}
              </span>
            );
          }
          const id = `t${i}`;
          const can = pick.ids.includes(id);
          return (
            <button
              key={i}
              ref={i === firstIdx ? first : undefined}
              type="button"
              className={`${cls} ${can ? 'is-ready is-choice' : 'is-dim'}`}
              disabled={!can}
              aria-label={`${can ? 'Choose: ' : ''}${label}`}
              onClick={() => can && props.onPick?.([id])}
              {...tip}
            >
              {face}
            </button>
          );
        })}
      </div>
      {pick && pick.min === 0 && (
        <button
          type="button"
          className="btn btn--small totems__keep"
          onClick={() => props.onPick?.([])}
        >
          <span>{pick.keep ?? 'Keep them all'}</span>
        </button>
      )}
      <div
        className={`totems__spirit${props.spirit > 0 ? ' is-lit' : ''}`}
        aria-label={`Spirit ${props.spirit}: every totem number +${props.spirit}`}
        {...tipAttrs({
          kicker: 'Spirit',
          title: `${props.spirit} Spirit`,
          text: 'Never goes down. Each point adds 1 to every totem number (what they do each turn, and when they act), but not the Elder Tree’s or the Moon Owl’s. A commanded Hawk gives 1.',
        })}
      >
        <span className="totems__orb" aria-hidden="true">
          {props.spirit}
        </span>
        <span className="totems__spiritText" aria-hidden="true">
          <b>Spirit</b>
          <small>Every totem +{props.spirit}</small>
        </span>
      </div>
    </div>
  );
}
