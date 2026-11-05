import { COMBAT_DB, ascendancyOf } from '@sr/content/v2';

/** Whitelist only deck/progression facts. Never export raw saves, seeds, names or credentials. */
export function campaignDeckFacts(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const strings = (x: unknown, max: number): x is string[] =>
    Array.isArray(x) && x.length <= max && x.every((c) => typeof c === 'string' && c.length <= 120);
  if (
    r['v'] !== 2 ||
    typeof r['character'] !== 'string' ||
    !COMBAT_DB.heroes[r['character']] ||
    !strings(r['deck'], 250) ||
    !r['deck'].every((c) => !!COMBAT_DB.cards[c]) ||
    !strings(r['boons'], 100) ||
    !r['boons'].every((b) => !!COMBAT_DB.boons[b]) ||
    !Number.isInteger(r['tier']) ||
    Number(r['tier']) < 1 ||
    Number(r['tier']) > 20 ||
    !['easy', 'normal', 'hard'].includes(String(r['difficulty'])) ||
    typeof r['phase'] !== 'string' ||
    ![
      'map',
      'duel',
      'reward',
      'gift',
      'ascend',
      'shrine',
      'merchant',
      'event',
      'prelude',
      'loopCleared',
      'collapsed',
      'banked',
    ].includes(r['phase'])
  )
    return null;
  const n = (key: string) =>
    typeof r[key] === 'number' &&
    Number.isFinite(r[key]) &&
    Number(r[key]) >= 0 &&
    Number(r[key]) <= 1_000_000
      ? Number(r[key])
      : null;
  const stats = r['stats'] as Record<string, unknown> | undefined;
  const fights = (key: string) =>
    Number.isSafeInteger(stats?.[key]) && Number(stats?.[key]) >= 0 ? Number(stats?.[key]) : null;
  return {
    hero: r['character'],
    ascendancy: ascendancyOf(r['character'], r['ascendancy'])?.id ?? null,
    cards: [...r['deck']].sort(),
    boons: [...r['boons']].sort(),
    tier: Number(r['tier']),
    difficulty: String(r['difficulty']),
    phase: r['phase'],
    hp: n('hp'),
    maxHp: n('maxHp'),
    resolve: n('resolve'),
    fightsWon: fights('duelsWon'),
    fightsLost: fights('duelsLost'),
    clearedNodes: Array.isArray(r['cleared']) ? r['cleared'].length : null,
  };
}
