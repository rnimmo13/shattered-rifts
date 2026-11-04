// Ownership-aware transport for the existing protocol smoke utility. It does not play a match itself.
import { createHash } from 'node:crypto';
import { normaliseCode, VAULT_CODE_ALPHABET, VAULT_CODE_LENGTH } from '@sr/pvp';

export function smokeTransport(base: string) {
  const raw = globalThis.fetch;
  const http = base.replace(/^ws/, 'http');
  const tokens = new Map<string, string>();
  async function claim(code: string): Promise<string> {
    const existing = tokens.get(code);
    if (existing) return existing;
    const response = await raw(`${http}/pvp/play/claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, holder: 'protocol-smoke' }),
    });
    const data = (await response.json()) as { token?: unknown };
    if (!response.ok || typeof data.token !== 'string')
      throw new Error('Could not claim the protocol test account.');
    tokens.set(code, data.token);
    return data.token;
  }
  const heartbeat = setInterval(() => {
    for (const [code, token] of tokens)
      void raw(`${http}/pvp/play/renew`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-sr-play-token': token },
        body: JSON.stringify({ code }),
      }).catch(() => undefined);
  }, 10000);
  heartbeat.unref();
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (
      !url.pathname.match(
        /^\/pvp\/(vault\/(bank|drop|runsave|listsync)|board\/(run|ghostboss))$/,
      ) ||
      typeof init?.body !== 'string'
    )
      return raw(input, init);
    const body = JSON.parse(init.body) as Record<string, unknown>;
    const code = typeof body.code === 'string' ? normaliseCode(body.code) : null;
    if (!code) return raw(input, init);
    const token = await claim(code);
    const headers = new Headers(init.headers);
    headers.set('x-sr-play-token', token);
    if (url.pathname.endsWith('/runsave')) {
      const response = await raw(`${http}/pvp/vault/runs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code }),
      });
      const current = (await response.json()) as { revision?: unknown; replays?: unknown };
      body.revision = current.revision;
      body.replays ??= current.replays ?? {};
    }
    return raw(input, { ...init, headers, body: JSON.stringify(body) });
  };
  return {
    async socket(path: string, id: string): Promise<string> {
      const url = new URL(`${base}${path}`);
      if (id === 'watcher') {
        url.searchParams.set('watch', '1');
        return url.toString();
      }
      const bytes = createHash('sha256').update(id).digest();
      const code = Array.from(
        { length: VAULT_CODE_LENGTH },
        (_, i) => VAULT_CODE_ALPHABET[bytes[i]! % VAULT_CODE_ALPHABET.length],
      ).join('');
      url.searchParams.set('code', code);
      url.searchParams.set('play', await claim(code));
      return url.toString();
    },
    async dispose(): Promise<void> {
      clearInterval(heartbeat);
      for (const [code, token] of tokens)
        await raw(`${http}/pvp/play/release`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-sr-play-token': token },
          body: JSON.stringify({ code }),
        });
      globalThis.fetch = raw;
    },
  };
}
