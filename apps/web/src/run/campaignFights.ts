// Campaign fights kept on the server (DECISIONS #697): every finished Campaign fight of an online player is saved there, the newest
// ten stay, and each has a link anyone can open to watch it, or a file can be saved instead. A fight only plays back under the rules it
// was fought under (RULES_VERSION), as an Arena replay.

import { RULES_VERSION, fightStats, type FightStats } from '@sr/pvp';
import { COMBAT_DB } from '@sr/content/v2';
import { BUILD } from '../build';
import type { FightReplay } from '../fight/recap';
import { here } from '../pvp/matchHistory';
import { serverBase } from '../pvp/config';
import { localOnly } from '../playAccess';

export interface CampaignFight {
  id?: string;
  at?: number;
  rules: number;
  version: string;
  title: string;
  won: boolean;
  hero: string;
  ascendancy?: string;
  tier: number;
  replay: FightReplay;
  /** (DECISIONS #714) for the owner's balance review: which fight it was, where on the map, and what it came to */
  encounter?: string;
  node?: string;
  floor?: number;
  stats?: FightStats;
}
export type CampaignFightSummary = Omit<CampaignFight, 'replay' | 'stats'> & {
  id: string;
  at: number;
};

/** A link anyone can open to watch a kept Campaign fight. */
export const fightLink = (id: string): string => here(`#/campaign-fight/${id}`);

/** What the server keeps for a fight that has just ended. */
export function campaignFight(
  replay: FightReplay,
  run: { character: string; ascendancy?: string; tier: number },
  won: boolean,
  where?: { encounter?: string; node?: string; floor?: number },
): CampaignFight {
  return {
    ...(where?.encounter ? { encounter: where.encounter } : {}),
    ...(where?.node ? { node: where.node } : {}),
    ...(where?.floor !== undefined ? { floor: where.floor } : {}),
    rules: RULES_VERSION,
    version: BUILD.version,
    title: replay.title,
    won,
    hero: run.character,
    ...(run.ascendancy ? { ascendancy: run.ascendancy } : {}),
    tier: run.tier,
    replay,
  };
}

const httpBase = (): string => serverBase().replace(/^ws/i, 'http');

/** (one save per fight: the result screen may draw its buttons many times) */
const saving = new WeakMap<FightReplay, Promise<string | null>>();

/** Save a finished fight for this player (signed in, online): its id, or null when it could not be kept. */
export function saveCampaignFight(fight: CampaignFight): Promise<string | null> {
  // (the desktop's offline profile keeps everything on the machine: DECISIONS #579)
  if (localOnly()) return Promise.resolve(null);
  const known = saving.get(fight.replay);
  if (known) return known;
  const p = (async () => {
    try {
      const { boardPost } = await import('../pvp/boardApi');
      // (what the fight came to, worked out once by replaying it: kept with it for the owner's balance review, DECISIONS #714)
      let stats: FightStats | undefined;
      try {
        stats = fightStats(COMBAT_DB, fight.replay.setup, fight.replay.moves, fight.replay.me);
      } catch {
        stats = undefined;
      }
      const d = await boardPost('fight', { fight: stats ? { ...fight, stats } : fight });
      if (d && typeof d['id'] === 'string') return d['id'];
    } catch {
      /* not kept */
    }
    // (a save that failed may be tried again, when the popup is drawn afresh)
    saving.delete(fight.replay);
    return null;
  })();
  saving.set(fight.replay, p);
  return p;
}

/** This player's kept fights, newest first (null when not signed in, or the server cannot be reached). */
export async function recentCampaignFights(): Promise<CampaignFightSummary[] | null> {
  if (localOnly()) return null;
  const { boardPost } = await import('../pvp/boardApi');
  const d = await boardPost('fights', {});
  if (!d || !Array.isArray(d['fights'])) return null;
  return d['fights'].flatMap((f: unknown): CampaignFightSummary[] => {
    if (typeof f !== 'object' || f === null) return [];
    const r = f as Record<string, unknown>;
    if (typeof r['id'] !== 'string' || typeof r['at'] !== 'number') return [];
    return [
      {
        id: r['id'],
        at: r['at'],
        rules: typeof r['rules'] === 'number' ? r['rules'] : 0,
        version: typeof r['version'] === 'string' ? r['version'] : '',
        title: typeof r['title'] === 'string' ? r['title'] : 'A Campaign fight',
        won: r['won'] === true,
        hero: typeof r['hero'] === 'string' ? r['hero'] : '',
        ...(typeof r['ascendancy'] === 'string' ? { ascendancy: r['ascendancy'] } : {}),
        tier: typeof r['tier'] === 'number' ? r['tier'] : 0,
      },
    ];
  });
}

/** Read a fight record (from the server or a saved file): null when it is not one. */
export function readCampaignFight(raw: unknown): CampaignFight | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const replay = r['replay'] as Record<string, unknown> | undefined;
  const setup = typeof replay === 'object' && replay !== null ? replay['setup'] : null;
  // (a record from a file or a link is checked before anything of it is drawn)
  if (
    typeof r['rules'] !== 'number' ||
    typeof replay !== 'object' ||
    replay === null ||
    typeof setup !== 'object' ||
    setup === null ||
    typeof (setup as Record<string, unknown>)['seed'] !== 'string' ||
    !Array.isArray(replay['moves']) ||
    typeof r['title'] !== 'string' ||
    typeof r['tier'] !== 'number' ||
    typeof r['hero'] !== 'string' ||
    typeof r['won'] !== 'boolean' ||
    (r['version'] !== undefined && typeof r['version'] !== 'string') ||
    (r['ascendancy'] !== undefined && typeof r['ascendancy'] !== 'string')
  )
    return null;
  return raw as CampaignFight;
}

/** A kept fight, by its link's id: the fight, 'gone' when it is no longer kept, or null when the server cannot be reached. */
export async function fetchCampaignFight(id: string): Promise<CampaignFight | 'gone' | null> {
  try {
    const res = await fetch(`${httpBase()}/pvp/fight/${id}`, { signal: AbortSignal.timeout(8000) });
    if (res.status === 404) return 'gone';
    const d = (await res.json()) as { ok?: boolean; fight?: unknown };
    return d.ok ? readCampaignFight(d.fight) : null;
  } catch {
    return null;
  }
}

/** Save a fight as a file (to send by hand, or to keep). */
export function downloadCampaignFight(fight: CampaignFight): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(fight, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `shattered-rifts-fight-${fight.id ?? new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
