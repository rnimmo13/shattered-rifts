// The Echo and the Rift Cache (DECISIONS #549).

import { describe, expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS } from '@sr/content/v2';
import {
  CACHE_STASH,
  ECHO_ENDURING,
  ECHO_FROM_TIER,
  ECHO_HP_PCT,
  GHOST_ENDURING,
  availableNodes,
  chooseEvent,
  duelPlan,
  enterNode,
  finishDuel,
  floorsOf,
  generateStageMap,
  ghostBossHp,
  ghostToSettle,
  ghostsToSkip,
  newRun,
  parseRun,
  serializeRun,
  settleGhost,
  type MapNode,
  type RunState,
} from './index';

const mapAt = (tier: number, seed: string) =>
  generateStageMap(seedRng(seed), 1, 'aurelion', 'knight', undefined, tier);

/** the knight's own cards of a rarity (for a ghost deck worth taking from) */
const knightCards = (rarity: string): string[] =>
  Object.values(COMBAT_DB.cards)
    .filter((c) => c.hero === 'knight' && c.rarity === rarity && !c.source && !c.id.endsWith('+'))
    .map((c) => c.id);

const ghost = (id = 'g1') => ({
  id,
  name: 'Rob',
  hero: 'knight',
  deck: [
    ...RIFTWALKERS.knight.starter,
    ...knightCards('rare').slice(0, 3),
    ...knightCards('uncommon').slice(0, 3),
  ],
  boons: [],
  tier: 5,
  stage: 2,
});

/** a Tier V run on a map with an Echo, every ghost on it settled (the Echo's with `g`, a Warden's with nothing) */
function withEcho(g: unknown = ghost()): { run: RunState; echo: MapNode } {
  for (let i = 0; i < 200; i++) {
    const map = mapAt(5, `echo-${i}`);
    const echo = map.nodes.find((n) => n.kind === 'echo');
    if (!echo) continue;
    let run: RunState = { ...newRun('knight', 'echo'), tier: 5, map, phase: 'map', at: null };
    for (let at = ghostToSettle(run); at; at = ghostToSettle(run))
      run = settleGhost(run, at.kind === 'echo' ? g : null);
    return { run, echo };
  }
  throw new Error('no map with an Echo');
}

/** stand on the stop just before `id`, so it is the next one to take */
function before(run: RunState, id: string): RunState {
  const from = run.map.nodes.find((n) => n.next.includes(id))!;
  return { ...run, at: from.id, cleared: [...run.cleared, from.id], phase: 'map', context: null };
}

describe('the map', () => {
  it('has one Rift Cache at every tier, on a middle floor', () => {
    for (let tier = 1; tier <= 20; tier += 3) {
      for (let i = 0; i < 10; i++) {
        const map = mapAt(tier, `cache-${tier}-${i}`);
        const caches = map.nodes.filter((n) => n.kind === 'cache');
        expect(caches.length, `tier ${tier} map ${i}`).toBe(1);
        const c = caches[0]!;
        expect(c.floor).toBeGreaterThanOrEqual(3);
        expect(c.floor).toBeLessThanOrEqual(floorsOf(tier) - 2);
        expect(c.enemyId).toBeUndefined();
      }
    }
  });

  it(`has one Echo from Tier ${ECHO_FROM_TIER}, a ghost standing on a plain fight, and none before`, () => {
    for (let tier = 1; tier < ECHO_FROM_TIER; tier++)
      expect(mapAt(tier, `e-${tier}`).nodes.some((n) => n.kind === 'echo')).toBe(false);
    for (let tier = ECHO_FROM_TIER; tier <= 20; tier += 4) {
      const echoes = mapAt(tier, `e-${tier}`).nodes.filter((n) => n.kind === 'echo');
      expect(echoes.length, `tier ${tier}`).toBe(1);
      expect(echoes[0]!.ghost).toBe(true);
      expect(echoes[0]!.enemyId).toBeTruthy();
    }
  });
});

describe('the Echo', () => {
  it('with no ghost to be had, is the plain fight it stands on', () => {
    const { run, echo } = withEcho(null);
    const n = run.map.nodes.find((x) => x.id === echo.id)!;
    expect(n.kind).toBe('duel');
    expect(n.ghost).toBeUndefined();
  });

  it('never brings a ghost already waiting on the map', () => {
    const map = mapAt(5, 'dupe');
    const w = map.nodes.find((n) => n.kind === 'warden')!;
    w.ghost = true;
    let run: RunState = { ...newRun('knight', 'dupe'), tier: 5, map, phase: 'map', at: null };
    // (the Echo is settled first or second; whichever comes second gets the same ghost and refuses it)
    run = settleGhost(run, ghost('same'));
    expect(ghostsToSkip(run)).toContain('same');
    run = settleGhost(run, ghost('same'));
    const settled = run.map.nodes.filter((n) => n.ghostDeck?.id === 'same');
    expect(settled.length).toBe(1);
    expect(ghostToSettle(run)).toBeNull();
  });

  it('is a share of a ghost Warden, Enduring, and costs 2 Resolve', () => {
    const { run, echo } = withEcho();
    const r = enterNode(before(run, echo.id), echo.id);
    expect(r.phase).toBe('duel');
    expect(r.eventResult).toMatch(/^Echo!/);
    const plan = duelPlan(r)!;
    expect(plan.ghost?.hp).toBe(Math.round((ghostBossHp('knight', 5, 1) * ECHO_HP_PCT) / 100));
    expect(plan.ghost?.statuses.enduring).toBe(ECHO_ENDURING);
    expect(finishDuel(r, false).resolve).toBe(r.resolve - 2);
  });

  it('lays out its best cards when it falls, never a basic one', () => {
    const { run, echo } = withEcho();
    const r = finishDuel(enterNode(before(run, echo.id), echo.id), true, 10);
    expect(r.phase).toBe('reward');
    const offers = r.context!.offers!;
    expect(offers.length).toBe(3);
    for (const id of offers) {
      expect(ghost().deck).toContain(id);
      expect(COMBAT_DB.cards[id]?.rarity).toBe('rare');
    }
  });
});

describe('an Echo pays like an Elite', () => {
  it('a Boon by the tier’s Elite chance', () => {
    let boons = 0;
    for (let i = 0; i < 20; i++) {
      const { run, echo } = withEcho(ghost(`b${i}`));
      const r = finishDuel(enterNode(before({ ...run, seed: `boon-${i}` }, echo.id), echo.id), true, 10);
      if (r.context?.boonGained) boons++;
    }
    expect(boons).toBeGreaterThan(0);
  });
});

describe('a ghost Warden', () => {
  it('is Enduring too', () => {
    for (let i = 0; i < 400; i++) {
      const map = mapAt(5, `gw-${i}`);
      const w = map.nodes.find((n) => n.kind === 'warden')!;
      if (!w.ghost) continue;
      let run: RunState = { ...newRun('knight', 'gw'), tier: 5, map, phase: 'map', at: null };
      for (let at = ghostToSettle(run); at; at = ghostToSettle(run))
        run = settleGhost(run, ghost(at.id));
      run = { ...run, phase: 'duel', context: { nodeId: w.id } };
      run = enterNode(before(run, w.id), w.id);
      expect(duelPlan(run)!.ghost?.statuses.enduring).toBe(GHOST_ENDURING);
      return;
    }
    throw new Error('no ghost Warden');
  });
});

describe('the Rift Cache', () => {
  function atCache(seed: string): RunState {
    const map = mapAt(1, seed);
    const c = map.nodes.find((n) => n.kind === 'cache')!;
    const run: RunState = { ...newRun('knight', seed), map, phase: 'map', at: null };
    return enterNode(before(run, c.id), c.id);
  }

  it('is open or trapped, and either way a choice to walk away from', () => {
    const titles = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const r = atCache(`c-${i}`);
      expect(r.phase).toBe('event');
      const ev = r.context!.event!;
      titles.add(ev.title);
      expect(ev.options.some((o) => o.id === 'leave')).toBe(true);
      expect(ev.options.filter((o) => o.deal).length).toBeGreaterThanOrEqual(2);
    }
    expect(titles).toEqual(new Set(['A Rift Cache', 'A trapped Rift Cache']));
  });

  it('an open one pays its stash, and the stop is cleared', () => {
    for (let i = 0; i < 40; i++) {
      const r = atCache(`s-${i}`);
      const stash = r.context!.event!.options.find((o) => o.label.startsWith('Take the stash'));
      if (!stash) continue;
      const after = chooseEvent(r, stash.id);
      expect(after.shards).toBe(r.shards + CACHE_STASH);
      expect(after.phase).toBe('map');
      expect(after.cleared).toContain(r.context!.nodeId);
      return;
    }
    throw new Error('no open Cache');
  });

  it('a trapped one gives the Boon and a rare card for its price', () => {
    for (let i = 0; i < 40; i++) {
      const r = atCache(`t-${i}`);
      const ev = r.context!.event!;
      if (ev.title !== 'A trapped Rift Cache') continue;
      const reach = ev.options.find((o) => o.label.startsWith('Reach past the wire'))!;
      const after = chooseEvent(r, reach.id);
      expect(after.boons.length).toBe(r.boons.length + 1);
      expect(after.deck.length).toBe(r.deck.length + 2); // the rare card and the Wound
      expect(after.deck).toContain('wound');
      // (every option holds the same card: they differ only in their price)
      const given = ev.options
        .filter((o) => o.deal)
        .map((o) => JSON.stringify(o.deal!.filter((s) => s.k === 'card')));
      expect(new Set(given).size).toBe(1);
      return;
    }
    throw new Error('no trapped Cache');
  });

  it('saves and loads, Caches and Echoes alike', () => {
    const { run } = withEcho();
    const back = parseRun(serializeRun(run));
    expect(back?.map.nodes.filter((n) => n.kind === 'echo' || n.kind === 'cache').length).toBe(2);
    expect(availableNodes(back!).length).toBeGreaterThan(0);
  });
});
