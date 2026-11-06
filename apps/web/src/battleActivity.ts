// A mounted fight, including its result/series transitions, is an unsafe update boundary.
let count = 0;
let entered = 0;
const listeners = new Set<() => void>();
export const battleActive = (): boolean => count > 0;
/** Counts every fight mounted since startup, so a fight replacing another can be told apart. */
export const battleSerial = (): number => entered;
export const subscribeBattle = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export function enterBattle(): () => void {
  count++;
  entered++;
  for (const listener of listeners) listener();
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    count--;
    for (const listener of listeners) listener();
  };
}
