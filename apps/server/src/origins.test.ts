import { describe, expect, it } from 'vitest';
import { allowedOrigin } from './origins';

describe('desktop and web client origins', () => {
  it.each([
    'srgame://app',
    'https://shatteredrifts.app',
    'https://rnimmo13.github.io',
    'http://localhost:5173',
  ])('accepts the supported client %s', (origin) =>
    expect(allowedOrigin(origin, 'game.test')).toBe(true),
  );
  it.each(['null', 'file://', 'srgame://other', 'srgame://app.evil.test', 'https://evil.test'])(
    'does not broaden access to %s',
    (origin) => expect(allowedOrigin(origin, 'game.test')).toBe(false),
  );
  it('preserves custom-domain same-host access', () => {
    expect(allowedOrigin('https://game.test', 'game.test')).toBe(true);
  });
});
