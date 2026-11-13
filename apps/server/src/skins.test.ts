/// <reference types="node" />
// An Arena opponent sees the look the other player's Riftwalker wears, ghosts included (DECISIONS #776). The look is always the
// server's word: the Vault says what is worn (and owned), a room takes it from the Vault and never from a browser, and a ghost keeps
// the look its deck was saved or last played in.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { RULES_VERSION } from '@sr/pvp';
import { Vault } from './vault';
import { Leaderboard } from './board';
import { MatchRoom } from './room';
import { playLooks } from './playAccess';
import type { Env } from './env';

const databases: DatabaseSync[] = [];
afterEach(() => {
  for (const db of databases.splice(0)) db.close();
  vi.unstubAllGlobals();
});

// ---- the Vault ----

function vault() {
  const db = new DatabaseSync(':memory:');
  databases.push(db);
  const ctx = {
    storage: {
      sql: {
        exec: (query: string, ...args: SQLInputValue[]) => {
          const rows = db.prepare(query).all(...args);
          return { toArray: () => rows };
        },
      },
      transactionSync: <T>(fn: () => T): T => {
        db.exec('BEGIN');
        try {
          const result = fn();
          db.exec('COMMIT');
          return result;
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
      },
    },
  };
  const object = new Vault(
    ctx as unknown as ConstructorParameters<typeof Vault>[0],
    {} as ConstructorParameters<typeof Vault>[1],
  );
  let token = '';
  const ask = async (action: string, body: object = {}) => {
    const response = await object.fetch(
      new Request(`https://vault.invalid/${action}`, {
        method: 'POST',
        headers: { 'x-sr-play-token': token },
        body: JSON.stringify(body),
      }),
    );
    return { status: response.status, data: await response.json<Record<string, unknown>>() };
  };
  return {
    ask,
    play: async (): Promise<void> => {
      token = (await ask('play/claim', { holder: 'pc' })).data['token'] as string;
    },
    /** the cosmetics the Vault holds, written as they are kept (so a copy the merge would never make can be set up) */
    setCosmetics: (c: object): void => {
      db.prepare("INSERT OR REPLACE INTO cosmetics (k, data) VALUES ('me', ?)").run(
        JSON.stringify(c),
      );
    },
  };
}

const savedDeck = (id: string, hero: HeroId) => ({
  id,
  hero,
  tier: 5,
  stage: 1,
  deck: [...RIFTWALKERS[hero].starter],
  boons: [],
  bankedAt: Date.now(),
  weaponCards: true,
});

describe('the Vault says which looks are worn (DECISIONS #776)', () => {
  it('the play check gives the looks worn and owned, by Riftwalker; a look worn but not owned is left out', async () => {
    const v = vault();
    await v.play();
    v.setCosmetics({
      owned: ['knight-demon-knight', 'monk-eclipse-ascetic'],
      worn: {
        knight: { skin: 'knight-demon-knight', at: 5 },
        // (worn, not owned)
        spellblade: { skin: 'spellblade-nova-ronin', at: 5 },
        // (owned, own look chosen)
        monk: { skin: null, at: 5 },
      },
    });
    const check = await v.ask('play/check', { looks: true });
    expect(check.status).toBe(200);
    expect(check.data['skins']).toEqual({ knight: 'knight-demon-knight' });
    // (a plain check, the one every move makes, carries no looks)
    expect((await v.ask('play/check')).data['skins']).toBeUndefined();
  });

  it('the play check gives no looks when none are worn', async () => {
    const v = vault();
    await v.play();
    expect((await v.ask('play/check', { looks: true })).data['skins']).toEqual({});
  });

  it("a saved deck's reply carries the look its Riftwalker wears, and none when nothing is worn", async () => {
    const v = vault();
    await v.play();
    v.setCosmetics({
      owned: ['knight-demon-knight'],
      worn: {
        knight: { skin: 'knight-demon-knight', at: 5 },
        spellblade: { skin: 'spellblade-nova-ronin', at: 5 },
      },
    });
    const knight = await v.ask('bank', { deck: savedDeck('r~k', 'knight') });
    expect(knight.data['ok']).toBe(true);
    expect(knight.data['skin']).toBe('knight-demon-knight');
    const hunter = await v.ask('bank', { deck: savedDeck('r~h', 'hunter') });
    expect(hunter.data['ok']).toBe(true);
    expect(hunter.data).not.toHaveProperty('skin');
    // (worn, not owned: none)
    const spellblade = await v.ask('bank', { deck: savedDeck('r~s', 'spellblade') });
    expect(spellblade.data['ok']).toBe(true);
    expect(spellblade.data).not.toHaveProperty('skin');
  });
});

// ---- playLooks ----

const vaultEnv = (reply: () => Promise<Response>): Env =>
  ({
    VAULT: { idFromName: (name: string) => name, get: () => ({ fetch: reply }) },
  }) as unknown as Env;

describe('playLooks (DECISIONS #776)', () => {
  it('gives the looks with a valid lease, keeping only text', async () => {
    const env = vaultEnv(() =>
      Promise.resolve(
        Response.json({
          expires: Date.now() + 60_000,
          skins: { knight: 'knight-demon-knight', monk: 7, hunter: null },
        }),
      ),
    );
    expect(await playLooks(env, 'account', 'proof')).toEqual({
      ok: true,
      skins: { knight: 'knight-demon-knight' },
    });
  });
  it('a reply with no looks (an older Vault) is a valid check with none', async () => {
    const env = vaultEnv(() => Promise.resolve(Response.json({ expires: Date.now() + 60_000 })));
    expect(await playLooks(env, 'account', 'proof')).toEqual({ ok: true, skins: {} });
  });
  it('gives ok:false and no looks when the lease is not valid', async () => {
    const skins = { knight: 'knight-demon-knight' };
    for (const reply of [
      () => Promise.resolve(Response.json({ expires: Date.now() - 1, skins })),
      () => Promise.resolve(Response.json({ ok: false, skins }, { status: 409 })),
      () => Promise.resolve(Response.json({ skins })),
      () => Promise.reject(new Error('gone')),
    ])
      expect(await playLooks(vaultEnv(reply), 'account', 'proof')).toEqual({
        ok: false,
        skins: {},
      });
  });
});

// ---- the board's ghosts ----

const OLD_GHOSTS = `CREATE TABLE ghosts (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL, owner_name TEXT NOT NULL,
  hero TEXT NOT NULL, deck TEXT NOT NULL, boons TEXT NOT NULL,
  tier INTEGER NOT NULL, stage INTEGER,
  wins INTEGER NOT NULL DEFAULT 0, losses INTEGER NOT NULL DEFAULT 0,
  ghost_wins INTEGER NOT NULL DEFAULT 0, ghost_losses INTEGER NOT NULL DEFAULT 0,
  first_at INTEGER NOT NULL, last_at INTEGER NOT NULL,
  run TEXT, ascendancy TEXT, max_hp INTEGER
)`;

function board(before?: (db: DatabaseSync) => void) {
  const db = new DatabaseSync(':memory:');
  databases.push(db);
  before?.(db);
  const kv = new Map<string, unknown>();
  const ctx = {
    storage: {
      kv: {
        get: (key: string) => kv.get(key),
        put: (key: string, value: unknown) => kv.set(key, value),
      },
      sql: {
        exec: (query: string, ...args: SQLInputValue[]) => {
          const rows = db.prepare(query).all(...args);
          return { toArray: () => rows, one: () => rows[0] };
        },
      },
    },
  };
  const b = new Leaderboard(
    ctx as unknown as ConstructorParameters<typeof Leaderboard>[0],
    {} as ConstructorParameters<typeof Leaderboard>[1],
  );
  const post = async (path: string, body: object) =>
    await (
      await b.fetch(
        new Request(`https://board.invalid${path}`, {
          method: 'POST',
          body: JSON.stringify({ ip: 'c'.repeat(64), ...body }),
        }),
      )
    ).json<Record<string, unknown>>();
  return { post, db };
}

const OWNER = 'a'.repeat(64);
const ASKER = 'b'.repeat(64);
const ghostEntry = (skin?: string) => ({
  name: 'Ann',
  hero: 'knight',
  deck: [...RIFTWALKERS.knight.starter],
  boons: [],
  tier: 5,
  stage: 1,
  run: 'abcdef0123',
  ...(skin === undefined ? {} : { skin }),
});
const pickedEntry = async (post: ReturnType<typeof board>['post']) => {
  const r = await post('/ghost/pick', { requester: ASKER });
  const ghost = r['ghost'] as { entry: Record<string, unknown> } | null;
  return ghost?.entry ?? null;
};

describe('a ghost keeps the look its deck was saved or last played in (DECISIONS #776)', () => {
  it('stores the look it is registered with and gives it back when picked', async () => {
    const { post } = board();
    expect(
      (await post('/ghost/register', { owner: OWNER, entry: ghostEntry('knight-demon-knight') }))[
        'registered'
      ],
    ).toBe(true);
    const entry = await pickedEntry(post);
    expect(entry).toMatchObject({ hero: 'knight', skin: 'knight-demon-knight' });
  });

  it('a look of another Riftwalker, or an unknown one, is not stored', async () => {
    for (const skin of ['spellblade-nova-ronin', 'knight-made-up']) {
      const { post } = board();
      await post('/ghost/register', { owner: OWNER, entry: ghostEntry(skin) });
      const entry = await pickedEntry(post);
      expect(entry).not.toBeNull();
      expect(entry).not.toHaveProperty('skin');
    }
  });

  it('registering the same deck again with no look clears it (it follows its last save or game)', async () => {
    const { post, db } = board();
    await post('/ghost/register', { owner: OWNER, entry: ghostEntry('knight-demon-knight') });
    await post('/ghost/register', { owner: OWNER, entry: ghostEntry() });
    expect(db.prepare('SELECT COUNT(*) AS n FROM ghosts').get()).toEqual({ n: 1 });
    expect(await pickedEntry(post)).not.toHaveProperty('skin');
    // ... and a later save in another look takes that one
    await post('/ghost/register', { owner: OWNER, entry: ghostEntry('knight-sunwarden') });
    expect(await pickedEntry(post)).toMatchObject({ skin: 'knight-sunwarden' });
  });

  it('a ghost from before the column existed has no look, and the column is added', async () => {
    const now = Date.now();
    const { post, db } = board((db) => {
      db.exec(OLD_GHOSTS);
      db.prepare(
        'INSERT INTO ghosts (id, owner, owner_name, hero, deck, boons, tier, stage, first_at, last_at, run) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(
        'old-ghost',
        OWNER,
        'Ann',
        'knight',
        JSON.stringify([...RIFTWALKERS.knight.starter]),
        '[]',
        5,
        1,
        now,
        now,
        'abcdef0123',
      );
    });
    const columns = db.prepare("SELECT name FROM pragma_table_info('ghosts')").all() as {
      name: string;
    }[];
    expect(columns.map((c) => c.name)).toContain('skin');
    const r = await post('/ghost/pick', { requester: ASKER });
    const ghost = r['ghost'] as { id: string; entry: Record<string, unknown> };
    expect(ghost.id).toBe('old-ghost');
    expect(ghost.entry).toMatchObject({ hero: 'knight' });
    expect(ghost.entry).not.toHaveProperty('skin');
  });
});

// ---- the room ----

const EXTRA = ['alarm-bell', 'catch-breath', 'glimpse-ahead', 'haft-strike', 'heave'];
const arenaDeck = (hero: HeroId, skin?: string) => ({
  name: hero,
  hero,
  deck: [...RIFTWALKERS[hero].starter, ...EXTRA],
  boons: [],
  tier: 5,
  stage: 1,
  ...(skin === undefined ? {} : { skin }),
});

interface FakeSocket {
  sent: Record<string, unknown>[];
  serializeAttachment(v: unknown): void;
  deserializeAttachment(): unknown;
  send(text: string): void;
  close(): void;
}
const fakeSocket = (vaultName: string): FakeSocket => {
  let at: unknown = { playerId: '', seat: null, pending: true, play: { vault: vaultName, token: 't' } };
  const ws: FakeSocket = {
    sent: [],
    serializeAttachment: (v) => void (at = v),
    deserializeAttachment: () => at,
    send: (text) => void ws.sent.push(JSON.parse(text) as Record<string, unknown>),
    close: () => undefined,
  };
  return ws;
};

/** A room whose players' Vaults say they wear these looks (by Vault name). */
function room(looks: Record<string, Record<string, string>>) {
  vi.stubGlobal('WebSocketRequestResponsePair', class {});
  const stored = new Map<string, unknown>();
  const sockets: FakeSocket[] = [];
  const ctx = {
    setWebSocketAutoResponse: () => undefined,
    blockConcurrencyWhile: (fn: () => Promise<void>) => fn(),
    getWebSockets: () => sockets,
    storage: {
      get: (k: string) => Promise.resolve(stored.get(k)),
      put: (k: string, v: unknown) => {
        stored.set(k, structuredClone(v));
        return Promise.resolve();
      },
      setAlarm: () => Promise.resolve(),
      deleteAll: () => Promise.resolve(),
    },
  };
  const vaultFetches: string[] = [];
  const env = {
    VAULT: {
      idFromName: (name: string) => name,
      get: (name: string) => ({
        fetch: () => {
          vaultFetches.push(name);
          return Promise.resolve(
            Response.json({ ok: true, expires: Date.now() + 60_000, skins: looks[name] ?? {} }),
          );
        },
      }),
    },
    BOARD: {
      idFromName: (name: string) => name,
      get: () => ({ fetch: () => Promise.resolve(Response.json({ ok: true })) }),
    },
  };
  const object = new MatchRoom(
    ctx as unknown as ConstructorParameters<typeof MatchRoom>[0],
    env as unknown as ConstructorParameters<typeof MatchRoom>[1],
  );
  const say = async (ws: FakeSocket, msg: object) =>
    await object.webSocketMessage(ws as unknown as WebSocket, JSON.stringify(msg));
  const join = async (vaultName: string, decks: object[]) => {
    const ws = fakeSocket(vaultName);
    sockets.push(ws);
    await say(ws, { type: 'join', playerId: 'x', rules: RULES_VERSION, decks });
    return ws;
  };
  return { object, say, join, vaultFetches };
}
const startOf = (ws: FakeSocket) =>
  ws.sent.find((m) => m['type'] === 'start') as
    | { seat: 'a' | 'b'; a: Record<string, unknown>; b: Record<string, unknown> }
    | undefined;
const foeOf = (ws: FakeSocket) => {
  const s = startOf(ws);
  if (!s) throw new Error('no start message');
  return s.seat === 'a' ? s.b : s.a;
};

describe("a room shows each player's look from their Vault, never from the browser (DECISIONS #776)", () => {
  it("replaces a look the browser claims with the Vault's, and the opponent's start message carries it", async () => {
    const r = room({ ann: { knight: 'knight-demon-knight', spellblade: 'spellblade-nova-ronin' }, bob: {} });
    // Ann's browser says Sunwarden; her Vault says the Demon Knight. Bob's browser claims a look his Vault does not say he wears.
    const ann = await r.join('ann', [arenaDeck('knight', 'knight-sunwarden'), arenaDeck('spellblade')]);
    const bob = await r.join('bob', [arenaDeck('hunter', 'hunter-tempest-prowler')]);
    // (Ann's other deck, offered to her to choose, carries her Vault's look of that Riftwalker)
    const choose = ann.sent.find((m) => m['type'] === 'choose') as { decks: Record<string, unknown>[] };
    expect(choose.decks.map((d) => d['skin'])).toEqual(['knight-demon-knight', 'spellblade-nova-ronin']);
    for (const ws of [ann, bob]) {
      await r.say(ws, { type: 'pick', deck: 0 });
      await r.say(ws, { type: 'order', first: true });
    }
    expect(foeOf(bob)).toMatchObject({ hero: 'knight', skin: 'knight-demon-knight' });
    expect(foeOf(ann)).toMatchObject({ hero: 'hunter' });
    expect(foeOf(ann)).not.toHaveProperty('skin');
  });

  it('asks the Vault no more often than before: one check before each message, and the join check gives the looks', async () => {
    const r = room({ ann: { knight: 'knight-demon-knight' } });
    await r.join('ann', [arenaDeck('knight')]);
    // (the check every message makes, and the join's own: as before the looks were added)
    expect(r.vaultFetches).toEqual(['ann', 'ann']);
  });

  it("a ghost's look reaches the player it is set against", async () => {
    const r = room({ ann: {} });
    const set = await r.object.fetch(
      new Request('https://room.invalid/ghost/abc', {
        method: 'POST',
        body: JSON.stringify({
          ghost: { id: 'g1', entry: { ...arenaDeck('knight', 'knight-demon-knight'), name: "Bo's ghost" } },
        }),
      }),
    );
    expect(set.status).toBe(200);
    const ann = await r.join('ann', [arenaDeck('hunter')]);
    await r.say(ann, { type: 'pick', deck: 0 });
    await r.say(ann, { type: 'order', first: true });
    expect(foeOf(ann)).toMatchObject({ hero: 'knight', skin: 'knight-demon-knight' });
  });
});
