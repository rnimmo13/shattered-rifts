// The Shaman's totems on the battle screen (DECISIONS #418): his three fixed positions, in a panel of their own in that side's column,
// with his Spirit. On his turn each planted totem is a button: press one to command it (once a turn), then click a glowing target if
// its spirit aims at one. "Empower" spends 1 Spirit on the command. Presentation only: the totems and the legal commands come from
// the combat view and legalActions().

import { SPIRIT_BOOST, SPIRIT_MAX, type CombatDb } from '@sr/combat';
import { tipAttrs } from '../ui/tip';
import { totemLook } from './totemLook';

export function TotemPanel(props: {
  db: CombatDb;
  totems: readonly (string | null)[];
  spirit: number;
  commanded: boolean;
  /** the positions that can be commanded right now (none when it is not your turn, or on the other side's panel) */
  ready: ReadonlySet<number>;
  /** the command being aimed, if any */
  aiming: number | null;
  /** Spirit can be spent on the next command, and whether it will be */
  canEmpower: boolean;
  empower: boolean;
  onEmpower?: (on: boolean) => void;
  onCommand?: (totem: number) => void;
}) {
  const mine = !!props.onCommand;
  const state = props.commanded
    ? 'Commanded this turn'
    : props.ready.size
      ? 'Command one totem'
      : mine
        ? 'No command now'
        : '';
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
              className={`totem${kind ? ` totem--${kind}` : ' is-empty'}${ready ? ' is-ready' : ''}${props.aiming === i ? ' is-aiming' : ''}`}
              disabled={!ready}
              aria-pressed={props.aiming === i}
              aria-label={
                look && def
                  ? `${look.name} totem, position ${i + 1}. ${def.text}${ready ? ' Press to command it.' : ''}`
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
          title: `${props.spirit} of ${SPIRIT_MAX}`,
          text: `Kept from turn to turn. Spend 1 on a Hawk or Bear command for ${SPIRIT_BOOST} more (Empower). Elders and some cards give it.`,
        })}
      >
        <span aria-hidden="true">
          {Array.from({ length: SPIRIT_MAX }, (_, k) => (k < props.spirit ? '◉' : '○')).join('')}
        </span>
        <small>
          Spirit {props.spirit}/{SPIRIT_MAX}
        </small>
        {mine && props.canEmpower && (
          <button
            type="button"
            className={`btn btn--small${props.empower ? '' : ' btn--ghost'}`}
            aria-pressed={props.empower}
            onClick={() => props.onEmpower?.(!props.empower)}
          >
            <span>Empower +{SPIRIT_BOOST}</span>
          </button>
        )}
      </div>
      {state && <p className="totems__state">{state}</p>}
    </div>
  );
}
