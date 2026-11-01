import { describe, expect, it } from 'vitest';
import { BOONS, HEARTS } from '@sr/content/v2';
import { STATUS_INFO, fateBarPct } from '../fight/info';
import { pileLayers } from '../fight/PileArt';
import { STATUS_ICONS, boonIcon } from './gameIcons';

describe('the drawn pictures', () => {
  it('every status has one', () => {
    for (const id of Object.keys(STATUS_INFO)) {
      expect(STATUS_ICONS[id as keyof typeof STATUS_ICONS], id).toBeDefined();
    }
  });

  it('every Boon and Warden’s Heart has one', () => {
    for (const b of [...BOONS, ...HEARTS]) expect(boonIcon(b.id), b.id).toBeDefined();
  });

  it('asks for nothing odd from a name that is not a Boon', () => {
    expect(boonIcon('constructor')).toBeUndefined();
  });
});

describe('the Fate band on the HP bar (DECISIONS #504)', () => {
  it('is its share of Max HP', () => {
    expect(fateBarPct(100, 100, 25)).toBe(25);
  });

  it('stops where the HP stops', () => {
    expect(fateBarPct(10, 100, 40)).toBe(10);
  });

  it('never leaves the bar', () => {
    expect(fateBarPct(100, 100, 400)).toBe(100);
    expect(fateBarPct(0, 100, 40)).toBe(0);
    expect(fateBarPct(0, 0, 40)).toBe(0);
  });
});

describe('a pile’s height', () => {
  it('is nothing when empty, and grows up to five cards', () => {
    expect(pileLayers(0)).toBe(0);
    expect(pileLayers(1)).toBe(1);
    expect(pileLayers(10)).toBe(3);
    expect(pileLayers(99)).toBe(5);
  });
});
