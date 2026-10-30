// Frames, scrapping and Salvage (DECISIONS #383): a Light companion takes 1 of the 3 companion slots, a Heavy 2, a Colossal 3; a
// summon that does not fit scraps companions to make room, and the Engineer's Salvage hands what they leave to the new machine.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  type Action,
  type CombatState,
  summonsThatFit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[], hero: 'engineer' | 'hunter' = 'engineer'): CombatState {
  const { state } = createCombat(db, {
    seed: 'frames-test',
    a: { hero, deck: [...RIFTWALKERS[hero].starter, ...RIFTWALKERS[hero].starter] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 20;
  const foe = s.sides.b.units[0]!;
  foe.hp = foe.maxHp = 500;
  return s;
}
const plays = (s: CombatState, id: string) =>
  legalActions(db, s).filter(
    (a): a is Extract<Action, { type: 'play' }> => a.type === 'play' && a.card === id,
  );
/** the ways to play a card that scrap companions to make room (it can also be played as it is, last: DECISIONS #405) */
const scraps = (s: CombatState, id: string) => {
  const all = plays(s, id);
  expect(all.at(-1)?.release, `${id} can be played as it is`).toBeUndefined();
  return all.filter((a) => a.release !== undefined);
};
const play = (s: CombatState, id: string): CombatState => {
  const act = plays(s, id)[0];
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const allies = (s: CombatState) => s.sides.a.units.filter((u) => u.kind === 'ally');
const asList = (r: string | string[] | undefined) =>
  r === undefined ? [] : Array.isArray(r) ? r : [r];

describe('frames', () => {
  it('a Heavy takes 2 slots: with the starting Drone the board is full', () => {
    let s = play(fight(['build-enforcer', 'deploy-drone']), 'T0');
    expect(allies(s).map((u) => u.def)).toEqual(['drone', 'enforcer']);
    // a Light summon now has to scrap one of them
    const ways = scraps(s, 'T1');
    expect(ways.length).toBe(2);
    for (const w of ways) expect(asList(w.release)).toHaveLength(1);
    s = applyAction(
      db,
      s,
      ways.find((w) => w.release === allies(s)[1]!.id)!,
    ).state;
    expect(allies(s).map((u) => u.def)).toEqual(['drone', 'patrol-drone']);
  });

  it('a Heavy on three Light companions scraps any two of them, never one or all three', () => {
    let s = play(play(fight(['spare-parts', 'spare-parts', 'build-enforcer']), 'T0'), 'T1');
    expect(allies(s)).toHaveLength(3);
    const ways = scraps(s, 'T2');
    expect(ways).toHaveLength(3);
    for (const w of ways) expect(asList(w.release)).toHaveLength(2);
    s = applyAction(db, s, ways[0]!).state;
    expect(allies(s)).toHaveLength(2);
    expect(allies(s).some((u) => u.def === 'enforcer')).toBe(true);
  });

  it('a Colossal on a full board scraps every companion: one way to play it', () => {
    const s = play(fight(['build-enforcer', 'war-engine']), 'T0');
    const ways = scraps(s, 'T1');
    expect(ways).toHaveLength(1);
    expect(asList(ways[0]!.release).sort()).toEqual(
      allies(s)
        .map((u) => u.id)
        .sort(),
    );
    const after = applyAction(db, s, ways[0]!);
    expect(allies(after.state).map((u) => u.def)).toEqual(['war-engine']);
    expect(after.events.filter((e) => e.type === 'died' && e.released)).toHaveLength(2);
  });

  it('a wrong set of companions to scrap is refused', () => {
    const s = play(fight(['build-enforcer', 'war-engine']), 'T0');
    const drone = allies(s)[0]!.id;
    expect(() => applyAction(db, s, { type: 'play', card: 'T1', release: drone })).toThrow();
  });

  it('a card that summons several needs room for all of them (Drone Carrier)', () => {
    const s = fight(['drone-carrier']);
    const ways = scraps(s, 'T0');
    expect(ways).toHaveLength(1);
    expect(asList(ways[0]!.release)).toEqual([allies(s)[0]!.id]);
    const after = applyAction(db, s, ways[0]!).state;
    expect(allies(after).map((u) => u.def)).toEqual([
      'patrol-drone',
      'patrol-drone',
      'patrol-drone',
    ]);
  });

  it('a card whose summons do not all fit can be played as it is: what fits comes, the rest does not (DECISIONS #405)', () => {
    // Drone Carrier makes three Patrol Drones; beside the starting Drone only two fit
    const s = fight(['drone-carrier']);
    expect(summonsThatFit(db, s.sides.a, db.cards['drone-carrier']!)).toEqual({ fit: 2, total: 3 });
    const asIs = plays(s, 'T0').at(-1)!;
    expect(asIs.release).toBeUndefined();
    const after = applyAction(db, s, asIs).state;
    expect(allies(after).map((u) => u.def)).toEqual(['drone', 'patrol-drone', 'patrol-drone']);
  });

  it('a summon from an Aura only fills free slots (Mass Production beside a Colossal)', () => {
    let s = fight(['mass-production', 'war-engine']);
    s = play(s, 'T0');
    s = play(s, 'T1'); // scraps the Drone
    s = applyAction(db, s, { type: 'endTurn' }).state;
    // (the enemy turn passes, then a new turn begins: no room for a Patrol Drone)
    while (s.active !== 'a' && !s.winner) s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(allies(s).map((u) => u.def)).toEqual(['war-engine']);
  });

  it('other heroes keep one companion per slot (the Hunter)', () => {
    const s = fight(['summon-pup', 'summon-pup'], 'hunter');
    expect(plays(s, 'T0').every((w) => w.release === undefined)).toBe(true);
  });

  it('the card and the screen say how big a machine is', () => {
    expect(cardText(db, db.cards['build-enforcer']!)).toContain('Heavy: 2 slots');
    expect(cardText(db, db.cards['war-engine']!)).toContain('Colossal: 3 slots');
    expect(cardText(db, db.cards['deploy-drone']!)).not.toContain('slots');
  });
});

describe('Salvage', () => {
  it('the machine built from scrap takes their Might and Primed, and half their HP as max HP', () => {
    let s = play(fight(['spare-parts', 'war-engine']), 'T0');
    const [drone, micro] = allies(s);
    drone!.statuses.might = 2;
    drone!.statuses.vigor = 3;
    micro!.statuses.vigor = 1;
    const hp = drone!.hp + micro!.hp;
    s = play(s, 'T1'); // a Colossal: both go
    const engine = allies(s).find((u) => u.def === 'war-engine')!;
    expect(engine.statuses.might).toBe(2);
    expect(engine.statuses.vigor).toBe(4);
    expect(engine.maxHp).toBe(22 + Math.floor(hp / 2));
    expect(engine.hp).toBe(engine.maxHp);
  });

  it('a summon with room to spare takes nothing', () => {
    const s = play(fight(['build-enforcer']), 'T0');
    expect(allies(s).find((u) => u.def === 'enforcer')!.maxHp).toBe(12);
  });

  it('"dies or is scrapped" Auras hear of a scrapped companion (Salvage Rights)', () => {
    let s = play(fight(['salvage-rights', 'build-enforcer', 'war-engine']), 'T0');
    s = play(s, 'T1');
    const hand = s.sides.a.hand.length;
    s = play(s, 'T2'); // scraps the Drone and the Enforcer
    expect(s.sides.a.hand.length).toBe(hand - 1 + 2);
  });
});

describe('the new Engineer cards', () => {
  it('Particle Cannon deals 8, plus 6 per companion slot filled', () => {
    const s = play(fight(['build-enforcer', 'particle-cannon']), 'T0'); // 3 slots
    const foe = s.sides.b.units[0]!;
    const before = foe.hp + foe.barrier;
    const after = applyAction(db, s, { type: 'play', card: 'T1', target: foe.id }).state;
    const f = after.sides.b.units[0]!;
    expect(before - (f.hp + f.barrier)).toBe(8 + 18);
  });

  it('Arc Welder grows the biggest companion', () => {
    let s = play(fight(['build-enforcer', 'welding-arc']), 'T0');
    const drone = allies(s).find((u) => u.def === 'drone')!.maxHp;
    s = applyAction(db, s, { type: 'play', card: 'T1', target: s.sides.b.units[0]!.id }).state;
    expect(allies(s).find((u) => u.def === 'enforcer')!.maxHp).toBe(15);
    expect(allies(s).find((u) => u.def === 'drone')!.maxHp).toBe(drone);
  });

  it('Full Salvo charges everyone, then the companions strike at once with it', () => {
    const s = fight(['full-salvo']);
    const after = applyAction(db, s, plays(s, 'T0')[0]!);
    const foe = after.state.sides.b.units[0]!;
    const hero = after.state.sides.a.units.find((u) => u.kind === 'hero')!;
    expect(hero.statuses.vigor).toBe(5); // waits for the next Attack card
    expect(allies(after.state)[0]!.statuses.vigor ?? 0).toBe(0); // the Drone spent it
    expect(500 - foe.hp - (s.sides.b.units[0]!.barrier - foe.barrier)).toBe(3 + 5);
  });

  it('Targeting Uplink: every Attack charges the companions', () => {
    let s = play(fight(['targeting-uplink', 'pulse-pistol']), 'T0');
    s = applyAction(db, s, { type: 'play', card: 'T1', target: s.sides.b.units[0]!.id }).state;
    expect(allies(s)[0]!.statuses.vigor).toBe(2);
  });

  it('a Spotter Drone marks the front enemy', () => {
    const s = play(fight(['deploy-spotter']), 'T0');
    const foe = s.sides.b.units[0]!.id;
    const events = applyAction(db, s, { type: 'endTurn' }).events;
    expect(
      events.some(
        (e) => e.type === 'status' && e.target === foe && e.status === 'exposed' && e.amount > 0,
      ),
    ).toBe(true);
  });

  it('a Bulwark Walker shields the Engineer at the end of the turn', () => {
    const s = play(fight(['build-bulwark-walker']), 'T0');
    expect(allies(s).find((u) => u.def === 'bulwark-walker')?.taunt).toBe(true);
    const events = applyAction(db, s, { type: 'endTurn' }).events;
    const hero = s.sides.a.units.find((u) => u.kind === 'hero')!;
    expect(events.some((e) => e.type === 'barrier' && e.target === hero.id && e.amount === 4)).toBe(
      true,
    );
  });

  it('Dreadnought hits every enemy', () => {
    const { state } = createCombat(db, {
      seed: 'frames-dread',
      a: { hero: 'engineer', deck: RIFTWALKERS.engineer.starter },
      b: { enemies: ['squire', 'squire'] },
    });
    let s = clone(state);
    s.sides.a.hand = [{ id: 'T0', card: 'dreadnought' }];
    s.sides.a.mana = 9;
    s = play(s, 'T0'); // scraps the Drone
    const events = applyAction(db, s, { type: 'endTurn' }).events;
    const struck = new Set(
      events
        .filter((e) => e.type === 'damage' && e.amount === 6)
        .map((e) => 'target' in e && e.target),
    );
    for (const foe of s.sides.b.units) expect(struck.has(foe.id)).toBe(true);
  });

  it('a Generator powers your next turn while it stands, and makes no Mana now', () => {
    let s = fight(['build-generator']);
    s.sides.a.mana = 2;
    s = play(s, 'T0');
    expect(s.sides.a.mana).toBe(0);
    // (it stands behind the Drone; made sturdy so the enemy can't break it first)
    const gen = allies(s).find((u) => u.def === 'generator')!;
    gen.hp = gen.maxHp = 999;
    s = applyAction(db, s, { type: 'endTurn' }).state;
    while (s.active !== 'a' && !s.winner) s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.mana).toBe(s.sides.a.maxMana + 1);
  });

  it('Schematics puts the card you choose from your draw pile into your hand', () => {
    let s = fight(['schematics']);
    const want = s.sides.a.draw.at(-1)!; // the bottom of the pile, never the next card anyway
    s = play(s, 'T0');
    expect(s.pending?.kind).toBe('topdeck');
    s = applyAction(db, s, { type: 'pick', cards: [want.id] }).state;
    expect(s.sides.a.hand.some((c) => c.id === want.id)).toBe(true);
  });

  it('Battery Pack gives 1 Mana and is consumed', () => {
    let s = fight(['battery-pack']);
    s.sides.a.mana = 0;
    s = play(s, 'T0');
    expect(s.sides.a.mana).toBe(1);
    expect(s.sides.a.exhausted.some((c) => c.id === 'T0')).toBe(true);
  });

  it('the retired cards still load as their closest card', () => {
    for (const id of ['nanoswarm', 'drone-apotheosis', 'overload', 'mob-rule'])
      expect(db.cards[id]).toBeUndefined();
  });
});
