import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type * as PlayModule from './playAccess';

const adopted = vi.hoisted(() => ({
  runs: vi.fn(),
  replays: vi.fn(),
  local: [] as { id: string; updated: number; text: string }[],
}));
const synced = vi.hoisted(() => ({ flush: vi.fn(), soon: vi.fn() }));
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
  runCopies: () => adopted.local,
}));
vi.mock('./run/runCloud', () => ({
  soonSyncRuns: synced.soon,
  flushCampaignSave: synced.flush,
}));
let access: typeof PlayModule;
let fetcher: ReturnType<typeof vi.fn<typeof fetch>>;
let tick: (() => void) | undefined;
let location: { protocol: string; hostname: string; href: string };
beforeEach(async () => {
  vi.resetModules();
  adopted.runs.mockClear();
  adopted.replays.mockClear();
  adopted.local = [];
  synced.flush.mockReset().mockResolvedValue(true);
  synced.soon.mockClear();
  const storage = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  const local = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: vi.fn((key: string, value: string) => local.set(key, value)),
    removeItem: vi.fn((key: string) => local.delete(key)),
  });
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
  it('takes control explicitly and loads confirmed progress before allowing actions', async () => {
    fetcher
      .mockResolvedValueOnce(Response.json({ ok: false, error: 'play-in-use' }, { status: 409 }))
      .mockResolvedValueOnce(claim());
    expect(await access.ensurePlay()).toBe(false);
    expect(await access.takeControlHere()).toBe(true);
    expect(fetcher.mock.calls[1]![0]).toBe('https://shatteredrifts.app/pvp/play/takeover');
    expect(adopted.runs).toHaveBeenCalledWith([{ id: 'run-a', updated: 2, text: 'latest' }]);
    expect(access.canPlay()).toBe(true);
  });
  it('does not describe a failed connection as a session on another device', async () => {
    fetcher.mockResolvedValue(Response.json({ ok: false, error: 'signin' }, { status: 401 }));
    expect(await access.ensurePlay()).toBe(false);
    expect(access.playState().phase).toBe('paused');
    expect(access.playState().message).not.toContain('another device');
  });
  it('does not release ownership when the latest save is unconfirmed', async () => {
    fetcher.mockResolvedValueOnce(claim());
    await access.ensurePlay();
    synced.flush.mockResolvedValue(false);
    await expect(access.releasePlayAccess()).rejects.toThrow(/not reached/);
    expect(access.playState().phase).toBe('paused');
    expect(
      fetcher.mock.calls.map(([url]) => (url instanceof Request ? url.url : url.toString())),
    ).not.toContain('https://shatteredrifts.app/pvp/play/release');
    expect(sessionStorage.getItem('sr.play.token')).toBe('secret');
  });
  it('never blocks a required update on an unconfirmed save or a lost connection', async () => {
    fetcher.mockResolvedValueOnce(claim());
    await access.ensurePlay();
    synced.flush.mockResolvedValue(false);
    await expect(access.releasePlayForUpdate()).resolves.toBeUndefined();
    access.pausePlay();
    await expect(access.releasePlayForUpdate()).resolves.toBeUndefined();
    // The proof is kept so the refreshed tab can reclaim its own lease.
    expect(sessionStorage.getItem('sr.play.token')).toBe('secret');
    expect(localStorage.getItem(access.UNCONFIRMED_HANDOFF)).toBe('1');
  });
  it('keeps local decks and history after an unconfirmed update, then clears the marker', async () => {
    localStorage.setItem(access.UNCONFIRMED_HANDOFF, '1');
    localStorage.setItem('sr.runHistory', '["unsent run"]');
    fetcher.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...((await claim().json()) as object),
          history: { items: [], removed: [] },
        }),
      ),
    );
    expect(await access.ensurePlay()).toBe(true);
    expect(localStorage.getItem('sr.runHistory')).toBe('["unsent run"]');
    expect(localStorage.getItem('sr-vault-v1')).toBeNull();
    expect(localStorage.getItem(access.UNCONFIRMED_HANDOFF)).toBeNull();
    // A normal later claim adopts the account copy again.
    access.pausePlay();
    fetcher.mockResolvedValueOnce(claim());
    await access.ensurePlay();
    expect(localStorage.getItem('sr-vault-v1')).toBe('[]');
  });
  it('freezes gameplay while confirming a handoff and releases only after acknowledgement', async () => {
    fetcher.mockResolvedValueOnce(claim()).mockResolvedValue(Response.json({ ok: true }));
    await access.ensurePlay();
    let acknowledge!: (value: boolean) => void;
    synced.flush.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          acknowledge = resolve;
        }),
    );
    const handoff = access.releasePlayAccess();
    await vi.waitFor(() => expect(access.playState().phase).toBe('saving'));
    await vi.waitFor(() => expect(acknowledge).toBeTypeOf('function'));
    const action = vi.fn();
    await access.gameplayAction(action);
    expect(action).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(1);
    acknowledge(true);
    await handoff;
    expect(fetcher.mock.calls[1]![0]).toContain('/release');
    expect(access.playState().phase).toBe('browsing');
  });
  it('keeps the proof and pauses if the server refuses the release acknowledgement', async () => {
    fetcher.mockResolvedValueOnce(claim()).mockResolvedValue(Response.json({ ok: false }));
    await access.ensurePlay();
    await expect(access.releasePlayAccess()).rejects.toThrow(/stopped playing/);
    expect(access.playState().phase).toBe('paused');
    expect(sessionStorage.getItem('sr.play.token')).toBe('secret');
  });
  it('offers recovery before replacing a newer local tier with an older account save', async () => {
    adopted.local = [
      { id: 'run-a', updated: 3, text: JSON.stringify({ tier: 11, stats: { nodesCleared: 210 } }) },
    ];
    fetcher.mockImplementation(() =>
      Promise.resolve(
        Response.json({
          ok: true,
          token: 'secret',
          expires: 46000,
          now: 1000,
          revision: 2,
          runs: [
            {
              id: 'run-a',
              updated: 2,
              text: JSON.stringify({ tier: 10, stats: { nodesCleared: 190 } }),
            },
          ],
          replays: {},
          decks: [],
        }),
      ),
    );
    expect(await access.ensurePlay()).toBe(false);
    expect(access.localRecoveryAvailable()).toBe(true);
    expect(adopted.runs).not.toHaveBeenCalled();
    expect(await access.ensurePlay(true)).toBe(true);
    expect(adopted.runs).toHaveBeenCalledWith(adopted.local);
  });
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
  it('allows explicitly shared diagnostics from offline mode while still blocking online progress', async () => {
    location.protocol = 'srgame:';
    location.hostname = 'local';
    location.href = 'srgame://local/index.html';
    fetcher.mockResolvedValue(Response.json({ ok: true }));
    access.installPlayAccess();
    await window.fetch('https://shatteredrifts.app/pvp/reports', { method: 'POST', body: '{}' });
    expect(fetcher).toHaveBeenCalledWith('https://shatteredrifts.app/pvp/reports', {
      method: 'POST',
      body: '{}',
    });
    await expect(
      window.fetch('https://shatteredrifts.app/pvp/vault/runsave', { method: 'POST' }),
    ).rejects.toThrow('Local-only mode');
    expect(access.playToken()).toBe('');
  });
});

it('blocks new gameplay, including offline actions, while an update awaits reload', async () => {
  location.protocol = 'srgame:';
  location.hostname = 'local';
  const { flagChangedAssets } = await import('./appUpdates');
  flagChangedAssets();
  const action = vi.fn();
  await access.gameplayAction(action);
  expect(action).not.toHaveBeenCalled();
});
