import { describe, expect, it } from 'vitest';
import {
  applyAction,
  createCombat,
  previewCardDamage,
  type CombatState,
  type Unit,
  type CombatDb,
} from '@sr/combat';
import { COMBAT_DB as original, HEARTS } from './index';
const db: CombatDb = {
  ...original,
  cards: {
    ...original.cards,
    heartAura: {
      id: 'heartAura',
      name: 'Recurring guard and damage',
      kind: 'power',
      rarity: 'common',
      cost: 0,
      target: 'none',
      effects: [
        {
          op: 'power',
          when: 'turnEnd',
          ops: [
            { op: 'barrier', amount: 40, to: 'self' },
            { op: 'damage', amount: 40, to: 'allFoes' },
          ],
        },
      ],
    },
    heartTrap: {
      id: 'heartTrap',
      name: 'Reactive guard and damage',
      kind: 'snare',
      rarity: 'common',
      cost: 0,
      target: 'none',
      trigger: { on: 'foeTurn' },
      effects: [
        { op: 'barrier', amount: 40, to: 'self' },
        { op: 'damage', amount: 40, to: 'allFoes' },
      ],
    },
    heartHit: {
      id: 'heartHit',
      name: 'Hit',
      kind: 'attack',
      rarity: 'common',
      cost: 0,
      target: 'foe',
      effects: [{ op: 'damage', amount: 40, to: 'target' }],
    },
    heartSpell: {
      id: 'heartSpell',
      name: 'Spell',
      kind: 'skill',
      rarity: 'common',
      cost: 0,
      target: 'foe',
      effects: [{ op: 'damage', amount: 40, to: 'target' }],
    },
    heartGuard: {
      id: 'heartGuard',
      name: 'Guard',
      kind: 'skill',
      rarity: 'common',
      cost: 0,
      target: 'none',
      effects: [{ op: 'barrier', amount: 40, to: 'self' }],
    },
    heartPay: {
      id: 'heartPay',
      name: 'Pay',
      kind: 'skill',
      rarity: 'common',
      cost: 0,
      target: 'none',
      effects: [{ op: 'loseHp', amount: 80, to: 'self' }],
    },
    heartGrow: {
      id: 'heartGrow',
      name: 'Grow',
      kind: 'skill',
      rarity: 'common',
      cost: 0,
      target: 'none',
      effects: [{ op: 'maxHp', amount: 1, to: 'self' }],
    },
  },
};
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const start = (heart: string, card = 'heartHit', hp = 100, maxHp = 100) =>
  createCombat(db, {
    seed: 'heart-test',
    a: {
      hero: 'knight',
      deck: Array<string>(8).fill(card),
      boons: [heart],
      hp,
      maxHp,
      ...(heart === 'gluttons-heart' ? { maxHpBeforeHeart: 101 } : {}),
    },
    b: { enemies: ['squire', 'squire'] },
  }).state;
const play = (s: CombatState, target?: string) =>
  applyAction(db, s, { type: 'play', card: s.sides.a.hand[0]!.id, ...(target ? { target } : {}) })
    .state;
describe("Warden's Hearts", () => {
  it('never grant Mana', () => {
    for (const h of HEARTS) expect(h.mana ?? 0, h.id).toBe(0);
  });
  it('Blood boosts direct card damage and previews, with three opening turns of Faltering', () => {
    for (const card of ['heartHit', 'heartSpell']) {
      const s = start('blood-heart', card);
      const foe = s.sides.b.units[0]!;
      foe.hp = foe.maxHp = 1000;
      expect(hero(s).statuses.faltering).toBe(3);
      const expected = card === 'heartHit' ? 37 : 50;
      expect(previewCardDamage(db, s, s.sides.a.hand[0]!.id, foe.id).get(0)?.lo).toBe(expected);
      expect(play(s, foe.id).sides.b.units[0]!.hp).toBe(1000 - expected);
      delete hero(s).statuses.faltering;
      expect(play(s, foe.id).sides.b.units[0]!.hp).toBe(950);
    }
  });
  it('Warded boosts card Barrier with three opening turns of Brittle, matching preview', () => {
    const s = start('warded-heart', 'heartGuard');
    expect(hero(s).statuses.brittle).toBe(3);
    expect(hero(s).statuses.shielded).toBeUndefined();
    expect(hero(s).statuses.plating).toBeUndefined();
    expect(previewCardDamage(db, s, s.sides.a.hand[0]!.id).get(0)?.lo).toBe(37);
    expect(hero(play(s)).barrier).toBe(37);
    delete hero(s).statuses.brittle;
    expect(hero(play(s)).barrier).toBe(50);
  });
  it('Blood does not increase HP payments', () => {
    expect(hero(play(start('blood-heart', 'heartPay'))).hp).toBe(20);
  });
  it.each(['discard', 'exhaustCards'] as const)(
    'Heart bonuses follow %s card callbacks, not the card moving them',
    (op) => {
      const callbackDb: CombatDb = {
        ...db,
        cards: {
          ...db.cards,
          callback: {
            id: 'callback',
            name: 'Callback',
            kind: 'skill',
            rarity: 'common',
            cost: 0,
            target: 'none',
            effects: [],
            onDiscard: [{ op: 'barrier', amount: 40, to: 'self' }],
            onExhaust: [{ op: 'barrier', amount: 40, to: 'self' }],
          },
          mover: {
            id: 'mover',
            name: 'Mover',
            kind: 'skill',
            rarity: 'common',
            cost: 0,
            target: 'none',
            effects: [{ op, amount: 1, random: true }],
          },
        },
      };
      const s = start('warded-heart');
      s.sides.a.hand = [
        { id: 'move', card: 'mover' },
        { id: 'cb', card: 'callback' },
      ];
      expect(hero(applyAction(callbackDb, s, { type: 'play', card: 'move' }).state).barrier).toBe(
        37,
      );
    },
  );
  it.each(['heartAura', 'heartTrap'])(
    '%s retains its card origin for Heart bonuses without becoming an Attack',
    (card) => {
      for (const heart of ['blood-heart', 'warded-heart']) {
        const s = start(heart, card);
        hero(s).statuses.might = 100;
        for (const foe of s.sides.b.units) {
          foe.hp = foe.maxHp = 1000;
          foe.statuses.exposed = 2;
        }
        const active = JSON.parse(JSON.stringify(play(s))) as CombatState;
        const result = applyAction(db, active, { type: 'endTurn' });
        expect(
          result.events
            .filter((e) => e.type === 'damage' && e.source === hero(s).id)
            .map((e) => (e.type === 'damage' ? e.lost + e.blocked : 0)),
        ).toEqual(heart === 'blood-heart' ? [50, 50] : [40, 40]);
        expect(
          result.events.some(
            (e) =>
              e.type === 'barrier' &&
              e.target === hero(s).id &&
              e.amount === (heart === 'warded-heart' ? 37 : 40),
          ),
        ).toBe(true);
      }
    },
  );
  it('Glutton uses the exact underlying max HP when growth rounds down', () => {
    const s = start('gluttons-heart', 'heartGrow', 95, 95);
    const after = play(s);
    expect(hero(after).maxHp).toBe(96);
    expect(hero(after).hp).toBe(96);
    expect(after.sides.a.maxHpGained).toBe(1);
  });
  it('Resurgent stops at half HP and grants a quarter-max Barrier only once', () => {
    const s = start('resurgent-heart', 'heartPay');
    expect(hero(s).statuses.exposed).toBe(3);
    const first = play(s);
    expect(hero(first).hp).toBe(50);
    expect(hero(first).barrier).toBe(25);
    expect(hero(first).rise).toBeUndefined();
    hero(first).hp = 100;
    const second = play(first);
    expect(hero(second).hp).toBe(20);
    expect(hero(second).barrier).toBe(25);
  });
  it('Resurgent never heals a hero starting below half HP', () => {
    const s = start('resurgent-heart', 'heartPay', 30);
    const after = play(s);
    expect(hero(after).hp).toBe(30);
    expect(hero(after).barrier).toBe(25);
  });
});
