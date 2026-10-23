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
    const s0 = createFight('maren').state;
    const hp0 = heroUnit(s0).hp;
    const s = play('maren', 'rift-collapse');
    for (const u of s.sides.b.units) expect(u.hp).toBe(160);
    expect(heroUnit(s).hp).toBe(hp0 - 15);
  });

  it('The Last Toll puts 25 Fate on every enemy', () => {
    const s = play('mire', 'the-last-toll');
    for (const u of s.sides.b.units) expect(u.statuses.doom).toBe(25);
  });

  it('The Drowned King summons the king and gives every friend Might', () => {
    const s = play('mire', 'the-drowned-king');
    expect(s.sides.a.units.some((u) => u.def === 'drowned-king')).toBe(true);
    for (const u of s.sides.a.units) expect(u.statuses.might).toBeGreaterThanOrEqual(2);
  });

  it('Dawn Incarnate deals three times your Barrier to everything', () => {
    const s = play('maren', 'dawn-incarnate', (st) => {
      heroUnit(st).barrier = 10;
    });
    for (const u of s.sides.b.units) expect(u.hp).toBe(200 - 30);
  });

  it('Death Warrant takes three HP per Seared', () => {
    const s = play('quill', 'death-warrant', (st) => {
      st.sides.b.units[0]!.statuses.seared = 5;
    });
    expect(s.sides.b.units[0]!.hp).toBe(200 - 15);
  });

  it('Birth of a Star gives Lumen, cards and Barrier', () => {
    const s0 = createFight('astra').state;
    const s = play('astra', 'birth-of-a-star', (st) => {
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
      const hero = (RIFTWALKERS[c.hero as HeroId] ? c.hero : 'maren') as HeroId;
      const s = play(hero, c.id);
      expect(
        s.sides.a.discard.some((x) => x.card === c.id),
        `${c.id} is not discarded`,
      ).toBe(false);
    }
  });
});
