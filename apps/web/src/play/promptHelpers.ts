import type { Action, GameView } from '@sr/engine';
import { cardName, describeAction } from './actions';
import type { ChoiceOption } from './Prompts';

/** Build the options list for a pending prompt from the legal actions. */
export function optionsFor(legal: readonly Action[], view: GameView): ChoiceOption[] {
  return legal.map((a) => ({ label: describeAction(a, view), action: a }));
}

export function pendingTitle(view: GameView): string {
  const p = view.pending;
  if (!p) return '';
  switch (p.kind) {
    case 'chooseTargets': {
      const src =
        p.then.kind === 'trigger'
          ? p.then.trigger.sourceId
          : p.then.kind === 'flip'
            ? p.then.unitId
            : p.then.sourceId;
      return `Choose targets for ${cardName(view, src)}`;
    }
    case 'chooseOptional':
      return `Use ${cardName(view, p.trigger.sourceId)}?`;
    case 'scry':
      return 'Look at the top of your deck';
    case 'chooseCards':
      return p.purpose === 'topdeck'
        ? 'Choose a card'
        : p.purpose === 'setTrap'
          ? 'Choose a trap to set'
          : 'Choose a card to destroy';
    case 'mulligan':
      return 'Opening hand';
  }
}
