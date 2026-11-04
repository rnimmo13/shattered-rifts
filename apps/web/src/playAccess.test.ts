import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type * as PlayModule from './playAccess';

const adopted = vi.hoisted(() => ({ runs: vi.fn(), replays: vi.fn() }));
vi.mock('./pvp/config', () => ({
  serverBase: () => 'wss://shatteredrifts.app',
  playerId: () => 'device-a',
}));
vi.mock('./pvp/vaultSync', () => ({
  whoAmI: () => Promise.resolve({ signedIn: true }),
  vaultKey: () => null,
}));
vi.mock('./run/saves', () => ({
  adoptSharedRuns: adopted.runs,
  adoptSharedReplays: adopted.replays,
}));
let access: typeof PlayModule;
let fetcher: ReturnType<typeof vi.fn<typeof fetch>>;
let tick: (() => void) | undefined;
let location: { protocol: string; hostname: string; href: string };
beforeEach(async () => {
  vi.resetModules();
  adopted.runs.mockClear();
  adopted.replays.mockClear();
  const storage = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  vi.stubGlobal('localStorage', { setItem: vi.fn(), removeItem: vi.fn() });
  location = {
    protocol: 'https:',
    hostname: 'shatteredrifts.app',
    href: 'https://shatteredrifts.app/',
  };
  fetcher = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetcher);
  vi.stubGlobal('window', {
    location,
    fetch: fetcher,
    addEventListener: vi.fn(),
    setInterval: (fn: () => void) => {
      tick = fn;
    },
  });
  access = await import('./playAccess');
});
afterEach(() => {
  vi.unstubAllGlobals();
});
const claim = () =>
  new Response(
    JSON.stringify({
      ok: true,
      token: 'secret',
      expires: 46000,
      now: 1000,
      revision: 2,
      runs: [{ id: 'run-a', updated: 2, text: 'latest' }],
      replays: { 'sr.fightlog:a': 'latest moves' },
      decks: [],
    }),
  );
describe('shared-account play gates', () => {
  it('starts in browsing without claiming or blocking read-only use', () => {
    expect(access.playState().phase).toBe('browsing');
    expect(access.canPlay()).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('does not enter either gameplay mode when another device owns the claim', async () => {
    fetcher.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: 'play-in-use' }), { status: 409 }),
    );
    expect(await access.ensurePlay()).toBe(false);
    expect(access.playState().phase).toBe('busy');
    expect(access.canPlay()).toBe(false);
  });
  it('loads confirmed progress before enabling play, then pauses on a lost heartbeat', async () => {
    fetcher
      .mockResolvedValueOnce(claim())
      .mockResolvedValue(new Response(JSON.stringify({ ok: false }), { status: 409 }));
    expect(await access.ensurePlay()).toBe(true);
    expect(adopted.runs).toHaveBeenCalledWith([{ id: 'run-a', updated: 2, text: 'latest' }]);
    expect(access.canPlay()).toBe(true);
    access.installPlayAccess();
    tick?.();
    await vi.waitFor(() => expect(access.playState().phase).toBe('paused'));
    expect(access.canPlay()).toBe(false);
  });
  it('does not acquire or reuse online play ownership in the isolated offline origin', async () => {
    location.protocol = 'srgame:';
    location.hostname = 'local';
    expect(await access.ensurePlay()).toBe(true);
    expect(access.playToken()).toBe('');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
