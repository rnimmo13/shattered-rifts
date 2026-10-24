import { describe, expect, it } from 'vitest';
import { chooseAction, hashState } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import {
  checkEntry,
  enqueue,
  leave,
  Match,
  MAX_MISSED_TURNS,
  pairUp,
  QUEUE_WIDEN_MS,
  TURN_MS,
  type Entry,
  type Waiting,
} from './index';

const entryOf = (hero: HeroId, name: string = hero, tier = 1): Entry => ({
  name,
  hero,
  deck: [...RIFTWALKERS[hero].starter],
  tier,
});

describe('checkEntry', () => {
  it('takes a real starter deck and cleans the name', () => {
    const r = checkEntry({ ...entryOf('maren'), name: '  <b>Rob</b>\u0007  ' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.entry.name).toBe('bRob/b');
  });

  it('refuses things that are not a deck', () => {
    expect(checkEntry(null).ok).toBe(false);
    expect(checkEntry({ ...entryOf('maren'), hero: 'constructor' }).ok).toBe(false);
    expect(checkEntry({ ...entryOf('maren'), deck: 'strike' }).ok).toBe(false);
    expect(checkEntry({ ...entryOf('maren'), deck: ['strike', 5] }).ok).toBe(false);
    expect(checkEntry({ ...entryOf('maren'), deck: ['strike'] }).ok).toBe(false); // too small
    expect(
      checkEntry({ ...entryOf('maren'), deck: [...Array<string>(20).fill('strike'), 'toString'] })
        .ok,
    ).toBe(false);
    expect(checkEntry({ ...entryOf('maren'), deck: Array(200).fill('strike') }).ok).toBe(false);
  });

  it('refuses a deck that breaks the copy rules', () => {
    const deck = [...entryOf('maren').deck, ...Array<string>(5).fill('rift-bolt')];
    expect(checkEntry({ ...entryOf('maren'), deck }).ok).toBe(false);
  });

  it('does not allow a pile of one basic card', () => {
    const many = Array<string>(11).fill('strike');
    expect(checkEntry({ ...entryOf('maren'), deck: many }).ok).toBe(false);
    expect(checkEntry({ ...entryOf('maren'), deck: Array<string>(10).fill('strike') }).ok).toBe(
      true,
    );
  });

  it('clamps the tier', () => {
    const r = checkEntry({ ...entryOf('maren'), tier: 999 });
    expect(r.ok && r.entry.tier).toBeLessThanOrEqual(20);
    const s = checkEntry({ ...entryOf('maren'), tier: 'high' });
    expect(s.ok && s.entry.tier).toBe(1);
  });
});

describe('the queue', () => {
  const w = (id: string, tier: number, since = 0): Waiting => ({ id, tier, since });

  it('pairs close tiers, longest wait first', () => {
    const r = pairUp([w('a', 1, 0), w('b', 5, 1), w('c', 2, 2)], 5_000);
    expect(r.pairs.map((p) => p.map((x) => x.id))).toEqual([['a', 'c']]);
    expect(r.rest.map((x) => x.id)).toEqual(['b']);
  });

  it('pairs anyone once someone has waited long enough', () => {
    const r = pairUp([w('a', 1, 0), w('b', 9, 1)], QUEUE_WIDEN_MS + 1);
    expect(r.pairs).toHaveLength(1);
  });

  it('keeps a single player waiting', () => {
    const r = pairUp([w('a', 1, 0)], 100_000);
    expect(r.pairs).toHaveLength(0);
    expect(r.rest).toHaveLength(1);
  });

  it('picks the nearest tier and never pairs a player with themselves', () => {
    const r = pairUp([w('a', 3, 0), w('b', 4, 1), w('c', 3, 2)], 1000);
    expect(r.pairs[0]?.map((x) => x.id)).toEqual(['a', 'c']);
    const q = enqueue(enqueue([], w('x', 1)), w('x', 2));
    expect(q).toHaveLength(1);
    expect(leave(q, 'x')).toHaveLength(0);
  });
});

/** Play a whole match with the greedy bot on both seats, through the Match rules. */
function playOut(m: Match, now = 0): void {
  let guard = 0;
  while (!m.over && guard++ < 3000) {
    const action = chooseAction(COMBAT_DB, m.state);
    const r = m.submit(m.active, m.log.length + 1, action, now);
    if (!r.ok) throw new Error(`refused: ${r.message}`);
  }
}

describe('a match', () => {
  it('plays to a finish, and the same seed and moves rebuild the same match', () => {
    const a = entryOf('maren', 'A');
    const b = entryOf('kesh', 'B');
    const m = new Match('seed-1', a, b, 0);
    playOut(m);
    expect(m.over).not.toBeNull();
    const again = new Match('seed-1', a, b, 0);
    for (const { seat, action } of m.log) {
      const r = again.submit(seat, again.log.length + 1, action, 0);
      expect(r.ok).toBe(true);
    }
    expect(hashState(again.state)).toBe(hashState(m.state));
    expect(again.over?.winner).toBe(m.over?.winner);
  });

  it('refuses a move out of turn, out of order, or illegal', () => {
    const m = new Match('seed-2', entryOf('maren'), entryOf('kesh'), 0);
    const notMe = m.active === 'a' ? 'b' : 'a';
    const first = chooseAction(COMBAT_DB, m.state);
    expect(m.submit(notMe, 1, first, 0)).toMatchObject({ ok: false, code: 'not-your-turn' });
    expect(m.submit(m.active, 5, first, 0)).toMatchObject({ ok: false, code: 'out-of-order' });
    expect(m.submit(m.active, 1, { type: 'play', card: 'no-such-card' }, 0)).toMatchObject({
      ok: false,
      code: 'illegal',
    });
    // nothing was applied by the refusals
    expect(m.log).toHaveLength(0);
    expect(m.submit(m.active, 1, first, 0)).toMatchObject({ ok: true, seq: 1 });
    // the same message again is a repeat
    expect(m.submit(m.active, 1, first, 0)).toMatchObject({ ok: false });
  });

  it('gives the turn to the other seat after endTurn and restarts the clock', () => {
    const m = new Match('seed-3', entryOf('maren'), entryOf('kesh'), 1000);
    expect(m.active).toBe('a');
    expect(m.deadline).toBe(1000 + TURN_MS);
    expect(m.submit('a', 1, { type: 'endTurn' }, 5000)).toMatchObject({ ok: true });
    expect(m.active).toBe('b');
    expect(m.deadline).toBe(5000 + TURN_MS);
  });

  it('ends the turn of a player who runs out of time, and forfeits after too many', () => {
    const m = new Match('seed-4', entryOf('maren'), entryOf('kesh'), 0);
    const t1 = m.timeout(TURN_MS);
    expect(t1.moves.length).toBeGreaterThan(0);
    expect(m.active).toBe('b');
    expect(m.over).toBeNull();
    // b acts for themselves; a then misses again on the next turn
    expect(m.submit('b', m.log.length + 1, { type: 'endTurn' }, TURN_MS + 10).ok).toBe(true);
    expect(m.active).toBe('a');
    let last = m.timeout(2 * TURN_MS);
    for (let i = 1; i < MAX_MISSED_TURNS && !last.outcome; i++) last = m.timeout(3 * TURN_MS);
    expect(m.over).toMatchObject({ winner: 'b', reason: 'timeout' });
  });

  it('a resignation ends it and nothing more is accepted', () => {
    const m = new Match('seed-5', entryOf('maren'), entryOf('kesh'), 0);
    m.end('b', 'resign');
    expect(m.submit('a', 1, { type: 'endTurn' }, 0)).toMatchObject({ ok: false, code: 'no-match' });
    expect(m.over).toMatchObject({ winner: 'b', reason: 'resign' });
  });

  it('a rebuilt match keeps its ending and its missed turns', () => {
    const a = entryOf('maren');
    const b = entryOf('kesh');
    const m = new Match('seed-6', a, b, 0);
    m.timeout(TURN_MS); // a misses one turn
    const outcome = m.end('b', 'resign');
    // the room rebuilds a match by replaying its moves, then puts back what the moves cannot say
    const again = new Match('seed-6', a, b, 0);
    for (const { seat, action } of m.log) again.submit(seat, again.log.length + 1, action, 0);
    expect(again.over).toBeNull();
    expect(again.missed.a).toBe(0); // the replay alone forgets
    again.restore(outcome, m.missed);
    expect(again.over).toMatchObject({ winner: 'b', reason: 'resign' });
    expect(again.missed.a).toBe(1);
    expect(again.submit(again.active, again.log.length + 1, { type: 'endTurn' }, 0)).toMatchObject({
      ok: false,
      code: 'no-match',
    });
  });

  it('every Riftwalker can fight another to a finish', () => {
    const heroes = Object.keys(RIFTWALKERS) as HeroId[];
    for (const [i, h] of heroes.entries()) {
      const o = heroes[(i + 3) % heroes.length] as HeroId;
      const m = new Match(`pairs-${h}`, entryOf(h), entryOf(o), 0);
      playOut(m);
      expect(m.over, `${h} v ${o}`).not.toBeNull();
    }
  });
});
