// Scenario tests: Nexus-9 Commons.
import { describe, expect, it } from 'vitest';
import { scenario } from '@sr/engine/testkit';
import { CARD_DB } from '../index';

const t0 = () => scenario(CARD_DB);

describe('Nexus-9', () => {
  it('NEX-01 Patrol Drone: summons a 1/1 Drone', () => {
    const t = t0().p1.hand('NEX-01');
    t.p1.play('NEX-01').resolve();
    expect(t.units(1)).toEqual(['NEX-01', 'TOK-DRONE']);
  });

  it('NEX-02 Field Technician: Overclock 1 gives a friendly Construct +2 Power', () => {
    const t = t0().p1.board('NEX-04').hand('NEX-02').mana(3, 3);
    t.p1.play('NEX-02', { overclock: true, targets: ['p1:NEX-04'] }).resolve();
    expect(t.stats('p1:NEX-04').power).toBe(5);
    expect(t.manaOf(1).mana).toBe(0);
  });

  it('NEX-02 without Overclock: no bonus', () => {
    const t = t0().p1.board('NEX-04').hand('NEX-02').mana(3, 3);
    t.p1.play('NEX-02').resolve();
    expect(t.stats('p1:NEX-04').power).toBe(3);
  });

  it("NEX-03 Sentry Turret: Guardian, can't attack, pings a random enemy unit at end of turn", () => {
    const t = t0().p1.board('NEX-03').deck('NEU-03').p2.board('AUR-04').deck('NEU-03');
    expect(t.legal().some((a) => a.type === 'attack')).toBe(false);
    t.p1.endTurn();
    expect(t.stats('p2:AUR-04').guard).toBe(4);
  });

  it('NEX-04 Enforcer Mk.II: Assembles a friendly Construct (it leaves, does not die)', () => {
    const t = t0().p1.board('NEX-16').hand('NEX-04').deck('NEU-03');
    t.p1.play('NEX-04', { targets: ['p1:NEX-16'] }).resolve();
    expect(t.stats('p1:NEX-04')).toMatchObject({ power: 5, guard: 4 });
    expect(t.units(1)).toEqual(['NEX-04']);
    expect(t.void(1)).toContain('NEX-16');
    expect(t.handCards(1)).toEqual([]); // Salvage Bot didn't die, so no draw
  });

  it('NEX-04 Assemble absorbs keywords (Guardian from a Sentry Turret)', () => {
    const t = t0().p1.board('NEX-03').hand('NEX-04');
    t.p1.play('NEX-04', { targets: ['p1:NEX-03'] }).resolve();
    expect(t.stats('p1:NEX-04').keywords.has('guardian')).toBe(true);
    expect(t.stats('p1:NEX-04')).toMatchObject({ power: 3, guard: 7 });
  });

  it('NEX-04 may decline Assemble', () => {
    const t = t0().p1.board('NEX-16').hand('NEX-04');
    t.p1.play('NEX-04', { decline: true }).resolve();
    expect(t.units(1)).toEqual(['NEX-16', 'NEX-04']);
  });

  it('NEX-08 Overcharge: +3 Power this turn, then it takes 1 damage at end of turn', () => {
    const t = t0().p1.board('NEX-04').hand('NEX-08').deck('NEU-03').p2.deck('NEU-03');
    t.p1.play('NEX-08', { targets: ['p1:NEX-04'] }).resolve();
    expect(t.stats('p1:NEX-04').power).toBe(6);
    t.p1.endTurn();
    expect(t.stats('p1:NEX-04')).toMatchObject({ power: 3, guard: 2 });
  });

  it('NEX-08 only targets Constructs', () => {
    const t = t0().p1.board('AUR-04').hand('NEX-08');
    expect(t.legal().some((a) => a.type === 'play')).toBe(false);
  });

  it('NEX-09 Swarm Protocol: three Drones', () => {
    const t = t0().p1.hand('NEX-09');
    t.p1.play('NEX-09').resolve();
    expect(t.units(1)).toEqual(['TOK-DRONE', 'TOK-DRONE', 'TOK-DRONE']);
    expect(t.legal().some((a) => a.type === 'attack')).toBe(false);
  });

  it('NEX-09 Resonance 3: the Drones have Blitz', () => {
    const t = t0().p1.hand('NEU-07', 'NEU-07', 'NEX-09').p2.board('NEU-03');
    t.p1.play('NEU-07', { targets: ['p2:NEU-03'] }).resolve();
    t.p1.play('NEU-07', { targets: ['p2:NEU-03'] }).resolve();
    t.p1.play('NEX-09').resolve();
    expect(t.legal().filter((a) => a.type === 'attack').length).toBeGreaterThan(0);
  });

  it('NEX-11 Recompile: return a friendly unit, draw a card', () => {
    const t = t0().p1.board('NEX-04').hand('NEX-11').deck('NEU-03');
    t.p1.play('NEX-11', { targets: ['p1:NEX-04'] }).resolve();
    expect(t.handCards(1).sort()).toEqual(['NEU-03', 'NEX-04']);
  });

  it('NEX-12 Countermeasure Grid: 3 damage to an enemy unit as it is summoned', () => {
    const t = t0().p1.hand('AUR-05').p2.set('NEX-12');
    t.p1.play('AUR-05').p2.respond('NEX-12').resolve();
    expect(t.void(1)).toContain('AUR-05');
  });

  it('NEX-16 Salvage Bot: draw a card when it dies', () => {
    const t = t0().p1.hand('NEU-07').p2.board('NEX-16').deck('NEU-03');
    t.p1.play('NEU-07', { targets: ['p2:NEX-16'] }).resolve();
    expect(t.handCards(2)).toEqual(['NEU-03']);
  });
});
