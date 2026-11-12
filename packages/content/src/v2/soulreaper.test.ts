import { describe, expect, it } from 'vitest';
import {
  applyAction,
  clone,
  createCombat,
  legalActions,
  viewFor,
  type CardDef,
  type CombatState,
  type Side,
} from '@sr/combat';
import { COMBAT_DB as base } from './index';

const blank = (id: string, extra: Partial<CardDef> = {}): CardDef => ({
  id,
  name: id,
  kind: 'skill',
  cost: 0,
  target: 'none',
  effects: [],
  ...extra,
});
const db = {
  ...base,
  cards: {
    ...base.cards,
    'harvest-consume': blank('harvest-consume', { exhaust: true }),
    'harvest-fleeting': blank('harvest-fleeting', { ethereal: true }),
    'harvest-held': blank('harvest-held', { ethereal: true, retain: true }),
    'harvest-aura': blank('harvest-aura', { kind: 'power' }),
  },
  units: {
    ...base.units,
    'harvest-wall': {
      id: 'harvest-wall',
      name: 'Wall',
      maxHp: 1000,
      brain: {
        kind: 'enemy' as const,
        moves: { wait: { id: 'wait', name: 'Wait', effects: [] } },
        pattern: { kind: 'cycle' as const, order: ['wait'] },
      },
    },
  },
};
const create = (): CombatState => {
  const s = createCombat(db, {
    seed: 'harvest-of-souls',
    a: { hero: 'necromancer', ascendancy: 'necromancer:soulreaper', deck: ['harvest-consume'] },
    b: { enemies: ['harvest-wall', 'harvest-wall'] },
  }).state;
  // (the Reap alone: Grave Chill's Thrall strikes on its own since #684, and its blow or its death burst would muddle the count)
  s.sides.a.units = s.sides.a.units.filter((u) => u.kind === 'hero');
  return s;
};
const hero = (s: CombatState, side: Side = 'a') =>
  s.sides[side].units.find((u) => u.kind === 'hero')!;
const end = (s: CombatState) => applyAction(db, s, { type: 'endTurn' });
function consume(s: CombatState, card = 'harvest-consume'): CombatState {
  const sd = s.sides[s.active];
  const id = `harvest-${s.turn}-${sd.played}`;
  sd.hand = [{ id, card }];
  return applyAction(db, s, { type: 'play', card: id }).state;
}
const reaps = (r: ReturnType<typeof applyAction>, side: Side = 'a') =>
  r.events.filter((e) => e.type === 'damage' && e.source === hero(r.state, side).id);

describe('Soulreaper: Harvest of Souls', () => {
  it('grants three Barrier for a real Consume and one seven-damage Reap at end turn (#766; six before)', () => {
    const s = consume(create());
    expect(hero(s).barrier).toBe(3);
    expect(s.sides.a.discipline?.progress).toBe(1);
    const r = end(s);
    expect(reaps(r)).toEqual([expect.objectContaining({ amount: 7 })]);
  });
  it('counts Gravesouls, without changing their draw or Mana cost', () => {
    const s = create();
    s.sides.a.draw = [
      { id: 'one', card: 'harvest-consume' },
      { id: 'two', card: 'harvest-consume' },
    ];
    const after = consume(s, 'gravesoul');
    expect(after.sides.a.hand).toHaveLength(2);
    expect(after.sides.a.mana).toBe(s.sides.a.mana);
    expect(after.sides.a.discipline?.progress).toBe(1);
    expect(hero(after).barrier).toBe(3);
  });
  it('counts unplayed Fleeting before Reap and targets lowest current HP rather than HP percentage', () => {
    const s = create();
    s.sides.a.hand = [{ id: 'flee', card: 'harvest-fleeting' }];
    s.sides.b.units[0]!.hp = 20;
    s.sides.b.units[0]!.maxHp = 10000;
    s.sides.b.units[1]!.hp = 10;
    s.sides.b.units[1]!.maxHp = 10;
    const r = end(s);
    const consumeAt = r.events.findIndex((e) => e.type === 'exhaust' && e.card === 'flee');
    const reapAt = r.events.findIndex((e) => e.type === 'damage' && e.source === hero(s).id);
    expect(reapAt).toBeGreaterThan(consumeAt);
    expect(reaps(r)).toEqual([
      expect.objectContaining({ amount: 7, target: s.sides.b.units[1]!.id }),
    ]);
  });
  it('does not count played Fleeting, held Fleeting, discards, or routine Aura removal', () => {
    for (const card of ['harvest-fleeting', 'harvest-aura']) {
      const s = consume(create(), card);
      expect(s.sides.a.discipline?.progress).toBe(0);
      expect(reaps(end(s))).toHaveLength(0);
    }
    const s = create();
    s.sides.a.hand = [
      { id: 'held', card: 'harvest-held' },
      { id: 'discard', card: 'strike' },
    ];
    const r = end(s);
    expect(r.state.sides.a.discipline?.progress).toBe(0);
    expect(reaps(r)).toHaveLength(0);
  });
  it('fires once after several consumptions and requires a new consumption on later turns', () => {
    let s = create();
    for (let i = 0; i < 3; i++) s = consume(s);
    let r = end(s);
    expect(reaps(r)).toEqual([expect.objectContaining({ amount: 13 })]);
    s = r.state;
    s.sides.a.hand = [];
    r = end(s);
    expect(reaps(r)).toHaveLength(0);
    expect(r.state.sides.a.discipline?.progress).toBe(3);
    r = end(consume(r.state));
    expect(reaps(r)).toEqual([expect.objectContaining({ amount: 16 })]);
  });
  it('grows by 9 a turn at three consumptions a turn, through turn eight (#766; 6 a turn before)', () => {
    let s = create();
    for (let turn = 1; turn <= 8; turn++) {
      for (let i = 0; i < 3; i++) s = consume(s);
      const r = end(s);
      expect(reaps(r)).toEqual([expect.objectContaining({ amount: 4 + 9 * turn })]);
      expect(r.state.sides.a.discipline?.progress).toBe(3 * turn);
      s = r.state;
    }
  });
  it('is absorbed by Barrier and ignores Might, Primed, Fury, Exposed and Thorns', () => {
    const s = consume(create());
    hero(s).statuses.might = 100;
    hero(s).statuses.vigor = 100;
    hero(s).statuses.wrath = 1;
    const target = s.sides.b.units[0]!;
    target.hp = 50;
    target.barrier = 4;
    target.statuses.exposed = 2;
    target.statuses.thorns = 100;
    const hp = hero(s).hp;
    const r = end(s);
    expect(reaps(r)).toEqual([expect.objectContaining({ amount: 7, blocked: 4, lost: 3 })]);
    expect(hero(r.state).hp).toBe(hp);
  });
  it('uses first board order on tied HP and does not spill excess damage to another enemy', () => {
    const s = consume(create());
    for (const u of s.sides.b.units) {
      u.hp = 2;
      delete u.statuses.doom;
    }
    const first = s.sides.b.units[0]!.id,
      second = s.sides.b.units[1]!.id;
    const r = end(s);
    expect(reaps(r)).toEqual([expect.objectContaining({ target: first, amount: 7, lost: 2 })]);
    expect(r.state.sides.b.units.find((u) => u.id === second)?.hp).toBe(2);
  });
  it('can win before the enemy phase and resets progress in a new fight', () => {
    const s = consume(create());
    s.sides.b.units = [s.sides.b.units[0]!];
    s.sides.b.units[0]!.hp = 5;
    const r = end(s);
    expect(r.state.winner).toBe('a');
    expect(r.events.some((e) => e.type === 'turnStart' && e.side === 'b')).toBe(false);
    expect(create().sides.a.discipline?.progress).toBe(0);
  });
  it('preserves progress across JSON restoration and exposes the next Reap in the combat chip', () => {
    const s = consume(consume(create()));
    const restored = JSON.parse(JSON.stringify(s)) as CombatState;
    expect(end(s)).toEqual(end(restored));
    expect(viewFor(db, s, 'a').sides.a.disciplineLabel).toContain('Reap 10 ready');
  });
  it('works independently for both Arena seats', () => {
    let s = createCombat(db, {
      seed: 'harvest-arena',
      a: { hero: 'necromancer', ascendancy: 'necromancer:soulreaper', deck: ['harvest-consume'] },
      b: { hero: 'necromancer', ascendancy: 'necromancer:soulreaper', deck: ['harvest-consume'] },
    }).state;
    const a = end(consume(s));
    expect(reaps(a, 'a')).toHaveLength(1);
    s = consume(a.state);
    const action = legalActions(db, clone(s)).find((a) => a.type === 'endTurn')!;
    const b = applyAction(db, s, action);
    expect(reaps(b, 'b')).toHaveLength(1);
    expect(b.state.sides.a.discipline?.progress).toBe(1);
    expect(b.state.sides.b.discipline?.progress).toBe(1);
  });
});
