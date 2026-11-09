// Player balance data (Robert 2026-11-09, DECISIONS #714): what one fight came to, worked out by replaying its seed and moves with the
// engine. The client sends it with a finished Campaign fight, so it stays readable after the rules change; the owner's analysis tool
// works it out again for any fight it can replay (Arena replays included). Pure: no DOM, no I/O.
import {
  applyAction,
  createCombat,
  type Action,
  type CombatDb,
  type CombatSetup,
  type CombatState,
  type CombatEvent,
  type Side,
} from '@sr/combat';

export const FIGHT_STATS_SCHEMA = 1;

export interface FightStats {
  schema: typeof FIGHT_STATS_SCHEMA;
  /** the side the stats are for */
  me: Side;
  won: boolean | null;
  /** the side's own turns played */
  turns: number;
  /** cards in the deck the side brought */
  deckSize: number;
  /** HP the side's hero had at the start and the end, and its max */
  hp: { start: number; end: number; max: number };
  /** HP the side's own effects cost its hero (a card's "Lose N HP") */
  selfHpLost: number;
  /** HP and Barrier the other side took in all: every unit, summons included */
  dealt: number;
  /** the other side's starting HP in all (its hero, or every enemy it began with) */
  foeHp: number;
  /** what the other side took on each of this side's own turns (its turn and the other side's turn after it) */
  perTurn: number[];
  /** what each card (by id, upgraded ids apart) took off the other side when it was played, and how often it was played */
  byCard: Record<string, { plays: number; dealt: number }>;
  /** damage that came on no play of a card: companions and Auras at the end of the turn, Bleed and Traps on the other side's turn */
  unplayed: number;
  /** the side's biggest turn: which own turn, what it dealt, and the cards that did most of it */
  peak: { turn: number; dealt: number; cards: { card: string; dealt: number }[] };
  /** the replay did not play out to its end (a move the engine refused), so the numbers stop there */
  partial?: true;
}

export interface StatsMove {
  seat: Side;
  action: Action;
}

/** Which side each unit is on, as of either moment (a unit summoned or removed in between counts too). */
function sidesOf(a: CombatState, b: CombatState): Map<string, Side> {
  const m = new Map<string, Side>();
  for (const st of [a, b])
    for (const side of ['a', 'b'] as const) for (const u of st.sides[side].units) m.set(u.id, side);
  return m;
}

/** Replay a fight and say what it came to for `me`. */
export function fightStats(
  db: CombatDb,
  setup: CombatSetup,
  moves: readonly StatsMove[],
  me: Side = 'a',
): FightStats {
  const them: Side = me === 'a' ? 'b' : 'a';
  let s = createCombat(db, setup).state;
  const heroOf = (st: CombatState) => st.sides[me].units.find((u) => u.kind === 'hero');
  const start = heroOf(s);
  const foeHp = s.sides[them].units.reduce((n, u) => n + Math.max(0, u.hp), 0);
  const deckSize = s.sides[me].draw.length + s.sides[me].hand.length + s.sides[me].discard.length;
  const byCard: FightStats['byCard'] = {};
  const perTurn: number[] = [];
  const perTurnCards: Map<string, number>[] = [];
  let unplayed = 0;
  let selfHpLost = 0;
  let partial = false;
  // (the turn counter: each time play comes back to `me`, a new own turn begins)
  let turn = s.active === me ? 1 : 0;
  const credit = (dealt: number, card: string | null): void => {
    if (dealt <= 0) return;
    const t = Math.max(1, turn);
    perTurn[t - 1] = (perTurn[t - 1] ?? 0) + dealt;
    if (card) {
      const row = (byCard[card] ??= { plays: 0, dealt: 0 });
      row.dealt += dealt;
      const m = (perTurnCards[t - 1] ??= new Map());
      m.set(card, (m.get(card) ?? 0) + dealt);
    } else unplayed += dealt;
  };
  for (const mv of moves) {
    if (s.winner) break;
    const was = s;
    const card =
      mv.seat === me && mv.action.type === 'play'
        ? (s.sides[me].hand.find((c) => c.id === (mv.action as { card: string }).card)?.card ??
          null)
        : null;
    let events: readonly CombatEvent[];
    try {
      const out = applyAction(db, s, mv.action);
      s = out.state;
      events = out.events;
    } catch {
      partial = true;
      break;
    }
    if (card) (byCard[card] ??= { plays: 0, dealt: 0 }).plays++;
    // (counted from the hits themselves, HP and Barrier they took: what the other side does to itself, or a Barrier that wears off, is
    // not damage dealt)
    const side = sidesOf(was, s);
    const hero = heroOf(was)?.id;
    let dealt = 0;
    for (const e of events) {
      if (e.type !== 'damage') continue;
      const from = e.source ? side.get(e.source) : null;
      if (side.get(e.target) === them && from !== them) dealt += e.lost + e.blocked;
      // (a hit the hero gave itself: a card's or an Aura's "Lose N HP")
      if (e.target === hero && e.source === hero && e.kind === 'direct') selfHpLost += e.lost;
    }
    credit(dealt, card);
    // (a turn ending that hands play back to `me`: a Campaign fight's enemy turn lives inside End turn, an Arena opponent ends its own)
    if (mv.action.type === 'endTurn' && s.active === me && !s.winner) turn++;
  }
  const end = heroOf(s);
  let peak: FightStats['peak'] = { turn: 0, dealt: 0, cards: [] };
  perTurn.forEach((d, i) => {
    if ((d ?? 0) > peak.dealt) {
      const cards = [...(perTurnCards[i] ?? new Map<string, number>()).entries()]
        .sort((x, y) => y[1] - x[1])
        .slice(0, 5)
        .map(([c, dealt]) => ({ card: c, dealt }));
      peak = { turn: i + 1, dealt: d ?? 0, cards };
    }
  });
  return {
    schema: FIGHT_STATS_SCHEMA,
    me,
    won: s.winner === null ? null : s.winner === me,
    turns: Math.max(0, turn),
    deckSize,
    hp: { start: start?.hp ?? 0, end: end?.hp ?? 0, max: end?.maxHp ?? start?.maxHp ?? 0 },
    selfHpLost,
    dealt: perTurn.reduce((a, b) => a + (b ?? 0), 0),
    foeHp,
    perTurn: Array.from(perTurn, (d) => d ?? 0),
    byCard,
    unplayed,
    peak,
    ...(partial ? { partial: true as const } : {}),
  };
}

/** A shape check for stats a client sent: numbers where numbers belong, and nothing too big (the server keeps it as given). */
export function isFightStats(v: unknown): v is FightStats {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x < 1e7;
  if (o['schema'] !== FIGHT_STATS_SCHEMA || (o['me'] !== 'a' && o['me'] !== 'b')) return false;
  if (!num(o['turns']) || !num(o['dealt']) || !num(o['foeHp']) || !num(o['unplayed'])) return false;
  if (!Array.isArray(o['perTurn']) || o['perTurn'].length > 200 || !o['perTurn'].every(num))
    return false;
  const by = o['byCard'];
  if (typeof by !== 'object' || by === null || Object.keys(by).length > 120) return false;
  for (const [k, r] of Object.entries(by as Record<string, unknown>)) {
    if (k.length > 80 || typeof r !== 'object' || r === null) return false;
    const row = r as Record<string, unknown>;
    if (!num(row['plays']) || !num(row['dealt'])) return false;
  }
  return JSON.stringify(v).length <= 20_000;
}

/**
 * Stats a client sent, rebuilt from the known fields only (the server keeps this, never what was sent as it was), or null when they are
 * not of the right shape.
 */
export function cleanFightStats(v: unknown): FightStats | null {
  if (!isFightStats(v)) return null;
  const o = v as unknown as Record<string, unknown>;
  const num = (x: unknown): number =>
    typeof x === 'number' && Number.isFinite(x) && x >= 0 && x < 1e7 ? x : 0;
  const hp = (o['hp'] ?? {}) as Record<string, unknown>;
  const peak = (o['peak'] ?? {}) as Record<string, unknown>;
  const peakCards = Array.isArray(peak['cards']) ? peak['cards'].slice(0, 5) : [];
  return {
    schema: FIGHT_STATS_SCHEMA,
    me: v.me,
    won: typeof o['won'] === 'boolean' ? o['won'] : null,
    turns: num(o['turns']),
    deckSize: num(o['deckSize']),
    hp: { start: num(hp['start']), end: num(hp['end']), max: num(hp['max']) },
    selfHpLost: num(o['selfHpLost']),
    dealt: num(o['dealt']),
    foeHp: num(o['foeHp']),
    perTurn: v.perTurn.map(num),
    byCard: Object.fromEntries(
      Object.entries(v.byCard).map(([k, r]) => [k, { plays: num(r.plays), dealt: num(r.dealt) }]),
    ),
    unplayed: num(o['unplayed']),
    peak: {
      turn: num(peak['turn']),
      dealt: num(peak['dealt']),
      cards: peakCards.flatMap((c: unknown) => {
        const r = (c ?? {}) as Record<string, unknown>;
        return typeof r['card'] === 'string' && r['card'].length <= 80
          ? [{ card: r['card'], dealt: num(r['dealt']) }]
          : [];
      }),
    },
    ...(o['partial'] === true ? { partial: true as const } : {}),
  };
}
