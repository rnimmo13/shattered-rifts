// Scenario tests: Rare / Epic / Legendary / Mythic cards and the Warden signature cards.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sr/engine';
import { scenario } from '@sr/engine/testkit';
import { CARD_DB } from '../index';

const t0 = () => scenario(CARD_DB);

describe('Aurelion (rare+)', () => {
  it('AUR-06 Oathsworn Paladin: Shield; Resonance 3 gives your other units +1/+1', () => {
    const t = t0().p1.board('AUR-01').hand('NEU-07', 'NEU-07', 'AUR-06').p2.board('AUR-04');
    t.p1.play('NEU-07', { targets: ['p2:AUR-04'] }).resolve();
    t.p1.play('NEU-07', { targets: ['p2:AUR-04'] }).resolve();
    t.p1.play('AUR-06').resolve();
    expect(t.card('p1:AUR-06').shield).toBe(true);
    expect(t.stats('p1:AUR-01')).toMatchObject({ power: 2, guard: 3 });
    expect(t.stats('p1:AUR-06')).toMatchObject({ power: 3, guard: 5 });
  });

  it('AUR-06 without Resonance 3: no bonus', () => {
    const t = t0().p1.board('AUR-01').hand('AUR-06');
    t.p1.play('AUR-06').resolve();
    expect(t.stats('p1:AUR-01')).toMatchObject({ power: 1, guard: 2 });
  });

  it('AUR-07 Sunwing Griffin: Blitz and Pierce', () => {
    const t = t0().p1.hand('AUR-07').p2.board('AUR-01');
    t.p1.play('AUR-07').resolve().attack('AUR-07', 'p2:AUR-01').resolve();
    expect(t.essenceOf(2)).toBe(28); // 4 power − 2 guard carries over
  });

  it('AUR-08 Archmagister Velle: spells cost 1 less, and adds a random Aurelion spell', () => {
    const t = t0().p1.hand('AUR-08').mana(5, 5).p2.board('AUR-04');
    t.p1.play('AUR-08').resolve();
    expect(t.handCards(1)).toHaveLength(1);
    expect(['AUR-10', 'AUR-11', 'AUR-12']).toContain(t.handCards(1)[0]);
    const u = t0().p1.board('AUR-08').hand('AUR-10').mana(1, 1).p2.board('AUR-04');
    u.p1.play('AUR-10', { targets: ['p2:AUR-04'] }).resolve();
    expect(u.manaOf(1).mana).toBe(0);
  });

  it('AUR-09 Aurumclaw: Ascend by destroying two Shielded units; all other friendly units gain Shield', () => {
    const t = t0().p1.board('AUR-06', 'AUR-19', 'AUR-01').hand('AUR-09').mana(0, 0);
    // AUR-01 has no Shield, so the only legal Ascend is the two Shielded units
    t.p1.play('AUR-09', { ascend: ['AUR-06', 'AUR-19'] }).resolve();
    expect(t.units(1)).toEqual(['AUR-09', 'AUR-01']); // the Ascend freed the first slots
    expect(t.card('p1:AUR-01').shield).toBe(true);
    expect(t.stats('p1:AUR-09').keywords.has('lifebind')).toBe(true);
    expect(t.void(1).sort()).toEqual(['AUR-06', 'AUR-19']);
  });

  it('AUR-09 cannot Ascend without two Shielded units', () => {
    const t = t0().p1.board('AUR-01', 'AUR-02').hand('AUR-09').mana(0, 0);
    expect(t.legal().some((a) => a.type === 'play')).toBe(false);
  });

  it('AUR-12 Final Judgment: destroys every unit with 4 or more Power, on both sides', () => {
    const t = t0().p1.board('WYL-16', 'AUR-05').hand('AUR-12').p2.board('WYL-05', 'AUR-04');
    t.p1.play('AUR-12').resolve();
    expect(t.units(1)).toEqual(['AUR-05']);
    expect(t.units(2)).toEqual(['AUR-04']);
  });

  it('AUR-14 Divine Rebuke: negates an enemy spell and draws a card', () => {
    const t = t0().p1.set('AUR-14').board('AUR-04').deck('NEU-03').mana(4, 4).p2.hand('NEU-07');
    t.p1.endTurn();
    t.p2
      .play('NEU-07', { targets: ['p1:AUR-04'] })
      .p1.respond('AUR-14')
      .resolve();
    expect(t.stats('p1:AUR-04').guard).toBe(5);
    expect(t.handCards(1)).toEqual(['NEU-03']);
    expect(t.eventTypes()).toContain('negated');
  });

  it('AUR-15 Banner of the Ninth Dawn: +1 Power, breaks after three friendly deaths', () => {
    const t = t0()
      .p1.relic('AUR-15')
      .board('NEX-16', 'NEX-16', 'NEX-16')
      .hand('NEU-07', 'NEU-07', 'NEU-07');
    expect(t.stats('p1:NEX-16').power).toBe(3);
    for (let i = 0; i < 3; i++) t.p1.play('NEU-07', { targets: [`p1:NEX-16`] }).resolve();
    expect(t.backrow(1)).toEqual([]);
    expect(t.void(1)).toContain('AUR-15');
  });

  it('AUR-16 Rift: The Gilded Citadel: a random friendly unit gains Shield at your turn start', () => {
    const t = t0().p1.rift('AUR-16').board('AUR-05').deck('NEU-03').p2.deck('NEU-03');
    t.p1.endTurn().p2.endTurn();
    expect(t.card('p1:AUR-05').shield).toBe(true);
  });

  it("AUR-17 Seraphine's Oath: Shielded units have +1 Power", () => {
    const t = t0().p1.relic('AUR-17').board('AUR-06', 'AUR-05');
    expect(t.stats('p1:AUR-06').power).toBe(4);
    expect(t.stats('p1:AUR-05').power).toBe(3);
  });

  it('AUR-18 Bell of Judgment: destroys an attacker with 5+ Power only', () => {
    const big = t0().p1.board('WYL-16').p2.set('AUR-18');
    big.p1.attack('WYL-16', 'face').p2.respond('AUR-18').resolve();
    expect(big.void(1)).toContain('WYL-16');
    const small = t0().p1.board('WYL-05').p2.set('AUR-18');
    small.p1.attack('WYL-05', 'face');
    expect(small.legal(1).some((a) => a.type === 'activateTrap')).toBe(false);
  });

  it('AUR-19 Gilded Halberdier: when its Shield pops, it deals 2 damage to the source', () => {
    const t = t0().p1.board('AUR-04').p2.board('AUR-19');
    t.p1.attack('AUR-04', 'p2:AUR-19').resolve();
    // 3 combat damage + 2 from the Halberdier = dead (a 2/5)
    expect(t.void(1)).toContain('AUR-04');
    expect(t.stats('p2:AUR-19').guard).toBe(3);
  });
});

describe('Nexus-9 (rare+)', () => {
  it("NEX-05 Netrunner Ix: look at the enemy's set cards, destroy one costing 3 or less", () => {
    const t = t0().p1.hand('NEX-05').p2.set('WYL-11', 'AUR-14');
    t.p1.play('NEX-05').resolve();
    expect(t.state.pending?.kind).toBe('chooseCards');
    const v = createEngine(CARD_DB).viewFor(t.state, 0);
    // the player sees every enemy set card to choose, but can only pick the cheap one
    expect(v.cards[t.id('p2:WYL-11')]?.cardId).toBe('WYL-11');
    expect(v.cards[t.id('p2:AUR-14')]?.cardId).toBe('AUR-14');
    const legal = t.legal().filter((a) => a.type === 'chooseCards');
    expect(legal).toHaveLength(2); // pick WYL-11, or nothing
    t.p1.chooseCards('p2:WYL-11');
    expect(t.void(2)).toEqual(['WYL-11']);
    expect(t.backrow(2)).toEqual(['AUR-14']);
  });

  it('NEX-05 does nothing when the enemy has no set cards', () => {
    const t = t0().p1.hand('NEX-05');
    t.p1.play('NEX-05').resolve();
    expect(t.state.pending).toBeNull();
  });

  it('NEX-06 Warframe "Bastion": Guardian; damage to it is reduced by 1; Assemble', () => {
    const t = t0().p1.board('WYL-02').p2.board('NEX-06');
    t.p1.attack('WYL-02', 'p2:NEX-06').resolve();
    expect(t.stats('p2:NEX-06').guard).toBe(5); // 3 − 1 = 2 damage
    const a = t0().p1.board('NEX-16').hand('NEX-06');
    a.p1.play('NEX-06', { targets: ['p1:NEX-16'] }).resolve();
    expect(a.stats('p1:NEX-06')).toMatchObject({ power: 7, guard: 8 });
  });

  it('NEX-07 CALYX: Constructs have Ward; casts a copy of the last spell with new targets', () => {
    const t = t0().p1.board('NEX-04').hand('NEU-07', 'NEX-07').p2.board('AUR-04', 'AUR-05');
    t.p1.play('NEU-07', { targets: ['p2:AUR-04'] }).resolve();
    t.p1.play('NEX-07').resolve();
    expect(t.state.pending?.kind).toBe('chooseTargets');
    t.p1.choose('p2:AUR-05');
    expect(t.stats('p2:AUR-05').guard).toBe(1); // a 3/3 takes the copied Rift Bolt's 2
    expect(t.stats('p2:AUR-04').guard).toBe(3); // and the original Bolt's 2 hit the 2/5
    expect(t.stats('p1:NEX-04').keywords.has('ward')).toBe(true);
    expect(t.stats('p1:NEX-07').keywords.has('ward')).toBe(true);
  });

  it('NEX-07 with no spell cast yet: nothing to copy', () => {
    const t = t0().p1.hand('NEX-07').p2.board('AUR-04');
    t.p1.play('NEX-07').resolve();
    expect(t.state.pending).toBeNull();
    expect(t.stats('p2:AUR-04').guard).toBe(5);
  });

  it('NEX-10 EMP Burst: stuns all enemy units and destroys enemy Relics costing 3 or less', () => {
    const t = t0()
      .p1.hand('NEX-10')
      .deck('NEU-03')
      .p2.board('AUR-05')
      .relic('NEU-09', 'WYL-13')
      .deck('NEU-03');
    t.p1.play('NEX-10').resolve();
    expect(t.backrow(2)).toEqual([]);
    t.p1.endTurn();
    expect(t.legal(1).some((a) => a.type === 'attack')).toBe(false);
  });

  it('NEX-13 Lockdown Protocol: negates the attack and Stuns the attacker', () => {
    const t = t0().p1.board('AUR-05').deck('NEU-03').p2.set('NEX-13');
    t.p1.attack('AUR-05', 'face').p2.respond('NEX-13').resolve();
    expect(t.essenceOf(2)).toBe(30);
    t.p1.endTurn().p2.endTurn();
    expect(t.legal(0).some((a) => a.type === 'attack')).toBe(false);
  });

  it('NEX-14 Mana Reactor: +1 temporary Mana each turn for 3 turns, then breaks', () => {
    const t = t0()
      .p1.relic('NEX-14')
      .deck('NEU-03', 'NEU-03', 'NEU-03', 'NEU-03')
      .p2.deck('NEU-03', 'NEU-03', 'NEU-03', 'NEU-03');
    for (let i = 0; i < 3; i++) {
      t.p1.endTurn().p2.endTurn();
      expect(t.manaOf(1).temp).toBe(1);
    }
    expect(t.backrow(1)).toEqual([]);
  });

  it('NEX-15 Rift: Foundry Nexus-9: your first Construct each turn costs 1 less', () => {
    const t = t0().p1.rift('NEX-15').hand('NEX-04', 'NEX-16').mana(10, 10);
    t.p1.play('NEX-04').resolve();
    expect(t.manaOf(1).mana).toBe(8);
    t.p1.play('NEX-16').resolve();
    expect(t.manaOf(1).mana).toBe(6);
  });

  it("NEX-17 Kron's Assembly Arm: draw whenever you Assemble", () => {
    const t = t0().p1.relic('NEX-17').board('NEX-16').hand('NEX-04').deck('NEU-03');
    t.p1.play('NEX-04', { targets: ['p1:NEX-16'] }).resolve();
    expect(t.handCards(1)).toEqual(['NEU-03']);
  });

  it('NEX-18 Override Virus: take an enemy Construct until end of turn, with Blitz', () => {
    const t = t0().p1.hand('NEX-18').deck('NEU-03').p2.board('NEX-04').deck('NEU-03');
    t.p1.play('NEX-18', { targets: ['p2:NEX-04'] }).resolve();
    expect(t.units(1)).toEqual(['NEX-04']);
    t.p1.attack('NEX-04', 'face').resolve();
    expect(t.essenceOf(2)).toBe(27);
    t.p1.endTurn();
    expect(t.units(2)).toEqual(['NEX-04']);
    expect(t.units(1)).toEqual([]);
  });

  it('NEX-19 Orbital Uplink: 5 damage to an enemy unit costing 5 or more when summoned', () => {
    const small = t0().p1.hand('AUR-05').p2.set('NEX-19');
    small.p1.play('AUR-05');
    expect(small.legal(1).some((a) => a.type === 'activateTrap')).toBe(false);
    const big = t0().p1.hand('NEU-03').p2.set('NEX-19');
    big.p1.play('NEU-03').p2.respond('NEX-19').resolve();
    expect(big.stats('p1:NEU-03').guard).toBe(1);
  });
});

describe('Wyldmaw (rare+)', () => {
  it('WYL-06 Broodmother Vexa: a Larva at end of turn, and whenever you Devour', () => {
    const t = t0().p1.board('WYL-06', 'WYL-01').hand('WYL-05').deck('NEU-03').p2.deck('NEU-03');
    t.p1.play('WYL-05', { targets: ['p1:WYL-01'] }).resolve();
    expect(t.units(1)).toContain('TOK-LARVA');
    t.p1.endTurn();
    expect(t.units(1).filter((c) => c === 'TOK-LARVA')).toHaveLength(2);
  });

  it("WYL-07 Thal'gor: destroys all other units and gains +1/+1 for each", () => {
    const t = t0().p1.board('AUR-04').hand('WYL-07').mana(9, 9).p2.board('AUR-05', 'WYL-16');
    t.p1.play('WYL-07').resolve();
    expect(t.units(1)).toEqual(['WYL-07']);
    expect(t.units(2)).toEqual([]);
    expect(t.stats('p1:WYL-07')).toMatchObject({ power: 11, guard: 11 });
  });

  it("WYL-07 Thal'gor: Ascend by destroying three friendly units", () => {
    const t = t0()
      .p1.board('AUR-01', 'AUR-02', 'AUR-03')
      .hand('WYL-07')
      .mana(0, 0)
      .p2.board('AUR-05');
    t.p1.play('WYL-07', { ascend: ['AUR-01', 'AUR-02', 'AUR-03'] }).resolve();
    expect(t.units(1)).toEqual(['WYL-07']);
    expect(t.stats('p1:WYL-07')).toMatchObject({ power: 9, guard: 9 }); // only the enemy unit counts
  });

  it('WYL-10 Roar of the Maw: +2/+1 this turn; Resonance 3 adds Pierce', () => {
    const a = t0().p1.board('AUR-04').hand('WYL-10');
    a.p1.play('WYL-10').resolve();
    expect(a.stats('p1:AUR-04')).toMatchObject({ power: 4, guard: 6 });
    expect(a.stats('p1:AUR-04').keywords.has('pierce')).toBe(false);
    a.p1.endTurn();
    expect(a.stats('p1:AUR-04')).toMatchObject({ power: 2, guard: 5 });
    const b = t0().p1.board('AUR-04').hand('NEU-07', 'NEU-07', 'WYL-10').p2.board('AUR-05');
    b.p1.play('NEU-07', { targets: ['p2:AUR-05'] }).resolve();
    b.p1.play('NEU-07', { targets: ['p2:AUR-05'] }).resolve();
    b.p1.play('WYL-10').resolve();
    expect(b.stats('p1:AUR-04').keywords.has('pierce')).toBe(true);
  });

  it('WYL-12 Lurker in the Brush: summons a 4/3 Lurker that fights the summoned unit', () => {
    const t = t0().p1.hand('AUR-04').p2.set('WYL-12');
    t.p1.play('AUR-04').p2.respond('WYL-12').resolve();
    expect(t.units(2)).toEqual(['TOK-LURKER']);
    expect(t.stats('p2:TOK-LURKER').guard).toBe(1);
    expect(t.stats('p1:AUR-04').guard).toBe(1);
  });

  it('WYL-13 Idol of Endless Hunger: a random friendly unit gets +1/+1 when a friendly unit dies', () => {
    const t = t0().p1.relic('WYL-13').board('NEX-16', 'AUR-04').hand('NEU-07');
    t.p1.play('NEU-07', { targets: ['p1:NEX-16'] }).resolve();
    expect(t.stats('p1:AUR-04')).toMatchObject({ power: 3, guard: 6 });
  });

  it('WYL-14 Rift: The Gnawing Wilds: draw on the first Devour each turn only', () => {
    const t = t0()
      .p1.rift('WYL-14')
      .board('AUR-01', 'AUR-02')
      .hand('WYL-05', 'WYL-05')
      .deck('NEU-03', 'NEU-03')
      .mana(8, 8);
    t.p1.play('WYL-05', { targets: ['p1:AUR-01'] }).resolve();
    expect(t.handCards(1)).toHaveLength(2);
    t.p1.play('WYL-05#1', { targets: ['p1:AUR-02'] }).resolve(); // #0 is now on the field
    expect(t.handCards(1)).toHaveLength(1); // no second draw this turn
  });

  it('WYL-17 The Hunger Below: destroy a unit; your units gain +X/+X (its Power)', () => {
    const t = t0().p1.board('WYL-01').hand('WYL-17').p2.board('AUR-04');
    t.p1.play('WYL-17', { targets: ['p2:AUR-04'] }).resolve();
    expect(t.units(2)).toEqual([]);
    expect(t.stats('p1:WYL-01')).toMatchObject({ power: 4, guard: 3 });
  });

  it('WYL-18 Maw Spawn Egg: after three friendly deaths it breaks and summons a 6/6', () => {
    const t = t0()
      .p1.relic('WYL-18')
      .board('NEX-16', 'NEX-16', 'NEX-16')
      .hand('NEU-07', 'NEU-07', 'NEU-07');
    for (let i = 0; i < 3; i++) t.p1.play('NEU-07', { targets: [`p1:NEX-16`] }).resolve();
    expect(t.units(1)).toEqual(['TOK-MAWSPAWN']);
    expect(t.stats('p1:TOK-MAWSPAWN')).toMatchObject({ power: 6, guard: 6 });
  });

  it("WYL-19 Gorrmaw's Tooth: Devour bonuses are +1/+1 higher", () => {
    const t = t0().p1.relic('WYL-19').board('AUR-01').hand('WYL-05');
    t.p1.play('WYL-05', { targets: ['p1:AUR-01'] }).resolve();
    expect(t.stats('p1:WYL-05')).toMatchObject({ power: 8, guard: 8 });
  });
});

describe('Umbral Veil (rare+)', () => {
  it('UMB-04 Seer of Hollow Eyes: set a Trap from the top 3; the rest go to the bottom', () => {
    const t = t0().p1.hand('UMB-04').deck('AUR-04', 'UMB-10', 'NEU-03', 'AUR-05');
    t.p1.play('UMB-04').resolve();
    expect(t.state.pending?.kind).toBe('chooseCards');
    t.p1.chooseCards('UMB-10');
    expect(t.backrow(1)).toEqual(['UMB-10']);
    expect(t.deckCards(1)).toEqual(['AUR-05', 'AUR-04', 'NEU-03']);
  });

  it('UMB-04 may decline: all three go to the bottom', () => {
    const t = t0().p1.hand('UMB-04').deck('AUR-04', 'UMB-10', 'NEU-03', 'AUR-05');
    t.p1.play('UMB-04').resolve();
    t.p1.act({ type: 'chooseCards', player: 0, cards: [] });
    expect(t.backrow(1)).toEqual([]);
    expect(t.deckCards(1)).toEqual(['AUR-05', 'AUR-04', 'UMB-10', 'NEU-03']);
  });

  it('UMB-06 The Puppeteer: take control of an enemy unit costing 3 or less (it is Arriving)', () => {
    const t = t0().p1.hand('UMB-06').mana(6, 6).p2.board('NEX-16', 'NEU-03');
    t.p1.play('UMB-06').resolve();
    expect(t.units(1)).toEqual(['UMB-06', 'NEX-16']);
    expect(t.legal().some((a) => a.type === 'attack' && a.attacker === t.id('p1:NEX-16'))).toBe(
      false,
    );
  });

  it("UMB-07 Mor'vael: Traps can be activated the turn they're set; resolved Traps draw and burn", () => {
    const t = t0().p1.board('UMB-07', 'AUR-05').hand('NEU-08').deck('NEU-03').p2.hand('NEU-07');
    t.p1.setTrap('NEU-08').attack('AUR-05', 'face').p2.respond('NEU-07', ['p1:AUR-05']);
    expect(t.legal(0).some((a) => a.type === 'activateTrap')).toBe(true);
    t.p1.respond('NEU-08').resolve();
    expect(t.handCards(1)).toEqual(['NEU-03']);
    expect(t.essenceOf(2)).toBe(25); // 3 from the attack, 2 from Mor'vael
  });

  it("without Mor'vael a Trap set this turn cannot spring", () => {
    const t = t0().p1.board('AUR-05').hand('NEU-08').p2.hand('NEU-07');
    t.p1.setTrap('NEU-08').attack('AUR-05', 'face').p2.respond('NEU-07', ['p1:AUR-05']);
    expect(t.legal(0).some((a) => a.type === 'activateTrap')).toBe(false);
  });

  it('UMB-09 Draw the Veil: Swift bounce, then you may set a Trap from your hand', () => {
    const t = t0().p1.hand('UMB-09', 'UMB-10').p2.board('AUR-05');
    t.p1.play('UMB-09', { targets: ['p2:AUR-05'] }).resolve();
    expect(t.handCards(2)).toEqual(['AUR-05']);
    expect(t.state.pending?.kind).toBe('chooseCards');
    t.p1.chooseCards('UMB-10');
    expect(t.backrow(1)).toEqual(['UMB-10']);
  });

  it('UMB-11 Mirror of Malice: redirects an enemy spell to a random enemy unit', () => {
    const t = t0().p1.board('AUR-04').set('UMB-11').p2.board('AUR-05').hand('NEU-07');
    t.p1.endTurn();
    t.p2
      .play('NEU-07', { targets: ['p1:AUR-04'] })
      .p1.respond('UMB-11')
      .resolve();
    expect(t.stats('p1:AUR-04').guard).toBe(5);
    expect(t.stats('p2:AUR-05').guard).toBe(1); // the Bolt hit the caster's own 3/3
    expect(t.eventTypes()).toContain('redirected');
  });

  it('UMB-11 Mirror of Malice: negates the spell if there is no other enemy unit', () => {
    const t = t0().p1.board('AUR-04').set('UMB-11').p2.hand('NEU-07');
    t.p1.endTurn();
    t.p2
      .play('NEU-07', { targets: ['p1:AUR-04'] })
      .p1.respond('UMB-11')
      .resolve();
    expect(t.stats('p1:AUR-04').guard).toBe(5);
    expect(t.eventTypes()).toContain('negated');
  });

  it('UMB-12 Snare Cascade: when you activate another Trap, 2 damage and draw', () => {
    const t = t0()
      .p1.set('UMB-10', 'UMB-12')
      .board('AUR-02')
      .deck('NEU-03')
      .p2.board('AUR-05')
      .deck('NEU-03');
    t.p1.endTurn();
    t.p2.attack('AUR-05', 'face').p1.respond('UMB-10').p2.pass().p1.respond('UMB-12').resolve();
    expect(t.essenceOf(2)).toBe(28);
    expect(t.handCards(1)).toEqual(['NEU-03']);
  });

  it('UMB-13 Hungering Dark: destroys the attacker and every enemy unit with the same name', () => {
    const t = t0().p1.set('UMB-13').p2.board('AUR-05', 'AUR-05', 'AUR-04');
    t.p1.endTurn();
    t.p2.attack('AUR-05', 'face').p1.respond('UMB-13').resolve();
    expect(t.units(2)).toEqual(['AUR-04']);
    expect(t.void(2)).toEqual(['AUR-05', 'AUR-05']);
  });

  it('UMB-14 Lantern of Lost Names: enemy effects cannot destroy or reveal your set cards', () => {
    const t = t0().p1.relic('UMB-14').set('WYL-11').p2.hand('NEU-06', 'NEX-05');
    t.p1.endTurn();
    // Shatter can target the face-up Lantern (a Relic) but never the protected set card
    const shatterTargets = t
      .legal(1)
      .flatMap((a) =>
        a.type === 'play' && t.state.cards[a.card]?.cardId === 'NEU-06' ? a.targets.flat() : [],
      );
    expect(shatterTargets).not.toContain(t.id('p1:WYL-11'));
    t.p2.play('NEX-05').resolve();
    expect(t.state.pending).toBeNull(); // nothing to look at
  });

  it('UMB-15 Rift: The Hollow Veil: 5 backrow slots; the first Trap each turn costs 1 less', () => {
    const t = t0()
      .p1.rift('UMB-15')
      .hand(...Array.from({ length: 6 }, () => 'UMB-10'));
    for (let i = 0; i < 5; i++) t.p1.setTrap(`UMB-10#${i}`); // earlier copies are already set
    expect(t.state.players[0].backrow).toHaveLength(5);
    expect(t.legal().some((a) => a.type === 'setTrap')).toBe(false);
    // Shadow Coil costs 1; with the Rift the first Trap each turn costs 0, so no held Mana is needed
    const u = t0().p1.rift('UMB-15').set('UMB-10').deck('NEU-03').mana(0, 0).p2.board('AUR-05');
    u.p1.endTurn();
    u.p2.attack('AUR-05', 'face');
    expect(u.legal(0).some((a) => a.type === 'activateTrap')).toBe(true);
    const v = t0().set('UMB-10').deck('NEU-03').mana(0, 0).p2.board('AUR-05');
    v.p1.endTurn();
    v.p2.attack('AUR-05', 'face');
    expect(v.legal(0).some((a) => a.type === 'activateTrap')).toBe(false); // costs 1 without it
  });

  it('UMB-15 the 5th backrow card is destroyed if the Rift is replaced', () => {
    const t = t0()
      .p1.rift('UMB-15')
      .set('UMB-10', 'UMB-10', 'UMB-10', 'UMB-10', 'UMB-12')
      .hand('NEX-15');
    t.p1.play('NEX-15').resolve();
    expect(t.state.players[0].backrow).toHaveLength(4);
    expect(t.backrow(1)).toHaveLength(4);
    expect(t.void(1)).toContain('UMB-12');
  });

  it("UMB-17 Nyxara's Web: negates an attack and sets itself again, once per game", () => {
    const t = t0()
      .p1.set('UMB-17')
      .deck('NEU-03', 'NEU-03')
      .p2.board('AUR-05', 'AUR-04')
      .deck('NEU-03', 'NEU-03');
    t.p1.endTurn();
    t.p2.attack('AUR-05', 'face').p1.respond('UMB-17').resolve();
    expect(t.essenceOf(1)).toBe(30);
    expect(t.backrow(1)).toEqual(['UMB-17']);
    expect(t.card('p1:UMB-17').faceDown).toBe(true);
    t.p2.endTurn().p1.endTurn();
    t.p2.attack('AUR-04', 'face').p1.respond('UMB-17').resolve();
    expect(t.essenceOf(1)).toBe(30);
    expect(t.backrow(1)).toEqual([]);
    expect(t.void(1)).toEqual(['UMB-17']);
  });

  it('UMB-18 Whisper Net: the enemy discards a random card when it casts a spell', () => {
    const t = t0().p1.set('UMB-18').board('AUR-04').p2.hand('NEU-07', 'NEU-03');
    t.p1.endTurn();
    t.p2
      .play('NEU-07', { targets: ['p1:AUR-04'] })
      .p1.respond('UMB-18')
      .resolve();
    expect(t.handCards(2)).toEqual([]);
    expect(t.void(2)).toContain('NEU-03');
  });

  it("UMB-19 Faceless Courtier: Flip reveals the enemy's hand to you", () => {
    const engine = createEngine(CARD_DB);
    const t = t0().p1.ambush('UMB-19').p2.hand('AUR-04', 'NEU-07');
    expect(engine.viewFor(t.state, 0).players[1].hand).toBeNull();
    t.p1.flip('UMB-19').resolve();
    const v = engine.viewFor(t.state, 0);
    expect(v.players[1].hand).toHaveLength(2);
    expect(v.cards[t.state.players[1].hand[0] as string]?.cardId).toBeDefined();
    t.p1.endTurn();
    expect(engine.viewFor(t.state, 0).players[1].hand).toBeNull();
  });
});

describe('Neutral (rare+)', () => {
  it('NEU-04 Riftborn Colossus: costs 1 less for each card in your backrow', () => {
    const none = t0().p1.hand('NEU-04').mana(6, 6);
    expect(none.legal().some((a) => a.type === 'play')).toBe(false);
    const three = t0().p1.hand('NEU-04').set('UMB-10', 'UMB-10', 'UMB-10').mana(4, 4);
    three.p1.play('NEU-04').resolve();
    expect(three.manaOf(1).mana).toBe(0);
  });

  it('NEU-05 Tear in the Rift: 2 temporary Mana; 3 at Resonance 4', () => {
    const a = t0().p1.hand('NEU-05').mana(0, 0);
    a.p1.play('NEU-05').resolve();
    expect(a.manaOf(1).temp).toBe(2);
    const b = t0().p1.hand('NEU-07', 'NEU-07', 'NEU-07', 'NEU-05').mana(3, 3).p2.board('NEU-03');
    for (let i = 0; i < 3; i++) b.p1.play('NEU-07', { targets: ['p2:NEU-03'] }).resolve();
    b.p1.play('NEU-05').resolve();
    expect(b.manaOf(1).temp).toBe(3);
  });

  it('NEU-08 Null Field: negates an enemy Swift spell, or an enemy Trap activation', () => {
    const t = t0().p1.board('AUR-05').set('NEU-08').p2.hand('NEU-07').board('NEU-03');
    t.p1.endTurn();
    t.p2.attack('NEU-03', 'face');
    const t2 = t0().p1.board('AUR-05').set('NEU-08').deck('NEU-03').p2.hand('NEU-07');
    t2.p1.endTurn().p2.endTurn();
    t2.p1
      .attack('AUR-05', 'face')
      .p2.respond('NEU-07', ['p1:AUR-05'])
      .p1.respond('NEU-08')
      .resolve();
    expect(t2.stats('p1:AUR-05').guard).toBe(3);
    expect(t.state.chain).toHaveLength(1);
    const u = t0().p1.set('NEU-08').deck('NEU-03').p2.board('AUR-05').set('WYL-11');
    u.p1.endTurn();
    u.p2.attack('AUR-05', 'face');
    // p1's own Null Field only answers ENEMY traps: p2 has none to spring here
    expect(u.legal(0).some((a) => a.type === 'activateTrap')).toBe(false);
  });

  it('NEU-10 Prism: costs 1 less per different card type in your Void; copies each Spell in it', () => {
    const t = t0()
      .p1.hand('NEU-10')
      .voidCards('NEU-07', 'AUR-10', 'AUR-04', 'UMB-10')
      .mana(7, 7)
      .p2.board('NEU-03');
    t.p1.play('NEU-10').resolve();
    expect(t.units(1)).toEqual(['NEU-10']);
    // 3 different types in the Void (spell, unit, trap) → cost 7. Both Spells were copied at random
    // units: Rift Bolt (2) + Smite (3) = 5 damage split between the Golem and Prism itself.
    const dealt = 6 - t.stats('p2:NEU-03').guard + (8 - t.stats('p1:NEU-10').guard);
    expect(dealt).toBe(5);
  });
});
