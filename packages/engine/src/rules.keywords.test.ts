// Rules tests: Ambush, relics, rifts, statics, Echo, Ascend, Devour, Overclock, Scry, zones.
import { describe, expect, it } from 'vitest';
import { FIXTURE_DB, scenario } from './testkit';
import { viewFor, eventsFor, HIDDEN } from './view';

describe('Ambush (§3.5.5, §3.8, DECISIONS #17 #26)', () => {
  it('set face-down for 1 Mana; hidden from the opponent', () => {
    const t = scenario(FIXTURE_DB).p1.hand('TST-AMBUSH');
    t.p1.setAmbush('TST-AMBUSH');
    expect(t.manaOf(1).mana).toBe(9);
    const id = t.id('p1:TST-AMBUSH');
    expect(viewFor(t.state, 1).cards[id]?.cardId).toBe(HIDDEN);
    expect(viewFor(t.state, 0).cards[id]?.cardId).toBe('TST-AMBUSH');
    const ev = eventsFor(t.lastEvents, 1).find((e) => e.type === 'ambushSet');
    expect(ev && 'cardId' in ev ? ev.cardId : null).toBe(HIDDEN);
  });

  it('voluntary flip: a later turn, costs printed cost − 1, Flip effect becomes a link', () => {
    const t = scenario(FIXTURE_DB)
      .p1.hand('TST-AMBUSH')
      .deck('TST-FILLER')
      .mana(5, 5)
      .p2.board('TST-3-3')
      .deck('TST-FILLER');
    t.p1.setAmbush('TST-AMBUSH');
    expect(t.legal().some((a) => a.type === 'flip')).toBe(false); // not the turn it was set
    t.p1.endTurn().p2.endTurn();
    t.p1.flip('TST-AMBUSH', ['p2:TST-3-3']);
    expect(t.manaOf(1).mana).toBe(4); // 6 max − (3 − 1)
    expect(t.state.chain.map((l) => l.kind)).toEqual(['flip']);
    t.resolve();
    expect(t.stats('p2:TST-3-3').guard).toBe(1);
  });

  it('attacked: flips for free, its Flip link goes above the attack, then combat uses real stats', () => {
    const t = scenario(FIXTURE_DB).p1.board('TST-3-3', 'TST-2-2').p2.ambush('TST-AMBUSH');
    t.p1.attack('TST-2-2', 'p2:TST-AMBUSH');
    // defender chooses the Flip target (two enemy units)
    expect(t.state.pending?.kind).toBe('chooseTargets');
    t.p2.choose('p1:TST-2-2');
    expect(t.state.chain.map((l) => l.kind)).toEqual(['attack', 'flip']);
    expect(t.state.window?.priority).toBe(0); // non-owner of the newest link
    t.resolve();
    // flip dealt 2 to the 2/2 attacker: it died, so the attack fizzled
    expect(t.void(1)).toEqual(['TST-2-2']);
    expect(t.stats('p2:TST-AMBUSH').guard).toBe(2);
  });

  it('flipping does not count as a summon (no summon window)', () => {
    const t = scenario(FIXTURE_DB)
      .p1.ambush('TST-AMBUSH')
      .mana(5, 5)
      .p2.set('TST-GRID')
      .board('TST-3-3');
    t.p1.flip('TST-AMBUSH', ['p2:TST-3-3']);
    expect(t.legal(1).some((a) => a.type === 'activateTrap')).toBe(false);
  });
});

describe('Relics and Rifts (§3.7)', () => {
  it('a relic with Charges triggers at start of turn and breaks at 0', () => {
    const t = scenario(FIXTURE_DB)
      .p1.hand('TST-RELIC')
      .deck('TST-FILLER', 'TST-FILLER', 'TST-FILLER', 'TST-FILLER', 'TST-FILLER')
      .p2.deck('TST-FILLER', 'TST-FILLER', 'TST-FILLER');
    t.p1.play('TST-RELIC').resolve();
    expect(t.backrow(1)).toEqual(['TST-RELIC']);
    t.p1.endTurn().p2.endTurn(); // dawn draw + relic draw, charge 2 → 1
    expect(t.handCards(1)).toHaveLength(2);
    expect(t.card('p1:TST-RELIC').charges).toBe(1);
    t.p1.endTurn().p2.endTurn(); // charge → 0, breaks
    expect(t.backrow(1)).toEqual([]);
    expect(t.void(1)).toContain('TST-RELIC');
  });

  it('a new Rift replaces the old one (old goes to the Void)', () => {
    const t = scenario(FIXTURE_DB).p1.rift('TST-RIFT').hand('TST-RIFT2');
    t.p1.play('TST-RIFT2').resolve();
    expect(t.void(1)).toEqual(['TST-RIFT']);
    expect(t.card('p1:TST-RIFT2').zone).toBe('rift');
  });

  it('Rift start-of-turn effects resolve at Dawn', () => {
    const t = scenario(FIXTURE_DB)
      .p1.rift('TST-RIFT')
      .essence(20)
      .deck('TST-FILLER')
      .p2.deck('TST-FILLER');
    t.p1.endTurn().p2.endTurn();
    expect(t.essenceOf(1)).toBe(21);
  });

  it('auras are layered statics, not stored numbers', () => {
    const t = scenario(FIXTURE_DB)
      .p1.board('TST-2-2')
      .hand('TST-AURA')
      .p2.hand('TST-BOLT')
      .set('TST-PIT');
    t.p1.play('TST-AURA').resolve();
    expect(t.stats('p1:TST-2-2').power).toBe(3);
    expect(t.card('p1:TST-2-2').buffs).toEqual([]);
  });
});

describe('cost keywords', () => {
  it('Echo: cast from the Void for N, then it goes Beyond when it leaves', () => {
    const t = scenario(FIXTURE_DB).p1.voidCards('TST-ECHO').mana(3, 3).p2.hand('TST-BOLT');
    t.p1.play('TST-ECHO', { echo: true });
    expect(t.manaOf(1).mana).toBe(0);
    t.p2.respond('TST-BOLT', ['p1:TST-ECHO']).resolve();
    expect(t.beyond(1)).toEqual(['TST-ECHO']);
    expect(t.void(1)).toEqual([]);
  });

  it('Ascend: destroy the listed units instead of paying Mana', () => {
    const t = scenario(FIXTURE_DB).p1.board('TST-2-2', 'TST-FILLER').hand('TST-ASCEND').mana(0, 0);
    t.p1.play('TST-ASCEND', { ascend: ['TST-2-2', 'TST-FILLER'] });
    expect(t.units(1)).toEqual(['TST-ASCEND']);
    expect(t.void(1).sort()).toEqual(['TST-2-2', 'TST-FILLER']);
  });

  it('Overclock: optional extra cost; the bonus applies only if paid', () => {
    const a = scenario(FIXTURE_DB).p1.hand('TST-OVERCLOCK').mana(3, 3);
    a.p1.play('TST-OVERCLOCK', { overclock: true }).resolve();
    expect(a.stats('p1:TST-OVERCLOCK').power).toBe(4);
    expect(a.manaOf(1).mana).toBe(0);
    const b = scenario(FIXTURE_DB).p1.hand('TST-OVERCLOCK').mana(3, 3);
    b.p1.play('TST-OVERCLOCK').resolve();
    expect(b.stats('p1:TST-OVERCLOCK').power).toBe(2);
  });

  it('Devour: optional; destroying the victim counts as it dying', () => {
    const t = scenario(FIXTURE_DB)
      .p1.board('TST-DEATHDRAW', 'TST-WATCHER')
      .hand('TST-DEVOUR')
      .deck('TST-5-5');
    t.p1.play('TST-DEVOUR', { targets: ['p1:TST-DEATHDRAW'] }).resolve();
    expect(t.stats('p1:TST-DEVOUR').power).toBe(5);
    expect(t.handCards(1)).toEqual(['TST-5-5']); // the victim's death trigger
    expect(t.stats('p1:TST-WATCHER').power).toBe(2);
    expect(t.eventTypes()).toContain('devoured');
  });

  it('Devour fizzles (no bonus) if the victim is gone when it resolves', () => {
    const t = scenario(FIXTURE_DB).p1.board('TST-2-2').hand('TST-DEVOUR').p2.hand('TST-BOLT');
    t.p1
      .play('TST-DEVOUR', { targets: ['p1:TST-2-2'] })
      .p2.respond('TST-BOLT', ['p1:TST-2-2'])
      .resolve();
    expect(t.stats('p1:TST-DEVOUR').power).toBe(3);
  });

  it('Devour can be declined; with no other unit it must be', () => {
    const t = scenario(FIXTURE_DB).p1.hand('TST-DEVOUR');
    const plays = t.legal().filter((a) => a.type === 'play');
    expect(plays).toHaveLength(1);
    expect(plays[0]).toMatchObject({ declined: [0] });
  });

  it('Quick abilities can be used in a window, once per turn', () => {
    const t = scenario(FIXTURE_DB).p1.board('TST-3-3').p2.board('TST-QUICK');
    t.p1.attack('TST-3-3', 'face').p2.activate('TST-QUICK');
    expect(t.state.chain).toHaveLength(2);
    t.resolve();
    expect(t.essenceOf(1)).toBe(29);
  });
});

describe('prompts', () => {
  it('Scry: look at the top N, put any on the bottom in any order', () => {
    const t = scenario(FIXTURE_DB).p1.hand('TST-SCRY').deck('TST-2-2', 'TST-3-3', 'TST-5-5');
    t.p1.play('TST-SCRY').resolve();
    expect(t.state.pending?.kind).toBe('scry');
    t.p1.scry(['TST-3-3'], ['TST-2-2']);
    expect(t.deckCards(1)).toEqual(['TST-3-3', 'TST-5-5', 'TST-2-2']);
  });
});

describe('zones (DECISIONS #27)', () => {
  it('a card that changes zone is a new instance: buffs and damage are gone', () => {
    const t = scenario(FIXTURE_DB)
      .p1.board('TST-3-3')
      .hand('TST-RECALL', 'TST-OVERCHARGE')
      .deck('TST-FILLER')
      .p2.board('TST-2-2');
    const before = t.id('p1:TST-3-3');
    t.p1.play('TST-OVERCHARGE', { targets: ['p1:TST-3-3'] }).resolve();
    t.p1.attack('TST-3-3', 'p2:TST-2-2').resolve();
    t.p1.play('TST-RECALL', { targets: ['p1:TST-3-3'] }).resolve();
    const after = t.id('p1:TST-3-3');
    expect(after).not.toBe(before);
    expect(t.card('p1:TST-3-3')).toMatchObject({ zone: 'hand', damage: 0, buffs: [] });
  });

  it('tokens that leave the field cease to exist', () => {
    const t = scenario(FIXTURE_DB).p1.board('TST-TOKEN').hand('TST-RECALL').deck('TST-FILLER');
    t.p1.play('TST-RECALL', { targets: ['p1:TST-TOKEN'] }).resolve();
    expect(t.handCards(1)).toEqual(['TST-FILLER']);
    expect(Object.values(t.state.cards).some((c) => c.cardId === 'TST-TOKEN')).toBe(false);
  });
});

describe('viewFor / eventsFor redaction', () => {
  it("hides the opponent's hand, deck order, set cards and the PRNG", () => {
    const t = scenario(FIXTURE_DB).p1.hand('TST-2-2').set('TST-PIT').deck('TST-5-5');
    const v = viewFor(t.state, 1);
    expect(v.players[0].hand).toBeNull();
    expect(v.players[0].handCount).toBe(1);
    expect(v.players[0].deckCount).toBe(1);
    expect(v.cards[t.id('p1:TST-PIT')]?.cardId).toBe(HIDDEN);
    expect(
      Object.values(v.cards).some((c) => c.cardId === 'TST-2-2' || c.cardId === 'TST-5-5'),
    ).toBe(false);
    expect(JSON.stringify(v)).not.toContain('"rng"');
  });

  it("redacts the opponent's draws", () => {
    const t = scenario(FIXTURE_DB).p1.deck('TST-FILLER').p2.deck('TST-5-5');
    t.p1.endTurn();
    const draw = eventsFor(t.lastEvents, 0).find((e) => e.type === 'cardDrawn');
    expect(draw).toMatchObject({ cardId: HIDDEN, id: HIDDEN });
    const own = eventsFor(t.lastEvents, 1).find((e) => e.type === 'cardDrawn');
    expect(own).toMatchObject({ cardId: 'TST-5-5' });
  });
});
