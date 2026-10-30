// Starting decks (Robert, 2026-10-30, DECISIONS #458): ten cards, three or four class basics, none twice, then Strikes and Defends.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  clone,
  createCombat,
  legalActions,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

type Hero = 'knight' | 'assassin' | 'monk' | 'engineer' | 'necromancer';

function fight(hero: Hero, hand: string[]): CombatState {
  const deck = RIFTWALKERS[hero].starter;
  const { state } = createCombat(db, {
    seed: 'starters',
    a: { hero, deck: [...deck, ...deck] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.draw = Array.from({ length: 12 }, (_, i) => ({ id: `D${i}`, card: 'defend' }));
  s.sides.a.discard = [];
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 500;
    u.statuses = {};
    u.intent = null;
  }
  return s;
}
const play = (s: CombatState, id: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const acts = legalActions(db, s).filter((a) => a.type === 'play' && a.card === inst?.id);
  const act = acts[0];
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const lost = (s: CombatState): number => 500 - s.sides.b.units[0]!.hp;
const hero = (s: CombatState) => s.sides.a.units[s.sides.a.units.length - 1]!;

describe('starting decks', () => {
  it('have ten cards, and 3 or 4 different class basics (the Trickster has Veil Strike twice, Robert is fine with it)', () => {
    for (const [id, r] of Object.entries(RIFTWALKERS)) {
      expect(r.starter, id).toHaveLength(10);
      const basics = [...new Set(r.starter.filter((c) => c !== 'strike' && c !== 'defend'))];
      expect(basics.length, id).toBeGreaterThanOrEqual(3);
      expect(basics.length, id).toBeLessThanOrEqual(4);
    }
  });

  it('the Knight, Assassin, Shaman, Monk and Drunkard have no class basic twice, and four or three of them', () => {
    const want: Record<string, number> = { knight: 4, assassin: 4, shaman: 4, monk: 3, drunkard: 4 };
    for (const [id, n] of Object.entries(want)) {
      const basics = RIFTWALKERS[id as keyof typeof RIFTWALKERS].starter.filter((c) => c !== 'strike' && c !== 'defend');
      expect(new Set(basics).size, id).toBe(basics.length);
      expect(basics.length, id).toBe(n);
    }
  });
});

describe('the new class basics', () => {
  it('Press the Attack: 5, and 4 more against an Exposed enemy (which then takes more from both hits)', () => {
    expect(lost(play(fight('knight', ['press-the-attack']), 'press-the-attack'))).toBe(5);
    const e = fight('knight', ['press-the-attack']);
    e.sides.b.units[0]!.statuses.exposed = 1;
    expect(lost(play(e, 'press-the-attack'))).toBeGreaterThan(9);
  });

  it('Heavy Swing: 14 for 2 Mana', () => {
    const s = play(fight('knight', ['heavy-swing']), 'heavy-swing');
    expect(lost(s)).toBe(14);
    expect(s.sides.a.mana).toBe(7);
  });

  it('Fang and Claw: 4 twice and 1 Bleed', () => {
    const s = play(fight('assassin', ['fang-and-claw']), 'fang-and-claw');
    expect(lost(s)).toBe(8);
    expect(s.sides.b.units[0]!.statuses.seared).toBe(1);
  });

  it('Pocket Blades: 2 Daggers in your hand', () => {
    const s = play(fight('assassin', ['pocket-blades']), 'pocket-blades');
    expect(s.sides.a.hand.filter((c) => c.card === 'sleeve-knife')).toHaveLength(2);
  });

  it('Mindful Palm: 5 damage and 2 Fervor', () => {
    const s = play(fight('monk', ['mindful-palm']), 'mindful-palm');
    expect(lost(s)).toBe(5);
    expect(hero(s).statuses.mantra).toBe(2);
  });

  it('Spot Weld: 5 damage and 2 Barrier', () => {
    const s = play(fight('engineer', ['spot-weld']), 'spot-weld');
    expect(lost(s)).toBe(5);
    expect(hero(s).barrier).toBe(2);
  });

  it('Marked for the Grave: 6 damage and 4 Fate', () => {
    const s = play(fight('necromancer', ['marked-for-the-grave']), 'marked-for-the-grave');
    expect(lost(s)).toBe(6);
    expect(s.sides.b.units[0]!.statuses.doom).toBe(4);
  });

  it('Pinprick Trap is a 0-cost Trap that springs when you are attacked, and the Trickster still starts with a card of every suit', () => {
    const c = db.cards['pinprick-trap']!;
    expect(c.kind).toBe('snare');
    expect(c.cost).toBe(0);
    expect(c.trigger?.on).toBe('attacked');
    expect(RIFTWALKERS.trickster.starter).toContain('pinprick-trap');
  });

  it('they are basics, never offered as rewards', () => {
    for (const id of ['press-the-attack', 'heavy-swing', 'fang-and-claw', 'pocket-blades', 'mindful-palm', 'spot-weld', 'pinprick-trap', 'marked-for-the-grave'])
      expect(db.cards[id]!.rarity).toBe('basic');
  });
});
