// The browser's side of the leaderboards: fetch a board, ask for this player's board id (so an Arena match can carry it), and report how
// far a campaign run has got. All of it is best-effort: a board that cannot be reached never gets in the way of playing.

import type { Period, PvpStanding, RunStanding } from '@sr/pvp';
import { serverBase } from './config';
import { vaultKey, whoAmI } from './vaultSync';

const httpBase = (): string => serverBase().replace(/^ws/i, 'http');

export interface Board<T> {
  period: Period;
  /** when the period began (epoch ms) */
  from: number;
  board: T[];
}

async function get<T>(what: 'pvp' | 'runs', period: Period): Promise<Board<T> | null> {
  try {
    const res = await fetch(`${httpBase()}/pvp/board/${what}?period=${period}`);
    const data = (await res.json()) as { ok?: boolean; from?: number; board?: T[] };
    if (!data.ok || !Array.isArray(data.board) || typeof data.from !== 'number') return null;
    return { period, from: data.from, board: data.board };
  } catch {
    return null;
  }
}

export const pvpBoard = (period: Period): Promise<Board<PvpStanding> | null> => get('pvp', period);
export const runBoard = (period: Period): Promise<Board<RunStanding> | null> => get('runs', period);

async function post(
  what: 'id' | 'run',
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
