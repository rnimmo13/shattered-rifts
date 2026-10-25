// A campaign Warden that is a ghost: a deck from the Arena, played by the computer, fought on the PvP fight screen. This is the Arena's
// match played in the browser: the same rules and the same computer opponent as a ghost on the server (chooseSmartAction), and a PvpLink
// the fight screen uses exactly as it uses a real match. The moves made so far are kept (both seats), so a reload picks the fight up
// where it was and replays the moves silently; there is nothing to gain by reloading.

import {
  applyAction,
  chooseSmartAction,
  createCombat,
  hashState,
  type Action,
  type CombatDb,
  type CombatSetup,
  type CombatState,
  type Side,
} from '@sr/combat';
import { MoveFeed, type PvpLink } from '../pvp/link';

interface Played {
  seat: Side;
  action: Action;
}

const PREFIX = 'sr.ghostlog:';

function load(key: string, seed: string): Played[] {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return [];
    const v = JSON.parse(raw) as { seed?: unknown; moves?: unknown };
    return v.seed === seed && Array.isArray(v.moves) ? (v.moves as Played[]) : [];
  } catch {
    return [];
  }
}

function save(key: string, seed: string, moves: Played[]): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ seed, moves }));
  } catch {
    /* the fight is simply not resumable */
  }
}

/** Forget a ghost fight's moves (it is over, or the run was left). */
export function clearGhostLog(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* nothing to clear */
  }
}

/** A feed that says when the fight screen has started reading it (the computer starts to move then, not before). */
class LocalFeed extends MoveFeed {
  onAttach: (() => void) | null = null;
  override attach(reader: Parameters<MoveFeed['attach']>[0]): () => void {
    const stop = super.attach(reader);
    this.onAttach?.();
    return stop;
  }
}

export interface GhostDuel {
  link: PvpLink;
  /** the state of the match as the rules have it (for tests) */
  state: () => CombatState;
  /** (re)start the computer's play: a screen that mounts, unmounts and mounts again (React in development) must not leave it stopped */
  activate: () => void;
  /** how many moves the rules have accepted so far (for tests) */
  count: () => number;
  dispose: () => void;
}

/**
 * Set up the fight: `setup` has the player in seat a and the ghost in seat b. `key` names where the moves are kept.
 * `think(played)` is how long the computer pauses before a move (tests pass 0).
 */
export function createGhostDuel(
  db: CombatDb,
  setup: CombatSetup,
  info: {
    names: Record<Side, string>;
    progress: PvpLink['progress'];
    key: string;
    think?: (cardsPlayedThisTurn: number) => number;
  },
): GhostDuel {
  let state = createCombat(db, setup).state;
  const moves: Played[] = [];
  const feed = new LocalFeed();
  let timer: number | undefined;
  let started = false;
  let stopped = false;
  const think =
    info.think ?? ((played: number) => (played > 12 ? 250 : 800 + Math.floor(Math.random() * 700)));

  // moves kept from before (the page was reloaded): replayed silently, as history
  const saved = load(info.key, setup.seed);
  /** the move that ended the fight, if the page was reloaded after it: it is played live once the screen is ready, so the result shows */
  let finisher: Played | null = null;
  for (const m of saved) {
    try {
      const next = applyAction(db, state, m.action).state;
      if (next.winner) {
        finisher = m;
        break;
      }
      state = next;
    } catch {
      // the rules changed under the saved moves: start the fight again from the top
      state = createCombat(db, setup).state;
      moves.length = 0;
      finisher = null;
      break;
    }
    moves.push(m);
  }
  if (moves.length === 0 && saved.length > 0 && !finisher) clearGhostLog(info.key);
  moves.forEach((m, i) =>
    feed.push({
      kind: 'move',
      history: true,
      move: { seq: i + 1, seat: m.seat, action: m.action, hash: '', deadline: 0 },
    }),
  );

  const accept = (seat: Side, action: Action): boolean => {
    try {
      state = applyAction(db, state, action).state;
    } catch (err) {
      console.warn('[ghost] a move was refused', err);
      return false;
    }
    moves.push({ seat, action });
    save(info.key, setup.seed, moves);
    // (the move reaches the fight screen on its own beat, as one from a server would)
    const seq = moves.length;
    const hash = hashState(state);
    window.setTimeout(() => {
      if (!stopped)
        feed.push({ kind: 'move', history: false, move: { seq, seat, action, hash, deadline: 0 } });
    }, 0);
    return true;
  };

  const planBot = (): void => {
    if (stopped || state.winner || state.active !== 'b') return;
    window.clearTimeout(timer);
    const played = state.sides.b.played;
    timer = window.setTimeout(() => {
      if (stopped || state.winner || state.active !== 'b') return;
      let action: Action;
      try {
        action = chooseSmartAction(db, state);
      } catch {
        action = { type: 'endTurn' };
      }
      // (a move the rules refuse must never stall the fight: the ghost ends its turn instead)
      if (!accept('b', action) && !accept('b', { type: 'endTurn' })) return;
      planBot();
    }, think(played));
  };

  feed.onAttach = () => {
    if (started) return;
    started = true;
    if (finisher) {
      const f = finisher;
      finisher = null;
      accept(f.seat, f.action);
    }
    planBot();
  };

  const link: PvpLink = {
    seat: 'a',
    names: info.names,
    progress: info.progress,
    feed,
    send: (seq, action) => {
      if (state.winner || state.active !== 'a' || seq !== moves.length + 1) {
        window.setTimeout(
          () => feed.push({ kind: 'refused', message: 'That move could not be made.' }),
          0,
        );
        return true;
      }
      if (!accept('a', action))
        window.setTimeout(
          () => feed.push({ kind: 'refused', message: 'That move could not be made.' }),
          0,
        );
      else planBot();
      return true;
    },
    replay: moves.length,
    deadline: null,
    skew: 0,
    end: null,
  };

  return {
    link,
    state: () => state,
    count: () => moves.length,
    activate: () => {
      stopped = false;
      if (started) planBot();
    },
    dispose: () => {
      stopped = true;
      window.clearTimeout(timer);
    },
  };
}
