// The Shaman's totems on the battle screen (DECISIONS #420, #421): his positions (three to start, up to five) and his Spirit. A totem
// helps the first spell of its element each turn and acts only when a card commands it. When a card asks which totem acts, or where
// a new one goes, the choice is made here, on the panel itself (DECISIONS #427: no pop-up): the totems that can be chosen light up
// as buttons, the rest dim. The carved totems are pictures where one is drawn (DECISIONS #429; they fill the panel, so they grow when
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
  const help = Math.floor(props.spirit / 2);
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
          const label =
            look && def
              ? `${look.name} totem, position ${i + 1}. ${def.text}`
              : `Position ${i + 1}: no totem`;
          const tip =
            look && def
              ? tipAttrs({ kicker: 'Totem', title: look.name, text: def.text })
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
        aria-label={`Spirit ${props.spirit}: every command +${props.spirit}, every totem's help +${help}`}
        {...tipAttrs({
          kicker: 'Spirit',
          title: `${props.spirit} Spirit`,
          text: 'Never goes down. Each point adds 1 to every command; every 2 add 1 to every totem’s help. Trinity gives 1 each turn it triggers.',
        })}
      >
        <span className="totems__orb" aria-hidden="true">
          {props.spirit}
        </span>
        <span className="totems__spiritText" aria-hidden="true">
          <b>Spirit</b>
          <small>
            Commands +{props.spirit} · Help +{help}
          </small>
        </span>
      </div>
    </div>
  );
}
