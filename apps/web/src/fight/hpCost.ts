// (DECISIONS #707, #713) What HP costs on your own cards are multiplied by where they are shown: five times in an Arena fight, so the
// card says what you will really pay. Cards outside a fight (the library, the Grimoire, deck screens) show the plain Campaign number.
import { createContext } from 'react';

export const HpCostMult = createContext(1);
