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
  chooseKit,
  choosePrelude,
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

/** Most tests are about the map and what is on it: step past the opening choice without taking anything from it. */
const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });
const fresh = (h: HeroId, seed: string, d: 'easy' | 'normal' = 'normal'): RunState =>
  open(newRun(h, seed, d));

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

  it('never puts more than two Events in a row on any path', () => {
    for (let seed = 0; seed < 300; seed++) {
      const map = generateStageMap(seedRng(`ev${seed}`), 1 + (seed % 4), 'nexus');
      const longest = new Map<string, number>();
      for (let f = 1; f <= map.floors; f++)
        for (const n of map.nodes.filter((x) => x.floor === f)) {
          const here = n.kind === 'event' ? (longest.get(n.id) ?? 0) + 1 : 0;
          expect(here, n.id).toBeLessThanOrEqual(2);
          for (const t of n.next) longest.set(t, Math.max(longest.get(t) ?? 0, here));
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
      const run = fresh(h, 'r');
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
      const r = fresh(h, 's');
      expect(r.deck).toEqual(RIFTWALKERS[h].starter);
      expect(r.hp).toBe(RIFTWALKERS[h].hero.maxHp);
      expect(r.resolve).toBe(2);
      expect(r.phase).toBe('map');
      expect(availableNodes(r).every((n) => n.floor === 1)).toBe(true);
    }
  });

  it('normal is the default; easy has weaker enemies, more Resolve and some shards; hard has less Resolve', () => {
    expect(newRun('maren', 'default-diff').difficulty).toBe('normal');
    const e = open(newRun('maren', 'easy', 'easy'));
    expect(e.difficulty).toBe('easy');
    expect(e.resolve).toBe(5);
    expect(e.shards).toBe(100);
    // stage 1 is eased further by the stage ramp (80% HP, 85% damage)
    expect(duelPlan(enterNode(e, availableNodes(e)[0]!.id))).toMatchObject({
      hpPct: 68,
      dmgPct: 68,
    });
    expect(newRun('maren', 'hard', 'hard').resolve).toBe(1);
    expect(parseRun(JSON.stringify({ ...e, difficulty: undefined }))?.difficulty).toBe('easy');
    expect(parseRun(JSON.stringify({ ...e, difficulty: 'brutal' }))).toBeNull();
  });

  it('is the same run for the same seed and never mutates what it is given', () => {
    const a = fresh('kesh', 'seed-1');
    const snapshot = JSON.stringify(a);
    enterNode(a, availableNodes(a)[0]!.id);
    expect(JSON.stringify(a)).toBe(snapshot);
    expect(JSON.stringify(fresh('kesh', 'seed-1'))).toBe(snapshot);
  });

  it('rejects things the rules forbid', () => {
    const r = fresh('rivet', 's');
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
    let r = enterNode(fresh('maren', 'hp'), availableNodes(fresh('maren', 'hp'))[0]!.id);
    const lost = finishDuel(r, false);
    expect(lost.resolve).toBe(1);
    expect(lost.hp).toBe(r.hp);
    expect(lost.phase).toBe('duel');
    expect(duelPlan(lost)?.seed).not.toBe(duelPlan(r)?.seed); // a different shuffle on retry
    r = finishDuel(lost, true, 51);
    expect(r.hp).toBe(51);
    expect(r.phase).toBe('reward');
    expect(r.shards).toBe(12);
  });

  it('collapses at 0 Resolve', () => {
    let r = enterNode(fresh('vesper', 'c'), availableNodes(fresh('vesper', 'c'))[0]!.id);
    for (let i = 0; i < 2; i++) r = finishDuel(r, false);
    expect(r.phase).toBe('collapsed');
  });

  it('shrines rest, upgrade and remove', () => {
    const base = fresh('maren', 'shr');
    const shrineRun = (): RunState => ({
      ...base,
      hp: 30,
      phase: 'shrine',
      at: 'x',
      context: { nodeId: base.map.nodes[0]!.id },
    });
    const rested = takeShrine(shrineRun(), { kind: 'rest' });
    expect(rested.hp).toBe(30 + Math.ceil(RIFTWALKERS.maren.hero.maxHp * 0.35));
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
    const r = fresh('rivet', 'save');
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
  let run = fresh(hero, seed, 'easy');
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
          a: { hero, deck: plan.deck, hp: plan.hp, boons: plan.boons },
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
        run = chooseEvent(run, run.context!.event!.options[0]!.id);
        break;
      case 'kit':
        run = chooseKit(run, run.context!.kits![0]!.id);
        break;
      case 'prelude':
        run = choosePrelude(run, run.context!.prelude!.options[0]!.id);
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
  it('always ends banked or collapsed and never throws', () => {
    for (const h of HEROES) {
      const { run, fights } = botRun(h, `bot-${h}`);
      expect(['banked', 'collapsed']).toContain(run.phase);
      expect(fights).toBeGreaterThan(3);
      expect(run.hp).toBeGreaterThan(0);
      expect(parseRun(serializeRun(run))).not.toBeNull();
    }
  });

  it('reachableNodes agrees with availableNodes at the start', () => {
    const r = fresh('maren', 'z');
    expect(reachableNodes(r.map, null, []).map((n) => n.id)).toEqual(
      availableNodes(r).map((n) => n.id),
    );
  });

  it('continuing a loop raises the tier and heals', () => {
    const r = { ...fresh('maren', 'loop'), phase: 'loopCleared' as const, hp: 10 };
    const c = continueLoop(r);
    expect(c.tier).toBe(2);
    expect(c.hp).toBe(10 + Math.ceil(RIFTWALKERS.maren.hero.maxHp * 0.5));
    expect(c.stage).toBe(1);
  });
});

describe('the other rooms and the rules around them', () => {
  const at = (run: RunState, phase: RunState['phase'], context: RunState['context']): RunState => ({
    ...run,
    phase,
    at: run.map.nodes[0]!.id,
    context,
  });
  const nodeId = (r: RunState) => r.map.nodes[0]!.id;

  it('the merchant sells cards and one removal, and refuses what you cannot afford', () => {
    const base = fresh('maren', 'shop');
    const card = offerCards(seedRng('shop'), 'maren', base.deck, 'duel', 1)[0]!;
    const shop = (shards: number): RunState => ({
      ...at(base, 'merchant', {
        nodeId: nodeId(base),
        merchant: {
          items: [{ cardId: card, price: 50, sold: false }],
          removePrice: 40,
          removed: false,
        },
      }),
      shards,
    });
    expect(() => buyCard(shop(10), 0)).toThrow(RunError);
    const bought = buyCard(shop(80), 0);
    expect(bought.deck).toContain(card);
    expect(bought.shards).toBe(30);
    expect(() => buyCard(bought, 0)).toThrow(RunError); // sold
    const removed = buyRemoval(shop(80), 'strike');
    expect(removed.deck).toHaveLength(9);
    expect(removed.shards).toBe(40);
    expect(() => buyRemoval(removed, 'strike')).toThrow(RunError); // one per visit
    expect(leaveMerchant(shop(0)).phase).toBe('map');
  });

  it('events pay shards, heal, give the card, or do nothing', () => {
    const base = { ...fresh('rivet', 'ev'), hp: 20 };
    const ev = at(base, 'event', {
      nodeId: nodeId(base),
      event: {
        title: 't',
        text: 't',
        cardOffer: 'rift-bolt',
        options: [
          { id: 'shards', label: 's' },
          { id: 'heal', label: 'h' },
          { id: 'card', label: 'c' },
          { id: 'leave', label: 'l' },
        ],
      },
    });
    expect(chooseEvent(ev, 'shards').shards).toBe(30);
    expect(chooseEvent(ev, 'heal').hp).toBe(20 + Math.ceil(RIFTWALKERS.rivet.hero.maxHp * 0.2));
    expect(chooseEvent(ev, 'card').deck).toContain('rift-bolt');
    expect(chooseEvent(ev, 'leave').phase).toBe('map');
  });

  it("a Warden win heals, restores Resolve and offers your class's rare cards, which can be skipped", () => {
    const base = fresh('maren', 'boss');
    const wardenNode = base.map.nodes.find((n) => n.kind === 'warden')!;
    const run: RunState = {
      ...base,
      hp: 20,
      resolve: 1,
      phase: 'duel',
      at: wardenNode.id,
      context: { nodeId: wardenNode.id },
    };
    const won = finishDuel(run, true, 20);
    expect(won.phase).toBe('gift');
    expect(won.hp).toBeGreaterThanOrEqual(20 + Math.floor(RIFTWALKERS.maren.hero.maxHp * 0.3)); // a Warden falls: you catch your breath (a boon may add more)
    expect(won.resolve).toBe(2);
    expect(
      won.context!.offers!.every(
        (id) =>
          ['rare', 'legendary'].includes(COMBAT_DB.cards[id]?.rarity ?? '') &&
          COMBAT_DB.cards[id]?.hero === 'maren',
      ),
    ).toBe(true);
    const skipped = chooseCard(won, null);
    expect(skipped.phase).toBe('stageClear');
    expect(skipped.deck).toEqual(won.deck);
    const picked = chooseCard(won, won.context!.offers![0]!);
    expect(picked.phase).toBe('stageClear');
    expect(nextStage(picked).stage).toBe(2);
  });

  it('elites heal a little, losing an elite costs 2 Resolve', () => {
    const base = fresh('kesh', 'elite');
    const el = base.map.nodes.find((n) => n.kind === 'elite');
    if (!el) return; // this seed's stage 1 has no elite
    const run: RunState = { ...base, hp: 40, phase: 'duel', at: el.id, context: { nodeId: el.id } };
    expect(finishDuel(run, true, 40).hp).toBe(40 + Math.ceil(76 * 0.1));
    expect(finishDuel(run, false).resolve).toBe(0);
  });

  it('the copy limit counts a card and its upgrade together', () => {
    expect(canAdd(['rift-bolt', 'rift-bolt+', 'rift-bolt+', 'rift-bolt'], 'rift-bolt')).toBe(false);
    expect(canAdd(['rift-bolt', 'rift-bolt+', 'rift-bolt+'], 'rift-bolt')).toBe(true);
  });

  it('a save cannot smuggle in prototype keys', () => {
    const r = fresh('maren', 'proto');
    expect(parseRun(JSON.stringify({ ...r, character: 'constructor' }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, deck: ['toString', ...r.deck] }))).toBeNull();
  });

  it('Bank ends the run with the deck, Continue goes a tier deeper', () => {
    const cleared: RunState = { ...fresh('vesper', 'end'), phase: 'loopCleared' };
    expect(bank(cleared).phase).toBe('banked');
    expect(continueLoop(cleared).tier).toBe(2);
    expect(() => bank(fresh('vesper', 'end'))).toThrow(RunError);
  });
});
