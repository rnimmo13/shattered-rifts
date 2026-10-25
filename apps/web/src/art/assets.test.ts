import { describe, expect, it } from 'vitest';
import { artKey } from './assets';

describe('which picture a card uses', () => {
  it('an upgrade and a sanctified card use the picture of the card they come from', () => {
    expect(artKey('strike')).toBe('strike');
    expect(artKey('strike+')).toBe('strike');
    expect(artKey('hi~strike')).toBe('strike');
    expect(artKey('lo~strike')).toBe('strike');
    expect(artKey('hi~oathbound+')).toBe('oathbound');
    expect(artKey('lo~shield-charge+')).toBe('shield-charge');
  });
});
