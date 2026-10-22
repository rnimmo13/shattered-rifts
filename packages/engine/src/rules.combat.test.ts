// Rules tests: combat (01_GAME_DESIGN §3.5) and combat keywords (§3.8).
import { describe, expect, it } from 'vitest';
import { FIXTURE_DB, scenario } from './testkit';

const t0 = () => scenario(FIXTURE_DB);

describe('§3.5 combat', () => {
  it('units deal Power to each other simultaneously; damage persists', () => {
    const t = t0().p1.board('TST-3-3').deck('TST-FILLER').p2.board('TST-5-5').deck('TST-FILLER');
    t.p1.attack('TST-3-3', 'p2:TST-5-5').resolve();
    expect(t.void(1)).toEqual(['TST-3-3']);
    expect(t.stats('p2:TST-5-5').guard).toBe(2);
    t.p1.endTurn().p2.endTurn();
    expect(t.stats('p2:TST-5-5').guard).toBe(2);
  });

  it('attacking the Riftwalker deals Power to Essence', () => {
    const t = t0().p1.board('TST-3-3');
    t.p1.attack('TST-3-3', 'face').resolve();
    expect(t.essenceOf(2)).toBe(27);
  });

  it('a unit can attack once per turn', () => {
    const t = t0().p1.board('TST-3-3');
    t.p1.attack('TST-3-3', 'face').resolve();
    expect(t.legal().some((a) => a.type === 'attack')).toBe(false);
  });

  it('Arriving units cannot attack; Blitz units can', () => {
    const t = t0().p1.hand('TST-3-3', 'TST-BLITZ');
    t.p1.play('TST-3-3').resolve().play('TST-BLITZ').resolve();
    const attackers = t
      .legal()
      .flatMap((a) => (a.type === 'attack' ? [t.state.cards[a.attacker]?.cardId] : []));
    expect(attackers).toContain('TST-BLITZ');
    expect(attackers).not.toContain('TST-3-3');
  });

  it('Guardian: enemies must attack a face-up Guardian', () => {
    const t = t0().p1.board('TST-3-3').p2.board('TST-GUARD', 'TST-2-2');
    const targets = t.legal(0).flatMap((a) => (a.type === 'attack' ? [a.target] : []));
    expect(targets).toEqual([t.id('p2:TST-GUARD')]);
  });

  it('a face-down unit is not a Guardian', () => {
    const t = t0().p1.board('TST-3-3').p2.ambush('TST-AMBUSH').board('TST-2-2');
    const targets = t.legal(0).flatMap((a) => (a.type === 'attack' ? [a.target] : []));
    expect(targets).toHaveLength(3);
  });

  it('Cannot attack: static modifier', () => {
    const t = t0().p1.board('TST-CANTATTACK');
    expect(t.legal().some((a) => a.type === 'attack')).toBe(false);
  });

  it('if the attacker leaves before resolution, the attack fizzles', () => {
    const t = t0().p1.board('TST-2-2').p2.hand('TST-BOLT');
    t.p1.attack('TST-2-2', 'face').p2.respond('TST-BOLT', ['p1:TST-2-2']).resolve();
    expect(t.essenceOf(2)).toBe(30);
    expect(t.eventTypes()).toContain('fizzled');
  });
});

describe('§3.8 combat keywords', () => {
  it('Shield prevents the next instance of damage, then pops', () => {
    const t = t0().p1.board('TST-3-3').p2.board('TST-SHIELD').hand('TST-BOLT').deck('TST-FILLER');
    t.p1.attack('TST-3-3', 'p2:TST-SHIELD').resolve();
    expect(t.stats('p2:TST-SHIELD').guard).toBe(2);
    expect(t.card('p2:TST-SHIELD').shield).toBe(false);
    expect(t.eventTypes()).toContain('shieldPopped');
    expect(t.stats('p1:TST-3-3').guard).toBe(1);
  });

  it('Pierce: excess combat damage carries over to the Riftwalker', () => {
    const t = t0().p1.board('TST-PIERCE').p2.board('TST-FILLER');
    t.p1.attack('TST-PIERCE', 'p2:TST-FILLER').resolve();
    expect(t.essenceOf(2)).toBe(27);
  });

  it('Pierce does not carry over through a Shield (DECISIONS #29)', () => {
    const t = t0().p1.board('TST-PIERCE').p2.board('TST-SHIELD');
    t.p1.attack('TST-PIERCE', 'p2:TST-SHIELD').resolve();
    expect(t.essenceOf(2)).toBe(30);
  });

  it('Lifebind: damage dealt restores that much Essence (capped at the starting value)', () => {
    const t = t0().p1.board('TST-LIFEBIND').essence(25);
    t.p1.attack('TST-LIFEBIND', 'face').resolve();
    expect(t.essenceOf(1)).toBe(27);
  });

  it('Veiled: cannot be attacked or targeted by enemies until it attacks', () => {
    const t = t0()
      .p1.board('TST-VEILED')
      .deck('TST-FILLER')
      .p2.board('TST-3-3')
      .hand('TST-BOLT')
      .deck('TST-FILLER');
    t.p1.endTurn();
    expect(t.legal(1).some((a) => a.type === 'attack' && a.target === t.id('p1:TST-VEILED'))).toBe(
      false,
    );
    t.p2.endTurn();
    t.p1.attack('TST-VEILED', 'face');
    // now it can be targeted in response
    expect(
      t.legal(1).some((a) => a.type === 'play' && a.targets[0]?.includes(t.id('p1:TST-VEILED'))),
    ).toBe(true);
  });

  it('Ward: the first enemy effect that targets it each turn is negated', () => {
    const t = t0().p1.hand('TST-SLOWBOLT', 'TST-SLOWBOLT').p2.board('TST-WARD');
    t.p1.play('TST-SLOWBOLT', { targets: ['p2:TST-WARD'] }).resolve();
    expect(t.stats('p2:TST-WARD').guard).toBe(2);
    t.p1.play('TST-SLOWBOLT', { targets: ['p2:TST-WARD'] }).resolve();
    expect(t.void(2)).toContain('TST-WARD');
  });

  it('Stun: a unit stunned on its own turn cannot attack during its next turn', () => {
    const t = t0()
      .p1.board('TST-3-3')
      .deck('TST-FILLER', 'TST-FILLER')
      .p2.set('TST-LOCK')
      .deck('TST-FILLER');
    t.p1.attack('TST-3-3', 'face').p2.respond('TST-LOCK').resolve();
    expect(t.essenceOf(2)).toBe(30); // negated
    t.p1.endTurn().p2.endTurn();
    expect(t.legal(0).some((a) => a.type === 'attack')).toBe(false);
    t.p1.endTurn().p2.endTurn();
    expect(t.legal(0).some((a) => a.type === 'attack')).toBe(true);
  });

  it('temporary Guard absorbs damage first and expiring it never kills (DECISIONS #28)', () => {
    const t = t0()
      .p1.board('TST-2-2')
      .hand('TST-TEMPGUARD')
      .deck('TST-FILLER')
      .p2.board('TST-3-3')
      .deck('TST-FILLER');
    t.p1.play('TST-TEMPGUARD', { targets: ['p1:TST-2-2'] }).resolve();
    expect(t.stats('p1:TST-2-2').guard).toBe(4);
    t.p1.attack('TST-2-2', 'p2:TST-3-3').resolve();
    expect(t.stats('p1:TST-2-2').guard).toBe(1);
    t.p1.endTurn();
    expect(t.units(1)).toContain('TST-2-2');
    expect(t.stats('p1:TST-2-2').guard).toBe(1);
  });
});
