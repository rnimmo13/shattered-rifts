// A card's id may carry marks written into it by the content: a Sanctum roll in front ("hi~", "lo~"), an engraved tag ("hold^")
// and the upgrade behind ("+"). The engine knows only that shape, not the marks' names.

/**
 * The card a copy is, whatever is written on it: "hi~hold^gathering-storm+" -> "gathering-storm". Two copies with the same base
 * id are the same card (they grow together, they are "the same card played").
 */
export const baseCardId = (id: string): string =>
  id
    .replace(/^[a-z]+~/, '')
    .replace(/^[a-z]+\^/, '')
    .replace(/\+$/, '');
