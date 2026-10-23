// A big readable copy of whatever card the pointer is over (shop, rewards, deck screens).

import { COMBAT_DB } from '@sr/content/v2';
import type { CardDef } from '@sr/combat';
import { FightCard } from './FightCard';
import { keywordsOf } from './info';
import './cardhover.css';

/** Where the pointer is: the rectangle of the card being hovered, so the preview can sit beside it instead of over everything. */
export interface Anchor {
  left: number;
  right: number;
  top: number;
}

const PREVIEW_W = 330;
const PREVIEW_H = 480;

/** The preview is one card wide, or two (the card and its upgrade side by side) when choosing a card to upgrade. */
function beside(at: Anchor, width: number): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // to the right of the card when there is room, otherwise to its left; never off the screen
  const raw = vw - at.right >= width + 24 ? at.right + 12 : at.left - width - 12;
  const left = Math.max(8, Math.min(raw, vw - width - 8));
  const top = Math.max(8, Math.min(at.top - 30, vh - PREVIEW_H - 8));
  return { left, top, right: 'auto', bottom: 'auto' };
}

export function CardHover(props: { def: CardDef | null; at?: Anchor | null; plus?: boolean }) {
  if (!props.def) return null;
  const showPlus = props.plus ?? !props.at;
  // on a narrow screen there is no room for the card and its upgrade side by side
  const wide =
    showPlus &&
    !!props.def.upgrade &&
    !!COMBAT_DB.cards[props.def.upgrade] &&
    window.innerWidth >= PREVIEW_W * 2 + 40;
  const keys = keywordsOf(props.def, (u) => COMBAT_DB.units[u]?.taunt === true);
  return (
    <div
      className="cardhover"
      aria-hidden
      style={props.at ? beside(props.at, wide ? PREVIEW_W * 2 + 13 : PREVIEW_W) : undefined}
    >
      <div className="cardhover__main">
        <FightCard db={COMBAT_DB} def={props.def} width={330} />
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
            width={330}
          />
        </div>
      )}
    </div>
  );
}
