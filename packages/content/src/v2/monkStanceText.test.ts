import { describe, expect, it } from 'vitest';
import { applyAction, cardText, createCombat, legalActions } from '@sr/combat';
import { COMBAT_DB as db } from './index';

describe('Monk stance bonuses are binary and described accurately', () => {
  for (const upgraded of [false, true]) {
    for (const stance of ['none', 'calm', 'wrath', 'radiant'] as const) {
      for (const id of ['angry-palm', 'final-account', 'still-water', 'settled-mind']) {
        it(`${id}${upgraded ? '+' : ''} while ${stance}`, () => {
          const card = id + (upgraded ? '+' : '');
          const s = createCombat(db, {
            seed: 'monk-stance-text',
            a: { hero: 'monk', deck: ['strike'] },
            b: { hero: 'knight', deck: ['strike'] },
          }).state;
          const hero = s.sides.a.units.find((u) => u.kind === 'hero')!;
          const foe = s.sides.b.units.find((u) => u.kind === 'hero')!;
          hero.statuses = stance === 'none' ? {} : { [stance]: 1 };
          hero.barrier = 0;
          foe.statuses = {};
          foe.barrier = 0;
          foe.hp = foe.maxHp = 1000;
          s.sides.a.mana = 10;
          s.sides.a.hand = [{ id: 'test', card }];
          s.sides.a.draw = Array.from({ length: 10 }, (_, i) => ({ id: `d${i}`, card: 'strike' }));
          const action = legalActions(db, s).find((a) => a.type === 'play' && a.card === 'test');
          expect(action).toBeDefined();
          const result = applyAction(db, s, action!).state;
          const after = result.sides.a.units.find((u) => u.kind === 'hero')!;
          const target = result.sides.b.units.find((u) => u.kind === 'hero')!;
          const text = cardText(db, db.cards[card]!);
          expect(text).not.toMatch(/per (Serene|Fury)|times .*Serene/);
          if (id === 'angry-palm' || id === 'final-account') {
            const base = (id === 'angry-palm' ? 7 : 14) + (upgraded ? 3 : 0);
            const bonus = id === 'angry-palm' ? 6 : 10;
            expect(text).toContain(`${base} damage, or ${base + bonus}`);
            // (Fury doubles; Radiant set here as a plain status was not entered, so it has no first-hit x2.5 and doubles: #792)
            expect(1000 - target.hp).toBe(
              (base + (stance === 'wrath' ? bonus : 0)) *
                (stance === 'wrath' || stance === 'radiant' ? 2 : 1),
            );
          } else if (id === 'still-water') {
            // (Sapped on the enemy since DECISIONS #788: 5, or 9 if Serene; upgraded 7, or 12)
            expect(after.barrier).toBe(0);
            expect(target.statuses.sapped).toBe(
              (upgraded ? 7 : 5) + (stance === 'calm' ? (upgraded ? 5 : 4) : 0),
            );
            expect(result.sides.a.hand).toHaveLength(1);
          } else {
            expect(result.sides.a.hand).toHaveLength(
              (upgraded ? 1 : 0) + (stance === 'calm' ? 3 : 0),
            );
            expect(after.statuses.calm).toBe(1);
            expect(text).toContain('already Serene');
          }
        });
      }
    }
  }
});
