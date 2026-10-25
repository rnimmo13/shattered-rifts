// What the Brass Cascade is called and how it is explained to the player, and a sample board for practice.

import type { LanePrize } from './prizes';

export const TRIAL_INFO = {
  cascade: {
    name: 'Brass Cascade',
    blurb: 'Drop three balls. Every lane they land in is a prize you earn.',
    time: 'About a minute',
    rules: [
      'Each of the ten lanes at the bottom holds a prize. You can see all of them, and the prizes stand in different lanes every time.',
      'Slide along the top of the board (mouse, finger, or hold the arrow keys) and let go. The ball bounces about, and where it lands is drawn fairly: every lane is exactly as likely as any other, wherever you drop it.',
      'You drop three balls, and choose one prize from the lanes they landed in. Only one lane holds a Legendary card.',
      'If two balls land in the same lane, that lane pays again with a second, different prize of the same kind, marked ×2.',
    ],
  },
} as const;

/** A sample board, for the practice page. */
export const SAMPLE_PRIZES: LanePrize[] = [
  { icon: 'card', short: 'A Legendary card', label: 'Take a Legendary card' },
  { icon: 'rare', short: 'A rare card', label: 'Take a rare card of yours' },
  { icon: 'boon', short: 'A Boon', label: 'Take a Boon' },
  { icon: 'crossed', short: 'Rift-crossed rare', label: 'Take a Rift-crossed rare card' },
  { icon: 'upgrade', short: 'Upgrade ×3', label: 'Masterwork: 3 random cards are upgraded' },
  { icon: 'shards', short: '+115 shards', label: 'A purse: +115 shards' },
  { icon: 'heal', short: 'Heal 40%', label: 'A rest: heal 40% of your HP' },
  { icon: 'hp', short: '+10 HP, heal', label: 'Vitality: +10 max HP, and heal 30%' },
  { icon: 'potion', short: 'An elite potion', label: 'Take a rare potion' },
  { icon: 'boon', short: 'A Boon', label: 'Take a Boon' },
];
