/** Callers check playability first. Only multiple engine-approved targets need a choice. */
export const needsAim = (card: { targets: readonly string[] }): boolean => card.targets.length > 1;
