// What each legendary card actually does (cards.test.ts already plays all of them; these check the numbers that matter).

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  chooseAction,
  clone,
  legalActions,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from './index';

function play(hero: HeroId, card: string, tweak?: (s: CombatState) => void): CombatState {
  const { state } = createFight(hero);
  const s = clone(state);
  const sd = s.sides.a;
  sd.hand = [{ id: 'T0', card }];
  sd.mana = 9;
  sd.stars = 9;
  for (const u of s.sides.b.units) u.hp = u.maxHp = 200;
  tweak?.(s);
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === 'T0');
  expect(act, `${card} playable`).toBeTruthy();
  let r = applyAction(db, s, act!).state;
  for (let i = 0; i < 6 && r.pending; i++) r = applyAction(db, r, chooseAction(db, r)).state;
  return r;
}

import { createCombat } from '@sr/combat';
function createFight(hero: HeroId) {
  return createCombat(db, {
    seed: 'legend',
    a: { hero, deck: [...RIFTWALKERS[hero].starter, ...RIFTWALKERS[hero].starter] },
    b: { enemies: ['squire', 'squire'] },
  });
}
const heroUnit = (s: CombatState): Unit => s.sides.a.units[s.sides.a.units.length - 1]!;

describe('legendary effects', () => {
  it('Rift Collapse hits every enemy for 40 and costs 15 HP', () => {
    const s0 = createFight('knight').state;
    const hp0 = heroUnit(s0).hp;
    const s = play('knight', 'rift-collapse');
    for (const u of s.sides.b.units) expect(u.hp).toBe(160);
    expect(heroUnit(s).hp).toBe(hp0 - 15);
  });

  it('The Last Toll puts 25 Fate on every enemy', () => {
    const s = play('necromancer', 'the-last-toll');
    // 25 from the card, plus Mire's Grave Chill trait (4)
    for (const u of s.sides.b.units) expect(u.statuses.doom).toBe(29);
  });

  it('The Drowned King summons the king and gives every friend Might', () => {
    const s = play('necromancer', 'the-drowned-king');
    expect(s.sides.a.units.some((u) => u.def === 'drowned-king')).toBe(true);
    for (const u of s.sides.a.units) expect(u.statuses.might).toBeGreaterThanOrEqual(1);
  });

  it('Dawn Incarnate raises 10 Barrier, then deals twice your Barrier to everything', () => {
    const s = play('knight', 'dawn-incarnate', (st) => {
      heroUnit(st).barrier = 10;
    });
    for (const u of s.sides.b.units) expect(u.hp).toBe(200 - 40);
  });

  it('Death Warrant takes three HP per Seared', () => {
    const s = play('assassin', 'death-warrant', (st) => {
      st.sides.b.units[0]!.statuses.seared = 5;
    });
    expect(s.sides.b.units[0]!.hp).toBe(200 - 15);
  });

  it("Volcano's Birth gives Arcana, cards and Barrier", () => {
    const s0 = createFight('spellblade').state;
    const s = play('spellblade', 'birth-of-a-star', (st) => {
      st.sides.a.stars = 0;
    });
    expect(s.sides.a.stars).toBeGreaterThanOrEqual(8);
    expect(heroUnit(s).barrier).toBeGreaterThanOrEqual(20);
    expect(s.sides.a.hand.length).toBeGreaterThanOrEqual(3);
    expect(s0.sides.a.hand.length).toBeGreaterThan(0);
  });

  it('every Aura-type legendary lands on the board and stays', () => {
    for (const c of Object.values(db.cards).filter(
      (x) => x.rarity === 'legendary' && x.kind === 'power',
    )) {
      const hero = (RIFTWALKERS[c.hero as HeroId] ? c.hero : 'knight') as HeroId;
      const s = play(hero, c.id);
      expect(
        s.sides.a.discard.some((x) => x.card === c.id),
        `${c.id} is not discarded`,
      ).toBe(false);
    }
  });
});

describe('three Legendary cards per Riftwalker', () => {
  it('every Riftwalker owns exactly three, and each is playable', () => {
    for (const hero of Object.keys(RIFTWALKERS) as HeroId[]) {
      const own = Object.values(db.cards).filter(
        (c) => c.hero === hero && c.rarity === 'legendary' && !c.id.endsWith('+'),
      );
      expect(
        own.map((c) => c.id),
        `${hero} legendaries`,
      ).toHaveLength(3);
      for (const c of own) {
        if (c.kind === 'snare') continue; // a Trap is set, not played for an effect
        play(hero, c.id);
      }
    }
  });
});
