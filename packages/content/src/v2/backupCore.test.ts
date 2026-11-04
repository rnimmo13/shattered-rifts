// Backup Core brings back one companion, once (Robert, 2026-10-28: "it just keep reviving the same minion and it keeps tanking the
// damage. i literally take no damage"; 2026-10-30: "it allows an ally to die once and revive at half hp, it shouldnt keep reviving them").

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  viewFor,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, maxCopiesOf } from './index';

const fight = (): CombatState =>
  createCombat(db, {
    seed: 'backup-buff',
    a: { hero: 'engineer', deck: [...RIFTWALKERS.engineer.starter] },
    b: { enemies: ['patrol-unit'] },
  }).state;
function play(s: CombatState, card: string, target?: string): CombatState {
  s = clone(s);
  s.sides.a.hand = [{ id: 'test-card', card }];
  s.sides.a.mana = 9;
  const act = legalActions(db, s).find(
    (a) =>
      a.type === 'play' && a.card === 'test-card' && (target === undefined || a.target === target),
  );
  expect(act).toBeDefined();
  return applyAction(db, s, act!).state;
}
const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;

describe('Backup Core', () => {
  it('revives the first companion to die, at half its HP, and is then spent: the next death stays a death', () => {
    const { state } = createCombat(db, {
      seed: 'backup-core',
      a: { hero: 'engineer', deck: [...RIFTWALKERS.engineer.starter] },
      b: { enemies: ['patrol-unit'] },
    });
    let s = clone(state);
    s.sides.a.hand = [{ id: 'BC', card: 'backup-core' }];
    s.sides.a.mana = 9;
    const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === 'BC');
    s = applyAction(db, s, act!).state;
    expect(s.sides.a.powers.some((p) => p.card === 'backup-core')).toBe(false);
    expect(s.sides.a.exhausted.some((c) => c.card === 'backup-core')).toBe(true);
    expect(s.sides.a.units.find((u) => u.kind === 'hero')?.statuses.backup).toBe(1);
    const hero = () => s.sides.a.units.find((u) => u.kind === 'hero')!;
    const ally = () => s.sides.a.units.find((u) => u.kind === 'ally');
    // the starting Drone stands in front with 2 HP; Burst Fire hits 3 times for 15
    ally()!.hp = 2;
    ally()!.barrier = 0;
    hero().barrier = 0;
    const foe = s.sides.b.units[0]!;
    foe.intent = { move: 'burst', target: ally()!.id };
    foe.statuses = {};
    const r = applyAction(db, s, { type: 'endTurn' });
    s = r.state;
    expect(r.events.filter((e) => e.type === 'summon')).toHaveLength(1);
    // It has done its work: the one-use buff is gone.
    expect(s.sides.a.powers.some((p) => p.card === 'backup-core')).toBe(false);
    expect(hero().statuses.backup ?? 0).toBe(0);
    // (the revived Drone took the rest of the Burst Fire and fell again: it is not brought back a second time)
    expect(ally()).toBeUndefined();
    // a new companion in a later turn is not saved either
    s.sides.a.hand = [{ id: 'DD', card: 'deploy-drone' }];
    s.sides.a.mana = 9;
    const dd = legalActions(db, s).find((x) => x.type === 'play' && x.card === 'DD');
    s = applyAction(db, s, dd!).state;
    expect(ally()).toBeDefined();
    ally()!.hp = 1;
    ally()!.barrier = 0;
    hero().barrier = 0;
    s.sides.b.units[0]!.intent = { move: 'burst', target: ally()!.id };
    const r2 = applyAction(db, s, { type: 'endTurn' });
    expect(r2.events.filter((e) => e.type === 'summon')).toHaveLength(0);
    s = r2.state;
    expect(ally()).toBeUndefined();
  });
  it('is a Consume skill with an explicit cheaper upgrade and a visible hero buff', () => {
    for (const [id, cost] of [
      ['backup-core', 2],
      ['backup-core+', 1],
    ] as const) {
      const card = db.cards[id]!;
      expect(card.kind).toBe('skill');
      expect(card.cost).toBe(cost);
      expect(card.exhaust).toBe(true);
      expect(cardText(db, card)).toBe('Gain 1 Backup Core. Consume.');
      const s = play(fight(), id);
      expect(hero(s).statuses.backup).toBe(1);
      expect(s.sides.a.powers).toHaveLength(0);
      expect(s.sides.a.exhausted.some((c) => c.card === id)).toBe(true);
      expect(
        viewFor(db, s, 'a').sides.a.units.find((u) => u.kind === 'hero')?.statuses.backup,
      ).toBe(1);
      expect(maxCopiesOf(card.rarity, card.kind)).toBe(5);
    }
  });

  it('keeps unused charges across turns without adding new ones', () => {
    let s = play(fight(), 'backup-core');
    for (let turn = 0; turn < 3; turn++) {
      s.sides.b.units[0]!.intent = { move: 'brace', target: null };
      s = applyAction(db, s, { type: 'endTurn' }).state;
      expect(hero(s).statuses.backup).toBe(1);
    }
  });

  it('two plays buy two revivals, never an automatically refreshing wall', () => {
    const s = play(play(fight(), 'backup-core'), 'backup-core+');
    expect(hero(s).statuses.backup).toBe(2);
    const ally = s.sides.a.units.find((u) => u.kind === 'ally')!;
    ally.hp = 2;
    ally.barrier = 0;
    s.sides.b.units[0]!.intent = { move: 'burst', target: ally.id };
    const result = applyAction(db, s, { type: 'endTurn' });
    expect(result.events.filter((e) => e.type === 'summon')).toHaveLength(2);
    expect(hero(result.state).statuses.backup ?? 0).toBe(0);
    expect(result.state.sides.a.units.some((u) => u.kind === 'ally')).toBe(false);
    expect(
      result.state.sides.a.exhausted.filter((c) => c.card.startsWith('backup-core')),
    ).toHaveLength(2);
  });

  it('revives a fresh machine at half base HP without its accumulated growth or Might', () => {
    let s = play(play(fight(), 'war-engine'), 'backup-core');
    const ally = s.sides.a.units.find((u) => u.kind === 'ally')!;
    ally.maxHp = 60;
    ally.hp = 1;
    ally.statuses.might = 9;
    s = play(s, 'recycle', ally.id);
    const revived = s.sides.a.units.find((u) => u.kind === 'ally')!;
    expect(revived.id).not.toBe(ally.id);
    expect(revived.def).toBe('war-engine');
    expect(revived.maxHp).toBe(22);
    expect(revived.hp).toBe(11);
    expect(revived.statuses.might ?? 0).toBe(0);
    expect(hero(s).statuses.backup ?? 0).toBe(0);
  });

  it('does not spend a charge when a companion is scrapped to make room', () => {
    const s = play(play(fight(), 'backup-core'), 'war-engine');
    expect(hero(s).statuses.backup).toBe(1);
    expect(s.sides.a.units.filter((u) => u.kind === 'ally').map((u) => u.def)).toEqual([
      'war-engine',
    ]);
  });
});
