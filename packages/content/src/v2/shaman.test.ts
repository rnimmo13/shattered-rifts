// The Shaman rebuilt to Robert's direction (docs/reworks/SHAMAN_ELEMENTS_PROPOSAL.md, DECISIONS #420, #421): he starts with a Hawk, a
// Bear and a Thunderbird; each totem helps the first spell of its element each turn; a totem acts only when a card commands it, and its
// spirit aims by itself; Trinity (a Flame, a Frost and a Storm spell in one turn) gives 1 Spirit; Spirit never goes down, adds 1
// to every command and 1 per 2 to every totem's help.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  previewCardDamage,
  viewFor,
  type CombatState,
  type Op,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, pathSizes } from './index';

/** a fight on his turn with the given hand, his three starting totems planted, and one enemy (or the ones named) at 200 HP */
function fight(hand: string[], enemies: string[] = ['squire']): CombatState {
  const deck = RIFTWALKERS.shaman.starter;
  const { state } = createCombat(db, {
    seed: 'shaman-elements',
    a: { hero: 'shaman', deck: [...deck, ...deck] },
    b: { enemies },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  s.sides.a.draw = Array.from({ length: 8 }, (_, i) => ({ id: `D${i}`, card: 'strike' }));
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
const ops = (o: Op): Op[] => [o, ...('ops' in o && Array.isArray(o.ops) ? o.ops : [])];

describe('the Shaman: elements, totems and Trinity', () => {
  it('starts with a Hawk, a Bear and a Thunderbird; his starter casts all three elements and commands a totem', () => {
    const { state } = createCombat(db, {
      seed: 'sh',
      a: { hero: 'shaman', deck: RIFTWALKERS.shaman.starter },
      b: { enemies: ['squire'] },
    });
    expect(state.sides.a.totems).toEqual(['hawk', 'bear', 'thunderbird']);
    expect(RIFTWALKERS.shaman.starter).toContain('spirit-call');
    const tags = RIFTWALKERS.shaman.starter.flatMap((id) => db.cards[id]?.tags ?? []);
    for (const e of ['flame', 'frost', 'storm']) expect(tags, e).toContain(e);
    for (const id of RIFTWALKERS.shaman.starter)
      expect(['basic', 'common'], id).toContain(db.cards[id]?.rarity);
    expect(pathSizes('shaman').every((n) => n >= 12)).toBe(true);
    // (no summons, no old totem runes)
    for (const c of Object.values(db.cards).filter((x) => x.hero === 'shaman'))
      for (const o of c.effects.flatMap(ops))
        expect(['channel', 'evoke', 'pulse', 'runeSlots', 'summon', 'raise'], c.id).not.toContain(
          o.op,
        );
  });

  it('a card commands: the spirit aims by itself (Hawk 6 at random, Bear 5 Barrier, Thunderbird 3 to all); not attacks', () => {
    let s = fight(['hawks-dive'], ['squire', 'squire']);
    hero(s).statuses.might = 5;
    s = play(s, 'hawks-dive');
    expect(foe(s, 0).hp + foe(s, 1).hp).toBe(400 - 6);
    let t = fight(['bears-guard']);
    t = play(t, 'bears-guard');
    expect(hero(t).barrier).toBe(5 + 3);
    let u = fight(['thunderbirds-cry'], ['squire', 'squire']);
    u = play(u, 'thunderbirds-cry');
    expect([foe(u, 0).hp, foe(u, 1).hp]).toEqual([200 - 3 - 3, 200 - 3 - 3]);
  });

  it('there is no free command: nothing acts unless a card says so; Spirit Call asks which, Rally commands twice', () => {
    let s = fight(['spirit-call', 'rally-the-spirits', 'great-spirits-call']);
    expect(legalActions(db, s).map((a) => a.type)).not.toContain('command');
    s = applyAction(db, s, { type: 'endTurn' }).state;
    while (s.active !== 'a' && !s.winner) s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.commanded).toBe(false);
    let t = fight(['spirit-call', 'rally-the-spirits', 'great-spirits-call']);
    t = play(t, 'spirit-call');
    expect(t.pending?.kind).toBe('commandPick');
    expect(viewFor(db, t, 'a').pending?.spirits?.map((x) => x.spirit)).toEqual([
      'hawk',
      'bear',
      'thunderbird',
    ]);
    t = applyAction(db, t, { type: 'pick', cards: ['t1'] }).state;
    expect(hero(t).barrier).toBe(2 + 5);
    t = play(t, 'rally-the-spirits');
    t = applyAction(db, t, { type: 'pick', cards: ['t0'] }).state;
    expect(foe(t).hp).toBe(200 - 12);
    t = play(t, 'great-spirits-call');
    expect(foe(t).hp).toBe(200 - 12 - 6 - 3);
  });

  it('each totem helps the first spell of its element each turn; two Hawks help twice; Spirit adds 1 per 2', () => {
    let s = fight(['ember-bolt', 'ember-bolt']);
    s = play(s, 'ember-bolt', foe(s).id);
    expect(foe(s).hp).toBe(200 - 10);
    s = play(s, 'ember-bolt', foe(s).id);
    expect(foe(s).hp).toBe(200 - 17);
    let t = fight(['ember-bolt']);
    t.sides.a.totems = ['hawk', 'hawk', 'bear'];
    hero(t).statuses.spirit = 4;
    t = play(t, 'ember-bolt', foe(t).id);
    // 7 + 2 x (3 + 2)
    expect(foe(t).hp).toBe(200 - 17);
    let u = fight(['frost-ward']);
    u = play(u, 'frost-ward');
    expect(hero(u).barrier).toBe(5 + 3);
  });

  it('Trinity: a Flame, a Frost and a Storm spell in one turn give 1 Spirit, once a turn; the Moon Owl adds Mana', () => {
    let s = fight(['ember-bolt', 'frost-ward', 'gathering-storm', 'ember-bolt']);
    s.sides.a.totems = ['hawk', 'bear', 'owl'];
    s = play(s, 'ember-bolt', foe(s).id);
    s = play(s, 'frost-ward');
    expect(hero(s).statuses.spirit ?? 0).toBe(0);
    const mana = s.sides.a.mana;
    const r = applyAction(db, s, {
      type: 'play',
      card: s.sides.a.hand.find((c) => c.card === 'gathering-storm')!.id,
    });
    s = r.state;
    expect(r.events.some((e) => e.type === 'elements' && e.trinity)).toBe(true);
    expect(hero(s).statuses.spirit).toBe(1);
    // the Owl: 1 Mana back on top of the 1 the Storm cost
    expect(s.sides.a.mana).toBe(mana - 1 + 1);
    s = play(s, 'ember-bolt', foe(s).id);
    expect(hero(s).statuses.spirit).toBe(1);
    expect(viewFor(db, s, 'a').sides.a.elementsTurn).toEqual(['flame', 'frost', 'storm']);
  });

  it('a Prism spell counts as the element he has not cast yet', () => {
    let s = fight(['ember-bolt', 'frost-ward', 'prism-spell']);
    s = play(s, 'ember-bolt', foe(s).id);
    s = play(s, 'frost-ward');
    s = play(s, 'prism-spell', foe(s).id);
    expect(s.sides.a.trinityDone).toBe(true);
    expect(hero(s).statuses.spirit).toBe(1);
  });

  it('Spirit has no cap and adds 1 to every command', () => {
    let s = fight(['spirit-walk', 'bears-guard']);
    hero(s).statuses.spirit = 12;
    s = play(s, 'spirit-walk');
    expect(hero(s).statuses.spirit).toBe(14);
    s = play(s, 'bears-guard');
    expect(hero(s).barrier).toBe(5 + 14 + 3);
  });

  it('the Elder Tree gives 2 Spirit when planted; a full row asks which to replace; rare totems are never a free choice', () => {
    let s = fight(['call-the-elder-tree', 'carve-the-spirit-pole']);
    s = play(s, 'call-the-elder-tree');
    expect(s.pending?.kind).toBe('plantAt');
    s = applyAction(db, s, { type: 'pick', cards: ['t2'] }).state;
    expect(s.sides.a.totems).toEqual(['hawk', 'bear', 'elder']);
    expect(hero(s).statuses.spirit).toBe(2);
    s = play(s, 'carve-the-spirit-pole');
    expect(s.sides.a.totems).toHaveLength(4);
    expect(s.pending?.kind).toBe('plantKind');
    expect(s.pending?.pool).toEqual(['bear', 'hawk', 'thunderbird']);
    s = applyAction(db, s, { type: 'pick', cards: ['thunderbird'] }).state;
    expect(s.sides.a.totems).toEqual(['hawk', 'bear', 'elder', 'thunderbird']);
  });

  it('totem positions stop at 5', () => {
    let s = fight(['raise-the-pole', 'raise-the-pole', 'raise-the-pole']);
    for (let k = 0; k < 3; k++) s = play(s, 'raise-the-pole');
    expect(s.sides.a.totems).toHaveLength(5);
  });

  it('Gathering Storm hits every enemy and every copy grows each time one is cast', () => {
    let s = fight(['gathering-storm', 'gathering-storm'], ['squire', 'squire']);
    s.sides.a.totems = ['hawk', 'bear', null];
    s = play(s, 'gathering-storm');
    expect([foe(s, 0).hp, foe(s, 1).hp]).toEqual([197, 197]);
    s = play(s, 'gathering-storm');
    expect([foe(s, 0).hp, foe(s, 1).hp]).toEqual([192, 192]);
  });

  it("the Moon Owl's command makes the next elemental spell free", () => {
    let s = fight(['spirit-call', 'flame-spear']);
    s.sides.a.totems = ['owl', 'bear', 'thunderbird'];
    s = play(s, 'spirit-call');
    s = applyAction(db, s, { type: 'pick', cards: ['t0'] }).state;
    const mana = s.sides.a.mana;
    s = play(s, 'flame-spear', foe(s).id);
    expect(s.sides.a.mana).toBe(mana);
    expect(hero(s).statuses.freespell ?? 0).toBe(0);
  });

  it('every element has a defence: Flame Shield gives Thorns, Frost Ward Faltering, Wind Wall Saps every enemy', () => {
    let s = fight(['flame-shield', 'wind-wall'], ['squire', 'squire']);
    s = play(s, 'flame-shield');
    expect(hero(s).statuses.thorns).toBe(3);
    s = play(s, 'wind-wall');
    expect(foe(s, 0).statuses.sapped).toBe(2);
    expect(foe(s, 1).statuses.sapped).toBe(2);
  });

  it('a command is deterministic, and the side view shows totems, elements and Trinity', () => {
    const s = fight(['hawks-dive'], ['squire', 'squire']);
    const card = s.sides.a.hand[0]!.id;
    const a = applyAction(db, s, { type: 'play', card }).state;
    expect(a).toEqual(applyAction(db, s, { type: 'play', card }).state);
    const v = viewFor(db, a, 'b').sides.a;
    expect(v.totems).toEqual(['hawk', 'bear', 'thunderbird']);
    expect(v.commanded).toBe(true);
    expect(v.elementsTurn).toEqual([]);
    expect(v.trinityDone).toBe(false);
  });

  it('Burn works as Bleed: it ticks its stacks and loses 1; Wildfire doubles it', () => {
    let s = fight(['searing-lash', 'spreading-flames']);
    s.sides.a.totems = [null, 'bear', 'thunderbird'];
    s = play(s, 'searing-lash', foe(s).id);
    expect(foe(s).statuses.burn).toBe(2);
    s = play(s, 'spreading-flames', foe(s).id);
    expect(foe(s).statuses.burn).toBe(4);
    const hp = foe(s).hp;
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(foe(s).hp).toBeLessThanOrEqual(hp - 4);
    expect(foe(s).statuses.burn).toBe(3);
  });

  it("the number on a card counts the totems' help it will get (review H1)", () => {
    const s = fight(['ember-bolt', 'ember-bolt']);
    const first = s.sides.a.hand[0]!.id;
    expect(previewCardDamage(db, s, first, foe(s).id).get(0)?.lo).toBe(10);
    const t = play(s, 'ember-bolt', foe(s).id);
    expect(previewCardDamage(db, t, t.sides.a.hand[0]!.id, foe(t).id).get(0)?.lo).toBe(7);
  });

  it('every Shaman card has text', () => {
    for (const c of Object.values(db.cards).filter((x) => x.hero === 'shaman' && !x.source))
      expect(cardText(db, c).length, c.id).toBeGreaterThan(5);
  });
});
