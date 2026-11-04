/** Client-observed playtest samples. No account identifiers, names, seeds or full decks. */
export interface BalanceFighter {
  hero: string;
  ascendancy: string | null;
  deckSize: number;
  upgraded: number;
  rares: number;
}
export interface BalanceSample {
  id: string;
  at: number;
  version: string;
  rules: number;
  kind: 'fight' | 'runEnd' | 'ascendancy';
  mode: 'campaign' | 'arena';
  source: 'human' | 'ghost' | 'authored';
  player: BalanceFighter;
  opponent?: BalanceFighter;
  seat?: 'a' | 'b';
  tier?: number;
  difficulty?: string;
  outcome?: 'win' | 'loss' | 'draw' | 'banked' | 'collapsed' | 'abandoned';
  reason?: string;
  /** Combat state's turn index, when available. Not interchangeable with rounds. */
  turnIndex?: number;
  /** Accepted End turn actions, including both seats. Available even on Arena reconnect. */
  endedTurns?: number;
}
export interface BalanceExport {
  schema: 1;
  samples: BalanceSample[];
}
const obj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
const whole = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x >= 0;
const fighter = (x: unknown): x is BalanceFighter =>
  obj(x) &&
  typeof x.hero === 'string' &&
  (x.ascendancy === null || typeof x.ascendancy === 'string') &&
  whole(x.deckSize) &&
  whole(x.upgraded) &&
  x.upgraded <= x.deckSize &&
  whole(x.rares) &&
  x.rares <= x.deckSize;
export function isBalanceSample(x: unknown): x is BalanceSample {
  return (
    obj(x) &&
    typeof x.id === 'string' &&
    x.id.length <= 200 &&
    whole(x.at) &&
    typeof x.version === 'string' &&
    whole(x.rules) &&
    fighter(x.player) &&
    (x.opponent === undefined || fighter(x.opponent)) &&
    ['fight', 'runEnd', 'ascendancy'].includes(String(x.kind)) &&
    ['campaign', 'arena'].includes(String(x.mode)) &&
    ['human', 'ghost', 'authored'].includes(String(x.source)) &&
    (x.seat === undefined || x.seat === 'a' || x.seat === 'b') &&
    (x.tier === undefined || (whole(x.tier) && x.tier >= 1 && x.tier <= 20)) &&
    (x.difficulty === undefined || typeof x.difficulty === 'string') &&
    (x.reason === undefined || typeof x.reason === 'string') &&
    (x.turnIndex === undefined || whole(x.turnIndex)) &&
    (x.endedTurns === undefined || whole(x.endedTurns)) &&
    (x.outcome === undefined ||
      (typeof x.outcome === 'string' &&
        ['win', 'loss', 'draw', 'banked', 'collapsed', 'abandoned'].includes(x.outcome)))
  );
}
export const campaignBand = (tier: number): string =>
  tier <= 3 ? 'I–III' : tier <= 10 ? 'IV–X' : tier <= 16 ? 'XI–XVI' : 'XVII–XX';

/** Stable dedup across repeat exports and two devices. Arena seats are separate observations of one game. */
export function mergeBalanceExports(files: unknown[]): BalanceSample[] {
  const out = new Map<string, BalanceSample>();
  for (const file of files) {
    if (!obj(file) || file.schema !== 1 || !Array.isArray(file.samples))
      throw new Error('Expected a schema 1 balance export');
    for (const sample of file.samples) {
      if (!isBalanceSample(sample)) throw new Error('Invalid balance sample');
      const prior = out.get(sample.id);
      if (prior && JSON.stringify(prior) !== JSON.stringify(sample)) {
        // Reconnect timestamps may differ. Gameplay/quality/results must agree.
        if (JSON.stringify({ ...prior, at: 0 }) !== JSON.stringify({ ...sample, at: 0 }))
          throw new Error(`Conflicting balance sample: ${sample.id}`);
      }
      if (!prior || sample.at < prior.at) out.set(sample.id, sample);
    }
  }
  return [...out.values()].sort((a, b) => a.id.localeCompare(b.id));
}
