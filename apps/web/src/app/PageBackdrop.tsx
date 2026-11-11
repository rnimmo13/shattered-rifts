// The painted place behind a menu page (DECISIONS #745, #747): seven pictures cover every page that is not a fight, a run or the
// lore. A page keeps its own layout; this only puts the picture behind it, under a dark wash so the words on top read as before.
// Nothing is shown while a fight is on screen (a fight has its own arena).

import { useSyncExternalStore } from 'react';
import { battleActive, subscribeBattle } from '../battleActivity';
import './backdrops.css';

type Place =
  'sanctum' | 'market' | 'vault' | 'crossing-gate' | 'archive' | 'champions' | 'chronicle';

const PLACES: Readonly<Record<string, Place>> = {
  '': 'sanctum',
  '#': 'sanctum',
  '#/': 'sanctum',
  '#/store': 'market',
  '#/cosmetics': 'vault',
  '#/earned': 'vault',
  '#/arena': 'crossing-gate',
  '#/pvp': 'crossing-gate',
  '#/arena-rules': 'crossing-gate',
  '#/ghosts': 'crossing-gate',
  '#/decks': 'archive',
  '#/cards': 'archive',
  '#/history': 'archive',
  '#/board': 'champions',
  '#/trophies': 'champions',
  '#/learn': 'chronicle',
  '#/patch-notes': 'chronicle',
  '#/credits': 'chronicle',
};

/** The place a page is in, if it has one (a fight, a run, a replay and the lore have their own pictures). */
const placeOf = (hash: string): Place | undefined =>
  Object.hasOwn(PLACES, hash) ? PLACES[hash] : undefined;

export function PageBackdrop(props: { hash: string }) {
  const place = placeOf(props.hash);
  const inBattle = useSyncExternalStore(subscribeBattle, battleActive);
  if (!place || inBattle) return null;
  return (
    <div
      // (keyed by the place, so moving between two pages of one place does not fade it in again)
      key={place}
      className={`backdrop backdrop--${place}`}
      style={{
        backgroundImage: `url("${import.meta.env.BASE_URL}art/backgrounds/${place}.webp")`,
      }}
      aria-hidden
    />
  );
}
