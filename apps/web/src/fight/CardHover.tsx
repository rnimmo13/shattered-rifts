// A big readable copy of whatever card the pointer is over (shop, rewards, deck screens).

import { useLayoutEffect, useRef } from 'react';
import { COMBAT_DB } from '@sr/content/v2';
import { cardText, type CardDef } from '@sr/combat';
import { FightCard } from './FightCard';
import { keywordsOf, sanctifiedNote } from './info';
import './cardhover.css';

/** Where the pointer is: the rectangle of the card being hovered, so the preview can sit beside it instead of over everything. */
export interface Anchor {
  left: number;
  right: number;
  top: number;
}

const PREVIEW_W_FULL = 330;
/** a short window (a phone on its side) gets a smaller preview, with the keyword notes beside the card, not under it */
const isCompact = (): boolean => window.innerHeight < 600;
const previewW = (): number =>
  isCompact()
    ? Math.min(PREVIEW_W_FULL, Math.floor((window.innerHeight - 24) / 1.45))
    : PREVIEW_W_FULL;

/** The preview is one card wide, or two (the card and its upgrade side by side) when choosing a card to upgrade. */
function beside(at: Anchor, width: number): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // to the right of the card when there is room, otherwise to its left; never off the screen
  const raw = vw - at.right >= width + 24 ? at.right + 12 : at.left - width - 12;
  const left = Math.max(8, Math.min(raw, vw - width - 8));
  const top = Math.max(8, Math.min(at.top - 30, vh - previewW() * 1.45 - 8));
  return { left, top, right: 'auto', bottom: 'auto' };
}

export function CardHover(props: {
  def: CardDef | null;
  at?: Anchor | null;
  plus?: boolean;
  /** what the card costs now, when that is not the printed cost */
  cost?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  // the preview's real height (card, keyword notes, "Upgraded" label) is only known once it is drawn, so slide it up
  // until its bottom edge is on the screen
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || !props.at) return;
    const r = el.getBoundingClientRect();
    const over = r.bottom - (window.innerHeight - 8);
    if (over > 0) el.style.top = `${Math.max(8, r.top - over)}px`;
  });
  if (!props.def) return null;
  // the upgrade sits beside the card wherever a card is looked at (the hand in a fight turns it off)
  const showPlus = props.plus ?? true;
  // on a narrow screen there is no room for the card and its upgrade side by side
  const wide =
    showPlus &&
    !!props.def.upgrade &&
    !!COMBAT_DB.cards[props.def.upgrade] &&
    window.innerWidth >= PREVIEW_W_FULL * 2 + 40;
  const PREVIEW_W = previewW();
  const compact = isCompact();
  const roll = sanctifiedNote(COMBAT_DB, props.def);
  const keys = [
    ...(roll ? [roll] : []),
    ...keywordsOf(
      props.def,
      (u) => COMBAT_DB.units[u]?.taunt === true,
      cardText(COMBAT_DB, props.def),
    ),
  ];
  return (
    <div
      ref={box}
      className={`cardhover${compact ? ' cardhover--compact' : ''}`}
      aria-hidden
      style={
        props.at
          ? beside(props.at, wide ? PREVIEW_W * 2 + 13 : PREVIEW_W + (compact ? 220 : 0))
          : undefined
      }
    >
      <div className="cardhover__main">
        <FightCard
          db={COMBAT_DB}
          def={props.def}
          width={PREVIEW_W}
          {...(props.cost !== undefined && props.cost !== props.def.cost
            ? { cost: props.cost }
            : {})}
        />
        {keys.length > 0 && (
          <ul className="cardhover__keys">
            {keys.map((k) => (
              <li key={k.name}>
                <b>{k.name}</b> {k.text}
              </li>
            ))}
          </ul>
        )}
      </div>
      {wide && props.def.upgrade && COMBAT_DB.cards[props.def.upgrade] && (
        <div className="cardhover__plus">
          <small>Upgraded</small>
          <FightCard
            db={COMBAT_DB}
            def={COMBAT_DB.cards[props.def.upgrade] as CardDef}
            width={PREVIEW_W}
          />
        </div>
      )}
    </div>
  );
}
