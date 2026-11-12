import { describe, expect, it } from 'vitest';
import { legalActions, heroOf } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS } from '@sr/content/v2';
import { Match } from './match';
import { endsSeries } from './series';
import { GAME_MS, SECOND_PLAYER_DRAW, ARENA_START_HP } from './protocol';

const entry = (hero = 'knight') => ({
  hero,
  name: hero,
  deck: Array<string>(20).fill('strike'),
  boons: [],
  tier: 20,
  maxHp: 9999,
});
const pass = (m: Match) => {
  const r = m.submit(m.active, m.log.length + 1, { type: 'endTurn' }, 0);
  expect(r.ok).toBe(true);
};
describe('equal HP Arena and opening compensation', () => {
  it('ends the entire series on a mutual-pass draw', () => {
    expect(endsSeries('passes')).toBe(true);
    expect(endsSeries('win')).toBe(false);
    expect(endsSeries('time')).toBe(false);
  });
  it('starts every class at 1200 in either seat, ignoring campaign HP (#767; 1000 before)', () => {
    expect(ARENA_START_HP).toBe(1200);
    for (const hero of Object.keys(RIFTWALKERS)) {
      const m = new Match('baseline', entry(hero), entry(hero), 0);
      for (const side of ['a', 'b'] as const)
        expect(heroOf(m.state.sides[side])).toMatchObject({ hp: 1200, maxHp: 1200 });
    }
  });
  it('adds one opening card to second seat only, then returns to normal draw', () => {
    const m = new Match('opening', entry(), entry(), 0);
    const first = m.state.sides.a.hand.length;
    expect(SECOND_PLAYER_DRAW).toBe(1);
    pass(m);
    expect(m.state.sides.b.hand.length).toBe(first + 1);
    expect(m.state.sides.b.mana).toBe(m.state.sides.b.maxMana);
    pass(m);
    pass(m);
    expect(m.state.sides.b.hand.length).toBe(COMBAT_DB.heroes.knight!.handSize);
  });
  it('has a 30-minute game limit', () => expect(GAME_MS).toBe(30 * 60000));
  it('draws only on the third consecutive cardless pass by both players, including after replay', () => {
    const m = new Match('passes', entry(), entry(), 0);
    for (let i = 0; i < 5; i++) {
      pass(m);
      expect(m.over).toBeNull();
    }
    const rebuilt = new Match('passes', entry(), entry(), 0);
    for (const x of m.log)
      expect(rebuilt.submit(x.seat, rebuilt.log.length + 1, x.action, 0).ok).toBe(true);
    pass(m);
    pass(rebuilt);
    expect(m.over).toEqual({ winner: 'draw', reason: 'passes' });
    expect(rebuilt.over).toEqual(m.over);
    expect(rebuilt.turns).toEqual(m.turns);
  });
  it('resets a streak when a card is played, even if the opponent keeps passing', () => {
    const m = new Match('reset', entry(), entry(), 0);
    for (let i = 0; i < 4; i++) pass(m);
    const play = legalActions(COMBAT_DB, m.state).find((a) => a.type === 'play')!;
    expect(m.submit(m.active, m.log.length + 1, play, 0).ok).toBe(true);
    expect(m.emptyTurns.a).toBe(0);
    for (let i = 0; i < 4; i++) pass(m);
    expect(m.over).toBeNull();
    pass(m);
    expect(m.over).toBeNull();
    pass(m);
    expect(m.over).toBeNull();
    pass(m);
    expect(m.over).toEqual({ winner: 'draw', reason: 'passes' });
  });
});
