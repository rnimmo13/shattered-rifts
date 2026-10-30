// Balance guard rails (docs/BALANCE.md, "Balance audit" 2026-10-25). The deck optimizer found decks dealing thousands of damage
// in one turn; every one of them was built on a free card that replaces itself, a doubler that can be played again, or a payoff
// that multiplies a number that only grows. These rules keep those shapes out of the card pool, upgrades included.

import { describe, expect, it } from 'vitest';
import type { CardDef, Op } from '@sr/combat';
import { RIFTWALKERS } from './index';
import { V2_CARDS } from './cards';

const playable = V2_CARDS.filter((c) => !c.unplayable && c.source !== 'token');
/** a card that eats other cards for good (Consume, a companion) cannot loop: the deck runs out */
const consumes = (c: CardDef): boolean =>
  c.effects.some(
    (o) =>
      o.op === 'exhaustCards' ||
      o.op === 'sacrifice' ||
      o.op === 'drawLock' ||
      // (a card that costs more every time it is played cannot loop either: Modded)
      (o.op === 'recost' && o.amount > 0),
  );

describe('balance guard rails', () => {
  it('a free card that replaces itself or makes Mana is consumed when played (no infinite loops)', () => {
    const bad: string[] = [];
    for (const c of playable) {
      // (an Aura leaves the deck when it is played, so it cannot be played again either; a card with an Arcana cost is not free:
      // every play spends Arcana, which no free card makes without being consumed, as the Regent's Alignment and Quasar)
      if (
        c.cost !== 0 ||
        c.exhaust ||
        c.x ||
        c.kind === 'power' ||
        consumes(c) ||
        (c.starCost ?? 0) > 0
      )
        continue;
      // cards into the hand: draws, fetches, discovers and cards made in hand (a scaled amount counts as at least one); a junk card
      // made in hand only takes up room (Magma Crash's Rubble), so it is no draw
      const junk = (id: string): boolean => V2_CARDS.find((x) => x.id === id)?.hero === 'junk';
      const draws = c.effects.reduce((n, o) => {
        if (o.op === 'draw') return n + Math.max(o.scale ? 1 : 0, o.amount);
        if (o.op === 'fetch') return n + o.amount;
        if (o.op === 'discover') return n + (o.count ?? 1);
        if (o.op === 'addCard' && o.side === 'self' && o.to === 'hand' && !junk(o.card))
          return n + Math.max(o.scale ? 1 : 0, o.times ?? 1);
        return n;
      }, 0);
      const discards = c.effects.reduce((n, o) => (o.op === 'discard' ? n + o.amount : n), 0);
      // the card itself leaves the hand: drawing as many as it costs in cards is "free"
      if (draws - discards >= 1) bad.push(`${c.id} (draws ${draws}, discards ${discards})`);
      // (a Void put in your own discard pile is the price of Spirit Offering's Mana: it is not consumed, Robert 2026-10-30)
      const voids = c.effects.some((o) => o.op === 'addCard' && o.side === 'self' && o.to === 'discard' && junk(o.card));
      if (!voids && c.effects.some((o) => o.op === 'mana' && (o.amount > 0 || o.scale)))
        bad.push(`${c.id} (free Mana)`);
    }
    expect(bad).toEqual([]);
  });

  it('a card that multiplies a status is consumed, caps what it adds, and no Power multiplies one every turn', () => {
    const bad: string[] = [];
    const multiplies = (ops: readonly Op[]): boolean =>
      // (a multiplier under 1 spends a status, as Sunfall spends all your Devotion: nothing to run away)
      ops.some(
        (o) => (o.op === 'scaleStatus' && o.mult > 1) || (o.op === 'power' && multiplies(o.ops)),
      );
    for (const c of playable) {
      if (!multiplies(c.effects)) continue;
      if (c.kind === 'power' || !c.exhaust) bad.push(`${c.id} (not consumed)`);
      for (const o of c.effects)
        if (o.op === 'scaleStatus' && o.max === undefined) bad.push(`${c.id} (no cap)`);
    }
    expect(bad).toEqual([]);
  });

  it('payoffs scale by at most 2 per point of a resource that only grows (3 on a card that is consumed)', () => {
    const GROWS = [
      'barrier',
      'thorns',
      'might',
      'doom',
      'seared',
      'stars',
      'exhausted',
      'created',
      'resonance',
      'mantra',
      'powers',
    ];
    const bad: string[] = [];
    for (const c of playable)
      for (const o of c.effects) {
        const sc = 'scale' in o ? o.scale : undefined;
        if (!sc || !GROWS.includes(sc.by)) continue;
        const cap = c.exhaust ? 3 : 2;
        // (a count in steps pays its mult once per step: "5 more for every 10 Fate" is half a point per Fate)
        if ((sc.mult ?? 1) / (sc.step ?? 1) > cap) bad.push(`${c.id}: x${sc.mult} per ${sc.by}`);
      }
    expect(bad).toEqual([]);
  });

  it('every Riftwalker has Slay the Spire-like HP (70-90)', () => {
    for (const r of Object.values(RIFTWALKERS)) {
      expect(r.hero.maxHp, r.hero.id).toBeGreaterThanOrEqual(70);
      expect(r.hero.maxHp, r.hero.id).toBeLessThanOrEqual(90);
    }
  });
});
