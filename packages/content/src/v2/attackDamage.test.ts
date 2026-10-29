// Might, Faltering, Exposed and the other "attack" statuses only touch attack damage: an Attack card, or a unit's own strike. An
// Aura, a totem, a Trap or a potion deals the number printed (DECISIONS #376), as their status texts and Slay the Spire say.

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(
  hand: string[],
  hero: 'knight' | 'hunter' | 'shaman' | 'drunkard' = 'drunkard',
): CombatState {
  const deck = RIFTWALKERS[hero].starter;
  const { state } = createCombat(db, {
    seed: `attack-damage-${hero}`,
    a: { hero, deck: [...deck, ...deck] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.barrier = 0;
    u.statuses = {};
  }
  return s;
}
const play = (s: CombatState, id: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === inst?.id);
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState) => s.sides.b.units[0]!;

describe('attack statuses only touch attack damage', () => {
  it('Might adds to a Strike, not to The Glass Palace', () => {
    let s = fight(['the-glass-palace', 'chaser', 'strike']);
    hero(s).statuses.might = 3;
    s = play(s, 'the-glass-palace');
    s = play(s, 'chaser'); // lose 2 HP: The Glass Palace deals its 3 to every enemy
    expect(foe(s).hp).toBe(200 - 3);
    s = play(s, 'strike');
    expect(foe(s).hp).toBe(200 - 3 - (6 + 3));
  });

  it('Exposed on the enemy makes a Strike hit harder, not Blood Fire', () => {
    let s = fight(['the-glass-palace', 'chaser', 'strike']);
    foe(s).statuses.exposed = 2;
    s = play(s, 'the-glass-palace');
    s = play(s, 'chaser');
    expect(foe(s).hp).toBe(200 - 3);
    s = play(s, 'strike');
    expect(foe(s).hp).toBe(200 - 3 - 9);
  });

  it('Faltering on you shrinks a Strike, not Blood Fire', () => {
    let s = fight(['the-glass-palace', 'chaser', 'strike']);
    hero(s).statuses.faltering = 2;
    s = play(s, 'the-glass-palace');
    s = play(s, 'chaser');
    expect(foe(s).hp).toBe(200 - 3);
    s = play(s, 'strike');
    expect(foe(s).hp).toBe(200 - 3 - 4);
  });

  it('Armored wears thin from a Strike, not from The Glass Palace', () => {
    let s = fight(['the-glass-palace', 'chaser', 'strike']);
    foe(s).statuses.armored = 3;
    s = play(s, 'the-glass-palace');
    s = play(s, 'chaser');
    expect(foe(s).statuses.armored).toBe(3);
    s = play(s, 'strike');
    expect(foe(s).statuses.armored).toBe(2);
  });

  it('Reflect sends back what a Strike put into its Barrier, not what The Glass Palace did', () => {
    let s = fight(['the-glass-palace', 'chaser', 'strike']);
    foe(s).barrier = 20;
    foe(s).statuses.reflect = 1;
    s = play(s, 'the-glass-palace');
    const hp = hero(s).hp;
    s = play(s, 'chaser');
    expect(foe(s).barrier).toBe(17);
    expect(hero(s).hp).toBe(hp - 2); // only Chaser's own 2
    s = play(s, 'strike');
    expect(hero(s).hp).toBe(hp - 2 - 6);
  });

  // (the Shaman's Hawk command, DECISIONS #418: a spirit acting, not an attack)
  it('totems deal the same with or without Might on you and Exposed on the enemy', () => {
    const lost = (buffed: boolean): number => {
      let s = fight(['thunderbirds-cry'], 'shaman');
      if (buffed) {
        hero(s).statuses.might = 5;
        foe(s).statuses.exposed = 3;
      }
      // (a card commands the Thunderbird: 8 to every enemy, DECISIONS #430)
      const dive = s.sides.a.hand.find((c) => c.card === 'thunderbirds-cry')!;
      s = applyAction(db, s, { type: 'play', card: dive.id }).state;
      return 200 - foe(s).hp;
    };
    expect(lost(false)).toBeGreaterThan(0);
    expect(lost(true)).toBe(lost(false));
  });

  it('a companion that strikes through a Skill is attacking: Might adds, and Thorns hurt it', () => {
    let s = fight(['savage-command'], 'hunter');
    const hound = s.sides.a.units.find((u) => u.kind === 'ally')!;
    hound.statuses.might = 2;
    foe(s).statuses.thorns = 3;
    s = play(s, 'savage-command');
    // the Hound strikes for 4 + 2 now, and takes the Thorns
    expect(foe(s).hp).toBe(200 - 6);
    expect(s.sides.a.units.find((u) => u.id === hound.id)!.hp).toBe(hound.hp - 3);
  });
});
