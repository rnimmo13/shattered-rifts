import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  createCombat,
  legalActions,
  previewCardDamage,
  viewFor,
  type CombatDb,
  type CombatState,
} from '@sr/combat';
import { attackAuraBonus } from '../../../combat/src/attackAuras';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState) => s.sides.b.units[0]!;
const allies = (s: CombatState) => s.sides.a.units.filter((u) => u.kind === 'ally' && u.hp > 0);
let serial = 0;
function fight(ascendancy?: string, id = 'engineer'): CombatState {
  const s = createCombat(db, {
    seed: 'engineer-support',
    a: { hero: id, deck: [...RIFTWALKERS.engineer.starter], ...(ascendancy ? { ascendancy } : {}) },
    b: { enemies: ['squire'] },
  }).state;
  s.sides.a.mana = 100;
  s.sides.a.draw = Array.from({ length: 50 }, () => ({ id: `draw-${serial++}`, card: 'strike' }));
  foe(s).hp = foe(s).maxHp = 100000;
  foe(s).barrier = 0;
  foe(s).statuses = {};
  return s;
}
function play(s: CombatState, card: string, target?: string, database: CombatDb = db): CombatState {
  const id = `play-${serial++}`;
  s.sides.a.hand = [{ id, card }];
  const action = legalActions(database, s).find(
    (a) => a.type === 'play' && a.card === id && (!target || a.target === target),
  );
  expect(action, card).toBeDefined();
  let next = applyAction(database, s, action!).state;
  for (let i = 0; next.pending && i < 10; i++) {
    const p = next.pending;
    next = applyAction(database, next, {
      type: 'pick',
      cards: p.pool.slice(0, Math.max(1, p.min)),
    }).state;
  }
  expect(next.pending).toBeNull();
  return next;
}
function end(s: CombatState): CombatState {
  foe(s).intent = { move: 'guard', target: null };
  const next = applyAction(db, s, { type: 'endTurn' }).state;
  next.sides.a.mana = 100;
  foe(next).barrier = 0;
  return next;
}

describe('Engineer support and continuous attack Auras', () => {
  it('Heavy Hitter retains its flat fallback with no living companion', () => {
    for (const suffix of ['', '+']) {
      let s = fight();
      for (const unit of allies(s)) unit.hp = 0;
      const before = foe(s).hp;
      s = play(s, `heavy-hitter${suffix}`);
      expect(before - foe(s).hp).toBe(suffix ? 15 : 12);
    }
  });
  it.each([22, 23, 160, 161, 320])(
    'Heavy Hitter scales from %i max HP with matching previews and upgrades',
    (hp) => {
      for (const suffix of ['', '+']) {
        let s = play(fight('engineer:golemancer'), 'war-engine');
        const machine = allies(s).find((u) => u.def === 'war-engine')!;
        machine.maxHp = hp;
        machine.hp = 1; // wounded machines still use max HP, without the companion-only multiplier
        const card = `heavy-hitter${suffix}`;
        const expected = (suffix ? 15 : 12) + Math.floor(hp / 2);
        s.sides.a.hand = [{ id: 'preview-hitter', card }];
        expect(previewCardDamage(db, s, 'preview-hitter', foe(s).id).get(0)?.lo).toBe(expected);
        const before = foe(s).hp;
        s = play(s, card, foe(s).id);
        expect(before - foe(s).hp).toBe(expected);
      }
    },
  );
  it('Pulse copies each grow companions on four Skills, preserve upgrade behavior, and reset after restoration', () => {
    let s = play(play(fight('engineer:golemancer'), 'resonant-pulse'), 'resonant-pulse+');
    const id = allies(s)[0]!.id;
    const unit = () => allies(s).find((u) => u.id === id)!;
    const initial = unit().maxHp;
    for (let i = 1; i <= 5; i++) {
      s = play(s, 'defend');
      expect(unit().maxHp).toBe(initial + 2 * Math.min(4, i));
    }
    s = JSON.parse(JSON.stringify(s)) as CombatState;
    s = play(s, 'defend');
    expect(unit().maxHp).toBe(initial + 8);
    s = end(s);
    const afterStart = unit().maxHp;
    s = play(s, 'defend');
    expect(unit().maxHp).toBe(afterStart + 2);
    expect(db.cards['resonant-pulse+']?.innate).toBe(true);
    expect(cardText(db, db.cards['resonant-pulse']!)).toContain('first 4 activations on your turn');
    for (const suffix of ['', '+'])
      expect(db.cards[`resonant-pulse${suffix}`]?.effects[0]).toMatchObject({
        ownTurn: true,
        perTurnLimit: 4,
        filter: 'skill',
      });
  });
  it.each([100, 160, 320])(
    'preserves unlimited machine HP and the capped damage bonus at %i HP',
    (hp) => {
      let s = play(fight('engineer:golemancer'), 'war-engine');
      const machine = allies(s).find((u) => u.def === 'war-engine')!;
      machine.hp = machine.maxHp = hp;
      machine.statuses = {};
      const before = foe(s).hp;
      s = play(s, 'assemble');
      expect(before - foe(s).hp).toBe(24);
      expect(allies(s).find((u) => u.id === machine.id)?.maxHp).toBe(hp);
    },
  );
  it('starts with a stronger Drone and a real weapon without increasing deck size', () => {
    expect(RIFTWALKERS.engineer.hero.startUnits).toEqual([{ unit: 'drone', hp: 8 }]);
    expect(RIFTWALKERS.engineer.starter).toHaveLength(10);
    expect(RIFTWALKERS.engineer.starter.filter((c) => c === 'strike')).toHaveLength(3);
    expect(RIFTWALKERS.engineer.starter).toContain('pulse-pistol');
    expect(db.units.drone?.brain).toMatchObject({ act: [{ op: 'damage', amount: 4 }] });
    expect(db.units['micro-drone']?.brain).toMatchObject({ act: [{ op: 'damage', amount: 3 }] });
  });
  it('Reactor is a fixed bonus on every hit, matches weapon previews, and never creates Might', () => {
    let s = play(fight(), 'reactor');
    const id = 'preview';
    s.sides.a.hand = [{ id, card: 'pulse-pistol' }];
    expect(previewCardDamage(db, s, id, foe(s).id).get(0)?.lo).toBe(8);
    const before = foe(s).hp;
    s = play(s, 'pulse-pistol', foe(s).id);
    expect(before - foe(s).hp).toBe(16);
    expect(hero(s).statuses.might ?? 0).toBe(0);
    s = end(end(s));
    expect(attackAuraBonus(s.sides.a, hero(s), true)).toBe(3);
    expect(s.sides.a.attackAuras).toHaveLength(1);
  });
  it('benefits summons made later, displays their real damage and remains visible as an Aura', () => {
    let s = play(play(fight(), 'reactor'), 'deploy-drone');
    const unit = allies(s).find((u) => u.def === 'patrol-drone')!;
    const shown = viewFor(db, s, 'a').sides.a;
    expect(shown.powers.some((p) => p.card === 'reactor' && p.when === 'passive')).toBe(true);
    expect(shown.units.find((u) => u.id === unit.id)?.intentView?.damage).toBe(6);
    expect(unit.statuses.might ?? 0).toBe(0);
    const before = foe(s).hp;
    s = end(s);
    expect(before - foe(s).hp).toBe(13); // starting Drone 4+3; Patrol Drone 3+3
  });
  it('stacks copies/upgrades once and never transfers the Aura bonus through Salvage', () => {
    let s = play(play(play(fight(), 'reactor'), 'reactor+'), 'deploy-drone');
    s = play(s, 'deploy-drone');
    s = play(s, 'war-engine');
    const machine = allies(s).find((u) => u.def === 'war-engine')!;
    expect(machine.statuses.might ?? 0).toBe(0);
    expect(attackAuraBonus(s.sides.a, machine, true)).toBe(7);
    const before = foe(s).hp;
    s = play(s, 'assemble');
    expect(before - foe(s).hp).toBe(33); // three hits of 4+7
  });
  it('never increases Skill, Trap, or Aura damage', () => {
    let s = play(fight(), 'reactor');
    expect(attackAuraBonus(s.sides.a, hero(s), false)).toBe(0);
    const before = foe(s).hp;
    s = play(s, 'detonate', allies(s)[0]!.id);
    expect(before - foe(s).hp).toBe(12);
  });
  it('uses the same per-hit Aura bonus in Golemancer intents and commanded multi-hit damage', () => {
    let s = play(play(fight('engineer:golemancer'), 'reactor'), 'war-engine');
    const machine = allies(s).find((u) => u.def === 'war-engine')!;
    machine.maxHp = machine.hp = 100;
    machine.statuses = { might: 2 };
    expect(
      viewFor(db, s, 'a').sides.a.units.find((u) => u.id === machine.id)?.intentView?.damage,
    ).toBe(18);
    const before = foe(s).hp;
    s = play(s, 'assemble');
    expect(before - foe(s).hp).toBe(54);
  });
  it('Fabrication grows only from successful non-starting summons and survives rebuilding and save restoration', () => {
    let s = fight('engineer:swarmwright');
    expect(s.sides.a.summonedFight ?? 0).toBe(0);
    expect(attackAuraBonus(s.sides.a, allies(s)[0]!, true)).toBe(0);
    for (let i = 0; i < 8; i++) s = play(s, 'deploy-drone');
    expect(s.sides.a.summonedFight).toBe(8);
    expect(attackAuraBonus(s.sides.a, allies(s)[0]!, true)).toBe(2);
    expect(attackAuraBonus(s.sides.a, hero(s), true)).toBe(0);
    expect(viewFor(db, s, 'a').sides.a.disciplineLabel).toContain('Fabrication +2');
    const testDb: CombatDb = {
      ...db,
      cards: {
        ...db.cards,
        'no-new': {
          ...db.cards['deploy-drone']!,
          id: 'no-new',
          effects: [{ op: 'summon', unit: 'patrol-drone', ifAbsent: true }],
        },
      },
    };
    s = play(s, 'no-new', undefined, testDb);
    expect(s.sides.a.summonedFight).toBe(8);
    s = play(s, 'detonate', allies(s)[0]!.id);
    s = play(s, 'deploy-drone');
    s = JSON.parse(JSON.stringify(s)) as CombatState;
    expect(s.sides.a.summonedFight).toBe(9);
    expect(attackAuraBonus(s.sides.a, allies(s).at(-1)!, true)).toBe(3);
    expect(fight('engineer:swarmwright').sides.a.attackAuras?.[0]?.amount).toBe(0);
    expect(attackAuraBonus(fight('engineer:swarmwright').sides.a, allies(s)[0]!, true)).toBe(0);
  });
  it('Fabrication combines with Reactor while retaining the fourth slot and 1 Primed', () => {
    let s = fight('engineer:swarmwright');
    for (let i = 0; i < 4; i++) s = play(s, 'deploy-drone');
    s = play(s, 'reactor');
    expect(allies(s)).toHaveLength(4);
    expect(attackAuraBonus(s.sides.a, allies(s)[0]!, true)).toBe(4);
    s = end(s);
    for (const unit of allies(s)) expect(unit.statuses.vigor).toBe(1);
  });
  it('Kron’s Assembly Arm supports future units, while its card draw is clearly on play', () => {
    const s = play(play(fight(), 'assembly-arm'), 'deploy-drone');
    expect(attackAuraBonus(s.sides.a, allies(s).at(-1)!, true)).toBe(1);
    const text = cardText(db, db.cards['assembly-arm']!);
    expect(text).toContain('Companions summoned later also benefit.');
    expect(text).toContain('On play: Draw');
    expect(cardText(db, db.cards['steel-resolve']!)).toContain('On play:');
  });
  it('Ossify already supports future units; its companion intent now reflects that bonus too', () => {
    const s = play(play(fight(undefined, 'necromancer'), 'calcify'), 'deploy-drone');
    const unit = allies(s).find((u) => u.def === 'patrol-drone')!;
    expect(
      viewFor(db, s, 'a').sides.a.units.find((u) => u.id === unit.id)?.intentView?.damage,
    ).toBe(7);
  });
});
