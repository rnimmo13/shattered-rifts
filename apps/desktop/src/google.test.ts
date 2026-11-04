import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { GoogleService, type CredentialCrypto } from './google';

const directories: string[] = [];
const address = (url: string | URL | Request): string =>
  typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
afterEach(() => {
  vi.useRealTimers();
  for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true });
});
function setup(available = true) {
  const folder = mkdtempSync(resolve('.wrangler/google-unit-'));
  directories.push(folder);
  const file = join(folder, 'credentials.dat');
  const secrets = new Map<string, string>();
  const crypto: CredentialCrypto = {
    isEncryptionAvailable: () => available,
    encryptString: (value) => {
      const bytes = randomBytes(128);
      secrets.set(bytes.toString('hex'), value);
      return bytes;
    },
    decryptString: (bytes) => {
      const value = secrets.get(bytes.toString('hex'));
      if (!value) throw new Error('decryption failed');
      return value;
    },
  };
  const record = {
    token: `d1.${'a'.repeat(64)}.${'b'.repeat(64)}`,
    account: 'c'.repeat(64),
    expires: Date.now() + 86400000,
  };
  return { service: new GoogleService(file, crypto), file, crypto, record };
}
describe('native Google credentials and proof-bound browser login', () => {
  it('keeps encrypted credentials outside saves, restores them, validates identity and deletes on sign-out', async () => {
    const t = setup();
    t.service.commit(t.record);
    expect(readFileSync(t.file).includes(Buffer.from(t.record.token))).toBe(false);
    const restored = new GoogleService(t.file, t.crypto);
    restored.restore();
    expect(restored.owner()).toBe(`google-${t.record.account}`);
    expect(restored.authorization()).toBe(`Bearer ${t.record.token}`);
    expect(
      await restored.validate(() =>
        Promise.resolve(Response.json({ signedIn: true, account: t.record.account })),
      ),
    ).toBe(true);
    const fetcher = vi.fn(() => Promise.resolve(Response.json({ ok: true })));
    await restored.logout(fetcher);
    expect(fetcher.mock.calls).toHaveLength(1);
    expect(existsSync(t.file)).toBe(false);
    expect(restored.owner()).toBeNull();
  });
  it('uses session-only login when encryption is unavailable, preserving expired/corrupt account boundaries', () => {
    const t = setup(false);
    t.service.commit(t.record);
    expect(t.service.persistent).toBe(false);
    expect(existsSync(t.file)).toBe(false);
    const e = setup();
    e.service.commit({ ...e.record, expires: 0 });
    const expired = new GoogleService(e.file, e.crypto);
    expired.restore();
    expect(expired.owner()).toBe(`google-${e.record.account}`);
    expect(expired.authorization()).toBeNull();
    writeFileSync(e.file, 'bad');
    expect(() => new GoogleService(e.file, e.crypto).restore()).toThrow();
    expect(readFileSync(e.file, 'utf8')).toBe('bad');
  });
  it('opens only the trusted browser URL, binds the exchange proof and does not switch profiles before commit', async () => {
    vi.useFakeTimers();
    const t = setup(),
      id = 'd'.repeat(64);
    let challenge = '';
    const fetcher = vi.fn((url: string | URL | Request, init?: RequestInit) => {
      const b = JSON.parse(typeof init?.body === 'string' ? init.body : '{}') as {
        challenge?: string;
        verifier: string;
      };
      if (address(url).endsWith('/start')) {
        challenge = b.challenge!;
        return Promise.resolve(
          Response.json({ id, url: `https://shatteredrifts.app/auth/desktop/browser?id=${id}` }),
        );
      }
      expect(createHash('sha256').update(b.verifier).digest('hex')).toBe(challenge);
      return Promise.resolve(Response.json(t.record));
    });
    const open = vi.fn(() => Promise.resolve());
    const login = t.service.login(open, null, fetcher);
    await vi.advanceTimersByTimeAsync(1600);
    expect(await login).toEqual(t.record);
    expect(open).toHaveBeenCalledOnce();
    expect(open.mock.calls[0]).toEqual([
      `https://shatteredrifts.app/auth/desktop/browser?id=${id}`,
    ]);
    expect(t.service.owner()).toBeNull();
    expect(existsSync(t.file)).toBe(false);
  });
  it('rejects an injected browser destination and cancels waiting without changing the current account', async () => {
    const t = setup();
    t.service.commit(t.record);
    const open = vi.fn(() => Promise.resolve());
    await expect(
      t.service.login(open, null, () =>
        Promise.resolve(Response.json({ id: 'd'.repeat(64), url: 'https://attacker.invalid' })),
      ),
    ).rejects.toThrow('browser sign-in');
    expect(open).not.toHaveBeenCalled();
    expect(t.service.owner()).toBe(`google-${t.record.account}`);
    const fetcher = vi.fn((url: string | URL | Request) =>
      Promise.resolve(
        Response.json(
          address(url).endsWith('/start')
            ? {
                id: 'd'.repeat(64),
                url: `https://shatteredrifts.app/auth/desktop/browser?id=${'d'.repeat(64)}`,
              }
            : { ok: true },
        ),
      ),
    );
    await expect(
      t.service.login(
        () => {
          t.service.cancel();
          return Promise.resolve();
        },
        null,
        fetcher,
      ),
    ).rejects.toThrow('cancelled');
    expect(fetcher.mock.calls.some(([url]) => address(url).endsWith('/cancel'))).toBe(true);
    expect(t.service.owner()).toBe(`google-${t.record.account}`);
  });
});
