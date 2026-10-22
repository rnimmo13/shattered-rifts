import { describe, expect, it } from 'vitest';
import { CARD_DB } from '@sr/content';
import { fanLayout } from './fanLayout';
import { dropKind, isPlayable, validSlotKeys } from './dropRules';
import { parseRules } from '../cards/cardText';
import { archetypeOf } from '../art/proceduralArt';

const o = { cardWidth: 200, maxSpread: 900, focus: null };

describe('fanLayout', () => {
  it('is symmetric, arcs up in the middle and fans the rotation', () => {
    const f = fanLayout(5, o);
    expect(f).toHaveLength(5);
    expect(f[0]!.x).toBeCloseTo(-f[4]!.x, 6);
    expect(f[2]!.x).toBeCloseTo(0, 6);
    expect(f[2]!.y).toBeLessThan(f[0]!.y);
    expect(f[0]!.rot).toBeLessThan(0);
    expect(f[4]!.rot).toBeGreaterThan(0);
  });
  it('never spreads past maxSpread', () => {
    const f = fanLayout(10, { ...o, maxSpread: 600 });
    expect(f[9]!.x - f[0]!.x).toBeLessThanOrEqual(600 + 1e-6);
  });
  it('handles empty and single hands', () => {
    expect(fanLayout(0, o)).toEqual([]);
    expect(fanLayout(1, o)[0]).toMatchObject({ x: 0, rot: 0 });
  });
  it('lifts the focused card to the front and pushes neighbours away', () => {
    const base = fanLayout(5, o);
    const f = fanLayout(5, { ...o, focus: 2 });
    expect(f[2]!.scale).toBeGreaterThan(1);
    expect(f[2]!.rot).toBe(0);
    expect(f[2]!.y).toBeLessThan(base[2]!.y);
    expect(f[2]!.z).toBeGreaterThan(Math.max(...f.filter((_, i) => i !== 2).map((s) => s.z)));
    expect(f[1]!.x).toBeLessThan(base[1]!.x);
    expect(f[3]!.x).toBeGreaterThan(base[3]!.x);
    // the nearest neighbour moves more than a far one
    expect(Math.abs(f[3]!.x - base[3]!.x)).toBeGreaterThan(Math.abs(f[4]!.x - base[4]!.x));
  });
});

describe('drop rules', () => {
  it('maps card types to where they go', () => {
    expect(dropKind({ type: 'unit' })).toBe('unit');
    expect(dropKind({ type: 'trap' })).toBe('trap');
    expect(dropKind({ type: 'relic' })).toBe('trap');
    expect(dropKind({ type: 'spell' })).toBe('spell');
    expect(validSlotKeys({ type: 'unit' }).size).toBe(5);
    expect(validSlotKeys({ type: 'trap' }).size).toBe(4);
    expect(validSlotKeys({ type: 'spell' }).size).toBe(0);
    expect([...validSlotKeys({ type: 'unit' })].every((k) => k.startsWith('me-unit-'))).toBe(true);
  });
  it('a card is playable when its cost is covered', () => {
    expect(isPlayable({ cost: 3 }, 3)).toBe(true);
    expect(isPlayable({ cost: 4 }, 3)).toBe(false);
  });
});

describe('card text', () => {
  it('splits **bold** keywords into runs', () => {
    expect(parseRules('**Guardian**. Deal 2.')).toEqual([
      { text: 'Guardian', bold: true },
      { text: '. Deal 2.', bold: false },
    ]);
    expect(parseRules('plain')).toEqual([{ text: 'plain', bold: false }]);
  });
});

describe('art archetypes', () => {
  it('every card in the database gets a subject', () => {
    for (const def of Object.values(CARD_DB)) expect(archetypeOf(def)).toBeTruthy();
  });
  it('maps known tribes', () => {
    expect(archetypeOf({ type: 'unit', tribes: ['Dragon'], name: 'x' })).toBe('dragon');
    expect(archetypeOf({ type: 'unit', tribes: ['Human', 'Knight'], name: 'x' })).toBe('knight');
    expect(archetypeOf({ type: 'spell', name: 'x' })).toBe('spell');
  });
});
