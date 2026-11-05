import type { Entry, Seat, EndReason } from './protocol';
import { isArenaEvidence, type ArenaEvidence } from './arenaEvidence';

export interface ArenaDeckSnapshot {
  hero: string;
  ascendancy: string | null;
  cards: string[];
}
export const arenaDeckSnapshot = (entry: Entry): ArenaDeckSnapshot => ({
  hero: entry.hero,
  ascendancy: entry.ascendancy ?? null,
  cards: [...entry.deck].sort(),
});
export interface ArenaBalanceGame {
  evidence?: ArenaEvidence;
  schema: 1;
  id: string;
  at: number;
  rules: number;
  bot: string;
  startingHp: number;
  source: 'human' | 'ghost';
  ghostSeat: Seat | null;
  a: ArenaDeckSnapshot;
  b: ArenaDeckSnapshot;
  winner: Seat | 'draw';
  reason: EndReason;
  durationMs: number;
  actions: number;
  turns: Record<Seat, number>;
  /** Attributed opposing hero HP damage; excludes self-payments and unattributed damage/Fate. */
  heroDamage: Record<Seat, number>;
  peakHeroDamage: Record<Seat, number>;
}

export function isArenaBalanceGame(raw: unknown): raw is ArenaBalanceGame {
  if (!raw || typeof raw !== 'object') return false;
  const g = raw as ArenaBalanceGame;
  const n = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0;
  const pair = (x: Record<Seat, number> | undefined) => !!x && n(x.a) && n(x.b);
  const deck = (x: ArenaDeckSnapshot | undefined) =>
    !!x &&
    typeof x.hero === 'string' &&
    (x.ascendancy === null || typeof x.ascendancy === 'string') &&
    Array.isArray(x.cards) &&
    x.cards.length <= 250 &&
    x.cards.every((c) => typeof c === 'string' && c.length <= 120);
  return (
    g.schema === 1 &&
    typeof g.id === 'string' &&
    g.id.length <= 100 &&
    n(g.at) &&
    n(g.rules) &&
    typeof g.bot === 'string' &&
    g.bot.length <= 80 &&
    n(g.startingHp) &&
    ['human', 'ghost'].includes(g.source) &&
    [null, 'a', 'b'].includes(g.ghostSeat) &&
    (g.source === 'human' ? g.ghostSeat === null : g.ghostSeat !== null) &&
    deck(g.a) &&
    deck(g.b) &&
    ['a', 'b', 'draw'].includes(g.winner) &&
    ['win', 'resign', 'timeout', 'disconnect', 'time', 'passes'].includes(g.reason) &&
    n(g.durationMs) &&
    n(g.actions) &&
    pair(g.turns) &&
    pair(g.heroDamage) &&
    pair(g.peakHeroDamage) &&
    (g.evidence === undefined || isArenaEvidence(g.evidence))
  );
}
