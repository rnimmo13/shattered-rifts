import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BOONS, HEARTS } from '@sr/content/v2';
import { STATUS_INFO, fateBarPct } from '../fight/info';
import { pileTier } from '../fight/PileArt';
import { PAINTED, STATUS_ICONS, boonIcon, paintedFiles } from './gameIcons';

// (these no longer come up in play or on the Learn page: they keep their drawings, docs/icon-prompts.md)
const RETIRED = [
  'resonance',
  'knives',
  'prep',
  'twinedge',
  'mastery',
  'opening',
  'rousing',
  'shelter',
];

describe('the pictures', () => {
  it('every status has a drawing to fall back on', () => {
    for (const id of Object.keys(STATUS_INFO)) {
      expect(STATUS_ICONS[id as keyof typeof STATUS_ICONS], id).toBeDefined();
    }
  });

  it('every Boon and Warden’s Heart has a drawing to fall back on', () => {
    for (const b of [...BOONS, ...HEARTS]) expect(boonIcon(b.id), b.id).toBeDefined();
  });

  it('asks for nothing odd from a name that is not a Boon', () => {
    expect(boonIcon('constructor')).toBeUndefined();
  });

  it('every status still in play, Boon and Heart has a painted picture', () => {
    for (const id of Object.keys(STATUS_INFO)) {
      if (!RETIRED.includes(id)) expect(PAINTED.has(id), id).toBe(true);
    }
    for (const b of [...BOONS, ...HEARTS]) expect(PAINTED.has(b.id), b.id).toBe(true);
    expect(PAINTED.has('taunt')).toBe(true);
  });

  it('every painted picture has its file', () => {
    for (const id of paintedFiles()) {
      const file = fileURLToPath(new URL(`../../public/art/icons/${id}.png`, import.meta.url));
      expect(existsSync(file), id).toBe(true);
    }
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

describe('a pile’s size', () => {
  it('is nothing when empty, and grows through four stacks', () => {
    expect([0, 1, 2, 3, 7, 8, 17, 18, 99].map(pileTier)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
});
