// What the Brass Cascade is called and how it is explained to the player, and a sample board for practice.

import type { LanePrize } from './prizes';

export const TRIAL_INFO = {
  cascade: {
    name: 'Brass Cascade',
    blurb: 'Drop three balls. Every lane they land in is a prize you earn.',
    time: 'About a minute',
    rules: [
      'Each of the ten lanes at the bottom holds a prize. You can see all of them.',
      'Slide along the top of the board (mouse, finger, or hold the arrow keys) and let go from wherever you like. The ball bounces a lot, so no drop is a sure thing.',
      'Lean on a ball with the arrow keys as it falls to turn it, but you only have a few nudges for all three balls.',
      'You drop three balls, and choose one prize from the lanes they landed in. The edges are hardest to reach and hold the best.',
      'If two balls land in the same lane, that lane pays again with a second, different prize of the same kind, marked ×2.',
    ],
  },
} as const;

/** A sample board, for the practice page. */
export const SAMPLE_PRIZES: LanePrize[] = [
  { icon: 'card', short: 'A Legendary card', label: 'Take a Legendary card' },
  { icon: 'boon', short: 'A Boon', label: 'Take a Boon' },
  { icon: 'crossed', short: 'Rift-crossed rare', label: 'Take a Rift-crossed rare card' },
  { icon: 'upgrade', short: 'Upgrade ×3', label: 'Masterwork: 3 random cards are upgraded' },
  { icon: 'shards', short: '+90 shards', label: 'A purse: +90 shards' },
  { icon: 'heal', short: 'Heal 40%', label: 'A rest: heal 40% of your HP' },
  { icon: 'hp', short: '+10 HP, heal', label: 'Vitality: +10 max HP, and heal 30%' },
  { icon: 'potion', short: 'An elite potion', label: 'Take a rare potion' },
  { icon: 'boon', short: 'A Boon', label: 'Take a Boon' },
  { icon: 'card', short: 'A Legendary card', label: 'Take a Legendary card' },
];
