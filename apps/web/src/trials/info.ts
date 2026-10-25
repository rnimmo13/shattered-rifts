// What each trial game is called and how it is explained to the player.

import type { TrialGame } from '@sr/campaign';

export const TRIAL_INFO: Record<
  TrialGame,
  { name: string; blurb: string; rules: string[]; time: string }
> = {
  echoes: {
    name: 'Echoes',
    blurb: 'Memory: ring the stones back.',
    time: 'About a minute',
    rules: [
      'Four stones ring in a pattern. Ring them back in the same order.',
      'Each round the song grows by one note. Survive six rounds.',
      'Two wrong notes and the hall closes.',
    ],
  },
  pairs: {
    name: 'Mirror Shards',
    blurb: 'Memory: find the matching pairs.',
    time: 'About a minute',
    rules: [
      'Twelve tiles hide six pairs of runes. Turn two at a time.',
      'A match stays up. A miss flips back, so remember where things were.',
      'Seven wrong turns and the glass wakes.',
    ],
  },
  runelock: {
    name: 'Rune Lock',
    blurb: 'Logic: darken the whole lock.',
    time: 'One to two minutes',
    rules: [
      'Touch a rune and it flips, along with the runes directly beside it (not the diagonals).',
      'Darken every rune to open the lock.',
      'You have twelve presses. The lock can always be opened in far fewer.',
    ],
  },
  rhythm: {
    name: 'Heartbeat Gate',
    blurb: 'Timing: strike on the beat.',
    time: 'Under a minute',
    rules: [
      'A needle sweeps a dial. Strike (click, tap or Space) while it is over the gold.',
      'The gold narrows and the needle quickens each round.',
      'Four of five strikes open the gate.',
    ],
  },
  cipher: {
    name: 'Cipher Door',
    blurb: 'Deduction: crack the code.',
    time: 'Two minutes',
    rules: [
      'The door hides four different runes out of six. Guess the code.',
      'A gold pip: a right rune in the right place. A hollow pip: a right rune in the wrong place.',
      'Eight guesses. Use the pips.',
    ],
  },
};
