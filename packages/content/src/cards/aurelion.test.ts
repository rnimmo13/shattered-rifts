// Scenario tests: Aurelion Commons.
import { describe, expect, it } from 'vitest';
import { scenario } from '@sr/engine/testkit';
import { CARD_DB } from '../index';

const t0 = () => scenario(CARD_DB);

describe('Aurelion', () => {
  it('AUR-01 Gilded Squire: Guardian forces attacks into it', () => {
    const t = t0().p1.board('AUR-05').p2.board('AUR-01', 'WYL-04');
    const targets = t.legal(0).flatMap((a) => (a.type === 'attack' ? [a.target] : []));
    expect(targets).toEqual([t.id('p2:AUR-01')]);
  });

  it('AUR-02 Lightbearer Acolyte: gives another friendly unit Shield', () => {
    const t = t0().p1.board('AUR-04').hand('AUR-02');
    t.p1.play('AUR-02', { targets: ['p1:AUR-04'] }).resolve();
    expect(t.card('p1:AUR-04').shield).toBe(true);
    expect(t.card('p1:AUR-02').shield).toBe(false);
  });

  it('AUR-02 with no other friendly unit: summon effect is skipped', () => {
    const t = t0().p1.hand('AUR-02');
    t.p1.play('AUR-02').resolve();
    expect(t.card('p1:AUR-02').shield).toBe(false);
  });

  it('AUR-03 Cleric of the Ninth Bell: end of turn restores 2 Guard to a damaged friendly unit', () => {
    const t = t0().p1.board('AUR-03', 'AUR-04').deck('NEU-03').p2.board('AUR-05').deck('NEU-03');
    t.p1.attack('AUR-04', 'p2:AUR-05').resolve();
    expect(t.stats('p1:AUR-04').guard).toBe(2);
    t.p1.endTurn();
    expect(t.stats('p1:AUR-04').guard).toBe(4);
  });

  it('AUR-04 Bastion Sentinel: a 2/5 Guardian', () => {
    const t = t0().p1.board('AUR-04');
    expect(t.stats('p1:AUR-04')).toMatchObject({ power: 2, guard: 5 });
    expect(t.stats('p1:AUR-04').keywords.has('guardian')).toBe(true);
  });

  it('AUR-05 Dawnlance Cavalier: Blitz attacks the turn it is summoned', () => {
    const t = t0().p1.hand('AUR-05');
    t.p1.play('AUR-05').resolve().attack('AUR-05', 'face').resolve();
    expect(t.essenceOf(2)).toBe(27);
  });

  it('AUR-10 Smite: 3 damage to a unit', () => {
    const t = t0().p1.hand('AUR-10').p2.board('AUR-04');
    t.p1.play('AUR-10', { targets: ['p2:AUR-04'] }).resolve();
    expect(t.stats('p2:AUR-04').guard).toBe(2);
  });

  it('AUR-10 Smite: 5 damage if it is attacking (Swift, cast on the enemy attack)', () => {
    const t = t0().p1.board('AUR-04').deck('NEU-03').p2.hand('AUR-10').deck('NEU-03');
    t.p1.attack('AUR-04', 'face').p2.respond('AUR-10', ['p1:AUR-04']).resolve();
    expect(t.void(1)).toContain('AUR-04');
    expect(t.essenceOf(2)).toBe(30);
  });

  it('AUR-11 Benediction: +2/+2 and Shield', () => {
    const t = t0().p1.board('AUR-05').hand('AUR-11');
    t.p1.play('AUR-11', { targets: ['p1:AUR-05'] }).resolve();
    expect(t.stats('p1:AUR-05')).toMatchObject({ power: 5, guard: 5 });
    expect(t.card('p1:AUR-05').shield).toBe(true);
  });

  it('AUR-13 Aegis of the Warden: Shield and +0/+2 on the attacked unit', () => {
    const t = t0().p1.board('WYL-16').p2.board('AUR-04').set('AUR-13');
    t.p1.attack('WYL-16', 'p2:AUR-04').p2.respond('AUR-13').resolve();
    // Shield absorbed the 5; the +0/+2 is still there this turn
    expect(t.stats('p2:AUR-04').guard).toBe(7);
    expect(t.card('p2:AUR-04').shield).toBe(false);
  });

  it('AUR-13 Aegis triggers on attacks at your units, not at your Riftwalker', () => {
    const face = t0().p1.board('AUR-05').p2.set('AUR-13');
    face.p1.attack('AUR-05', 'face');
    expect(face.legal(1).some((a) => a.type === 'activateTrap')).toBe(false);
    const unit = t0().p1.board('AUR-05').p2.board('AUR-01').set('AUR-13');
    unit.p1.attack('AUR-05', 'p2:AUR-01');
    expect(unit.legal(1).some((a) => a.type === 'activateTrap')).toBe(true);
  });
});
