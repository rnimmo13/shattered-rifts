// The Monk's Martial Forms on the battle screen (DECISIONS #419): his form (a mark and its name, so it reads without colour), its
// objective in a line, two pips for its progress this turn, and his Mastery. Presentation only: all of it comes from the combat view.

import { MASTERY_MAX, type Form } from '@sr/combat';
import { tipAttrs } from '../ui/tip';
import { FORM_LOOK } from './formLook';

export function FormPanel(props: { form: Form; progress: number; done: boolean; mastery: number }) {
  const look = FORM_LOOK[props.form];
  return (
    <div
      className={`form form--${props.form}${props.done ? ' is-done' : ''}`}
      role="group"
      aria-label={`${look.name} form. ${look.goal}. ${props.done ? 'Completed this turn' : `${props.progress} of 2 done`}. Mastery ${props.mastery} of ${MASTERY_MAX}.`}
      {...tipAttrs({
        kicker: 'Martial Form',
        title: `${look.name}: ${look.goal}`,
        text: 'Only cards marked as a Defensive or Striking technique count, played from your hand. Completing it (once a turn) gives 1 Mastery and 3 Barrier. Changing form starts the progress again.',
      })}
    >
      <div className="form__head">
        <b aria-hidden="true">{look.glyph}</b>
        <span>{look.name}</span>
        <span className="form__pips" aria-hidden="true">
          {[0, 1].map((k) => (k < props.progress ? '●' : '○')).join('')}
        </span>
      </div>
      <small className="form__goal">{props.done ? 'Done this turn' : look.goal}</small>
      <small
        className="form__mastery"
        {...tipAttrs({
          kicker: 'Mastery',
          title: `${props.mastery} of ${MASTERY_MAX}`,
          text: 'Kept from turn to turn. Techniques such as Mountain Breaker spend up to 2 of it for more.',
        })}
      >
        Mastery{' '}
        <span aria-hidden="true">
          {Array.from({ length: MASTERY_MAX }, (_, k) => (k < props.mastery ? '◆' : '◇')).join('')}
        </span>
      </small>
    </div>
  );
}
