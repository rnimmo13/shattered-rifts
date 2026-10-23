// Combat v2 card pool: Neutral + one pool per Riftwalker (docs/08_COMBAT_V2.md §5, docs/09_ROSTER.md). Numbers assume
// 3 Mana and a 5-card hand; a 1-Mana attack is worth ~6-9 damage and a 2-Mana attack ~12-15. Upgrades ("+") are derived
// by build.plus() unless a card carries a hand-written one.

import type { CardDef } from '@sr/combat';
import { withUpgrades } from './build';
import { ASTRA } from './pools/astra';
import { ILVANE } from './pools/ilvane';
import { KESH } from './pools/kesh';
import { KP } from './pools/kp';
import { JUNK, NEUTRAL, SIGNATURES } from './pools/neutral';
import { MAREN } from './pools/maren';
import { MIRE } from './pools/mire';
import { QUILL } from './pools/quill';
import { RIVET } from './pools/rivet';
import { SEHRA } from './pools/sehra';
import { VESPER } from './pools/vesper';

/** Every playable card with its "+" version, plus junk. */
export const V2_CARDS: CardDef[] = [
  ...withUpgrades([
    ...NEUTRAL,
    ...MAREN,
    ...RIVET,
    ...KESH,
    ...VESPER,
    ...QUILL,
    ...ILVANE,
    ...SEHRA,
    ...ASTRA,
    ...MIRE,
    ...KP,
    ...SIGNATURES,
  ]),
  ...JUNK,
];
