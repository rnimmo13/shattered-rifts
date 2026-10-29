// The Shaman rebuilt (docs/BASE_CLASS_REWORKS.md §5, DECISIONS #418): three fixed totem positions; once a turn the player commands one
// totem and its spirit acts (Hawk 4 damage to a chosen enemy, Bear 4 Barrier to a chosen friendly, Elder 1 Spirit and a card). Spirit
// (at most 3) empowers one command by 2; Rousing adds to the next. His old Defect copy (an orb queue, Focus, Owl Mana) is archived in
// reviews/balance-baselines/2026-10-29-pre-identity-reworks/.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  RulesError,
  viewFor,
  type Action,
  type Op,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, pathSizes } from './index';

function fight(hand: string[], enemies: string[] = ['squire', 'squire']): CombatState {
  const deck = RIFTWALKERS.shaman.starter;
  const { state } = createCombat(db, {
    seed: 'shaman-totems',
    a: { hero: 'shaman', deck: [...deck, ...deck] },
    b: { enemies },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.statuses = {};
    u.barrier = 0;
  }
  hero(s).statuses = {};
  hero(s).barrier = 0;
  return s;
}
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i]!;
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === inst?.id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const pick = (s: CombatState, ids: string[]): CombatState =>
  applyAction(db, s, { type: 'pick', cards: ids }).state;
const command = (s: CombatState, a: Omit<Extract<Action, { type: 'command' }>, 'type'>) =>
  applyAction(db, s, { type: 'command', ...a });
const commands = (s: CombatState) => legalActions(db, s).filter((a) => a.type === 'command');

describe('the Shaman: commanded totems', () => {
  it('starts with a Hawk in the first of three positions; his starter plants a Bear and rouses the Hawk', () => {
    const { state } = createCombat(db, {
      seed: 'sh',
      a: { hero: 'shaman', deck: RIFTWALKERS.shaman.starter },
      b: { enemies: ['squire'] },
    });
    expect(state.sides.a.totems).toEqual(['hawk', null, null]);
    expect(state.sides.a.runes).toEqual([]);
    expect(state.sides.a.commanded).toBe(false);
    expect(RIFTWALKERS.shaman.starter).toEqual([
      ...Array<string>(4).fill('strike'),
      ...Array<string>(4).fill('defend'),
      'wardkeepers-pact',
      'guided-talon',
    ]);
    expect(pathSizes('shaman').every((n) => n >= 12)).toBe(true);
    // (no card of his plants an old rune, awakens, adds slots or grows Focus)
    for (const c of Object.values(db.cards).filter((x) => x.hero === 'shaman'))
      for (const o of c.effects.flatMap((e): Op[] => [
        e,
        ...('ops' in e && Array.isArray(e.ops) ? e.ops : []),
      ]))
        expect(['channel', 'evoke', 'pulse', 'runeSlots'], c.id).not.toContain(o.op);
  });

  it('a Hawk command deals 4 to the chosen enemy, not as an attack (no Might, no Exposed); once a turn', () => {
    let s = fight([]);
    hero(s).statuses.might = 5;
    foe(s, 1).statuses.exposed = 2;
    const opts = commands(s);
    expect(opts.map((a) => a.target).sort()).toEqual([foe(s, 0).id, foe(s, 1).id].sort());
    const r = command(s, { totem: 0, target: foe(s, 1).id });
    s = r.state;
    expect(foe(s, 1).hp).toBe(196);
    expect(foe(s, 0).hp).toBe(200);
    expect(r.events.some((e) => e.type === 'command' && e.spirit === 'hawk')).toBe(true);
    expect(s.sides.a.commanded).toBe(true);
    expect(commands(s)).toEqual([]);
    expect(() => command(s, { totem: 0, target: foe(s, 0).id })).toThrow(RulesError);
  });

  it('planting three totems does not buy three commands; the next turn gives one again', () => {
    let s = fight(['wardkeepers-pact', 'gathering-dusk']);
    s = play(s, 'wardkeepers-pact');
    s = play(s, 'gathering-dusk');
    expect(s.sides.a.totems).toEqual(['hawk', 'bear', 'elder']);
    s = command(s, { totem: 2 }).state;
    expect(commands(s)).toEqual([]);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    while (s.active !== 'a' && !s.winner) s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.commanded).toBe(false);
    expect(commands(s).length).toBeGreaterThan(0);
  });

  it('a Bear command gives 4 Barrier to the chosen friendly; Shelter gives it to every friendly', () => {
    let s = fight(['wardkeepers-pact', 'shared-shelter']);
    s = play(s, 'wardkeepers-pact');
    expect(hero(s).barrier).toBe(5);
    s = command(s, { totem: 1, target: hero(s).id }).state;
    expect(hero(s).barrier).toBe(9);
    // (Shelter: with no companion it is the hero alone, still useful)
    let t = fight(['wardkeepers-pact', 'shared-shelter']);
    t = play(t, 'wardkeepers-pact');
    t = play(t, 'shared-shelter');
    const before = hero(t).barrier;
    t = command(t, { totem: 1, target: hero(t).id }).state;
    expect(hero(t).barrier).toBe(before + 4);
    expect(hero(t).statuses.shelter ?? 0).toBe(0);
  });

  it('an Elder gives 1 Spirit and draws; Spirit stops at 3; it can never be empowered', () => {
    let s = fight(['gathering-dusk', 'tune-the-lattice']);
    s.sides.a.draw = [{ id: 'D1', card: 'strike' }, ...s.sides.a.draw];
    s = play(s, 'gathering-dusk');
    s = play(s, 'tune-the-lattice');
    expect(hero(s).statuses.spirit).toBe(3);
    expect(commands(s).some((a) => a.totem === 1 && a.empower)).toBe(false);
    const hand = s.sides.a.hand.length;
    s = command(s, { totem: 1 }).state;
    expect(hero(s).statuses.spirit).toBe(3);
    expect(s.sides.a.hand.length).toBe(hand + 1);
    expect(() => command(fight([]), { totem: 0, target: 'nobody' })).toThrow(RulesError);
  });

  it('empowering spends one Spirit for +2; Rousing adds to the next Hawk or Bear command and is spent by it', () => {
    let s = fight(['guided-talon', 'tune-the-spirits']);
    s = play(s, 'tune-the-spirits');
    s = play(s, 'guided-talon', foe(s).id);
    expect(hero(s).statuses.rousing).toBe(3);
    expect(commands(s).filter((a) => a.empower).length).toBe(2);
    s = command(s, { totem: 0, target: foe(s, 1).id, empower: true }).state;
    // 4 + 3 Rousing + 2 Spirit
    expect(foe(s, 1).hp).toBe(191);
    expect(hero(s).statuses.spirit).toBe(1);
    expect(hero(s).statuses.rousing ?? 0).toBe(0);
    // (no Spirit: empowering is not offered, and is refused)
    const t = fight([]);
    expect(commands(t).some((a) => a.empower)).toBe(false);
    expect(() => command(t, { totem: 0, target: foe(t).id, empower: true })).toThrow(RulesError);
  });

  it('with all three taken, a plant asks which to replace, or keeps them all; a replacement is not a command', () => {
    let s = fight(['wardkeepers-pact', 'gathering-dusk', 'spark-lash']);
    s = play(s, 'wardkeepers-pact');
    s = play(s, 'gathering-dusk');
    s = play(s, 'spark-lash', foe(s).id);
    expect(s.pending?.kind).toBe('plantAt');
    const v = viewFor(db, s, 'a').pending!;
    expect(v.spirits?.map((x) => x.spirit)).toEqual(['hawk', 'bear', 'elder']);
    expect(v.planting).toBe('hawk');
    expect(v.min).toBe(0);
    // keep them all
    const kept = pick(s, []);
    expect(kept.sides.a.totems).toEqual(['hawk', 'bear', 'elder']);
    expect(kept.sides.a.commanded).toBe(false);
    // replace the Elder
    const swapped = pick(s, ['t2']);
    expect(swapped.sides.a.totems).toEqual(['hawk', 'bear', 'hawk']);
    expect(swapped.sides.a.commanded).toBe(false);
    // (the rest of the card waits for the choice: its Rousing comes after)
    expect(hero(swapped).statuses.rousing).toBe(2);
  });

  it('Ancestral Exchange chooses a kind and a position, and pays only when the kind changed', () => {
    let s = fight(['ancestral-exchange', 'ancestral-exchange']);
    s.sides.a.draw = [
      { id: 'D1', card: 'strike' },
      { id: 'D2', card: 'strike' },
      ...s.sides.a.draw,
    ];
    s = play(s, 'ancestral-exchange');
    expect(s.pending?.kind).toBe('plantKind');
    s = pick(s, ['bear']);
    expect(s.pending?.kind).toBe('plantAt');
    expect(s.pending?.min).toBe(1);
    s = pick(s, ['t0']);
    expect(s.sides.a.totems).toEqual(['bear', null, null]);
    expect(hero(s).statuses.spirit).toBe(1);
    // the same kind over itself: no bonus
    s = play(s, 'ancestral-exchange');
    s = pick(s, ['bear']);
    s = pick(s, ['t0']);
    expect(hero(s).statuses.spirit).toBe(1);
  });

  it('Stormcrown answers only the Hawk; Release the Spirits uproots for damage and leaves nothing to command', () => {
    let s = fight(['stormcrown', 'shatter-the-row', 'wardkeepers-pact']);
    s = play(s, 'stormcrown');
    s = command(s, { totem: 0, target: foe(s).id }).state;
    expect(foe(s, 0).hp).toBe(200 - 4 - 4);
    expect(foe(s, 1).hp).toBe(196);
    s = play(s, 'wardkeepers-pact');
    s = play(s, 'shatter-the-row');
    expect(s.sides.a.totems).toEqual([null, null, null]);
    expect(foe(s, 1).hp).toBe(196 - 12);
    expect(viewFor(db, s, 'a').sides.a.totems).toEqual([null, null, null]);
  });

  it('a command is deterministic, and the side view shows the totems and whether a command was used', () => {
    const s = fight([]);
    const a = command(s, { totem: 0, target: foe(s).id });
    const b = command(s, { totem: 0, target: foe(s).id });
    expect(a.state).toEqual(b.state);
    const v = viewFor(db, a.state, 'b').sides.a;
    expect(v.totems).toEqual(['hawk', null, null]);
    expect(v.commanded).toBe(true);
  });

  it('every Shaman card has text, and the starter needs no rare', () => {
    for (const c of Object.values(db.cards).filter((x) => x.hero === 'shaman' && !x.source))
      expect(cardText(db, c).length, c.id).toBeGreaterThan(5);
    for (const id of RIFTWALKERS.shaman.starter)
      expect(['basic', 'common'], id).toContain(db.cards[id]?.rarity);
  });
});

describe('the Shaman: each card does what it says', () => {
  it('Hawk Call, Thunderhead and Spiritstorm', () => {
    let s = fight(['spark-cast', 'thunderhead', 'spiritstorm']);
    s = play(s, 'spark-cast');
    expect(s.sides.a.totems).toEqual(['hawk', 'hawk', null]);
    expect(hero(s).statuses.rousing).toBe(4);
    expect(hero(s).barrier).toBe(4);
    s = play(s, 'thunderhead');
    expect(foe(s, 0).hp).toBe(188);
    expect(foe(s, 1).hp).toBe(188);
    expect(hero(s).statuses.rousing).toBe(8);
    hero(s).statuses.spirit = 2;
    s = play(s, 'spiritstorm');
    expect(foe(s, 0).hp).toBe(188 - 12);
    expect(hero(s).statuses.spirit ?? 0).toBe(0);
  });

  it("Elder's Wisdom draws a card for each Spirit spent", () => {
    let s = fight(['elders-wisdom']);
    s.sides.a.draw = [
      { id: 'D1', card: 'strike' },
      { id: 'D2', card: 'strike' },
      ...s.sides.a.draw,
    ];
    hero(s).statuses.spirit = 2;
    s = play(s, 'elders-wisdom');
    expect(s.sides.a.hand.map((c) => c.id)).toEqual(['D1', 'D2']);
    expect(hero(s).barrier).toBe(6);
  });

  it('Roar of the Den and Spirit Drum answer commands; Rite of Returning draws next turn', () => {
    let s = fight(['wardkeepers-pact', 'roar-of-the-den', 'spirit-drum', 'rite-of-returning']);
    s = play(s, 'wardkeepers-pact');
    s = play(s, 'roar-of-the-den');
    s = play(s, 'spirit-drum');
    s = play(s, 'rite-of-returning');
    s = command(s, { totem: 1, target: hero(s).id }).state;
    // 5 (the Pact) + 4 (the Bear) + 2 (Roar) + 2 (Drum)
    expect(hero(s).barrier).toBe(13);
    expect(foe(s, 0).hp).toBe(195);
    expect(hero(s).statuses.spirit).toBe(1);
    expect(s.sides.a.nextDraw).toBe(1);
  });

  it('Hail Rite strikes every enemy at the end of the turn while a Bear stands', () => {
    let s = fight(['wardkeepers-pact', 'permafrost']);
    s = play(s, 'wardkeepers-pact');
    s = play(s, 'permafrost');
    const r = applyAction(db, s, { type: 'endTurn' });
    expect(
      r.events.filter((e) => e.type === 'damage' && e.target === foe(s, 1).id && e.amount === 4)
        .length,
    ).toBe(1);
  });

  it('Circle of Ancestors answers a replacement of another kind, once a turn', () => {
    let s = fight(['circle-of-ancestors', 'ancestral-exchange']);
    s.sides.a.draw = [
      { id: 'D1', card: 'strike' },
      { id: 'D2', card: 'strike' },
      ...s.sides.a.draw,
    ];
    s = play(s, 'circle-of-ancestors');
    s = play(s, 'ancestral-exchange');
    s = pick(s, ['elder']);
    s = pick(s, ['t0']);
    expect(s.sides.a.totems).toEqual(['elder', null, null]);
    // 1 from the Exchange, 1 from the Circle; the Circle's 5 to every enemy
    expect(hero(s).statuses.spirit).toBe(2);
    expect(foe(s, 1).hp).toBe(195);
  });

  it('a Hawk is bound by Taunt', () => {
    const s = fight([]);
    foe(s, 1).taunt = true;
    expect(commands(s).map((a) => a.target)).toEqual([foe(s, 1).id]);
  });
});
