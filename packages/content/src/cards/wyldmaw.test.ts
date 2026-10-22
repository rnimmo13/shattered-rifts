// Scenario tests: Wyldmaw Commons.
import { describe, expect, it } from 'vitest';
import { scenario } from '@sr/engine/testkit';
import { CARD_DB } from '../index';

const t0 = () => scenario(CARD_DB);

describe('Wyldmaw', () => {
  it('WYL-01 Gnashling: the devourer gets an extra +1/+1', () => {
    const t = t0().p1.board('WYL-01').hand('WYL-05');
    t.p1.play('WYL-05', { targets: ['p1:WYL-01'] }).resolve();
    expect(t.stats('p1:WYL-05')).toMatchObject({ power: 8, guard: 8 });
  });

  it('WYL-02 Rift Raptor: Evolves into Rift Ravager after destroying an enemy unit in combat', () => {
    const t = t0().p1.board('WYL-02').p2.board('AUR-01');
    t.p1.attack('WYL-02', 'p2:AUR-01').resolve();
    const c = t.card('p1:TOK-RAVAGER');
    expect(c.baseCardId).toBe('WYL-02');
    expect(t.stats('p1:TOK-RAVAGER')).toMatchObject({ power: 5, guard: 3 }); // keeps the 1 damage
    expect(t.eventTypes()).toContain('evolved');
  });

  it("WYL-02 doesn't Evolve if it dies in the same combat", () => {
    const t = t0().p1.board('WYL-02').p2.board('AUR-05');
    t.p1.attack('WYL-02', 'p2:AUR-05').resolve();
    expect(t.void(1)).toEqual(['WYL-02']);
  });

  it('WYL-02 Ravager reverts to Rift Raptor when it leaves the field', () => {
    const t = t0().p1.board('WYL-02').p2.board('AUR-01').hand('AUR-10');
    t.p1.attack('WYL-02', 'p2:AUR-01').resolve();
    t.p1.endTurn();
    t.p2.play('AUR-10', { targets: ['p1:TOK-RAVAGER'] }).resolve();
    expect(t.void(1)).toEqual(['WYL-02']);
  });

  it('WYL-03 Acid Spitter: Corrode an enemy unit (−1 Power at each of its Dawns)', () => {
    const t = t0().p1.hand('WYL-03').deck('NEU-03').p2.board('AUR-05').deck('NEU-03');
    t.p1.play('WYL-03', { targets: ['p2:AUR-05'] }).resolve();
    expect(t.card('p2:AUR-05').corrode).toBe(1);
    t.p1.endTurn();
    expect(t.stats('p2:AUR-05').power).toBe(2);
  });

  it('WYL-04 Ravenous Packhound: +1 Power per other friendly Beast', () => {
    const t = t0().p1.board('WYL-04', 'WYL-01', 'WYL-02', 'AUR-04');
    expect(t.stats('p1:WYL-04').power).toBe(4);
  });

  it('WYL-05 Maw Brute: Devour for +3/+3', () => {
    const t = t0().p1.board('AUR-01').hand('WYL-05');
    t.p1.play('WYL-05', { targets: ['p1:AUR-01'] }).resolve();
    expect(t.stats('p1:WYL-05')).toMatchObject({ power: 7, guard: 7 });
  });

  it('WYL-08 Blood Frenzy: +3 Power and Blitz this turn', () => {
    const t = t0().p1.hand('WYL-03', 'WYL-08').deck('NEU-03').p2.deck('NEU-03');
    t.p1
      .play('WYL-03')
      .resolve()
      .play('WYL-08', { targets: ['p1:WYL-03'] })
      .resolve();
    t.p1.attack('WYL-03', 'face').resolve();
    expect(t.essenceOf(2)).toBe(25);
    t.p1.endTurn();
    expect(t.stats('p1:WYL-03').power).toBe(2);
  });

  it('WYL-09 Primal Feast: destroy a friendly unit, draw 2', () => {
    const t = t0().p1.board('NEX-16').hand('WYL-09').deck('NEU-03', 'AUR-04', 'AUR-05');
    t.p1.play('WYL-09', { targets: ['p1:NEX-16'] }).resolve();
    expect(t.handCards(1)).toHaveLength(3); // 2 + Salvage Bot's death draw
  });

  it('WYL-11 Bone Pit: destroys an attacker with 3 or less Guard', () => {
    const t = t0().p1.board('AUR-05').p2.set('WYL-11');
    t.p1.attack('AUR-05', 'face').p2.respond('WYL-11').resolve();
    expect(t.void(1)).toContain('AUR-05');
    expect(t.essenceOf(2)).toBe(30);
  });

  it('WYL-11 Bone Pit: does nothing to an attacker with more than 3 Guard', () => {
    const t = t0().p1.board('AUR-04').p2.set('WYL-11');
    t.p1.attack('AUR-04', 'face').p2.respond('WYL-11').resolve();
    expect(t.units(1)).toEqual(['AUR-04']);
    expect(t.essenceOf(2)).toBe(28);
  });

  it('WYL-15 Carrion Picker: +1 Power whenever another friendly unit dies', () => {
    const t = t0().p1.board('WYL-15', 'WYL-01').p2.board('AUR-04');
    t.p1.attack('WYL-01', 'p2:AUR-04').resolve();
    expect(t.stats('p1:WYL-15').power).toBe(4);
  });

  it('WYL-16 Ironhide Charger: Guardian; the devourer gains Guardian', () => {
    const t = t0().p1.board('WYL-16').hand('WYL-05');
    t.p1.play('WYL-05', { targets: ['p1:WYL-16'] }).resolve();
    expect(t.stats('p1:WYL-05').keywords.has('guardian')).toBe(true);
  });
});
