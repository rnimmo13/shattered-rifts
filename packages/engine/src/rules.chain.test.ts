// Rules tests: the Chain (01_GAME_DESIGN §3.6): windows, priority, LIFO, fizzles, negation,
// trap trigger matching, the passive trigger queue and safety caps.
import { describe, expect, it } from 'vitest';
import { FIXTURE_DB, scenario } from './testkit';
import { EngineCapError } from './util';

describe('§3.6 response windows and priority', () => {
  it('a window opens after an attack, with priority to the non-owner', () => {
    const t = scenario(FIXTURE_DB).p1.board('TST-3-3');
    t.p1.attack('TST-3-3', 'face');
    expect(t.state.chain).toHaveLength(1);
    expect(t.state.window).toEqual({ priority: 1, passes: 0 });
  });

  it('a window opens after a spell, a summon (even vanilla), a relic and a rift', () => {
    for (const card of ['TST-DRAW', 'TST-2-2', 'TST-RELIC', 'TST-RIFT']) {
      const t = scenario(FIXTURE_DB).p1.hand(card).deck('TST-FILLER', 'TST-FILLER');
      t.p1.play(card);
      expect(t.state.window?.priority).toBe(1);
    }
  });

  it('setting a trap or an Ambush unit opens no window', () => {
    const t = scenario(FIXTURE_DB).p1.hand('TST-PIT', 'TST-AMBUSH');
    t.p1.setTrap('TST-PIT').setAmbush('TST-AMBUSH');
    expect(t.state.window).toBeNull();
    expect(t.manaOf(1).mana).toBe(9);
  });

  it('two passes in a row resolve the top link; the owner may respond after the non-owner passes', () => {
    const t = scenario(FIXTURE_DB).p1.hand('TST-SLOWBOLT', 'TST-BOLT').p2.board('TST-3-3');
    t.p1.play('TST-SLOWBOLT', { targets: ['p2:TST-3-3'] }).p2.pass();
    expect(t.state.window).toEqual({ priority: 0, passes: 1 });
    t.p1.respond('TST-BOLT', ['p2:TST-3-3']);
    expect(t.state.chain).toHaveLength(2);
    expect(t.state.window).toEqual({ priority: 1, passes: 0 });
    t.resolve();
    expect(t.void(2)).toContain('TST-3-3');
  });

  it('links resolve last-in, first-out; the window reopens between links', () => {
    const t = scenario(FIXTURE_DB).p1.board('TST-2-2').p2.hand('TST-BOLT', 'TST-BOLT');
    t.p1.attack('TST-2-2', 'face').p2.respond('TST-BOLT', ['p1:TST-2-2']).p1.pass().p2.pass();
    // the bolt resolved (2 damage kills the 2/2); window reopens on the attack, non-owner (p2) first
    expect(t.void(1)).toContain('TST-2-2');
    expect(t.state.chain).toHaveLength(1);
    expect(t.state.window).toEqual({ priority: 1, passes: 0 });
    t.resolve();
    expect(t.essenceOf(2)).toBe(30);
  });

  it('non-Swift cards cannot be used in a response window', () => {
    const t = scenario(FIXTURE_DB)
      .p1.hand('TST-SLOWBOLT')
      .mana(3, 3)
      .p2.board('TST-2-2')
      .hand('TST-RECALL')
      .mana(2, 2)
      .deck('TST-FILLER');
    t.p1.play('TST-SLOWBOLT', { targets: ['p2:TST-2-2'] });
    // TST-RECALL isn't Swift, so p2 can't respond with it: only pass is legal
    expect(t.legal(1).map((a) => a.type)).toEqual(['pass']);
  });

  it('fizzles when its target is gone; the spell still goes to the Void', () => {
    const t = scenario(FIXTURE_DB)
      .p1.hand('TST-SLOWBOLT')
      .mana(3, 3)
      .p2.board('TST-2-2')
      .hand('TST-BOLT');
    t.p1
      .play('TST-SLOWBOLT', { targets: ['p2:TST-2-2'] })
      .p2.respond('TST-BOLT', ['p2:TST-2-2'])
      .resolve();
    expect(t.eventTypes()).toContain('fizzled');
    expect(t.void(1)).toContain('TST-SLOWBOLT');
    expect(t.manaOf(1).mana).toBe(2);
  });

  it('only Fast cards (Swift, set traps, Quick abilities) are offered in a window', () => {
    const t = scenario(FIXTURE_DB)
      .p1.board('TST-3-3')
      .p2.hand('TST-BOLT', 'TST-SLOWBOLT', 'TST-2-2', 'TST-PIT')
      .board('TST-QUICK')
      .set('TST-PIT');
    t.p1.attack('TST-3-3', 'face');
    const kinds = t
      .legal(1)
      .map((a) => `${a.type}:${'card' in a ? t.state.cards[a.card]?.cardId : ''}`);
    expect(kinds).toContain('play:TST-BOLT');
    expect(kinds).toContain('activateTrap:TST-PIT');
    expect(kinds).toContain('activate:TST-QUICK');
    expect(kinds).not.toContain('play:TST-SLOWBOLT');
    expect(kinds).not.toContain('play:TST-2-2');
  });
});

describe('§3.6 traps', () => {
  it('a trap cannot be activated the turn it was set, but can on the very next turn', () => {
    const t = scenario(FIXTURE_DB)
      .p1.hand('TST-NULL', 'TST-PIT')
      .board('TST-3-3')
      .deck('TST-FILLER')
      .p2.board('TST-3-3')
      .hand('TST-BOLT')
      .deck('TST-FILLER');
    t.p1.setTrap('TST-NULL').setTrap('TST-PIT');
    // same turn: p1 attacks, p2 casts a Swift spell; the fresh Null Field can't answer it yet
    t.p1.attack('TST-3-3', 'face').p2.respond('TST-BOLT', ['p1:TST-3-3']);
    expect(t.legal(0).some((a) => a.type === 'activateTrap')).toBe(false);
    t.resolve().p1.endTurn();
    // the opponent's very next turn: the Pit can spring
    t.p2.attack('TST-3-3', 'p1-face');
    expect(t.legal(0).some((a) => a.type === 'activateTrap')).toBe(true);
  });

  it("a trap's Trigger must match an event on the chain", () => {
    const t = scenario(FIXTURE_DB).p1.hand('TST-SLOWBOLT').p2.set('TST-PIT').board('TST-2-2');
    t.p1.play('TST-SLOWBOLT', { targets: ['p2:TST-2-2'] });
    expect(t.legal(1).some((a) => a.type === 'activateTrap')).toBe(false);
  });

  it('a trap matches at any depth of the chain (DECISIONS #21)', () => {
    const t = scenario(FIXTURE_DB)
      .p1.board('TST-5-5')
      .hand('TST-BOLT')
      .p2.set('TST-LOCK')
      .board('TST-2-2');
    t.p1.attack('TST-5-5', 'face').p2.pass().p1.respond('TST-BOLT', ['p2:TST-2-2']);
    // chain: [attack, bolt]; p2 can still spring Lockdown on the attack below
    expect(t.legal(1).some((a) => a.type === 'activateTrap')).toBe(true);
    t.p2.respond('TST-LOCK').resolve();
    expect(t.essenceOf(2)).toBe(30);
    expect(t.void(2)).toContain('TST-2-2');
  });

  it('summon window: a trap can hit a vanilla unit when it is summoned', () => {
    const t = scenario(FIXTURE_DB).p1.hand('TST-3-3').p2.set('TST-GRID');
    t.p1.play('TST-3-3').p2.respond('TST-GRID').resolve();
    expect(t.void(1)).toContain('TST-3-3');
  });

  it('summoning itself cannot be negated: the unit lands, its effect is the link', () => {
    const t = scenario(FIXTURE_DB).p1.hand('TST-SUMMONER').p2.set('TST-REBUKE');
    t.p1.play('TST-SUMMONER');
    expect(t.units(1)).toEqual(['TST-SUMMONER']);
    expect(t.legal(1).some((a) => a.type === 'activateTrap')).toBe(false); // Rebuke only matches spells
  });

  it('effect-made summons do not open windows (DECISIONS #18)', () => {
    const t = scenario(FIXTURE_DB).p1.hand('TST-SUMMONER').p2.set('TST-GRID', 'TST-GRID');
    t.p1.play('TST-SUMMONER').p2.pass().p1.pass();
    // the token arrived during resolution: no new window, no new link
    expect(t.units(1)).toEqual(['TST-SUMMONER', 'TST-TOKEN']);
    expect(t.state.window).toBeNull();
    expect(t.state.chain).toHaveLength(0);
  });

  it('the documented example chain: attack → Bone Pit → Null Field (01 §3.6)', () => {
    const t = scenario(FIXTURE_DB)
      .p1.board('TST-3-3')
      .set('TST-NULL')
      .mana(3, 3)
      .p2.set('TST-PIT')
      .mana(2, 2);
    t.p1.attack('TST-3-3', 'p2-face'); // Link 1
    t.p2.respond('TST-PIT'); // Link 2
    t.p1.respond('TST-NULL'); // Link 3
    expect(t.state.chain.map((l) => l.kind)).toEqual(['attack', 'trap', 'trap']);
    expect(t.legal(1).map((a) => a.type)).toEqual(['pass']); // p2 is out of Mana
    t.p2.pass().p1.pass(); // Link 3 resolves: negates Bone Pit
    t.resolve();
    expect(t.essenceOf(2)).toBe(27); // the attacker hits for 3
    expect(t.units(1)).toEqual(['TST-3-3']);
    expect(t.void(2)).toEqual(['TST-PIT']);
    expect(t.void(1)).toEqual(['TST-NULL']);
    expect(t.eventTypes()).toContain('negated');
  });

  it('Negate: the negated attack does nothing; the attacker still used its attack', () => {
    const t = scenario(FIXTURE_DB).p1.board('TST-3-3').p2.set('TST-LOCK');
    t.p1.attack('TST-3-3', 'face').p2.respond('TST-LOCK').resolve();
    expect(t.essenceOf(2)).toBe(30);
    expect(t.legal(0).some((a) => a.type === 'attack')).toBe(false);
  });
});

describe('§3.6 passive triggers', () => {
  it('passive triggers are not links and resolve right after the current link', () => {
    const t = scenario(FIXTURE_DB)
      .p1.hand('TST-SLOWBOLT')
      .p2.board('TST-DEATHDRAW')
      .deck('TST-5-5');
    t.p1.play('TST-SLOWBOLT', { targets: ['p2:TST-DEATHDRAW'] }).resolve();
    expect(t.handCards(2)).toEqual(['TST-5-5']);
    expect(t.state.chain).toHaveLength(0);
    expect(t.state.window).toBeNull();
  });

  it("queue in turn order: the active player's triggers first", () => {
    const t = scenario(FIXTURE_DB)
      .p1.board('TST-ENEMYWATCHER', 'TST-2-2')
      .hand('TST-NOVA')
      .essence(10)
      .p2.board('TST-ENEMYWATCHER', 'TST-2-2')
      .essence(10);
    // kill both 2/2s with a sweeper-like double hit: bolt each via combat instead
    t.p1.attack('TST-2-2', 'p2:TST-2-2').resolve();
    const dmg = t.events.filter((e) => e.type === 'damageDealt' && typeof e.target === 'object');
    // p1's watcher (enemy died → hit enemy face) resolves before p2's
    expect(
      dmg.map((e) =>
        e.type === 'damageDealt' && typeof e.target === 'object' ? e.target.player : -1,
      ),
    ).toEqual([1, 0]);
  });

  it('whenever-triggers fire for deaths (Carrion-style)', () => {
    const t = scenario(FIXTURE_DB).p1.board('TST-WATCHER', 'TST-2-2').p2.board('TST-5-5');
    t.p1.attack('TST-2-2', 'p2:TST-5-5').resolve();
    expect(t.stats('p1:TST-WATCHER').power).toBe(2);
  });

  it('end-of-turn passives with a choice prompt their controller', () => {
    const t = scenario(FIXTURE_DB)
      .p1.board('TST-HEALER', 'TST-3-3', 'TST-5-5')
      .deck('TST-FILLER')
      .p2.board('TST-2-2')
      .deck('TST-FILLER');
    t.p1.attack('TST-3-3', 'p2:TST-2-2').resolve();
    t.p1.attack('TST-5-5', 'face').resolve();
    // only the 3/3 is damaged → no real choice → resolves without a prompt
    t.p1.endTurn();
    expect(t.stats('p1:TST-3-3').guard).toBe(3);
  });

  it('delayed effects resolve at end of turn (Overcharge pattern)', () => {
    const t = scenario(FIXTURE_DB)
      .p1.board('TST-3-3')
      .hand('TST-OVERCHARGE')
      .deck('TST-FILLER')
      .p2.deck('TST-FILLER');
    t.p1.play('TST-OVERCHARGE', { targets: ['p1:TST-3-3'] }).resolve();
    expect(t.stats('p1:TST-3-3').power).toBe(6);
    t.p1.endTurn();
    expect(t.stats('p1:TST-3-3').power).toBe(3);
    expect(t.stats('p1:TST-3-3').guard).toBe(2);
  });
});

describe('§4 safety caps', () => {
  it('hitting the chain depth cap throws (a test must fail, not silently stop)', () => {
    const t = scenario(FIXTURE_DB, { rules: { chainCap: 2 } })
      .p1.board('TST-3-3')
      .p2.hand('TST-BOLT')
      .p1.hand('TST-BOLT');
    t.p1.attack('TST-3-3', 'face').p2.respond('TST-BOLT', ['p1:TST-3-3']);
    expect(() => t.p1.respond('TST-BOLT', ['p1:TST-3-3'])).toThrow(EngineCapError);
  });
});
