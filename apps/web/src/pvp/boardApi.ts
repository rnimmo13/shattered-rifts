// The browser's side of the leaderboards: fetch a board, ask for this player's board id (so an Arena match can carry it), and report how
// far a campaign run has got. All of it is best-effort: a board that cannot be reached never gets in the way of playing.

import type { GhostStanding, Period, PvpStanding, RunStanding } from '@sr/pvp';
import { serverBase } from './config';
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

async function post(
  what: 'id' | 'run' | 'view',
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

/** Tell the server how far a run has got (fire and forget). `stage` is the stages cleared in this Rift Tier, 0 to 3. */
export function reportRun(run: {
  seed: string;
  hero: string;
  tier: number;
  stage: number;
  name: string;
}): void {
  void post('run', {
    run: run.seed.slice(0, 64),
    hero: run.hero,
    tier: run.tier,
    stage: run.stage,
    name: run.name,
  });
}
