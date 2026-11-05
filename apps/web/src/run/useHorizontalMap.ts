import { useSyncExternalStore } from 'react';

const horizontalQuery = '(min-width: 64rem) and (orientation: landscape)';
const horizontal = () => window.matchMedia(horizontalQuery).matches;
const subscribeShape = (fn: () => void) => {
  const query = window.matchMedia(horizontalQuery);
  query.addEventListener('change', fn);
  return () => query.removeEventListener('change', fn);
};
export const useHorizontalMap = () => useSyncExternalStore(subscribeShape, horizontal, () => false);
