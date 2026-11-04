import { describe, expect, it, vi } from 'vitest';
import type { Client } from 'steamworks.js';
import { appIdOf, SteamService } from './steam';

describe('Steam initialization and login', () => {
  it('works without loading the Steam SDK when no app ID is configured', () => {
    const service = new SteamService(null);
    expect(service.owner).toBe('standalone');
    expect(service.status.mode).toBe('standalone');
    for (const id of [480, 'bad', 0, -1, 1.1]) expect(() => appIdOf(id)).toThrow();
    expect(appIdOf('12345')).toBe(12345);
  });
  it('sends a ticket to the trusted server and retains the returned session only in main', async () => {
    const cancel = vi.fn();
    const activate = vi.fn(() => true);
    const client = {
      localplayer: {
        getSteamId: () => ({ steamId64: 76561198000000001n }),
        getName: () => 'Player',
      },
      auth: {
        getAuthTicketForWebApi: vi.fn(() =>
          Promise.resolve({ getBytes: () => Buffer.from([1, 2]), cancel }),
        ),
      },
      achievement: { isActivated: () => false, activate },
    } as unknown as Omit<Client, 'init' | 'runCallbacks'>;
    const s = new SteamService(12345, () => client);
    const fetcher = vi.fn((_url: unknown) =>
      Promise.resolve(
        new Response(
          JSON.stringify({ token: 'test-token', expires: Date.now() + 100000, steamId: s.owner }),
        ),
      ),
    );
    await s.login(fetcher);
    expect(s.status.online).toBe(true);
    expect(s.authorization()).toBe('Bearer test-token');
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://shatteredrifts.app/auth/steam');
    s.unlock(['FIRST_VICTORY', 'not-a-real-achievement']);
    s.unlock(['FIRST_VICTORY']);
    expect(activate).toHaveBeenCalledExactlyOnceWith('FIRST_VICTORY');
    await s.login(() => Promise.reject(new Error('offline')));
    expect(s.status.online).toBe(false);
    expect(s.authorization()).toBeNull();
    expect(s.status.mode).toBe('steam');
    expect(cancel).toHaveBeenCalled();
  });
  it('retries a failed stats store even if Steam already cached the local unlock flag', () => {
    const activate = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
    const client = {
      localplayer: {
        getSteamId: () => ({ steamId64: 76561198000000001n }),
        getName: () => 'Player',
      },
      achievement: { isActivated: () => true, activate },
    } as unknown as Omit<Client, 'init' | 'runCallbacks'>;
    const s = new SteamService(12345, () => client);
    s.unlock(['FIRST_VICTORY']);
    s.unlock(['FIRST_VICTORY']);
    s.unlock(['FIRST_VICTORY']);
    expect(activate).toHaveBeenCalledTimes(2);
  });
});
