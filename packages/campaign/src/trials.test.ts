import { describe, expect, it } from 'vitest';
import { clone } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import {
  ELITE_EVENTS,
  availableNodes,
  buildElite,
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

  it('balls that land nowhere pay the consolation and end the event', () => {
    const r = eliteRun(1);
    const after = finishTrial(startTrial(r), true, []);
    expect(after.phase).toBe('map');
    expect(after.shards).toBe(r.shards + r.context!.event!.trial!.consolation);
    expect(after.eventResult).toMatch(/shards/);
  });

  it('the lanes the balls land in are earned, and you choose one of those, once', () => {
    for (let i = 0; i < ELITE_EVENTS.length; i++) {
      const r = eliteRun(i, { potions: [] });
      // the game has to be begun first, and is only played once
      expect(() => finishTrial(r, true, [4])).toThrow();
      const won = finishTrial(startTrial(r), true, [4, 4, 9]);
      expect(won.phase).toBe('event');
      const t = won.context!.event!.trial!;
      expect(t.state).toBe('won');
      // two balls in one lane is that lane twice
      expect(t.earned).toEqual([4, 4, 9]);
      // a prize cannot be taken before it is won, and the game cannot be played twice
      expect(() => claimTrialPrize(r, 'p4')).toThrow();
      expect(() => finishTrial(won, true, [1])).toThrow();
      // a lane no ball landed in was not earned, and nor was a prize that does not exist
      expect(() => claimTrialPrize(won, 'p0')).toThrow(/not earn/);
      expect(() => claimTrialPrize(won, 'nope')).toThrow();
      const prize = t.prizes[9]!;
      const done = claimTrialPrize(won, 'p9');
      expect(done.phase).toBe('map');
      // an elite event never tosses the coin
      expect(done.eventFlips).toBeUndefined();
      expect(won.eventFlips).toBeUndefined();
      expect(done.eventResult?.length).toBeGreaterThan(5);
      if (prize.card) expect(done.deck).toContain(prize.card);
      if (prize.boon) expect(done.boons).toContain(prize.boon);
      if (prize.potion) expect(done.potions).toContain(prize.potion);
      expect(() => claimTrialPrize(done, 'p9')).toThrow();
    }
  });

  it('at most three lanes are earned, and lanes off the board are ignored', () => {
    const r = startTrial(eliteRun(0));
    const won = finishTrial(r, true, [7, 2, 5, 8, 99, -1]);
    expect(won.context!.event!.trial!.earned).toEqual([2, 5, 7]);
    // and a lane never pays more than twice
    const r3 = startTrial(eliteRun(0));
    expect(finishTrial(r3, true, [3, 3, 3]).context!.event!.trial!.earned).toEqual([3, 3]);
  });

  it('survives being saved mid-event, both before the trial and after it is won', () => {
    const r = eliteRun(2);
    expect(parseRun(serializeRun(r))?.context?.event?.trial?.state).toBe('open');
    const won = finishTrial(startTrial(r), true, [3, 6]);
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
    const won = finishTrial(startTrial(r), true, [3]);
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
      const r = eliteRun(i);
      const lanes = r.context!.event!.trial!.prizes.flatMap((p, k) => (p.choices ? [[p, k] as const] : []));
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
      const won = finishTrial(startTrial(r), true, [k]);
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
    const r = eliteRun(0, { potions: [] });
    const once = finishTrial(startTrial(r), true, [4, 9]);
    expect(() => claimTrialPrize(once, 'q4')).toThrow(/not earn/);
    const twice = finishTrial(startTrial(r), true, [4, 4, 9]);
    const q = twice.context!.event!.trial!.seconds![4]!;
    const done = claimTrialPrize(twice, 'q4');
    expect(done.phase).toBe('map');
    expect(done.eventResult?.length).toBeGreaterThan(5);
    expect(q.deal.length).toBeGreaterThan(0);
    // the first prize of that lane is still on offer too
    expect(claimTrialPrize(twice, 'p4').phase).toBe('map');
    expect(() => claimTrialPrize(twice, 'q9')).toThrow(/not earn/);
  });

  it('survives a save', () => {
    const won = finishTrial(startTrial(eliteRun(1)), true, [2, 2, 6]);
    const back = parseRun(serializeRun(won))!;
    expect(back.context!.event!.trial!.earned).toEqual([2, 2, 6]);
    expect(back.context!.event!.trial!.seconds).toEqual(won.context!.event!.trial!.seconds);
  });
});
