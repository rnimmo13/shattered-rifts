import { describe, expect, it } from 'vitest';
import { markRollDiff, parseRules, rollNote } from './cardText';
import { COMBAT_DB } from '@sr/content/v2';
import { sanctifiedNote } from '../fight/info';

describe('sanctified numbers on a card', () => {
  it('marks each number the roll changed, up or down, with what it was', () => {
    expect(markRollDiff('Deal 8 damage. Gain 4 Barrier.', 'Deal 6 damage. Gain 5 Barrier.')).toBe(
      'Deal [[up:8:6]] damage. Gain [[down:4:5]] Barrier.',
    );
    expect(markRollDiff('Draw 2 cards.', 'Draw 2 cards.')).toBe('Draw 2 cards.');
    // (a wording that changed with the number: shown as it is)
    expect(markRollDiff('Deal 8 damage 2 times.', 'Deal 6 damage.')).toBe('Deal 8 damage 2 times.');
  });

  it('the marks come through as runs, with bold keywords around them', () => {
    expect(parseRules('Gain [[up:8:6]] **Barrier**.')).toEqual([
      { text: 'Gain ', bold: false },
      { text: '8', bold: false, roll: { dir: 'up', was: '6' } },
      { text: ' ', bold: false },
      { text: 'Barrier', bold: true },
      { text: '.', bold: false },
    ]);
  });
});

describe('the Sanctified note beside a hovered card', () => {
  it('names each number the roll changed, the way it went, and nothing for a plain card', () => {
    expect(rollNote('Deal 8 damage. Gain 6 Barrier.', 'Deal 6 damage. Gain 5 Barrier.', 1)).toEqual(
      {
        name: 'Sanctified',
        text: 'Rolled 25% stronger at the Sanctum: damage 6 → 8, Barrier 5 → 6.',
      },
    );
    expect(rollNote('Deal 6 damage.', 'Deal 6 damage.', -1)).toBeNull();
    const up = COMBAT_DB.cards['hi~strike'];
    const down = COMBAT_DB.cards['lo~strike'];
    expect(up && sanctifiedNote(COMBAT_DB, up)?.text).toMatch(/stronger.*damage 6 → [78]/);
    expect(down && sanctifiedNote(COMBAT_DB, down)?.text).toMatch(/weaker.*damage 6 → [45]/);
    expect(sanctifiedNote(COMBAT_DB, COMBAT_DB.cards['strike']!)).toBeNull();
  });
});
