// Combat v2 card pool: Neutral + one pool per Riftwalker (docs/08_COMBAT_V2.md §5, docs/09_ROSTER.md). Numbers assume
// 3 Mana and a 5-card hand; a 1-Mana attack is worth ~6-9 damage and a 2-Mana attack ~12-15. Upgrades ("+") are derived
// by build.plus() unless a card carries a hand-written one.

import type { CardDef } from '@sr/combat';
import { withUpgrades } from './build';
import { SPELLBLADE } from './pools/spellblade';
import { LEGENDARIES } from './pools/legendary';
import { SHAMAN, SHAMAN_STATUSES } from './pools/shaman';
import { HUNTER } from './pools/hunter';
import { DRUNKARD } from './pools/drunkard';
import { ANCESTRAL, JUNK, NEUTRAL, SIGNATURES } from './pools/neutral';
import { KNIGHT } from './pools/knight';
import { NECROMANCER } from './pools/necromancer';
import { ASSASSIN } from './pools/assassin';
import { ENGINEER } from './pools/engineer';
import { BARBARIAN } from './pools/barbarian';
import { TRICKSTER } from './pools/trickster';

/** Every playable card with its "+" version, plus junk. */
export const V2_CARDS: CardDef[] = [
  ...withUpgrades([
    ...NEUTRAL,
    ...KNIGHT,
    ...ENGINEER,
    ...HUNTER,
    ...TRICKSTER,
    ...ASSASSIN,
    ...SHAMAN,
    ...BARBARIAN,
    ...SPELLBLADE,
    ...LEGENDARIES,
    ...NECROMANCER,
    ...DRUNKARD,
    ...SIGNATURES,
    ...ANCESTRAL,
  ]),
  ...JUNK,
  ...SHAMAN_STATUSES,
];
