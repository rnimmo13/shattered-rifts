import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Client } from 'steamworks.js';
import type * as SteamworksModule from 'steamworks.js';
import { ACHIEVEMENTS } from './saveData.js';

export interface SteamStatus {
  mode: 'standalone' | 'steam';
  appId: number | null;
  name: string | null;
  online: boolean;
  message: string;
}
export function appIdOf(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const id = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : raw;
  if (
    typeof id !== 'number' ||
    !Number.isSafeInteger(id) ||
    id < 1 ||
    id > 4294967295 ||
    id === 480
  )
    throw new Error('Configure the Shattered Rifts Steam app ID (not the Spacewar test app).');
  return id;
}
export function configuredAppId(): number | null {
  if (process.env.SR_STEAM_APP_ID) return appIdOf(process.env.SR_STEAM_APP_ID);
  try {
    return appIdOf(
      (
        JSON.parse(readFileSync(join(__dirname, 'steam-config.json'), 'utf8')) as {
          appId?: unknown;
        }
      ).appId,
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

export class SteamService {
  private client: Omit<Client, 'init' | 'runCallbacks'> | null = null;
  private token: string | null = null;
  private expires = 0;
  private ticket: { cancel(): void } | null = null;
  private acknowledged = new Set<string>();
  readonly status: SteamStatus;
  readonly owner: string;
  constructor(
    readonly appId: number | null,
    factory?: (id: number) => Omit<Client, 'init' | 'runCallbacks'>,
  ) {
    this.status = {
      mode: 'standalone',
      appId,
      name: null,
      online: false,
      message:
        'Standalone mode. Steam login, achievements and Cloud require a configured Steam app.',
    };
    this.owner = 'standalone';
    if (!appId) return;
    // Load the native binding only when configured. It never enters the renderer.
    const load =
      factory ??
      ((id: number) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const steamworks = require('steamworks.js') as typeof SteamworksModule;
        return steamworks.init(id);
      });
    this.client = load(appId);
    const id = this.client.localplayer.getSteamId().steamId64.toString();
    if (!/^765\d{14}$/.test(id)) throw new Error('Steam did not return a valid player identity.');
    this.owner = id;
    this.status.mode = 'steam';
    this.status.name = this.client.localplayer.getName();
    this.status.message = 'Steam profile loaded. Connecting to online services…';
  }
  async login(fetcher: typeof fetch = fetch): Promise<void> {
    if (!this.client || !this.appId) return;
    try {
      this.ticket?.cancel();
      const ticket = await this.client.auth.getAuthTicketForWebApi('shattered-rifts', 10);
      this.ticket = ticket;
      const response = await fetcher('https://shatteredrifts.app/auth/steam', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticket: ticket.getBytes().toString('hex') }),
        signal: AbortSignal.timeout(15000),
      });
      const result = (await response.json()) as {
        token?: unknown;
        expires?: unknown;
        steamId?: unknown;
      };
      if (
        !response.ok ||
        typeof result.token !== 'string' ||
        typeof result.expires !== 'number' ||
        result.steamId !== this.owner
      )
        throw new Error('Steam online sign-in unavailable');
      this.token = result.token;
      this.expires = result.expires;
      this.status.online = true;
      this.status.message = 'Signed in through Steam.';
    } catch {
      this.token = null;
      this.status.online = false;
      this.status.message =
        'Steam profile loaded. Online sign-in unavailable; local play and saved progress remain available.';
    }
  }
  authorization(): string | null {
    return this.token && Date.now() < this.expires ? `Bearer ${this.token}` : null;
  }
  unlock(earned: readonly string[]): void {
    if (!this.client) return;
    for (const { id } of ACHIEVEMENTS) {
      if (!earned.includes(id) || this.acknowledged.has(id)) continue;
      try {
        // activate also stores stats; a cached local flag alone does not acknowledge a failed store.
        if (this.client.achievement.activate(id)) this.acknowledged.add(id);
      } catch {
        /* Steam may still be loading stats; retry on the next save */
      }
    }
  }
  dispose(): void {
    this.ticket?.cancel();
    this.ticket = null;
  }
}
