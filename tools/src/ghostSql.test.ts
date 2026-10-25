// Runs the server's "current ghosts" SQL (apps/server/src/ghostSql.ts) against a plain SQLite database. It lives here because only the tools have Node types.
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { CURRENT_GHOSTS_VIEW } from '../../apps/server/src/ghostSql';

const open = (): DatabaseSync => {
  const db = new DatabaseSync(':memory:');
  db.exec(
    `CREATE TABLE ghosts (id TEXT PRIMARY KEY, owner TEXT NOT NULL, hero TEXT NOT NULL, run TEXT, last_at INTEGER NOT NULL)`,
  );
  db.exec(CURRENT_GHOSTS_VIEW);
  return db;
};
const add = (
  db: DatabaseSync,
  id: string,
  owner: string,
  hero: string,
  run: string | null,
  at: number,
): void => {
  db.prepare('INSERT INTO ghosts VALUES (?, ?, ?, ?, ?)').run(id, owner, hero, run, at);
};
const shown = (db: DatabaseSync): string[] =>
  (db.prepare('SELECT id FROM current_ghosts ORDER BY id').all() as { id: string }[]).map((r) => r.id);

describe('which ghosts are current', () => {
  it('shows only the latest of the copies an older save left behind', () => {
    const db = open();
    add(db, 'a', 'p1', 'knight', null, 100);
    add(db, 'b', 'p1', 'knight', null, 200);
    add(db, 'c', 'p1', 'knight', null, 300);
    expect(shown(db)).toEqual(['c']);
  });

  it('hides an older copy once the same run is saved under its own id', () => {
    const db = open();
    add(db, 'old', 'p1', 'knight', null, 100);
    add(db, 'new', 'p1', 'knight', 'abc123', 200);
    expect(shown(db)).toEqual(['new']);
  });

  it('keeps decks of other players, other Riftwalkers and other runs', () => {
    const db = open();
    add(db, 'a', 'p1', 'knight', 'run1', 100);
    add(db, 'b', 'p1', 'knight', 'run2', 200);
    add(db, 'c', 'p1', 'hunter', null, 150);
    add(db, 'd', 'p2', 'knight', null, 120);
    expect(shown(db)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('breaks a tie on the time by id, so exactly one is shown', () => {
    const db = open();
    add(db, 'a', 'p1', 'knight', null, 100);
    add(db, 'b', 'p1', 'knight', null, 100);
    expect(shown(db)).toEqual(['b']);
  });

  it('deletes nothing', () => {
    const db = open();
    add(db, 'a', 'p1', 'knight', null, 100);
    add(db, 'b', 'p1', 'knight', null, 200);
    expect((db.prepare('SELECT COUNT(*) AS n FROM ghosts').get() as { n: number }).n).toBe(2);
  });
});
