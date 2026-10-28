// The Drunkard's Stagger (DECISIONS #393): a drunk's swing lands on a random enemy and hits harder for it.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[], hangover = 0, seed = 'stagger-test'): CombatState {
  const { state } = createCombat(db, {
    seed,
    a: { hero: 'drunkard', deck: [...RIFTWALKERS.drunkard.starter] },
    b: { enemies: ['squire', 'squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `S${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.statuses = {};
  }
  const hero = s.sides.a.units.find((u) => u.kind === 'hero')!;
  hero.barrier = 0;
  if (hangover) hero.statuses.hangover = hangover;
  return s;
}
const play = (s: CombatState, id: string) => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === inst?.id);
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!);
};
const lost = (s: CombatState) => s.sides.b.units.reduce((n, u) => n + (200 - u.hp), 0);

describe('Stagger', () => {
  it('needs no target, says Stagger, and its hit lands on one enemy', () => {
    expect(db.cards['drunken-lurch']?.target).toBe('none');
    expect(cardText(db, db.cards['drunken-lurch']!)).toBe(
      'Stagger. Deal 12 damage to a random enemy.',
    );
    const s = play(fight(['drunken-lurch']), 'drunken-lurch').state;
    expect(lost(s)).toBe(12);
    expect(s.sides.b.units.filter((u) => u.hp < 200)).toHaveLength(1);
  });

  it('Drunken Master: 2 Barrier for each Stagger card played, nothing for others', () => {
    let s = play(
      fight(['drunken-master', 'haphazard-hook', 'hammer-swing']),
      'drunken-master',
    ).state;
    const hero = () => s.sides.a.units.find((u) => u.kind === 'hero')!;
    s = play(s, 'haphazard-hook').state;
    expect(hero().barrier).toBe(2);
    const inst = s.sides.a.hand.find((c) => c.card === 'hammer-swing')!;
    const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === inst.id)!;
    s = applyAction(db, s, act).state;
    expect(hero().barrier).toBe(2);
  });

  it('Blind Drunk hits twice, and once more for every point of Hangover', () => {
    const hits = (h: number) => {
      const s0 = fight(['blind-drunk'], h);
      const hero = s0.sides.a.units.find((u) => u.kind === 'hero')!.id;
      return play(s0, 'blind-drunk').events.filter(
        (e) => e.type === 'damage' && e.source === hero && e.target !== hero,
      ).length;
    };
    expect(hits(0)).toBe(2);
    expect(hits(3)).toBe(5);
  });

  it('Free-for-All: three hits, each at an enemy of its own choosing (two enemies both get hit over a few seeds)', () => {
    let split = false;
    for (let i = 0; i < 12 && !split; i++) {
      const s0 = fight(['free-for-all'], 0, `ffa-${i}`);
      const s = play(s0, 'free-for-all').state;
      expect(lost(s)).toBe(21);
      split = s.sides.b.units.every((u) => u.hp < 200);
    }
    expect(split).toBe(true);
  });

  it('Stumble: 9 to a random enemy, 4 Barrier and 2 Hangover', () => {
    const s = play(fight(['stumble']), 'stumble').state;
    const hero = s.sides.a.units.find((u) => u.kind === 'hero')!;
    expect(lost(s)).toBe(9);
    expect(hero.barrier).toBe(4);
    expect(hero.statuses.hangover).toBe(2);
  });

  it('the utility cards: Rummage the Bin asks for a Foresee pick, Sway gives 7 Barrier and a card', () => {
    expect(play(fight(['rummage-the-bin']), 'rummage-the-bin').state.pending?.kind).toBe('scry');
    const s0 = fight(['sway']);
    const s = play(s0, 'sway').state;
    expect(s.sides.a.units.find((u) => u.kind === 'hero')!.barrier).toBe(7);
    expect(s.sides.a.hand.length).toBe(s0.sides.a.hand.length);
  });
});
