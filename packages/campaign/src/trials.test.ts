import { describe, expect, it } from 'vitest';
import { clone } from '@sr/combat';
import { COMBAT_DB, V2_DECK_RULES, isSanctified } from '@sr/content/v2';
import {
  ELITE_EVENTS,
  availableNodes,
  buildElite,
  REEL_PRIZES,
  ROLL_COST,
  rollTrial,
  chooseEvent,
  claimTrialPrize,
  enterNode,
  pickEventCard,
  settleInterrupted,
  newRun,
  parseRun,
  serializeRun,
  type RunState,
} from './index';
import { EVENTS } from './events';
import { clone as cloneRun } from '@sr/combat';

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

/** spin until the reel stops on prize `want` (the run is given shards enough to keep paying), returning the run with it on the table */
function spinTo(r: RunState, want: number): RunState {
  let run: RunState = { ...r, shards: 100000 };
  for (let i = 0; i < 400; i++) {
    run = rollTrial(run);
    if (run.context!.event!.trial!.earned![0] === want) return run;
  }
  throw new Error('the reel never stopped on that prize');
}

describe('elite events', () => {
  it('each offers the reel or a walk away, with every prize already fixed, one for each place on the reel', () => {
    for (let i = 0; i < ELITE_EVENTS.length; i++) {
      const ev = eliteRun(i).context!.event!;
      expect(ev.options.map((o) => o.id)).toEqual(['trial', 'leave']);
      expect(ev.trial!.state).toBe('open');
      expect(ev.trial!.game).toBe('reel');
      expect(ev.trial!.prizes).toHaveLength(REEL_PRIZES);
      expect(ev.trial!.prizes.map((p) => p.id)).toEqual(
        Array.from({ length: REEL_PRIZES }, (_, k) => `p${k}`),
      );
      for (const p of ev.trial!.prizes) {
        expect(p.short?.length).toBeGreaterThan(0);
        expect(p.icon).toBeTruthy();
        if (p.card) expect(COMBAT_DB.cards[p.card]).toBeTruthy();
        if (p.boon) expect(COMBAT_DB.boons[p.boon]).toBeTruthy();
        if (p.potion) expect(COMBAT_DB.potions[p.potion]).toBeTruthy();
      }
    }
  });

  it('the reel is not a normal option: it has to be spun, and walking away costs nothing', () => {
    const r = eliteRun(0);
    expect(() => chooseEvent(r, 'trial')).toThrow(/Spin the reel/);
    const left = chooseEvent(r, 'leave');
    expect(left.phase).toBe('map');
    expect(left.shards).toBe(r.shards);
  });

  it('a spin costs shards, and the reel stops on one prize, which can be taken once', () => {
    for (let i = 0; i < ELITE_EVENTS.length; i++) {
      const r = eliteRun(i, { potions: [], shards: 200 });
      const t0 = r.context!.event!.trial!;
      expect(t0.state).toBe('open');
      expect(() => claimTrialPrize(r, 'p0')).toThrow(); // nothing has been spun
      const spun = rollTrial(r);
      expect(spun.shards).toBe(200 - ROLL_COST);
      const t = spun.context!.event!.trial!;
      expect(t.state).toBe('won');
      expect(t.rolls).toBe(1);
      expect(t.earned).toHaveLength(1);
      const lane = t.earned![0]!;
      // only the prize it stopped on can be taken
      const other = (lane + 1) % REEL_PRIZES;
      expect(() => claimTrialPrize(spun, 'p' + other)).toThrow(/did not stop/);
      expect(() => claimTrialPrize(spun, 'nope')).toThrow();
      const prize = t.prizes[lane]!;
      if (prize.choices) continue; // (a choice of cards: see below)
      const done = claimTrialPrize(spun, 'p' + lane);
      expect(done.phase).toBe('map');
      // the spin was paid for and the prize costs nothing more; an elite event never tosses the coin
      expect(done.shards).toBeGreaterThanOrEqual(200 - ROLL_COST);
      expect(done.eventFlips).toBeUndefined();
      expect(done.eventResult?.length).toBeGreaterThan(5);
      if (prize.card) expect(done.deck).toContain(prize.card);
      if (prize.boon) expect(done.boons).toContain(prize.boon);
      if (prize.potion) expect(done.potions).toContain(prize.potion);
      expect(() => claimTrialPrize(done, 'p' + lane)).toThrow();
      expect(() => rollTrial(done)).toThrow();
    }
  });

  it('spinning again lets the prize on the table go, costs again, and never stops on the same prize twice in a row', () => {
    let run = eliteRun(1, { shards: 1000 });
    let last = -1;
    for (let k = 1; k <= 25; k++) {
      run = rollTrial(run);
      const now = run.context!.event!.trial!.earned![0]!;
      expect(now).not.toBe(last);
      last = now;
      expect(run.shards).toBe(1000 - ROLL_COST * k);
      expect(run.context!.event!.trial!.rolls).toBe(k);
    }
  });

  it('cannot spin without the shards, and a prize that was spun away cannot be taken', () => {
    const poor = eliteRun(0, { shards: ROLL_COST - 1 });
    expect(() => rollTrial(poor)).toThrow(/costs/);
    expect(poor.shards).toBe(ROLL_COST - 1);
    const spun = rollTrial(eliteRun(0, { shards: 500, potions: [] }));
    const first = spun.context!.event!.trial!.earned![0]!;
    const again = rollTrial(spun);
    expect(again.context!.event!.trial!.earned![0]).not.toBe(first);
    expect(() => claimTrialPrize(again, 'p' + first)).toThrow(/did not stop/);
    // walking away with a prize on the table forfeits it (the shards are spent)
    const left = chooseEvent(again, 'leave');
    expect(left.phase).toBe('map');
    expect(left.shards).toBe(500 - ROLL_COST * 2);
  });

  it('survives being saved mid-event: and a reload does not give a different spin', () => {
    const r = eliteRun(2, { shards: 500 });
    expect(parseRun(serializeRun(r))?.context?.event?.trial?.state).toBe('open');
    const spun = rollTrial(r);
    const back = parseRun(serializeRun(spun))!;
    expect(back.context?.event?.trial?.state).toBe('won');
    expect(back.context?.event?.trial?.earned).toEqual(spun.context!.event!.trial!.earned);
    expect(back.context?.event?.trial?.prizes).toEqual(spun.context!.event!.trial!.prizes);
    // the stream is saved with the run: spinning the reloaded run gives the same next prize
    expect(rollTrial(back).context!.event!.trial!.earned).toEqual(
      rollTrial(cloneRun(spun)).context!.event!.trial!.earned,
    );
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
          nodes: base.map.nodes.map((n) =>
            n.id === node.id ? { ...n, kind: 'event' as const } : n,
          ),
        },
      };
      if (enterNode(clone(run), node.id).context?.event?.trial) elite++;
    }
    expect(elite / N).toBeGreaterThan(0.04);
    expect(elite / N).toBeLessThan(0.18);
  }, 60_000);
});

describe('a run saved in the middle of the older pegboard game', () => {
  it('counts it failed, with nothing, and moves on', () => {
    for (let i = 0; i < ELITE_EVENTS.length; i++) {
      const r = eliteRun(i);
      const ctx = r.context!;
      const old: RunState = {
        ...r,
        context: {
          ...ctx,
          event: { ...ctx.event!, trial: { ...ctx.event!.trial!, state: 'playing' as const } },
        },
      };
      const back = parseRun(serializeRun(old))!;
      const { run, notice } = settleInterrupted(back);
      expect(notice).toMatch(/unfinished/);
      expect(run.phase).toBe('map');
      expect(run.context).toBeNull();
      expect(run.shards).toBe(r.shards);
      expect(run.deck).toEqual(r.deck);
      expect(run.cleared).toContain(r.context!.nodeId);
    }
  });

  it('leaves every other run alone, including an event not yet spun and a prize on the table', () => {
    const r = eliteRun(0, { shards: 500 });
    expect(settleInterrupted(r).run).toBe(r);
    const spun = rollTrial(r);
    expect(settleInterrupted(spun).run).toBe(spun);
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

describe('the lighter load removes up to two cards you choose', () => {
  const lighter = (r: RunState): number =>
    r.context!.event!.trial!.prizes.findIndex((p) => p.removeUpTo);

  it('is a prize that names no cards until it is taken, and may be taken with none, one or two', () => {
    const r0 = eliteRun(0);
    const k = lighter(r0);
    expect(k).toBeGreaterThanOrEqual(0);
    const p = r0.context!.event!.trial!.prizes[k]!;
    expect(p.removeUpTo).toBe(2);
    expect(p.deal).toEqual([]);
    for (const n of [0, 1, 2]) {
      const won = spinTo(r0, k);
      const cards = won.deck.filter((id) => !isSanctified(id)).slice(0, n);
      const done = claimTrialPrize(won, p.id, undefined, cards);
      expect(done.phase).toBe('map');
      expect(done.deck).toHaveLength(won.deck.length - n);
      expect(done.eventResult?.length).toBeGreaterThan(5);
    }
  });

  it('takes out exactly the cards named, and refuses more than two, a card not in the deck, or a deck that is too small', () => {
    const r0 = eliteRun(0);
    const k = lighter(r0);
    const won = spinTo(r0, k);
    const id = won.deck.find((c) => !isSanctified(c))!;
    const done = claimTrialPrize(won, 'p' + k, undefined, [id]);
    expect(done.deck.filter((c) => c === id)).toHaveLength(
      won.deck.filter((c) => c === id).length - 1,
    );
    expect(() => claimTrialPrize(won, 'p' + k, undefined, [id, id, id])).toThrow(/up to/);
    expect(() => claimTrialPrize(won, 'p' + k, undefined, ['no-such-card'])).toThrow(
      /not in your deck/,
    );
    const small: RunState = { ...won, deck: won.deck.slice(0, V2_DECK_RULES.minSize) };
    expect(() => claimTrialPrize(small, 'p' + k, undefined, [small.deck[0]!])).toThrow(/too small/);
  });
});

describe('the Rift-crossed prize is a choice of three', () => {
  it('offers three different Rift-crossed rares, and takes the one you pick', () => {
    for (let i = 0; i < ELITE_EVENTS.length; i++) {
      const r0 = eliteRun(i);
      const lanes = r0.context!.event!.trial!.prizes.flatMap((p, k) =>
        p.choices ? [[p, k] as const] : [],
      );
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
      const r = r0;
      const won = spinTo(r0, k);
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

describe('the Brass Reel is fair', () => {
  it('every prize is equally likely on a first spin, and a reel never repeats the prize on the table', () => {
    const N = 3000;
    const count = Array.from({ length: REEL_PRIZES }, () => 0);
    const base = eliteRun(0, { shards: 500 });
    for (let i = 0; i < N; i++) {
      const rng = newRun('knight', `spin-${i}`).rng;
      const spun = rollTrial({ ...base, rng });
      count[spun.context!.event!.trial!.earned![0]!]!++;
    }
    for (const n of count) {
      // (an even share of 3000 spins, give or take about 4 standard deviations)
      expect(n / N).toBeGreaterThan(1 / REEL_PRIZES - 0.025);
      expect(n / N).toBeLessThan(1 / REEL_PRIZES + 0.025);
    }
  });

  it('the prizes stand in a different order in almost every event, so no place on the reel is always the same prize', () => {
    const orders = new Set<string>();
    const first = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const ev = eliteRun(i * 3).context!.event!.trial!;
      orders.add(ev.prizes.map((p) => p.icon).join(','));
      first.add(ev.prizes[0]!.icon ?? '');
    }
    expect(orders.size).toBeGreaterThanOrEqual(35);
    expect(first.size).toBeGreaterThanOrEqual(6);
  });

  it('only one lane is a Legendary card, and where it stands is different from one event to the next', () => {
    const where = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const base = open(newRun('knight', `shuffle-${i}`));
      const node = availableNodes(base)[0]!;
      const run: RunState = {
        ...base,
        map: {
          ...base.map,
          nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'event' } : n)),
        },
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
