// A big readable copy of whatever card the pointer is over (shop, rewards, deck screens).

import { COMBAT_DB } from '@sr/content/v2';
import type { CardDef } from '@sr/combat';
import { FightCard } from './FightCard';

export function CardHover(props: { def: CardDef | null }) {
  if (!props.def) return null;
  return (
    <div className="cardhover" aria-hidden>
      <FightCard db={COMBAT_DB} def={props.def} width={300} />
      {props.def.upgrade && COMBAT_DB.cards[props.def.upgrade] && (
        <div className="cardhover__plus">
          <small>Upgraded</small>
          <FightCard
            db={COMBAT_DB}
            def={COMBAT_DB.cards[props.def.upgrade] as CardDef}
            width={190}
          />
        </div>
      )}
    </div>
  );
}
