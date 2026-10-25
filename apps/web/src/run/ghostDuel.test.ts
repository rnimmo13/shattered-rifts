import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { chooseSmartAction, hashState, type CombatSetup } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS } from '@sr/content/v2';
import { clearGhostLog, createGhostDuel } from './ghostDuel';
import type { FeedItem } from '../pvp/link';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  const g = globalThis as Record<string, unknown>;
  g['localStorage'] = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  g['window'] = { setTimeout, clearTimeout };
});
afterEach(() => {
  delete (globalThis as Record<string, unknown>)['window'];
});

const setup = (seed: string): CombatSetup => ({
  seed,
  a: {
    hero: 'knight',
    deck: [...RIFTWALKERS.knight.starter],
    hp: 90,
    maxHp: 90,
    boons: [],
    potions: [],
  },
  b: {
    hero: 'trapper',
    deck: [...RIFTWALKERS.trapper.starter],
    hp: 120,
    maxHp: 120,
    boons: [],
    potions: [],
  },
});
const names = { a: 'You', b: "Rob's ghost" } as const;
const progress = { a: { tier: 4 }, b: { tier: 5, stage: 2 } };
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe('a ghost Warden played over the PvP link', () => {
  it('plays a whole fight with the computer in the other seat, every move in order and checked', async () => {
    const duel = createGhostDuel(COMBAT_DB, setup('ghost-fight'), {
      names,
      progress,
      key: 'k1',
      think: () => 0,
    });
    const seen: FeedItem[] = [];
    expect(duel.link.replay).toBe(0);
    // the player acts when a move reaches the screen and it is their turn (as the fight screen does), until someone wins
    const play = (seq: number): void => {
      if (duel.state().winner || duel.state().active !== 'a' || seq !== duel.count()) return;
      duel.link.send(seq + 1, chooseSmartAction(COMBAT_DB, duel.state()));
    };
    duel.link.feed.attach((item) => {
      seen.push(item);
      // (only on the latest move: an older one reaching the screen is not yet the position to act on)
      if (item.kind === 'move' && item.move.seq === duel.count())
        setTimeout(() => play(item.move.seq), 0);
    });
    setTimeout(() => play(0), 0);
    for (let i = 0; i < 400 && !duel.state().winner; i++) await wait(10);
    await wait(30);
    duel.dispose();
    expect(duel.state().winner).toBeTruthy();
    const moves = seen.filter((s) => s.kind === 'move');
    expect(moves.length).toBeGreaterThan(10);
    // in order, from both seats, and the fingerprint of each is real
    moves.forEach((m, i) => {
      if (m.kind !== 'move') return;
      expect(m.move.seq).toBe(i + 1);
      expect(m.move.hash.length).toBeGreaterThan(5);
    });
    expect(moves.some((m) => m.kind === 'move' && m.move.seat === 'b')).toBe(true);
    const at = seen.findIndex((s) => s.kind === 'refused');
    expect(at, 'refused at ' + at + ' of ' + seen.length + ' last=' + JSON.stringify(seen.slice(Math.max(0, at - 2), at + 1))).toBe(-1);
    expect(hashState(duel.state()).length).toBeGreaterThan(5);
  }, 30_000);

  it('refuses a move out of turn or out of order, without breaking the fight', async () => {
    const duel = createGhostDuel(COMBAT_DB, setup('ghost-refuse'), {
      names,
      progress,
      key: 'k2',
      think: () => 0,
    });
    const seen: FeedItem[] = [];
    duel.link.feed.attach((i) => seen.push(i));
    duel.link.send(5, { type: 'endTurn' }); // not the number that comes next
    await wait(5);
    expect(seen.some((s) => s.kind === 'refused')).toBe(true);
    expect(seen.some((s) => s.kind === 'move')).toBe(false);
    duel.dispose();
  });

  it('is picked up where it was after a reload, from the same moves', async () => {
    const first = createGhostDuel(COMBAT_DB, setup('ghost-resume'), {
      names,
      progress,
      key: 'k3',
      think: () => 0,
    });
    let seq = 0;
    const act = (n: number): void => {
      if (first.state().winner || first.state().active !== 'a' || n >= 8 || n !== first.count()) return;
      first.link.send(n + 1, chooseSmartAction(COMBAT_DB, first.state()));
    };
    first.link.feed.attach((item) => {
      if (item.kind !== 'move') return;
      seq = item.move.seq;
      if (item.move.seq === first.count()) setTimeout(() => act(item.move.seq), 0);
    });
    setTimeout(() => act(0), 0);
    for (let i = 0; i < 100 && seq < 8 && !first.state().winner; i++) await wait(10);
    await wait(30);
    first.dispose();
    const hashThen = hashState(first.state());
    const made = seq;
    expect(made).toBeGreaterThanOrEqual(8);
    // the page is reloaded: a new duel from the same seed and key
    const again = createGhostDuel(COMBAT_DB, setup('ghost-resume'), {
      names,
      progress,
      key: 'k3',
      think: () => 0,
    });
    // (it carries on from the moves kept, which include however many the computer had made by then)
    expect(again.link.replay).toBeGreaterThanOrEqual(made);
    expect(again.link.replay).toBeLessThanOrEqual(made + 1);
    if (again.link.replay === made) expect(hashState(again.state())).toBe(hashThen);
    const history: FeedItem[] = [];
    again.link.feed.attach((i) => history.push(i));
    expect(history.filter((h) => h.kind === 'move' && h.history).length).toBe(again.link.replay);
    again.dispose();
    // a log of another fight is not this fight's, and a cleared one is gone
    const other = createGhostDuel(COMBAT_DB, setup('another-seed'), {
      names,
      progress,
      key: 'k3',
      think: () => 0,
    });
    expect(other.link.replay).toBe(0);
    other.dispose();
    clearGhostLog('k3');
    expect(createGhostDuel(COMBAT_DB, setup('ghost-resume'), { names, progress, key: 'k3' }).link.replay).toBe(0);
  }, 30_000);
});

describe('a ghost fight that was over when the page was reloaded', () => {
  it('plays the deciding move live, so the result still shows', async () => {
    const first = createGhostDuel(COMBAT_DB, setup('ghost-over'), {
      names,
      progress,
      key: 'k4',
      think: () => 0,
    });
    const act = (n: number): void => {
      if (first.state().winner || first.state().active !== 'a' || n !== first.count()) return;
      first.link.send(n + 1, chooseSmartAction(COMBAT_DB, first.state()));
    };
    first.link.feed.attach((item) => {
      if (item.kind === 'move' && item.move.seq === first.count()) setTimeout(() => act(item.move.seq), 0);
    });
    setTimeout(() => act(0), 0);
    for (let i = 0; i < 400 && !first.state().winner; i++) await wait(10);
    await wait(30);
    first.dispose();
    expect(first.state().winner).toBeTruthy();
    const total = first.count();
    // reloaded after the last move: all but that one is history, and it arrives live
    const again = createGhostDuel(COMBAT_DB, setup('ghost-over'), {
      names,
      progress,
      key: 'k4',
      think: () => 0,
    });
    expect(again.link.replay).toBe(total - 1);
    expect(again.state().winner).toBeFalsy();
    const seen: FeedItem[] = [];
    again.link.feed.attach((i) => seen.push(i));
    await wait(30);
    const live = seen.filter((s) => s.kind === 'move' && !s.history);
    expect(live).toHaveLength(1);
    expect(again.state().winner).toBeTruthy();
    expect(again.count()).toBe(total);
    again.dispose();
  }, 30_000);
});
