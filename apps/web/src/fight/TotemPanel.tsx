// The Shaman's totems on the battle screen (DECISIONS #420): his positions (three to start, up to five), his Spirit and the commands
// he has left this turn. On his turn each planted totem is a button: press one to call its spirit (it aims by itself). Presentation
// only: the totems and the legal commands come from the combat view and legalActions().

import type { CombatDb } from '@sr/combat';
import { tipAttrs } from '../ui/tip';
import { totemLook } from './totemLook';

export function TotemPanel(props: {
  db: CombatDb;
  totems: readonly (string | null)[];
  spirit: number;
  /** commands left this turn */
  commands: number;
  /** the positions that can be commanded right now (none when it is not your turn, or on the other side's panel) */
  ready: ReadonlySet<number>;
  onCommand?: (totem: number) => void;
}) {
  const mine = !!props.onCommand;
  return (
    <div className="totems" role="group" aria-label="Totems">
      <div className="totems__row">
        {props.totems.map((kind, i) => {
          const def = kind ? props.db.totems?.[kind] : undefined;
          const look = kind ? totemLook(kind) : null;
          const ready = props.ready.has(i);
          return (
            <button
              key={i}
              type="button"
              className={`totem${kind ? ` totem--${kind}` : ' is-empty'}${ready ? ' is-ready' : ''}`}
              disabled={!ready}
              aria-label={
                look && def
                  ? `${look.name} totem, position ${i + 1}. ${def.text}${ready ? ' Press to call it.' : ''}`
                  : `Position ${i + 1}: no totem`
              }
              onClick={() => props.onCommand?.(i)}
              {...(look && def
                ? tipAttrs({ kicker: 'Totem', title: look.name, text: def.text })
                : tipAttrs({
                    kicker: 'Totem position',
                    title: 'Empty',
                    text: 'A card that plants a totem puts it in the first empty position.',
                  }))}
            >
              <b aria-hidden="true">{look ? look.glyph : '·'}</b>
              <small>{look ? look.name : 'empty'}</small>
            </button>
          );
        })}
      </div>
      <div
        className="totems__spirit"
        {...tipAttrs({
          kicker: 'Spirit',
          title: `${props.spirit} Spirit`,
          text: 'Never goes down. Each point adds 1 to every command; every 2 add 1 to every totem’s help. Trinity gives 1 each turn it triggers.',
        })}
      >
        <span aria-hidden="true">◉</span>
        <small>Spirit {props.spirit}</small>
      </div>
      {(mine || props.commands > 0) && (
        <p className="totems__state">
          {props.commands > 0
            ? `${props.commands} command${props.commands === 1 ? '' : 's'} left: press a totem`
            : 'No commands left this turn'}
        </p>
      )}
    </div>
  );
}
