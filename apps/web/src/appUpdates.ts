import { BUILD } from './build';
import { battleActive, subscribeBattle } from './battleActivity';
import { desktopBridge } from './desktopBridge';

export interface AvailableUpdate {
  kind: 'web' | 'desktop';
  version: string;
  key: string;
}
let available: AvailableUpdate | null = null;
const listeners = new Set<() => void>();
export const pendingUpdate = (): AvailableUpdate | null => available;
/** A running battle may finish; a ready update blocks subsequent play at the safe boundary. */
export const updateRequired = (): boolean => available !== null && !battleActive();
export const subscribeUpdates = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const announce = (update: AvailableUpdate): void => {
  if (available?.key === update.key) return;
  available = update;
  for (const listener of listeners) listener();
};
export function newerWebBuild(
  current: { version: string; commit: string },
  value: unknown,
): value is { version: string; commit: string } {
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    !('commit' in value) ||
    typeof value.version !== 'string' ||
    typeof value.commit !== 'string' ||
    !/^\d+\.\d+\.\d+$/.test(value.version) ||
    !/^[a-f0-9]{7,40}$/.test(value.commit)
  )
    return false;
  const ours = current.version.split('.').map(Number),
    theirs = value.version.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (theirs[i] !== ours[i]) return (theirs[i] ?? 0) > (ours[i] ?? 0);
  }
  return (
    value.commit !== current.commit && current.commit !== 'dev' && current.commit !== 'unknown'
  );
}
export function flagChangedAssets(): void {
  if (!desktopBridge()) announce({ kind: 'web', version: '', key: 'changed-assets' });
}
let checking: Promise<void> | null = null;
let lastNativeCheck = 0;
export function checkAppUpdates(forceNativeCheck = false): Promise<void> {
  checking ??= (async () => {
    try {
      const bridge = desktopBridge();
      if (bridge) {
        let status = await bridge.updateStatus();
        if (
          forceNativeCheck &&
          !battleActive() &&
          Date.now() - lastNativeCheck > 60000 &&
          ['idle', 'error'].includes(status.phase)
        ) {
          lastNativeCheck = Date.now();
          status = await bridge.checkUpdate();
        }
        if (status.phase === 'ready' && status.version)
          announce({ kind: 'desktop', version: status.version, key: `desktop:${status.version}` });
      } else {
        const response = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
          cache: 'no-store',
          credentials: 'omit',
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) return;
        const value: unknown = await response.json();
        if (newerWebBuild(BUILD, value))
          announce({
            kind: 'web',
            version: value.version,
            key: `web:${value.version}:${value.commit}`,
          });
      }
    } catch {
      /* Offline checks never block play or erase a known pending update. */
    }
  })().finally(() => {
    checking = null;
  });
  return checking;
}
export function startAppUpdateChecks(): () => void {
  if (import.meta.env.DEV) return () => undefined;
  void checkAppUpdates();
  const timer = window.setInterval(() => {
    if (!document.hidden) void checkAppUpdates();
  }, 10000);
  const focus = (): void => {
    if (!document.hidden) void checkAppUpdates(true);
  };
  window.addEventListener('focus', focus);
  document.addEventListener('visibilitychange', focus);
  const stopBattle = subscribeBattle(() => {
    if (!battleActive()) void checkAppUpdates(true);
  });
  return () => {
    window.clearInterval(timer);
    window.removeEventListener('focus', focus);
    document.removeEventListener('visibilitychange', focus);
    stopBattle();
  };
}
export async function refreshForUpdate(): Promise<void> {
  if (battleActive()) throw new Error('Finish or leave the battle before refreshing.');
  if (desktopBridge())
    throw new Error('The desktop app must install its patch instead of refreshing.');
  const { checkpointRunTime } = await import('./run/runClock');
  checkpointRunTime();
  const { releasePlayAccess } = await import('./playAccess');
  await releasePlayAccess();
  if (battleActive()) throw new Error('A battle has started. Refresh after leaving it.');
  window.location.reload();
}
