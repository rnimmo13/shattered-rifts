/// <reference types="node" />
import { afterEach, describe, expect, it } from 'vitest';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { Vault } from './vault';

const databases: DatabaseSync[] = [];
afterEach(() => {
  for (const db of databases.splice(0)) db.close();
});
function create() {
  const db = new DatabaseSync(':memory:');
  databases.push(db);
  const ctx = {
    storage: {
      sql: {
        exec: (query: string, ...args: SQLInputValue[]) => ({
          toArray: () => db.prepare(query).all(...args),
        }),
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
  // SQL exec executes immediately in Workers, rather than waiting for toArray().
  ctx.storage.sql.exec = (query: string, ...args: SQLInputValue[]) => {
    const rows = db.prepare(query).all(...args);
    return { toArray: () => rows };
  };
  const vault = new Vault(
    ctx as unknown as ConstructorParameters<typeof Vault>[0],
    {} as ConstructorParameters<typeof Vault>[1],
  );
  const ask = async (action: string, body: object = {}, token = '') => {
    const response = await vault.fetch(
      new Request(`https://vault.invalid/${action}`, {
        method: 'POST',
        headers: { 'x-sr-play-token': token },
        body: JSON.stringify(body),
      }),
    );
    const data = await response.json<Record<string, unknown>>();
    return { status: response.status, data };
  };
  return { ask, db };
}
describe('actual Vault gameplay fences and save transactions', () => {
  it('seals only a never-played Steam Vault and rejects all stale requests afterward', async () => {
    const empty = create(),
      target = 'a'.repeat(64);
    expect((await empty.ask('identity/seal', { account: target })).status).toBe(200);
    expect((await empty.ask('play/claim', { holder: 'old-device' })).status).toBe(409);
    expect((await empty.ask('cosmetics', {})).status).toBe(409);
    expect((await empty.ask('identity/seal', { account: target })).status).toBe(200);
    expect((await empty.ask('identity/seal', { account: 'b'.repeat(64) })).status).toBe(409);
    const played = create();
    await played.ask('play/claim', { holder: 'old-device' });
    expect((await played.ask('identity/seal', { account: target })).status).toBe(409);
  });
  it('lets two devices browse, but admits only one simultaneous play claim', async () => {
    const { ask } = create();
    expect((await ask('list')).status).toBe(200);
    const results = await Promise.all([
      ask('play/claim', { holder: 'desktop' }),
      ask('play/claim', { holder: 'phone' }),
    ]);
    expect(results.map((x) => x.status).sort()).toEqual([200, 409]);
    expect((await ask('runs')).status).toBe(200);
    expect((await ask('listsync', { list: 'history', readOnly: true })).status).toBe(200);
    expect((await ask('drop', { id: 'x' })).status).toBe(409);
    expect((await ask('runsave', { runs: [], revision: 0, replays: {} })).status).toBe(409);
  });
  it('rejects stale revisions and old holders after release/reclaim', async () => {
    const { ask } = create();
    const first = await ask('play/claim', { holder: 'desktop' });
    const token = first.data.token as string;
    const old = { id: 'run-1', updated: 9999999999999, text: 'first' };
    expect(
      (
        await ask(
          'runsave',
          { runs: [old], revision: 0, replays: { 'sr.fightlog:a': 'moves' } },
          token,
        )
      ).status,
    ).toBe(200);
    expect(
      (await ask('runsave', { runs: [{ ...old, text: 'stale' }], revision: 0, replays: {} }, token))
        .status,
    ).toBe(409);
    await ask('play/release', {}, token);
    const next = await ask('play/claim', { holder: 'phone' });
    expect(next.data.revision).toBe(1);
    expect(next.data.replays).toEqual({ 'sr.fightlog:a': 'moves' });
    expect((await ask('runsave', { runs: [], revision: 1, replays: {} }, token)).status).toBe(409);
    expect((await ask('play/renew', {}, token)).status).toBe(409);
    expect(
      (
        await ask(
          'runsave',
          { runs: [{ ...old, updated: 1, text: 'new phone progress' }], revision: 1, replays: {} },
          next.data.token as string,
        )
      ).status,
    ).toBe(200);
    expect((await ask('runs')).data.runs).toEqual([
      expect.objectContaining({ text: 'new phone progress' }),
    ]);
  });
  it('does not partially change runs when replay validation fails', async () => {
    const { ask } = create();
    const first = await ask('play/claim', { holder: 'desktop' });
    expect(
      (
        await ask(
          'runsave',
          {
            runs: [{ id: 'bad', updated: 1, text: 'must not persist' }],
            revision: 0,
            replays: { invalid: 'data' },
          },
          first.data.token as string,
        )
      ).status,
    ).toBe(400);
    const result = await ask('runs');
    expect(result.data.runs).toEqual([]);
    expect(result.data.revision).toBe(0);
  });
});
