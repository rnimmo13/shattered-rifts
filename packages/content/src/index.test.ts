import { describe, expect, it } from 'vitest';
import { CardIdSchema } from './index';

describe('@sr/content', () => {
  it('accepts stable card IDs and rejects malformed ones', () => {
    expect(CardIdSchema.safeParse('AUR-10').success).toBe(true);
    expect(CardIdSchema.safeParse('TOK-DRONE').success).toBe(true);
    expect(CardIdSchema.safeParse('aur-10').success).toBe(false);
  });
});
