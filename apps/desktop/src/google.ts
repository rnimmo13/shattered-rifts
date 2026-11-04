import { createHash, randomBytes } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';

export interface GoogleLogin {
  token: string;
  account: string;
  expires: number;
}
export interface CredentialCrypto {
  isEncryptionAvailable(): boolean;
  encryptString(value: string): Buffer;
  decryptString(value: Buffer): string;
}
const valid = (value: unknown): value is GoogleLogin => {
  const v = value as Partial<GoogleLogin> | null;
  return (
    !!v &&
    typeof v.token === 'string' &&
    /^d1\.[a-f0-9]{64}\.[a-f0-9]{64}$/.test(v.token) &&
    typeof v.account === 'string' &&
    /^[a-f0-9]{64}$/.test(v.account) &&
    typeof v.expires === 'number' &&
    Number.isFinite(v.expires)
  );
};
const BASE = 'https://shatteredrifts.app';

/** Native credentials never enter the renderer, URLs, localStorage, saves, or Steam Cloud. */
export class GoogleService {
  private current: GoogleLogin | null = null;
  private active = false;
  private cancelled = false;
  private checkedAt = 0;
  private pending: { id: string; verifier: string; fetcher: typeof fetch } | null = null;
  persistent = false;
  constructor(
    private readonly file: string,
    private readonly crypto: CredentialCrypto,
  ) {}
  restore(): void {
    if (!existsSync(this.file)) return;
    if (!this.crypto.isEncryptionAvailable())
      throw new Error(
        'Windows credential encryption is unavailable. Your existing account file was preserved.',
      );
    const value: unknown = JSON.parse(this.crypto.decryptString(readFileSync(this.file)));
    if (!valid(value)) throw new Error('The saved desktop login is unreadable. It was preserved.');
    this.current = value;
    this.persistent = true;
  }
  owner(): string | null {
    return this.current ? `google-${this.current.account}` : null;
  }
  authorization(): string | null {
    return this.current && this.current.expires > Date.now()
      ? `Bearer ${this.current.token}`
      : null;
  }
  cancel(): void {
    this.cancelled = true;
    if (this.pending) {
      const { id, verifier, fetcher } = this.pending;
      void fetcher(`${BASE}/auth/desktop/cancel`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, verifier }),
        signal: AbortSignal.timeout(10000),
      }).catch(() => undefined);
    }
  }
  async validate(fetcher: typeof fetch = fetch): Promise<boolean> {
    const authorization = this.authorization();
    if (!authorization) return false;
    if (Date.now() - this.checkedAt < 60000) return true;
    try {
      const r = await fetcher(`${BASE}/auth/me`, {
        headers: { authorization },
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) return false;
      const s = (await r.json()) as { signedIn?: unknown; account?: unknown };
      if (s.signedIn !== true || s.account !== this.current!.account) {
        this.commit({ ...this.current!, expires: 0 });
        return false;
      }
      this.checkedAt = Date.now();
      return true;
    } catch {
      return false;
    }
  }
  async login(
    open: (url: string) => Promise<void>,
    steam: string | null = null,
    fetcher: typeof fetch = fetch,
  ): Promise<GoogleLogin | { linked: true }> {
    if (this.active) throw new Error('A sign-in attempt is already open.');
    this.active = true;
    this.cancelled = false;
    try {
      const verifier = randomBytes(32).toString('hex');
      const challenge = createHash('sha256').update(verifier).digest('hex');
      const response = await fetcher(`${BASE}/auth/desktop/start`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(steam ? { authorization: steam } : {}) },
        body: JSON.stringify({ challenge, link: !!steam }),
        signal: AbortSignal.timeout(15000),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!payload || typeof payload !== 'object')
        throw new Error('Google sign-in is temporarily unavailable. Please try again.');
      const start = payload as { id?: string; url?: string; error?: string };
      if (
        !response.ok ||
        !start.id ||
        !/^[a-f0-9]{64}$/.test(start.id) ||
        start.url !== `${BASE}/auth/desktop/browser?id=${start.id}`
      )
        throw new Error(start.error ?? 'Could not start browser sign-in. Please try again.');
      this.pending = { id: start.id, verifier, fetcher };
      await open(start.url);
      const deadline = Date.now() + 600000;
      while (Date.now() < deadline && !this.cancelled) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (this.cancelled) break;
        const r = await fetcher(`${BASE}/auth/desktop/exchange`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: start.id, verifier }),
          signal: AbortSignal.timeout(15000),
        });
        if (this.cancelled) throw new Error('Sign-in cancelled.');
        if (r.status === 202) continue;
        if (!r.ok)
          throw new Error('Sign-in was cancelled, expired, or refused. Try again from the app.');
        const result: unknown = await r.json();
        if (steam && (result as { linked?: unknown }).linked === true) return { linked: true };
        if (!steam && valid(result) && result.expires > Date.now()) return result;
        throw new Error('Invalid sign-in response.');
      }
      throw new Error('Sign-in cancelled or expired.');
    } finally {
      this.active = false;
      this.pending = null;
    }
  }
  commit(value: GoogleLogin): void {
    if (!valid(value)) throw new Error('Invalid account login');
    this.persistent = false;
    if (this.crypto.isEncryptionAvailable()) {
      const encrypted = this.crypto.encryptString(JSON.stringify(value));
      mkdirSync(dirname(this.file), { recursive: true });
      writeFileSync(`${this.file}.tmp`, encrypted, { flush: true });
      renameSync(`${this.file}.tmp`, this.file);
      this.persistent = true;
    } else if (existsSync(this.file)) throw new Error('Could not safely replace the saved login.');
    this.current = value;
    this.checkedAt = 0;
  }
  async logout(fetcher: typeof fetch = fetch): Promise<void> {
    const authorization = this.authorization();
    if (authorization) {
      try {
        await fetcher(`${BASE}/auth/desktop/logout`, {
          method: 'POST',
          headers: { authorization },
          signal: AbortSignal.timeout(10000),
        });
      } catch {
        /* Delete the local credential even offline; the remote session expires automatically. */
      }
    }
    if (existsSync(this.file)) unlinkSync(this.file);
    this.current = null;
    this.persistent = false;
  }
}
