export interface DesktopSteamStatus {
  mode: 'standalone' | 'steam';
  name: string | null;
  online: boolean;
  message: string;
  provider?: 'google' | 'steam' | null;
  available?: boolean;
  linked?: boolean;
}
export interface DesktopUpdateStatus {
  phase: 'unsupported' | 'idle' | 'checking' | 'downloading' | 'ready' | 'installing' | 'error';
  currentVersion: string;
  version: string | null;
  percent: number;
  message: string;
}
interface DesktopBridge {
  bootstrap(keys: string[]): Promise<{
    data: { entries: Record<string, string> } | null;
    replace: string[];
    steam: DesktopSteamStatus;
    reset?: boolean;
  }>;
  save(entries: Record<string, string>): Promise<{ savedAt: number; earned: string[] }>;
  status(): Promise<DesktopSteamStatus>;
  googleLogin(): Promise<void>;
  googleCancel(): Promise<void>;
  googleLogout(): Promise<void>;
  updateStatus(): Promise<DesktopUpdateStatus>;
  checkUpdate(): Promise<DesktopUpdateStatus>;
  installUpdate(): Promise<void>;
  ready(): Promise<void>;
  quit(): void;
  switchMode(local: boolean): Promise<void>;
}
declare global {
  interface Window {
    shatteredRiftsDesktop?: DesktopBridge;
    shatteredRiftsPrepareAccountSwitch?: () => Promise<void>;
    shatteredRiftsConfirmOnlineSave?: () => Promise<void>;
  }
}
export const desktopBridge = (): DesktopBridge | undefined =>
  typeof window === 'undefined' ? undefined : window.shatteredRiftsDesktop;

let saving: Promise<void> = Promise.resolve();
let last = '';
let error: string | null = null;
export const desktopSaveError = (): string | null => error;

export function flushDesktopSave(): Promise<void> {
  const bridge = desktopBridge();
  if (!bridge) return Promise.resolve();
  saving = saving
    .catch(() => undefined)
    .then(async () => {
      const entries = Object.fromEntries(Object.entries(localStorage)) as Record<string, string>;
      const text = JSON.stringify(entries);
      if (text === last) return;
      try {
        await bridge.save(entries);
        last = text;
        error = null;
      } catch (cause) {
        error = 'Could not save to disk. Your previous save is preserved.';
        throw cause;
      }
    });
  return saving;
}
export async function startDesktop(): Promise<void> {
  const bridge = desktopBridge();
  if (!bridge) throw new Error('Desktop bridge unavailable. Please reopen the desktop app.');
  const { data, replace, reset } = await bridge.bootstrap(Object.keys(localStorage));
  // The file restored by Steam is canonical. Preserve machine-specific settings outside it.
  if (data || reset) {
    for (const key of replace) localStorage.removeItem(key);
    for (const [key, value] of Object.entries(data?.entries ?? {}))
      localStorage.setItem(key, value);
  }
  window.shatteredRiftsPrepareAccountSwitch = async () => {
    const { battleActive } = await import('./battleActivity');
    if (battleActive()) throw new Error('Finish or leave the battle before changing accounts.');
    const { releasePlayAccess } = await import('./playAccess');
    await releasePlayAccess();
    await flushDesktopSave();
    if (battleActive()) throw new Error('A battle has started. Change accounts afterward.');
  };
  await bridge.ready();
  window.shatteredRiftsConfirmOnlineSave = async () => {
    const { localOnly, playState } = await import('./playAccess');
    if (localOnly() || playState().phase === 'browsing') return;
    const { releasePlayAccess } = await import('./playAccess');
    await releasePlayAccess();
  };
  await flushDesktopSave();
  window.setInterval(() => {
    void flushDesktopSave().catch(() => undefined);
  }, 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void flushDesktopSave().catch(() => undefined);
  });
}
export async function quitDesktop(): Promise<void> {
  const { checkpointRunTime } = await import('./run/runClock');
  checkpointRunTime();
  await flushDesktopSave();
  const { releasePlayAccess } = await import('./playAccess');
  await releasePlayAccess();
  desktopBridge()?.quit();
}
export async function restartDesktopUpdate(): Promise<void> {
  const { battleActive } = await import('./battleActivity');
  if (battleActive()) throw new Error('Finish or leave the battle before updating.');
  const { checkpointRunTime } = await import('./run/runClock');
  checkpointRunTime();
  await flushDesktopSave();
  const { releasePlayAccess } = await import('./playAccess');
  await releasePlayAccess();
  if (battleActive()) throw new Error('A battle has started. Update after leaving it.');
  await desktopBridge()?.installUpdate();
}
