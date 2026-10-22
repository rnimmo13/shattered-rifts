import { it } from 'vitest';
import { CARD_DB, ENEMIES } from '../index';
it('dump', () => {
  for (const e of ENEMIES) {
    const parts = Object.entries(e.deck).map(([c, n]) => `${n}x${CARD_DB[c]?.name}(${c})`);
    console.log('E', e.id, e.kind, e.essence, e.personality, '|', parts.join(', '));
  }
});
