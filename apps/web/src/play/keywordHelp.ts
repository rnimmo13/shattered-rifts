// Plain-language explanations of keywords, shown beside a card when you inspect it. These restate the rules in
// docs/01_GAME_DESIGN.md §3.8; they never replace them.

import type { Keyword } from '@sr/engine';

export const KEYWORD_HELP: Record<Keyword, { name: string; text: string }> = {
  guardian: {
    name: 'Guardian',
    text: 'Enemies must attack a face-up Guardian first, if they can.',
  },
  blitz: { name: 'Blitz', text: 'Can attack the turn it arrives.' },
  shield: { name: 'Shield', text: 'Blocks the next damage it would take, then pops.' },
  ward: {
    name: 'Ward',
    text: 'The first enemy effect that targets it each turn is cancelled.',
  },
  pierce: {
    name: 'Pierce',
    text: 'Extra combat damage past its target carries over to the enemy Riftwalker.',
  },
  lifebind: {
    name: 'Lifebind',
    text: 'Damage it deals also heals your Essence by that much.',
  },
  veiled: {
    name: 'Veiled',
    text: "Can't be targeted or attacked until it attacks or deals damage.",
  },
  stun: {
    name: 'Stun',
    text: "A stunned unit can't attack or use abilities on its controller's next turn.",
  },
  corrode: {
    name: 'Corrode',
    text: 'Loses 1 Damage at the start of its controller’s turn (never below 0).',
  },
  ambush: {
    name: 'Ambush',
    text: 'Can be set face-down for 1 Mana. It flips for free when attacked, and its Flip effect triggers.',
  },
  devour: {
    name: 'Devour',
    text: 'When summoned, you may destroy another of your units for the listed bonus.',
  },
  evolve: {
    name: 'Evolve',
    text: 'Transforms into another card when its condition is met. Keeps damage and buffs.',
  },
  assemble: {
    name: 'Assemble',
    text: 'When summoned, you may merge it with one of your Constructs to gain its stats and keywords.',
  },
  overclock: {
    name: 'Overclock',
    text: 'Optional extra Mana cost when played, for a bonus.',
  },
  resonance: {
    name: 'Resonance',
    text: 'A bonus if you have played enough cards this turn.',
  },
  echo: {
    name: 'Echo',
    text: 'Once it is in your Void, you may cast it again from there for the listed Mana. Then it is gone.',
  },
  ascend: {
    name: 'Ascend',
    text: 'You may sacrifice the listed units instead of paying Mana.',
  },
  scry: {
    name: 'Scry',
    text: 'Look at the top cards of your deck and put any on the bottom.',
  },
  swift: {
    name: 'Swift',
    text: 'A spell you can cast at any response window, on either turn.',
  },
  quick: {
    name: 'Quick',
    text: 'An ability you can use at any response window.',
  },
  negate: { name: 'Negate', text: 'Cancels a chain link before it resolves.' },
  charges: {
    name: 'Charges',
    text: 'A relic starts with this many charges and breaks when they run out.',
  },
};

/** The rules every card type follows, shown for the card being inspected. */
export const TYPE_HELP: Record<string, string> = {
  unit: 'A unit stands on your board and fights. HP is how much damage it can take. Damage is how hard it hits.',
  spell: 'A spell does its effect once, then goes to the Void.',
  trap: 'Set face-down for free. The enemy cannot see it. It springs in response to the event on its card, and you pay its cost then.',
  relic: 'Stays in your back row and gives an ongoing effect or ability.',
  rift: 'A field-wide effect. Playing a new Rift replaces the old one.',
};
