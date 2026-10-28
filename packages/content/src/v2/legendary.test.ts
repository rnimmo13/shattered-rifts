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
import { COMBAT_DB as db, RIFTWALKERS, SHELVED_LEGENDARIES, type HeroId } from './index';

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
    // 25 from the card and 3 from Grave Chill on each; the card is consumed, so Grave Chill adds 3 to one of them
    for (const u of s.sides.b.units) expect(u.statuses.doom).toBeGreaterThanOrEqual(25);
    const total = s.sides.b.units.reduce((n, u) => n + (u.statuses.doom ?? 0), 0);
    expect(total).toBe(28 * s.sides.b.units.length + 3);
  });

  it('The Drowned King summons the king and gives every friend Might', () => {
    const s = play('necromancer', 'the-drowned-king');
    expect(s.sides.a.units.some((u) => u.def === 'drowned-king')).toBe(true);
    for (const u of s.sides.a.units) expect(u.statuses.might).toBeGreaterThanOrEqual(1);
  });

  it('every Aura-type shelved legendary lands on the board and stays', () => {
    for (const c of Object.values(db.cards).filter(
      (x) => SHELVED_LEGENDARIES.includes(x.id) && x.kind === 'power',
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

describe('the shelved Legendary cards (DECISIONS #363)', () => {
  it('each is still playable, as a Rare', () => {
    for (const id of SHELVED_LEGENDARIES) {
      const c = db.cards[id]!;
      expect(c.rarity, id).toBe('rare');
      if (c.kind === 'snare') continue; // a Trap is set, not played for an effect
      const hero = (RIFTWALKERS[c.hero as HeroId] ? c.hero : 'knight') as HeroId;
      play(hero, id);
    }
  });
});
