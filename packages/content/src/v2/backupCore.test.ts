// Backup Core brings back one companion, once (Robert, 2026-10-28: "it just keep reviving the same minion and it keeps tanking the
// damage. i literally take no damage"; 2026-10-30: "it allows an ally to die once and revive at half hp, it shouldnt keep reviving them").

import { describe, expect, it } from 'vitest';
import { applyAction, cardText, clone, createCombat, legalActions } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

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
    expect(s.sides.a.powers.some((p) => p.card === 'backup-core')).toBe(true);
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
    // it has done its work: the Aura is gone
    expect(s.sides.a.powers.some((p) => p.card === 'backup-core')).toBe(false);
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
  it('says it answers one death', () => {
    expect(cardText(db, db.cards['backup-core']!)).toMatch(/next time one of your allies dies/i);
  });
});
