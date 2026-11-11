import { COMBAT_DB, ascendancyOf, isDeckCard } from '@sr/content/v2';

/** A run's deck choices as sent, kept only in their known shape and only with real card ids; at most 150. */
function draftsOf(
  raw: unknown,
): { t: number; k: string; took: string | null; offered?: string[] }[] {
  if (!Array.isArray(raw)) return [];
  const card = (c: unknown): c is string =>
    typeof c === 'string' && c.length <= 120 && isDeckCard(c);
  return raw.slice(-150).flatMap((e: unknown) => {
    if (!e || typeof e !== 'object') return [];
    const d = e as Record<string, unknown>;
    if (
      !Number.isInteger(d['t']) ||
      !['reward', 'buy', 'remove', 'upgrade'].includes(String(d['k']))
    )
      return [];
    if (d['took'] !== null && !card(d['took'])) return [];
    const offered =
      Array.isArray(d['offered']) && d['offered'].length <= 6 && d['offered'].every(card)
        ? d['offered']
        : undefined;
    const took = card(d['took']) ? d['took'] : null;
    return [{ t: Number(d['t']), k: String(d['k']), took, ...(offered ? { offered } : {}) }];
  });
}

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
    // (a real deck card: never an enemy's Trap, DECISIONS #751)
    !r['deck'].every((c) => isDeckCard(c)) ||
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
    // (DECISIONS #714) the deck choices made this run: what was offered and taken, bought, removed or upgraded (known cards only)
    drafts: draftsOf(r['draftLog']),
  };
}
