// An Arena socket's leaderboard id is the Worker's word, never a deck's own `who` (DECISIONS #804): it is the same id the board gives
// the player, and a header that is not one is ignored.

import { describe, expect, it } from 'vitest';
import { VAULT_CODE_ALPHABET } from '@sr/pvp';
import { sha256 } from './auth';
import type { Env } from './env';
import {
  PLAY_HEADER,
  PLAY_VAULT_HEADER,
  PLAY_WHO_HEADER,
  playBoardId,
  socketPlay,
} from './playAccess';

const env = {} as Env;

describe("an Arena socket's leaderboard id", () => {
  it("is the board's own id for a Vault code (a guest)", async () => {
    const code = VAULT_CODE_ALPHABET.slice(0, 16);
    const id = await playBoardId(new Request('https://x.invalid/pvp/play'), env, code);
    expect(id).toBe(await sha256(`shattered-rifts-board:${code}`));
  });

  it('is nothing without an account or a code', async () => {
    expect(await playBoardId(new Request('https://x.invalid/pvp/play'), env, null)).toBeNull();
  });

  it('is read from the Worker’s header only when it is an id', () => {
    const at = (who: string) =>
      socketPlay(
        new Request('https://room.invalid', {
          headers: { [PLAY_VAULT_HEADER]: 'v', [PLAY_HEADER]: 't', [PLAY_WHO_HEADER]: who },
        }),
      );
    expect(at('a'.repeat(64))?.who).toBe('a'.repeat(64));
    expect(at('not-an-id')?.who).toBeUndefined();
  });
});
