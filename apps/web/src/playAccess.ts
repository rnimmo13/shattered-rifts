import { cleanRunCopies, cleanVault, regressesRun, type RunCopy } from '@sr/pvp';
import { serverBase, playerId } from './pvp/config';
import { vaultKey, whoAmI } from './pvp/vaultSync';

export const localOnly = (): boolean =>
  typeof window !== 'undefined' &&
  window.location.protocol === 'srgame:' &&
  window.location.hostname === 'local';
type Phase = 'browsing' | 'claiming' | 'playing' | 'saving' | 'paused' | 'busy';
export interface PlayAccess {
  phase: Phase;
  message: string;
  epoch: number;
}
let state: PlayAccess = { phase: 'browsing', message: '', epoch: 0 };
let token = '';
let deadline = 0;
let revision = 0;
let pending: Promise<boolean> | null = null;
let recoveryAvailable = false;
export const localRecoveryAvailable = (): boolean => recoveryAvailable;
const listeners = new Set<() => void>();
export const playState = (): PlayAccess => state;
export const subscribePlay = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const update = (phase: Phase, message = ''): void => {
  state = { ...state, phase, message };
  for (const on of listeners) on();
};
export const canPlay = (): boolean =>
  !localOnly() &&
  (state.phase === 'playing' || state.phase === 'saving') &&
  performance.now() < deadline;
export const playToken = (): string => (canPlay() ? token : '');
export const playRevision = (): number => revision;
export const setPlayRevision = (value: number): void => {
  revision = value;
};
export function pausePlay(
  message = 'Your play connection was interrupted. Reconnect before continuing.',
): void {
  if (state.phase === 'playing' || state.phase === 'saving') update('paused', message);
}
export async function gameplayAction(action: () => void): Promise<void> {
  if (localOnly() || ((await ensurePlay()) && state.phase === 'playing')) action();
}
const base = (): string => serverBase().replace(/^ws/i, 'http');
async function call(action: 'claim' | 'renew' | 'release'): Promise<Record<string, unknown>> {
  await whoAmI();
  const key = vaultKey();
  const proof = token || sessionStorage.getItem('sr.play.token') || '';
  const response = await fetch(`${base()}/pvp/play/${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-sr-play-token': proof },
    body: JSON.stringify({ holder: playerId(), ...(key === null ? {} : { code: key }) }),
    signal: AbortSignal.timeout(8000),
  });
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object') throw new Error('Gameplay server unavailable');
  return data as Record<string, unknown>;
}
export function ensurePlay(recoverLocal = false): Promise<boolean> {
  if (localOnly()) return Promise.resolve(true);
  if (canPlay()) return Promise.resolve(true);
  pending ??= (async () => {
    update('claiming');
    try {
      const data = await call('claim');
      if (
        data.ok !== true ||
        typeof data.token !== 'string' ||
        typeof data.expires !== 'number' ||
        typeof data.now !== 'number' ||
        typeof data.revision !== 'number'
      ) {
        update(
          'busy',
          'This account is already playing on another device. Stop playing there before starting Campaign or Arena here.',
        );
        return false;
      }
      token = data.token;
      sessionStorage.setItem('sr.play.token', token);
      deadline = performance.now() + Math.max(0, data.expires - data.now);
      revision = data.revision;
      const { adoptSharedRuns, adoptSharedReplays, runCopies } = await import('./run/saves');
      const remote: RunCopy[] = cleanRunCopies(data.runs);
      const local = runCopies();
      const newerLocal = local.filter((c) => remote.some((r) => regressesRun(c, r)));
      recoveryAvailable = newerLocal.length > 0;
      if (recoveryAvailable && !recoverLocal) {
        update(
          'paused',
          'This device has campaign progress beyond the account save. Both copies are preserved. Recover the newer local progress before switching devices.',
        );
        return false;
      }
      // The first migration may adopt local runs only when this identity has never saved remotely.
      if (revision !== 0 || remote.length) {
        adoptSharedRuns(
          recoverLocal ? remote.map((r) => newerLocal.find((c) => c.id === r.id) ?? r) : remote,
        );
        if (!recoverLocal || !newerLocal.length) adoptSharedReplays(data.replays);
        localStorage.setItem('sr-vault-v1', JSON.stringify(cleanVault(data.decks)));
        for (const [name, key] of [
          ['history', 'sr.runHistory'],
          ['matches', 'sr.matchHistory'],
        ] as const) {
          const list = data[name] as { items?: unknown; removed?: unknown } | undefined;
          if (Array.isArray(list?.items)) localStorage.setItem(key, JSON.stringify(list.items));
          if (name === 'history' && Array.isArray(list?.removed))
            localStorage.setItem('sr.runHistory.removed', JSON.stringify(list.removed));
        }
        localStorage.removeItem('sr.pendingDrops');
      }
      state = { ...state, epoch: state.epoch + 1 };
      recoveryAvailable = false;
      update('playing');
      const { soonSyncRuns } = await import('./run/runCloud');
      soonSyncRuns();
      return true;
    } catch {
      update(
        'paused',
        'Connect to the internet to play your shared account. Local offline play stays separate.',
      );
      return false;
    } finally {
      pending = null;
    }
  })();
  return pending;
}
export async function releasePlayAccess(): Promise<void> {
  if (localOnly() || !token) return;
  if (!canPlay())
    throw new Error('Reconnect to confirm your latest account save before switching devices.');
  update('saving', 'Confirming your latest account save before stopping play…');
  try {
    const { flushCampaignSave } = await import('./run/runCloud');
    if (!(await flushCampaignSave()))
      throw new Error(
        'Your latest campaign save has not reached your account. Reconnect and save before switching devices.',
      );
    const released = await call('release');
    if (released.ok !== true)
      throw new Error(
        'Could not confirm that this device stopped playing. Reconnect before switching devices.',
      );
    token = '';
    sessionStorage.removeItem('sr.play.token');
    update('browsing');
  } catch (error) {
    update(
      'paused',
      error instanceof Error ? error.message : 'The latest account save is not confirmed.',
    );
    throw error;
  }
}
export function playSocketUrl(path: string, address = serverBase()): string {
  const url = new URL(`${address}${path}`);
  url.searchParams.set('play', playToken());
  const code = vaultKey();
  if (code !== null) url.searchParams.set('code', code);
  return url.toString();
}

/** Attach the proof centrally so every existing backend writer is fenced, including delayed syncs. */
export function installPlayAccess(): void {
  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
    const backend = new URL(base());
    if (url.origin !== backend.origin || !url.pathname.startsWith('/pvp/'))
      return original(input, init);
    // Manually shared diagnostics contain no online save/progress writes or play-lease credentials.
    if (url.pathname === '/pvp/reports' || /^\/pvp\/reports\/[a-f0-9]{32}$/.test(url.pathname))
      return original(input, init);
    if (localOnly()) throw new Error('Local-only mode does not use online progress');
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    if (canPlay()) headers.set('x-sr-play-token', token);
    const response = await original(input, { ...init, headers });
    if (response.status === 409 && !url.pathname.startsWith('/pvp/play/')) {
      try {
        const body = (await response.clone().json()) as { error?: unknown };
        if (body.error === 'play-required' || body.error === 'save-conflict')
          pausePlay(
            'This save or play session is no longer current. Reconnect to load the latest confirmed progress.',
          );
      } catch {
        /* an unrelated request conflict is not a gameplay ownership change */
      }
    }
    return response;
  };
  window.setInterval(() => {
    if (state.phase !== 'playing') return;
    if (!canPlay()) {
      pausePlay();
      return;
    }
    void call('renew')
      .then((data) => {
        if (data.ok !== true || typeof data.expires !== 'number' || typeof data.now !== 'number') {
          pausePlay();
          return;
        }
        deadline = performance.now() + Math.max(0, data.expires - data.now);
        if (typeof data.revision === 'number' && data.revision !== revision)
          void import('./run/runCloud').then(({ syncRuns }) => syncRuns());
      })
      .catch(() => pausePlay());
  }, 10000);
  window.addEventListener('offline', () => pausePlay());
  window.addEventListener('sr-campaign-save', () => {
    if (canPlay()) void import('./run/runCloud').then(({ soonSyncRuns }) => soonSyncRuns());
  });
  window.addEventListener('focus', () => {
    if (state.phase === 'playing' && !canPlay()) pausePlay();
  });
  if (typeof document !== 'undefined')
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && canPlay())
        void import('./run/runCloud').then(({ syncRuns }) => syncRuns());
    });
  // Stop keyboard/mouse actions synchronously even if the browser throttled heartbeat timers in the background.
  for (const type of ['keydown', 'pointerdown', 'click'])
    window.addEventListener(
      type,
      (event) => {
        if (state.phase === 'saving') {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
        if (state.phase === 'playing' && !canPlay()) {
          event.preventDefault();
          event.stopImmediatePropagation();
          pausePlay();
        }
        if (
          ['paused', 'busy', 'claiming'].includes(state.phase) &&
          document.querySelector('.play-gate') &&
          event.target instanceof Node &&
          !document.querySelector('.play-gate')!.contains(event.target)
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
}
