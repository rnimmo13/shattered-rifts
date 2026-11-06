// Main-process controller; the renderer can request named actions, never a feed URL or file path.
export interface DesktopUpdateStatus {
  phase: 'unsupported' | 'idle' | 'checking' | 'downloading' | 'ready' | 'installing' | 'error';
  currentVersion: string;
  version: string | null;
  percent: number;
  message: string;
}
export interface UpdatePort {
  on(event: string, listener: (info: unknown) => void): unknown;
  checkForUpdates(): Promise<unknown>;
  quitAndInstall(silent: boolean, runAfter: boolean): void;
}
const versionOf = (info: unknown): string | null => {
  if (!info || typeof info !== 'object' || !('version' in info)) return null;
  return typeof info.version === 'string' && info.version.length < 64 ? info.version : null;
};

export class DesktopUpdates {
  private value: DesktopUpdateStatus;
  constructor(
    currentVersion: string,
    private readonly port?: UpdatePort,
    reason = 'Updates are available in the installed Windows app.',
    /** Backup relaunch in case the installer's own run-after-install does not start the game. */
    private readonly relaunchAfterInstall?: () => void,
  ) {
    this.value = {
      phase: port ? 'idle' : 'unsupported',
      currentVersion,
      version: null,
      percent: 0,
      message: port
        ? 'Updates download automatically; the game saves and restarts outside battle when ready.'
        : reason,
    };
    port?.on('checking-for-update', () =>
      this.set({ phase: 'checking', message: 'Checking for updates…' }),
    );
    port?.on('update-available', (info) =>
      this.set({
        phase: 'downloading',
        version: versionOf(info),
        percent: 0,
        message:
          'Downloading the required update. The game will save and restart outside battle when ready.',
      }),
    );
    port?.on('download-progress', (info) => {
      const percent = info && typeof info === 'object' && 'percent' in info ? info.percent : 0;
      if (
        this.value.phase === 'downloading' &&
        typeof percent === 'number' &&
        Number.isFinite(percent)
      )
        this.set({ percent: Math.max(0, Math.min(100, Math.round(percent))) });
    });
    port?.on('update-not-available', () =>
      this.set({
        phase: 'idle',
        version: null,
        percent: 0,
        message: 'You have the latest desktop version.',
      }),
    );
    port?.on('update-downloaded', (info) =>
      this.set({
        phase: 'ready',
        version: versionOf(info),
        percent: 100,
        message: 'Update required. The game saves and restarts automatically after leaving battle.',
      }),
    );
    port?.on('error', () =>
      this.set({
        phase: 'error',
        percent: 0,
        message: 'Could not update. Check your connection and try again. You can keep playing.',
      }),
    );
  }
  private set(change: Partial<DesktopUpdateStatus>): void {
    this.value = { ...this.value, ...change };
  }
  status(): DesktopUpdateStatus {
    return { ...this.value };
  }
  async check(): Promise<DesktopUpdateStatus> {
    if (!this.port || ['checking', 'downloading', 'ready', 'installing'].includes(this.value.phase))
      return this.status();
    this.set({ phase: 'checking', message: 'Checking for updates…' });
    try {
      await this.port.checkForUpdates();
    } catch {
      this.set({
        phase: 'error',
        message: 'Could not update. Check your connection and try again. You can keep playing.',
      });
    }
    return this.status();
  }
  install(): void {
    if (!this.port || this.value.phase !== 'ready')
      throw new Error('No downloaded update is ready');
    this.set({ phase: 'installing', message: 'Installing the update and restarting…' });
    try {
      try {
        this.relaunchAfterInstall?.();
      } catch {
        /* the installer's own relaunch still applies */
      }
      this.port.quitAndInstall(true, true);
      if (this.status().phase === 'error') throw new Error('Installer failed');
    } catch {
      this.set({
        phase: 'ready',
        message: 'Could not restart. Try again, or quit to install the update.',
      });
      throw new Error('Could not start the update');
    }
  }
}

export async function installSavedUpdate(
  updates: DesktopUpdates,
  persist: () => Promise<() => void>,
): Promise<void> {
  if (updates.status().phase !== 'ready') throw new Error('No update is ready');
  const undo = await persist();
  try {
    updates.install();
  } catch (error) {
    undo();
    throw error;
  }
}
