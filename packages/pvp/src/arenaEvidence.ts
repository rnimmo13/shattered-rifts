import type { Action, CombatEvent, CombatState, SideState } from '@sr/combat';
import type { Seat } from './protocol';

/** Stored observations, readable without rerunning a future engine against old cards. */
export interface ArenaEvidenceFrame {
  seq: number;
  turn: number;
  active: Seat;
  seat?: Seat;
  action?: Action;
  card?: string;
  events: CombatEvent[];
  pending?: CombatState['pending'];
  a: ReturnType<typeof sideEvidence>;
  b: ReturnType<typeof sideEvidence>;
}
export interface ArenaEvidence {
  schema: 1;
  frames: ArenaEvidenceFrame[];
  /** Complete accepted move count, including moves beyond the capture bound. */
  totalActions: number;
  truncated: boolean;
}
function sideEvidence(s: SideState, detailed: boolean) {
  return {
    mana: s.mana,
    maxMana: s.maxMana,
    reserves: s.reserves,
    stars: s.stars,
    nextMana: s.nextMana,
    handCount: s.hand.length,
    hand: detailed ? s.hand.map((c) => ({ ...c })) : undefined,
    drawCount: s.draw.length,
    discardCount: s.discard.length,
    consumedCount: s.exhausted.length,
    units: detailed
      ? s.units.map((u) => ({
          id: u.id,
          def: u.def,
          hp: u.hp,
          maxHp: u.maxHp,
          barrier: u.barrier,
          statuses: { ...u.statuses },
        }))
      : undefined,
    powers: detailed ? s.powers : undefined,
    attackAuras: detailed ? s.attackAuras : undefined,
    runes: detailed ? s.runes : undefined,
    totems: detailed ? s.totems : undefined,
    totemBoost: detailed ? s.totemBoost : undefined,
    enchants: detailed ? s.enchants : undefined,
    snares: detailed ? s.snares : undefined,
    discipline: detailed ? s.discipline : undefined,
  };
}
/** Opt-in on authoritative rooms only. Bounded evidence must never stop a game. */
export class ArenaEvidenceRecorder {
  readonly data: ArenaEvidence = { schema: 1, frames: [], totalActions: 0, truncated: false };
  private bytes = 0;
  record(
    state: CombatState,
    seq: number,
    events: CombatEvent[],
    move?: {
      seat: Seat;
      action: Action;
      card?: string;
    },
  ): void {
    this.data.totalActions = seq;
    if (this.data.truncated) return;
    const detailed =
      seq === 0 ||
      !!state.winner ||
      events.some((e) => e.type === 'turnStart' || e.type === 'turnEnd');
    const frame = {
      seq,
      turn: state.turn,
      active: state.active,
      ...move,
      events,
      ...(state.pending ? { pending: state.pending } : {}),
      a: sideEvidence(state.sides.a, detailed),
      b: sideEvidence(state.sides.b, detailed),
    };
    // Detach from mutable state/events before any later moves or room serialization.
    const text = JSON.stringify(frame);
    if (this.bytes + text.length > 200_000 || this.data.frames.length >= 1001) {
      this.data.truncated = true;
      return;
    }
    this.bytes += text.length;
    this.data.frames.push(JSON.parse(text) as ArenaEvidenceFrame);
  }
}
export function isArenaEvidence(raw: unknown): raw is ArenaEvidence {
  if (!raw || typeof raw !== 'object') return false;
  const e = raw as ArenaEvidence;
  return (
    e.schema === 1 &&
    typeof e.truncated === 'boolean' &&
    Number.isSafeInteger(e.totalActions) &&
    e.totalActions >= 0 &&
    Array.isArray(e.frames) &&
    e.frames.length <= 1001 &&
    JSON.stringify(e).length <= 210_000 &&
    e.frames.every(
      (f, i) =>
        f &&
        f.seq === i &&
        Number.isSafeInteger(f.turn) &&
        ['a', 'b'].includes(f.active) &&
        Array.isArray(f.events) &&
        !!f.a &&
        !!f.b &&
        (f.a.hand === undefined || Array.isArray(f.a.hand)) &&
        (f.b.hand === undefined || Array.isArray(f.b.hand)) &&
        (f.a.units === undefined || Array.isArray(f.a.units)) &&
        (f.b.units === undefined || Array.isArray(f.b.units)),
    )
  );
}
