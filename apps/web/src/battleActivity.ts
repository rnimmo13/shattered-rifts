// A mounted fight, including its result/series transitions, is an unsafe update boundary.
let count = 0;
const listeners = new Set<() => void>();
export const battleActive = (): boolean => count > 0;
export const subscribeBattle = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export function enterBattle(): () => void {
  count++;
  for (const listener of listeners) listener();
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    count--;
    for (const listener of listeners) listener();
  };
}
