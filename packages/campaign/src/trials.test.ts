import { describe, expect, it } from 'vitest';
import { clone } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import {
  ELITE_EVENTS,
  availableNodes,
  buildElite,
  cascadeLanes,
  chooseEvent,
  claimTrialPrize,
  enterNode,
  pickEventCard,
  finishTrial,
  settleInterrupted,
  startTrial,
  newRun,
  parseRun,
  serializeRun,
  type RunState,
} from './index';
import { EVENTS } from './events';

const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });

/** a run standing in an elite event built from `spec` */
function eliteRun(i: number, over: Partial<RunState> = {}): RunState {
  const base = open(newRun('knight', `elite-${i}`));
  const node = availableNodes(base)[0]!;
  const run: RunState = {
    ...base,
    hp: 60,
    shards: 200,
    ...over,
    map: {
      ...base.map,
      nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'event' } : n)),
    },
  };
  const entered = enterNode(run, node.id);
  const spec = ELITE_EVENTS[i % ELITE_EVENTS.length]!;
  const ev = buildElite(spec, entered);
  return { ...entered, context: { ...entered.context!, event: ev } };
}

/** the same run with the trial's seed changed to one whose balls land the way the test needs (the lanes are a fair draw from the seed) */
function withLanes(r: RunState, want: (lanes: number[]) => boolean): RunState {
  for (let seed = 1; seed < 400000; seed++) {
    if (!want(cascadeLanes(seed))) continue;
    const trial = { ...r.context!.event!.trial!, seed };
    return { ...r, context: { ...r.context!, event: { ...r.context!.event!, trial } } };
  }
  throw new Error('no seed lands like that');
}
const distinct = (l: number[]): boolean => new Set(l).size === 3;
const pair = (l: number[]): boolean => new Set(l).size === 2;
const triple = (l: number[]): boolean => new Set(l).size === 1;

describe('elite events', () => {
  it('each offers the game or a walk away, with ten prizes already fixed, one for each lane', () => {
    for (let i = 0; i < ELITE_EVENTS.length; i++) {
      const ev = eliteRun(i).context!.event!;
      expect(ev.options.map((o) => o.id)).toEqual(['trial', 'leave']);
      expect(ev.trial!.state).toBe('open');
      expect(ev.trial!.game).toBe('cascade');
      expect(ev.trial!.prizes).toHaveLength(10);
      expect(ev.trial!.prizes.map((p) => p.id)).toEqual(Array.from({ length: 10 }, (_, k) => `p${k}`));
      for (const p of ev.trial!.prizes) {
        expect(p.short?.length).toBeGreaterThan(0);
        expect(p.icon).toBeTruthy();
        if (p.card) expect(COMBAT_DB.cards[p.card]).toBeTruthy();
        if (p.boon) expect(COMBAT_DB.boons[p.boon]).toBeTruthy();
        if (p.potion) expect(COMBAT_DB.potions[p.potion]).toBeTruthy();
      }
    }
  });

  it('the puzzle is not a normal option: the trial must be played, and walking away costs nothing', () => {
    const r = eliteRun(0);
    expect(() => chooseEvent(r, 'trial')).toThrow(/puzzle/);
    const left = chooseEvent(r, 'leave');
    expect(left.phase).toBe('map');
    expect(left.shards).toBe(r.shards);
  });

  it('a game that is not completed pays the consolation and ends the event', () => {
    const r = eliteRun(1);
    const after = finishTrial(startTrial(r), false);
    expect(after.phase).toBe('map');
    expect(after.shards).toBe(r.shards + r.context!.event!.trial!.consolation);
    expect(after.eventResult).toMatch(/shards/);
  });

  it('the lanes the balls land in are the fair draw of the seed, whatever the client says, and you choose one, once', () => {
    for (let i = 0; i < ELITE_EVENTS.length; i++) {
      const r = withLanes(eliteRun(i, { potions: [] }), distinct);
      const lanes = cascadeLanes(r.context!.event!.trial!.seed);
      // the game has to be begun first, and is only played once
      expect(() => finishTrial(r, true)).toThrow();
      const won = finishTrial(startTrial(r), true);
      expect(won.phase).toBe('event');
      const t = won.context!.event!.trial!;
      expect(t.state).toBe('won');
      expect(t.earned).toEqual([...lanes].sort((a, b) => a - b));
      // a prize cannot be taken before it is won, and the game cannot be played twice
      expect(() => claimTrialPrize(r, 'p' + lanes[0])).toThrow();
      expect(() => finishTrial(won, true)).toThrow();
      // a lane no ball landed in was not earned, and nor was a prize that does not exist
      const missed = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].find((k) => !lanes.includes(k))!;
      expect(() => claimTrialPrize(won, 'p' + missed)).toThrow(/not earn/);
      expect(() => claimTrialPrize(won, 'nope')).toThrow();
      const lane = lanes[0]!;
      const prize = t.prizes[lane]!;
      if (prize.choices) continue; // (a choice of cards: see below)
      const done = claimTrialPrize(won, 'p' + lane);
      expect(done.phase).toBe('map');
      // an elite event never tosses the coin
      expect(done.eventFlips).toBeUndefined();
      expect(won.eventFlips).toBeUndefined();
      expect(done.eventResult?.length).toBeGreaterThan(5);
      if (prize.card) expect(done.deck).toContain(prize.card);
      if (prize.boon) expect(done.boons).toContain(prize.boon);
      if (prize.potion) expect(done.potions).toContain(prize.potion);
      expect(() => claimTrialPrize(done, 'p' + lane)).toThrow();
    }
  });

  it('a lane never pays more than twice, so three balls in one lane earn it twice', () => {
    const r = startTrial(withLanes(eliteRun(0), triple));
    const lane = cascadeLanes(r.context!.event!.trial!.seed)[0];
    expect(finishTrial(r, true).context!.event!.trial!.earned).toEqual([lane, lane]);
  });

  it('survives being saved mid-event, both before the trial and after it is won', () => {
    const r = eliteRun(2);
    expect(parseRun(serializeRun(r))?.context?.event?.trial?.state).toBe('open');
    const won = finishTrial(startTrial(r), true);
    const back = parseRun(serializeRun(won));
    expect(back?.context?.event?.trial?.state).toBe('won');
    expect(back?.context?.event?.trial?.prizes).toEqual(won.context!.event!.trial!.prizes);
  });

  it('turn up in about one event in ten', () => {
    let elite = 0;
    const N = 400;
    for (let i = 0; i < N; i++) {
      const base = open(newRun('knight', `rate-${i}`));
      const node = availableNodes(base)[0]!;
      const run = {
        ...base,
        map: {
          ...base.map,
          nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'event' as const } : n)),
        },
      };
      if (enterNode(clone(run), node.id).context?.event?.trial) elite++;
    }
    expect(elite / N).toBeGreaterThan(0.04);
    expect(elite / N).toBeLessThan(0.18);
  }, 60_000);
});

describe('one try only', () => {
  it('begun is begun: it is saved as begun, and cannot be begun or tried again', () => {
    const r = eliteRun(3);
    const begun = startTrial(r);
    expect(begun.context!.event!.trial!.state).toBe('playing');
    expect(() => startTrial(begun)).toThrow();
    expect(parseRun(serializeRun(begun))?.context?.event?.trial?.state).toBe('playing');
  });

  it('a run that comes back while a trial was being played counts it failed, with nothing, and moves on', () => {
    for (let i = 0; i < ELITE_EVENTS.length; i++) {
      const r = eliteRun(i);
      const back = parseRun(serializeRun(startTrial(r)))!;
      const { run, notice } = settleInterrupted(back);
      expect(notice).toMatch(/unfinished/);
      expect(run.phase).toBe('map');
      expect(run.context).toBeNull();
      expect(run.shards).toBe(r.shards);
      expect(run.deck).toEqual(r.deck);
      expect(run.cleared).toContain(r.context!.nodeId);
      // the same trial cannot be reached again
      expect(() => finishTrial(run, true)).toThrow();
    }
  });

  it('leaves every other run alone, including an event not yet begun and a prize not yet taken', () => {
    const r = eliteRun(0);
    expect(settleInterrupted(r).run).toBe(r);
    const won = finishTrial(startTrial(r), true);
    expect(settleInterrupted(won).run).toBe(won);
  });
});

describe('chances are recorded for the coin', () => {
  it('an event that tosses a chance leaves its flips on the run, and the next step clears them', () => {
    // the gambler's bet is an even chance
    const base = open(newRun('knight', 'flips'));
    const node = availableNodes(base)[0]!;
    const run: RunState = {
      ...base,
      shards: 100,
      map: {
        ...base.map,
        nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'event' } : n)),
      },
    };
    let found: RunState | null = null;
    for (let i = 0; i < 400 && !found; i++) {
      const e = enterNode({ ...run, seed: `f-${i}`, rng: newRun('knight', `f-${i}`).rng }, node.id);
      if (e.context?.event?.options.some((o) => o.id === 'bet')) found = e;
    }
    expect(found, 'no gambler in 400 seeds').toBeTruthy();
    const after = chooseEvent(found!, 'bet');
    expect(after.eventFlips).toHaveLength(1);
    expect(after.eventFlips![0]!.pct).toBe(50);
  });
});

describe('the Rift-crossed lane is a choice of three', () => {
  it('offers three different Rift-crossed rares, and takes the one you pick', () => {
    for (let i = 0; i < ELITE_EVENTS.length; i++) {
      const r0 = eliteRun(i);
      const lanes = r0.context!.event!.trial!.prizes.flatMap((p, k) => (p.choices ? [[p, k] as const] : []));
      expect(lanes.length, ELITE_EVENTS[i]!.id).toBeGreaterThan(0);
      const taken = new Set<string>();
      for (const [p] of lanes) {
        expect(p.choices).toHaveLength(3);
        expect(new Set(p.choices).size).toBe(3);
        for (const id of p.choices!) {
          expect(COMBAT_DB.cards[id]!.rarity).toBe('rare');
          expect(COMBAT_DB.cards[id]!.hero).not.toBe('knight');
          // two lanes never offer the same card
          expect(taken.has(id)).toBe(false);
          taken.add(id);
        }
      }
      const [p, k] = lanes[0]!;
      const r = withLanes(r0, (l) => l.includes(k));
      const won = finishTrial(startTrial(r), true);
      // the card has to be picked, and it has to be one of the three
      expect(() => claimTrialPrize(won, p.id)).toThrow(/three/);
      expect(() => claimTrialPrize(won, p.id, 3)).toThrow(/three/);
      const done = claimTrialPrize(won, p.id, 1);
      expect(done.deck).toContain(p.choices![1]);
      expect(done.deck.length).toBe(r.deck.length + 1);
      expect(done.phase).toBe('map');
    }
  });
});

describe('a Rift-crossed rare from an event is a choice of three', () => {
  it('the event lays out three different rares from other classes and waits for the pick', () => {
    const broker = EVENTS.find((e) => e.id === 'rift-broker')!;
    const base = { ...eliteRun(0), phase: 'event' as const };
    const deck = [...base.deck, 'gilded-bastion', 'dawn-smite'];
    const run: RunState = { ...base, deck };
    const ev = broker.build(run);
    const two = ev.options.find((o) => o.label.includes('two cards'))!;
    const withEvent: RunState = { ...run, context: { ...run.context!, event: ev } };
    const waiting = chooseEvent(withEvent, two.id);
    // not over yet: it is waiting for a card to be chosen
    expect(waiting.phase).toBe('event');
    const cards = waiting.context!.event!.choose!.cards;
    expect(cards).toHaveLength(3);
    expect(new Set(cards).size).toBe(3);
    for (const id of cards) {
      expect(COMBAT_DB.cards[id]!.rarity).toBe('rare');
      expect(COMBAT_DB.cards[id]!.hero).not.toBe('knight');
    }
    // nothing else can be chosen meanwhile, and the pick must be one of the three
    expect(() => chooseEvent(waiting, 'leave')).toThrow(/first/);
    expect(() => pickEventCard(waiting, 3)).toThrow();
    // it survives a save
    expect(parseRun(serializeRun(waiting))?.context?.event?.choose?.cards).toEqual(cards);
    const done = pickEventCard(waiting, 2);
    expect(done.phase).toBe('map');
    expect(done.deck).toContain(cards[2]);
    expect(() => pickEventCard(done, 0)).toThrow();
  });
});

describe('a lane that two balls land in pays again, with something different', () => {
  it('has a second prize ready for every lane, of the same kind and not the same card, Boon or potion', () => {
    for (let i = 0; i < ELITE_EVENTS.length; i++) {
      const t = eliteRun(i).context!.event!.trial!;
      expect(t.seconds).toHaveLength(10);
      t.seconds!.forEach((q, lane) => {
        const p = t.prizes[lane]!;
        expect(q.id).toBe("q" + lane);
        // (a purse of shards, a rest or the like can simply come again)
        if (p.card && q.card) expect(q.card).not.toBe(p.card);
        if (p.boon && q.boon) expect(q.boon).not.toBe(p.boon);
        if (p.potion && q.potion) expect(q.potion).not.toBe(p.potion);
        if (p.choices && q.choices) for (const id of q.choices) expect(p.choices).not.toContain(id);
        if (p.card) expect(q.icon === p.icon || q.icon === 'shards').toBe(true);
      });
    }
  });

  it('is only claimable with two balls in the lane, and the first prize still with one', () => {
    const base = eliteRun(0, { potions: [] });
    const twiceRun = withLanes(base, pair);
    const lanes = cascadeLanes(twiceRun.context!.event!.trial!.seed);
    const doubled = lanes.find((l, i) => lanes.indexOf(l) !== i)!;
    const single = lanes.find((l) => l !== doubled)!;
    const twice = finishTrial(startTrial(twiceRun), true);
    const q = twice.context!.event!.trial!.seconds![doubled]!;
    expect(q.deal.length).toBeGreaterThan(0);
    // the doubled lane's second prize is earned; the single lane's is not
    expect(() => claimTrialPrize(twice, 'q' + single)).toThrow(/not earn/);
    if (!q.choices) {
      const done = claimTrialPrize(twice, 'q' + doubled);
      expect(done.phase).toBe('map');
      expect(done.eventResult?.length).toBeGreaterThan(5);
    }
    // the first prize of that lane is still on offer too (unless it is a choice of cards)
    if (!twice.context!.event!.trial!.prizes[doubled]!.choices)
      expect(claimTrialPrize(twice, 'p' + doubled).phase).toBe('map');
    // with no pair, no second prize at all
    const once = finishTrial(startTrial(withLanes(base, distinct)), true);
    for (let k = 0; k < 10; k++) expect(() => claimTrialPrize(once, 'q' + k)).toThrow();
  });

  it('survives a save', () => {
    const won = finishTrial(startTrial(withLanes(eliteRun(1), pair)), true);
    const back = parseRun(serializeRun(won))!;
    expect(back.context!.event!.trial!.earned).toEqual(won.context!.event!.trial!.earned);
    expect(back.context!.event!.trial!.seconds).toEqual(won.context!.event!.trial!.seconds);
  });
});

describe('the Brass Cascade is fair', () => {
  it('every lane is equally likely for every ball: a fair draw, with no lane favoured', () => {
    const N = 40000;
    const count = [0, 1, 2].map(() => Array.from({ length: 10 }, () => 0));
    for (let seed = 0; seed < N; seed++) cascadeLanes(seed).forEach((l, b) => count[b]![l]!++);
    for (const per of count)
      for (const n of per) {
        // (10% of 40000 is 4000, give or take 4 standard deviations: about 4%)
        expect(n / N).toBeGreaterThan(0.092);
        expect(n / N).toBeLessThan(0.108);
      }
  });

  it('the three balls of one trial are drawn independently (a lane can come twice, about 1 time in 4 trials)', () => {
    let withPair = 0;
    const N = 20000;
    for (let seed = 0; seed < N; seed++) if (new Set(cascadeLanes(seed)).size < 3) withPair++;
    // (the chance that three draws of ten are not all different is 1 - 0.9 x 0.8 = 28%)
    expect(withPair / N).toBeGreaterThan(0.25);
    expect(withPair / N).toBeLessThan(0.31);
  });

  it('only one lane is a Legendary card, and where it stands is different from one event to the next', () => {
    const where = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const base = open(newRun('knight', `shuffle-${i}`));
      const node = availableNodes(base)[0]!;
      const run: RunState = {
        ...base,
        map: { ...base.map, nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'event' } : n)) },
      };
      const entered = enterNode(run, node.id);
      const ev = buildElite(ELITE_EVENTS[i % ELITE_EVENTS.length]!, entered);
      const legends = ev.trial!.prizes.flatMap((p, k) =>
        p.card && COMBAT_DB.cards[p.card]?.rarity === 'legendary' ? [k] : [],
      );
      expect(legends.length).toBeLessThanOrEqual(1);
      if (legends[0] !== undefined) where.add(legends[0]);
    }
    // (the Legendary can be in any of the lanes)
    expect(where.size).toBeGreaterThanOrEqual(6);
  });
});
