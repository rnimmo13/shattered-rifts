import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { relaunchScript } from './relaunch';
import { DesktopUpdates } from './updates';

describe('reopening the game after a silent update', () => {
  it('starts the backup relaunch before handing off to the installer', () => {
    const order: string[] = [];
    const port = Object.assign(new EventEmitter(), {
      checkForUpdates: vi.fn(() => Promise.resolve(undefined)),
      quitAndInstall: vi.fn(() => order.push('install')),
    });
    const updates = new DesktopUpdates('0.211.0', port, undefined, () => order.push('relaunch'));
    port.emit('update-downloaded', { version: '0.212.0' });
    updates.install();
    expect(order).toEqual(['relaunch', 'install']);
    expect(port.quitAndInstall).toHaveBeenCalledWith(true, true);
  });
  it('still installs when the backup relaunch cannot start', () => {
    const port = Object.assign(new EventEmitter(), {
      checkForUpdates: vi.fn(() => Promise.resolve(undefined)),
      quitAndInstall: vi.fn(),
    });
    const updates = new DesktopUpdates('0.211.0', port, undefined, () => {
      throw new Error('no powershell');
    });
    port.emit('update-downloaded', { version: '0.212.0' });
    updates.install();
    expect(port.quitAndInstall).toHaveBeenCalledOnce();
  });
  it('waits for this process and the installer, then starts the game only if it is not running', () => {
    const script = relaunchScript("C:\\Games\\O'Neil\\Shattered Rifts.exe", 4242);
    expect(script).toContain("$exe = 'C:\\Games\\O''Neil\\Shattered Rifts.exe'");
    expect(script).toContain("-like '*\\pending\\*'");
    expect(script).toContain('Get-Process -Id 4242');
    expect(script).toContain('Shattered-Rifts-Setup*');
    expect(script.indexOf('Get-Process -Id 4242')).toBeLessThan(script.indexOf('Start-Process'));
    expect(script).toMatch(/if \(-not \(Get-Process .*\$_\.Path -eq \$exe .*Start-Process -FilePath \$exe/);
  });
});
