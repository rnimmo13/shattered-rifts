import { describe, expect, it } from 'vitest';
import { markRollDiff, parseRules } from './cardText';

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
