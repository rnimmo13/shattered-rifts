import { describe, expect, it } from 'vitest';
import {
  firstFreeTrapSlot,
  firstFreeUnitSlot,
  isTrapKey,
  previewDamage,
  previewSpringTarget,
  previewTarget,
} from './previewHarness';

describe('preview harness', () => {
  it('finds the first free unit and trap slot', () => {
    expect(firstFreeUnitSlot(() => false)).toBe('me-unit-0');
    expect(firstFreeUnitSlot((k) => k === 'me-unit-0' || k === 'me-unit-1')).toBe('me-unit-2');
    expect(firstFreeUnitSlot(() => true)).toBeNull();
    expect(firstFreeTrapSlot((k) => k === 'me-trap-0')).toBe('me-trap-1');
    expect(firstFreeTrapSlot(() => true)).toBeNull();
  });

  it('damage floors guard at zero and reports defeat', () => {
    expect(previewDamage(5, 3)).toEqual({ left: 2, dies: false });
    expect(previewDamage(2, 3)).toEqual({ left: 0, dies: true });
  });

  it('attacks the same column when occupied, else the first foe, else the face', () => {
    expect(previewTarget('me-unit-2', ['opp-unit-1', 'opp-unit-2'])).toBe('opp-unit-2');
    expect(previewTarget('me-unit-0', ['opp-unit-3'])).toBe('opp-unit-3');
    expect(previewTarget('opp-unit-0', [])).toBeNull();
  });

  it('a sprung trap hits the first foe or nothing', () => {
    expect(previewSpringTarget(['opp-unit-1', 'opp-unit-2'])).toBe('opp-unit-1');
    expect(previewSpringTarget([])).toBeNull();
  });

  it('recognises trap slot keys', () => {
    expect(isTrapKey('opp-trap-1')).toBe(true);
    expect(isTrapKey('me-unit-1')).toBe(false);
  });
});
