// The browser's side of the leaderboards: fetch a board, ask for this player's board id (so an Arena match can carry it), and report how
// far a campaign run has got. All of it is best-effort: a board that cannot be reached never gets in the way of playing.

import {
  cleanRank,
  cleanReplay,
  type GhostStanding,
  type Period,
  type PvpStanding,
  type RankBadge,
  type RankedStanding,
  type RunStanding,
  type StoredReplay,
  type Trophy,
} from '@sr/pvp';
import { getClaimed, getName, serverBase, setClaimed, setName } from './config';
import { vaultKey, whoAmI } from './vaultSync';

const httpBase = (): string => serverBase().replace(/^ws/i, 'http');

export type BoardKind = 'pvp' | 'runs' | 'ghosts';

/** A board as the server shows it: the best places, and where the person looking stands (null if they are not on it). */
export interface BoardView<T> {
  period: Period;
  /** when the period began (epoch ms) */
  from: number;
  board: T[];
  you: (T & { rank: number }) | null;
}

/** The ghost boards: how the ghosts are doing, and how people do against them. */
export interface GhostView {
  period: Period;
  from: number;
  /** how many decks are out there to be met as ghosts */
  decks: number;
  /** the ghosts by their wins in the period */
  ghosts: GhostStanding[];
  /** the people by their wins against ghosts in the period */
  players: PvpStanding[];
  you: (PvpStanding & { rank: number }) | null;
}

/** Ask for a board. A person who is known (a Vault code or a signed-in account) is also told where they stand. */
export async function viewBoard(
  kind: 'pvp',
  period: Period,
): Promise<BoardView<PvpStanding> | null>;
export async function viewBoard(
  kind: 'runs',
  period: Period,
): Promise<BoardView<RunStanding> | null>;
export async function viewBoard(kind: 'ghosts', period: Period): Promise<GhostView | null>;
export async function viewBoard(
  kind: BoardKind,
  period: Period,
): Promise<BoardView<PvpStanding> | BoardView<RunStanding> | GhostView | null>;
export async function viewBoard(
  kind: BoardKind,
  period: Period,
): Promise<BoardView<PvpStanding> | BoardView<RunStanding> | GhostView | null> {
  const d = await post('view', { kind, period });
  if (!d || typeof d['from'] !== 'number') return null;
  const you = (d['you'] ?? null) as { rank: number } | null;
  if (kind === 'ghosts') {
    if (!Array.isArray(d['ghosts']) || !Array.isArray(d['players'])) return null;
    return {
      period,
      from: d['from'],
      decks: typeof d['decks'] === 'number' ? d['decks'] : 0,
      ghosts: d['ghosts'] as GhostStanding[],
      players: d['players'] as PvpStanding[],
      you: you as GhostView['you'],
    };
  }
  if (!Array.isArray(d['board'])) return null;
  return {
    period,
    from: d['from'],
    board: d['board'] as PvpStanding[] & RunStanding[],
    you: you as (PvpStanding & RunStanding & { rank: number }) | null,
  };
}

/** The answer to a request for a username. */
export type ClaimResult =
  | { ok: true; name: string }
  | { ok: false; error: 'taken' | 'bad-name' | 'limited' | 'unreachable'; message: string };

/** Ask the server for a username: it is yours if nobody else has it. (When the server cannot be reached, nothing is decided.) */
export async function claimName(name: string): Promise<ClaimResult> {
  const unreachable: ClaimResult = {
    ok: false,
    error: 'unreachable',
    message: 'Could not reach the server to check the name. Try again in a moment.',
  };
  try {
    await whoAmI();
    const key = vaultKey();
    const res = await fetch(`${httpBase()}/pvp/board/claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(key === null ? { name } : { code: key, name }),
    });
    const d = (await res.json()) as Record<string, unknown>;
    if (d['ok'] === true && typeof d['name'] === 'string') return { ok: true, name: d['name'] };
    const error = d['error'];
    if (error === 'taken' || error === 'bad-name' || error === 'limited')
      return {
        ok: false,
        error,
        message: typeof d['message'] === 'string' ? d['message'] : 'That name cannot be used.',
      };
    return unreachable;
  } catch {
    return unreachable;
  }
}

async function post(
  what: 'id' | 'run' | 'view' | 'ghostboss' | 'trophies',
  extra: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  try {
    await whoAmI();
    const key = vaultKey();
    const res = await fetch(`${httpBase()}/pvp/board/${what}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(key === null ? extra : { code: key, ...extra }),
    });
    const data = (await res.json()) as Record<string, unknown>;
    return data['ok'] === true ? data : null;
  } catch {
    return null;
  }
}

/** This player's Arena trophies, newest first (null when they are not known to the server, or it cannot be reached). */
export async function fetchTrophies(): Promise<Trophy[] | null> {
  const d = await post('trophies', {});
  if (!d || !Array.isArray(d['trophies'])) return null;
  return (d['trophies'] as unknown[]).flatMap((t): Trophy[] => {
    if (typeof t !== 'object' || t === null) return [];
    const r = t as Record<string, unknown>;
    if (typeof r['period'] !== 'number' || typeof r['place'] !== 'number') return [];
    return [
      {
        kind: r['kind'] === 'month' ? 'month' : 'week',
        period: r['period'],
        place: r['place'],
        name: typeof r['name'] === 'string' ? r['name'] : '',
      },
    ];
  });
}

/** One deck that can be met as a ghost, as the Ghost decks page shows it (never its cards or Boons). */
export interface GhostDeckRow {
  name: string;
  hero: string;
  tier: number;
  stage: number | null;
  /** when its owner played it */
  wins: number;
  losses: number;
  /** when people fought it as a ghost */
  ghostWins: number;
  ghostLosses: number;
  lastAt: number;
}

/**
 * A ghost deck to stand in for a campaign Warden (null when there is none, or the server cannot be reached: the usual Warden is
 * fought). The campaign checks it before it believes it (checkGhostBoss).
 */
/** A ghost deck to stand in for a campaign Warden: one near `tier`, never one of `exclude` (the ghosts this run has met). */
export async function fetchGhostBoss(tier: number, exclude: readonly string[]): Promise<unknown> {
  // (in a development build a ghost can be put in by hand, to try the fight without a server: localStorage 'sr.debug.ghostboss')
  if (import.meta.env.DEV) {
    try {
      const manual = localStorage.getItem('sr.debug.ghostboss');
      if (manual) return JSON.parse(manual) as unknown;
    } catch {
      /* no manual ghost */
    }
  }
  const d = await Promise.race([
    // (the username too: a deck saved under it is the player's own, and never their Warden)
    post('ghostboss', { tier, exclude: exclude.slice(-25), name: getName() }),
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 6000)),
  ]);
  return d?.['ghost'] ?? null;
}

/** How many players are waiting in the Arena queue (null when the server cannot be reached). */
export async function queueCount(): Promise<number | null> {
  try {
    const res = await fetch(`${httpBase()}/pvp/queue/count`);
    const d = (await res.json()) as { ok?: unknown; waiting?: unknown };
    return d.ok === true && typeof d.waiting === 'number' ? d.waiting : null;
  } catch {
    return null;
  }
}

/** The decks that can be met as ghosts (null when the server cannot be reached). */
export async function viewGhostDecks(): Promise<GhostDeckRow[] | null> {
  try {
    const res = await fetch(`${httpBase()}/pvp/board/ghostdecks`);
    const d = (await res.json()) as { ok?: unknown; decks?: unknown };
    if (d.ok !== true || !Array.isArray(d.decks)) return null;
    return (d.decks as Record<string, unknown>[]).flatMap((r) =>
      typeof r['name'] === 'string' &&
      typeof r['hero'] === 'string' &&
      typeof r['tier'] === 'number'
        ? [
            {
              name: r['name'],
              hero: r['hero'],
              tier: r['tier'],
              stage: typeof r['stage'] === 'number' ? r['stage'] : null,
              wins: Number(r['wins']) || 0,
              losses: Number(r['losses']) || 0,
              ghostWins: Number(r['ghostWins']) || 0,
              ghostLosses: Number(r['ghostLosses']) || 0,
              lastAt: Number(r['lastAt']) || 0,
            },
          ]
        : [],
    );
  } catch {
    return null;
  }
}

/**
 * A device that has no username yet takes the one this player has claimed (signed in, the same player on every device: DECISIONS
 * #318). Returns the name it took, or null.
 */
export async function restoreUsername(): Promise<string | null> {
  // (the name this identity has claimed wins: one claimed on this device under another identity, a guest's say, is not this one's)
  const d = await post('id', {});
  const name = d?.['name'];
  if (typeof name !== 'string' || name === '' || (getClaimed() === name && getName() === name))
    return null;
  setName(name);
  setClaimed(name);
  return name;
}

let myId: Promise<string | null> | null = null;

/** This player's id on the boards (a hash; asked once, and asked again if it could not be had). */
export function boardId(): Promise<string | null> {
  myId ??= post('id', {}).then((d) => {
    const id = d?.['id'];
    if (typeof id === 'string') return id;
    myId = null;
    return null;
  });
  return myId;
}

/** Tell the server how far a run has got (callers need not wait). `stage` is the stages cleared in this Rift Tier, 0 to 3. */
/** Tell the board a run has ended: it fell, or was abandoned (DECISIONS #292). Best effort: the board just keeps showing it as live otherwise. */
export async function reportRunEnd(
  run: { seed: string; hero: string; tier: number; stage: number; name: string },
  how: 'fell' | 'abandoned',
): Promise<void> {
  try {
    await post('run', {
      run: run.seed.slice(0, 64),
      hero: run.hero,
      tier: run.tier,
      stage: run.stage,
      name: run.name,
      ended: how,
    });
  } catch {
    /* the board stays as it was */
  }
}

export async function reportRun(run: {
  seed: string;
  hero: string;
  tier: number;
  stage: number;
  name: string;
}): Promise<unknown> {
  const body = {
    run: run.seed.slice(0, 64),
    hero: run.hero,
    tier: run.tier,
    stage: run.stage,
    name: run.name,
  };
  // a report that did not get through (a dropped connection, a busy server) is tried again a few times: the server only moves a run
  // forward, so a repeat is harmless, and a missed report would leave the board behind until the next time the app opens
  const waits = [2_000, 10_000, 40_000];
  for (let i = 0; ; i++) {
    const answer = await post('run', body);
    if (answer && answer['limited'] !== true) return answer;
    const wait = waits[i];
    if (wait === undefined) return answer;
    await new Promise((r) => setTimeout(r, wait));
  }
}

/** This season's ranked board, and where the person looking stands (DECISIONS #240). */
export interface RankedView {
  season: number;
  board: RankedStanding[];
  you: (RankBadge & { wins: number; peak: number; place: number | null }) | null;
}

export async function viewRanks(): Promise<RankedView | null> {
  const d = await post('view', { kind: 'ranks' });
  if (!d || typeof d['season'] !== 'number' || !Array.isArray(d['board'])) return null;
  const you = d['you'] as Record<string, unknown> | null | undefined;
  const badge = cleanRank(you);
  return {
    season: d['season'],
    board: (d['board'] as Record<string, unknown>[]).flatMap((r): RankedStanding[] =>
      typeof r['name'] === 'string' &&
      typeof r['rating'] === 'number' &&
      typeof r['games'] === 'number'
        ? [
            {
              name: r['name'],
              hero: typeof r['hero'] === 'string' ? r['hero'] : '',
              rating: r['rating'],
              games: r['games'],
              wins: typeof r['wins'] === 'number' ? r['wins'] : 0,
              peak: typeof r['peak'] === 'number' ? r['peak'] : r['rating'],
            },
          ]
        : [],
    ),
    you:
      you && badge
        ? {
            ...badge,
            wins: typeof you['wins'] === 'number' ? you['wins'] : 0,
            peak: typeof you['peak'] === 'number' ? you['peak'] : badge.rating,
            place: typeof you['place'] === 'number' ? you['place'] : null,
          }
        : null,
  };
}

/** A finished Arena game, to watch again: the replay, 'gone' when the server has none by that id, or null when it cannot be reached. */
export async function fetchReplay(id: string): Promise<StoredReplay | 'gone' | null> {
  try {
    const res = await fetch(`${httpBase()}/pvp/replay/${encodeURIComponent(id)}`);
    if (res.status === 404) return 'gone';
    const d = (await res.json()) as { ok?: unknown; replay?: unknown };
    if (d.ok !== true) return null;
    return cleanReplay(d.replay) ?? 'gone';
  } catch {
    return null;
  }
}
