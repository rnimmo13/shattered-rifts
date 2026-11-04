import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { DesktopUpdates, installSavedUpdate } from './updates';

function fixture() {
  const port = Object.assign(new EventEmitter(), {
    checkForUpdates: vi.fn(() => Promise.resolve(undefined)),
    quitAndInstall: vi.fn(),
  });
  return { port, updates: new DesktopUpdates('0.183.0', port) };
}
describe('desktop automatic updates', () => {
  it('does not contact a feed in development or a Steam-managed edition', async () => {
    const updates = new DesktopUpdates(
      '0.183.0',
      undefined,
      'Steam manages updates for this edition.',
    );
    expect((await updates.check()).phase).toBe('unsupported');
    expect(updates.status().message).toContain('Steam');
    expect(() => updates.install()).toThrow();
  });
  it('coalesces checks, reports download progress, and never installs just because a download completes', async () => {
    const { port, updates } = fixture();
    await Promise.all([updates.check(), updates.check()]);
    expect(port.checkForUpdates).toHaveBeenCalledTimes(1);
    port.emit('update-available', { version: '0.184.0' });
    port.emit('download-progress', { percent: 37.3 });
    expect(updates.status()).toMatchObject({
      phase: 'downloading',
      percent: 37,
      version: '0.184.0',
    });
    port.emit('update-downloaded', { version: '0.184.0' });
    expect(updates.status().phase).toBe('ready');
    await updates.check();
    expect(port.checkForUpdates).toHaveBeenCalledTimes(1);
    expect(port.quitAndInstall).not.toHaveBeenCalled();
  });
  it('keeps offline failures recoverable and can retry', async () => {
    const { port, updates } = fixture();
    port.checkForUpdates.mockRejectedValueOnce(new Error('private diagnostic detail'));
    expect((await updates.check()).phase).toBe('error');
    expect(updates.status().message).not.toContain('private');
    port.checkForUpdates.mockImplementationOnce(() => {
      port.emit('update-not-available', {});
      return Promise.resolve(undefined);
    });
    expect((await updates.check()).phase).toBe('idle');
  });
  it('refuses install before a downloaded update or after a failed save', async () => {
    const { port, updates } = fixture();
    const save = vi.fn(() => Promise.resolve(() => undefined));
    await expect(installSavedUpdate(updates, save)).rejects.toThrow('No update');
    expect(save).not.toHaveBeenCalled();
    port.emit('update-downloaded', { version: '0.184.0' });
    await expect(
      installSavedUpdate(updates, () => Promise.reject(new Error('Disk full'))),
    ).rejects.toThrow('Disk full');
    expect(port.quitAndInstall).not.toHaveBeenCalled();
    expect(updates.status().phase).toBe('ready');
  });
  it('finishes the save before starting a silent installer and relaunch', async () => {
    const { port, updates } = fixture();
    const order: string[] = [];
    port.emit('update-downloaded', { version: '0.184.0' });
    port.quitAndInstall.mockImplementation(() => order.push('install'));
    await installSavedUpdate(updates, async () => {
      await Promise.resolve();
      order.push('saved');
      return () => undefined;
    });
    expect(order).toEqual(['saved', 'install']);
    expect(port.quitAndInstall).toHaveBeenCalledWith(true, true);
    expect(updates.status().phase).toBe('installing');
  });
  it('restores close protection when the installer cannot start', async () => {
    const { port, updates } = fixture();
    const undo = vi.fn();
    port.emit('update-downloaded', { version: '0.184.0' });
    port.quitAndInstall.mockImplementation(() => {
      throw new Error('Not executable');
    });
    await expect(installSavedUpdate(updates, () => Promise.resolve(undo))).rejects.toThrow();
    expect(undo).toHaveBeenCalledOnce();
    expect(updates.status().phase).toBe('ready');
  });
});
