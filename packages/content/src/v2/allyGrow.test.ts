// A heal never mends a companion: it grows it, as much max HP and HP (DECISIONS #356).

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  previewCardDamage,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[]): CombatState {
  const { state } = createCombat(db, {
    seed: 'grow-test',
    a: { hero: 'engineer', deck: [...RIFTWALKERS.engineer.starter, ...RIFTWALKERS.engineer.starter] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  return s;
}
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === id && (!target || ('target' in a && a.target === target)),
  );
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const allies = (s: CombatState) => s.sides.a.units.filter((u) => u.kind === 'ally');

describe('healing a companion grows it', () => {
  it('a hurt drone gains the whole heal as max HP and HP', () => {
    let s = play(fight(['deploy-drone', 'sync-pulse']), 'T0');
    const drone = allies(s)[0]!;
    drone.hp = drone.maxHp - 2;
    const { hp, maxHp } = drone;
    s = play(s, 'T1'); // heal 2 to all friends
    const after = allies(s)[0]!;
    expect(after.maxHp).toBe(maxHp + 2);
    expect(after.hp).toBe(hp + 2);
  });

  it('the hero still only heals up to max HP', () => {
    let s = fight(['sync-pulse']);
    const hero = s.sides.a.units.find((u) => u.kind === 'hero')!;
    const max = hero.maxHp;
    hero.hp = max - 1;
    s = play(s, 'T0');
    const after = s.sides.a.units.find((u) => u.kind === 'hero')!;
    expect(after.hp).toBe(max);
    expect(after.maxHp).toBe(max);
  });

  it("Core cashes in its biggest companion (DECISIONS #358)", () => {
    let s = play(fight(['build-enforcer', 'heavy-hitter', 'reactor-meltdown']), 'T0'); // an 11 HP Enforcer (Heavy: it and the Drone fill the 3 slots)
    const foe = () => s.sides.b.units[0]!;
    foe().hp = foe().maxHp = 200;
    foe().barrier = 0;
    s = play(s, 'T1');
    expect(foe().hp).toBe(189); // its max HP
    const enforcer = allies(s).find((u) => u.maxHp === 11)!; // (not the Drone Rivet starts with)
    s = play(s, 'T2', enforcer.id);
    expect(foe().hp).toBe(189 - 11); // its HP, and it is gone
    expect(allies(s).some((u) => u.id === enforcer.id && u.hp > 0)).toBe(false);
  });

  it("Reactor Meltdown's number in hand reads the ally it is aimed at", () => {
    const s = play(fight(['build-enforcer', 'reactor-meltdown']), 'T0');
    const enforcer = allies(s).find((u) => u.maxHp === 11)!;
    const aimed = previewCardDamage(db, s, 'T1', enforcer.id).get(0);
    expect(aimed?.lo).toBe(11);
    expect(previewCardDamage(db, s, 'T1').get(0)).toBeUndefined();
  });

  it("a companion's strike spends its Primed (DECISIONS #361)", () => {
    let s = play(fight(['jumpstart']), 'T0'); // 3 Primed on the Drone Rivet starts with
    const drone = allies(s)[0]!;
    expect(drone.statuses.vigor).toBe(3);
    const foe = s.sides.b.units[0]!;
    foe.hp = foe.maxHp = 200;
    foe.barrier = 0;
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.b.units[0]!.hp).toBe(200 - 3 - 3); // its 3, and the 3 Primed
    expect(s.sides.a.units.find((u) => u.id === drone.id)?.statuses.vigor ?? 0).toBe(0);
  });

  it('the Engineer keeps four "act now" cards, each acting once (DECISIONS #361, #383)', () => {
    const acts = (ops: readonly { op: string; ops?: unknown }[]): number =>
      ops.reduce(
        (n, o) => n + (o.op === 'actAllies' ? 1 : 0) + (Array.isArray(o.ops) ? acts(o.ops) : 0),
        0,
      );
    const rivet = Object.values(db.cards).filter((c) => c.hero === 'engineer' && !c.id.endsWith('+'));
    const withAct = rivet.filter((c) => acts(c.effects) > 0);
    expect(withAct.map((c) => c.id).sort()).toEqual(['assemble', 'command-chip', 'full-salvo', 'relay-strike']);
    for (const c of withAct) expect(acts(c.effects)).toBe(1);
  });

  it('says so on the card', () => {
    expect(cardText(db, db.cards['sync-pulse']!)).toContain('Your companions gain 2 max HP');
  });
});
