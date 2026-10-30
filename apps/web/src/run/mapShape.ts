// Whether the stage map runs top to bottom: a screen taller than it is wide (a phone held upright, DECISIONS #443). The hook
// re-renders when the screen is turned.

import { useSyncExternalStore } from 'react';

const tall = (): boolean => window.innerHeight > window.innerWidth;

function subscribe(onChange: () => void): () => void {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

export function useTallMap(): boolean {
  return useSyncExternalStore(subscribe, tall, () => false);
}
