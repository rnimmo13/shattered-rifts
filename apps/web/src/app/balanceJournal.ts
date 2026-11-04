import { hashState } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import { RULES_VERSION, isBalanceSample, type BalanceFighter, type BalanceSample } from '@sr/pvp';
import type { RunState } from '@sr/campaign';
import type { RunRecord } from '../run/history';
import { BUILD } from '../build';

const KEY = 'sr.balanceSamples.v1';
const SALT = 'sr.balanceSalt.v1';
export const BALANCE_KEEP = 1500;
export function balanceFighter(
  hero: string,
  ascendancy: string | undefined,
  deck: readonly string[],
): BalanceFighter {
  return {
    hero,
    ascendancy: ascendancy ?? null,
    deckSize: deck.length,
    upgraded: deck.filter((id) => id.endsWith('+')).length,
    rares: deck.filter((id) =>
      ['rare', 'legendary', 'ancestral'].includes(COMBAT_DB.cards[id]?.rarity ?? ''),
    ).length,
  };
}
export function balanceSamples(): BalanceSample[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter(isBalanceSample).slice(-BALANCE_KEEP) : [];
  } catch {
    return [];
  }
}
export function recordBalance(sample: Omit<BalanceSample, 'version' | 'rules' | 'at'>): void {
  try {
    const list = balanceSamples();
    if (list.some((s) => s.id === sample.id)) return;
    list.push({ ...sample, at: Date.now(), version: BUILD.version, rules: RULES_VERSION });
    localStorage.setItem(KEY, JSON.stringify(list.slice(-BALANCE_KEEP)));
  } catch {
    /* Reporting must never block gameplay. */
  }
}
function runId(seed: string): string {
  let salt = localStorage.getItem(SALT);
  if (!salt) {
    salt = crypto.randomUUID();
    localStorage.setItem(SALT, salt);
  }
  return hashState([salt, seed]) + hashState([seed, salt, 'balance']);
}
export function recordCampaignFight(run: RunState, won: boolean, turnIndex?: number): void {
  try {
    recordBalance({
      id: `campaign:${runId(run.seed)}:${run.stats.duelsWon}:${run.stats.duelsLost}`,
      kind: 'fight',
      mode: 'campaign',
      source: 'authored',
      player: balanceFighter(run.character, run.ascendancy, run.deck),
      tier: run.tier,
      difficulty: run.difficulty,
      outcome: won ? 'win' : 'loss',
      ...(turnIndex === undefined ? {} : { turnIndex }),
    });
  } catch {
    /* Storage unavailable. */
  }
}
export function recordBalanceRun(rec: RunRecord): void {
  try {
    recordBalance({
      id: `run:${runId(rec.id)}`,
      kind: 'runEnd',
      mode: 'campaign',
      source: 'authored',
      player: balanceFighter(rec.hero, rec.ascendancy, rec.deck),
      tier: rec.tier,
      difficulty: rec.difficulty,
      outcome: rec.end,
    });
  } catch {
    /* Storage unavailable. */
  }
}
export function recordBalanceAscendancy(run: RunState, id: string): void {
  try {
    recordBalance({
      id: `ascend:${runId(run.seed)}`,
      kind: 'ascendancy',
      mode: 'campaign',
      source: 'authored',
      player: balanceFighter(run.character, id, run.deck),
      tier: run.tier,
      difficulty: run.difficulty,
    });
  } catch {
    /* Storage unavailable. */
  }
}
export function downloadBalanceReport(): void {
  const data = JSON.stringify({ schema: 1, samples: balanceSamples() }, null, 2);
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `shattered-rifts-playtests-${BUILD.version}.json`;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
