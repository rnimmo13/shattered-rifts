import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  native: false,
  status: { phase: 'idle', version: null as string | null },
  fetch: vi.fn<(...args: unknown[]) => Promise<Response>>(),
  release: vi.fn(() => Promise.resolve()),
  reload: vi.fn(),
  check: vi.fn(() => Promise.resolve({ phase: 'idle', version: null as string | null })),
  install: vi.fn(() => Promise.resolve()),
}));
vi.mock('./build', () => ({ BUILD: { version: '0.184.0', commit: '1111111' } }));
vi.mock('./desktopBridge', () => ({
  restartDesktopUpdate: mocks.install,
  desktopBridge: () =>
    mocks.native
      ? {
          updateStatus: () => Promise.resolve(mocks.status),
          checkUpdate: mocks.check,
        }
      : undefined,
}));
vi.mock('./playAccess', () => ({ releasePlayForUpdate: mocks.release }));

beforeEach(() => {
  vi.resetModules();
  mocks.native = false;
  mocks.status = { phase: 'idle', version: null };
  mocks.fetch.mockReset();
  mocks.reload.mockClear();
  mocks.release.mockReset();
  mocks.release.mockImplementation(() => Promise.resolve());
  mocks.check.mockClear();
  mocks.install.mockReset();
  mocks.install.mockResolvedValue();
  vi.stubGlobal('fetch', mocks.fetch);
  vi.stubGlobal('window', { location: { reload: mocks.reload } });
});
afterEach(() => vi.unstubAllGlobals());
const latest = () => new Response(JSON.stringify({ version: '0.185.0', commit: '2222222' }));

describe('application update availability and refresh safety', () => {
  it('detects newer versions/rebuilt commits, rejects older or malformed metadata', async () => {
    const { newerWebBuild } = await import('./appUpdates');
    const current = { version: '0.184.0', commit: '1111111' };
    expect(newerWebBuild(current, { version: '0.185.0', commit: '2222222' })).toBe(true);
    expect(newerWebBuild(current, { version: '0.184.0', commit: '2222222' })).toBe(true);
    expect(newerWebBuild(current, current)).toBe(false);
    expect(newerWebBuild(current, { version: '0.183.0', commit: '2222222' })).toBe(false);
    expect(newerWebBuild(current, { version: 'garbage', commit: '2222222' })).toBe(false);
    expect(newerWebBuild(current, { version: '0.185.0', commit: '<script>' })).toBe(false);
  });
  it('checks uncached without credentials; availability discovery waits for the safe-boundary UI', async () => {
    mocks.fetch.mockResolvedValue(latest());
    const app = await import('./appUpdates');
    await app.checkAppUpdates();
    expect(mocks.fetch).toHaveBeenCalledWith(
      expect.stringContaining('version.json?t='),
      expect.objectContaining({ cache: 'no-store', credentials: 'omit' }),
    );
    expect(app.pendingUpdate()).toMatchObject({ kind: 'web', version: '0.185.0' });
    expect(mocks.reload).not.toHaveBeenCalled();
  });
  it('retains pending updates during a battle and refuses refresh without releasing progress', async () => {
    const { enterBattle } = await import('./battleActivity');
    const leave = enterBattle();
    try {
      mocks.fetch.mockResolvedValue(latest());
      const app = await import('./appUpdates');
      await app.checkAppUpdates();
      expect(app.pendingUpdate()?.version).toBe('0.185.0');
      await expect(app.refreshForUpdate()).rejects.toThrow('battle');
      expect(mocks.release).not.toHaveBeenCalled();
      expect(mocks.reload).not.toHaveBeenCalled();
    } finally {
      leave();
    }
  });
  it('saves/releases before an explicit refresh, and rechecks the battle boundary afterward', async () => {
    const app = await import('./appUpdates');
    const battle = await import('./battleActivity');
    let leave: () => void = () => undefined;
    mocks.release.mockImplementationOnce(() => {
      leave = battle.enterBattle();
      return Promise.resolve();
    });
    try {
      await expect(app.refreshForUpdate()).rejects.toThrow('battle');
      expect(mocks.reload).not.toHaveBeenCalled();
    } finally {
      leave();
    }
    await app.refreshForUpdate();
    expect(mocks.release).toHaveBeenCalledTimes(2);
    expect(mocks.reload).toHaveBeenCalledOnce();
  });
  it('preserves a known update through offline/failed checks', async () => {
    const app = await import('./appUpdates');
    mocks.fetch.mockResolvedValueOnce(latest());
    await app.checkAppUpdates();
    mocks.fetch.mockRejectedValueOnce(new Error('offline'));
    await app.checkAppUpdates();
    expect(app.pendingUpdate()?.version).toBe('0.185.0');
  });
  it('desktop requires an actually downloaded patch and never reads the website manifest', async () => {
    mocks.native = true;
    mocks.status = { phase: 'downloading', version: '0.185.0' };
    const app = await import('./appUpdates');
    await app.checkAppUpdates();
    expect(app.pendingUpdate()).toBeNull();
    mocks.status = { phase: 'ready', version: '0.185.0' };
    await app.checkAppUpdates();
    expect(app.pendingUpdate()).toMatchObject({ kind: 'desktop', version: '0.185.0' });
    expect(mocks.fetch).not.toHaveBeenCalled();
    await expect(app.refreshForUpdate()).rejects.toThrow('desktop');
  });
  it('defers native checks while fighting, then can check on leaving battle', async () => {
    mocks.native = true;
    const { enterBattle } = await import('./battleActivity');
    const leave = enterBattle();
    const app = await import('./appUpdates');
    try {
      await app.checkAppUpdates(true);
      expect(mocks.check).not.toHaveBeenCalled();
    } finally {
      leave();
    }
    await app.checkAppUpdates(true);
    expect(mocks.check).toHaveBeenCalledOnce();
  });
});

it('coalesces automatic and manual retry requests into one saved web refresh', async () => {
  const app = await import('./appUpdates');
  mocks.fetch.mockResolvedValueOnce(latest());
  await app.checkAppUpdates();
  await Promise.all([app.applyRequiredUpdate(), app.applyRequiredUpdate()]);
  expect(mocks.release).toHaveBeenCalledOnce();
  expect(mocks.reload).toHaveBeenCalledOnce();
});
it('does not install in battle, retains a failed required update, and can retry', async () => {
  const app = await import('./appUpdates');
  await expect(app.applyRequiredUpdate()).rejects.toThrow('No update');
  mocks.fetch.mockResolvedValueOnce(latest());
  await app.checkAppUpdates();
  const { enterBattle } = await import('./battleActivity');
  const leave = enterBattle();
  await expect(app.applyRequiredUpdate()).rejects.toThrow('battle');
  expect(mocks.release).not.toHaveBeenCalled();
  leave();
  mocks.release.mockRejectedValueOnce(new Error('Save failed'));
  await expect(app.applyRequiredUpdate()).rejects.toThrow('Save failed');
  expect(mocks.reload).not.toHaveBeenCalled();
  expect(app.updateRequired()).toBe(true);
  await app.applyRequiredUpdate();
  expect(mocks.reload).toHaveBeenCalledOnce();
});
it('uses the saved native installer for a required desktop patch instead of reloading the website', async () => {
  mocks.native = true;
  mocks.status = { phase: 'ready', version: '0.185.0' };
  const app = await import('./appUpdates');
  await app.checkAppUpdates();
  await app.applyRequiredUpdate();
  expect(mocks.install).toHaveBeenCalledOnce();
  expect(mocks.reload).not.toHaveBeenCalled();
});

it('requires a ready update at safe boundaries and permits the current battle to finish', async () => {
  const app = await import('./appUpdates');
  const { enterBattle } = await import('./battleActivity');
  expect(app.updateRequired()).toBe(false);
  mocks.fetch.mockResolvedValueOnce(latest());
  await app.checkAppUpdates();
  expect(app.updateRequired()).toBe(true);
  const leave = enterBattle();
  expect(app.updateRequired()).toBe(false);
  leave();
  expect(app.updateRequired()).toBe(true);
});
