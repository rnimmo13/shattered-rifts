import { describe, expect, it } from 'vitest';
import { CARD_DB, DECK_RULES, validateDeck, type CharacterId } from '@sr/content';
import { nextInt, seedRng } from '@sr/engine';
import {
  RunError,
  availableNodes,
  bank,
  buyCard,
  buyRemoval,
  chooseCard,
  chooseEvent,
  continueLoop,
  duelPlan,
  enterNode,
  finishDuel,
  generateStageMap,
  leaveMerchant,
  newRun,
  nextStage,
  offerCards,
  parseRun,
  reachableNodes,
  serializeRun,
  takeShrine,
  type RunState,
  type StageRealm,
} from './index';

const REALMS: StageRealm[] = ['aurelion', 'nexus', 'wyldmaw', 'umbral'];

describe('stage maps', () => {
  it('every stage map from many seeds is well formed and every node can reach the Warden', () => {
    for (let seed = 0; seed < 150; seed++) {
      for (const [stage, realm] of [
        [1, 'aurelion'],
        [2, 'nexus'],
        [3, 'wyldmaw'],
        [4, 'umbral'],
      ] as [number, StageRealm][]) {
        const map = generateStageMap(seedRng(`m${seed}`), stage, realm);
        const ids = new Set(map.nodes.map((n) => n.id));
        expect(ids.size).toBe(map.nodes.length);
        const warden = map.nodes.find((n) => n.kind === 'warden');
        expect(warden?.enemyId).toBeTruthy();
        // floor 1 is all duels; elites are limited and never on floor 1 or 2
        const f1 = map.nodes.filter((n) => n.floor === 1);
        expect(f1.length).toBeGreaterThanOrEqual(2);
        expect(f1.every((n) => n.kind === 'duel')).toBe(true);
        expect(map.nodes.filter((n) => n.kind === 'elite').length).toBeLessThanOrEqual(1);
        expect(map.nodes.filter((n) => n.kind === 'elite').every((n) => n.floor >= 3)).toBe(true);
        expect(map.nodes.filter((n) => n.kind === 'merchant').length).toBeLessThanOrEqual(1 + 1);
        // every edge points to a real node on the next floor
        for (const n of map.nodes) {
          for (const t of n.next) {
            expect(ids.has(t)).toBe(true);
            expect(map.nodes.find((m) => m.id === t)?.floor).toBe(n.floor + 1);
          }
          if (n.kind !== 'warden') expect(n.next.length).toBeGreaterThan(0);
        }
        // every node is reachable from the start, and the Warden is reachable from every node
        const reach = new Set(f1.map((n) => n.id));
        for (let f = 1; f <= map.floors; f++)
          for (const n of map.nodes.filter((x) => x.floor === f && reach.has(x.id)))
            n.next.forEach((t) => reach.add(t));
        expect(reach.size).toBe(map.nodes.length);
        for (const n of map.nodes) {
          let frontier = [n.id];
          for (let f = n.floor; f < map.floors && frontier.length; f++)
            frontier = frontier.flatMap((id) => map.nodes.find((x) => x.id === id)?.next ?? []);
          if (n.kind !== 'warden') expect(frontier).toContain(warden?.id);
        }
      }
    }
  });

  it('the last stage is a Shrine or a Merchant, then Vorthax', () => {
    const map = generateStageMap(seedRng('x'), 5, 'rift');
    expect(
      map.nodes
        .filter((n) => n.floor === 1)
        .map((n) => n.kind)
        .sort(),
    ).toEqual(['merchant', 'shrine']);
    expect(map.nodes.find((n) => n.kind === 'warden')?.enemyId).toBe('vorthax');
  });

  it('is deterministic per seed', () => {
    expect(generateStageMap(seedRng('same'), 1, 'nexus')).toEqual(
      generateStageMap(seedRng('same'), 1, 'nexus'),
    );
  });
});

describe('rewards', () => {
  it('never offers a card the deck cannot take, and offers distinct cards', () => {
    for (const ch of ['maren', 'rivet', 'kesh', 'vesper'] as CharacterId[]) {
      const run = newRun(ch, 'r');
      for (let i = 0; i < 80; i++) {
        const offers = offerCards(seedRng(`o${i}`), ch, run.deck, i % 2 ? 'elite' : 'duel', 3);
        expect(offers).toHaveLength(3);
        expect(new Set(offers).size).toBe(3);
        for (const id of offers) {
          expect(CARD_DB[id]).toBeDefined();
          expect(validateDeck([...run.deck, id], CARD_DB, 0)).toEqual([]);
        }
      }
    }
  });
});

describe('the run', () => {
  it('starts as documented', () => {
    const r = newRun('maren', 's');
    expect(r.deck).toHaveLength(20);
    expect(r.resolve).toBe(3);
    expect(r.tier).toBe(1);
    expect(r.stage).toBe(1);
    expect(r.phase).toBe('map');
    expect(availableNodes(r).every((n) => n.floor === 1)).toBe(true);
    expect([...r.stageRealms].sort()).toEqual(['aurelion', 'nexus', 'wyldmaw']);
  });

  it('is the same run for the same seed and never mutates what it is given', () => {
    const a = newRun('kesh', 'seed-1');
    const snapshot = JSON.stringify(a);
    enterNode(a, availableNodes(a)[0]!.id);
    expect(JSON.stringify(a)).toBe(snapshot);
    expect(JSON.stringify(newRun('kesh', 'seed-1'))).toBe(snapshot);
  });

  it('rejects things the rules forbid', () => {
    const r = newRun('rivet', 's');
    expect(() => enterNode(r, 'nope')).toThrow(RunError);
    expect(() => finishDuel(r, true)).toThrow(RunError);
    expect(() => chooseCard(r, null)).toThrow(RunError);
    expect(() => nextStage(r)).toThrow(RunError);
    const inDuel = enterNode(r, availableNodes(r)[0]!.id);
    expect(inDuel.phase).toBe('duel');
    expect(() => enterNode(inDuel, availableNodes(r)[1]!.id)).toThrow(RunError);
    expect(duelPlan(inDuel)?.deck).toHaveLength(20);
  });

  it('a lost duel costs Resolve and retries the same node; 0 Resolve collapses the run', () => {
    let r = enterNode(newRun('maren', 's'), availableNodes(newRun('maren', 's'))[0]!.id);
    const node = r.context?.nodeId;
    r = finishDuel(r, false);
    expect(r.resolve).toBe(2);
    expect(r.phase).toBe('duel');
    expect(r.context?.nodeId).toBe(node);
    r = finishDuel(finishDuel(r, false), false);
    expect(r.resolve).toBe(0);
    expect(r.phase).toBe('collapsed');
  });

  it('a won duel gives shards and a card to take or skip', () => {
    let r = enterNode(newRun('maren', 's'), availableNodes(newRun('maren', 's'))[0]!.id);
    r = finishDuel(r, true);
    expect(r.phase).toBe('reward');
    expect(r.shards).toBeGreaterThan(0);
    const offers = r.context?.offers ?? [];
    expect(offers.length).toBe(3);
    const picked = chooseCard(r, offers[0]!);
    expect(picked.deck).toHaveLength(21);
    expect(picked.phase).toBe('map');
    const skipped = chooseCard(r, null);
    expect(skipped.deck).toHaveLength(20);
    expect(skipped.cleared).toHaveLength(1);
    expect(() => chooseCard(r, 'AUR-99')).toThrow(RunError);
  });

  it('shrines restore Resolve or remove a card, but never below the minimum deck', () => {
    const base = newRun('maren', 's');
    const shrine = {
      ...base,
      phase: 'shrine' as const,
      context: { nodeId: base.map.nodes[0]!.id },
      resolve: 1,
    };
    const rested = takeShrine(shrine, { kind: 'rest' });
    expect(rested.resolve).toBe(2);
    expect(() => takeShrine(shrine, { kind: 'remove', card: shrine.deck[0]! })).toThrow(RunError);
    const fat = { ...shrine, deck: [...shrine.deck, 'AUR-04'] };
    expect(takeShrine(fat, { kind: 'remove', card: 'AUR-04' }).deck).toHaveLength(20);
  });

  it('the merchant sells cards for shards and removes one card', () => {
    const base = newRun('maren', 's');
    const merchant = {
      ...base,
      phase: 'merchant' as const,
      shards: 500,
      deck: [...base.deck, 'AUR-04', 'AUR-05'],
      context: {
        nodeId: base.map.nodes[0]!.id,
        merchant: {
          items: [{ cardId: 'NEU-01', price: 60, sold: false }],
          removePrice: 40,
          removed: false,
        },
      },
    };
    const bought = buyCard(merchant, 0);
    expect(bought.shards).toBe(440);
    expect(bought.deck).toContain('NEU-01');
    expect(() => buyCard(bought, 0)).toThrow(RunError);
    const removed = buyRemoval(bought, 'AUR-05');
    expect(removed.shards).toBe(400);
    expect(() => buyRemoval(removed, 'AUR-04')).toThrow(RunError);
    expect(leaveMerchant(removed).phase).toBe('map');
    expect(() => buyCard({ ...merchant, shards: 1 }, 0)).toThrow(RunError);
  });

  it('events pay shards or a card', () => {
    const base = newRun('vesper', 's');
    const ev = {
      ...base,
      phase: 'event' as const,
      context: {
        nodeId: base.map.nodes[0]!.id,
        event: {
          title: 't',
          text: 't',
          cardOffer: 'UMB-01',
          options: [
            { id: 'shards' as const, label: 'a' },
            { id: 'card' as const, label: 'b' },
            { id: 'leave' as const, label: 'c' },
          ],
        },
      },
    };
    expect(chooseEvent(ev, 'shards').shards).toBe(30);
    expect(chooseEvent(ev, 'card').deck).toContain('UMB-01');
    expect(chooseEvent(ev, 'leave').deck).toHaveLength(20);
  });
});

/** Plays a whole run, winning or losing each duel according to `wins`, taking a random legal choice everywhere. */
function playRun(character: CharacterId, seed: string, wins: (n: number) => boolean) {
  const rand = seedRng(`bot:${seed}`);
  let r: RunState = newRun(character, seed);
  let duels = 0;
  const log: string[] = [];
  for (let guard = 0; guard < 2000; guard++) {
    log.push(r.phase);
    switch (r.phase) {
      case 'map': {
        const opts = availableNodes(r);
        expect(opts.length).toBeGreaterThan(0);
        r = enterNode(r, opts[nextInt(rand, opts.length)]!.id);
        break;
      }
      case 'duel': {
        const plan = duelPlan(r);
        expect(plan).not.toBeNull();
        expect(validateDeck(plan!.deck, CARD_DB, DECK_RULES.minSize)).toEqual([]);
        r = finishDuel(r, wins(duels++));
        break;
      }
      case 'reward':
      case 'gift': {
        const offers = r.context?.offers ?? [];
        expect(offers.length).toBeGreaterThan(0);
        r = chooseCard(
          r,
          r.phase === 'reward' && nextInt(rand, 4) === 0
            ? null
            : offers[nextInt(rand, offers.length)]!,
        );
        break;
      }
      case 'shrine':
        r = takeShrine(r, { kind: 'rest' });
        break;
      case 'merchant':
        r = leaveMerchant(r);
        break;
      case 'event':
        r = chooseEvent(r, 'shards');
        break;
      case 'stageClear':
        r = nextStage(r);
        break;
      default:
        return { r, log };
    }
    expect(validateDeck(r.deck, CARD_DB, 0)).toEqual([]);
  }
  throw new Error('the run never ended');
}

describe('a whole run', () => {
  for (const ch of ['maren', 'rivet', 'kesh', 'vesper'] as CharacterId[]) {
    it(`${ch}: winning every duel clears all five stages, then Bank or Continue`, () => {
      const { r } = playRun(ch, `win-${ch}`, () => true);
      expect(r.phase).toBe('loopCleared');
      expect(r.stage).toBe(5);
      expect(r.stats.duelsLost).toBe(0);
      const banked = bank(r);
      expect(banked.phase).toBe('banked');
      const again = continueLoop(r);
      expect(again.tier).toBe(2);
      expect(again.stage).toBe(1);
      expect(again.phase).toBe('map');
      expect(again.deck).toEqual(r.deck);
      expect(again.resolve).toBe(3);
      // Tier II enemies have more Essence
      const n = availableNodes(again)[0]!;
      const inDuel = enterNode(again, n.id);
      const plan = duelPlan(inDuel)!;
      expect(plan.essence).toBeGreaterThan(14);
    });
  }

  it('losing every duel collapses the run quickly', () => {
    const { r } = playRun('maren', 'lose', () => false);
    expect(r.phase).toBe('collapsed');
    expect(r.resolve).toBe(0);
  });

  it('a run with some losses still reaches the end when it keeps winning afterwards', () => {
    const { r } = playRun('kesh', 'mixed', (n) => n % 5 !== 3);
    expect(['loopCleared', 'collapsed']).toContain(r.phase);
  });

  it('a save round-trips, and damaged saves are refused', () => {
    const { r } = playRun('rivet', 'save', () => true);
    const text = serializeRun(r);
    expect(parseRun(text)).toEqual(r);
    expect(parseRun('not json')).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, v: 2 }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, deck: [...r.deck, 'NOPE-1'] }))).toBeNull();
    expect(
      parseRun(JSON.stringify({ ...r, deck: [...r.deck, ...Array<string>(5).fill('AUR-01')] })),
    ).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, resolve: 99 }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, phase: 'hacked' }))).toBeNull();
  });

  it('reachable nodes follow the map edges', () => {
    const r = newRun('maren', 'edges');
    const first = availableNodes(r)[0]!;
    const next = reachableNodes(r.map, first.id, []);
    expect(next.map((n) => n.id).sort()).toEqual([...first.next].sort());
    expect(REALMS).toContain(r.map.realm);
  });
});

describe('damaged saves', () => {
  const good = () => JSON.parse(serializeRun(newRun('maren', 'dmg'))) as Record<string, unknown>;
  const mk = (f: (r: Record<string, unknown>) => void): string => {
    const r = good();
    f(r);
    return JSON.stringify(r);
  };
  it('are refused instead of crashing the screens', () => {
    expect(parseRun(mk(() => undefined))).not.toBeNull();
    expect(parseRun(mk((r) => ((r['map'] as { nodes: unknown[] }).nodes = [])))).toBeNull();
    expect(parseRun(mk((r) => ((r['map'] as { nodes: null }).nodes = null)))).toBeNull();
    expect(
      parseRun(
        mk((r) => ((r['map'] as { nodes: { enemyId: string }[] }).nodes[0]!.enemyId = 'nobody')),
      ),
    ).toBeNull();
    expect(parseRun(mk((r) => (r['at'] = 'ghost-node')))).toBeNull();
    expect(parseRun(mk((r) => (r['cleared'] = ['ghost-node'])))).toBeNull();
    expect(parseRun(mk((r) => (r['phase'] = 'reward')))).toBeNull(); // reward with no offers
    expect(parseRun(mk((r) => (r['phase'] = 'duel')))).toBeNull(); // duel with no node
    expect(parseRun(mk((r) => (r['phase'] = 'merchant')))).toBeNull();
    expect(parseRun('x'.repeat(2_100_000))).toBeNull();
  });
});
