// Invariant checks for property tests (07_TECH_ARCHITECTURE §5): card conservation, zone bookkeeping,
// slot limits, finite numbers. Throws a descriptive Error on the first violation.

import type { CardDb, GameEvent, GameState, InstanceId, PlayerId } from '../types';

function fail(msg: string): never {
  throw new Error(`invariant violated: ${msg}`);
}

/** Every card is in exactly one container, and its `zone` field agrees with that container. */
export function checkZones(s: GameState): void {
  const where = new Map<InstanceId, string>();
  const put = (id: InstanceId | null, zone: string, owner: PlayerId) => {
    if (!id) return;
    if (where.has(id)) fail(`${id} is in both ${where.get(id)} and ${zone}`);
    where.set(id, zone);
    const c = s.cards[id];
    if (!c) fail(`${zone} of p${owner} references missing card ${id}`);
    if (c.zone !== zone) fail(`${id} sits in ${zone} but says ${c.zone}`);
  };
  for (const p of [0, 1] as const) {
    const ps = s.players[p];
    ps.deck.forEach((id) => put(id, 'deck', p));
    ps.hand.forEach((id) => put(id, 'hand', p));
    ps.units.forEach((id) => put(id, 'units', p));
    ps.backrow.forEach((id) => put(id, 'backrow', p));
    put(ps.rift, 'rift', p);
    ps.void.forEach((id) => put(id, 'void', p));
    ps.beyond.forEach((id) => put(id, 'beyond', p));
    put(ps.sigil, 'sigil', p);
  }
  // a spell/trap is staged in the 'chain' zone while its link is on the chain, and while its
  // resolution is paused on a prompt (its link has been popped; an afterResolve task still holds it)
  const staged = [...s.chain, ...s.tasks.flatMap((t) => (t.t === 'afterResolve' ? [t.link] : []))];
  for (const l of staged) {
    const c = s.cards[l.sourceId];
    if (c && c.zone === 'chain') {
      if (where.has(c.id)) fail(`${c.id} is on the chain and in ${where.get(c.id)}`);
      where.set(c.id, 'chain');
    }
  }
  for (const c of Object.values(s.cards)) {
    if (!where.has(c.id)) fail(`${c.id} (${c.cardId}, zone ${c.zone}) is in no container`);
  }
}

export class InvariantChecker {
  private readonly owned: [number, number];

  /** `initial` = the real (non-token) cards each player owns at the start, incl. second-player cards. */
  constructor(
    private readonly db: CardDb,
    initial: [number, number],
  ) {
    this.owned = [...initial];
  }

  step(s: GameState, events: readonly GameEvent[] = []): void {
    // effects like Archmagister Velle add real cards to a hand
    for (const e of events) if (e.type === 'cardAdded') this.owned[e.player] += 1;
    for (const p of [0, 1] as const) {
      const ps = s.players[p];
      if (ps.units.filter(Boolean).length > s.rules.unitSlots) fail(`p${p} has too many units`);
      if (ps.backrow.filter(Boolean).length > ps.backrow.length) fail('backrow overflow');
      if (ps.backrow.length < s.rules.backrowSlots || ps.backrow.length > 5) {
        fail(`p${p} backrow has ${ps.backrow.length} slots`);
      }
      if (ps.hand.length > s.rules.handLimit) fail(`p${p} hand over the limit`);
      for (const [k, n] of Object.entries({
        essence: ps.essence,
        aether: ps.aether,
        tempAether: ps.tempAether,
        maxAether: ps.maxAether,
        resonance: ps.resonance,
        fatigue: ps.fatigue,
      })) {
        if (!Number.isFinite(n)) fail(`p${p}.${k} is ${n}`);
      }
      if (ps.aether < 0 || ps.tempAether < 0) fail(`p${p} has negative Aether`);
      if (ps.maxAether > s.rules.maxAether) fail(`p${p} max Aether over the cap`);
      const real = Object.values(s.cards).filter(
        (c) => c.owner === p && c.zone !== 'sigil' && this.db[c.baseCardId]?.type !== 'token',
      );
      if (real.length !== this.owned[p]) {
        fail(`p${p} owns ${real.length} real cards, expected ${this.owned[p]}`);
      }
    }
    for (const c of Object.values(s.cards)) {
      for (const n of [c.damage, c.tempGuard, c.corrode, c.charges]) {
        if (!Number.isFinite(n)) fail(`${c.id} has a non-finite number`);
      }
    }
    checkZones(s);
  }
}
