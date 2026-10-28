// Backup Core brings back only the first companion to die each turn (Robert, 2026-10-28: "it just keep reviving the same minion and
// it keeps tanking the damage. i literally take no damage").

import { describe, expect, it } from 'vitest';
import { applyAction, cardText, clone, createCombat, legalActions } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

describe('Backup Core', () => {
  it('revives one companion a turn: a three-hit move gets through to the hero', () => {
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
    const hero = () => s.sides.a.units.find((u) => u.kind === 'hero')!;
    const drone = s.sides.a.units.find((u) => u.kind === 'ally')!;
    // the starting Drone stands in front with 2 HP; Burst Fire hits 3 times for 15
    drone.hp = 2;
    drone.barrier = 0;
    hero().barrier = 0;
    const foe = s.sides.b.units[0]!;
    foe.intent = { move: 'burst', target: drone.id };
    foe.statuses = {};
    const before = hero().hp;
    const r = applyAction(db, s, { type: 'endTurn' });
    s = r.state;
    const revived = r.events.filter((e) => e.type === 'summon').length;
    expect(revived).toBe(1);
    expect(before - hero().hp).toBeGreaterThan(0);
  });

  it('says it answers only the first death each turn', () => {
    expect(cardText(db, db.cards['backup-core']!)).toMatch(/first time each turn|once each turn/i);
  });
});
