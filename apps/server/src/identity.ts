import { DurableObject } from 'cloudflare:workers';
import type { Env } from './env';
import { sha256 } from './auth';

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
const random = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
const valid = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
interface Attempt {
  challenge: string;
  expires: number;
  steam: string | null;
  account?: string;
  confirmation?: string;
  complete?: boolean;
}
interface NativeSession {
  account: string;
  proof: string;
  expires: number;
}

/** One coordinator serializes identity linking. Never exposed directly by the public router. */
export class Identity extends DurableObject<Env> {
  override async fetch(request: Request): Promise<Response> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const action = new URL(request.url).pathname;
      const b = await request.json<Record<string, unknown>>();
      const now = Date.now(),
        storage = this.ctx.storage;
      if (action === '/resolve') {
        if (!valid(b['account'])) return json({}, 400);
        return json({
          account: (await storage.get<string>(`alias:${b['account']}`)) ?? b['account'],
        });
      }
      if (action === '/session' || action === '/logout') {
        const token =
          typeof b['token'] === 'string'
            ? /^d1\.([a-f0-9]{64})\.([a-f0-9]{64})$/.exec(b['token'])
            : null;
        if (!token) return json({}, 401);
        const key = `session:${token[1]}`,
          s = await storage.get<NativeSession>(key);
        if (!s || s.expires <= now || s.proof !== (await sha256(token[2]!))) return json({}, 401);
        if (action === '/logout') {
          await storage.delete(key);
          return json({ ok: true });
        }
        return json({ account: s.account, provider: 'google' });
      }
      if (action === '/begin') {
        if (!valid(b['challenge']) || (b['steam'] !== null && !valid(b['steam'])))
          return json({}, 400);
        const rateKey = `rate:${String(b['ip'])}`;
        const old = await storage.get<{ count: number; expires: number }>(rateKey);
        const rate = old && old.expires > now ? old : { count: 0, expires: now + 600000 };
        if (rate.count >= 10)
          return json({ error: 'Too many sign-in attempts. Try again in ten minutes.' }, 429);
        rate.count++;
        await storage.put(rateKey, rate);
        const id = random();
        await storage.put<Attempt>(`attempt:${id}`, {
          challenge: b['challenge'],
          steam: b['steam'],
          expires: now + 600000,
        });
        await storage.setAlarm(now + 60000);
        return json({ id });
      }
      if (!valid(b['id'])) return json({}, 400);
      const key = `attempt:${b['id']}`,
        a = await storage.get<Attempt>(key);
      if (!a || a.expires <= now)
        return json({ error: 'Sign-in expired. Please try again from the app.' }, 410);
      if (action === '/inspect') return json({ link: a.steam !== null });
      if (action === '/deny') {
        await storage.delete(key);
        return json({ ok: true });
      }
      if (action === '/cancel') {
        if (!valid(b['verifier']) || (await sha256(b['verifier'])) !== a.challenge)
          return json({}, 401);
        await storage.delete(key);
        return json({ ok: true });
      }
      if (action === '/authorize') {
        if (!valid(b['account']) || a.account)
          return json({ error: 'Sign-in already completed.' }, 409);
        a.account = b['account'];
        a.confirmation = random();
        await storage.put(key, a);
        return json({ confirmation: a.confirmation ?? null });
      }
      if (action === '/confirm') {
        if (
          !a.account ||
          a.account !== b['account'] ||
          a.confirmation !== b['confirmation'] ||
          !valid(b['confirmation'])
        )
          return json({}, 403);
        if (b['cancel'] === true) {
          await storage.delete(key);
          return json({ cancelled: true });
        }
        const existing = a.steam ? await storage.get<string>(`alias:${a.steam}`) : null;
        if (existing && existing !== a.account)
          return json(
            { error: 'This Steam account is already linked to another Google account.' },
            409,
          );
        if (a.steam && !existing) {
          // Sealing the old Vault fences requests already in flight before the alias is installed.
          const name = await sha256(`shattered-rifts-account-vault:${a.steam}`);
          const response = await this.env.VAULT.get(this.env.VAULT.idFromName(name)).fetch(
            new Request('https://vault.invalid/identity/seal', {
              method: 'POST',
              body: JSON.stringify({ account: a.account }),
            }),
          );
          if (!response.ok)
            return json(
              {
                error:
                  'Steam already has separate progress or an active play session. Linking cannot overwrite it.',
              },
              409,
            );
          await storage.put(`alias:${a.steam}`, a.account);
        }
        a.complete = true;
        delete a.confirmation;
        await storage.put(key, a);
        return json({ ok: true });
      }
      if (action === '/exchange') {
        if (!valid(b['verifier']) || (await sha256(b['verifier'])) !== a.challenge)
          return json({}, 401);
        if (!a.complete || !a.account) return json({ pending: true }, 202);
        if (a.steam) {
          await storage.delete(key);
          return json({ linked: true, account: a.account });
        }
        const id = random(),
          secret = random(),
          expires = now + 30 * 86400000;
        await storage.put<NativeSession>(`session:${id}`, {
          account: a.account,
          proof: await sha256(secret),
          expires,
        });
        await storage.delete(key);
        await storage.setAlarm(now + 60000);
        return json({ token: `d1.${id}.${secret}`, account: a.account, expires });
      }
      return json({}, 404);
    });
  }
  override async alarm(): Promise<void> {
    let remaining = false;
    for (const prefix of ['attempt:', 'session:', 'rate:']) {
      const records = await this.ctx.storage.list<{ expires: number }>({ prefix });
      for (const [key, value] of records) {
        if (value.expires <= Date.now()) await this.ctx.storage.delete(key);
        else remaining = true;
      }
    }
    if (remaining) await this.ctx.storage.setAlarm(Date.now() + 60000);
  }
}

export async function identityCall(env: Env, action: string, body: unknown): Promise<Response> {
  if (!env.IDENTITY) return json({ error: 'Desktop sign-in is not configured.' }, 503);
  return env.IDENTITY.get(env.IDENTITY.idFromName('accounts-v1')).fetch(
    new Request(`https://identity.invalid/${action}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  );
}
export async function resolveSteamAccount(env: Env, account: string): Promise<string> {
  if (!env.IDENTITY) return account;
  const response = await identityCall(env, 'resolve', { account });
  if (!response.ok) throw new Error('Account lookup unavailable');
  return (await response.json<{ account: string }>()).account;
}
