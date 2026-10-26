// What the Brass Reel is called and how it is explained to the player, and a sample reel for practice.

import type { LanePrize } from './prizes';

export const TRIAL_INFO = {
  reel: {
    name: 'Spin To Win',
    blurb: 'Pay to spin a reel of prizes. Take what it stops on, or pay to spin again.',
    rules: [
      'Thirteen prizes are on the reel, and you can see all of them. They stand in a different order every time.',
      'A spin costs 25 shards. The reel scrolls past the pointer and slows to a stop on one prize.',
      'Take it, or pay another 25 shards to let it go and spin again. A new spin never stops on the prize you are holding, and every other prize is equally likely.',
      'Walk away at any time: the shards you have spent are gone, and so is the prize you were holding. Only one prize on the reel is a Legendary card.',
    ],
  },
} as const;

/** A sample reel, for the practice page. */
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
