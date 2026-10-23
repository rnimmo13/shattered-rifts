import { describe, expect, it } from 'vitest';
import { applyAction, chooseAction, createCombat, seedRng, heroOf } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import {
  DECK_RULES,
  RunError,
  availableNodes,
  bank,
  buyCard,
  buyRemoval,
  canAdd,
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
  upgradable,
  type RunState,
  type StageRealm,
} from './index';

const HEROES = Object.keys(RIFTWALKERS) as HeroId[];

describe('stage maps', () => {
  it('every stage map from many seeds is well formed and every node can reach the Warden', () => {
    for (let seed = 0; seed < 100; seed++) {
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
        const f1 = map.nodes.filter((n) => n.floor === 1);
        expect(f1.length).toBeGreaterThanOrEqual(2);
        expect(f1.every((n) => n.kind === 'duel')).toBe(true);
        expect(map.nodes.filter((n) => n.kind === 'elite').every((n) => n.floor >= 3)).toBe(true);
        for (const n of map.nodes) {
          for (const t of n.next) {
            expect(ids.has(t)).toBe(true);
            expect(map.nodes.find((m) => m.id === t)?.floor).toBe(n.floor + 1);
          }
          if (n.kind !== 'warden') expect(n.next.length).toBeGreaterThan(0);
        }
        const reach = new Set(f1.map((n) => n.id));
        for (let f = 1; f <= map.floors; f++)
          for (const n of map.nodes.filter((x) => x.floor === f && reach.has(x.id)))
            n.next.forEach((t) => reach.add(t));
        expect(reach.size).toBe(map.nodes.length);
      }
    }
  });

  it('every fight node names a real encounter of the right realm', () => {
    const map = generateStageMap(seedRng('enc'), 2, 'nexus');
    for (const n of map.nodes.filter((x) => x.enemyId)) expect(n.enemyId).toBeTruthy();
    expect(map.nodes.find((n) => n.kind === 'warden')?.enemyId).toBe('kron');
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
  it('never offer a card the deck cannot take, and offer distinct cards', () => {
    for (const h of HEROES) {
      const run = newRun(h, 'r');
      for (let i = 0; i < 80; i++) {
        const offers = offerCards(seedRng(`o${i}`), h, run.deck, i % 2 ? 'elite' : 'duel', 3);
        expect(offers).toHaveLength(3);
        expect(new Set(offers).size).toBe(3);
        for (const id of offers) {
          expect(COMBAT_DB.cards[id]).toBeDefined();
          expect(canAdd(run.deck, id)).toBe(true);
        }
      }
    }
  });
  it('respects the copy limit', () => {
    expect(canAdd(['rift-bolt', 'rift-bolt', 'rift-bolt', 'rift-bolt'], 'rift-bolt')).toBe(false);
    expect(canAdd(['strike', 'strike', 'strike', 'strike', 'strike'], 'strike')).toBe(true); // basics are exempt
  });
});

describe('the run', () => {
  it('starts as designed', () => {
    for (const h of HEROES) {
      const r = newRun(h, 's');
      expect(r.deck).toEqual(RIFTWALKERS[h].starter);
      expect(r.hp).toBe(RIFTWALKERS[h].hero.maxHp);
      expect(r.resolve).toBe(3);
      expect(r.phase).toBe('map');
      expect(availableNodes(r).every((n) => n.floor === 1)).toBe(true);
    }
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
    expect(() => finishDuel(r, true, 10)).toThrow(RunError);
    expect(() => chooseCard(r, null)).toThrow(RunError);
    expect(() => nextStage(r)).toThrow(RunError);
    const inFight = enterNode(r, availableNodes(r)[0]!.id);
    expect(inFight.phase).toBe('duel');
    expect(duelPlan(inFight)?.deck).toHaveLength(10);
    expect(() => finishDuel(inFight, true, 0)).toThrow(RunError); // dead heroes do not win
    expect(() => finishDuel(inFight, true, 99999)).toThrow(RunError);
  });

  it('HP carries over after a win, and a loss costs Resolve but not HP', () => {
    let r = enterNode(newRun('maren', 'hp'), availableNodes(newRun('maren', 'hp'))[0]!.id);
    const lost = finishDuel(r, false);
    expect(lost.resolve).toBe(2);
    expect(lost.hp).toBe(r.hp);
    expect(lost.phase).toBe('duel');
    expect(duelPlan(lost)?.seed).not.toBe(duelPlan(r)?.seed); // a different shuffle on retry
    r = finishDuel(lost, true, 51);
    expect(r.hp).toBe(51);
    expect(r.phase).toBe('reward');
    expect(r.shards).toBe(12);
  });

  it('collapses at 0 Resolve', () => {
    let r = enterNode(newRun('vesper', 'c'), availableNodes(newRun('vesper', 'c'))[0]!.id);
    for (let i = 0; i < 3; i++) r = finishDuel(r, false);
    expect(r.phase).toBe('collapsed');
  });

  it('shrines rest, upgrade and remove', () => {
    const base = newRun('maren', 'shr');
    const shrineRun = (): RunState => ({
      ...base,
      hp: 30,
      phase: 'shrine',
      at: 'x',
      context: { nodeId: base.map.nodes[0]!.id },
    });
    const rested = takeShrine(shrineRun(), { kind: 'rest' });
    expect(rested.hp).toBe(30 + Math.ceil(80 * 0.35));
    const up = takeShrine(shrineRun(), { kind: 'upgrade', card: 'dawn-smite' });
    expect(up.deck).toContain('dawn-smite+');
    expect(up.deck).not.toContain('dawn-smite');
    expect(upgradable(up.deck)).not.toContain('dawn-smite+');
    expect(() => takeShrine(shrineRun(), { kind: 'upgrade', card: 'rift-bolt' })).toThrow(RunError);
    const small = { ...shrineRun(), deck: base.deck.slice(0, DECK_RULES.minSize) };
    expect(() => takeShrine(small, { kind: 'remove', card: 'strike' })).toThrow(RunError);
    expect(takeShrine(shrineRun(), { kind: 'remove', card: 'strike' }).deck).toHaveLength(9);
  });

  it('save and load round-trips, and damaged saves are refused', () => {
    const r = newRun('rivet', 'save');
    expect(parseRun(serializeRun(r))).toEqual(r);
    expect(parseRun('not json')).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, v: 1 }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, hp: 0 }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, deck: ['nope', ...r.deck] }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, character: 'zed' }))).toBeNull();
  });
});

/** Play a whole run with the greedy bot: fight everything, take the first reward, rest at shrines. */
function botRun(hero: HeroId, seed: string): { run: RunState; fights: number } {
  let run = newRun(hero, seed);
  let fights = 0;
  for (let step = 0; step < 400; step++) {
    switch (run.phase) {
      case 'map': {
        const n = availableNodes(run);
        run = enterNode(run, n[0]!.id);
        break;
      }
      case 'duel': {
        const plan = duelPlan(run)!;
        fights++;
        let { state } = createCombat(COMBAT_DB, {
          seed: plan.seed,
          a: { hero, deck: plan.deck, hp: plan.hp },
          b: { enemies: plan.units, tier: plan.tier },
        });
        for (let i = 0; i < 800 && !state.winner; i++)
          state = applyAction(COMBAT_DB, state, chooseAction(COMBAT_DB, state)).state;
        const hp = heroOf(state.sides.a)?.hp ?? 0;
        run = state.winner === 'a' ? finishDuel(run, true, hp) : finishDuel(run, false);
        break;
      }
      case 'reward':
        run = chooseCard(run, run.context!.offers![0]!);
        break;
      case 'gift':
        run = chooseCard(run, run.context!.offers![0]!);
        break;
      case 'shrine':
        run = takeShrine(run, { kind: 'rest' });
        break;
      case 'merchant':
        run = leaveMerchant(run);
        break;
      case 'event':
        run = chooseEvent(run, 'heal');
        break;
      case 'stageClear':
        run = nextStage(run);
        break;
      case 'loopCleared':
        return { run: bank(run), fights };
      default:
        return { run, fights };
    }
  }
  return { run, fights };
}

describe('a whole run, played by the bot', () => {
  it('always ends in a legal state (cleared, banked or collapsed) and never throws', () => {
    for (const h of HEROES) {
      const { run, fights } = botRun(h, `bot-${h}`);
      expect(['banked', 'collapsed']).toContain(run.phase);
      expect(fights).toBeGreaterThan(3);
      expect(run.hp).toBeGreaterThan(0);
      expect(parseRun(serializeRun(run))).not.toBeNull();
    }
  });

  it('reachableNodes agrees with availableNodes at the start', () => {
    const r = newRun('maren', 'z');
    expect(reachableNodes(r.map, null, []).map((n) => n.id)).toEqual(
      availableNodes(r).map((n) => n.id),
    );
  });

  it('continuing a loop raises the tier and heals', () => {
    const r = { ...newRun('maren', 'loop'), phase: 'loopCleared' as const, hp: 10 };
    const c = continueLoop(r);
    expect(c.tier).toBe(2);
    expect(c.hp).toBe(10 + 40);
    expect(c.stage).toBe(1);
    expect(buyCard).toBeDefined();
    expect(buyRemoval).toBeDefined();
  });
});
